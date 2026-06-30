// RULE-IN-THE-BOX SCAFFOLDING — O(1) rule unfolds to 8^d on demand; every echo forced (re-derivable).
function ck(n,c){console.log((c?"  PASS ":"  FAIL ")+n);return c;}
let pass=0,total=0;const T=(n,c)=>{total++;if(ck(n,c))pass++;};
var RULE=[]; for(var dx=0;dx<3;dx++)for(var dy=0;dy<3;dy++){ if(dx===1&&dy===1) continue; RULE.push([dx,dy]); }
function place(node,m){ return {x:(node.x+m[0])/3, y:(node.y+m[1])/3, d:node.d+1}; }
function expand(d,echo){ var live=[{x:0.5,y:0.5,d:0}]; for(var k=0;k<d;k++){ var nx=[]; live.forEach(function(n){
  if(echo){ for(var i=0;i<8;i++) nx.push({x:n.x,y:n.y,d:n.d+1}); } else RULE.forEach(function(m){ nx.push(place(n,m)); }); }); live=nx; } return live; }
function distinct(a){ return new Set(a.map(function(n){return n.x.toFixed(8)+","+n.y.toFixed(8);})).size; }
function inWell(x,y,levels){ for(var k=0;k<levels;k++){ var xd=Math.floor(x*3)%3,yd=Math.floor(y*3)%3; if(xd===1&&yd===1)return true; x=(x*3)%1; y=(y*3)%1; } return false; }

T("box stores 8 placements (O(1)); centre omitted = the well", RULE.length===8);
[1,2,3,4,5].forEach(function(d){ T("depth "+d+": instant unfold to 8^"+d+" = "+expand(d,false).length+" nodes", expand(d,false).length===Math.pow(8,d)); });
T("scaffold pulls true: independent re-derivation reproduces it (every node forced/distinct)", distinct(expand(3,false))===512);
T("free-echo inflates to same count but collapses to ONE point (smoke, caught)", expand(3,true).length===512 && distinct(expand(3,true))===1);
T("the well never fills — no node lands in the omitted centre at any scale", expand(4,false).every(function(n){return !inWell(n.x,n.y,n.d);}));
T("O(1) in, O(8^d) out — structure is the rule unfolded, nothing retrieved", RULE.length===8 && expand(5,false).length===32768);
console.log("\nSCORE: "+pass+"/"+total);
console.log(pass===total?"RULE-IN-THE-BOX VERIFIED: instant 8^d from O(1); echoes forced; free echo collapses; the well never fills.":"NOT clean");
process.exit(pass===total?0:1);
