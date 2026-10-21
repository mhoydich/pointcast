#!/usr/bin/env python3
"""Independent PointCast commitment, signature and state-root verifier (Python 3.9+, stdlib only).

Verifies files offline, or with --devnet fetches a node's blocks over HTTP GET
and verifies them the same way. It replays chain-core's state machine for the
tx kinds in REPLAYED_KINDS and recomputes every header's state root, and names
whatever it cannot check.
"""
import argparse
from dataclasses import dataclass, field
from datetime import datetime, timezone
import hashlib
import http.client
import json
import os
from pathlib import Path
import sys
import threading
import urllib.error
import urllib.parse
import urllib.request

DEVNET_GENESIS = '132faa1c08769a871c53547db3499b6c031459e6606b3c4999ffd0ead0a56f08'
# The published devnet whose genesis DEVNET_GENESIS pins. Only this exact URL
# gets the built-in pin in --devnet mode; any other node needs --genesis.
DEVNET_URL = 'https://pointcast-devnet.mhoydich.workers.dev'
# The chain that URL serves now: devnet-2 since the 2026-10-08 reset (devnet-1, DEVNET_GENESIS,
# is the recording at https://pointcast.xyz/chain/yard/devnet-1/ and the bundled fixtures).
LIVE_DEVNET_GENESIS = 'a720735b473383057ee11e885b2d32e1565470612364f13c0265c1a1c66f4280'
# Every tx kind chain-core knows, by tag (types.rs kind_name; docs/TAGS.md).
TX_TAGS = dict(zip(('publish_block', 'drum_session', 'tap', 'drop_mint', 'transfer', 'register_agent',
                    'set_drum_attestors', 'set_mandate', 'clear_mandate', 'spend_allowance', 'presence_tap',
                    'set_presence_issuers', 'rotate_sequencer', 'seal_capsule', 'open_capsule', 'claim_station',
                    'set_station', 'set_session_key', 'clear_session_key', 'set_controllers',
                    'open_edition', 'edition_mint', 'edition_transfer'), range(1, 24)))
LAUNCH_TX_TAGS = {kind: tag for kind, tag in TX_TAGS.items() if tag >= 14}
SUPPORTED_KINDS = set(TX_TAGS)  # every kind's commitment encoding


class Unsupported(ValueError):
    """A check cannot be completed by this version."""


def digest(*parts):
    return hashlib.blake2b(b''.join(parts), digest_size=32).digest()


def uint(value, size):
    if type(value) is not int or not 0 <= value < 1 << (8 * size):
        raise ValueError('invalid u%d: %r' % (8 * size, value))
    return value.to_bytes(size, 'big')


def blob(value):
    return uint(len(value), 4) + value


def string(value):
    return blob(value.encode('utf-8'))


def unhex(value, size=None):
    if not isinstance(value, str) or len(value) % 2 or any(c not in '0123456789abcdefABCDEF' for c in value):
        raise ValueError('invalid hex')
    result = bytes.fromhex(value)
    if size is not None and len(result) != size:
        raise ValueError('expected %d bytes' % size)
    return result


def sequence(values, encode):
    if not isinstance(values, list):
        raise ValueError('expected array')
    return uint(len(values), 4) + b''.join(encode(v) for v in values)


SCHEMES = {'ed25519': 0, 'secp256k1': 1, 'p256': 2}  # chain-core Scheme as u8


def key_bytes(key):
    """An ed25519 key's 32 bytes; other schemes cannot be verified by this version."""
    if key['scheme'] != 'ed25519':
        raise Unsupported('key scheme: ' + str(key['scheme']))
    return unhex(key['bytes'], 32)


def encoded_key(key):
    """Scheme tag and key bytes as the params encoding commits to them (any scheme)."""
    if key['scheme'] not in SCHEMES:
        raise ValueError('unknown key scheme: ' + str(key['scheme']))
    return uint(SCHEMES[key['scheme']], 1) + blob(key_bytes(key) if key['scheme'] == 'ed25519' else unhex(key['bytes']))


# RFC 8032 Edwards25519 arithmetic in extended coordinates (X,Y,Z,T).
# This is verification only: no secrets, signing or constant-time claim.
P = 2**255 - 19
L = 2**252 + 27742317777372353535851937790883648493
D = -121665 * pow(121666, P - 2, P) % P
SQRT_M1 = pow(2, (P - 1) // 4, P)
IDENTITY = (0, 1, 1, 0)


def point_decode(raw, canonical=True):
    """Decode a compressed Edwards point; off-curve y is always rejected.

    canonical=True also rejects y >= p and a set sign bit on x == 0. With
    canonical=False this accepts what ed25519-dalek's VerifyingKey::from_bytes
    accepts (y reduced mod p, the sign of x == 0 ignored): see decode_key.
    """
    if len(raw) != 32:
        raise ValueError('invalid point length')
    encoded = int.from_bytes(raw, 'little')
    y, sign = encoded & ((1 << 255) - 1), encoded >> 255
    if y >= P:
        if canonical:
            raise ValueError('noncanonical point')
        y -= P
    x2 = (y*y - 1) * pow(D*y*y + 1, P - 2, P) % P
    x = pow(x2, (P + 3) // 8, P)
    if x*x % P != x2:
        x = x * SQRT_M1 % P
    if x*x % P != x2:
        raise ValueError('invalid point')
    if x == 0 and sign and canonical:
        raise ValueError('noncanonical point')
    if x & 1 != sign:
        x = (P - x) % P
    return x, y, 1, x*y % P


def decode_key(raw):
    """An ed25519 public key as chain-core's PublicKey::is_well_formed accepts it.

    That is dalek's VerifyingKey::from_bytes: any on-curve point, including
    noncanonical encodings and small-order (weak) points. A weak key can be
    registered, but verify_strict rejects every signature under it.
    """
    return point_decode(raw, canonical=False)


def point_add(p, q):
    x, y, z, t = p
    u, v, w, s = q
    a = (y-x)*(v-u) % P
    b = (y+x)*(v+u) % P
    c = 2*D*t*s % P
    d = 2*z*w % P
    e, f, g, h = b-a, d-c, d+c, b+a
    return e*f % P, g*h % P, f*g % P, e*h % P


def point_mul(n, p):
    result = IDENTITY
    while n:
        if n & 1:
            result = point_add(result, p)
        p = point_add(p, p)
        n >>= 1
    return result


def point_equal(p, q):
    return (p[0]*q[2] - q[0]*p[2]) % P == 0 and (p[1]*q[2] - q[1]*p[2]) % P == 0


BASE = point_decode(bytes.fromhex('58' + '66'*31))


def ed25519_verify(public_key, message, signature):
    """ed25519-dalek verify_strict, step by step.

    S < L; A decoded as VerifyingKey::from_bytes does (decode_key) and hashed as
    given; R must be canonical, since dalek compares R's bytes with the
    recomputed point's encoding; reject small-order A or R; then the
    cofactorless equation sB == R + H(R || A || M)A.
    """
    if len(signature) != 64:
        return False
    s = int.from_bytes(signature[32:], 'little')
    if s >= L:
        return False
    try:
        a, r = decode_key(public_key), point_decode(signature[:32])
    except ValueError:
        return False
    if any(point_equal(point_mul(8, p), IDENTITY) for p in (a, r)):
        return False
    h = int.from_bytes(hashlib.sha512(signature[:32] + public_key + message).digest(), 'little') % L
    return point_equal(point_mul(s, BASE), point_add(r, point_mul(h, a)))


TZ1, TZ2 = bytes([6, 161, 159]), bytes([6, 161, 161])
B58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'


def checksum(payload):
    return hashlib.sha256(hashlib.sha256(payload).digest()).digest()[:4]


def base58check(payload):
    raw = payload + checksum(payload)
    n, out = int.from_bytes(raw, 'big'), ''
    while n:
        n, digit = divmod(n, 58)
        out = B58[digit] + out
    return '1' * (len(raw) - len(raw.lstrip(b'\0'))) + out


def address(public_key, agent=False, prefix=TZ1):
    """pca1 + Base58Check(BLAKE2b-160(key)) for an agent, else Base58Check(prefix + hash)."""
    payload = hashlib.blake2b(public_key, digest_size=20).digest()
    if agent:
        return 'pca1' + base58check(payload)
    return base58check(prefix + payload)


def passkey_address(public_key):
    """A passkey's pcp1 address: pcp1 + Base58Check(BLAKE2b-160(33-byte P-256 key)) (webauthn.rs)."""
    return 'pcp1' + base58check(hashlib.blake2b(public_key, digest_size=20).digest())


def base58check_decode(text):
    n = 0
    for char in text:
        if char not in B58:
            raise ValueError('invalid base58')
        n = n * 58 + B58.index(char)
    raw = b'\0' * (len(text) - len(text.lstrip('1'))) + n.to_bytes((n.bit_length() + 7) // 8, 'big')
    if len(raw) < 4 or checksum(raw[:-4]) != raw[-4:]:
        raise ValueError('invalid base58 checksum')
    return raw[:-4]


def address_kind(text):
    """chain-core's Address::kind: 'tz1', 'tz2', 'pca1', 'pcp1', or None if not an address."""
    if not isinstance(text, str) or len(text.encode('utf-8')) > 64:
        return None
    try:
        if text.startswith(('pca1', 'pcp1')):
            return text[:4] if len(base58check_decode(text[4:])) == 20 else None
        if not text.startswith(('tz1', 'tz2')):
            return None
        payload = base58check_decode(text)
    except ValueError:
        return None
    if len(payload) == 23 and payload[:3] in (TZ1, TZ2):
        return 'tz1' if payload[:3] == TZ1 else 'tz2'
    return None


def checked_address(text, name):
    if address_kind(text) is None:
        raise ValueError('invalid address in %s' % name)
    return text


def human_address(key):
    """The human address a key controls (PublicKey::tezos_address): tz1, tz2, or a P-256 key's pcp1."""
    if key['scheme'] == 'ed25519':
        return address(key_bytes(key))
    if key['scheme'] == 'secp256k1':
        return address(unhex(key['bytes'], 33), prefix=TZ2)
    if key['scheme'] == 'p256':
        return passkey_address(unhex(key['bytes'], 33))
    return None


# ---------------------------------------------------------------- passkeys
# NIST P-256 ECDSA and the webauthn envelope rules of chain-core's webauthn.rs
# (sig_mode webauthn, scheme p256, launch record 7). Verification only: no
# secrets, signing or constant-time claim. Jacobian coordinates over Python ints.
P256_P = 2**256 - 2**224 + 2**192 + 2**96 - 1
P256_N = 0xffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551
P256_B = 0x5ac635d8aa3a93e7b3ebbd55769886bc651d06b0cc53b0f63bce3c3e27d2604b
P256_G = (0x6b17d1f2e12c4247f8bce6e563a440f277037d812deb33a0f4a13945d898c296,
          0x4fe342e2fe1a7f9b8ee7eb4a7c0f9e162bce33576b315ececbb6406837bf51f5, 1)
P256_HALF_N = P256_N // 2  # a canonical signature has s <= HALF_N (is_low_s)
P256_INFINITY = (1, 1, 0)


def p256_double(p):
    x, y, z = p
    if z == 0 or y == 0:
        return P256_INFINITY
    yy = y * y % P256_P
    s = 4 * x * yy % P256_P
    zz = z * z % P256_P
    m = (3 * x * x - 3 * zz * zz) % P256_P  # a = -3
    x3 = (m * m - 2 * s) % P256_P
    return x3, (m * (s - x3) - 8 * yy * yy) % P256_P, 2 * y * z % P256_P


def p256_add(p, q):
    if p[2] == 0:
        return q
    if q[2] == 0:
        return p
    z1z1, z2z2 = p[2] * p[2] % P256_P, q[2] * q[2] % P256_P
    u1, u2 = p[0] * z2z2 % P256_P, q[0] * z1z1 % P256_P
    s1, s2 = p[1] * z2z2 * q[2] % P256_P, q[1] * z1z1 * p[2] % P256_P
    if u1 == u2:
        return p256_double(p) if s1 == s2 else P256_INFINITY
    h, r = (u2 - u1) % P256_P, (s2 - s1) % P256_P
    hh = h * h % P256_P
    hhh, v = h * hh % P256_P, u1 * hh % P256_P
    x3 = (r * r - hhh - 2 * v) % P256_P
    return x3, (r * (v - x3) - s1 * hhh) % P256_P, h * p[2] * q[2] % P256_P


def p256_mul2(a, p, b, q):
    """a*P + b*Q (Shamir's trick)."""
    pq, result = p256_add(p, q), P256_INFINITY
    for i in range(max(a.bit_length(), b.bit_length()) - 1, -1, -1):
        result = p256_double(result)
        bits = (a >> i & 1, b >> i & 1)
        if bits != (0, 0):
            result = p256_add(result, pq if bits == (1, 1) else p if bits[0] else q)
    return result


def p256_point(raw):
    """A canonical compressed P-256 key (webauthn.rs p256_key): 33 bytes, tag 02/03, x < p, on the curve."""
    if len(raw) != 33 or raw[0] not in (2, 3):
        return None
    x = int.from_bytes(raw[1:], 'big')
    if x >= P256_P:
        return None
    rhs = (x * x * x - 3 * x + P256_B) % P256_P
    y = pow(rhs, (P256_P + 1) // 4, P256_P)
    if y * y % P256_P != rhs or y == 0:
        return None  # y = 0 cannot occur on P-256 (prime order), so neither tag could encode it
    if y & 1 != raw[0] & 1:
        y = P256_P - y
    return x, y, 1


def p256_scalar(raw):
    """A scalar in [1, n-1] from 32 big-endian bytes, or None (webauthn.rs scalar)."""
    value = int.from_bytes(raw, 'big')
    return value if len(raw) == 32 and 0 < value < P256_N else None


def p256_verify_prehash(point, z, rs):
    """ECDSA P-256 over the 32-byte prehash z (SEC1 4.1.4, webauthn.rs verify_prehash). No low-S rule."""
    r, s = p256_scalar(rs[:32]), p256_scalar(rs[32:64])
    if point is None or len(rs) != 64 or r is None or s is None:
        return False
    w = pow(s, P256_N - 2, P256_N)
    e = int.from_bytes(z, 'big') % P256_N
    x, _, zz = p256_mul2(e * w % P256_N, P256_G, r * w % P256_N, point)
    if zz == 0:
        return False  # the identity
    return x * pow(zz * zz, P256_P - 2, P256_P) % P256_P % P256_N == r


def is_low_s(s):
    return int.from_bytes(s, 'big') <= P256_HALF_N


def normalize_low_s(rs):
    """r || s with a high s folded to n - s; None unless r and s are in [1, n-1]."""
    r, s = p256_scalar(rs[:32]), p256_scalar(rs[32:])
    if len(rs) != 64 or r is None or s is None:
        return None
    return rs if s <= P256_HALF_N else rs[:32] + (P256_N - s).to_bytes(32, 'big')


def der_to_rs(der):
    """r || s from strict DER (webauthn.rs der_to_rs): short lengths, minimal integers, r, s in [1, n-1]."""
    if len(der) < 2 or der[0] != 0x30 or der[1] >= 0x80 or len(der) - 2 != der[1]:
        return None
    body, values = der[2:], []
    for _ in range(2):
        if len(body) < 2 or body[0] != 0x02 or body[1] == 0 or body[1] >= 0x80 or len(body) - 2 < body[1]:
            return None
        value, body = body[2:2 + body[1]], body[2 + body[1]:]
        if value[0] & 0x80:
            return None  # negative
        if value[0] == 0:
            if len(value) == 1 or not value[1] & 0x80:
                return None  # non-minimal
            value = value[1:]
        if len(value) > 32:
            return None
        values.append(value.rjust(32, b'\0'))
    rs = values[0] + values[1]
    if body or p256_scalar(rs[:32]) is None or p256_scalar(rs[32:]) is None:
        return None
    return rs


def signature_to_rs(sig):
    """A client's signature (64 raw bytes or DER), low-S (webauthn.rs signature_to_rs)."""
    rs = sig if len(sig) == 64 else der_to_rs(sig)
    return None if rs is None else normalize_low_s(rs)


WEBAUTHN_MIN_AD, WEBAUTHN_MAX_AD, WEBAUTHN_MAX_CDJ = 37, 512, 1024
WEBAUTHN_MAX_ENVELOPE = 64 + 4 + WEBAUTHN_MAX_AD + 4 + WEBAUTHN_MAX_CDJ
WEBAUTHN_MIN_ENVELOPE = 64 + 4 + WEBAUTHN_MIN_AD + 4 + 1
B64URL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'


def envelope_parse(sig):
    """r || s || bytes(authenticatorData) || bytes(clientDataJSON), exactly (Envelope::parse), or None."""
    if not WEBAUTHN_MIN_ENVELOPE <= len(sig) <= WEBAUTHN_MAX_ENVELOPE:
        return None
    rest, parts = sig[64:], []
    for _ in range(2):
        if len(rest) < 4 or len(rest) - 4 < int.from_bytes(rest[:4], 'big'):
            return None
        n = int.from_bytes(rest[:4], 'big')
        parts.append(rest[4:4 + n])
        rest = rest[4 + n:]
    ad, cdj = parts
    if rest or not WEBAUTHN_MIN_AD <= len(ad) <= WEBAUTHN_MAX_AD or not 1 <= len(cdj) <= WEBAUTHN_MAX_CDJ:
        return None
    return sig[:64], ad, cdj


def envelope_from_parts(sig, ad, cdj):
    """The canonical (low-S) envelope from an assertion's parts, or None if it can never verify."""
    rs = signature_to_rs(sig)
    if rs is None:
        return None
    envelope = rs + blob(ad) + blob(cdj)
    return envelope if envelope_parse(envelope) else None


def base64url(data):
    """RFC 4648 section 5 base64url without padding."""
    out = ''
    for i in range(0, len(data), 3):
        chunk = data[i:i + 3]
        n = int.from_bytes(chunk.ljust(3, b'\0'), 'big')
        out += ''.join(B64URL[n >> (18 - 6 * j) & 63] for j in range(len(chunk) + 1))
    return out


def base64url_decode(text):
    """Strict base64url (webauthn.rs base64url_decode): padding only as a whole final group, zero unused bits."""
    stripped = text.rstrip('=')
    pads = len(text) - len(stripped)
    if pads and (len(text) % 4 or pads > 2) or len(stripped) % 4 == 1:
        return None
    out = b''
    for i in range(0, len(stripped), 4):
        chunk, n = stripped[i:i + 4], 0
        for j, char in enumerate(chunk):
            if char not in B64URL:
                return None
            n |= B64URL.index(char) << (18 - 6 * j)
        if n & {2: 0xFFFF, 3: 0xFF}.get(len(chunk), 0):
            return None
        out += n.to_bytes(3, 'big')[:len(chunk) - 1]
    return out


CDJ_HEAD = b'{"type":"webauthn.get","challenge":"'
CDJ_ORIGIN = b'","origin":"'
CDJ_CROSS_FALSE = b',"crossOrigin":false'
CDJ_HEAD_KEYS = (b'"type"', b'"challenge"', b'"origin"', b'"crossOrigin"')


def names_key(json_bytes, key):
    """Is the quoted name key used as a key: followed, after JSON whitespace, by ':'?"""
    start = json_bytes.find(key)
    while start >= 0:
        if json_bytes[start + len(key):].lstrip(b' \t\n\r')[:1] == b':':
            return True
        start = json_bytes.find(key, start + 1)
    return False


def cdj_tail_ok(tail):
    if tail == b'}':
        return True
    if not tail.startswith(CDJ_CROSS_FALSE):
        return False
    tail = tail[len(CDJ_CROSS_FALSE):]
    if tail == b'}':
        return True
    if not tail.startswith(b','):
        return False
    more = tail[1:]
    return (more[:1] == b'"' and more[-1:] == b'}' and b'\\' not in more and more.count(b'"') % 2 == 0
            and not any(names_key(more, key) for key in CDJ_HEAD_KEYS))


def client_data_origin(cdj, challenge):
    """The origin a clientDataJSON names for this challenge (webauthn.rs client_data_origin), or None."""
    head = CDJ_HEAD + base64url(challenge).encode('ascii') + CDJ_ORIGIN
    if not cdj.startswith(head):
        return None
    rest = cdj[len(head):]
    end = rest.find(b'"')
    if end < 0:
        return None
    origin = rest[:end]
    if not origin or b'\\' in origin or not cdj_tail_ok(rest[end + 1:]) or b'"crossOrigin":true' in cdj:
        return None
    return origin


def webauthn_verify(key, challenge, sig, record):
    """chain-core's webauthn::verify_for: record 7's RP ID and origins, then steps 1-6 of webauthn.rs."""
    env = envelope_parse(sig) if record is not None else None
    if env is None or key.get('scheme') != 'p256':
        return False
    rs, ad, cdj = env
    origin = client_data_origin(cdj, challenge)
    if ad[:32] != hashlib.sha256(record['rp_id'].encode('utf-8')).digest() or origin is None \
            or origin not in [o.encode('utf-8') for o in record['origins']]:
        return False
    if not is_low_s(rs[32:]) or ad[32] & 0x05 != 0x05:  # UP and UV
        return False
    prehash = hashlib.sha256(ad + hashlib.sha256(cdj).digest()).digest()
    return p256_verify_prehash(p256_point(unhex(key['bytes'])), prehash, rs)


def webauthn_wire_signature(stx):
    """A webauthn tx's canonical envelope from its JSON (types.rs webauthn_wire_signature).

    Its envelope hex (a high S folded to low), or its assertion parts
    (`webauthn`: base64url authenticatorData, clientDataJSON, DER or raw
    signature). An envelope that does not parse is kept as given: it never verifies.
    """
    signature, parts = stx.get('signature'), stx.get('webauthn')
    if (signature is None) == (parts is None):
        raise ValueError('a webauthn tx gives signature (the envelope) or webauthn (its parts), not both or neither')
    if parts is not None:
        decoded = []
        for name in ('signature', 'authenticatorData', 'clientDataJSON'):
            text = parts[name]
            if not isinstance(text, str) or len(text) > 2 * WEBAUTHN_MAX_CDJ:
                raise ValueError('webauthn.%s: too long or not a string' % name)
            value = base64url_decode(text)
            if value is None:
                raise ValueError('webauthn.%s: not base64url' % name)
            decoded.append(value)
        envelope = envelope_from_parts(*decoded)
        if envelope is None:
            raise ValueError('webauthn: not an assertion the chain can verify')
        return envelope
    if not isinstance(signature, str) or len(signature) > 2 * WEBAUTHN_MAX_ENVELOPE:
        raise ValueError('signature: longer than any webauthn envelope')
    raw = unhex(signature)
    env = envelope_parse(raw)
    canonical = env and envelope_from_parts(*env)
    return canonical or raw


def wire_signature(stx):
    """The signature bytes a SignedTx carries, as chain-core parses its JSON."""
    if stx.get('sig_mode', 'raw') == 'webauthn':
        return webauthn_wire_signature(stx)
    if stx.get('webauthn') is not None:
        raise ValueError('webauthn (an assertion\'s parts) is for sig_mode webauthn only')
    return wire_sig64(stx['signature'])


def params_hash(p):
    encoded = string(p['chain_id']) + encoded_key(p['sequencer']) + string(p['genesis_treasury'])
    fields = [('genesis_treasury_amount', 8), ('tap_reward', 8), ('tap_window_blocks', 8),
              ('taps_per_window', 4), ('drum_reward_per_10s', 8), ('drum_session_cap_per_player', 8),
              ('drum_max_duration_secs', 4), ('drum_max_players', 4), ('epoch_blocks', 8),
              ('account_epoch_cap', 8), ('block_issuance_cap', 8), ('max_supply', 8),
              ('max_drop_supply', 4), ('max_agents_per_owner', 4), ('max_txs_per_block', 4),
              ('anchor_interval', 8)]
    encoded += b''.join(uint(p[name], size) for name, size in fields)
    encoded += uint({'open': 0, 'cosign': 1, 'room_only': 2}[p['drum_attest_policy']], 1)
    encoded += uint(p['drum_attest_max_age_ms'], 8) + uint(p['drum_clock_skew_ms'], 8)
    encoded += string(p['drum_attestor_admin']) + sequence(p['drum_attestors_genesis'], lambda k: blob(unhex(k, 32)))
    launch = p.get('launch')
    if launch is not None:
        unknown = [k for k, v in launch.items() if v is not None and k not in ('presence', 'keys', 'accounts', 'webauthn', 'editions', 'stations')]
        if unknown:
            raise Unsupported('params launch records: ' + ', '.join(sorted(unknown)))
        records = []
        if launch.get('presence') is not None:
            pp = launch['presence']
            record = uint({'open': 0, 'ticketed': 1}[pp['tap_policy']], 1)
            for name, size in [('presence_reward', 8), ('slot_blocks', 8), ('grace_slots', 1), ('issuer_slot_cap', 4), ('bind_epochs', 8)]:
                record += uint(pp[name], size)
            record += string(pp['admin']) + sequence(pp['issuers_genesis'], lambda k: blob(unhex(k, 32)))
            records.append(b'\1' + blob(record))
        for name, tag in (('keys', 2), ('accounts', 6), ('webauthn', 7), ('editions', 8), ('stations', 13)):
            r = launch.get(name)
            if r is None:
                continue
            if name == 'keys':
                record = string(r['sequencer_admin']) + uint(r['rotation_delay_blocks'], 8) + uint(r['wallet_text_version'], 1)
            elif name == 'accounts':
                record = numbers(r, [('session_max_blocks', 8), ('max_session_keys', 4), ('max_controllers', 4), ('session_kinds', 8)])
            elif name == 'webauthn':
                record = string(r['rp_id']) + sequence(r['origins'], string) + uint(r['max_webauthn_txs_per_block'], 4)
            elif name == 'editions':
                record = string(r['admin']) + numbers(r, [(k, 4) for k in ('max_open', 'max_supply', 'max_recipe_len', 'royalty_bps_max')])
            else:
                record = sequence(r['house_codes'], string) + numbers(r, [('max_unopened', 4), ('max_delay_blocks', 8),
                    ('max_stations', 4), ('max_capsules', 4), ('max_account_stations', 4)])
            records.append(uint(tag, 1) + blob(record))
        encoded += b'\xf0' + uint(len(records), 4) + b''.join(records)
    return digest(b'pointcast-chain/params/v2' if launch is not None else b'pointcast-chain/params/v1', encoded)


def numbers(obj, fields):
    return b''.join(uint(obj[name], size) for name, size in fields)


def optional(value, encode):
    return b'\0' if value is None else b'\1' + encode(value)


def hex_blob(value):
    return blob(unhex(value))


def hash32(value):
    return unhex(value, 32)


def edition_bytes(t):
    if type(t['transferable']) is not bool:
        raise ValueError('transferable must be boolean')
    return (string(t['id']) + string(t['title']) + string(checked_address(t['creator'], 'creator'))
            + numbers(t, [('supply', 4), ('per_account', 4), ('opens_at', 8), ('closes_at', 8)])
            + optional(t.get('attestor'), hex_blob) + uint(int(t['transferable']), 1)
            + numbers(t, [('royalty_bps', 4), ('recipe_schema', 1), ('unique_key_len', 1)])
            + hash32(t['renderer_hash']) + optional(t.get('l1_ref'), string))


def launch_tx_bytes(t):
    kind = t['type']
    if kind == 'seal_capsule':
        payload = string(t['channel']) + hash32(t['commitment']) + uint(t['open_at'], 8) + string(t['label'])
    elif kind == 'open_capsule':
        payload = hash32(t['capsule']) + hex_blob(t['salt']) + string(t['title']) + hash32(t['body_hash']) + optional(t.get('media_uri'), string)
    elif kind == 'claim_station':
        payload = string(t['code']) + string(t['name']) + uint({'open': 0, 'crew': 1}[t['mode']], 1) + optional(t.get('pid'), hash32)
    elif kind == 'set_station':
        payload = (string(t['code']) + sequence(t.get('crew', []), lambda a: string(checked_address(a, 'crew')))
                   + optional(t.get('pinned'), hash32) + optional(t.get('owner_to'), lambda a: string(checked_address(a, 'owner_to'))))
    elif kind == 'set_session_key':
        payload = hex_blob(t['key']) + string(t['label']) + mandate_bytes(t['terms'])
    elif kind == 'clear_session_key':
        payload = hex_blob(t['key'])
    elif kind == 'set_controllers':
        if any(isinstance(k, str) for k in t['controllers']):
            raise Unsupported('base58 controller keys')
        payload = sequence(t['controllers'], encoded_key)
    elif kind == 'open_edition':
        payload = edition_bytes(t['terms'])
    elif kind == 'edition_mint':
        payload = (string(t['edition']) + string(checked_address(t['recipient'], 'recipient')) + hex_blob(t['recipe'])
                   + uint(t['approval_expires'], 8) + hex_blob(t['approval']))
    else:  # edition_transfer
        payload = string(t['edition']) + uint(t['serial'], 4) + string(checked_address(t['to'], 'to'))
    return uint(LAUNCH_TX_TAGS[kind], 1) + payload


SIG_MODES = {'raw': 0, 'tezos_message': 1, 'webauthn': 2}  # chain-core SigMode as u8


def wire_key(key):
    """A {scheme, bytes} key object; a Tezos base58 key string cannot be decoded by this version."""
    if isinstance(key, str):
        raise Unsupported('base58 keys (edpk/sppk/p2pk)')
    return key


def wire_sig64(text):
    """A 64-byte signature given as 128 hex characters (types.rs decode_signature); base58 is unsupported."""
    if isinstance(text, str) and len(text) == 128:
        return unhex(text)
    if isinstance(text, str) and text.startswith(('edsig', 'spsig1', 'sig')):
        raise Unsupported('base58 signatures (edsig/spsig1/sig)')
    raise ValueError('signature: expected 128 hex characters')


def cosig_bytes(c):
    key = wire_key(c['public_key'])
    return (string(checked_address(c['player'], 'cosigs.player')) + encoded_key(key)
            + uint(SIG_MODES[c.get('mode', 'raw')], 1) + blob(wire_sig64(c['signature'])))


def room_sig_bytes(r):
    if r is None:
        return b'\0'
    if r['attestor'].startswith('edpk'):
        raise Unsupported('base58 keys (edpk/sppk/p2pk)')
    return b'\1' + hex_blob(r['attestor']) + blob(wire_sig64(r['signature']))


def classic_tx_bytes(t):
    """Tags 1-13 (types.rs TxKind::encode)."""
    kind = t['type']
    if kind == 'publish_block':
        payload = string(t['channel']) + string(t['title']) + hash32(t['body_hash']) + optional(t.get('media_uri'), string)
    elif kind == 'drum_session':
        payload = (string(t['room']) + sequence(t['players'], lambda a: string(checked_address(a, 'players')))
                   + hash32(t['beat_hash']) + uint(t['duration'], 4) + uint(t['ended_at_ms'], 8)
                   + sequence(t.get('cosigs', []), cosig_bytes) + room_sig_bytes(t.get('room_sig')))
    elif kind == 'tap':
        payload = string(t['room'])
    elif kind == 'drop_mint':
        payload = string(t['drop_id']) + string(checked_address(t['recipient'], 'recipient'))
    elif kind in ('transfer', 'spend_allowance'):
        payload = string(checked_address(t['to'], 'to')) + uint(t['amount'], 8)
    elif kind == 'register_agent':
        payload = blob(unhex(t['public_key'], 32)) + string(t['name'])
    elif kind in ('set_drum_attestors', 'set_presence_issuers'):
        payload = sequence(t['attestors' if kind == 'set_drum_attestors' else 'issuers'], hex_blob)
    elif kind == 'set_mandate':
        payload = string(checked_address(t['agent'], 'agent')) + mandate_bytes(t['terms'])
    elif kind == 'clear_mandate':
        payload = string(checked_address(t['agent'], 'agent'))
    elif kind == 'presence_tap':
        ticket = t['ticket']
        payload = (string(t['room']) + hex_blob(ticket['issuer']) + hash32(ticket['pid'])
                   + uint(ticket['slot'], 8) + hex_blob(ticket['sig']))
    else:  # rotate_sequencer
        payload = hex_blob(t['new_key']) + uint(t['activate_at'], 8)
    return uint(TX_TAGS[kind], 1) + payload


def mandate_bytes(t):
    kinds = t['kinds']
    uint(kinds, 8)
    low, high = kinds & 65535, kinds >> 16
    encoded = uint(low | (1 if high else 0), 2)
    if low & 1 or high:
        encoded += uint(high | ((1 << 63) if low & 1 else 0), 8)
    # channels, rooms and payees are #[serde(default)]: a missing list is empty.
    encoded += sequence(t.get('channels', []), string) + sequence(t.get('rooms', []), string)
    encoded += b''.join(uint(t[k], 8) for k in ('spend_per_period', 'period_blocks', 'spend_total'))
    return encoded + sequence(t.get('payees', []), lambda a: string(checked_address(a, 'payees'))) + uint(t['expires_at'], 8)


def tx_bytes(t):
    kind = t['type']
    if kind not in SUPPORTED_KINDS:
        raise Unsupported('tx kind: ' + str(kind))
    encoded = string(t['sender']) + uint(t['nonce'], 8)
    return encoded + (launch_tx_bytes(t) if kind in LAUNCH_TX_TAGS else classic_tx_bytes(t))


def tx_hash(stx):
    mode = stx.get('sig_mode', 'raw')
    if mode not in SIG_MODES:
        raise Unsupported('sig_mode: ' + str(mode))
    encoded = tx_bytes(stx['tx']) + encoded_key(stx['public_key']) + blob(wire_signature(stx))
    encoded += {'raw': b'', 'tezos_message': b'\1', 'webauthn': b'\2'}[mode]
    return digest(b'pointcast-chain/txid/v1', encoded)


def signing_hash(params, genesis, t):
    """Tx::signing_hash: what raw signers sign and what a passkey's clientDataJSON carries as its challenge."""
    return digest(b'pointcast-chain/tx/v2', string(params['chain_id']), genesis, tx_bytes(t))


def merkle_root(txids):
    level = [digest(b'\0', txid) for txid in txids]
    if not level:
        return digest(b'pointcast-chain/merkle/empty')
    while len(level) > 1:
        level = [digest(b'\1', level[i], level[i+1]) if i+1 < len(level) else level[i]
                 for i in range(0, len(level), 2)]
    return level[0]


def header_hash(h):
    return digest(b'pointcast-chain/header/v1', uint(h['height'], 8), unhex(h['prev_hash'], 32),
                  uint(h['timestamp'], 8), unhex(h['tx_root'], 32), unhex(h['state_root'], 32))


def merkle_leaf(data):
    return digest(b'\0', data)


def leaves_root(leaves):
    """merkle.rs root over already-hashed leaves (merkle_root hashes txids into leaves itself)."""
    if not leaves:
        return digest(b'pointcast-chain/merkle/empty')
    level = list(leaves)
    while len(level) > 1:
        level = [digest(b'\1', level[i], level[i+1]) if i+1 < len(level) else level[i]
                 for i in range(0, len(level), 2)]
    return level[0]


# ---------------------------------------------------------------- state replay
# A replay of chain-core's state machine (state.rs apply_tx and the module
# roots in state.rs, presence.rs, capsule.rs, station.rs and edition.rs) for
# the tx kinds in REPLAYED_KINDS, so each header's state root can be
# recomputed. Any other kind stops the replay: every later state root is then
# reported as not checked, by name. Integers stay within chain-core's u32/u64
# by the same checks chain-core makes; nothing here signs or sends anything.
REPLAYED_KINDS = frozenset(('publish_block', 'tap', 'drop_mint', 'transfer', 'register_agent', 'set_drum_attestors',
                            'set_mandate', 'clear_mandate', 'spend_allowance', 'presence_tap', 'set_presence_issuers',
                            'seal_capsule', 'open_capsule', 'claim_station', 'set_station',
                            'open_edition', 'edition_mint', 'edition_transfer'))
U64_MAX = (1 << 64) - 1
MAX_CHANNEL_LEN, MAX_TITLE_LEN, MAX_URI_LEN, MAX_ROOM_LEN, MAX_DROP_ID_LEN, MAX_AGENT_NAME_LEN = 16, 200, 512, 64, 64, 32
# Delegable mandate kind bits (mandate.rs): tags 1-7 and 10, plus 22-23 with
# launch record 8 and 14-15 with launch record 13.
DELEGABLE_KINDS = 0b0000_0100_1111_1110
# Unicode general category Cf as chain-core lists it (keys.rs FORMAT_CHARS, Unicode 16).
FORMAT_CHARS = ((0x00AD, 0x00AD), (0x0600, 0x0605), (0x061C, 0x061C), (0x06DD, 0x06DD), (0x070F, 0x070F),
                (0x0890, 0x0891), (0x08E2, 0x08E2), (0x180E, 0x180E), (0x200B, 0x200F), (0x202A, 0x202E),
                (0x2060, 0x2064), (0x2066, 0x206F), (0xFEFF, 0xFEFF), (0xFFF9, 0xFFFB), (0x110BD, 0x110BD),
                (0x110CD, 0x110CD), (0x13430, 0x1343F), (0x1BCA0, 0x1BCA3), (0x1D173, 0x1D17A),
                (0xE0001, 0xE0001), (0xE0020, 0xE007F))
RECIPE_FIELDS = ('body', 'accessory', 'head', 'glasses', 'background', 'pattern', 'font', 'ink', 'layout')
RECIPE_FIELD_MAX = (29, 142, 253, 22, 15, 15, 7, 15, 3)
RECIPE_CHARSET = b'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 !?&\'.,#-'
CAPSULE_PRUNE_PER_TX = 8


class Rejected(Exception):
    """chain-core's state machine refuses this tx (a TxError), so no valid block can carry it."""


class NotReplayed(Exception):
    """This version cannot replay what follows; state roots from here on are not checked."""


def reject(field, reason):
    raise Rejected('invalid %s: %s' % (field, reason))


def utf8_len(text):
    return len(text.encode('utf-8'))


def check_text(field, text, limit):
    """state.rs check_text: 1..=limit UTF-8 bytes, no control characters (Unicode Cc)."""
    if not isinstance(text, str):
        raise ValueError('%s: expected a string' % field)
    if not text:
        reject(field, 'empty')
    if utf8_len(text) > limit:
        reject(field, 'too long')
    if any(ord(c) < 0x20 or 0x7f <= ord(c) <= 0x9f for c in text):
        reject(field, 'control characters')


def check_slug(field, text, limit):
    check_text(field, text, limit)
    if any(not ('a' <= c <= 'z' or '0' <= c <= '9' or c in '-_') for c in text):
        reject(field, 'must be [a-z0-9_-]')


def check_channel(field, text):
    check_text(field, text, MAX_CHANNEL_LEN)
    if any(not ('A' <= c <= 'Z' or '0' <= c <= '9') for c in text):
        reject(field, 'must be [A-Z0-9]')


def check_plain(field, text, limit):
    """keys.rs check_plain: check_text and no format characters (Cf)."""
    check_text(field, text, limit)
    if any(lo <= ord(c) <= hi for c in text for lo, hi in FORMAT_CHARS):
        reject(field, 'format characters (Unicode Cf: bidi, zero-width, tags)')


def check_printable(field, text, limit):
    """edition.rs check_printable: printable ASCII, 1..=limit bytes."""
    if not isinstance(text, str):
        raise ValueError('%s: expected a string' % field)
    if not text:
        reject(field, 'empty')
    if utf8_len(text) > limit:
        reject(field, 'too long')
    if any(not ' ' <= c <= '~' for c in text):
        reject(field, 'must be printable ASCII')


def check_post(title, media_uri):
    check_text('title', title, MAX_TITLE_LEN)
    if media_uri is not None:
        check_text('media_uri', media_uri, MAX_URI_LEN)
        if ':' not in media_uri:
            reject('media_uri', 'must be a URI with a scheme')


def is_human(addr):
    return address_kind(addr) in ('tz1', 'tz2', 'pcp1')


def well_formed_ed25519(raw):
    try:
        return len(raw) == 32 and decode_key(raw) is not None
    except ValueError:
        return False


def valid_key_set(keys):
    """params.rs valid_attestor_set: strictly ascending, at most 16, every one an ed25519 point."""
    return len(keys) <= 16 and all(a < b for a, b in zip(keys, keys[1:])) and all(map(well_formed_ed25519, keys))


def recipe_rule(recipe):
    """recipe.rs RecipeV1::decode: the first rule a recipe_v1 fails, or None."""
    if len(recipe) < 14:
        return 'recipe/truncated'
    if recipe[0] != 1:
        return 'version/version'
    for i, name in enumerate(RECIPE_FIELDS):
        if recipe[1 + i] > RECIPE_FIELD_MAX[i]:
            return name + '/range'
    length = int.from_bytes(recipe[10:14], 'big')
    if not 1 <= length <= 24:
        return 'text/length'
    if len(recipe) - 14 != length:
        return 'recipe/' + ('truncated' if len(recipe) - 14 < length else 'trailing')
    text = recipe[14:]
    if any(b not in RECIPE_CHARSET for b in text):
        return 'text/charset'
    if text[:1] == b' ' or text[-1:] == b' ' or b'  ' in text:
        return 'text/spacing'
    if b'HTTP' in text or b'WWW' in text:
        return 'text/url'
    if any(text[i] == 0x2e and 0x41 <= text[i+1] <= 0x5a and 0x41 <= text[i+2] <= 0x5a for i in range(len(text) - 2)):
        return 'text/tld'  # /\.[A-Z]{2,}/
    run = 0
    for b in text:
        run = run + 1 if 0x30 <= b <= 0x39 else 0
        if run >= 7:
            return 'text/digits'
    return None


class Account:
    __slots__ = ('address', 'agent', 'balance', 'nonce', 'posts', 'drum_sessions', 'taps', 'agents', 'tap_window',
                 'taps_in_window', 'epoch', 'issued_in_epoch', 'drum_until_ms', 'drops')

    def __init__(self, addr, agent=None):
        self.address, self.agent = addr, agent  # agent: (owner, name, public key bytes) or None for a human
        self.balance = self.nonce = self.posts = self.drum_sessions = self.taps = self.agents = 0
        self.tap_window = self.taps_in_window = self.epoch = self.issued_in_epoch = self.drum_until_ms = 0
        self.drops = {}

    def encode(self):
        kind = b'\0' if self.agent is None else b'\1' + string(self.agent[0]) + string(self.agent[1]) + blob(self.agent[2])
        return (string(self.address) + kind + b''.join(uint(v, 8) for v in (self.balance, self.nonce, self.posts,
                self.drum_sessions, self.taps)) + uint(self.agents, 4) + uint(self.tap_window, 8)
                + uint(self.taps_in_window, 4) + uint(self.epoch, 8) + uint(self.issued_in_epoch, 8)
                + uint(self.drum_until_ms, 8) + sequence(sorted(self.drops.items()), lambda d: string(d[0]) + uint(d[1], 4)))


class BlockCtx:
    def __init__(self, height, timestamp):
        self.height, self.timestamp, self.issued = height, timestamp, 0


class State:
    """chain-core's State for the replayed kinds, from State::genesis."""

    def __init__(self, p, genesis):
        self.p, self.genesis = p, genesis
        launch = p.get('launch') or {}
        self.presence_p, self.editions_p, self.stations_p = (launch.get(r) for r in ('presence', 'editions', 'stations'))
        treasury = p['genesis_treasury']
        self.accounts = {treasury: Account(treasury)}
        self.accounts[treasury].balance = p['genesis_treasury_amount']
        self.total_supply = p['genesis_treasury_amount']
        self.drops = {}  # drop id -> [creator, minted]
        self.attestors = set(unhex(k) for k in p['drum_attestors_genesis'])
        self.mandates = {}  # agent -> {terms, granted_at, period, spent_in_period, spent_total}
        self.issuers = set(unhex(k) for k in (self.presence_p or {}).get('issuers_genesis', []))
        self.pids = {}  # pid -> [holder, last_slot, bound_until_epoch]
        self.issuer_slots = {}  # issuer -> [slot, count]
        self.capsules = {}  # id -> capsule dict
        # Launch record 13's house codes are the treasury's from genesis (stations fix S2).
        self.stations = {code: {'owner': treasury, 'name': code, 'mode': 0, 'crew': [], 'pinned': None, 'offer': None,
                                'holder': None, 'claimed_at': 0}
                         for code in (self.stations_p or {}).get('house_codes', [])}
        self.editions = {}
        self._root = None

    # -- roots (state.rs state_root and the module roots)
    def root(self):
        if self._root is None:
            self._root = self.compute_root()
        return self._root

    def compute_root(self):
        accounts = leaves_root([merkle_leaf(self.accounts[a].encode()) for a in sorted(self.accounts)])
        drops = leaves_root([merkle_leaf(string(i) + string(self.drops[i][0]) + uint(self.drops[i][1], 4))
                             for i in sorted(self.drops)])
        attestors = leaves_root([merkle_leaf(k) for k in sorted(self.attestors)])
        ext = []
        if self.mandates:
            ext.append((1, leaves_root([merkle_leaf(string(a) + self.mandate_bytes(self.mandates[a]))
                                        for a in sorted(self.mandates)])))
        if self.issuers or self.pids or self.issuer_slots:
            ext.append((2, self.presence_root()))
        if self.capsules:
            ext.append((4, leaves_root([merkle_leaf(i + self.capsule_bytes(c)) for i, c in self.capsule_order()])))
        if self.stations:
            ext.append((5, leaves_root([merkle_leaf(string(code) + self.station_bytes(self.stations[code]))
                                        for code in sorted(self.stations)])))
        if self.editions:
            ext.append((7, self.editions_root()))
        supply = uint(self.total_supply, 8)
        if not ext:
            return digest(b'pointcast-chain/state/v2', accounts, drops, attestors, supply)
        ext_root = leaves_root([merkle_leaf(bytes([tag]) + root) for tag, root in ext])
        return digest(b'pointcast-chain/state/v3', accounts, drops, attestors, ext_root, supply)

    @staticmethod
    def mandate_bytes(m):
        return mandate_bytes(m['terms']) + b''.join(uint(m[k], 8) for k in ('granted_at', 'period', 'spent_in_period', 'spent_total'))

    def presence_root(self):
        leaves = [merkle_leaf(b'\0' + sequence(sorted(self.issuers), blob))]
        leaves += [merkle_leaf(b'\1' + pid + string(r[0]) + uint(r[1], 8) + uint(r[2], 8)) for pid, r in sorted(self.pids.items())]
        leaves += [merkle_leaf(b'\2' + blob(i) + uint(s[0], 8) + uint(s[1], 4)) for i, s in sorted(self.issuer_slots.items())]
        return leaves_root(leaves)

    @staticmethod
    def capsule_bytes(c):
        return (string(c['author']) + string(c['channel']) + c['commitment'] + uint(c['open_at'], 8)
                + string(c['label']) + uint(c['sealed_at'], 8))

    def capsule_order(self):
        """Module 4 is sorted by (author, id) (capsule.rs)."""
        return sorted(self.capsules.items(), key=lambda kv: (kv[1]['author'], kv[0]))

    @staticmethod
    def station_bytes(s):
        holder = s['holder']
        held = b'\0' if holder is None else b'\1' + holder[1] if holder[0] == 'pid' else b'\2' + string(holder[1])
        return (string(s['owner']) + string(s['name']) + uint(s['mode'], 1) + sequence(s['crew'], string)
                + optional(s['pinned'], lambda h: b'' + h) + optional(s['offer'], string) + held + uint(s['claimed_at'], 8))

    def editions_root(self):
        ids, leaves = sorted(self.editions), []
        for i in ids:
            ed = self.editions[i]
            leaves.append(merkle_leaf(b'\0' + string(i) + self.terms_bytes(ed['terms']) + uint(ed['minted'], 4)))
        for i in ids:
            for serial, (owner, recipe_hash, minted_at) in sorted(self.editions[i]['tokens'].items()):
                leaves.append(merkle_leaf(b'\1' + string(i) + uint(serial, 4) + string(owner) + recipe_hash + uint(minted_at, 8)))
        for i in ids:
            for who, n in sorted(self.editions[i]['minted_by'].items()):
                leaves.append(merkle_leaf(b'\2' + string(i) + string(who) + uint(n, 4)))
        for i in ids:
            for key in sorted(self.editions[i]['used_keys']):
                leaves.append(merkle_leaf(b'\3' + string(i) + blob(key)))
        for i in ids:
            for h in sorted(self.editions[i]['used_recipes']):
                leaves.append(merkle_leaf(b'\4' + string(i) + h))
        return leaves_root(leaves)

    @staticmethod
    def terms_bytes(t):
        return edition_bytes(t)

    # -- helpers (state.rs)
    def touch(self, addr):
        if addr not in self.accounts:
            self.accounts[addr] = Account(addr)
        return self.accounts[addr]

    def balance(self, addr):
        return self.accounts[addr].balance if addr in self.accounts else 0

    def can_receive(self, addr):
        return is_human(addr) or addr in self.accounts

    def domain(self):
        return string(self.p['chain_id']) + self.genesis

    def issue(self, ctx, to, want):
        p, acct = self.p, self.accounts[to]
        epoch = ctx.height // max(p['epoch_blocks'], 1)
        if acct.epoch != epoch:
            acct.epoch, acct.issued_in_epoch = epoch, 0
        amount = min(want, max(p['account_epoch_cap'] - acct.issued_in_epoch, 0),
                     max(p['block_issuance_cap'] - ctx.issued, 0), max(p['max_supply'] - self.total_supply, 0))
        acct.balance += amount
        acct.issued_in_epoch += amount
        ctx.issued += amount
        self.total_supply += amount
        return amount

    def ticketed(self):
        return self.presence_p if self.presence_p and self.presence_p['tap_policy'] == 'ticketed' else None

    def admits(self, channel, who):
        s = self.stations.get(channel)
        return s is None or s['mode'] == 0 or s['owner'] == who or who in s['crew']

    def key_controls(self, sender, key):
        """State::signer. With no device pass or controller ever replayed (set_session_key and
        set_controllers stop the replay), this is State::key_controls for every chain."""
        kind = address_kind(sender)
        if kind is None:
            raise Rejected('malformed sender address')
        if kind != 'pca1':
            if human_address(key) != sender:
                raise Rejected('public key does not control sender')
            return
        acct = self.accounts.get(sender)
        if acct is None or acct.agent is None:
            raise Rejected('agent is not registered')
        if key['scheme'] != 'ed25519' or unhex(key['bytes']) != acct.agent[2]:
            raise Rejected('public key does not control sender')

    def check_scope(self, terms, t, height):
        """mandate.rs check_terms_scope."""
        kind = t['type']
        if height >= terms['expires_at']:
            raise Rejected('mandate expired at height %d' % terms['expires_at'])
        if not terms['kinds'] >> TX_TAGS[kind] & 1:
            raise Rejected('outside the agent\'s mandate: ' + kind)
        if kind in ('publish_block', 'seal_capsule') and terms.get('channels') and t['channel'] not in terms['channels']:
            raise Rejected('outside the agent\'s mandate: %s:channel' % kind)
        if kind in ('tap', 'drum_session', 'presence_tap') and terms.get('rooms') and t['room'] not in terms['rooms']:
            raise Rejected('outside the agent\'s mandate: %s:room' % kind)

    def delegable_mask(self):
        mask = DELEGABLE_KINDS
        if self.editions_p is not None:
            mask |= 1 << 22 | 1 << 23
        if self.stations_p is not None:
            mask |= 1 << 14 | 1 << 15
        return mask

    def check_owner(self, sender, agent):
        acct = self.accounts.get(agent)
        if acct is None or acct.agent is None:
            raise Rejected('agent is not registered')
        if acct.agent[0] != sender:
            raise Rejected('only the agent\'s owner may do this')

    def check_tap_window(self, ctx, sender):
        window = ctx.height // max(self.p['tap_window_blocks'], 1)
        acct = self.accounts.get(sender)
        if acct is not None and acct.tap_window == window and acct.taps_in_window >= self.p['taps_per_window']:
            raise Rejected('tap rate limit: %d per window (window %d)' % (self.p['taps_per_window'], window))
        return window

    def count_tap(self, sender, window):
        acct = self.touch(sender)
        if acct.tap_window != window:
            acct.tap_window, acct.taps_in_window = window, 0
        acct.taps_in_window += 1
        acct.taps += 1

    def held_by(self, holder):
        return sum(1 for s in self.stations.values() if s['holder'] == holder)

    def lapsed(self, height):
        delay = self.stations_p['max_delay_blocks']
        return set(sorted(i for i, c in self.capsules.items() if height >= min(c['open_at'] + delay, U64_MAX))[:CAPSULE_PRUNE_PER_TX])

    # -- one tx (State::apply_tx), after the signature and stateless checks
    def apply_tx(self, ctx, stx):
        t = stx['tx']
        kind, sender = t['type'], t['sender']
        if kind not in REPLAYED_KINDS:
            raise NotReplayed('tx kind ' + str(kind))
        self.key_controls(sender, stx['public_key'])
        acct = self.accounts.get(sender)
        expected = acct.nonce if acct is not None else 0
        if t['nonce'] != expected:
            raise Rejected('nonce mismatch: expected %d, got %d' % (expected, t['nonce']))
        if sender in self.mandates:
            self.check_scope(self.mandates[sender]['terms'], t, ctx.height)
        getattr(self, 'kind_' + kind)(ctx, t, sender)
        self.touch(sender).nonce += 1
        self._root = None

    def kind_publish_block(self, ctx, t, sender):
        check_channel('channel', t['channel'])
        check_post(t['title'], t.get('media_uri'))
        if self.stations_p is not None and not self.admits(t['channel'], sender):
            raise Rejected('only this station\'s owner and crew post or seal here')
        self.touch(sender).posts += 1

    def kind_tap(self, ctx, t, sender):
        check_slug('room', t['room'], MAX_ROOM_LEN)
        window = self.check_tap_window(ctx, sender)
        self.count_tap(sender, window)
        if self.ticketed() is None:
            self.issue(ctx, sender, self.p['tap_reward'])

    def kind_presence_tap(self, ctx, t, sender):
        pp, ticket = self.ticketed(), t['ticket']
        if pp is None:
            raise Rejected('presence tickets are not enabled on this chain')
        acct = self.accounts.get(sender)
        if not is_human(sender) or (acct is not None and acct.agent is not None):
            raise Rejected('only human accounts may presence_tap')
        check_slug('room', t['room'], MAX_ROOM_LEN)
        window = self.check_tap_window(ctx, sender)
        issuer, pid, slot, sig = unhex(ticket['issuer']), hash32(ticket['pid']), ticket['slot'], unhex(ticket['sig'])
        if issuer not in self.issuers:
            raise Rejected('ticket issuer is not a registered presence issuer')
        signed = digest(b'pointcast-chain/presence/v1', self.domain(), string(sender), string(t['room']), blob(issuer),
                        pid, uint(slot, 8))
        if not ed25519_verify(issuer, signed, sig):
            raise Rejected('presence ticket signature does not verify')
        current = ctx.height // max(pp['slot_blocks'], 1)
        if slot < max(current - pp['grace_slots'], 0) or slot > current:
            raise Rejected('presence ticket for slot %d is stale (current slot %d)' % (slot, current))
        epoch = ctx.height // max(self.p['epoch_blocks'], 1)
        rec = self.pids.get(pid)
        if rec is not None:
            if rec[1] >= slot:
                raise Rejected('this identity already redeemed a ticket for this slot')
            if rec[0] != sender and epoch < rec[2]:
                raise Rejected('this identity is bound to another holder for now')
        counted = self.issuer_slots.get(issuer)
        admitted = counted[1] if counted is not None and counted[0] == current else 0
        if admitted >= pp['issuer_slot_cap']:
            raise Rejected('the issuer\'s redemption budget for this slot is spent')
        self.pids[pid] = [sender, slot, min(epoch + pp['bind_epochs'], U64_MAX)]
        self.issuer_slots[issuer] = [current, admitted + 1]
        self.count_tap(sender, window)
        self.issue(ctx, sender, pp['presence_reward'])

    def kind_drop_mint(self, ctx, t, sender):
        drop_id, recipient = t['drop_id'], t['recipient']
        check_slug('drop_id', drop_id, MAX_DROP_ID_LEN)
        if not self.can_receive(recipient):
            raise Rejected('agent is not registered')
        if drop_id in self.drops:
            if self.drops[drop_id][0] != sender:
                raise Rejected('only the drop creator may mint')
            if self.drops[drop_id][1] >= self.p['max_drop_supply']:
                raise Rejected('drop sold out')
        if self.p['max_drop_supply'] == 0:
            raise Rejected('drop sold out')
        self.touch(sender)
        self.drops.setdefault(drop_id, [sender, 0])[1] += 1
        drops = self.touch(recipient).drops
        drops[drop_id] = drops.get(drop_id, 0) + 1

    def move(self, payer, to, amount):
        """The checks and commit transfer and spend_allowance share."""
        if not self.can_receive(to):
            raise Rejected('agent is not registered')
        if self.balance(payer) < amount:
            raise Rejected('insufficient balance: %d < %d' % (self.balance(payer), amount))
        if to != payer and self.balance(to) + amount > U64_MAX:
            raise Rejected('arithmetic overflow')

    def kind_transfer(self, ctx, t, sender):
        to, amount = t['to'], t['amount']
        if amount == 0:
            reject('amount', 'must be positive')
        self.move(sender, to, amount)
        self.touch(sender).balance -= amount
        self.touch(to).balance += amount

    def kind_register_agent(self, ctx, t, sender):
        if not is_human(sender):
            raise Rejected('only human accounts may register agents')
        check_text('name', t['name'], MAX_AGENT_NAME_LEN)
        key = unhex(t['public_key'])
        if not well_formed_ed25519(key):
            reject('public_key', 'not an ed25519 key')
        agent = address(key, True)
        if agent in self.accounts:
            raise Rejected('agent already registered')
        if (self.accounts[sender].agents if sender in self.accounts else 0) >= self.p['max_agents_per_owner']:
            raise Rejected('owner has reached the agent limit')
        self.touch(sender).agents += 1
        self.accounts[agent] = Account(agent, (sender, t['name'], key))

    def kind_set_drum_attestors(self, ctx, t, sender):
        if sender != self.p['drum_attestor_admin']:
            reject('sender', 'not the drum attestor admin')
        keys = [unhex(k) for k in t['attestors']]
        if not valid_key_set(keys):
            reject('attestors', 'must be sorted, unique, \u2264 16 ed25519 keys')
        self.touch(sender)
        self.attestors = set(keys)

    def kind_set_presence_issuers(self, ctx, t, sender):
        if self.presence_p is None:
            raise Rejected('presence tickets are not enabled on this chain')
        if sender != self.presence_p['admin']:
            raise Rejected('only the presence admin may do this')
        keys = [unhex(k) for k in t['issuers']]
        if not valid_key_set(keys):
            reject('issuers', 'must be sorted, unique, \u2264 16 ed25519 keys')
        self.touch(sender)
        self.issuers = set(keys)

    def kind_set_mandate(self, ctx, t, sender):
        agent, terms = t['agent'], t['terms']
        self.check_owner(sender, agent)
        kinds = terms['kinds']
        if kinds & 1:
            reject('terms.kinds', 'bit 0 is reserved')
        if kinds & ~self.delegable_mask():
            reject('terms.kinds', 'unknown or non-delegable kind bits')
        for name, limit, check in (('channels', 8, lambda c: check_channel('terms.channels', c)),
                                   ('rooms', 8, lambda r: check_slug('terms.rooms', r, MAX_ROOM_LEN))):
            values = terms.get(name, [])
            if len(values) > limit:
                reject('terms.' + name, 'more than 8 entries')
            if not all(a < b for a, b in zip(values, values[1:])):
                reject('terms.' + name, 'must be sorted ascending, no duplicates')
            for value in values:
                check(value)
        if terms['period_blocks'] == 0:
            reject('terms.period_blocks', 'must be \u2265 1')
        payees = terms.get('payees', [])
        if len(payees) > 16:
            reject('terms.payees', 'more than 16 entries')
        if not all(a < b for a, b in zip(payees, payees[1:])):
            reject('terms.payees', 'must be sorted ascending, no duplicates')
        if terms['expires_at'] <= ctx.height:
            reject('terms.expires_at', 'must be above the current height')
        self.touch(sender)
        self.mandates[agent] = {'terms': terms, 'granted_at': ctx.height,
                                'period': ctx.height // max(terms['period_blocks'], 1), 'spent_in_period': 0, 'spent_total': 0}

    def kind_clear_mandate(self, ctx, t, sender):
        self.check_owner(sender, t['agent'])
        if t['agent'] not in self.mandates:
            raise Rejected('agent has no mandate')
        self.touch(sender)
        del self.mandates[t['agent']]

    def kind_spend_allowance(self, ctx, t, sender):
        to, amount, m = t['to'], t['amount'], self.mandates.get(sender)
        if m is None:
            raise Rejected('agent has no mandate')
        terms = m['terms']
        if not terms['kinds'] >> 10 & 1:
            raise Rejected('outside the agent\'s mandate: spend_allowance')
        if amount == 0:
            reject('amount', 'must be positive')
        if ctx.height >= terms['expires_at']:
            raise Rejected('mandate expired at height %d' % terms['expires_at'])
        period = ctx.height // max(terms['period_blocks'], 1)
        spent = m['spent_in_period'] if m['period'] == period else 0
        if amount > max(terms['spend_per_period'] - spent, 0) or amount > max(terms['spend_total'] - m['spent_total'], 0):
            raise Rejected('allowance exceeded: %d left this period, %d left in total'
                           % (max(terms['spend_per_period'] - spent, 0), max(terms['spend_total'] - m['spent_total'], 0)))
        if terms.get('payees') and to not in terms['payees']:
            raise Rejected('payee is not on the mandate\'s allowlist')
        if not self.can_receive(to):
            raise Rejected('agent is not registered')
        acct = self.accounts.get(sender)
        if acct is None or acct.agent is None:
            raise Rejected('agent has no mandate')
        owner = acct.agent[0]
        self.move(owner, to, amount)
        self.touch(owner).balance -= amount
        self.touch(to).balance += amount
        if m['period'] != period:
            m['period'], m['spent_in_period'] = period, 0
        m['spent_in_period'] = min(m['spent_in_period'] + amount, U64_MAX)
        m['spent_total'] = min(m['spent_total'] + amount, U64_MAX)

    def kind_seal_capsule(self, ctx, t, sender):
        sp = self.stations_p
        if sp is None:
            raise Rejected('stations is not enabled on this chain')
        channel, commitment, open_at = t['channel'], hash32(t['commitment']), t['open_at']
        check_channel('channel', channel)
        check_plain('label', t['label'], 64)
        if open_at <= ctx.height:
            reject('open_at', 'must be above the current height')
        if open_at - ctx.height > sp['max_delay_blocks']:
            reject('open_at', 'beyond stations.max_delay_blocks')
        if not self.admits(channel, sender):
            raise Rejected('only this station\'s owner and crew post or seal here')
        cid = digest(b'pointcast-chain/capsule-id/v1', string(sender), commitment)
        delay = sp['max_delay_blocks']
        mine = [(i, c) for i, c in self.capsules.items() if c['author'] == sender]
        live = sum(1 for _, c in mine if ctx.height < min(c['open_at'] + delay, U64_MAX))
        stored = self.capsules[cid]['open_at'] if cid in self.capsules else None
        if stored is not None and ctx.height < min(stored + delay, U64_MAX):
            reject('commitment', 'already sealed')
        if live >= sp['max_unopened']:
            raise Rejected('this author already holds %d unopened capsules' % sp['max_unopened'])
        pruned = self.lapsed(ctx.height)
        replaced = stored is not None and cid not in pruned
        if len(self.capsules) - len(pruned) + (0 if replaced else 1) > sp['max_capsules']:
            reject('commitment', 'stations.max_capsules reached')
        self.touch(sender)
        for i in pruned:
            del self.capsules[i]
        self.capsules[cid] = {'author': sender, 'channel': channel, 'commitment': commitment, 'open_at': open_at,
                              'label': t['label'], 'sealed_at': ctx.height}

    def kind_open_capsule(self, ctx, t, sender):
        sp = self.stations_p
        if sp is None:
            raise Rejected('stations is not enabled on this chain')
        cid, salt, body_hash = hash32(t['capsule']), unhex(t['salt']), hash32(t['body_hash'])
        if not 16 <= len(salt) <= 64:
            reject('salt', 'must be 16..=64 bytes')
        check_post(t['title'], t.get('media_uri'))
        c = self.capsules.get(cid)
        if c is None:
            raise Rejected('no such capsule')
        if ctx.height < c['open_at']:
            raise Rejected('the capsule opens at height %d' % c['open_at'])
        lapses = min(c['open_at'] + sp['max_delay_blocks'], U64_MAX)
        if ctx.height >= lapses:
            raise Rejected('the capsule lapsed at height %d' % lapses)
        m = self.mandates.get(sender)
        if m is not None and m['terms'].get('channels') and c['channel'] not in m['terms']['channels']:
            raise Rejected('outside the agent\'s mandate: open_capsule:channel')
        if not self.admits(c['channel'], c['author']):
            raise Rejected('only this station\'s owner and crew post or seal here')
        content = digest(b'pointcast-chain/capsule-content/v1', string(t['title']), body_hash,
                         optional(t.get('media_uri'), string))
        if digest(b'pointcast-chain/capsule/v1', self.domain(), string(c['author']), string(c['channel']), content,
                  blob(salt)) != c['commitment']:
            raise Rejected('the reveal does not match the commitment')
        pruned = self.lapsed(ctx.height)
        self.touch(sender)
        del self.capsules[cid]
        for i in pruned:
            self.capsules.pop(i, None)

    def station_holder(self, ctx, sender, house, pid):
        sp = self.stations_p
        if house:
            if pid is not None:
                reject('pid', 'a house claim names no pid')
            return None
        if self.ticketed() is not None:
            if pid is None:
                reject('pid', 'name your bound presence pid')
            epoch = ctx.height // max(self.p['epoch_blocks'], 1)
            rec = self.pids.get(pid)
            if rec is None or rec[0] != sender or epoch >= rec[2]:
                reject('pid', 'not a presence pid bound to the sender')
            holder = ('pid', pid)
        else:
            if pid is not None:
                reject('pid', 'no presence tickets here: name no pid')
            holder = ('account', sender)
        if self.held_by(holder) >= sp['max_stations']:
            raise Rejected('this holder already holds %d stations' % sp['max_stations'])
        return holder

    def kind_claim_station(self, ctx, t, sender):
        sp = self.stations_p
        if sp is None:
            raise Rejected('stations is not enabled on this chain')
        if not is_human(sender):
            reject('sender', 'people only (tz1/tz2/pcp1)')
        code, name, pid = t['code'], t['name'], t.get('pid')
        mode = {'open': 0, 'crew': 1}[t['mode']]
        pid = None if pid is None else hash32(pid)
        check_channel('code', code)
        check_plain('name', name, 32)
        house = code in sp['house_codes']
        s = self.stations.get(code)
        if s is not None and s['owner'] == sender:
            if pid is not None:
                reject('pid', 'the owner\'s re-claim names no pid')
            self.touch(sender)
            s['name'], s['mode'] = name, mode
            return
        if s is not None and s['offer'] == sender:
            holder = self.station_holder(ctx, sender, house, pid)
        elif s is not None or house:
            raise Rejected('someone else holds this station')
        else:
            holder = self.station_holder(ctx, sender, False, pid)
            held = max(len(self.stations) - len(sp['house_codes']), 0)
            if holder[0] == 'account' and held >= sp['max_account_stations']:
                reject('code', 'stations.max_account_stations reached')
        self.touch(sender)
        self.stations[code] = {'owner': sender, 'name': name, 'mode': mode, 'crew': [], 'pinned': None, 'offer': None,
                               'holder': holder, 'claimed_at': ctx.height}

    def kind_set_station(self, ctx, t, sender):
        if self.stations_p is None:
            raise Rejected('stations is not enabled on this chain')
        if not is_human(sender):
            reject('sender', 'people only (tz1/tz2/pcp1)')
        s = self.stations.get(t['code'])
        if s is None:
            raise Rejected('no such station')
        if s['owner'] != sender:
            raise Rejected('only the station\'s owner may do this')
        crew, owner_to = t.get('crew', []), t.get('owner_to')
        if len(crew) > 16:
            reject('crew', 'more than 16 entries')
        if not all(a < b for a, b in zip(crew, crew[1:])):
            reject('crew', 'must be sorted ascending, no duplicates')
        if sender in crew:
            reject('crew', 'lists the owner')
        if owner_to is not None:
            if not is_human(owner_to):
                reject('owner_to', 'people only (tz1/tz2/pcp1)')
            if owner_to == sender:
                reject('owner_to', 'already the owner')
        self.touch(sender)
        pinned = t.get('pinned')
        s['crew'], s['pinned'], s['offer'] = list(crew), None if pinned is None else hash32(pinned), owner_to

    def kind_open_edition(self, ctx, t, sender):
        ep, terms = self.editions_p, t['terms']
        if ep is None:
            raise Rejected('editions is not enabled on this chain')
        if sender != ep['admin']:
            raise Rejected('only the editions admin may open editions')
        check_slug('terms.id', terms['id'], 64)
        check_printable('terms.title', terms['title'], 64)
        if not 1 <= terms['supply'] <= ep['max_supply']:
            reject('terms.supply', 'must be 1..=max_supply')
        if terms['per_account'] > terms['supply']:
            reject('terms.per_account', 'must be at most supply')
        if terms['closes_at'] != 0 and terms['closes_at'] <= terms['opens_at']:
            reject('terms.closes_at', 'must be 0 or after opens_at')
        if terms.get('attestor') is not None and not well_formed_ed25519(unhex(terms['attestor'])):
            reject('terms.attestor', 'not an ed25519 key')
        if terms['royalty_bps'] > ep['royalty_bps_max']:
            reject('terms.royalty_bps', 'above royalty_bps_max')
        if terms['recipe_schema'] > 1:
            reject('terms.recipe_schema', 'must be 0 or 1')
        if terms['unique_key_len'] > 8:
            reject('terms.unique_key_len', 'must be 0..=8')
        if terms.get('l1_ref') is not None:
            check_printable('terms.l1_ref', terms['l1_ref'], 128)
        ed = self.editions.get(terms['id'])
        if ed is not None and (ed['minted'] > 0 or ctx.height >= ed['terms']['opens_at']):
            self.relaxes(terms, ed['terms'], ctx.height)
        elif ed is None and len(self.editions) >= ep['max_open']:
            raise Rejected('this chain already holds %d editions' % ep['max_open'])
        self.touch(sender)
        if ed is None:
            self.editions[terms['id']] = {'terms': terms, 'minted': 0, 'tokens': {}, 'minted_by': {},
                                          'used_keys': set(), 'used_recipes': set()}
        else:
            ed['terms'] = terms

    @staticmethod
    def relaxes(new, old, height):
        """edition.rs EditionTerms::relaxes: only transferable false -> true and a later closes_at."""
        def same(name):
            parse = (lambda v: None if v is None else unhex(v)) if name in ('attestor', 'renderer_hash') else (lambda v: v)
            if parse(new.get(name)) != parse(old.get(name)):
                raise Rejected('the edition is open: %s can no longer change (only transferable and closes_at '
                               'can be relaxed)' % name)
        for name in ('title', 'creator', 'supply', 'per_account', 'opens_at'):
            same(name)
        later = old['closes_at'] != 0 and height < old['closes_at'] and (new['closes_at'] == 0 or new['closes_at'] > old['closes_at'])
        if new['closes_at'] != old['closes_at'] and not later:
            raise Rejected('the edition is open: closes_at can no longer change (only transferable and closes_at '
                           'can be relaxed)')
        same('attestor')
        if old['transferable'] and not new['transferable']:
            raise Rejected('the edition is open: transferable can no longer change (only transferable and '
                           'closes_at can be relaxed)')
        for name in ('royalty_bps', 'recipe_schema', 'unique_key_len', 'renderer_hash'):
            same(name)
        same('l1_ref')

    def kind_edition_mint(self, ctx, t, sender):
        ep = self.editions_p
        if ep is None:
            raise Rejected('editions is not enabled on this chain')
        ed = self.editions.get(t['edition'])
        if ed is None:
            raise Rejected('no such edition')
        terms, recipient, recipe = ed['terms'], t['recipient'], unhex(t['recipe'])
        if ctx.height < terms['opens_at']:
            raise Rejected('edition mints open at height %d' % terms['opens_at'])
        if terms['closes_at'] != 0 and ctx.height >= terms['closes_at']:
            raise Rejected('edition mints closed at height %d' % terms['closes_at'])
        if ed['minted'] >= terms['supply']:
            raise Rejected('edition sold out')
        if not self.can_receive(recipient):
            raise Rejected('agent is not registered')
        if terms['per_account'] != 0 and ed['minted_by'].get(recipient, 0) >= terms['per_account']:
            raise Rejected('the recipient already has %d mint(s) of this edition' % terms['per_account'])
        if not 1 <= len(recipe) <= ep['max_recipe_len']:
            reject('recipe', 'must be 1..=max_recipe_len bytes')
        if terms['recipe_schema'] == 1 and recipe_rule(recipe) is not None:
            reject('recipe.' + recipe_rule(recipe).split('/')[0], recipe_rule(recipe).split('/')[1])
        key = None
        if terms['unique_key_len']:
            key = recipe[1:1 + terms['unique_key_len']]
            if len(key) < terms['unique_key_len']:
                reject('recipe', 'shorter than the edition\'s unique key')
            if key in ed['used_keys']:
                raise Rejected('this recipe\'s unique key already minted')
        recipe_hash = digest(b'pointcast/first-mints/recipe/v1', recipe)
        if recipe_hash in ed['used_recipes']:
            raise Rejected('this recipe already minted')
        expires, approval = t['approval_expires'], unhex(t['approval'])
        if terms.get('attestor') is not None:
            if expires <= ctx.height:
                raise Rejected('approval expired at height %d' % expires)
            signed = digest(b'pointcast-chain/edition-approval/v1', self.domain(), string(t['edition']), string(sender),
                            string(recipient), recipe_hash, uint(expires, 8))
            if not ed25519_verify(unhex(terms['attestor']), signed, approval):
                raise Rejected('the attestor approval does not verify')
        else:
            if sender != terms['creator']:
                raise Rejected('only the edition\'s creator may mint (it has no attestor)')
            if approval or expires != 0:
                reject('approval', 'must be empty (and approval_expires 0): this edition has no attestor')
        self.touch(sender)
        ed['minted'] += 1
        ed['tokens'][ed['minted']] = (recipient, recipe_hash, ctx.height)
        ed['minted_by'][recipient] = ed['minted_by'].get(recipient, 0) + 1
        if key is not None:
            ed['used_keys'].add(key)
        ed['used_recipes'].add(recipe_hash)

    def kind_edition_transfer(self, ctx, t, sender):
        if self.editions_p is None:
            raise Rejected('editions is not enabled on this chain')
        ed = self.editions.get(t['edition'])
        if ed is None:
            raise Rejected('no such edition')
        token = ed['tokens'].get(t['serial'])
        if token is None:
            raise Rejected('no such token')
        if token[0] != sender:
            raise Rejected('only the token\'s owner may transfer it')
        if not ed['terms']['transferable']:
            raise Rejected('this edition\'s tokens cannot be transferred')
        if t['to'] == sender:
            reject('to', 'already the owner')
        if not self.can_receive(t['to']):
            raise Rejected('agent is not registered')
        self.touch(sender)
        ed['tokens'][t['serial']] = (t['to'],) + token[1:]


@dataclass
class Report:
    total: int = 0
    verified: int = 0
    faults: list = field(default_factory=list)
    unsupported: set = field(default_factory=set)
    incomplete: list = field(default_factory=list)  # other named reasons the result is not complete
    summaries: list = field(default_factory=list)
    tip: str = ''  # recomputed hash of the last block
    unchecked_tx_roots: int = 0  # blocks whose tx contents are unauthenticated
    notes: list = field(default_factory=list)  # informational lines, never a reason to pass
    state_matched: int = 0  # blocks 1..state_matched: state root recomputed by replay and equal to the header's
    state_stop: str = ''  # why the replay stopped before the last block ('' when it covered every block)

    @property
    def ok(self):
        return (not self.faults and not self.unsupported and not self.incomplete
                and self.total > 0 and self.verified == self.total and self.state_matched == self.total)

    def state_line(self):
        """One line saying exactly which state roots were recomputed."""
        if self.total and self.state_matched == self.total and not self.state_stop:
            return 'state_root: recomputed by replay for all %d blocks; every one matches its header' % self.total
        if self.state_matched:
            return ('state_root: recomputed by replay and matching for blocks 1-%d of %d; NOT checked from block %d: %s'
                    % (self.state_matched, self.total, self.state_matched + 1, self.state_stop))
        return 'state_root: NOT checked: %s' % (self.state_stop or 'no blocks')


def check_tx_rules(record7, stx, t, key, mode, agent, report):
    """Stateless rules of State::authenticate, its RegisterAgent arm and webauthn::check_enabled:
    they depend only on the tx, so they run for every tx kind."""
    if mode == 'tezos_message' and (agent or key['scheme'] == 'p256'):
        report.faults.append('tezos_message is for tz1/tz2 senders')
    if mode == 'webauthn' and agent:
        report.faults.append('webauthn is for tz1/tz2/pcp1 senders')
    if t['type'] == 'register_agent' and agent:
        report.faults.append('only humans may register agents')
    # A chain without launch record 7 refuses anything passkey-shaped (webauthn.rs needs_record).
    if record7 is None and needs_webauthn_record(stx):
        report.faults.append('webauthn is not enabled on this chain (no launch record 7)')


def check_signature(params, genesis, record7, stx, t, key, mode, report):
    """The tx signature (State::authenticate): raw ed25519, or a passkey's webauthn assertion
    against launch record 7. A bad one is a fault; returns the reasons this version cannot check it."""
    if mode == 'webauthn':
        if not webauthn_verify(key, signing_hash(params, genesis, t), wire_signature(stx), record7):
            report.faults.append('tx signature invalid')
        return []
    if mode != 'raw':
        return ['sig_mode: ' + mode] + (['key scheme: ' + key['scheme']] if key['scheme'] != 'ed25519' else [])
    if key['scheme'] == 'p256':
        report.faults.append('tx signature invalid (a P-256 key signs only in webauthn mode)')
        return []
    if key['scheme'] != 'ed25519':
        return ['key scheme: ' + key['scheme']]
    if not ed25519_verify(key_bytes(key), signing_hash(params, genesis, t), wire_signature(stx)):
        report.faults.append('tx signature invalid')
    return []


def needs_webauthn_record(stx):
    """webauthn.rs needs_record: webauthn mode, a P-256 key anywhere, or a pcp1 address anywhere."""
    t = stx['tx']
    pcp1 = lambda a: isinstance(a, str) and a.startswith('pcp1') and address_kind(a) == 'pcp1'
    p256 = lambda k: isinstance(k, dict) and k.get('scheme') == 'p256'
    payees = lambda terms: any(map(pcp1, terms.get('payees', [])))
    if stx.get('sig_mode', 'raw') == 'webauthn' or p256(stx['public_key']) or pcp1(t['sender']):
        return True
    kind = t['type']
    if kind == 'drum_session':
        return any(map(pcp1, t['players'])) or any(
            pcp1(c['player']) or p256(c['public_key']) or c.get('mode') == 'webauthn' for c in t.get('cosigs', []))
    if kind in ('drop_mint', 'edition_mint'):
        return pcp1(t['recipient'])
    if kind in ('transfer', 'spend_allowance', 'edition_transfer'):
        return pcp1(t['to'])
    if kind == 'set_mandate':
        return pcp1(t['agent']) or payees(t['terms'])
    if kind == 'clear_mandate':
        return pcp1(t['agent'])
    if kind == 'set_session_key':
        return payees(t['terms'])
    if kind == 'set_controllers':
        return any(map(p256, t['controllers']))
    if kind == 'open_edition':
        return pcp1(t['terms']['creator'])
    if kind == 'set_station':
        return any(map(pcp1, t.get('crew', []))) or pcp1(t.get('owner_to'))
    return False


def verify(params, document, pinned_genesis=DEVNET_GENESIS):
    """Verify a complete recording from height 1 against an external genesis pin.

    Expects documents parsed by parse_json/load_json: duplicate keys and -0 are
    refused there, not here.
    """
    report = Report()
    # genesis and sequencer stay None when this version cannot derive them (an
    # unsupported params feature or key scheme). Checks that need them are then
    # skipped and every block is incomplete; all other checks still run.
    genesis = sequencer = None
    try:
        blocks = document['blocks'] if isinstance(document, dict) else document
        if not isinstance(blocks, list):
            raise ValueError('blocks must be an array')
        report.total = len(blocks)
        max_txs = params['max_txs_per_block']
        uint(max_txs, 4)
        try:
            genesis = params_hash(params)
            if genesis != unhex(pinned_genesis, 32):
                report.faults.append('genesis: params do not match pinned genesis')
            sequencer = key_bytes(params['sequencer'])
        except Unsupported as exc:
            report.unsupported.add(str(exc))
        if isinstance(document, dict):
            if 'genesis' in document and genesis is not None and unhex(document['genesis'], 32) != genesis:
                report.faults.append('genesis: recording metadata mismatch')
            if 'chain_id' in document and document['chain_id'] != params['chain_id']:
                report.faults.append('chain_id: recording metadata mismatch')
    except (ValueError, KeyError, TypeError, AttributeError) as exc:
        report.faults.append('input: ' + str(exc))
        return report
    if not blocks:
        report.incomplete.append('no blocks to verify (an empty prefix proves nothing)')
    launch = params.get('launch') or {}
    record7 = launch.get('webauthn')
    # The state replay: None once it has stopped (report.state_stop says why).
    replay = None
    if genesis is None:
        report.state_stop = 'the genesis parameters are not supported, so there is no state to replay'
    elif report.faults:
        report.state_stop = 'not replayed: the recording failed its genesis checks'
    else:
        replay = State(params, genesis)

    def stop_replay(height, reason, unsupported=False):
        nonlocal replay
        if replay is not None:
            replay = None
            report.state_stop = 'block %d: %s' % (height, reason)
            if unsupported:
                report.unsupported.add('state replay: ' + reason)

    prev = genesis
    prev_timestamp = 0  # chain-core's genesis tip_timestamp
    headers = {}  # height -> (recomputed hash, header) for every block whose header parsed
    agents = {}
    accounts = launch.get('accounts') is not None
    changed_controllers = set()
    nonces = {}  # sender -> next nonce: one per account, from 0, whatever the kind
    seen = {}  # txid -> block index
    for index, block in enumerate(blocks, 1):
        start = len(report.faults)
        incomplete = tx_root_unchecked = False
        state_checked = False
        try:
            h = block['header']
            bh = header_hash(h)
            headers[index] = (bh, h)
            if h['height'] != index:
                report.faults.append('height mismatch')
            if prev is not None and unhex(h['prev_hash'], 32) != prev:
                report.faults.append('prev_hash mismatch')
            prev = bh
            if h['timestamp'] < prev_timestamp:
                report.faults.append('timestamp went backwards')
            prev_timestamp = h['timestamp']
            if genesis is None or sequencer is None:
                incomplete = True  # seal not checked; the reason is in report.unsupported
            elif not ed25519_verify(sequencer, digest(b'pointcast-chain/seal/v2', genesis, bh), unhex(h['sequencer_sig'])):
                report.faults.append('seal invalid')
            txids = []
            txs = block['txs']
            if not isinstance(txs, list):
                raise ValueError('txs must be an array')
            if len(txs) > max_txs:
                report.faults.append('too many txs: %d > max_txs_per_block %d' % (len(txs), max_txs))
            if record7 is not None:
                passkeys = sum(1 for stx in txs if isinstance(stx, dict) and stx.get('sig_mode') == 'webauthn')
                if passkeys > record7['max_webauthn_txs_per_block']:
                    report.faults.append('too many webauthn txs: %d > max_webauthn_txs_per_block %d'
                                         % (passkeys, record7['max_webauthn_txs_per_block']))
            ctx = BlockCtx(h['height'], h['timestamp']) if replay is not None else None
            for ti, stx in enumerate(txs):
                tx_start = len(report.faults)
                deferred_controller = False
                undecoded = None  # why this version could not decode the tx, if it could not
                try:
                    t, key, mode = stx['tx'], wire_key(stx['public_key']), stx.get('sig_mode', 'raw')
                    sender = checked_address(t['sender'], 'sender')
                    agent = sender.startswith('pca1')
                    expected = nonces.get(sender, 0)
                    uint(t['nonce'], 8)
                    if t['nonce'] != expected:
                        report.faults.append('nonce mismatch: expected %d, got %d' % (expected, t['nonce']))
                    nonces[sender] = t['nonce'] + 1
                    # Key checks need only the sender and the key, so they run for
                    # every tx kind, including kinds this version cannot encode.
                    if agent:
                        if key['scheme'] == 'ed25519' and address(key_bytes(key), True) != sender:
                            report.faults.append('sender/key mismatch')
                        if key['scheme'] != 'ed25519' or agents.get(sender) != key_bytes(key):
                            report.faults.append('agent key not previously registered')
                    elif genesis is not None and human_address(key) not in (None, sender):
                        # Launch record 6 lets a controller or device-pass key sign for a
                        # tz1/tz2/pcp1 account: the replay decides that (below), or, once
                        # it has stopped, the tx is reported as unsupported.
                        if accounts:
                            deferred_controller = True
                        else:
                            report.faults.append('sender/key mismatch')
                    if accounts and (sender in changed_controllers or t['type'] == 'set_controllers'):
                        report.unsupported.add('account controller/device-pass authorization')
                        incomplete = True
                        changed_controllers.add(sender)
                    check_tx_rules(record7, stx, t, key, mode, agent, report)
                    # Remember observed registrations even if their signature mode
                    # is unsupported; that recording remains INCOMPLETE globally.
                    if t['type'] == 'register_agent' and len(report.faults) == tx_start:
                        registered = unhex(t['public_key'], 32)
                        decode_key(registered)
                        agents[address(registered, True)] = registered
                    # Encoding and signature support are independent: a known mode
                    # or key scheme may be hashed even when its signature cannot be checked.
                    txid = tx_hash(stx)
                    if txid in seen:
                        report.faults.append('duplicate txid (first in block %d)' % seen[txid])
                    seen.setdefault(txid, index)
                    txids.append(txid)
                    if genesis is None:
                        incomplete = True  # no signing domain; the reason is in report.unsupported
                    else:
                        reasons = check_signature(params, genesis, record7, stx, t, key, mode, report)
                        if reasons:
                            report.unsupported.update(reasons)
                            incomplete = True
                except Unsupported as exc:
                    report.unsupported.add(str(exc))
                    incomplete = True
                    undecoded = str(exc)
                except (ValueError, KeyError, TypeError, AttributeError) as exc:
                    report.faults.append('malformed tx: ' + str(exc))
                # The replay applies the tx (State::apply_tx) if every check above passed.
                if replay is not None:
                    if len(report.faults) > start:
                        stop_replay(index, 'not replayed past a fault in this block')
                    elif undecoded is not None:
                        stop_replay(index, 'tx %d cannot be decoded by this version (%s)' % (ti, undecoded), unsupported=True)
                    else:
                        try:
                            replay.apply_tx(ctx, stx)
                        except Rejected as exc:
                            report.faults.append('state replay: chain-core would refuse this tx: %s' % exc)
                            stop_replay(index, 'not replayed past a refused tx')
                        except (NotReplayed, Unsupported) as exc:
                            stop_replay(index, str(exc) + ' is not replayed by this version', unsupported=True)
                        except (ValueError, KeyError, TypeError, AttributeError) as exc:
                            report.faults.append('state replay: malformed tx: ' + str(exc))
                            stop_replay(index, 'not replayed past a malformed tx')
                if deferred_controller and replay is None:
                    report.unsupported.add('account controller/device-pass authorization')
                    incomplete = True
                for j in range(tx_start, len(report.faults)):
                    report.faults[j] = 'tx %d: %s' % (ti, report.faults[j])
            if len(txids) == len(txs):
                if merkle_root(txids) != unhex(h['tx_root'], 32):
                    report.faults.append('tx_root mismatch')
            else:
                incomplete = tx_root_unchecked = True
                report.unchecked_tx_roots += 1
            if replay is not None:
                if len(report.faults) > start:
                    stop_replay(index, 'not replayed past a fault in this block')
                elif replay.root() != unhex(h['state_root'], 32):
                    report.faults.append('state_root mismatch: the replay computes %s' % replay.root().hex())
                    stop_replay(index, 'not replayed past a state_root mismatch')
                else:
                    state_checked = True
                    report.state_matched += 1
        except (ValueError, KeyError, TypeError, AttributeError) as exc:
            report.faults.append('malformed block: ' + str(exc))
            stop_replay(index, 'not replayed past a malformed block')
        for j in range(start, len(report.faults)):
            report.faults[j] = 'block %d: %s' % (index, report.faults[j])
        valid = len(report.faults) == start and not incomplete
        report.verified += int(valid)
        report.summaries.append('block %d: %s%s%s' % (
            index, 'ok' if valid else 'incomplete' if len(report.faults) == start else 'FAILED',
            ' · tx_root NOT checked: tx contents unauthenticated' if tx_root_unchecked else '',
            '' if state_checked or len(report.faults) > start else ' · state_root NOT checked'))
    report.tip = prev.hex() if prev is not None else ''
    if isinstance(document, dict):
        check_snapshot(document, params, genesis, sequencer, headers, report)
    if report.verified < report.total and not (report.faults or report.unsupported or report.incomplete):
        # Fail closed: an unverified block must always come with a named reason.
        report.faults.append('internal: %d blocks unverified without a named reason' % (report.total - report.verified))
    if report.total and report.state_matched < report.total and not report.state_stop:
        report.faults.append('internal: %d state roots unchecked without a named reason' % (report.total - report.state_matched))
    return report


def check_snapshot(document, params, genesis, sequencer, headers, report):
    """Cross-check a snapshot's status and anchors against the recomputed chain."""
    if 'status' in document:
        try:
            status, tip = document['status'], headers.get(report.total, (None, {}))[1]
            # (field, recomputed value, label); the first three are required.
            claims = [('tip_hash', report.tip or None, 'tip_hash'), ('height', report.total, 'height'),
                      ('genesis_hash', genesis and genesis.hex(), 'genesis'),
                      ('state_root', tip.get('state_root'), 'state_root'),
                      ('tip_timestamp', tip.get('timestamp'), 'tip_timestamp'),
                      ('chain_id', params['chain_id'], 'chain_id'), ('sequencer', params['sequencer'], 'sequencer')]
            for name, value, label in claims:
                required = name in ('tip_hash', 'height', 'genesis_hash')
                if value is not None and (required or name in status) and status.get(name) != value:
                    report.faults.append('snapshot %s mismatch' % label)
        except (KeyError, TypeError, AttributeError) as exc:
            report.faults.append('malformed snapshot status: ' + str(exc))
    beyond = 0
    for anchor in document.get('anchors') or []:
        try:
            payload = anchor['payload']
            height, block_hash, state_root = payload['height'], unhex(payload['block_hash'], 32), unhex(payload['state_root'], 32)
            label = 'anchor at height %d: ' % int.from_bytes(uint(height, 8), 'big')
            if payload['chain_id'] != params['chain_id']:
                report.faults.append(label + 'chain_id mismatch')
            if height in headers:
                if block_hash != headers[height][0]:
                    report.faults.append(label + 'block_hash mismatch')
                if state_root != unhex(headers[height][1]['state_root'], 32):
                    report.faults.append(label + 'state_root mismatch')
            else:
                beyond += 1
            if genesis is None or sequencer is None:
                continue
            signed = digest(b'pointcast-chain/anchor/v2', genesis, string(payload['chain_id']), uint(height, 8),
                            block_hash, state_root)
            if 'digest' in anchor and unhex(anchor['digest'], 32) != signed:
                report.faults.append(label + 'digest mismatch')
            if not ed25519_verify(sequencer, signed, unhex(anchor['seq_sig'])):
                report.faults.append(label + 'seq_sig invalid')
        except (ValueError, KeyError, TypeError, AttributeError) as exc:
            report.faults.append('malformed snapshot anchor: ' + str(exc))
    if document.get('anchors'):
        report.notes.append('anchors: %d compared with recomputed blocks, %d beyond the recording%s' % (
            len(document['anchors']) - beyond, beyond,
            '' if genesis is not None and sequencer is not None else '; seq_sig NOT checked'))


def unique_keys(pairs):
    """Refuse a repeated object key, as chain-core's typed serde parse does.

    Python keeps the last value; a first-wins reader would show another
    document than the one verified.
    """
    result = {}
    for key, value in pairs:
        if key in result:
            raise ValueError('duplicate JSON key: %s' % key)
        result[key] = value
    return result


# Python 3.11+ refuses longer integer literals by default (int_max_str_digits).
# Python 3.9 and 3.10 (macOS's python3 is 3.9) convert them in quadratic time,
# so a single 1M-digit "tip" took ~19 s and a 64 MiB one would take hours.
# chain-core's integers are at most u64 (20 digits), so this rejects nothing real.
MAX_INT_DIGITS = 4300


def strict_int(text):
    # serde_json reads -0 as a float, which no integer field accepts.
    if text == '-0':
        raise ValueError('invalid JSON integer: -0')
    if len(text) - text.startswith('-') > MAX_INT_DIGITS:
        raise ValueError('JSON integer longer than %d digits' % MAX_INT_DIGITS)
    return int(text)


def refuse_constant(name):
    raise ValueError('invalid JSON constant: %s' % name)


def parse_json(text):
    """Parse JSON as strictly as chain-core does where it matters for verification."""
    return json.loads(text, object_pairs_hook=unique_keys, parse_int=strict_int, parse_constant=refuse_constant)


def read_input(path):
    """Read JSON from exactly this path (a relative path means the working directory).

    Returns the absolute path, the SHA-256 of the bytes read and the document,
    so the CLI can say which file it verified.
    """
    path = Path(path).resolve()
    raw = path.read_bytes()
    return path, hashlib.sha256(raw).hexdigest(), parse_json(raw.decode('utf-8'))


def load_json(path):
    return read_input(path)[2]


# --devnet: fetch a node's params and blocks over HTTP GET, then verify them
# exactly as files are verified. Nothing fetched is trusted: the genesis pin
# never comes from the node, and the node's reported tip only decides when
# paging stops. The verifier above is the same code for both paths.
USER_AGENT = 'pcv-py/1 (+https://pointcast.xyz/chain/bots)'  # Cloudflare refuses urllib's default
PAGE_LIMIT = 500  # the node's largest /raw/blocks page
MAX_RESPONSE_BYTES = 64 << 20


class FetchError(Exception):
    """A GET failed, or answered something that is not the read API's shape."""


class UsageError(ValueError):
    """Arguments that cannot be run as given (an input error, exit 1)."""


class _NoRedirects(urllib.request.HTTPRedirectHandler):
    # Returning None makes urllib raise HTTPError for the 3xx itself, so every
    # byte comes from the URL pcv asked for.
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


_OPENER = urllib.request.build_opener(_NoRedirects)


def devnet_base(url):
    """The --devnet URL without trailing slashes; only an http(s) base URL is accepted."""
    parts = urllib.parse.urlsplit(url)
    if parts.scheme not in ('http', 'https') or not parts.netloc or '?' in url or '#' in url:
        raise UsageError('--devnet needs an http(s) base URL with no query or fragment, got %r' % url)
    return url.rstrip('/')


def genesis_pin(genesis, devnet=None):
    """The trusted genesis pin and where it came from. Never from the node being checked."""
    if genesis is not None:
        return genesis, 'from --genesis'
    if devnet is None:
        return DEVNET_GENESIS, "pcv.py's built-in devnet pin, the default; pass --genesis for another chain"
    if devnet_base(devnet) == DEVNET_URL:
        return LIVE_DEVNET_GENESIS, "pcv.py's built-in pin for %s (devnet-2), not taken from the node" % DEVNET_URL
    raise UsageError('--genesis is required with --devnet %s: only %s has a built-in pin, '
                     'and pcv never takes a genesis pin from the node it checks' % (devnet, DEVNET_URL))


def get_bytes(url, timeout):
    """One GET with pcv's User-Agent; the body, or FetchError. Each socket operation has the timeout."""
    request = urllib.request.Request(url, headers={'User-Agent': USER_AGENT, 'Accept': 'application/json'})
    try:
        with _OPENER.open(request, timeout=timeout) as response:
            raw = response.read(MAX_RESPONSE_BYTES + 1)
    except urllib.error.HTTPError as exc:
        if exc.fp is not None:
            exc.close()
        redirect = ' (redirects are not followed)' if 300 <= exc.code < 400 else ''
        raise FetchError('GET %s: HTTP %d %s%s' % (url, exc.code, exc.reason, redirect)) from None
    except urllib.error.URLError as exc:
        raise FetchError('GET %s: %s' % (url, exc.reason)) from None
    except (OSError, http.client.HTTPException) as exc:  # a read timeout, a reset, a short body
        raise FetchError('GET %s: %s' % (url, str(exc) or type(exc).__name__)) from None
    if len(raw) > MAX_RESPONSE_BYTES:
        raise FetchError('GET %s: response larger than %d bytes' % (url, MAX_RESPONSE_BYTES))
    return raw


def get_json(url, timeout):
    """GET url; returns the body and its strict JSON parse.

    timeout bounds the whole request, not only each socket operation: a node
    that answers a byte at a time, or stalls in DNS, cannot hold pcv past it.
    The GET runs in a daemon thread that pcv abandons at the deadline.
    """
    outcome = {}

    def fetch():
        try:
            outcome['raw'] = get_bytes(url, timeout)
        except BaseException as exc:  # handed to the caller's thread below
            outcome['error'] = exc

    worker = threading.Thread(target=fetch, name='pcv-get', daemon=True)
    worker.start()
    worker.join(timeout)
    if worker.is_alive():
        raise FetchError('GET %s: timed out: no complete response within %g s' % (url, timeout))
    if 'error' in outcome:
        raise outcome['error']
    raw = outcome['raw']
    try:
        return raw, parse_json(raw.decode('utf-8'))
    except (ValueError, RecursionError) as exc:
        raise FetchError('GET %s: not strict JSON: %s' % (url, exc)) from None


def fetch_devnet(base, timeout, say=print):
    """Fetch a node's /params and every block from height 1 via /raw/blocks pages.

    Returns (the /params body as served, the params, the blocks, the tip the
    node reported on its first page, the number of pages). That tip is fixed
    as the target, so paging always ends; a node that serves fewer blocks than
    it reported is a fetch error. Pages are joined by count, not by the
    node's word: the verifier then checks every height and link.
    """
    url = base + '/params'
    say('fetch: GET ' + url)
    params_raw, params = get_json(url, timeout)
    if not isinstance(params, dict):
        raise FetchError('GET %s: expected a JSON object' % url)
    blocks, tip, pages = [], None, 0
    while tip is None or len(blocks) < tip:
        url = '%s/raw/blocks?from=%d&limit=%d' % (base, len(blocks) + 1, PAGE_LIMIT)
        page = get_json(url, timeout)[1]
        if not isinstance(page, dict) or type(page.get('tip')) is not int or page['tip'] < 0 \
                or not isinstance(page.get('blocks'), list):
            raise FetchError('GET %s: expected {"tip": <height>, "blocks": [...]}' % url)
        if tip is None:
            tip = page['tip']
        if not page['blocks'] and len(blocks) < tip:
            raise FetchError('GET %s: the node reported tip %d but served no blocks from height %d'
                             % (url, tip, len(blocks) + 1))
        blocks.extend(page['blocks'])
        pages += 1
        say('fetch: GET %s -> %d blocks' % (url, len(page['blocks'])))
    return params_raw, params, blocks, tip, pages


def read_devnet(url, timeout, save=None):
    """Fetch, optionally save, and return (params, recording) for verify().

    The recording verified is parsed back from the exact bytes written to
    blocks.json, so an offline rerun of the saved files checks the same data.
    """
    base = devnet_base(url)
    params_raw, params, blocks, tip, pages = fetch_devnet(base, timeout)
    captured = datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
    recording = json.dumps({'source': base, 'captured': captured, 'blocks': blocks}, ensure_ascii=True).encode('ascii')
    print('input params: %s/params (sha256 %s)' % (base, hashlib.sha256(params_raw).hexdigest()))
    print('input blocks: %d blocks from %s/raw/blocks in %d pages, node-reported tip %d (sha256 %s)'
          % (len(blocks), base, pages, tip, hashlib.sha256(recording).hexdigest()))
    if save is not None:
        directory = Path(save).resolve()
        directory.mkdir(parents=True, exist_ok=True)
        for name, data in (('params.json', params_raw), ('blocks.json', recording)):
            path = directory / name
            temp = directory / (name + '.tmp')
            temp.write_bytes(data)
            os.replace(temp, path)
            print('saved %s: %s (sha256 %s)' % (name[:-5], path, hashlib.sha256(data).hexdigest()))
    print('live: blocks as %s served them at %s; a node can withhold newer blocks, so this shows a valid prefix, '
          'not freshness' % (base, captured))
    return params, parse_json(recording.decode('ascii'))


def shown(text):
    """text as pcv prints it: each character Python does not call printable
    (Unicode Cc, Cf, Cs, Zl, Zp, Co, Cn, and every separator but the space)
    written as a \\xNN, \\uNNNN or \\UNNNNNNNN escape.

    A fault or reason can quote a node's own strings: an unknown tx kind,
    sig_mode or key scheme, a params record name. Escaped, those cannot move
    the cursor, erase or add a line (a second "verified" line above the real
    verdict), reorder text, or stop the run with an encoding error.
    """
    if text.isprintable():
        return text
    return ''.join(c if c.isprintable() else '\\x%02x' % ord(c) if ord(c) < 0x100
                   else '\\u%04x' % ord(c) if ord(c) < 0x10000 else '\\U%08x' % ord(c) for c in text)


class _Parser(argparse.ArgumentParser):
    def error(self, message):
        # A usage error is an input error: exit 1, since exit 2 means INCOMPLETE.
        self.print_usage(sys.stderr)
        self.exit(1, 'input error: %s\n' % message)


def main(argv=None):
    parser = _Parser(description=__doc__)
    parser.add_argument('--params', help='params JSON, or snapshot containing params')
    parser.add_argument('--blocks', help='block array, recording, or Yard snapshot')
    parser.add_argument('--devnet', metavar='URL',
                        help='instead of files, GET URL/params and every block from URL/raw/blocks')
    parser.add_argument('--save', metavar='DIR',
                        help='with --devnet: write DIR/params.json and DIR/blocks.json for an offline rerun')
    parser.add_argument('--timeout', type=float, default=30.0, help='with --devnet: seconds allowed for each whole request (default 30)')
    parser.add_argument('--genesis', help='trusted genesis hex (default: the built-in devnet pin, for files and '
                                          'for --devnet %s only)' % DEVNET_URL)
    args = parser.parse_args(argv)
    if args.devnet is not None and (args.params is not None or args.blocks is not None):
        parser.error('--devnet cannot be combined with --params or --blocks')
    if args.devnet is None and (args.params is None or args.blocks is None):
        parser.error('give --params and --blocks, or --devnet URL')
    if args.save is not None and args.devnet is None:
        parser.error('--save needs --devnet')
    if not args.timeout > 0:
        parser.error('--timeout must be a positive number of seconds')
    try:
        pinned, pin_source = genesis_pin(args.genesis, args.devnet)  # before any network access
        if args.devnet is not None:
            params, document = read_devnet(args.devnet, args.timeout, args.save)
        else:
            documents = []
            for label, name in (('params', args.params), ('blocks', args.blocks)):
                path, sha256, document = read_input(name)
                print('input %s: %s (sha256 %s)' % (label, path, sha256))
                documents.append(document)
            params, document = documents
        print('genesis pin: %s (%s)' % (pinned, pin_source))
        report = verify(params.get('params', params), document, pinned)
    except FetchError as exc:
        print('fetch error: ' + shown(str(exc)), file=sys.stderr)
        return 1
    except (OSError, ValueError, TypeError, AttributeError) as exc:
        print('input error: ' + shown(str(exc)), file=sys.stderr)
        return 1
    # Every line below can quote the chain's own strings: shown() escapes them.
    for line in report.summaries:
        print(shown(line))
    for fault in report.faults:
        print('FAULT: ' + shown(fault))
    for reason in sorted(report.unsupported):
        print('UNSUPPORTED: ' + shown(reason))
    for reason in report.incomplete:
        print('INCOMPLETE: ' + shown(reason))
    if report.unchecked_tx_roots:
        print('tx_root NOT checked in %d blocks: their tx contents are unauthenticated' % report.unchecked_tx_roots)
    for note in report.notes:
        print(shown(note))
    print(shown(report.state_line()))
    if report.ok:
        print('verified %d blocks · tip height %d hash %s · checks: genesis, links, block hashes, tx_root, seals, tx sigs, '
              'state_root (replayed) · faults: 0' % (report.total, report.total, report.tip))
    else:
        print('verification %s · blocks passing supported v1 checks: %d/%d · state_root replayed and matching: %d/%d · '
              'faults: %d · unsupported: %d%s' %
              ('FAILED' if report.faults else 'INCOMPLETE', report.verified, report.total, report.state_matched,
               report.total, len(report.faults), len(report.unsupported),
               ' · incomplete: %d' % len(report.incomplete) if report.incomplete else ''))
    if report.ok:
        return 0
    return 1 if report.faults else 2


if __name__ == '__main__':
    sys.exit(main())
