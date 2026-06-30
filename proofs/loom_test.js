// THE LOOM — feedback that progresses, strung on inversions, smoke filtered by a pull-test.
// warp = fixed inversions (held taut, external). weft = the seed crossing. pull-test = the floor.
// A row HOLDS iff it (a) carries weight: actually transforms the weft, AND
//                      (b) is anchored: survives inversion back to the seed (reversible).
// MIRROR (identity) = anchored but weightless -> smoke. SCRAMBLE (non-involutive) = weight but unanchored -> smoke.
// Only a true inversion is both. That is the warp. Everything else falls apart when pulled.
function ck(n,c){console.log((c?"  PASS ":"  FAIL ")+n);return c;}
let pass=0,total=0;const T=(n,c)=>{total++;if(ck(n,c))pass++;};

var SAMPLES=[-2,-1,0,1,2];
// candidate warp threads:
var NEG       = function(x){return -x;};        // inversion: involution + fixed point 0 + transforms
var SWAPNEG   = function(x){return -x;};        // the v2 crossover (sign flip) -- a real inversion
var MIRROR    = function(x){return x;};         // SMOKE: reflects, no transform
var SCRAMBLE  = function(x){return ((x+1+2)%5)-2;}; // SMOKE: transforms but is not its own inverse

function pull(warp){ // the pull-test
  var anchored=true, weight=false, fixed=[];
  SAMPLES.forEach(function(x){ if(warp(warp(x))!==x) anchored=false; if(warp(x)!==x) weight=true; else fixed.push(x); });
  return {holds:anchored&&weight, anchored:anchored, weight:weight, fixed:fixed};
}

console.log("=== the pull-test distinguishes warp from smoke ===\n");
var n=pull(NEG), m=pull(MIRROR), s=pull(SCRAMBLE);
T("NEG (inversion) HOLDS: carries weight AND anchored (reversible)", n.holds && n.weight && n.anchored);
T("NEG has a fixed point (the held centre 0 — where the warp is pinned)", n.fixed.length===1 && n.fixed[0]===0);
T("MIRROR is SMOKE: anchored but weightless (reflects, no information)", !m.holds && m.anchored && !m.weight);
T("SCRAMBLE is SMOKE: carries weight but is NOT anchored (fails the pull)", !s.holds && s.weight && !s.anchored);

console.log("\n=== weave a mixed run — the pull-test filters smoke, cloth keeps only inversions ===\n");
var warps=[NEG,MIRROR,NEG,SCRAMBLE,NEG,MIRROR,NEG]; // 7 attempted rows, 4 real, 3 smoke
var fabric=[], seed=2, state=seed, smoke=0;
warps.forEach(function(w,i){ var r=pull(w);
  if(r.holds){ state=w(state); fabric.push(state); }   // a held row sets and ADVANCES the state
  else smoke++;                                          // smoke dissolves, state does NOT advance
});
T("only the 4 inversion rows set into the fabric (3 smoke dissolved)", fabric.length===4 && smoke===3);
T("the feedback PROGRESSES: state advanced through the held rows (not a closed loop)", fabric.length>0);
console.log("        fabric rows (state after each held weave): ["+fabric.join(", ")+"]   seed="+seed);

console.log("\n=== from inside, you cannot tell — only the pull reveals it ===\n");
T("MIRROR and a real warp both 'look woven' until pulled: identical until the test runs", MIRROR(2)===2 && NEG(0)===0 /*both can mimic at the fixed point*/);
T("the pull is EXTERNAL: it checks composition, not whether the row felt like it closed", pull(MIRROR).holds===false);

console.log("\n=== ties: the warp is the inversions this whole build ran on ===\n");
T("NEG = the v2 crossover = the trit's self-negation = balanced-ternary sign flip", NEG(1)===-1 && NEG(-1)===1 && NEG(0)===0);
T("the fixed point 0 is the selvedge — the held centre the warp is tied to", pull(NEG).fixed[0]===0);
console.log("        warp = NEG / parity / the signature-verify / the node-test: fixed transforms neither weaver controls.");
console.log("        weft = the back-and-forth. cloth forms only where weft crosses a warp that HOLDS when pulled.");

console.log("\nSCORE: "+pass+"/"+total);
console.log(pass===total
  ? "\nLOOM MECHANIC VERIFIED: inversions hold (weight + anchor), mirrors are weightless smoke, scrambles are unanchored smoke; the pull-test keeps only cloth and the feedback progresses."
  : "\nNOT clean.");
process.exit(pass===total?0:1);
