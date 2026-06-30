// VALUE-IN-THE-BOX — a seed belief echoed; spread (reversible, conserves) holds; echo-as-evidence fabricates.
function ck(n,c){console.log((c?"  PASS ":"  FAIL ")+n);return c;}
let pass=0,total=0;const T=(n,c)=>{total++;if(ck(n,c))pass++;};
function norm(b){var s=b[0]+b[1]+b[2];return [b[0]/s,b[1]/s,b[2]/s];}
function combine(a,b){return norm([a[0]*b[0],a[1]*b[1],a[2]*b[2]]);}
function peak(b){return Math.max(b[0],b[1],b[2]);}
function entropy(b){return -b.reduce(function(s,p){return s+(p>1e-12?p*Math.log(p):0);},0);}
function neg(b){return [b[2],b[1],b[0]];} function rot(b){return [b[2],b[0],b[1]];} function rotI(b){return [b[1],b[2],b[0]];}
var SEED=[0.6,0.3,0.1], U=[1/3,1/3,1/3];
var spread=[SEED,neg(SEED),rot(SEED),rotI(SEED)];
var loud=SEED; for(var i=0;i<6;i++) loud=combine(loud,SEED);

T("spread is distinct (the value moved, not just copied)", new Set(spread.map(b=>b.join(","))).size===4);
T("each echo re-derives to the seed (reversible external inversion) — holds the pull", neg(neg(SEED)).every((x,i)=>Math.abs(x-SEED[i])<1e-12) && rotI(rot(SEED)).every((x,i)=>Math.abs(x-SEED[i])<1e-12));
T("spread CONSERVES information: every echo has the seed's entropy (no echo more certain)", spread.every(b=>Math.abs(entropy(b)-entropy(SEED))<1e-12));
T("echo-as-evidence inflates peak past the seed", peak(loud)>peak(SEED));
T("iterated echo runs to a spurious near-1.0 (false certainty from nothing)", peak(loud)>0.97);
T("echo-as-evidence burns entropy and cannot re-derive the seed (smoke)", entropy(loud)<entropy(SEED));
T("the true posterior from ONE value is the value (combine with held zero = no-op)", Math.abs(peak(combine(SEED,U))-peak(SEED))<1e-12);
console.log("\nSCORE: "+pass+"/"+total);
console.log(pass===total?"VALUE-IN-THE-BOX VERIFIED: reversible spread conserves and re-derives (honest); echo-as-evidence fabricates certainty (smoke). A value cannot witness itself.":"NOT clean");
process.exit(pass===total?0:1);
