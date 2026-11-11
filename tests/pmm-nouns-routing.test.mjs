// Nouns Messenger companion routing. COMPANIONS and route() live inside public/nouns-messenger/app.js
// between the companions markers and are pure: this cuts that block out and checks, phrase by phrase,
// which reply a message reaches. Live topics must stay narrow, so notes and small talk keep the
// scripted lines they had before the companions read town data. (Named pmm-* so `npm run test:pmm`
// and the PMM and Nouns Messenger CI check run it.)
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const src = readFileSync(resolve(import.meta.dirname, '../public/nouns-messenger/app.js'), 'utf8');
const block = /\/\* companions:start \*\/\n([\s\S]*?)\/\* companions:end \*\//.exec(src)?.[1];
const { COMPANIONS, route } = new Function(`${block}\nreturn { COMPANIONS, route };`)();
const bot = (id) => COMPANIONS.find((c) => c.id === id);

// [companion, message, expected]: 'live:<reader>', 'fallback', or text the first scripted line starts with.
const TABLE = [
  // Noggles Desk
  ['desk', 'what’s new?', 'live:desk'],
  ["what's new in town?", 'live:desk'],
  ['what is happening', 'live:desk'],
  ['gm, what’s new?', 'live:desk'],
  ['any news', 'live:desk'],
  ["what's the weather today?", 'For the real sky'],
  ['where are the courts now?', 'Town map'],
  ['thanks, got it now', 'any time'],
  ['gm! what are we doing today', 'gm gm'],
  ['hello', 'hey. Desk here'],
  ['is it open?', 'Good question'],
  ['ok', 'fallback'],
  // Tide Noun
  ['tides', 'how is the water', 'live:water'],
  ['surf today?', 'live:water'],
  ['is it wetsuit cold', 'live:water'],
  ['sunset on the beach tonight?', 'live:sunset'],
  ['golden hour', 'live:sunset'],
  ['hey', 'gm from the sand'],
  ['nice', 'fallback'],
  // Court Noun
  ['courts', 'courts busy?', 'live:courts'],
  ['how is pickleball today', 'live:courts'],
  ['how long is the wait?', 'live:courts'],
  ['waiting time at rec', 'live:courts'],
  ['open play tonight?', 'live:courts'],
  ['wait, did we win?', 'Nobody remembers the score'],
  ['hey wait up', 'hey hey'],
  ['I can’t wait to play', 'fallback'],
  ['my knee hurt so I had to wait', 'Stretch the calves'],
  ['lost, busy, tired', 'Nobody remembers the score'],
  ['third shot drop tips', 'fallback'],
  ['new paddle', 'Courts: pointcast.xyz'],
  // Night Shift
  ['night', 'how is the moon tonight?', 'live:moon'],
  ['moonrise', 'live:moon'],
  ['what’s the moon doing', 'live:moon'],
  ['when does the sun come up', 'live:sun'],
  ['sunrise tomorrow?', 'live:sun'],
  ['remind me to call Dawn tomorrow', 'Written down'],
  ['remember: buy dark chocolate', 'Written down'],
  ['note: check the sky later', 'Written down'],
  ['pick up Sky from school', 'fallback'],
  ['buy a sun hat', 'fallback'],
  ['daylight savings ends sunday', 'fallback'],
  ['so tired, been up since sunrise', 'Go to bed'],
  ['idea: a sky app', 'That is a morning idea'],
  ['are the stars out?', 'live:moon'],
];

test('the companions block is present in app.js', () => {
  assert.ok(block && block.includes('const COMPANIONS') && block.includes('function route'));
  assert.deepEqual(COMPANIONS.map((c) => c.id), ['desk', 'tides', 'courts', 'night']);
});

let who = null;
for (const row of TABLE) {
  if (row.length === 3) who = row.shift();
  const [text, want] = row, id = who;
  test(`${id}: "${text}" -> ${want}`, () => {
    const got = route(bot(id), text);
    if (want.startsWith('live:')) assert.equal(got.live, want.slice(5));
    else {
      assert.equal(got.live, null, `went live (${got.live}) instead of ${want}`);
      if (want === 'fallback') assert.equal(got.lines, bot(id).fallback);
      else assert.ok(got.lines[0].startsWith(want), `got "${got.lines[0]}"`);
    }
  });
}

test('every live reader named in replies is one app.js defines', () => {
  const readers = new Set(COMPANIONS.flatMap((c) => c.replies.map((r) => r[2]).filter(Boolean)));
  for (const r of readers) assert.match(src, new RegExp(`\\n    async ${r}\\(\\)`), `LIVE.${r} is missing`);
});
