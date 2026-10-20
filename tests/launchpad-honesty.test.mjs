import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { extractCopy } from '../src/lib/nouns-money/honest-copy.mjs';
import { NM_STANDARD_LINE, NM_REPLACEMENT_LINE } from '../src/lib/nouns-money/chain-copy.mjs';
import { OFFER_WORDS, copyProblems } from '../src/lib/launchpad/copy-rules.mjs';
import { CREDIT_LINE, NOUNS_LINE } from '../src/lib/launchpad/config.mjs';
import { STRATEGIES } from '../src/lib/launchpad/strategies.mjs';

// Copy checks for the launchpad case study (plan §2.4, §8.6). They grow with each PR: this one ships the
// simulation, so scenario and strategy copy is scanned with nothing excused. The page checks arrive with the page.
const root = new URL('../', import.meta.url);
const read = (path) => readFileSync(new URL(path, root), 'utf8');
const LIB = new URL('src/lib/launchpad/', root);
const IMPURE = [/\bfetch\s*\(/, /WebSocket/, /XMLHttpRequest/, /Date\.now/, /new Date\(/, /Math\.random/, /localStorage/, /sessionStorage/];
const NM_LINES = [NM_STANDARD_LINE, NM_REPLACEMENT_LINE];
const SCENARIO_DIR = new URL('src/data/launchpad/scenarios/', root);

function strings(value, out = []) {
  if (typeof value === 'string') out.push(value);
  else if (Array.isArray(value)) value.forEach((v) => strings(v, out));
  else if (value && typeof value === 'object') Object.values(value).forEach((v) => strings(v, out));
  return out;
}

/** The Nouns line is the one place "Nouns treasury" may appear; nothing else is excused. */
function assertClean(text, label) {
  assert.deepEqual(copyProblems(text, { approved: [NOUNS_LINE] }), [], `${label} passes the copy rules`);
  for (const line of NM_LINES) assert.ok(!text.includes(line), `${label} carries no Nouns Money chain line`);
}

test('src/lib/launchpad is pure: no network, clock, storage or unseeded randomness', () => {
  const files = readdirSync(LIB).filter((f) => f.endsWith('.mjs'));
  assert.ok(files.length > 0);
  for (const file of files) {
    const src = readFileSync(new URL(file, LIB), 'utf8');
    for (const banned of IMPURE) assert.doesNotMatch(src, banned, `${file} avoids ${banned}`);
  }
});

test('the extra list is the plan’s pattern, and the rules catch what they must', () => {
  assert.equal(OFFER_WORDS.source, String.raw`\b(invest\w*|shares?|backed|redeemable|returns?|profit\w*|yield\w*|guaranteed|worth|main\s*net|cash(?:es|ing)? out)\b`);
  assert.equal(OFFER_WORDS.flags, 'i');
  for (const bad of ['PUMP', 'official Nouns', 'cashes out', 'main net', 'NM27-1', 'nm100-004', '$NOUNS', 'Nouns treasury coin', 'tip jar', 'balance']) {
    assert.ok(copyProblems(bad, { viewer: true }).length, `refuses “${bad}”`);
  }
  assert.ok(copyProblems('USDC', { viewer: true }).length && !copyProblems('USDC', {}).length, 'viewer text may not use a unit word at all');
  assert.ok(copyProblems('100 SOL', {}).length, 'page copy may not price in a real unit');
  assert.deepEqual(copyProblems(NOUNS_LINE, { approved: [NOUNS_LINE] }), []);
  assert.deepEqual(copyProblems(CREDIT_LINE), []);
});

test('scenario and strategy copy passes with nothing excused', () => {
  const files = readdirSync(SCENARIO_DIR).filter((f) => f.endsWith('.json'));
  assert.equal(files.length, 4);
  for (const file of files) assertClean(strings(JSON.parse(readFileSync(new URL(file, SCENARIO_DIR), 'utf8'))).join('\n'), `scenario ${file}`);
  for (const s of Object.values(STRATEGIES)) assertClean(`${s.label}\n${s.description}`, `strategy ${s.id}`);
  assertClean(extractCopy(read('src/lib/launchpad/strategies.mjs'), 'strategies.mjs'), 'strategy reasons');
});
