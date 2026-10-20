import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { extractCopy } from '../src/lib/nouns-money/honest-copy.mjs';
import { NM_STANDARD_LINE, NM_REPLACEMENT_LINE } from '../src/lib/nouns-money/chain-copy.mjs';
import { OFFER_WORDS, UNIT_WORDS, copyProblems } from '../src/lib/launchpad/copy-rules.mjs';
import { CREDIT_LINE, NOUNS_LINE } from '../src/lib/launchpad/config.mjs';
import { STRATEGIES } from '../src/lib/launchpad/strategies.mjs';
import { machineEdition, SOURCES, SCENARIOS, AUTHOR } from '../src/lib/launchpad/exhibits.mjs';
import { coinSVG } from '../src/lib/launchpad/coin-art.mjs';

// Copy checks for the launchpad case study (plan §2.4, §8.6). Page, twin, SVG, scenario and strategy copy are
// scanned with nothing excused; the cited Sources are scanned on their own with only their titles and URLs excused.
const root = new URL('../', import.meta.url);
const read = (path) => readFileSync(new URL(path, root), 'utf8');
const LIB = new URL('src/lib/launchpad/', root);
const IMPURE = [/\bfetch\s*\(/, /WebSocket/, /XMLHttpRequest/, /Date\.now/, /new Date\(/, /Math\.random/, /localStorage/, /sessionStorage/];
const NM_LINES = [NM_STANDARD_LINE, NM_REPLACEMENT_LINE];

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

const decode = (html) => html
  .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
  .replace(/&(?:rsquo|lsquo);/g, "'").replace(/&(?:rdquo|ldquo|quot);/g, '"').replace(/&nbsp;/g, ' ')
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const visible = (html) => decode(html.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ');

/** The element that opens at `start`, through its matching close tag, counting nested tags of the same name. */
function element(html, start, tag) {
  const re = new RegExp(`<${tag}\\b|</${tag}>`, 'g');
  re.lastIndex = start;
  let depth = 0;
  for (let m = re.exec(html); m; m = re.exec(html)) {
    depth += m[0].startsWith('</') ? -1 : 1;
    if (depth === 0) return html.slice(start, m.index + m[0].length);
  }
  return null;
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
  for (const s of SCENARIOS) assertClean(strings(s).join('\n'), `scenario ${s.id}`);
  for (const s of Object.values(STRATEGIES)) assertClean(`${s.label}\n${s.description}`, `strategy ${s.id}`);
  assertClean(extractCopy(read('src/lib/launchpad/strategies.mjs'), 'strategies.mjs'), 'strategy reasons');
});

test('the page copy passes, says what the credits are, and carries the Nouns line and the byline', () => {
  const src = read('src/pages/case-studies/launchpad.astro');
  assertClean(extractCopy(src, 'launchpad.astro'), 'launchpad.astro');
  assert.match(CREDIT_LINE, /^Play credits only\. No value, may reset\. No real funds\. Credits never leave this page\.$/);
  for (const use of ['{CREDIT_LINE}', '{NOUNS_LINE}', 'author={AUTHOR}', 'creator={AUTHOR}', ' isolated ', 'includeManifest={false}', ' noindex ', 'data-launchpad-copy', 'data-launchpad-sources']) {
    assert.ok(src.includes(use), `page uses ${use}`);
  }
  assert.equal(AUTHOR, 'Claude Code for PointCast');
  const stageC = src.slice(src.indexOf('id="next-title"'), src.indexOf('</section>', src.indexOf('id="next-title"')));
  assert.doesNotMatch(stageC, UNIT_WORDS, 'the stage C summary names no real unit');
  assert.match(stageC, /None of that is planned or built/);
  for (const svg of src.match(/<svg\b[\s\S]*?<\/svg>/g)) assert.match(svg, /<title\b/, 'each chart has a title');
  assert.equal((src.match(/<details class="lp-data"/g) ?? []).length, 2, 'each chart has a data table');
});

test('the machine edition passes, with explicit flags and the same byline', () => {
  const edition = machineEdition();
  assert.equal(edition.author, AUTHOR);
  assert.equal(edition.standing, `${CREDIT_LINE} Nothing here is an offer or a market.`);
  assert.equal(edition.nouns, NOUNS_LINE);
  assert.deepEqual([edition.simulation.realFunds, edition.simulation.paymentProcessing, edition.simulation.protocolComplianceClaim], [false, false, false]);
  assert.match(edition.simulation.storage, /in-memory/);
  assertClean(strings({ ...edition, sources: null }).join('\n'), 'launchpad.json');
  assert.equal(edition.poolFeeTiers.length, 25);
});

test('Sources are scanned on their own, with only their exact titles and URLs excused', () => {
  for (const s of SOURCES) {
    assert.deepEqual(copyProblems(`${s.title}\n${s.url}\n${s.note}`, { approved: [s.title, s.url] }), [], s.title);
  }
});

test('coins are simulated Noun portraits that say play credits, not Nouns Money notes', () => {
  for (const s of SCENARIOS) {
    for (const l of s.launches) {
      const svg = coinSVG({ scenarioId: s.id, symbol: l.symbol, name: l.name, nounId: l.nounId });
      const label = svg.match(/aria-label="([^"]*)"/)[1];
      const title = svg.match(/<title>([^<]*)<\/title>/)[1];
      assert.equal(title, label);
      assert.match(label, /a simulated coin showing actual Noun #\d+\. Play credits only; no value\.$/);
      assertClean(decode(`${label}\n${title}`), `${s.id} ${l.symbol} coin`);
    }
  }
  assert.doesNotMatch(read('src/lib/launchpad/coin-art.mjs'), /security\.mjs|security-edition|NOUNS MONEY/);
  assert.match(read('src/lib/launchpad/coin-art.mjs'), /`SIMULATED · NOUN \$\{nounId\}`/, 'every coin carries the SIMULATED ribbon');
});

const BUILT = 'dist/case-studies/launchpad/index.html';

test('when a build exists, the built page passes too: its own content, isolated layout, byline and noindex', { skip: !existsSync(new URL(BUILT, root)) }, () => {
  const html = read(BUILT);
  const start = html.search(/<article class="lp" data-launchpad-copy/);
  assert.ok(start >= 0, 'the page’s content root is present');
  const article = element(html, start, 'article');
  assert.ok(article);
  const sourcesAt = article.search(/<section\b[^>]*data-launchpad-sources/);
  assert.ok(sourcesAt >= 0, 'the Sources list is marked');
  const sources = element(article, sourcesAt, 'section');
  const body = article.replace(sources, ' ');
  const text = visible(body);
  assertClean(text, 'built page');
  for (const phrase of ['Play credits only', 'No value, may reset', 'Not a Nouns token']) assert.ok(text.includes(phrase), `built page says “${phrase}”`);
  assert.deepEqual(copyProblems(visible(sources), { approved: SOURCES.flatMap((s) => [s.title, s.url]) }), [], 'built Sources list');
  for (const s of ['data-pointcast-tezos-session-bridge', '/api/auth/session', '/api/analytics', '/api/room', '/api/wire-events', 'pc-layers.js', 'rel="manifest"']) assert.ok(!html.includes(s), `isolated layout: no ${s}`);
  assert.match(html, /<meta name="author" content="Claude Code for PointCast"/);
  assert.doesNotMatch(html, /<meta name="author" content="Mike Hoydich"/);
  assert.match(html, /<meta name="robots" content="noindex, nofollow"/);
  const sitemap = new URL('dist/sitemap-0.xml', root);
  if (existsSync(sitemap)) assert.ok(!readFileSync(sitemap, 'utf8').includes('/case-studies/launchpad/'), 'the sitemap does not list the page');
});
