import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { CLAIM_MAX, CONTACT_MAX, FIELDS, SOURCE_MAX, cleanText, countOpen, parseCorrection, withoutContact } from '../functions/_lib/paddle-correct.mjs';

const root = new URL('../', import.meta.url);
const src = await readFile(new URL('functions/api/paddles/correct.ts', root), 'utf8');
const page = await readFile(new URL('src/pages/paddles/[id].astro', root), 'utf8');
const runbook = await readFile(new URL('docs/runbooks/paddle-register-refresh.md', root), 'utf8');

const good = () => ({ paddleId: 'six-zero-coral-pro', field: 'price', claim: 'The list price is $229, not $249.', source: 'https://example.com/paddles/coral-pro' });

test('corrections: a well-formed claim with a source is accepted as written', () => {
  const r = parseCorrection(good());
  assert.equal(r.paddleId, 'six-zero-coral-pro');
  assert.deepEqual(r.correction, { field: 'price', claim: 'The list price is $229, not $249.', source: 'https://example.com/paddles/coral-pro', contact: null });
  const withContact = parseCorrection({ ...good(), contact: '  @someone ' });
  assert.equal(withContact.correction.contact, '@someone');
  assert.equal(parseCorrection({ ...good(), contact: '' }).correction.contact, null, 'empty contact is null');
});

test('corrections: every rejection reason, and nothing is repaired', () => {
  assert.equal(parseCorrection(null).reason, 'bad-body');
  assert.equal(parseCorrection('x').reason, 'bad-body');
  assert.equal(parseCorrection({ ...good(), paddleId: 'Bad Id' }).reason, 'bad-paddle');
  assert.equal(parseCorrection({ ...good(), paddleId: '-lead' }).reason, 'bad-paddle');
  assert.equal(parseCorrection({ ...good(), paddleId: 'a'.repeat(65) }).reason, 'bad-paddle');
  assert.equal(parseCorrection({ ...good(), paddleId: 7 }).reason, 'bad-paddle');
  assert.equal(parseCorrection({ ...good(), field: 'colour' }).reason, 'bad-field');
  assert.equal(parseCorrection({ ...good(), field: undefined }).reason, 'bad-field');
  assert.equal(parseCorrection({ ...good(), claim: 'too short' }).reason, 'claim-too-short');
  assert.equal(parseCorrection({ ...good(), claim: '         ' }).reason, 'claim-too-short', 'whitespace does not count');
  assert.equal(parseCorrection({ ...good(), claim: 'x'.repeat(CLAIM_MAX + 1) }).reason, 'claim-too-long');
  assert.equal(parseCorrection({ ...good(), claim: 'x'.repeat(CLAIM_MAX) }).reason, undefined, 'exactly the cap is fine');
  assert.equal(parseCorrection({ ...good(), claim: 42 }).reason, 'claim-too-short', 'non-strings are empty');
  assert.equal(parseCorrection({ ...good(), source: '' }).reason, 'source-required');
  assert.equal(parseCorrection({ ...good(), source: undefined }).reason, 'source-required');
  assert.equal(parseCorrection({ ...good(), source: 'http://example.com/x' }).reason, 'source-not-https');
  assert.equal(parseCorrection({ ...good(), source: 'example.com/x' }).reason, 'source-not-https');
  assert.equal(parseCorrection({ ...good(), source: 'https://example.com/a b' }).reason, 'source-not-https', 'no spaces');
  assert.equal(parseCorrection({ ...good(), source: 'https://localhost/x' }).reason, 'source-not-https', 'needs a dotted host');
  assert.equal(parseCorrection({ ...good(), source: 'https://example.com/' + 'x'.repeat(SOURCE_MAX) }).reason, 'source-too-long');
  assert.equal(parseCorrection({ ...good(), contact: 'x'.repeat(CONTACT_MAX + 1) }).reason, 'contact-too-long');
  assert.equal(parseCorrection({ ...good(), contact: '<b>me' }).reason, 'contact-looks-like-markup');
});

test('corrections: the markup check catches tags but not angle-bracket prose', () => {
  assert.equal(parseCorrection({ ...good(), claim: 'Price is <b>$229</b> not $249.' }).reason, 'claim-looks-like-markup');
  assert.equal(parseCorrection({ ...good(), claim: 'See <script>alert(1)</script> for it.' }).reason, 'claim-looks-like-markup');
  assert.equal(parseCorrection({ ...good(), claim: 'Swingweight is > 120, and price is <200 dollars.' }).reason, undefined, 'comparisons are not tags');
  assert.equal(parseCorrection({ ...good(), claim: 'Timeline: teaser -> launch -> ship, in that order.' }).reason, undefined, 'arrows are not tags');
});

test('corrections: control characters are stripped, tabs and newlines kept', () => {
  assert.equal(cleanText('a\u0000b\u0007c\u001Bd'), 'abcd');
  assert.equal(cleanText('line one\r\nline two\ttabbed'), 'line one\nline two\ttabbed');
  assert.equal(cleanText(undefined), '');
  const r = parseCorrection({ ...good(), claim: 'The list\u0000 price is $229, not $249.' });
  assert.equal(r.correction.claim, 'The list price is $229, not $249.');
  // stripping cannot rescue a claim that is only long enough because of control characters
  assert.equal(parseCorrection({ ...good(), claim: 'short' + '\u0000'.repeat(20) }).reason, 'claim-too-short');
});

test('corrections: fields list is the contract the page offers', () => {
  assert.deepEqual(FIELDS, ['launch-date', 'price', 'usap', 'upaa', 'dimensions', 'construction', 'pro', 'lifecycle', 'other']);
  for (const f of FIELDS) assert.match(page, new RegExp(`<option value="${f}">`), `page offers ${f}`);
});

test('corrections: helpers drop the contact and count only open items', () => {
  const item = { id: 'u', t: 1, paddleId: 'p', field: 'price', claim: 'c'.repeat(10), source: 'https://e.com/', contact: 'me@x.y', pid: 'q', status: 'open' };
  assert.ok(!('contact' in withoutContact(item)));
  assert.equal(withoutContact(item).claim, item.claim);
  assert.deepEqual(countOpen([item, { ...item, paddleId: 'r' }, { ...item, status: 'accepted' }]), { p: 1, r: 1 });
});

test('corrections API source contract: KV pattern, IP budget, key gate, no contact on any GET', () => {
  assert.match(src, /cf-connecting-ip/);
  assert.match(src, /IP_BUDGET_PER_WINDOW = 4/);
  assert.match(src, /RATE_WINDOW_MS = 60_000/);
  assert.match(src, /STORE_CAP = 500/);
  assert.match(src, /'paddles:correct:queue'/);
  assert.match(src, /'paddles:correct:counts'/);
  assert.match(src, /crypto\.randomUUID\(\)/);
  assert.match(src, /CORRECTIONS_KEY\?: string/, 'Env is extended locally');
  assert.match(src, /if \(!env\.CORRECTIONS_KEY\) return json\(\{ ok: false, reason: 'key-not-set' \}, \{ status: 503 \}\)/);
  assert.match(src, /keyMatches\(url\.searchParams\.get\('key'\), env\.CORRECTIONS_KEY\)/);
  assert.match(src, /'source-required: a correction without a source URL is not accepted'/);
  assert.match(src, /export const onRequestOptions/);

  // no GET path, and no POST response, ever includes a contact
  const getSrc = src.slice(src.indexOf('onRequestGet'), src.indexOf('onRequestPost'));
  assert.match(getSrc, /\.map\(\(c\) => withoutContact\(c\)\)/, 'the admin queue is stripped of contacts');
  assert.doesNotMatch(getSrc, /contact:/);
  assert.doesNotMatch(getSrc, /c\.contact/);
  const postSrc = src.slice(src.indexOf('onRequestPost'));
  assert.match(postSrc, /return json\(\{ ok: true, id: parsed\.paddleId, open: counts\[parsed\.paddleId\] \?\? 0 \}\)/, 'POST confirms receipt and the count only');
  // public GETs return counts only
  assert.match(getSrc, /return json\(\{ ok: true, counts: await loadCounts\(env\) \}, cache\)/);
  assert.match(getSrc, /return json\(\{ ok: true, id, open: counts\[id\] \?\? 0 \}, cache\)/);
  assert.doesNotMatch(getSrc.replace(/\/\/[^\n]*/g, ''), /claim|source/, 'public GET code never touches claims or sources');
});

test('corrections: the page form, the session id, and the runbook step', () => {
  assert.match(page, /Report a correction/);
  assert.match(page, /name="source" type="url"[^>]*required/);
  assert.match(page, /maxlength="600"/);
  assert.match(page, /pc:paddles:sid/);
  assert.match(page, /Sent\. It goes into the weekly review; the changes feed shows what was accepted\./);
  assert.match(page, /Try again in about a minute\./);
  assert.match(page, /waiting for review/);
  assert.match(runbook, /api\/paddles\/correct\?queue=1&key=\$CORRECTIONS_KEY/);
  assert.match(runbook, /wrangler pages secret put CORRECTIONS_KEY --project-name pointcast/);
  assert.match(runbook, /kind: corrected/);
});
