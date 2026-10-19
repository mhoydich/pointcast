const ENDPOINT = '/api/internship-desk';
const KINDS = ['human', 'bot'];
const TASKS = ['understand', 'make', 'test'];
const STATUSES = { draft: 'Private draft', interest_received: 'Interest received', review_requested: 'Learning review requested', changes_requested: 'Changes suggested', reviewed: 'Learning review recorded' };
const empty = () => ({ label: '', goal: '', botName: '', onboarding: [false, false, false], tasks: { understand: 'todo', make: 'todo', test: 'todo' }, evidence: '' });
const payloadOf = record => record ? { label: record.label, goal: record.goal, botName: record.botName, onboarding: [...record.onboarding], tasks: { ...record.tasks }, evidence: record.evidence } : empty();
const validRecord = item => item && typeof item.ownerId === 'string' && typeof item.recordId === 'string' && item.recordId.length > 0 && KINDS.includes(item.kind) && typeof item.label === 'string' && typeof item.goal === 'string' && typeof item.botName === 'string' && typeof item.evidence === 'string' && Array.isArray(item.onboarding) && item.onboarding.length === 3 && item.onboarding.every(value => typeof value === 'boolean') && TASKS.every(task => ['todo', 'doing', 'ready'].includes(item.tasks?.[task])) && Number.isInteger(item.version) && item.version > 0 && Object.hasOwn(STATUSES, item.status) && typeof item.updatedAt === 'string' && typeof item.expiresAt === 'string' && (item.review === null || (typeof item.review?.note === 'string' && ['reviewed', 'changes_requested'].includes(item.review.decision) && typeof item.review.reviewedAt === 'string' && Number.isInteger(item.review.submittedVersion)));

/** Account data lives only in memory until an explicit authenticated save. */
export function mountInternshipDesk(root, { fetchImpl = globalThis.fetch } = {}) {
  if (root.dataset.ready === 'true') return;
  root.dataset.ready = 'true';
  const $ = selector => root.querySelector(selector);
  const all = selector => root.querySelectorAll(selector);
  const win = root.ownerDocument.defaultView;
  let userId = null;
  let records = [];
  let kind = 'human';
  let available = false;
  let busy = false;
  let conflict = false;
  let pendingKind = null;
  let epoch = 0;
  let baseline = empty();
  let masked = false;
  let visibilityEpoch = 0;
  let away = false;
  const record = () => records.find(item => item.kind === kind) || null;
  const status = message => { $('[data-desk-status]').textContent = message; };
  const read = () => ({
    label: $('[data-desk-field="label"]').value,
    goal: $('[data-desk-field="goal"]').value,
    botName: kind === 'bot' ? $('[data-desk-field="botName"]').value : '',
    onboarding: [...all('[data-desk-onboarding]')].map(input => input.checked),
    tasks: Object.fromEntries([...all('[data-desk-task]')].map(input => [input.dataset.deskTask, input.value])),
    evidence: $('[data-desk-field="evidence"]').value,
  });
  const dirty = () => JSON.stringify(read()) !== JSON.stringify(baseline);
  function write(payload) {
    all('[data-desk-field]').forEach(input => { input.value = payload[input.dataset.deskField]; });
    all('[data-desk-onboarding]').forEach(input => { input.checked = payload.onboarding[Number(input.dataset.deskOnboarding)]; });
    all('[data-desk-task]').forEach(input => { input.value = payload.tasks[input.dataset.deskTask]; });
  }
  function showRecord() {
    baseline = payloadOf(record());
    write(baseline);
    $('[data-desk-switch-confirm]').hidden = true;
    $('[data-desk-delete-confirm]').hidden = true;
    pendingKind = null;
    render();
  }
  function render() {
    const current = record();
    const changed = dirty();
    const locked = !available || busy || conflict || masked;
    $('[data-desk-fields]').disabled = locked;
    $('[data-desk-form]').setAttribute('aria-busy', String(busy));
    all('[data-desk-kind]').forEach(button => { button.disabled = locked; button.setAttribute('aria-pressed', String(button.dataset.deskKind === kind)); });
    $('[data-desk-bot-fields]').hidden = kind !== 'bot';
    $('[data-desk-bot-permissions]').hidden = kind !== 'bot';
    $('[data-desk-accountability]').textContent = kind === 'bot' ? 'I am the accountable human sponsor. I will review each submission made through this account. This is optional learning, not a job or work assignment.' : 'I understand this is an optional, self-chosen learning exercise, not a job or work assignment. It creates no obligation to PointCast.';
    const botName = $('[data-desk-field="botName"]');
    botName.disabled = locked || kind !== 'bot';
    botName.required = kind === 'bot';
    $('[data-desk-account]').textContent = userId ? 'Signed-in account · private desk' : 'No account loaded.';
    $('[data-desk-dirty]').textContent = changed ? 'Unsaved changes. Save before sending interest or requesting review.' : 'No unsaved changes.';
    $('[data-desk-meta]').textContent = current ? `${STATUSES[current.status] || 'Saved record'} · version ${current.version} · saved ${current.updatedAt} · expires ${current.expiresAt}` : 'No saved record for this path.';
    $('[data-desk-save]').disabled = locked || !changed;
    const agreement = baseline.onboarding.every(Boolean);
    $('[data-desk-interest]').disabled = locked || changed || !current || current.status !== 'draft' || !agreement;
    $('[data-desk-request-review]').disabled = locked || changed || !current || !['interest_received', 'changes_requested'].includes(current.status) || !agreement || !TASKS.every(task => baseline.tasks[task] === 'ready') || baseline.evidence.trim().length < 30;
    $('[data-desk-delete]').disabled = locked || !current;
    $('[data-desk-reload]').disabled = busy;
    $('[data-desk-discard]').disabled = busy;
    $('[data-desk-delete-yes]').disabled = locked;
    $('[data-desk-delete-no]').disabled = busy;
    $('[data-desk-conflict]').hidden = !conflict;
    const feedback = current?.review;
    $('[data-desk-feedback]').hidden = !feedback;
    $('[data-desk-review-meta]').textContent = feedback ? `${feedback.decision === 'changes_requested' ? 'Changes suggested' : 'Learning review recorded'} · submitted version ${feedback.submittedVersion} · ${feedback.reviewedAt}` : '';
    $('[data-desk-review-note]').textContent = feedback?.note || '';
  }
  // Invalidate in-flight requests before clearing every private field.
  function clearPrivate(message, login = true) {
    epoch += 1;
    userId = null;
    records = [];
    available = false;
    busy = false;
    conflict = false;
    masked = false;
    root.dataset.privateMasked = 'false';
    kind = 'human';
    baseline = empty();
    write(baseline);
    pendingKind = null;
    $('[data-desk-switch-confirm]').hidden = true;
    $('[data-desk-delete-confirm]').hidden = true;
    $('[data-desk-access]').hidden = !login;
    render();
    status(message);
  }
  function fail(response, data) {
    if (response.status === 401 || response.status === 403 || data?.error === 'account-mismatch' || data?.error === 'account-changed') {
      clearPrivate(response.status === 403 ? 'Access is unavailable for this account. Private fields have been cleared. Sign in and reload to check access.' : 'Sign in to use the private desk. Private fields have been cleared.');
    } else if (response.status === 503) {
      clearPrivate('The private desk is unavailable. Activation is pending security review. No save or submission is confirmed. There is no local fallback.', false);
    } else if (response.status === 409) {
      conflict = true;
      status(data?.error === 'version-conflict' ? 'The saved version changed. Actions are paused. Your text is still here; explicitly discard these edits to load the latest version.' : 'The server could not accept this step. Actions are paused. Reload the saved record before trying again.');
      render();
    } else {
      status(response.status === 429 ? 'Too many requests. Wait before trying again. Nothing new is confirmed saved.' : 'This action was not confirmed. Check the form, then retry or reload the saved record.');
    }
  }
  function accept(data, previousUser) {
    if (!data || data.ok !== true || typeof data.userId !== 'string' || !Array.isArray(data.records)) throw new Error('Invalid server response');
    if (previousUser && data.userId !== previousUser) {
      clearPrivate('Your account changed. Previous private fields have been cleared. Sign in and reload for the current account.');
      return false;
    }
    if (data.records.length > 2 || !data.records.every(item => validRecord(item) && item.ownerId === data.userId) || new Set(data.records.map(item => item.kind)).size !== data.records.length) throw new Error('Invalid private records');
    userId = data.userId;
    records = data.records;
    available = true;
    conflict = false;
    $('[data-desk-access]').hidden = true;
    showRecord();
    return true;
  }
  function maskPrivate() {
    visibilityEpoch += 1;
    away = true;
    if (!userId && !busy) return;
    masked = true;
    root.dataset.privateMasked = 'true';
    render();
  }
  async function verifyAccount() {
    if (!masked || !userId || busy || away || root.ownerDocument.visibilityState === 'hidden') return;
    const previousUser = userId;
    const requestEpoch = ++epoch;
    const visibilityToken = visibilityEpoch;
    busy = true;
    render();
    status('Checking the current account before showing private fields…');
    try {
      const response = await fetchImpl(ENDPOINT, { method: 'GET', credentials: 'same-origin', cache: 'no-store', headers: { Accept: 'application/json' } });
      const data = await response.json();
      if (requestEpoch !== epoch) return;
      if (visibilityToken !== visibilityEpoch || away || root.ownerDocument.visibilityState === 'hidden') return;
      if (!response.ok || !data.ok) { fail(response, data); return; }
      if (data.userId !== previousUser) { clearPrivate('Your account changed. Previous private fields have been cleared. Sign in and reload for the current account.'); return; }
      if (!Array.isArray(data.records) || data.records.length > 2 || !data.records.every(item => validRecord(item) && item.ownerId === previousUser)) throw new Error('Invalid private records');
      const signatures = list => JSON.stringify(list.map(item => [item.kind, item.recordId, item.version]).sort());
      if (signatures(data.records) !== signatures(records)) {
        conflict = true;
        status('Your account is unchanged, but saved records changed elsewhere. Your unsaved text is preserved. Discard these edits and reload before another action.');
      } else status('Your account was checked. Unsaved text is still here; nothing was sent.');
      masked = false;
      root.dataset.privateMasked = 'false';
    } catch {
      if (requestEpoch === epoch) clearPrivate('The account check failed. Private fields were cleared. Reload the desk when the service is available.', false);
    } finally {
      if (requestEpoch === epoch) { busy = false; render(); if (visibilityToken !== visibilityEpoch && masked && !away) void verifyAccount(); }
    }
  }
  async function load() {
    const previousUser = userId;
    const requestEpoch = ++epoch;
    busy = true;
    render();
    status('Loading the saved desk from your account…');
    try {
      const response = await fetchImpl(ENDPOINT, { method: 'GET', credentials: 'same-origin', cache: 'no-store', headers: { Accept: 'application/json' } });
      const data = await response.json();
      if (requestEpoch !== epoch) return;
      if (!response.ok || !data.ok) fail(response, data);
      else if (accept(data, previousUser)) status('Saved records loaded. Nothing is sent until you choose an action.');
    } catch {
      if (requestEpoch === epoch) clearPrivate('The private desk could not be reached. No data is confirmed loaded or saved. Reload to try again; there is no local fallback.', false);
    } finally {
      if (requestEpoch === epoch) { busy = false; render(); if (masked) void verifyAccount(); }
    }
  }
  async function mutate(action) {
    if (!available || busy || conflict || !userId) return;
    render(); // Re-read controls even when browser restoration emitted no events.
    const button = action === 'save' ? $('[data-desk-save]') : action === 'interest' ? $('[data-desk-interest]') : action === 'request_review' ? $('[data-desk-request-review]') : $('[data-desk-delete]');
    if (button.disabled) return;
    if (action === 'save' && !$('[data-desk-form]').reportValidity()) return;
    const previousUser = userId;
    const requestEpoch = ++epoch;
    const body = { action, kind, version: record()?.version || 0, recordId: record()?.recordId || null };
    if (action === 'save') body.payload = read();
    busy = true;
    render();
    status('Waiting for the desk to confirm your action…');
    try {
      const response = await fetchImpl(ENDPOINT, { method: 'POST', credentials: 'same-origin', cache: 'no-store', headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-PointCast-User': previousUser }, body: JSON.stringify(body) });
      const data = await response.json();
      if (requestEpoch !== epoch) return;
      if (!response.ok || !data.ok) fail(response, data);
      else if (accept(data, previousUser)) status({ save: record()?.interestAt ? 'Changes saved. This record remains shared with PointCast’s director. Check this desk for any feedback; no email or response deadline is promised.' : 'Draft saved to your account. Interest and review are separate choices.', interest: 'Expression of interest recorded. This record and future saved progress are now visible to PointCast’s director. Check this desk for any feedback; no email or response deadline is promised. No position or payment is promised.', request_review: 'Learning review requested for the saved version. Check this desk for any feedback; no email or response deadline is promised. This is not a hiring or publication decision.', delete: 'This path’s record was deleted from the desk. Platform backups are governed separately.' }[action]);
    } catch {
      if (requestEpoch === epoch) {
        conflict = true;
        status('The result is uncertain. Do not repeat the action blindly. Reload the saved record to check what the server received; reloading discards unsaved edits.');
      }
    } finally {
      if (requestEpoch === epoch) { busy = false; render(); if (masked) void verifyAccount(); }
    }
  }
  $('[data-desk-form]').addEventListener('submit', event => { event.preventDefault(); void mutate('save'); });
  all('[data-desk-field], [data-desk-onboarding], [data-desk-task]').forEach(input => {
    input.addEventListener('input', render);
    input.addEventListener('change', render);
  });
  all('[data-desk-kind]').forEach(button => button.addEventListener('click', () => {
    if (!available || busy || conflict || button.dataset.deskKind === kind) return;
    if (dirty()) { pendingKind = button.dataset.deskKind; $('[data-desk-switch-confirm]').hidden = false; return; }
    kind = button.dataset.deskKind;
    showRecord();
    status('Path changed. The human and bot-sponsor records are saved separately.');
  }));
  $('[data-desk-switch-discard]').addEventListener('click', () => { if (!pendingKind || busy || conflict || !available) return; kind = pendingKind; showRecord(); status('Unsaved edits discarded. The other path’s saved record is loaded.'); });
  $('[data-desk-switch-keep]').addEventListener('click', () => { pendingKind = null; $('[data-desk-switch-confirm]').hidden = true; });
  $('[data-desk-interest]').addEventListener('click', () => { void mutate('interest'); });
  $('[data-desk-request-review]').addEventListener('click', () => { void mutate('request_review'); });
  $('[data-desk-delete]').addEventListener('click', () => { if (!available || busy || conflict || !record()) return; $('[data-desk-delete-confirm]').hidden = false; });
  $('[data-desk-delete-no]').addEventListener('click', () => { $('[data-desk-delete-confirm]').hidden = true; });
  $('[data-desk-delete-yes]').addEventListener('click', () => { void mutate('delete'); });
  $('[data-desk-reload]').addEventListener('click', () => {
    if (busy) return;
    if (available && dirty()) { conflict = true; render(); status('Reloading would discard unsaved edits. Use the explicit discard-and-reload button to continue.'); return; }
    void load();
  });
  $('[data-desk-discard]').addEventListener('click', () => { if (!busy) void load(); });
  const authChanged = event => {
    const nextId = event.detail?.user?.userId || null;
    if (userId && nextId === userId) return;
    clearPrivate('Your account or session changed. Private fields have been cleared. Sign in and reload the desk before continuing.');
  };
  win.addEventListener('pc:auth-change', authChanged);
  const authRefresh = () => { clearPrivate('Your session needs to be checked again. Private fields have been cleared. Sign in and reload the desk.'); };
  win.addEventListener('pc:auth-refresh', authRefresh);
  // Mask private data while this page is away; cached pages cannot reveal it.
  const pageHidden = () => { clearPrivate('Private fields were cleared when leaving the desk. Reload saved records to continue.', false); };
  win.addEventListener('pagehide', pageHidden);
  const returned = () => { away = false; void verifyAccount(); };
  const visibilityChanged = () => { if (root.ownerDocument.visibilityState === 'hidden') maskPrivate(); else returned(); };
  win.addEventListener('blur', maskPrivate);
  win.addEventListener('focus', returned);
  root.ownerDocument.addEventListener('visibilitychange', visibilityChanged);
  clearPrivate('Checking whether the private desk is available…', false);
  void load();
  return { reload: load, destroy() { epoch += 1; win.removeEventListener('pc:auth-change', authChanged); win.removeEventListener('pc:auth-refresh', authRefresh); win.removeEventListener('pagehide', pageHidden); win.removeEventListener('blur', maskPrivate); win.removeEventListener('focus', returned); root.ownerDocument.removeEventListener('visibilitychange', visibilityChanged); clearPrivate('Desk closed.', false); } };
}
