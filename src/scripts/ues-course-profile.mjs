import { normalizeProgress, progressSummary, serializeProgress } from '../lib/ues-progress.mjs';

const ENDPOINT = '/api/me/courses';
const REQUEST_FAILED = 'The profile request failed. Your local work is still here.';
const messages = {
  unauthorized: 'Sign in to PointCast, then check your private profile again. Your local work is still here.',
  'account-changed': 'The signed-in account changed. Check your private profile again before saving.',
  'revision-conflict': 'The account copy changed in another tab or device. Check your private profile again and review it before saving.',
  'course-profile-unavailable': 'Account course saving is not available here yet. Your local checklist still works.',
};

// No cookie/session JSON reads, background uploads, storage interception, or
// saved consent. A mutation is one explicit action tied to the displayed account.
export function createCourseProfileClient(fetcher = globalThis.fetch) {
  const request = async (method, data, userId, code) => {
    let response;
    try { response = await fetcher(code ? `${ENDPOINT}?courseCode=${encodeURIComponent(code)}` : ENDPOINT, {
      method, credentials: 'same-origin', cache: 'no-store',
      headers: data ? { 'Content-Type': 'application/json', 'X-PointCast-User': userId } : {},
      ...(data ? { body: JSON.stringify(data) } : {}),
    }); } catch { throw new Error(REQUEST_FAILED); }
    let result;
    try { result = await response.json(); } catch { throw new Error(REQUEST_FAILED); }
    if (!response.ok || !result?.ok) throw new Error(messages[result?.reason] ?? REQUEST_FAILED);
    return result;
  };
  return {
    load: code => request('GET', null, null, code),
    save: (account, code, progress, expectedRevision) => request('PUT', {
      courseCode: code, progress: JSON.parse(serializeProgress(normalizeProgress(progress, code))), expectedRevision, consent: true,
    }, account.userId),
    remove: (account, code, expectedRevision) => request('DELETE', { courseCode: code, expectedRevision }, account.userId),
  };
}

const mounted = new WeakMap();
function setup(root, client) {
  mounted.get(root)?.();
  const status = root.querySelector('[data-ues-profile-status]');
  const load = root.querySelector('[data-ues-profile-load]');
  let epoch = 0;
  let busy = false;
  let focusAfter = false;
  const focusLoad = () => { focusAfter = true; };
  const events = new AbortController();
  const clear = () => {
    epoch += 1;
    root.querySelector('[data-ues-profile-list]')?.replaceChildren();
    root.querySelectorAll('[data-ues-profile-save], [data-ues-profile-restore], [data-ues-profile-remove]').forEach(button => { button.hidden = true; });
  };
  const run = async action => {
    if (busy) return;
    busy = true;
    const token = ++epoch;
    root.querySelectorAll('button').forEach(button => { button.disabled = true; });
    status.textContent = 'Checking private course profile…';
    const valid = () => token === epoch && root.isConnected;
    try { await action(valid); }
    catch (error) { if (valid()) { clear(); status.textContent = error.message; focusLoad(); } }
    finally {
      busy = false;
      if (root.isConnected) {
        root.querySelectorAll('button').forEach(button => { button.disabled = false; });
        if (focusAfter) load.focus();
      }
      focusAfter = false;
    }
  };
  const on = (element, event, handler) => element?.addEventListener(event, handler, { signal: events.signal });
  on(window, 'pc:auth-change', () => { clear(); status.textContent = 'Account changed. Check your private profile again.'; });
  on(document, 'visibilitychange', () => { if (document.hidden) { clear(); status.textContent = 'Check your private profile again to review the current account.'; } });
  on(window, 'pageshow', event => { if (event.persisted) { clear(); status.textContent = 'Check your private profile again to review the current account.'; } });
  on(document, 'astro:before-swap', () => { clear(); events.abort(); });
  const cleanup = () => { clear(); events.abort(); };
  mounted.set(root, cleanup);
  return { client, status, load, run, on, clear, focusLoad };
}

export function mountCourseProfile(root, { getProgress, replaceProgress, client = createCourseProfileClient() }) {
  if (!root) return;
  const { status, load, run, on, focusLoad } = setup(root, client);
  const code = root.dataset.course;
  const save = root.querySelector('[data-ues-profile-save]');
  const restore = root.querySelector('[data-ues-profile-restore]');
  const remove = root.querySelector('[data-ues-profile-remove]');
  let snapshot = null;
  const show = result => {
    snapshot = result;
    const saved = result.courses[0];
    status.textContent = saved
      ? `${result.displayName}: saved ${saved.progress.completedWeeks.length} of 6 modules; final outcome ${saved.progress.finalOutcome ? 'checked' : 'unchecked'}. Self-attested. Saving replaces this account copy; restoring replaces this browser checklist.`
      : `${result.displayName}: no saved copy of ${code}. Choose Save to send this checklist to this private account.`;
    save.hidden = false;
    restore.hidden = remove.hidden = !saved;
  };
  on(load, 'click', () => run(async valid => { const result = await client.load(code); if (valid()) show(result); }));
  on(save, 'click', () => run(async valid => {
    const account = snapshot;
    const result = await client.save(account, code, getProgress(), account.courses[0]?.revision ?? null);
    if (valid()) { show({ ...result, courses: [result.course] }); status.textContent += ' Account copy saved. Later edits stay local until you save again.'; }
  }));
  on(restore, 'click', () => run(async valid => {
    const previous = snapshot;
    const result = await client.load(code);
    if (!valid()) return;
    if (result.userId !== previous.userId || result.courses[0]?.revision !== previous.courses[0]?.revision) {
      show(result); status.textContent += ' The account or saved copy changed. Review it and choose again.'; return;
    }
    replaceProgress(normalizeProgress(result.courses[0].progress, code));
    show(result); status.textContent += ' Saved checklist copied here. This does not enable automatic syncing.';
  }));
  on(remove, 'click', () => run(async valid => {
    const account = snapshot;
    const result = await client.remove(account, code, account.courses[0].revision);
    if (valid()) { show({ ...result, courses: [] }); status.textContent += ' Account copy removed. The local checklist is unchanged.'; focusLoad(); }
  }));
}

export function mountProfileShelf(root, client = createCourseProfileClient()) {
  const { status, load, run, on, focusLoad } = setup(root, client);
  const list = root.querySelector('[data-ues-profile-list]');
  const show = result => {
    list.replaceChildren();
    status.textContent = `${result.displayName}: ${result.courses.length} saved course checklist${result.courses.length === 1 ? '' : 's'}. Private and self-attested.`;
    result.courses.forEach(course => {
      const li = document.createElement('li');
      const link = document.createElement('a');
      link.href = course.path; link.textContent = `${course.courseCode} · ${course.title}`;
      const summary = progressSummary(course.progress);
      const text = document.createElement('span');
      text.textContent = ` — ${summary.complete ? 'complete by self-attestation' : `${course.progress.completedWeeks.length} of 6 modules; final outcome ${course.progress.finalOutcome ? 'checked' : 'unchecked'}`}. `;
      const button = document.createElement('button');
      button.type = 'button'; button.textContent = 'Remove account copy';
      button.setAttribute('aria-label', `Remove ${course.courseCode} account copy`);
      on(button, 'click', () => run(async valid => {
        await client.remove(result, course.courseCode, course.revision);
        if (!valid()) return;
        li.remove(); status.textContent = `${course.courseCode} account copy removed. Local checklists are unchanged.`; focusLoad();
      }));
      li.append(link, text, button); list.append(li);
    });
  };
  on(load, 'click', () => run(async valid => { const result = await client.load(); if (valid()) show(result); }));
}
