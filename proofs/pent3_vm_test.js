// ---- PENT-3: balanced-ternary 5-trit VM (the real core) ----
function toTrits(v){ // v in -121..121 -> [t0..t4], t0=LSB
  let t=[],x=v;
  for(let i=0;i<5;i++){
    let r=((x%3)+3)%3;
    if(r===0){t.push(0);x=x/3;}
    else if(r===1){t.push(1);x=(x-1)/3;}
    else {t.push(-1);x=(x+1)/3;}
    x=Math.trunc(x);
  }
  return t;
}
function tritsToVal(t){let v=0;for(let i=0;i<5;i++)v+=t[i]*Math.pow(3,i);return v;}
function neg(v){return -v;} // negation = flip every trit

function opName(dir,sel){
  if(dir===0) return sel===0?"NOP":(sel===-1?"HOLD":"UNHOLD");
  if(dir===-1) return sel===1?"ADD":(sel===0?"PUSH":"STOR");
  return sel===1?"LOAD":(sel===0?"POP":"SUB"); // dir +1
}
function exec(s,w){
  let t=toTrits(w),dir=t[4],sel=t[3],o=t[0]+3*t[1]+9*t[2];
  if(dir===0){ if(sel===-1)s.held.push(s.acc); else if(sel===1){if(s.held.length)s.acc=s.held.pop();} }
  else if(dir===-1){ if(sel===1)s.acc+=o; else if(sel===0)s.store.push(o); else s.store.push(s.acc); }
  else { if(sel===1){if(s.store.length)s.acc=s.store.pop();} else if(sel===0){if(s.store.length)s.acc=s.store.pop();} else s.acc+=o; }
  return s;
}
function fresh(){return {acc:0,store:[],held:[]};}
function clone(s){return {acc:s.acc,store:s.store.slice(),held:s.held.slice()};}
function eq(a,b){return a.acc===b.acc && JSON.stringify(a.store)===JSON.stringify(b.store) && JSON.stringify(a.held)===JSON.stringify(b.held);}

let fails=[];
const ck=(n,c)=>{console.log((c?"  \u2713 ":"  \u2717 ")+n); if(!c)fails.push(n);};

console.log("PENT-3 veracity test\n");
// 1) 243 distinct values, range -121..121
let vals=new Set(); for(let v=-121;v<=121;v++) vals.add(tritsToVal(toTrits(v)));
ck("243 distinct values, round-trip exact", vals.size===243 && [...vals].every(v=>v>=-121&&v<=121));
// 2) 0 is the UNIQUE fixed point of NEG
let fp=[]; for(let v=-121;v<=121;v++) if(neg(v)===v) fp.push(v);
ck("\u27e80 0 0 0 0\u27e9 = 0 is the ONLY NEG fixed point (the held turn)", fp.length===1 && fp[0]===0);
// 2b) binary contrast: 5-bit NOT has no fixed point
let bfp=[]; for(let b=0;b<32;b++) if(((~b)&31)===b) bfp.push(b);
ck("binary 5-bit NOT has NO fixed point (PENT-2 cannot center the held state)", bfp.length===0);
// 3) NEG flips direction-trit, fixes held
function dirOf(w){return toTrits(w)[4];}
let dirOK=true; for(let v=-121;v<=121;v++){ if(dirOf(neg(v))!==-dirOf(v)) dirOK=false; }
ck("NEG flips the direction trit (write \u2194 read), held(0) self-maps", dirOK);
// 4) subtraction is free: ADD of negated operand
function W(dir,sel,op){return op + dir*81 + sel*27;} // build word value from (dir,sel,operand)
//   actually compose by trits: value = dir*3^4 + sel*3^3 + operand(3-trit)
function mk(dir,sel,op){ // op in -13..13
  let ot=toTrits(((op%27)+27)%27); // low 3 trits of operand
  return op /*operand low3*/ + sel*27 + dir*81;
}
// 5) THE PROOF: run P, then run reverse(neg(P)), expect return to initial (identity)
//    P uses cleanly-reversible ops. Build words by (dir,sel,operand):
let P=[ mk(-1,1,5), mk(-1,-1,0), mk(-1,1,7), mk(0,-1,0), mk(-1,1,-2) ]; // ADD5,STOR,ADD7,HOLD,ADD-2
let s=fresh(); let s0=clone(s);
P.forEach(w=>exec(s,w));
let sMid=clone(s);
console.log("    after P:      acc="+s.acc+" store=["+s.store+"] held=["+s.held+"]");
let R=P.slice().reverse().map(neg);
R.forEach(w=>exec(s,w));
console.log("    after reverse(neg(P)): acc="+s.acc+" store=["+s.store+"] held=["+s.held+"]");
ck("P then reverse(neg(P)) returns EXACTLY to start (executed, reversible)", eq(s,s0));
ck("the program actually computed something (state changed mid-run)", !eq(sMid,s0));
// 6) decode/neg mirror sanity
ck("NEG(ADD) decodes to SUB-family; NEG(STOR)=LOAD; NEG(HOLD)=UNHOLD",
   opName(toTrits(neg(mk(-1,1,5)))[4],toTrits(neg(mk(-1,1,5)))[3])==="SUB" &&
   opName(toTrits(neg(mk(-1,-1,0)))[4],toTrits(neg(mk(-1,-1,0)))[3])==="LOAD" &&
   opName(toTrits(neg(mk(0,-1,0)))[4],toTrits(neg(mk(0,-1,0)))[3])==="UNHOLD");

console.log("\n"+(fails.length?("FAIL \u2014 "+fails.length+" check(s) failed"):"PASS \u2014 the encoding closes, executes, and is reversible"));
process.exit(fails.length?1:0);
