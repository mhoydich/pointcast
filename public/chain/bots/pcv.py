#!/usr/bin/env python3
"""Independent PointCast commitment/signature verifier (Python 3.9+, stdlib only).

Verifies files offline, or with --devnet fetches a node's blocks over HTTP GET
and verifies them the same way.
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

DEVNET_GENESIS = 'a720735b473383057ee11e885b2d32e1565470612364f13c0265c1a1c66f4280'
# The published devnet whose genesis DEVNET_GENESIS pins. Only this exact URL
# gets the built-in pin in --devnet mode; any other node needs --genesis.
DEVNET_URL = 'https://pointcast-devnet.mhoydich.workers.dev'
SUPPORTED_KINDS = {'publish_block', 'register_agent', 'set_mandate'}


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


def address(public_key, agent=False, prefix=TZ1):
    """pca1 + Base58Check(BLAKE2b-160(key)) for an agent, else Base58Check(prefix + hash)."""
    payload = hashlib.blake2b(public_key, digest_size=20).digest()
    if not agent:
        payload = prefix + payload
    raw = payload + checksum(payload)
    n, out = int.from_bytes(raw, 'big'), ''
    while n:
        n, digit = divmod(n, 58)
        out = B58[digit] + out
    out = '1' * (len(raw) - len(raw.lstrip(b'\0'))) + out
    return ('pca1' if agent else '') + out


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
    """The tz1/tz2 address a key controls, or None for a scheme this version cannot derive."""
    if key['scheme'] == 'ed25519':
        return address(key_bytes(key))
    if key['scheme'] == 'secp256k1':
        return address(unhex(key['bytes'], 33), prefix=TZ2)
    return None


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
        unknown = [k for k, v in launch.items() if v is not None and k != 'presence']
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
        encoded += b'\xf0' + uint(len(records), 4) + b''.join(records)
    return digest(b'pointcast-chain/params/v2' if launch is not None else b'pointcast-chain/params/v1', encoded)


def mandate_bytes(t):
    kinds = t['kinds']
    uint(kinds, 8)
    low, high = kinds & 65535, kinds >> 16
    encoded = uint(low | (1 if high else 0), 2)
    if low & 1 or high:
        encoded += uint(high | ((1 << 63) if low & 1 else 0), 8)
    encoded += sequence(t['channels'], string) + sequence(t['rooms'], string)
    encoded += b''.join(uint(t[k], 8) for k in ('spend_per_period', 'period_blocks', 'spend_total'))
    return encoded + sequence(t['payees'], lambda a: string(checked_address(a, 'payees'))) + uint(t['expires_at'], 8)


def tx_bytes(t):
    kind = t['type']
    if kind not in SUPPORTED_KINDS:
        raise Unsupported('tx kind: ' + str(kind))
    encoded = string(t['sender']) + uint(t['nonce'], 8)
    if kind == 'publish_block':
        uri = t.get('media_uri')
        encoded += b'\1' + string(t['channel']) + string(t['title']) + unhex(t['body_hash'], 32)
        encoded += b'\0' if uri is None else b'\1' + string(uri)
    elif kind == 'register_agent':
        encoded += b'\6' + blob(unhex(t['public_key'], 32)) + string(t['name'])
    else:
        encoded += b'\10' + string(checked_address(t['agent'], 'agent')) + mandate_bytes(t['terms'])
    return encoded


def tx_hash(stx):
    mode = stx.get('sig_mode', 'raw')
    if mode not in ('raw', 'tezos_message', 'webauthn'):
        raise Unsupported('sig_mode: ' + str(mode))
    encoded = tx_bytes(stx['tx']) + encoded_key(stx['public_key']) + blob(unhex(stx['signature']))
    encoded += {'raw': b'', 'tezos_message': b'\1', 'webauthn': b'\2'}[mode]
    return digest(b'pointcast-chain/txid/v1', encoded)


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

    @property
    def ok(self):
        return (not self.faults and not self.unsupported and not self.incomplete
                and self.total > 0 and self.verified == self.total)


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
    prev = genesis
    prev_timestamp = 0  # chain-core's genesis tip_timestamp
    headers = {}  # height -> (recomputed hash, header) for every block whose header parsed
    agents = {}
    nonces = {}  # sender -> next nonce: one per account, from 0, whatever the kind
    seen = {}  # txid -> block index
    for index, block in enumerate(blocks, 1):
        start = len(report.faults)
        incomplete = tx_root_unchecked = False
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
            for ti, stx in enumerate(txs):
                tx_start = len(report.faults)
                try:
                    t, key, mode = stx['tx'], stx['public_key'], stx.get('sig_mode', 'raw')
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
                        # Only with fully supported params: launch record 6 lets a
                        # controller or device-pass key sign for a tz1/tz2 account.
                        report.faults.append('sender/key mismatch')
                    # Stateless authorization rules from chain-core's State::authenticate
                    # and its RegisterAgent arm: they depend only on the sender's kind.
                    if mode == 'tezos_message' and (agent or key['scheme'] == 'p256'):
                        report.faults.append('tezos_message is for tz1/tz2 senders')
                    if mode == 'webauthn' and agent:
                        report.faults.append('webauthn is for tz1/tz2/pcp1 senders')
                    if t['type'] == 'register_agent' and agent:
                        report.faults.append('only humans may register agents')
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
                    reasons = (['sig_mode: ' + mode] if mode != 'raw' else []) + \
                              (['key scheme: ' + key['scheme']] if key['scheme'] != 'ed25519' else [])
                    if reasons:
                        report.unsupported.update(reasons)
                        incomplete = True
                    elif genesis is None:
                        incomplete = True  # no signing domain; the reason is in report.unsupported
                    elif not ed25519_verify(key_bytes(key), digest(b'pointcast-chain/tx/v2', string(params['chain_id']),
                                                                   genesis, tx_bytes(t)), unhex(stx['signature'])):
                        report.faults.append('tx signature invalid')
                except Unsupported as exc:
                    report.unsupported.add(str(exc))
                    incomplete = True
                except (ValueError, KeyError, TypeError, AttributeError) as exc:
                    report.faults.append('malformed tx: ' + str(exc))
                for j in range(tx_start, len(report.faults)):
                    report.faults[j] = 'tx %d: %s' % (ti, report.faults[j])
            if len(txids) == len(txs):
                if merkle_root(txids) != unhex(h['tx_root'], 32):
                    report.faults.append('tx_root mismatch')
            else:
                incomplete = tx_root_unchecked = True
                report.unchecked_tx_roots += 1
        except (ValueError, KeyError, TypeError, AttributeError) as exc:
            report.faults.append('malformed block: ' + str(exc))
        for j in range(start, len(report.faults)):
            report.faults[j] = 'block %d: %s' % (index, report.faults[j])
        valid = len(report.faults) == start and not incomplete
        report.verified += int(valid)
        report.summaries.append('block %d: %s%s' % (index, 'ok' if valid else 'incomplete' if len(report.faults) == start else 'FAILED',
                                                    ' · tx_root NOT checked: tx contents unauthenticated' if tx_root_unchecked else ''))
    report.tip = prev.hex() if prev is not None else ''
    if isinstance(document, dict):
        check_snapshot(document, params, genesis, sequencer, headers, report)
    if report.verified < report.total and not (report.faults or report.unsupported or report.incomplete):
        # Fail closed: an unverified block must always come with a named reason.
        report.faults.append('internal: %d blocks unverified without a named reason' % (report.total - report.verified))
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
        return DEVNET_GENESIS, "pcv.py's built-in pin for %s, not taken from the node" % DEVNET_URL
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
        print('fetch error: ' + str(exc), file=sys.stderr)
        return 1
    except (OSError, ValueError, TypeError, AttributeError) as exc:
        print('input error: ' + str(exc), file=sys.stderr)
        return 1
    for line in report.summaries:
        print(line)
    for fault in report.faults:
        print('FAULT: ' + fault)
    for reason in sorted(report.unsupported):
        print('UNSUPPORTED: ' + reason)
    for reason in report.incomplete:
        print('INCOMPLETE: ' + reason)
    if report.unchecked_tx_roots:
        print('tx_root NOT checked in %d blocks: their tx contents are unauthenticated' % report.unchecked_tx_roots)
    for note in report.notes:
        print(note)
    print('state_root: not checked (v1)')
    if report.ok:
        print('verified %d blocks · tip height %d hash %s · checks: genesis, links, block hashes, tx_root, seals, tx sigs · state_root not checked · faults: 0'
              % (report.total, report.total, report.tip))
    else:
        print('verification %s · blocks passing supported v1 checks: %d/%d · state_root not checked · faults: %d · unsupported: %d%s' %
              ('FAILED' if report.faults else 'INCOMPLETE', report.verified, report.total, len(report.faults),
               len(report.unsupported), ' · incomplete: %d' % len(report.incomplete) if report.incomplete else ''))
    if report.ok:
        return 0
    return 1 if report.faults else 2


if __name__ == '__main__':
    sys.exit(main())
