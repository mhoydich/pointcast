import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';
import { mountInternshipDesk } from '../src/scripts/internship-desk.mjs';
import { mountInternshipDeskReview } from '../src/scripts/internship-desk-review.mjs';

const tick = () => new Promise(resolve => setTimeout(resolve, 0));
const clone = value => structuredClone(value);
const response = (status, data) => ({ ok: status >= 200 && status < 300, status, json: async () => clone(data) });
const fixture = (overrides = {}) => ({ ownerId: 'owner-a', recordId: 'b2b4c59c-37b4-42c3-b56d-30c441179529', kind: 'human', label: 'A fictional book swap', goal: 'Learn to describe a small fictional offer clearly.', botName: '', onboarding: [true, true, true], tasks: { understand: 'ready', make: 'ready', test: 'ready' }, evidence: 'An offline draft with a clear audience, scope, and rights check.', version: 1, submittedVersion: null, status: 'draft', interestAt: null, updatedAt: '2026-10-19T12:00:00.000Z', expiresAt: '2027-01-17T12:00:00.000Z', review: null, ...overrides });
async function page(which = 'index') {
  const source = await readFile(new URL(`../src/pages/internship-desk/${which}.astro`, import.meta.url), 'utf8');
  const markup = source.replace(/^---[\s\S]*?---/, '').replace(/<script>[\s\S]*?<\/script>/g, '').replace(/<\/?BlockLayout[^>]*>/g, '');
  const dom = new JSDOM(markup, { url: `https://pointcast.example/internship-desk/${which === 'index' ? '' : 'review/'}`, pretendToBeVisual: true });
  dom.window.Storage.prototype.getItem = () => { throw new Error('Browser storage must not be used'); };
  dom.window.Storage.prototype.setItem = () => { throw new Error('Browser storage must not be used'); };
  return dom;
}
function ownerApi(initial = []) {
  let records = clone(initial);
  let owner = 'owner-a';
  let failure = null;
  const calls = [];
  return {
    calls, setFailure(status, error) { failure = { status, error }; }, setOwner(value) { owner = value; }, get records() { return clone(records); },
    fetch: async (url, options = {}) => {
      calls.push({ url, ...options, body: options.body ? JSON.parse(options.body) : null });
      if (failure) { const next = failure; failure = null; return response(next.status, { ok: false, error: next.error }); }
      if (options.method !== 'POST') return response(200, { ok: true, userId: owner, records });
      const body = JSON.parse(options.body);
      const existing = records.find(item => item.kind === body.kind);
      if (options.headers['X-PointCast-User'] !== owner) return response(403, { ok: false, error: 'account-mismatch' });
      if (body.version !== (existing?.version || 0) || body.recordId !== (existing?.recordId || null)) return response(409, { ok: false, error: 'version-conflict' });
      if (body.action === 'delete') records = records.filter(item => item.kind !== body.kind);
      else {
        let next = existing ? clone(existing) : fixture({ ownerId: owner, kind: body.kind, recordId: body.kind === 'human' ? 'human-record-id' : 'bot-record-id', version: 0, onboarding: [false, false, false], tasks: { understand: 'todo', make: 'todo', test: 'todo' }, evidence: '' });
        if (body.action === 'save') next = { ...next, ...body.payload, status: next.interestAt ? 'interest_received' : 'draft', review: null };
        if (body.action === 'interest') { next.status = 'interest_received'; next.interestAt = '2026-10-19T12:00:00.000Z'; }
        next.version += 1;
        if (body.action === 'request_review') { next.status = 'review_requested'; next.submittedVersion = next.version; }
        records = [...records.filter(item => item.kind !== body.kind), next];
      }
      return response(200, { ok: true, userId: owner, records });
    },
  };
}
async function ownerHarness(api = ownerApi()) {
  const dom = await page();
  const root = dom.window.document.querySelector('[data-internship-desk]');
  const controller = mountInternshipDesk(root, { fetchImpl: api.fetch });
  await tick();
  const find = name => root.querySelector(`[data-desk-${name}]`);
  const field = name => root.querySelector(`[data-desk-field="${name}"]`);
  const set = (name, value, dispatch = true) => { field(name).value = value; if (dispatch) field(name).dispatchEvent(new dom.window.Event('input', { bubbles: true })); };
  const click = async name => { find(name).click(); await tick(); };
  return { dom, root, controller, find, field, set, click, api, close() { controller.destroy(); dom.window.close(); } };
}

test('owner saves explicitly and reloads persisted records; browser storage is unused', async () => {
  const api = ownerApi();
  const h = await ownerHarness(api);
  h.set('label', 'Original activity pack'); h.set('goal', 'Learn how to describe a fictional printable clearly.');
  assert.equal(api.calls.length, 1, 'typing never autosaves');
  await h.click('save');
  assert.equal(api.calls.at(-1).body.version, 0);
  assert.equal(api.calls.at(-1).body.recordId, null);
  assert.equal(api.calls.at(-1).headers['X-PointCast-User'], 'owner-a');
  assert.equal(api.calls.at(-1).credentials, 'same-origin');
  assert.equal(api.calls.at(-1).cache, 'no-store');
  assert.equal(api.records[0].label, 'Original activity pack');
  h.close();
  const loaded = await ownerHarness(api);
  assert.equal(loaded.field('label').value, 'Original activity pack');
  assert.equal(loaded.find('save').disabled, true);
  loaded.close();
});

test('human and bot sponsor records stay separate; switching never silently discards unsaved edits', async () => {
  const h = await ownerHarness(ownerApi([fixture()]));
  h.set('goal', 'My unsaved private learning goal.');
  h.root.querySelector('[data-desk-kind="bot"]').click();
  assert.equal(h.find('switch-confirm').hidden, false);
  assert.equal(h.field('goal').value, 'My unsaved private learning goal.');
  await h.click('switch-discard');
  assert.equal(h.field('goal').value, '');
  assert.equal(h.field('botName').required, true);
  assert.match(h.find('accountability').textContent, /accountable human sponsor/);
  h.set('label', 'Bot offer practice'); h.set('goal', 'Learn to review a bot-assisted fictional offer.'); h.set('botName', 'Sample Helper');
  await h.click('save');
  assert.equal(h.api.records.length, 2);
  assert.equal(h.api.records.find(item => item.kind === 'human').goal, fixture().goal);
  assert.equal(h.api.records.find(item => item.kind === 'bot').botName, 'Sample Helper');
  h.close();
});

test('save, interest, and review are separate; unsaved and incomplete work cannot be submitted', async () => {
  const h = await ownerHarness(ownerApi([fixture()]));
  assert.equal(h.find('interest').disabled, false);
  assert.equal(h.find('request-review').disabled, true);
  h.set('evidence', 'A silent browser-restored edit must be saved before sharing.', false);
  const before = h.api.calls.length;
  await h.click('interest');
  assert.equal(h.api.calls.length, before, 'action boundary detects silent form edits');
  await h.click('save');
  await h.click('interest');
  assert.match(h.find('status').textContent, /no email or response deadline/);
  assert.equal(h.find('request-review').disabled, false);
  await h.click('request-review');
  assert.equal(h.api.records[0].status, 'review_requested');
  assert.equal(h.api.calls.at(-1).body.recordId, fixture().recordId);
  assert.equal(h.find('request-review').disabled, true);
  h.close();
  const incomplete = await ownerHarness(ownerApi([fixture({ status: 'interest_received', interestAt: '2026-10-19', tasks: { understand: 'ready', make: 'doing', test: 'ready' } })]));
  assert.equal(incomplete.find('request-review').disabled, true);
  incomplete.close();
});

test('401, 403, and 503 clear private fields and disable forms without a local fallback', async () => {
  for (const code of [401, 403, 503]) {
    const h = await ownerHarness(ownerApi([fixture()]));
    h.api.setFailure(code, code === 403 ? 'account-mismatch' : 'unavailable');
    await h.controller.reload();
    assert.equal(h.field('label').value, '');
    assert.equal(h.find('fields').disabled, true);
    assert.equal(h.find('interest').disabled, true);
    assert.equal(h.find('access').hidden, code === 503);
    assert.equal(h.root.querySelectorAll('[data-desk-review-note] a').length, 0);
    h.close();
  }
});

test('409 preserves edits but freezes actions until explicit discard/reload; deletion is exact', async () => {
  const h = await ownerHarness(ownerApi([fixture()]));
  h.set('goal', 'A changed goal that must survive a version conflict.');
  h.api.setFailure(409, 'version-conflict');
  await h.click('save');
  assert.equal(h.field('goal').value, 'A changed goal that must survive a version conflict.');
  assert.equal(h.find('conflict').hidden, false);
  assert.equal(h.find('fields').disabled, true);
  await h.click('discard');
  assert.equal(h.field('goal').value, fixture().goal);
  assert.equal(h.find('conflict').hidden, true);
  await h.click('delete');
  assert.equal(h.api.records.length, 1);
  await h.click('delete-yes');
  assert.equal(h.api.records.length, 0);
  assert.equal(h.api.calls.at(-1).body.recordId, fixture().recordId);
  assert.equal(h.field('label').value, '');
  h.close();
});

test('account change clears fields synchronously and stale responses cannot restore them', async () => {
  let resolveRequest;
  const h = await ownerHarness(ownerApi([fixture()]));
  h.api.fetch = () => new Promise(resolve => { resolveRequest = resolve; });
  // A second mount uses a deferred initial request to exercise late responses.
  const dom = await page();
  const root = dom.window.document.querySelector('[data-internship-desk]');
  const controller = mountInternshipDesk(root, { fetchImpl: h.api.fetch });
  dom.window.dispatchEvent(new dom.window.CustomEvent('pc:auth-change', { detail: { user: { userId: 'owner-b' } } }));
  resolveRequest(response(200, { ok: true, userId: 'owner-a', records: [fixture()] }));
  await tick();
  assert.equal(root.querySelector('[data-desk-field="label"]').value, '');
  assert.equal(root.querySelector('[data-desk-fields]').disabled, true);
  h.dom.window.dispatchEvent(new h.dom.window.CustomEvent('pc:auth-refresh'));
  assert.equal(h.field('label').value, '');
  controller.destroy(); dom.window.close(); h.close();
});

test('returning to a desk rechecks account before revealing fields and preserves same-account unsaved edits', async () => {
  const h = await ownerHarness(ownerApi([fixture()]));
  h.set('goal', 'Keep this unsaved text after the same account is verified.');
  h.dom.window.dispatchEvent(new h.dom.window.Event('blur'));
  assert.equal(h.root.dataset.privateMasked, 'true');
  assert.equal(h.find('fields').disabled, true);
  h.dom.window.dispatchEvent(new h.dom.window.Event('focus')); await tick();
  assert.equal(h.root.dataset.privateMasked, 'false');
  assert.equal(h.field('goal').value, 'Keep this unsaved text after the same account is verified.');
  h.api.setOwner('owner-b');
  h.dom.window.dispatchEvent(new h.dom.window.Event('blur'));
  h.dom.window.dispatchEvent(new h.dom.window.Event('focus')); await tick();
  assert.equal(h.field('goal').value, '');
  assert.equal(h.find('fields').disabled, true);
  h.close();
});

test('private text and review feedback remain inert; every owner control has a label', async () => {
  const attack = '<img src=x onerror="globalThis.pwned=true"><a href="javascript:alert(1)">link</a>';
  const h = await ownerHarness(ownerApi([fixture({ label: attack, status: 'reviewed', review: { decision: 'reviewed', note: attack, reviewerId: 'director', reviewedAt: '2026-10-19', submittedVersion: 1 } })]));
  assert.equal(h.field('label').value, attack);
  assert.equal(h.find('review-note').textContent, attack);
  assert.equal(h.find('review-note').querySelector('img,a,script'), null);
  for (const control of h.root.querySelectorAll('input,select,textarea')) assert.ok(control.labels.length > 0, `Missing label: ${control.id}`);
  assert.equal(h.root.querySelectorAll('input[type=file],input[type=email],input[type=tel],input[type=url]').length, 0);
  assert.equal(h.root.querySelector('[data-desk-kind="bot"]').tagName, 'BUTTON');
  h.dom.window.dispatchEvent(new h.dom.window.Event('pagehide'));
  assert.equal(h.field('label').value, '');
  assert.equal(h.find('review-note').textContent, '');
  h.close();
});

async function reviewHarness(fetchImpl) {
  const dom = await page('review');
  const root = dom.window.document.querySelector('[data-idk-review]');
  const controller = mountInternshipDeskReview(root, { fetchImpl });
  await tick();
  const find = name => root.querySelector(`[data-idk-review-${name}]`);
  return { dom, root, controller, find, close() { controller.destroy(); dom.window.close(); } };
}
const queueResponse = (records, nextCursor = null, userId = 'director') => response(200, { ok: true, userId, records, nextCursor });

test('director queue renders other statuses and own records read-only, escapes content, and paginates', async () => {
  const attack = '<img src=x onerror=alert(1)>';
  const calls = [];
  const h = await reviewHarness(async (url, options) => { calls.push({ url, options }); return url.includes('?') ? queueResponse([fixture({ ownerId: 'owner-c', status: 'reviewed', label: attack })]) : queueResponse([fixture({ status: 'interest_received' }), fixture({ ownerId: 'director', recordId: 'own', status: 'review_requested', submittedVersion: 1 })], 'opaque cursor'); });
  assert.equal(h.root.querySelectorAll('[data-idk-review-form]').length, 0);
  assert.match(h.root.textContent, /cannot review your own/);
  h.find('more').click(); await tick();
  assert.match(calls.at(-1).url, /cursor=opaque%20cursor/);
  assert.equal(h.root.querySelectorAll('[data-idk-review-card]').length, 3);
  assert.match(h.root.textContent, /<img src=x/);
  assert.equal(h.root.querySelector('img'), null);
  h.close();
});

test('director posts exact record identity/CAS and submitted-work version survives a later no-op save', async () => {
  const row = fixture({ version: 7, submittedVersion: 3, status: 'review_requested', interestAt: '2026-10-19' });
  const calls = [];
  const h = await reviewHarness(async (url, options) => {
    calls.push({ url, ...options });
    if (options.method !== 'POST') return queueResponse([row]);
    const body = JSON.parse(options.body);
    return queueResponse([{ ...row, version: 8, status: body.decision, review: { decision: body.decision, note: body.note, reviewerId: 'director', reviewedAt: '2026-10-19T12:00:00Z', submittedVersion: 3 } }]);
  });
  h.find('note').value = 'The fictional scope is clear; the limits are easy to follow.';
  h.find('decision').value = 'reviewed';
  h.find('form').dispatchEvent(new h.dom.window.Event('submit', { bubbles: true, cancelable: true })); await tick();
  const posted = JSON.parse(calls.at(-1).body);
  assert.equal(posted.version, 7);
  assert.equal(posted.recordId, row.recordId);
  assert.equal(posted.ownerId, row.ownerId);
  assert.equal(calls.at(-1).headers['X-PointCast-User'], 'director');
  assert.equal(h.find('form'), null);
  assert.match(h.root.textContent, /submission version 3/);
  assert.doesNotMatch(h.find('status').textContent, /uncertain/);
  h.close();
});

test('director access failures clear private queue; 409 preserves notes but freezes writes until explicit reload', async () => {
  const row = fixture({ status: 'review_requested', submittedVersion: 1 });
  let next = null;
  const h = await reviewHarness(async (url, options) => next ? response(next, { ok: false, error: next === 409 ? 'version-conflict' : 'unavailable' }) : queueResponse([row]));
  h.find('note').value = 'This note stays visible for inspection after a conflict.';
  h.find('decision').value = 'changes_requested'; next = 409;
  h.find('form').dispatchEvent(new h.dom.window.Event('submit', { bubbles: true, cancelable: true })); await tick();
  assert.equal(h.find('note').value, 'This note stays visible for inspection after a conflict.');
  assert.equal(h.find('decision').value, '');
  assert.equal(h.find('submit').disabled, true);
  next = null; await h.controller.reload();
  assert.equal(h.find('note').value, '');
  for (const code of [401, 403, 503]) {
    next = code; await h.controller.reload();
    assert.equal(h.find('list').children.length, 0);
    assert.equal(h.find('login').hidden, code !== 401);
    next = null; await h.controller.reload();
  }
  h.close();
});

test('review notes have native labels and clear on auth refresh/pagehide; late responses are ignored', async () => {
  const h = await reviewHarness(async () => queueResponse([fixture({ status: 'review_requested', submittedVersion: 1 })]));
  for (const control of h.root.querySelectorAll('textarea,select')) assert.ok(control.labels.length > 0);
  h.find('note').value = 'A private unsent review note.';
  h.dom.window.dispatchEvent(new h.dom.window.Event('pc:auth-refresh'));
  assert.equal(h.find('list').children.length, 0);
  await h.controller.reload();
  h.dom.window.dispatchEvent(new h.dom.window.Event('pagehide'));
  assert.equal(h.find('list').children.length, 0);
  h.close();
  let resolve;
  const dom = await page('review');
  const root = dom.window.document.querySelector('[data-idk-review]');
  const controller = mountInternshipDeskReview(root, { fetchImpl: () => new Promise(done => { resolve = done; }) });
  dom.window.dispatchEvent(new dom.window.CustomEvent('pc:auth-change', { detail: { user: { userId: 'another' } } }));
  resolve(queueResponse([fixture({ status: 'review_requested', submittedVersion: 1 })])); await tick();
  assert.equal(root.querySelector('[data-idk-review-list]').children.length, 0);
  controller.destroy(); dom.window.close();
});

test('late owner account checks cannot unmask a second blur, and changed saved versions freeze preserved edits', async () => {
  let requests = 0;
  let pending;
  const row = fixture();
  const api = { fetch: async () => {
    requests += 1;
    if (requests === 2) return new Promise(resolve => { pending = resolve; });
    return response(200, { ok: true, userId: 'owner-a', records: [{ ...row, version: requests >= 3 ? 2 : 1 }] });
  } };
  const h = await ownerHarness(api);
  h.set('goal', 'Preserve this learning goal across visibility checks.');
  h.dom.window.dispatchEvent(new h.dom.window.Event('blur'));
  h.dom.window.dispatchEvent(new h.dom.window.Event('focus'));
  h.dom.window.dispatchEvent(new h.dom.window.Event('blur'));
  pending(response(200, { ok: true, userId: 'owner-a', records: [row] })); await tick();
  assert.equal(h.root.dataset.privateMasked, 'true');
  assert.equal(h.find('fields').disabled, true);
  assert.equal(requests, 2);
  h.dom.window.dispatchEvent(new h.dom.window.Event('focus')); await tick();
  assert.equal(requests, 3);
  assert.equal(h.root.dataset.privateMasked, 'false');
  assert.equal(h.find('conflict').hidden, false);
  assert.equal(h.find('fields').disabled, true);
  assert.equal(h.field('goal').value, 'Preserve this learning goal across visibility checks.');
  h.close();
});

test('director focus checks preserve same-account notes and second-blur late checks stay masked', async () => {
  let requests = 0;
  let pending;
  const row = fixture({ status: 'review_requested', submittedVersion: 1 });
  const h = await reviewHarness(async () => {
    requests += 1;
    if (requests === 3) return new Promise(resolve => { pending = resolve; });
    return queueResponse([row]);
  });
  h.find('note').value = 'Keep this unsent feedback while the account is checked.';
  h.find('decision').value = 'reviewed';
  h.dom.window.dispatchEvent(new h.dom.window.Event('blur'));
  assert.equal(h.root.dataset.privateMasked, 'true');
  h.dom.window.dispatchEvent(new h.dom.window.Event('focus')); await tick();
  assert.equal(h.root.dataset.privateMasked, 'false');
  assert.equal(h.find('note').value, 'Keep this unsent feedback while the account is checked.');
  h.dom.window.dispatchEvent(new h.dom.window.Event('blur'));
  h.dom.window.dispatchEvent(new h.dom.window.Event('focus'));
  h.dom.window.dispatchEvent(new h.dom.window.Event('blur'));
  pending(queueResponse([row])); await tick();
  assert.equal(h.root.dataset.privateMasked, 'true');
  assert.equal(h.find('submit').disabled, true);
  h.dom.window.dispatchEvent(new h.dom.window.Event('focus')); await tick();
  assert.equal(h.root.dataset.privateMasked, 'false');
  assert.equal(h.find('note').value, 'Keep this unsent feedback while the account is checked.');
  h.close();
});
