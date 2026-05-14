/**
 * bridges.test.mjs — guardrails for the outbound bridges.
 *
 * Mirrors the lib functions in src/lib/bridges.ts.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

// ─── Lib mirror ──────────────────────────────────────────────────────

function toBlueskyRecord(event, nodeHome) {
  if (event.kind === 'presence_change') return null;
  const url = event.href ? new URL(event.href, nodeHome).toString() : nodeHome;
  const text = `${event.headline}\n\n${url}`;
  const encoder = new TextEncoder();
  const textBytes = encoder.encode(text);
  const urlBytes = encoder.encode(url);
  return {
    $type: 'app.bsky.feed.post',
    text,
    createdAt: event.at,
    langs: ['en'],
    facets: [
      {
        index: { byteStart: textBytes.length - urlBytes.length, byteEnd: textBytes.length },
        features: [{ $type: 'app.bsky.richtext.facet#link', uri: url }],
      },
    ],
    embed: {
      $type: 'app.bsky.embed.external',
      external: { uri: url, title: 'PointCast', description: event.headline },
    },
  };
}

function toFarcasterCast(event, nodeHome) {
  if (event.kind === 'presence_change') return null;
  const url = event.href ? new URL(event.href, nodeHome).toString() : nodeHome;
  const room = event.room ? ` · /r/${event.room}` : '';
  let text = `${event.headline}${room}`;
  const MAX_BYTES = 320;
  const enc = new TextEncoder();
  if (enc.encode(text).length > MAX_BYTES) {
    const ellipsisBytes = enc.encode('…').length;
    let prefix = text;
    while (enc.encode(prefix).length + ellipsisBytes > MAX_BYTES && prefix.length > 0) {
      prefix = prefix.slice(0, -1);
    }
    text = prefix + '…';
  }
  return { type: 'cast', text, embeds: [{ url }], parentUrl: 'https://pointcast.xyz' };
}

function bridgeableEvents(events) {
  return events.filter((e) => e.kind !== 'presence_change');
}

function esc(s) {
  return String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;');
}

// ─── Fixtures ────────────────────────────────────────────────────────

function blockEvent() {
  return {
    id: 'blk_0480',
    at: '2026-05-14T16:45:00.000Z',
    kind: 'block_published',
    nodeId: 'pointcast',
    headline: 'POINT paper v0.1',
    href: '/b/0480',
  };
}

function presenceEvent() {
  return {
    id: 'pres_x',
    at: '2026-05-14T16:46:00.000Z',
    kind: 'presence_change',
    nodeId: 'pointcast',
    headline: 'mh joined /r/meditate',
    room: 'meditate',
  };
}

// ─── Bluesky ─────────────────────────────────────────────────────────

test('toBlueskyRecord builds a valid post record', () => {
  const r = toBlueskyRecord(blockEvent(), 'https://pointcast.xyz');
  assert.equal(r.$type, 'app.bsky.feed.post');
  assert.equal(r.createdAt, '2026-05-14T16:45:00.000Z');
  assert.ok(r.text.includes('POINT paper v0.1'));
  assert.ok(r.text.includes('https://pointcast.xyz/b/0480'));
  assert.equal(r.facets[0].features[0].uri, 'https://pointcast.xyz/b/0480');
});

test('toBlueskyRecord skips presence_change', () => {
  assert.equal(toBlueskyRecord(presenceEvent(), 'https://pointcast.xyz'), null);
});

test('toBlueskyRecord facet byte offsets point at the URL', () => {
  const r = toBlueskyRecord(blockEvent(), 'https://pointcast.xyz');
  const enc = new TextEncoder();
  const slice = enc.encode(r.text).slice(r.facets[0].index.byteStart, r.facets[0].index.byteEnd);
  const url = new TextDecoder().decode(slice);
  assert.equal(url, 'https://pointcast.xyz/b/0480');
});

// ─── Farcaster ───────────────────────────────────────────────────────

test('toFarcasterCast builds a valid cast', () => {
  const c = toFarcasterCast({ ...blockEvent(), room: 'meditate' }, 'https://pointcast.xyz');
  assert.equal(c.type, 'cast');
  assert.equal(c.text, 'POINT paper v0.1 · /r/meditate');
  assert.equal(c.embeds[0].url, 'https://pointcast.xyz/b/0480');
  assert.equal(c.parentUrl, 'https://pointcast.xyz');
});

test('toFarcasterCast truncates text over 320 bytes', () => {
  const big = blockEvent();
  big.headline = 'x'.repeat(400);
  const c = toFarcasterCast(big, 'https://pointcast.xyz');
  assert.ok(new TextEncoder().encode(c.text).length <= 320);
  assert.ok(c.text.endsWith('…'));
});

test('toFarcasterCast skips presence_change', () => {
  assert.equal(toFarcasterCast(presenceEvent(), 'https://pointcast.xyz'), null);
});

// ─── Filtering ───────────────────────────────────────────────────────

test('bridgeableEvents drops presence_change', () => {
  const out = bridgeableEvents([blockEvent(), presenceEvent()]);
  assert.equal(out.length, 1);
  assert.equal(out[0].kind, 'block_published');
});

// ─── Atom helpers ────────────────────────────────────────────────────

test('esc escapes XML special characters', () => {
  assert.equal(esc('a & b'), 'a &amp; b');
  assert.equal(esc('<x>'), '&lt;x&gt;');
  assert.equal(esc('it\'s "quoted"'), 'it&apos;s &quot;quoted&quot;');
});
