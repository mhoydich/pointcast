import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

import {
  BADGE_SCHEMA,
  BadgeError,
  MINT_TICKET_SCHEMA,
  RECORD_KEYS,
  SAMPLE_BADGES,
  YARD_SHA256_PIN,
  canonicalBadgeText,
  formatMintTicket,
  issueBadge,
  sha256Hex,
  verifyBadge,
} from '../src/lib/loom/merit-badge-bridge.mjs';

const shore = {
  badgeId: 'tide-watch',
  recipientHandle: '@shore',
  room: '#camp',
  earnedAt: '2026-07-04T16:30:00Z',
  evidenceUrl: 'https://pointcast.xyz/thus-camp',
};

const preimage = JSON.stringify([
  BADGE_SCHEMA,
  shore.badgeId,
  shore.recipientHandle,
  shore.room,
  shore.earnedAt,
  shore.evidenceUrl,
]);

function nodeSha256(text) {
  return createHash('sha256').update(text).digest('hex');
}

test('canonical bytes are a fixed field list and the pin is SHA-256 of those bytes', async () => {
  assert.equal(canonicalBadgeText(shore), preimage);
  assert.equal(canonicalBadgeText({ ...shore, label: 'ignored', line: 'also ignored' }), preimage);
  const reversed = {
    evidenceUrl: shore.evidenceUrl,
    earnedAt: shore.earnedAt,
    room: shore.room,
    recipientHandle: shore.recipientHandle,
    badgeId: shore.badgeId,
  };
  assert.equal(canonicalBadgeText(reversed), preimage);
  const badge = await issueBadge(shore);
  assert.equal(badge.sha256, nodeSha256(preimage));
  assert.equal(badge.sha256, await sha256Hex(preimage));
  assert.match(badge.sha256, YARD_SHA256_PIN);
  assert.deepEqual(Object.keys(badge), [...RECORD_KEYS]);
});

test('issue is deterministic across case, key order, and repeats', async () => {
  const first = await issueBadge(shore);
  const second = await issueBadge(shore);
  const folded = await issueBadge({
    badgeId: 'Tide-Watch',
    recipientHandle: '@Shore',
    room: 'Camp',
    earnedAt: shore.earnedAt,
    evidenceUrl: `${shore.evidenceUrl}#fragment`,
  });
  assert.deepEqual(first, second);
  assert.deepEqual(first, folded);
  assert.equal(Object.isFrozen(first), true);
  const again = await issueBadge(SAMPLE_BADGES[0]);
  assert.deepEqual(again, first);
});

test('every sample verifies and round-trips through JSON', async () => {
  assert.equal(SAMPLE_BADGES.length, 3);
  const pins = new Set();
  for (const sample of SAMPLE_BADGES) {
    const badge = await issueBadge(sample);
    pins.add(badge.sha256);
    const verdict = await verifyBadge(JSON.parse(JSON.stringify(badge)));
    assert.deepEqual(verdict, { ok: true, reason: 'match', sha256: badge.sha256 });
    assert.equal(badge.sha256, nodeSha256(canonicalBadgeText(badge)));
  }
  assert.equal(pins.size, SAMPLE_BADGES.length);
});

test('a changed field, a short pin, or an uppercase pin is refused', async () => {
  const badge = await issueBadge(shore);
  const cases = [
    [{ ...badge, badgeId: 'tide-watch-2' }, 'pin-mismatch'],
    [{ ...badge, recipientHandle: '@other' }, 'pin-mismatch'],
    [{ ...badge, room: '#camp-x' }, 'pin-mismatch'],
    [{ ...badge, earnedAt: '2026-07-04T16:30:01Z' }, 'pin-mismatch'],
    [{ ...badge, evidenceUrl: 'https://pointcast.xyz/loom' }, 'pin-mismatch'],
    [{ ...badge, sha256: `${badge.sha256.slice(0, -1)}${badge.sha256.endsWith('a') ? 'b' : 'a'}` }, 'pin-mismatch'],
    [{ ...badge, sha256: badge.sha256.toUpperCase() }, 'bad-pin'],
    [{ ...badge, sha256: badge.sha256.slice(0, 63) }, 'bad-pin'],
    [{ ...badge, sha256: `${badge.sha256.slice(0, -1)}g` }, 'bad-pin'],
    [{ ...badge, recipientHandle: '@Shore' }, 'not-canonical'],
    [{ ...badge, room: 'camp' }, 'not-canonical'],
    [{ ...badge, priceMutez: 1 }, 'record-shape'],
    [{ ...badge, liveMintEnabled: true }, 'record-shape'],
    [{ badgeId: badge.badgeId }, 'record-shape'],
    [null, 'not-a-record'],
    [['not', 'a', 'record'], 'not-a-record'],
  ];
  for (const [record, reason] of cases) {
    const verdict = await verifyBadge(record);
    assert.equal(verdict.ok, false, reason);
    assert.equal(verdict.reason, reason);
  }
});

test('issue rejects shapes that cannot be a stable pin', async () => {
  const bad = [
    [{ ...shore, badgeId: '-tide' }, 'badge_id'],
    [{ ...shore, badgeId: 'tide-' }, 'badge_id'],
    [{ ...shore, recipientHandle: '@' }, 'recipient_handle'],
    [{ ...shore, recipientHandle: 'has space' }, 'recipient_handle'],
    [{ ...shore, room: '#' }, 'room'],
    [{ ...shore, earnedAt: '2026-07-04T16:30:00+00:00' }, 'earned_at'],
    [{ ...shore, earnedAt: '2026-07-04T16:30:00.000Z' }, 'earned_at'],
    [{ ...shore, earnedAt: '2026-02-31T00:00:00Z' }, 'earned_at'],
    [{ ...shore, evidenceUrl: 'http://pointcast.xyz/thus-camp' }, 'evidence_url'],
    [{ ...shore, evidenceUrl: 'javascript:alert(1)' }, 'evidence_url'],
    [{ ...shore, evidenceUrl: 'https://user:pass@pointcast.xyz/thus-camp' }, 'evidence_url'],
  ];
  for (const [input, code] of bad) {
    await assert.rejects(issueBadge(input), (err) => err instanceof BadgeError && err.code === code);
  }
});

test('the Tezos ticket is unsigned, free, CC0, and withheld when the pin fails', async () => {
  const badge = await issueBadge(shore);
  const ticket = await formatMintTicket(badge);
  const again = await formatMintTicket(badge);
  assert.equal(ticket.schema, MINT_TICKET_SCHEMA);
  assert.equal(ticket.to, '#mint-queue');
  assert.equal(ticket.network, 'tezos');
  assert.deepEqual(ticket.interfaces, ['TZIP-012', 'TZIP-016', 'TZIP-021']);
  assert.equal(ticket.license, 'CC0-1.0');
  assert.match(ticket.rights, /CC0 1\.0/);
  assert.equal(ticket.rightsUri, 'https://creativecommons.org/publicdomain/zero/1.0/');
  assert.equal(ticket.priceMutez, 0);
  assert.equal(ticket.priced, false);
  assert.equal(ticket.free, true);
  assert.equal(ticket.signed, false);
  assert.equal(ticket.liveMintEnabled, false);
  assert.equal(ticket.proposalOnly, true);
  assert.equal(ticket.submits, false);
  assert.equal(ticket.sha256, badge.sha256);
  assert.equal(ticket.text, again.text);
  assert.match(ticket.text, /^#mint-queue\n/);
  assert.match(ticket.text, /signed: false/);
  assert.match(ticket.text, /liveMintEnabled: false/);
  assert.match(ticket.text, /priceMutez: 0/);
  assert.match(ticket.text, /CC0-1\.0/);
  assert.match(ticket.text, /Do not mint from this note\./);
  assert.doesNotMatch(ticket.text, /signed: true|liveMintEnabled: true|edsig|priceMutez: [1-9]/);
  for (const key of Object.keys(ticket)) {
    assert.equal(/signature|secret|private|opHash|operation/i.test(key), false, key);
  }
  assert.throws(() => { ticket.signed = true; }, TypeError);
  assert.throws(() => { ticket.liveMintEnabled = true; }, TypeError);
  const tampered = { ...badge, room: '#camp-x' };
  await assert.rejects(formatMintTicket(tampered), (err) => err instanceof BadgeError && err.code === 'ticket_refused' && err.message === 'pin-mismatch');
  await assert.rejects(formatMintTicket({ ...badge, liveMintEnabled: true }), (err) => err.code === 'ticket_refused');
});

test('the library and the sketch do not mint, and they do not touch chain pages or mcp', () => {
  const lib = readFileSync(new URL('../src/lib/loom/merit-badge-bridge.mjs', import.meta.url), 'utf8');
  const page = readFileSync(new URL('../src/pages/sketches/merit-badge-bridge.astro', import.meta.url), 'utf8');
  assert.doesNotMatch(lib, /^import /m);
  assert.doesNotMatch(lib, /\bfetch\s*\(|XMLHttpRequest|WebSocket|requestSignPayload|subtle\.sign|@taquito|BeaconWallet/);
  assert.doesNotMatch(lib, /liveMintEnabled:\s*true/);
  assert.match(lib, /signed: false/);
  assert.match(lib, /liveMintEnabled: false/);
  assert.match(page, /merit-badge-bridge\.mjs/);
  assert.match(page, /width:\s*min\(100%,\s*390px\)/);
  assert.match(page, /prefers-reduced-motion:\s*reduce/);
  assert.doesNotMatch(page, /fonts\.googleapis|cdn\.jsdelivr|unpkg\.com|cdnjs\.cloudflare|fontsource/);
  assert.doesNotMatch(lib, /from\s+['"][^'"]*chain|\/api\/mcp/);
  assert.doesNotMatch(page, /\/api\/mcp|src\/pages\/chain|public\/chain\//);
  assert.doesNotMatch(page, /<script[^>]+src=/);
  assert.doesNotMatch(page, /<link[^>]+stylesheet/);
});
