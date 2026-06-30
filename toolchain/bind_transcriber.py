#!/usr/bin/env python3
"""
Bind the transcriber construction under the AKASHA witness key.

The signed construction is the four instruments. The root is the sha256 of their
sorted sha256s; the witness signs that root with Ed25519 (pure stdlib, via
akasha_ed25519). The cover page (transcriber-bound.html) is presentation and is
not part of the root.

Usage:
  python3 bind_transcriber.py           # hash -> root -> sign -> write manifest -> self-verify
  python3 bind_transcriber.py --verify  # re-derive root, check the witness signature
"""
import json, sys, os, hashlib, datetime
sys.path.insert(0, os.path.dirname(os.path.abspath(sys.argv[0])) or ".")
import akasha_ed25519 as ed

BASE = os.path.dirname(os.path.abspath(sys.argv[0])) or "."
DOMAIN = "AKASHA-transcriber-v1"
INSTRUMENTS = [
    ("mechanism", "transcriber-gated.html"),
    ("forecast",  "predictive-smear.html"),
    ("layers",    "four-fold-transcription.html"),
    ("closure",   "two-transcribers.html"),
    ("ground-single", "hydrogen-transcriber.html"),
    ("ground-pair",   "two-atom-transfer.html"),
    ("compound-covalent",      "h2-bond.html"),
    ("compound-ionic",         "nacl-bond.html"),
    ("compound-metallic",      "metallic-bond.html"),
    ("compound-geometry",      "water-geometry.html"),
    ("compound-hybridization", "hybridization.html"),
    ("compound-pi",            "pi-bonds.html"),
    ("compound-hbond",         "hydrogen-bonding.html"),
    ("compound-aromaticity",   "aromaticity.html"),
    ("compound-mo",            "mo-theory.html"),
    ("overlay",                "transcriber-mo-overlay.html"),
    ("machine-emulator",       "pent3-emulator.html"),
    ("machine-hydrogen-trit",  "hydrogen-trit.html"),
    ("machine-hydrogen-vm",    "hydrogen-vm.html"),
    ("switch-v1-halfduplex",   "switch-v1.html"),
    ("switch-v2-fullduplex",   "switch-v2.html"),
    ("generator-carpet",       "ternary-generator.html"),
    ("loom-pull-test",         "the-loom.html"),
    ("ripple-inference",       "ripple-inference.html"),
    ("scaffolding-rule",       "scaffolding.html"),
    ("scaffolding-value",      "value-box.html"),
]
MAN = os.path.join(BASE, "transcriber.manifest.json")
KEY = os.path.join(BASE, "witness.key")
G,R,D,B,A,E = "\033[32m","\033[31m","\033[2m","\033[1m","\033[33m","\033[0m"

def h(path):
    return hashlib.sha256(open(path, encoding="utf-8").read().encode("utf-8")).hexdigest()

def derive_root():
    items = []
    for role, fn in INSTRUMENTS:
        fp = os.path.join(BASE, fn)
        items.append({"role": role, "file": fn, "sha256": h(fp)})
    root = hashlib.sha256("".join(sorted(i["sha256"] for i in items)).encode()).hexdigest()
    return items, root

def msg(root):
    return (DOMAIN + "\nconstruction_root=" + root).encode("ascii")

def do_bind():
    items, root = derive_root()
    seed = bytes.fromhex(open(KEY).read().strip())
    pub = ed.public_from_seed(seed)
    sig = ed.sign(seed, msg(root))
    if not ed.verify(pub, msg(root), sig):
        print(f"{R}{B}ABORT{E} self-verify failed"); return 1
    man = {
        "scheme": "AKASHA-transcriber-bundle",
        "domain": DOMAIN,
        "instruments": items,
        "construction_root": root,
        "cover": {"file": "transcriber-bound.html",
                  "note": "presentation only; not part of the signed root"},
        "signature": {
            "status": "signed", "scheme": "ed25519", "target": "construction_root",
            "signed_root": root, "public_key": pub.hex(), "signature": sig.hex(),
            "signed_at": datetime.datetime.now(datetime.timezone.utc).replace(microsecond=0).isoformat(),
        },
    }
    json.dump(man, open(MAN, "w"), indent=2); open(MAN, "a").write("\n")
    print(f"{B}AKASHA · BIND TRANSCRIBER{E}\n")
    for i in items:
        print(f"  {G}\u2713{E} {i['file']:30} {D}{i['sha256'][:16]}\u2026{E}")
    print(f"\n  construction root  {B}{root}{E}")
    print(f"  witness public key {B}{pub.hex()}{E}")
    print(f"  signature          {D}{sig.hex()[:48]}\u2026{E}")
    print(f"\n{G}{B}BOUND{E} \u2014 the instruments sealed as one; run --verify to confirm")
    return 0

def do_verify(quiet=False):
    M = json.load(open(MAN))
    items, root = derive_root()
    fails = []
    def ck(n, c):
        if not quiet: print("  " + (f"{G}\u2713{E} " if c else f"{R}\u2717{E} ") + n)
        if not c: fails.append(n)
    if not quiet: print(f"{B}AKASHA · VERIFY TRANSCRIPTION BUNDLE{E}\n")
    by = {i["file"]: i["sha256"] for i in items}
    for rec in M["instruments"]:
        live = by.get(rec["file"])
        ck(f'{rec["file"]:30} {(live or "MISSING")[:16]}\u2026', live == rec["sha256"])
    ck(f'construction root ({root[:16]}\u2026)', root == M["construction_root"])
    sig = M["signature"]
    pub = bytes.fromhex(sig["public_key"]); s = bytes.fromhex(sig["signature"])
    ck("signature binds current root", sig["signed_root"] == root)
    ck("witness signature valid (ed25519)", ed.verify(pub, msg(root), s))
    if not quiet:
        print(f'\n  {D}witness public key: {sig["public_key"]}{E}')
        print(f"\n{(R+B+'FAIL'+E) if fails else (G+B+'PASS'+E)} \u2014 " +
              (f"{len(fails)} check(s) failed" if fails else "the construction matches and the witness signed it"))
    return 1 if fails else 0

if __name__ == "__main__":
    if "--verify" in sys.argv: sys.exit(do_verify())
    sys.exit(do_bind())
