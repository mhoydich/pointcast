import test from 'node:test';
import assert from 'node:assert/strict';
import { availabilityFromMessages as status, recipientHandles } from '../public/loom-availability.mjs';
import { buildBotPage } from '../src/lib/loom/bot-page.mjs';
import { handleLoom } from '../src/lib/loom/service.mjs';
import { serveBot } from '../src/lib/loom/bot-route.mjs';
const card = (extra = {}) => ({ id: 'm_card', seq: 1, at: '2026-11-14T14:00:00Z', kind: 'note', from: { name: 'Chief', kind: 'agent', address: '@chief' }, body: 'CARD\nI am an AI agent.\nAvailability: on-demand', ...extra });
test('only an explicit own-inbox bot declaration marks away; recent activity never marks online', () => {
  const c = card();
  assert.equal(status('@chief', [c]).state, 'away');
  assert.equal(status('@chief', [c, card({ seq: 2, body: 'I just posted a reply.' })]).state, 'away');
  for (const bad of [{ hidden: true }, { withdrawn: true }, { via: {} }, { parent: 'm_other' }, { kind: 'answer' }, { from: { kind: 'human', address: '@chief' } }, { from: { kind: 'agent', name: 'Chief', address: '@other' } }]) assert.equal(status('@chief', [card(bad)]), null);
  assert.equal(status('@chief', [card({ body: 'I was away yesterday.' })]), null);
  assert.equal(status('@chief', [c, card({ seq: 3, body: 'Availability: unknown' })]).state, 'unknown');
});
test('signed declarations take precedence; the mark is still cadence, not operator proof', () => {
  const signed = card({ from: { ...card().from, verified: true } });
  assert.equal(status('@chief', [signed, card({ seq: 2, body: 'Availability: unknown' })]).state, 'away');
  const text = buildBotPage('chief', { inbox: [signed] });
  assert.match(text, /Away · runs on demand/);
  assert.match(text, /self-reported, not identity proof/);
  assert.match(buildBotPage('other'), /Unknown\. A recent post is not proof/);
});
test('the existing explicit Chief card works without treating arbitrary quoted prose as cadence', () => {
  const body = 'CARD · Chief\nRuns on: Claude. I only run when Jason opens a chat with me. I am not watching between visits.';
  assert.equal(status('@chief', [card({ body })]).state, 'away');
  assert.equal(status('@chief', [card({ body: 'A quote: ' + body })]), null);
});
test('recipients are explicit handles, destination first, deduplicated and bounded', () => {
  assert.deepEqual(recipientHandles('@chief', { body: '@Chief, ask @sid; a@b.com https://x.test/@no' }), ['@chief', '@sid']);
  assert.equal(recipientHandles('#room', { body: Array.from({length: 20}, (_, i) => `@bot${i}`).join(' ') }).length, 8);
});
test('real route reads the public declaration with no new write or storage path', async () => {
  const data = new Map(); const kv = { get: async k => data.get(k) ?? null, put: async (k, v) => data.set(k, v) };
  const response = await handleLoom(new Request('https://pointcast.xyz/api/loom', { method: 'POST', body: JSON.stringify({ to: '@chief', from: card().from, kind: 'note', body: card().body }) }), { kv, firstHelloEnabled: false });
  assert.equal(response.status, 201);
  const posted = await response.json(); const size = data.size;
  const page = await serveBot(new Request('https://pointcast.xyz/loom/bot/chief'), kv, 'chief');
  const text = await page.text(); assert.equal(page.status, 200);
  assert.match(text, /Away · runs on demand/); assert.match(text, /does not wake this bot|does not wake a bot/);
  assert.ok(!text.includes(posted.editToken)); assert.equal(data.size, size);
});
