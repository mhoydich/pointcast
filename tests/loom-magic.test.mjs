// Magic words (OFF-49 A): shout, dice, time, drum, noun. The server fills the fact in at send
// time; the page shows it as plain text and keeps effects behind a tap and one off switch.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { handleLoom } from '../src/lib/loom/service.mjs';
import { magicWord, makeMagic, nounFor } from '../src/lib/loom/magic.mjs';
import { NOUN_ACCESSORIES, NOUN_BODIES, NOUN_GLASSES, NOUN_HEADS } from '../src/lib/loom/noun-traits.mjs';
import { renderPortrait } from '../src/lib/nouns-parts.mjs';

const imageData = JSON.parse(readFileSync(new URL('../public/images/nouns-money/source-100/sources/official-image-data.json', import.meta.url), 'utf8'));

function memoryKv() {
  const map = new Map();
  return { map, get: async (k) => map.get(k) ?? null, put: async (k, v) => { map.set(k, v); } };
}
const ORIGIN = 'https://pointcast.xyz';
const call = (kv, path, init, opts = {}) => handleLoom(new Request(new URL(path, ORIGIN), init), { kv, firstHelloEnabled: false, ...opts });
const post = async (kv, body, opts) => (await call(kv, '/api/loom', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }, opts)).json();
const read = async (kv, to) => (await call(kv, `/api/loom?to=${encodeURIComponent(to)}`)).json();
const say = (kv, body, name = 'Ana', opts) => post(kv, { to: '#magic', from: { name, kind: 'human' }, body }, opts);

test('the word must stand alone on the first line: trimmed, any case, no punctuation', () => {
  for (const ok of ['dice', '  dice  ', 'DICE', 'Dice\nwhat a night', 'shout\nWE WON', 'time', 'drum', 'noun']) assert.ok(magicWord(ok), ok);
  for (const no of ['Dice!', 'dice roll please', 'roll the dice', 'hello\ndice', 'dice.', '', 'dices']) assert.equal(magicWord(no), null, no);
});

test('dice: the server rolls 1 to 6; the body stays exactly as typed', async () => {
  const kv = memoryKv();
  const seen = new Set();
  for (let i = 0; i < 40; i += 1) seen.add((await makeMagic('dice')).value);
  assert.ok([...seen].every((v) => Number.isInteger(v) && v >= 1 && v <= 6));
  assert.ok(seen.size > 1, 'more than one face across 40 rolls');
  const made = await say(kv, 'Dice\ngood luck');
  assert.equal(made.message.body, 'Dice\ngood luck');
  assert.equal(made.message.magic.word, 'dice');
  assert.ok(made.message.magic.value >= 1 && made.message.magic.value <= 6);
  assert.equal(made.message.magic.source, 'the Loom server');
  assert.ok(made.message.magic.at);
  const log = await read(kv, '#magic');
  assert.deepEqual(log.messages[0].magic, made.message.magic);
});

test('a client can never supply magic, and near-misses get none', async () => {
  const kv = memoryKv();
  const forged = await post(kv, { to: '#magic', from: { name: 'Eve', kind: 'human' }, body: 'dice', magic: { word: 'dice', value: 6, source: 'trust me' } });
  assert.notEqual(forged.message.magic.source, 'trust me');
  const plain = await post(kv, { to: '#magic', from: { name: 'Eve', kind: 'human' }, body: 'hello', magic: { word: 'dice', value: 6 } });
  assert.equal(plain.message.magic, undefined);
  for (const body of ['dice roll please', 'Dice!']) assert.equal((await say(kv, body)).message.magic, undefined, body);
  assert.equal((await say(kv, '  dice  ')).message.magic.word, 'dice');
  const log = await read(kv, '#magic');
  assert.equal(log.messages.find((m) => m.body === 'hello').magic, null);
});

test('time says New York and UTC from the server clock', async () => {
  const kv = memoryKv();
  const made = await say(kv, 'time', 'Ana', { clock: () => new Date('2026-11-13T16:42:00Z') });
  assert.deepEqual(made.message.magic.value, { newYork: '11:42am', newYorkDay: 'Fri Nov 13', zone: 'New York', utc: '16:42', utcDay: '2026-11-13' });
  assert.equal(made.message.magic.source, 'the Loom server clock');
});

test('drum reads the injected counter, and says so when it is out of reach', async () => {
  const kv = memoryKv();
  let reads = 0;
  const drumCount = async () => { reads += 1; return 77317; };
  assert.equal((await say(kv, 'drum', 'Ana', { drumCount })).message.magic.value, 77317);
  await say(kv, 'no drum here', 'Ana', { drumCount });
  assert.equal(reads, 1, 'the counter is read only for the word');
  assert.equal((await say(kv, 'drum', 'Ana', { drumCount: async () => null })).message.magic.value, null);
  assert.equal((await say(kv, 'drum', 'Ana', { drumCount: async () => { throw new Error('down'); } })).message.magic.value, null);
  assert.equal((await say(kv, 'drum')).message.magic.value, null);
});

test('noun: the same name gets the same Noun, another name a different one, all real trait names', async () => {
  const kv = memoryKv();
  const a = (await say(kv, 'noun', 'Ana')).message.magic.value;
  const again = (await say(kv, 'noun', '  ANA ')).message.magic.value;
  const b = (await say(kv, 'noun', 'Bo')).message.magic.value;
  assert.deepEqual(a, again);
  assert.notDeepEqual(a, b);
  assert.deepEqual(Object.keys(a).sort(), ['accessory', 'background', 'body', 'glasses', 'head']);
  assert.ok(renderPortrait(a).svg.startsWith('<svg'), 'trait names draw with the existing renderer');
  assert.deepEqual(await nounFor('ana'), a);
});

test('noun trait lists match the official image data', () => {
  assert.deepEqual(NOUN_BODIES, imageData.images.bodies.map((x) => x.filename));
  assert.deepEqual(NOUN_ACCESSORIES, imageData.images.accessories.map((x) => x.filename));
  assert.deepEqual(NOUN_HEADS, imageData.images.heads.map((x) => x.filename));
  assert.deepEqual(NOUN_GLASSES, imageData.images.glasses.map((x) => x.filename));
});

test('edits keep the original magic; removing the word hides it, putting it back restores it', async () => {
  const kv = memoryKv();
  const made = await say(kv, 'dice');
  const edit = (body) => post(kv, { action: 'edit', to: made.address, token: made.editToken, body, magic: { word: 'dice', value: 1 } });
  await edit('dice\nfor the window seat');
  let m = (await read(kv, '#magic')).messages[0];
  assert.deepEqual(m.magic, made.message.magic);
  await edit('never mind');
  m = (await read(kv, '#magic')).messages[0];
  assert.equal(m.magic, null);
  await edit('DICE');
  m = (await read(kv, '#magic')).messages[0];
  assert.deepEqual(m.magic, made.message.magic, 'an edit can never re-roll');
});

/* ---- the page ---- */
const SOURCE = readFileSync(new URL('../src/pages/loom/index.astro', import.meta.url), 'utf8');
const between = (s, a, b) => { const i = s.indexOf(a) + a.length; return s.slice(i, s.indexOf(b, i)); };
const CSS = between(SOURCE, '<style is:inline>', '</style>');
const BODY = between(SOURCE, '<body>', '<script is:inline>');
const JS = between(SOURCE, '<script is:inline>', '</script>');
const open = [];
test.afterEach(() => { while (open.length) open.pop().close(); });
const settle = async (w, ms = 60) => { for (let i = 0; i < 6; i += 1) await new Promise((r) => w.setTimeout(r, ms / 6)); };
async function page(kv, { magic } = {}) {
  const dom = new JSDOM(`<!doctype html><html><head><style>${CSS}</style></head><body>${BODY}</body></html>`, {
    url: `${ORIGIN}/loom?to=%23magic`, runScripts: 'outside-only', pretendToBeVisual: true,
  });
  const w = dom.window;
  open.push(w);
  w.localStorage.setItem('loom.name', 'tester');
  if (magic) w.localStorage.setItem('loom.magic', magic);
  w.fetch = async (url, init = {}) => { const { signal, cache, ...rest } = init; return call(kv, new URL(url, ORIGIN).href, rest); };
  w.HTMLElement.prototype.scrollIntoView = () => {};
  w.eval(JS);
  await settle(w);
  return w;
}
const msg = (w, id) => w.document.getElementById(`msg-${id}`);

test('the page shows each fact as text, shout set large, body unchanged', async () => {
  const kv = memoryKv();
  const dice = await say(kv, 'dice');
  const time = await say(kv, 'time', 'Ana', { clock: () => new Date('2026-11-13T16:42:00Z') });
  const drum = await say(kv, 'drum', 'Ana', { drumCount: async () => 77317 });
  const lost = await say(kv, 'drum');
  const noun = await say(kv, 'noun');
  const shout = await say(kv, 'shout\nWE WON');
  const w = await page(kv);
  const fact = (m) => msg(w, m.message.id).querySelector('.magic')?.textContent ?? '';
  assert.match(fact(dice), new RegExp(`rolled a ${dice.message.magic.value} · by the Loom server`));
  assert.equal(msg(w, dice.message.id).querySelector('.text').textContent, 'dice');
  assert.match(fact(time), /^11:42am in New York · 16:42 UTC · from the Loom server clock$/);
  assert.match(fact(drum), /77,317 drum hits/);
  assert.match(fact(drum), /read by the Loom server at/);
  assert.match(fact(lost), /the drum’s count was out of reach/);
  assert.match(fact(noun), /^noun: .+ head, .+ glasses, .+ body, .+ accessory, (cool|warm) background/);
  const big = msg(w, shout.message.id);
  assert.ok(big.classList.contains('shout'));
  assert.equal(big.querySelector('.text').textContent, 'shout\nWE WON');
  assert.equal(big.querySelector('.magic'), null);
  assert.ok(msg(w, dice.message.id).querySelector('button.die[data-act="magic"]'), 'the die waits for a tap');
  assert.ok(!msg(w, dice.message.id).querySelector('.die').classList.contains('rolling'), 'no motion before a tap');
  msg(w, dice.message.id).querySelector('button.die').click();
  assert.ok(msg(w, dice.message.id).querySelector('.die').classList.contains('rolling'), 'the roll plays after a tap');
});

test('Magic words off: no effects, the fact text stays', async () => {
  const kv = memoryKv();
  const dice = await say(kv, 'dice');
  const shout = await say(kv, 'shout\nhey');
  const w = await page(kv);
  w.document.getElementById('menuBtn').click();
  const sw = w.document.getElementById('magicSwitch');
  assert.equal(sw.textContent, 'Magic words: on');
  sw.click();
  await settle(w);
  assert.equal(w.localStorage.getItem('loom.magic'), '0');
  assert.ok(!msg(w, shout.message.id).classList.contains('shout'));
  assert.equal(msg(w, dice.message.id).querySelector('.magic button'), null, 'no tap target in the fact line');
  assert.match(msg(w, dice.message.id).querySelector('.magic').textContent, /rolled a \d · by the Loom server/);
  // it sticks across a reload
  const again = await page(kv, { magic: '0' });
  assert.ok(!msg(again, shout.message.id).classList.contains('shout'));
  assert.match(msg(again, dice.message.id).querySelector('.magic').textContent, /rolled a/);
});

test('the page never trusts a hand-made magic shape', async () => {
  const kv = memoryKv();
  const made = await say(kv, 'dice');
  const raw = JSON.parse(kv.map.get([...kv.map.keys()].find((k) => k.startsWith('loom:log:'))));
  raw.ops[0].magic = { word: 'dice', value: '<img src=x onerror=alert(1)>' };
  kv.map.set([...kv.map.keys()].find((k) => k.startsWith('loom:log:')), JSON.stringify(raw));
  const w = await page(kv);
  assert.equal(msg(w, made.message.id).querySelector('.magic'), null);
  assert.equal(w.document.querySelector('img[src=x]'), null);
});
