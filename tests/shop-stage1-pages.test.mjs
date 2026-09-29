import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (relPath) => readFileSync(join(ROOT, relPath), 'utf8');

function walk(relDir) {
  const out = [];
  const abs = join(ROOT, relDir);
  for (const name of readdirSync(abs)) {
    const relPath = join(relDir, name);
    if (statSync(join(ROOT, relPath)).isDirectory()) out.push(...walk(relPath));
    else out.push(relPath);
  }
  return out;
}

const REL_SPONSORED_RE = /rel=(["'])[^"']*\bsponsored\b[^"']*\1/;
const AFFILIATE_VOCAB_RE = /PaidLink|resolvePaidLink|affiliate-programs/;
const TRACKING_PARAM_RE = /avantlink|skimlinks|flexoffers|uppromote|amzn\.to|[?&](tag|ref|aff\w*)=/i;
const CANNABIS_RE = /good ?feels|thc|cannabis/i;

// ── Register sources stay affiliate-free ────────────────────────────────

const REGISTER_SOURCES = [
  ...walk('src/pages/paddles'),
  'src/pages/paddles.json.ts',
  'src/lib/paddle-register.ts',
  'src/lib/paddle-calendar.ts',
];

test('register sources: no PaidLink, resolvePaidLink or affiliate-programs vocabulary', () => {
  for (const rel of REGISTER_SOURCES) {
    const source = read(rel);
    assert.doesNotMatch(source, AFFILIATE_VOCAB_RE, `${rel} must not reference PaidLink/resolvePaidLink/affiliate-programs`);
  }
});

test('register sources: no rel="...sponsored..." attribute (prose may still say "sponsored players")', () => {
  for (const rel of REGISTER_SOURCES) {
    const source = read(rel);
    assert.doesNotMatch(source, REL_SPONSORED_RE, `${rel} must not carry a sponsored rel attribute`);
  }
  // The calendar's own prose is allowed to use the word "sponsored" (e.g. "sponsored players");
  // this suite only forbids it landing in a rel attribute.
});

// ── Paddle JSON stays free of tracking parameters ───────────────────────

const PADDLE_JSON_SOURCES = [
  'src/pages/paddles.json.ts',
  'src/pages/paddles/[id].json.ts',
  'src/pages/paddles/fund.json.ts',
  'src/pages/reviews/paddles.json.ts',
  'src/pages/reviews/paddles/[id].json.ts',
  'src/data/paddle-register.json',
  // The takes the review JSON is built from. Stage 1 has no approved
  // program, so no tracked link belongs here yet; the first approval is
  // the moment to narrow this guard on purpose, not by accident.
  'src/data/paddle-reviews.ts',
];

test('review JSON: the affiliate field goes through the approval lock, never raw', () => {
  for (const rel of ['src/pages/reviews/paddles.json.ts', 'src/pages/reviews/paddles/[id].json.ts']) {
    const source = read(rel);
    assert.match(source, /affiliate:\s*publicAffiliate\(take\.affiliate\)/, `${rel} must publish affiliate only via publicAffiliate()`);
    assert.doesNotMatch(source, /affiliate:\s*take\.affiliate\b/, `${rel} must never copy take.affiliate straight through`);
  }
});

test('paddle JSON: no known affiliate network names or tracking query params', () => {
  for (const rel of PADDLE_JSON_SOURCES) {
    const source = read(rel);
    assert.doesNotMatch(source, TRACKING_PARAM_RE, `${rel} must not carry affiliate network names or tracking params`);
  }
});

// ── PaidLink.astro shape ────────────────────────────────────────────────

test('PaidLink: exactly one <a, with sponsored noopener, no forbidden hiding tricks', () => {
  const source = read('src/components/PaidLink.astro');
  const anchorCount = (source.match(/<a\b/g) || []).length;
  assert.equal(anchorCount, 1, 'PaidLink.astro must contain exactly one <a');
  assert.match(source, /rel="sponsored noopener"/, 'the anchor must carry rel="sponsored noopener"');
  assert.doesNotMatch(source, /sr-only|visually-hidden|display:\s*none/i, 'the disclosure must never be hidden');
});

test('PaidLink: the link and the disclosure share one wrapper, and the unpaid branch has no link', () => {
  const source = read('src/components/PaidLink.astro');
  const wrapperMatch = source.match(/<span class="paidlink">([\s\S]*)<\/span>/);
  assert.ok(wrapperMatch, 'a single .paidlink wrapper must hold both branches');
  const wrapper = wrapperMatch[1];
  assert.match(wrapper, /<a[^>]*rel="sponsored noopener"[^>]*>/, 'the paid branch anchor lives inside the wrapper');
  assert.match(wrapper, /PAID_LINK_DISCLOSURE/, 'the disclosure constant is rendered inside the same wrapper as the link');
  // The unpaid branch (resolution.note / NO_COMMISSION_NOTE) renders no <a> at all.
  const unpaidBranch = wrapper.split('resolution.paid ?')[1] || wrapper;
  assert.ok(!/resolution\.note[\s\S]{0,80}<a\b/.test(unpaidBranch), 'the unpaid branch must not render a link');
});

// ── New P sources stay in scope ─────────────────────────────────────────

const NEW_SOURCES_EXCEPT_PAIDLINK = [
  'src/components/ShopCourtLane.astro',
  'src/pages/shop/court.astro',
  'src/pages/reviews/paddles/index.astro',
  'src/pages/reviews/paddles/[id].astro',
  'src/pages/reviews/paddles/[id].json.ts',
  'src/pages/reviews/paddles.json.ts',
  'src/pages/reviews/paddles/method.astro',
];

test('new sources (except PaidLink): no sponsored, no <img, no getCollection(\'products\'), no cannabis vocabulary', () => {
  for (const rel of NEW_SOURCES_EXCEPT_PAIDLINK) {
    const source = read(rel);
    assert.doesNotMatch(source, /sponsored/i, `${rel} must not mention "sponsored"`);
    assert.doesNotMatch(source, /<img\b/i, `${rel} must not render an <img>`);
    assert.doesNotMatch(source, /getCollection\(['"]products['"]/, `${rel} must not read the products collection`);
    assert.doesNotMatch(source, CANNABIS_RE, `${rel} must not mention Good Feels, THC or cannabis`);
  }
});

// ── [id].astro: real take rendering, no template page ───────────────────

test('[id].astro: uses publishableTakes( and renders reviewer.handle', () => {
  const source = read('src/pages/reviews/paddles/[id].astro');
  assert.match(source, /publishableTakes\(/, 'must gate paths through publishableTakes(');
  assert.match(source, /reviewer\.handle/, 'must render the reviewer handle');
});

test('reviews/paddles directory holds no template page', () => {
  const entries = readdirSync(join(ROOT, 'src/pages/reviews/paddles')).sort();
  assert.deepEqual(entries, ['[id].astro', '[id].json.ts', 'index.astro', 'method.astro']);
  for (const name of entries) assert.doesNotMatch(name, /template/i, `${name} must not be a template page`);
});

// ── Method page ──────────────────────────────────────────────────────────

test('method page: has the programs table, the disclosure, and the ranking sentence', () => {
  const source = read('src/pages/reviews/paddles/method.astro');
  assert.match(source, /<table/, 'must render a programs table');
  assert.match(source, /PAID_LINK_DISCLOSURE/, 'must reference the exact disclosure string');
  assert.match(source, /Commission never changes what we rank or recommend/, 'must state the ranking rule');
});

// ── Index page ───────────────────────────────────────────────────────────

test('index: has the exact empty-state line', () => {
  const source = read('src/pages/reviews/paddles/index.astro');
  assert.match(source, /First review coming from Mike's bag\./, 'must contain the exact empty-state sentence');
});

// ── Register changes: exactly one policy entry ──────────────────────────

test('changes: exactly one policy entry, mentioning "review pages", "court lane" and "never"', () => {
  const register = JSON.parse(read('src/data/paddle-register.json'));
  const policyEntries = (register.changes || []).filter((c) => c.kind === 'policy');
  assert.equal(policyEntries.length, 1, 'exactly one policy entry');
  const text = policyEntries[0].text;
  assert.match(text, /review pages/);
  assert.match(text, /court lane/);
  assert.match(text, /never/);
});
