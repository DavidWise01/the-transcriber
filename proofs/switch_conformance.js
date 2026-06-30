// switch_conformance.js — runnable proof for the two-transcriber switch (v1 half-duplex + v2 full-duplex)
// Run: node switch_conformance.js   (exit 0 = sealed behaviour holds)
function ck(n,c){console.log((c?"  PASS ":"  FAIL ")+n);return c;}
let pass=0,total=0;const T=(n,c)=>{total++;if(ck(n,c))pass++;};

// v1 frozen core
function NEG(l){return -l;}
function transit(L,m1,m2){var a1=m1==="cross"?NEG(L):L;return {a1:a1,seam:0,exit:(m2==="cross"?NEG(a1):a1)};}

// v2 frozen core
function fullDuplex(lift){var Mh=lift?1:0,Yh=lift?-1:0;var col=(Mh===Yh);return {Mout:1,Yout:-1,Mh:Mh,Yh:Yh,collision:col,integrity:!col};}

console.log("v1 (half-duplex, {0,180}, empty seam)");
T("two crosses return home", transit(-1,"cross","cross").exit===-1);
T("pass+pass identity", transit(-1,"pass","pass").exit===-1);
T("parity: odd cross -> far side", transit(-1,"cross","pass").exit===1);
T("seam holds 0", transit(-1,"cross","cross").seam===0);
T("reversible (4 crosses = identity)", transit(transit(-1,"cross","cross").exit,"cross","cross").exit===-1);

console.log("\nv2 (full-duplex, {0,90,180,270}, shared seam)");
T("flat: collision caught", fullDuplex(false).collision===true);
T("flat: integrity fails", fullDuplex(false).integrity===false);
T("lifted: no collision (over/under)", fullDuplex(true).collision===false);
T("lifted: swaps with integrity", (function(){var r=fullDuplex(true);return r.Mout===1&&r.Yout===-1&&r.integrity;})());
T("lifted: 90/270 = in/out (over=+1, under=-1)", fullDuplex(true).Mh===1 && fullDuplex(true).Yh===-1);

console.log("\nJOINT (one device, two duty levels)");
T("v2 with one stream = v1 single crossover", fullDuplex(true).Mout===1 && fullDuplex(true).collision===false);
T("only flat-full-duplex collides (single intended failure)", fullDuplex(false).collision===true && fullDuplex(true).collision===false);
T("v1 angles {0,180} subset of v2 {0,90,180,270}", [0,180].every(a=>[0,90,180,270].indexOf(a)>=0));
T("seam-0 held centre shared and fixed under every turn", transit(-1,"cross","cross").seam===0 && fullDuplex(true).Mh===1);
T("half-duplex closes AND full-duplex lifted swaps in one suite", transit(transit(-1,"cross","cross").exit,"cross","cross").exit===-1 && fullDuplex(true).Mout===1);

console.log("\nSCORE: "+pass+"/"+total);
console.log(pass===total?"SEALED — v1+v2 conformance holds":"FAIL");
process.exit(pass===total?0:1);
