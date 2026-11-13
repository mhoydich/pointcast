import test from 'node:test';
import assert from 'node:assert/strict';
import { handleLoom } from '../src/lib/loom/service.mjs';
import { parseBotName } from '../src/lib/loom/bot-page.mjs';
import { serveBot } from '../src/lib/loom/bot-route.mjs';

function memoryKv() {
  const map = new Map();
  return { map, get: async (k) => map.get(k) ?? null, put: async (k, v) => { map.set(k, v); } };
}
const post = async (kv, body, n = 0) => {
  const res = await handleLoom(new Request('https://pointcast.xyz/api/loom', { method: 'POST', headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': `10.0.0.${n}` }, body: JSON.stringify(body) }), { kv, clock: () => new Date(Date.UTC(2026, 10, 13, 9, 0, n)) });
  return res.json();
};
const get = async (kv, path) => { const res = await serveBot(new Request(`https://pointcast.xyz/loom/bot/${path}`), kv, path); return { res, text: await res.text() }; };
const hem = { name: 'Hem', kind: 'agent', address: '@hem', operator: 'Mike' };

async function fixture() {
  const kv = memoryKv();
  await post(kv, { to: '@hem', from: hem, kind: 'note', body: 'I am Hem, a bot for Mike. I draft posters. I never sell.' }, 1);
  await post(kv, { to: '@hem', from: { name: 'Stranger', kind: 'human' }, kind: 'note', body: 'hello hem' }, 2);
  await post(kv, { to: '#officenoun', from: hem, kind: 'note', body: 'poster one done' }, 3);
  await post(kv, { to: '@hem', from: hem, kind: 'note', body: 'Left off: posters 5 to 8 drawn, waiting on repo access.' }, 4);
  for (let i = 1; i <= 4; i++) await post(kv, { to: '#officenoun', from: hem, kind: 'note', body: `later post ${i}` }, 4 + i);
  return kv;
}

test('bot names: Loom handle grammar, case-folded', () => {
  assert.equal(parseBotName('Hem'), 'hem');
  assert.equal(parseBotName('a.b-c_1/'), 'a.b-c_1');
  for (const bad of ['', '@hem', '-x', '.x', 'a b', 'x'.repeat(33), '../etc', 'a/b', '<script>', '%40hem']) assert.equal(parseBotName(bad), null, bad);
});

test('card, left-off note, last five posts newest first, how-to', async () => {
  const kv = await fixture();
  const { res, text } = await get(kv, 'hem');
  assert.equal(res.status, 200);
  assert.match(res.headers.get('Content-Type'), /^text\/plain; charset=utf-8/);
  assert.equal(res.headers.get('X-Robots-Tag'), 'noindex');
  assert.match(res.headers.get('Cache-Control'), /max-age=60/);
  assert.match(text, /self-declared/);
  const card = text.split('LEFT OFF')[0];
  assert.match(card, /I am Hem, a bot for Mike/);
  assert.ok(!card.includes('hello hem'));
  const left = text.split('LEFT OFF')[1].split('LAST FIVE')[0];
  assert.match(left, /posters 5 to 8 drawn/);
  const five = text.split('LAST FIVE POSTS (newest first)')[1].split('OPEN QUESTIONS')[0].trim().split('\n');
  assert.equal(five.length, 5);
  assert.match(five[0], /later post 4/);
  assert.match(five[3], /later post 1/);
  assert.match(five[4], /Left off: posters 5 to 8/);
  assert.ok(five[0] > '' && five[0].includes('to #officenoun'));
  assert.match(text, /be hem on the pointcast loom/);
  assert.match(text, /POST https:\/\/pointcast\.xyz\/api\/loom/);
  assert.match(text, /\/api\/mcp/);
});

test('card only: no left-off note says so', async () => {
  const kv = memoryKv();
  await post(kv, { to: '@solo', from: { name: 'solo', kind: 'agent' }, kind: 'note', body: 'card text' }, 1);
  const { text } = await get(kv, 'solo');
  assert.match(text, /card text/);
  assert.match(text, /No left-off note yet/);
});

test('open question naming the bot is listed, then dropped once answered', async () => {
  const kv = await fixture();
  const q = await post(kv, { to: '#officenoun', from: { name: 'Mike', kind: 'human' }, kind: 'question', body: '@hem should poster 9 use the red office?' }, 20);
  let { text } = await get(kv, 'hem');
  const open = text.split('OPEN QUESTIONS NAMING @hem')[1].split('HOW TO POST')[0];
  assert.ok(open.includes(q.address), open);
  assert.match(open, /should poster 9 use the red office/);
  await post(kv, { to: q.address, from: hem, kind: 'answer', body: 'Yes, red office.' }, 21);
  ({ text } = await get(kv, 'hem'));
  assert.match(text.split('OPEN QUESTIONS NAMING @hem')[1].split('HOW TO POST')[0], /none open/);
});

test('unknown handle and bad name are plain-text 404s', async () => {
  const kv = memoryKv();
  const a = await get(kv, 'ghost');
  assert.equal(a.res.status, 404);
  assert.match(a.res.headers.get('Content-Type'), /text\/plain/);
  assert.match(a.text, /Post the card first/);
  const b = await get(kv, '%40bad name');
  assert.equal(b.res.status, 404);
  assert.match(b.text, /Not a Loom handle/);
  assert.equal((await serveBot(new Request('https://pointcast.xyz/loom/bot/hem', { method: 'POST' }), kv, 'hem')).status, 405);
});

test('no edit tokens or token hashes leak', async () => {
  const kv = memoryKv();
  const r = await post(kv, { to: '@hem', from: hem, kind: 'note', body: 'card' }, 1);
  await post(kv, { to: '#t', from: { name: 'M', kind: 'human' }, kind: 'question', body: '@hem why' }, 2);
  const { text } = await get(kv, 'hem');
  assert.ok(!text.includes(r.editToken));
  assert.ok(!/tokenHash|editToken/i.test(text));
  const hash = [...kv.map.values()].join('').match(/"tokenHash":"([0-9a-f]+)"/)[1];
  assert.ok(!text.includes(hash));
});
