import test from 'node:test';
import assert from 'node:assert/strict';
import { handleGuidesIntake } from '../src/lib/guides-intake/service.mjs';

function memoryKv() {
  const map = new Map();
  return { map, get: async (k) => map.get(k) ?? null, put: async (k, v) => { map.set(k, v); } };
}
const base = 'https://pointcast.xyz/api/guides/intake';
const ctx = { guides: ['start-a-pickleball-team'], assignments: ['GA-01', 'GA-03'] };
const ADMIN = 'sekret';
const call = (kv, req, opts = {}) => handleGuidesIntake(req, { kv, ...ctx, ...opts });
const post = (kv, body, opts = {}, headers = {}) =>
  call(kv, new Request(base, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) }), opts);
const get = async (kv, query = '', headers = {}) => call(kv, new Request(`${base}${query}`, { headers }), { adminKey: ADMIN });
const admin = { 'X-Guides-Admin': ADMIN };
const review = (kv, body, headers = admin) => post(kv, { action: 'review', ...body }, { adminKey: ADMIN }, headers);

const consent = { noPrivateInfo: true, humanReview: true };
const reader = { name: 'Ana', kind: 'reader' };
const valid = (over = {}) => ({
  action: 'submit', guide: 'start-a-pickleball-team', kind: 'tip', title: 'Bring extra balls',
  body: 'Teams that bring a second sleeve of balls avoid delays between games.', contributor: reader, consent, ...over,
});
async function submit(kv, over) {
  const res = await post(kv, valid(over));
  return { res, json: await res.clone().json() };
}
const err = async (res, status, error) => { assert.equal(res.status, status); assert.equal((await res.json()).error, error); };

test('submit happy path returns receipt and pending', async () => {
  const kv = memoryKv();
  const { res, json } = await submit(kv);
  assert.equal(res.status, 201);
  assert.equal(json.status, 'pending');
  assert.match(json.id, /^gi_/);
  assert.equal(json.receipt.length, 24);
  assert.equal(json.check, `/api/guides/intake?receipt=${json.receipt}`);
  assert.ok(![...kv.map.values()].some((v) => v.includes(json.receipt)), 'raw receipt never stored');
});

test('privacy: email and phone rejected', async () => {
  const kv = memoryKv();
  await err((await submit(kv, { body: 'Reach the captain at cap@example.com for the schedule.' })).res, 400, 'privacy');
  await err((await submit(kv, { body: 'Call the captain on (310) 555-0142 for the schedule.' })).res, 400, 'privacy');
  await err((await submit(kv, { data: { rows: [{ contact: '+1 310 555 0142' }] } })).res, 400, 'privacy');
});

test('agents need a sourceUrl for resources and cannot submit assignment-work', async () => {
  const kv = memoryKv();
  const agent = { name: 'Bot', kind: 'agent', model: 'x' };
  await err((await submit(kv, { kind: 'resource', contributor: agent })).res, 400, 'source_required');
  const ok = await submit(kv, { kind: 'resource', contributor: agent, sourceUrls: ['https://example.com/rules'] });
  assert.equal(ok.res.status, 201);
  await err((await submit(kv, { kind: 'assignment-work', assignment: 'GA-01', contributor: agent, sourceUrls: ['https://example.com/a'] })).res, 400, 'agents_cannot_submit_assignment_work');
  assert.equal((await submit(kv, { kind: 'assignment-work', assignment: 'GA-01', contributor: { name: 'Ivy', kind: 'intern' } })).res.status, 201);
});

test('consent is required', async () => {
  const kv = memoryKv();
  await err((await submit(kv, { consent: undefined })).res, 400, 'consent_required');
  await err((await submit(kv, { consent: { noPrivateInfo: true } })).res, 400, 'consent_required');
});

test('unknown guide and assignment rejected; network allowed', async () => {
  const kv = memoryKv();
  await err((await submit(kv, { guide: 'nope' })).res, 400, 'guide_unknown');
  await err((await submit(kv, { assignment: 'GA-99' })).res, 400, 'assignment_unknown');
  assert.equal((await submit(kv, { guide: 'network', assignment: 'GA-03' })).res.status, 201);
});

test('receipt lookup returns the full item; unknown receipt 404', async () => {
  const kv = memoryKv();
  const { json } = await submit(kv);
  const got = await (await get(kv, `?receipt=${json.receipt}`)).json();
  assert.equal(got.item.id, json.id);
  assert.equal(got.item.status, 'pending');
  assert.equal(got.item.revisions, 0);
  await err(await get(kv, '?receipt=nope'), 404, 'receipt_not_found');
});

test('public GET hides pending', async () => {
  const kv = memoryKv();
  await submit(kv);
  const pub = await (await get(kv)).json();
  assert.equal(pub.counts.pending, 1);
  assert.equal(pub.counts.byGuide['start-a-pickleball-team'].pending, 1);
  assert.deepEqual(pub.accepted, []);
  assert.ok(!JSON.stringify(pub).includes('second sleeve'));
});

test('admin review needs key (401) and a note', async () => {
  const kv = memoryKv();
  const { json } = await submit(kv);
  await err(await review(kv, { id: json.id, status: 'accepted', note: 'Looks good, thanks.' }, {}), 401, 'admin_required');
  await err(await review(kv, { id: json.id, status: 'accepted', note: 'Looks good, thanks.' }, { 'X-Guides-Admin': 'wrong' }), 401, 'admin_required');
  await err(await review(kv, { id: json.id, status: 'accepted', note: 'ok' }), 400, 'note_required');
  await err(await review(kv, { id: 'gi_missing', status: 'accepted', note: 'Looks good, thanks.' }), 404, 'item_not_found');
});

test('accepted item appears publicly with only the latest feedback', async () => {
  const kv = memoryKv();
  const { json } = await submit(kv);
  await review(kv, { id: json.id, status: 'needs-changes', note: 'Please add a source link.' });
  await post(kv, { action: 'revise', receipt: json.receipt, sourceUrls: ['https://example.com/src'] });
  const res = await review(kv, { id: json.id, status: 'accepted', note: 'Great, sourced and clear.', rubric: { useful: 5, sourced: 4, clear: 5, safe: 5 } });
  assert.equal(res.status, 200);
  const pub = await (await get(kv, '?guide=start-a-pickleball-team')).json();
  assert.equal(pub.counts.accepted, 1);
  assert.equal(pub.accepted.length, 1);
  const item = pub.accepted[0];
  assert.equal(item.feedback.length, 1);
  assert.equal(item.feedback[0].note, 'Great, sourced and clear.');
  assert.equal(item.revisions, undefined);
  assert.equal((await (await get(kv, '?guide=network')).json()).accepted.length, 0);
});

test('needs-changes then revise returns to pending with revisions 1', async () => {
  const kv = memoryKv();
  const { json } = await submit(kv);
  await review(kv, { id: json.id, status: 'needs-changes', note: 'Please clarify the second sentence.' });
  const res = await post(kv, { action: 'revise', receipt: json.receipt, body: 'Teams that bring a second sleeve of balls keep games moving all evening.' });
  assert.equal(res.status, 200);
  const got = (await (await get(kv, `?receipt=${json.receipt}`)).json()).item;
  assert.equal(got.status, 'pending');
  assert.equal(got.revisions, 1);
  assert.match(got.body, /all evening/);
  assert.equal(got.feedback.length, 1);
});

test('revise refused when not needs-changes; revise re-checks privacy', async () => {
  const kv = memoryKv();
  const { json } = await submit(kv);
  await err(await post(kv, { action: 'revise', receipt: json.receipt, title: 'New title here' }), 409, 'not_revisable');
  await err(await post(kv, { action: 'revise', receipt: 'bogus' }), 404, 'receipt_not_found');
  await review(kv, { id: json.id, status: 'needs-changes', note: 'Please tidy this up.' });
  await err(await post(kv, { action: 'revise', receipt: json.receipt, body: 'Email me at someone@example.com about the second sleeve of balls.' }), 400, 'privacy');
});

test('queue requires admin and lists pending + needs-changes oldest first', async () => {
  const kv = memoryKv();
  await err(await get(kv, '?queue=1'), 401, 'admin_required');
  const a = (await submit(kv, { title: 'First tip here' })).json;
  const b = (await submit(kv, { title: 'Second tip here' })).json;
  const c = (await submit(kv, { title: 'Third tip here' })).json;
  await review(kv, { id: c.id, status: 'declined', note: 'Not a fit for this guide.' });
  await review(kv, { id: b.id, status: 'needs-changes', note: 'Please add more detail.' });
  const q = await (await get(kv, '?queue=1', admin)).json();
  assert.deepEqual(q.items.map((i) => i.id), [a.id, b.id]);
  const pub = await (await get(kv)).json();
  assert.equal(pub.counts.declined, 1);
  assert.equal(pub.counts.needsChanges, 1);
});

test('sourceUrls are https only, no credentials, max 5', async () => {
  const kv = memoryKv();
  await err((await submit(kv, { sourceUrls: ['http://example.com/a'] })).res, 400, 'source_url_invalid');
  await err((await submit(kv, { sourceUrls: ['javascript:alert(1)'] })).res, 400, 'source_url_invalid');
  await err((await submit(kv, { sourceUrls: ['https://user:pw@example.com/a'] })).res, 400, 'source_url_invalid');
  await err((await submit(kv, { sourceUrls: Array.from({ length: 6 }, (_, i) => `https://example.com/${i}`) })).res, 400, 'too_many_source_urls');
  assert.equal((await submit(kv, { sourceUrls: ['https://example.com/a'] })).res.status, 201);
});

test('data size cap', async () => {
  const kv = memoryKv();
  const big = { rows: Array.from({ length: 400 }, (_, i) => ({ court: `Court ${i}`, note: 'abcdefghij' })) };
  await err((await submit(kv, { kind: 'dataset', data: big })).res, 413, 'data_too_large');
  const small = await submit(kv, { kind: 'dataset', data: { rows: [{ court: 'A', open: true }] } });
  assert.equal(small.res.status, 201);
});

test('verified agents are marked, rate limit and unbound store handled', async () => {
  const kv = memoryKv();
  const { json } = await (async () => { const res = await post(kv, valid({ kind: 'tip', contributor: { name: 'Bot', kind: 'reader' } }), { verifiedAgent: 'pci_0123456789abcdef0123456789abcdef' }); return { res, json: await res.clone().json() }; })();
  const item = (await (await get(kv, `?receipt=${json.receipt}`)).json()).item;
  assert.equal(item.contributor.kind, 'agent');
  assert.equal(item.contributor.verified, true);
  assert.equal((await post(kv, valid(), { limit: async () => false })).status, 429);
  assert.equal((await post(kv, valid(), { kv: null })).status, 503);
  assert.equal((await call(kv, new Request(base, { method: 'OPTIONS' }))).status, 204);
});

import { agentCheck, suggestKinds } from '../src/lib/guides-intake/classify.mjs';

test('task classifier keeps agents to citable public material', () => {
  for (const ask of [
    'Links to official city or county pages for services, with the date you last checked them.',
    'Corrections: anything on a guide page that is out of date or wrong.',
    'A template for a team welcome message and emergency contact form.',
    "Your city's special events or street use page, with the date you checked it.",
    'A sample neighbor notice that worked, with names and contact details removed.'.replace(' that worked', ''),
  ]) assert.equal(agentCheck(ask).agentFriendly, true, ask);
  const human = {
    'A sample one-page team agreement (purpose, dues, attendance, captain duties) you have used.': /first-hand/,
    'Stories of what made your first season succeed or fall apart.': /first-hand/,
    'How your team handles mixed skill levels and what rotation formats worked.': /first-hand/,
    'Photos you took yourself, with consent from anyone identifiable in them.': /photos/i,
    'Event listings with organizer-approved details.': /consent/,
    'Reach out to the league office for the season calendar.': /contacting/,
    'Your welcome message to parents that set the right tone.': /first-hand/,
  };
  for (const [ask, reason] of Object.entries(human)) {
    const r = agentCheck(ask);
    assert.equal(r.agentFriendly, false, ask);
    assert.match(r.reason, reason, ask);
  }
  assert.deepEqual(suggestKinds('Public meeting calendars and agenda links'), ['schedule', 'resource']);
  assert.deepEqual(suggestKinds('Something else entirely'), ['tip', 'resource']);
});

test('public counts track intern assignment progress', async () => {
  const kv = memoryKv();
  const opts = { kv, adminKey: 'k-admin-123', guides: ['new-in-town'], assignments: ['GA-02'] };
  const call = (body, headers = {}) => handleGuidesIntake(new Request('https://pointcast.xyz/api/guides/intake', { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) }), opts);
  const sub = await (await call({ action: 'submit', guide: 'new-in-town', assignment: 'GA-02', kind: 'assignment-work', title: 'Resource links checked', body: 'Checked library, transit and school district links for the newcomer guide.', contributor: { name: 'Ana', kind: 'intern' }, consent: { noPrivateInfo: true, humanReview: true } })).json();
  let pub = await (await handleGuidesIntake(new Request('https://pointcast.xyz/api/guides/intake'), opts)).json();
  assert.deepEqual(pub.counts.byAssignment['GA-02'], { accepted: 0, inReview: 1 });
  await call({ action: 'review', id: sub.id, status: 'accepted', note: 'Thorough and well sourced, thank you.' }, { 'X-Guides-Admin': 'k-admin-123' });
  pub = await (await handleGuidesIntake(new Request('https://pointcast.xyz/api/guides/intake?guide=new-in-town'), opts)).json();
  assert.deepEqual(pub.counts.byAssignment['GA-02'], { accepted: 1, inReview: 0 });
  assert.equal(pub.accepted[0].assignment, 'GA-02');
});
