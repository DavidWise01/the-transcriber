"""
akasha_ed25519 — pure-Python Ed25519 (RFC 8032), stdlib only.

No third-party dependencies, no pip, nothing to trust but hashlib and integer
math. This is the shared crypto core for the AKASHA witness signature: sign.py
produces a signature with it, verify.py checks one with it. Keeping a single,
small, auditable implementation is deliberate — one thing to read, not two.

Reference implementation per RFC 8032 (Ed25519). Not constant-time; this signs
and verifies one corpus root, not a high-volume service. Correctness over speed.

API:
    seed = keygen()                      -> 32 random bytes (the secret seed)
    pub  = public_from_seed(seed)        -> 32-byte public key
    sig  = sign(seed, message_bytes)     -> 64-byte signature
    ok   = verify(pub, message, sig)     -> bool
"""
import hashlib, os

b = 256
q = 2 ** 255 - 19
L = 2 ** 252 + 27742317777372353535851937790883648493


def _H(m):
    return hashlib.sha512(m).digest()


def _inv(x):
    return pow(x, q - 2, q)


d = (-121665 * _inv(121666)) % q
_I = pow(2, (q - 1) // 4, q)


def _xrecover(y):
    xx = (y * y - 1) * _inv(d * y * y + 1) % q
    x = pow(xx, (q + 3) // 8, q)
    if (x * x - xx) % q != 0:
        x = (x * _I) % q
    if x % 2 != 0:
        x = q - x
    return x


_By = (4 * _inv(5)) % q
_Bx = _xrecover(_By)
B = [_Bx % q, _By % q]


def _edwards(P, Q):
    x1, y1 = P
    x2, y2 = Q
    x3 = (x1 * y2 + x2 * y1) * _inv(1 + d * x1 * x2 * y1 * y2) % q
    y3 = (y1 * y2 + x1 * x2) * _inv(1 - d * x1 * x2 * y1 * y2) % q
    return [x3 % q, y3 % q]


def _scalarmult(P, e):
    if e == 0:
        return [0, 1]
    Q = _scalarmult(P, e // 2)
    Q = _edwards(Q, Q)
    if e & 1:
        Q = _edwards(Q, P)
    return Q


def _encodeint(y):
    return int(y).to_bytes(32, "little")


def _encodepoint(P):
    x, y = P
    bits = (y & ((1 << 255) - 1)) | ((x & 1) << 255)
    return bits.to_bytes(32, "little")


def _bit(h, i):
    return (h[i // 8] >> (i % 8)) & 1


def _Hint(m):
    h = _H(m)
    return sum(2 ** i * _bit(h, i) for i in range(512))


def public_from_seed(seed):
    """32-byte seed -> 32-byte public key."""
    if len(seed) != 32:
        raise ValueError("seed must be 32 bytes")
    h = _H(seed)
    a = 2 ** 254 + sum(2 ** i * _bit(h, i) for i in range(3, 254))
    A = _scalarmult(B, a)
    return _encodepoint(A)


def sign(seed, m):
    """seed (32 bytes), message (bytes) -> 64-byte signature."""
    if len(seed) != 32:
        raise ValueError("seed must be 32 bytes")
    pk = public_from_seed(seed)
    h = _H(seed)
    a = 2 ** 254 + sum(2 ** i * _bit(h, i) for i in range(3, 254))
    r = _Hint(h[32:64] + m)
    R = _scalarmult(B, r)
    S = (r + _Hint(_encodepoint(R) + pk + m) * a) % L
    return _encodepoint(R) + _encodeint(S)


def _isoncurve(P):
    x, y = P
    return (-x * x + y * y - 1 - d * x * x * y * y) % q == 0


def _decodeint(s):
    return int.from_bytes(s, "little")


def _decodepoint(s):
    y = int.from_bytes(s, "little") & ((1 << 255) - 1)
    x = _xrecover(y)
    if (x & 1) != _bit(s, 255):
        x = q - x
    P = [x, y]
    if not _isoncurve(P):
        raise ValueError("point not on curve")
    return P


def verify(pub, m, s):
    """public key (32 bytes), message (bytes), signature (64 bytes) -> bool."""
    if len(s) != 64 or len(pub) != 32:
        return False
    try:
        R = _decodepoint(s[0:32])
        A = _decodepoint(pub)
    except ValueError:
        return False
    S = _decodeint(s[32:64])
    h = _Hint(_encodepoint(R) + pub + m)
    return _scalarmult(B, S) == _edwards(R, _scalarmult(A, h))


def keygen():
    """A fresh 32-byte secret seed."""
    return os.urandom(32)


if __name__ == "__main__":
    # self-test: sign and verify a known message round-trips, tamper fails
    sd = keygen()
    pk = public_from_seed(sd)
    msg = b"AKASHA-witness-v1 self-test"
    sg = sign(sd, msg)
    assert verify(pk, msg, sg) is True, "round-trip failed"
    assert verify(pk, msg + b"x", sg) is False, "tamper not caught"
    bad = bytearray(sg); bad[0] ^= 1
    assert verify(pk, msg, bytes(bad)) is False, "bad sig not caught"
    print("akasha_ed25519 self-test: PASS (round-trip ok, tamper caught)")
