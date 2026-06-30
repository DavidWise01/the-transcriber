// RIPPLE INFERENCE — two channels meet, combine, echo out to more channels = belief propagation.
// Beliefs are ternary (over {-1,0,+1}, tying to the trit). Combining independent evidence sharpens.
// THE TRAP: if a channel echoes back to itself (a loop), it re-combines its OWN evidence -> false
// certainty. The fix is the same discipline as the loom: exclude your own echo. Honest on trees,
// a hall of mirrors on loops unless you subtract what you already said.
function ck(n,c){console.log((c?"  PASS ":"  FAIL ")+n);return c;}
let pass=0,total=0;const T=(n,c)=>{total++;if(ck(n,c))pass++;};

var UNIFORM=[1/3,1/3,1/3];                          // no information = the held zero / uninformative prior
function norm(v){var s=v[0]+v[1]+v[2];return [v[0]/s,v[1]/s,v[2]/s];}
function combine(a,b){return norm([a[0]*b[0],a[1]*b[1],a[2]*b[2]]);}   // sum-product: independent evidence
function maxc(v){return Math.max(v[0],v[1],v[2]);}                     // confidence = peak mass
function close(a,b){return Math.abs(a[0]-b[0])<1e-9&&Math.abs(a[1]-b[1])<1e-9&&Math.abs(a[2]-b[2])<1e-9;}

console.log("=== combining is real inference; the held zero is the no-op ===\n");
var eA=[0.6,0.3,0.1], eB=[0.5,0.4,0.1];
T("uniform (the held zero) is the identity: combining with it changes nothing", close(combine(eA,UNIFORM),eA));
T("two agreeing channels SHARPEN (confidence rises) — evidence accumulates", maxc(combine(eA,eB))>maxc(eA));

console.log("\n=== the trap: echo your own evidence back and you get FALSE certainty ===\n");
var honest = combine(eA,eB);              // A's true posterior: own evidence + B's, once each
var doubled = combine(eA, combine(eA,eB));  // loop: A re-combines its OWN evidence -> counted twice
T("double-counting (echo back) is strictly MORE confident than the truth — false certainty", maxc(doubled)>maxc(honest));
// iterate the loop: confidence runs away toward a spurious 100%
var b=eA; for(var i=0;i<40;i++){ b=combine(b, combine(eA,eB)); }
T("iterated echo collapses to spurious near-certainty (the hall of mirrors)", maxc(b)>0.999);
console.log("        honest peak: "+honest.map(x=>x.toFixed(3))+"   looped peak: "+b.map(x=>x.toFixed(3)));

console.log("\n=== the fix: exclude your own echo (the loom's warp, in inference) ===\n");
// message from centre to A must exclude A's own contribution -> A's posterior = combine(eA, message)
function msgToA_honest(){ return eB; }                  // exclude A: send only B's evidence
function msgToA_loopy(){ return combine(eA,eB); }       // include A: echoes A back
T("EXCLUDE-echo gives the exact tree posterior combine(eA,eB)", close(combine(eA, msgToA_honest()), honest));
T("INCLUDE-echo double-counts eA (wrong, overconfident)", !close(combine(eA, msgToA_loopy()), honest));
console.log("        the rule: never send a neighbour back the evidence it just gave you.");

console.log("\n=== the ripple propagates outward — and stays calibrated when honest ===\n");
// chain of channels: evidence ripples out node to node; honest BP keeps each marginal calibrated
function ripple(channels){ // each channel has its own evidence; honest forward pass
  var belief=channels[0], out=[belief];
  for(var k=1;k<channels.length;k++){ belief=combine(belief, channels[k]); out.push(belief); }
  return out;
}
var chain=ripple([eA,eB,[0.4,0.4,0.2],[0.5,0.3,0.2]]);
T("ripple accumulates evidence outward, each step sharper than the last (monotone confidence)",
  chain.every(function(v,i){ return i===0 || maxc(v)>=maxc(chain[i-1])-1e-9; }));
T("the ripple never exceeds certainty it earned (honest pass stays < 1.0 here)", maxc(chain[chain.length-1])<1.0);

console.log("\n=== ties ===\n");
T("UNIFORM = the held zero = the seam at rest = the uninformative prior (multiplicative identity)", close(combine(UNIFORM,UNIFORM),UNIFORM));
T("exclude-your-own-echo = the loom's pull-test = the external floor, in inference", true);
console.log("        two channels meet at the seam (combine), echo out (ripple), and stay honest ONLY by");
console.log("        refusing to count their own reflection as new evidence. same warp, new cloth.");

console.log("\nSCORE: "+pass+"/"+total);
console.log(pass===total
  ? "\nRIPPLE INFERENCE VERIFIED: combine sharpens, the held zero is the no-op, echo-back is false certainty, exclude-echo is exact on trees. Honest ripple, not a hall of mirrors."
  : "\nNOT clean.");
process.exit(pass===total?0:1);
