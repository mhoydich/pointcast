const ENDPOINT = '/api/director/internship-desk';
const STATUS_LABELS = Object.freeze({
  draft: 'Draft', interest_received: 'Interest received', review_requested: 'Review requested',
  changes_requested: 'Changes requested', reviewed: 'Reviewed',
});
const TASK_LABELS = Object.freeze({ understand: 'Understand the work', make: 'Make the handoff', test: 'Test the result' });
const TASK_STATES = Object.freeze({ todo: 'To do', doing: 'In progress', ready: 'Ready for review' });
const ONBOARDING = [
  'I understand this is an optional, self-chosen learning exercise, not a job or work assignment. It creates no obligation to PointCast.',
  'I will use fictional or offline examples and material I have permission to use, without sensitive information.',
  'I understand this is not employment, unpaid production work, or a promise of a position, payment, or response.',
];
const SPONSOR_AGREEMENT = 'I am the accountable human sponsor. I will review each submission made through this account. This is optional learning, not a job or work assignment.';
const mounted = new WeakMap();
const keyOf = (record) => JSON.stringify([record.ownerId, record.kind]);
const isText = (value) => typeof value === 'string';
const isId = (value) => isText(value) && value.length > 0 && value.length <= 500;
const isDecision = (value) => value === 'changes_requested' || value === 'reviewed';
const isTimestamp = (value) => value === null || isText(value) || (typeof value === 'number' && Number.isFinite(value));

function validRecord(record) {
  return record && typeof record === 'object' && isId(record.ownerId) && isId(record.recordId)
    && (record.kind === 'human' || record.kind === 'bot')
    && ['label', 'goal', 'evidence'].every((name) => isText(record[name]))
    && (record.botName === null || isText(record.botName))
    && Array.isArray(record.onboarding) && record.onboarding.length === 3
    && record.onboarding.every((value) => typeof value === 'boolean')
    && record.tasks && Object.keys(TASK_LABELS).every((name) => Object.hasOwn(TASK_STATES, record.tasks[name]))
    && Number.isSafeInteger(record.version) && record.version >= 1
    && (record.submittedVersion === null || (Number.isSafeInteger(record.submittedVersion) && record.submittedVersion >= 1 && record.submittedVersion <= record.version))
    && Object.hasOwn(STATUS_LABELS, record.status)
    && (record.status !== 'review_requested' || record.submittedVersion !== null)
    && ['interestAt', 'updatedAt', 'expiresAt'].every((name) => isTimestamp(record[name]))
    && (record.review === null || (record.review && isDecision(record.review.decision)
      && isText(record.review.note) && isId(record.review.reviewerId)
      && isTimestamp(record.review.reviewedAt) && record.review.reviewedAt !== null
      && Number.isSafeInteger(record.review.submittedVersion) && record.review.submittedVersion >= 1));
}

function validEnvelope(body, paginated) {
  return body && body.ok === true && isId(body.userId) && Array.isArray(body.records)
    && body.records.length <= 50 && body.records.every(validRecord)
    && new Set(body.records.map(keyOf)).size === body.records.length
    && (!paginated || body.nextCursor === null || (isText(body.nextCursor) && body.nextCursor.length > 0));
}

function timestamp(value) {
  if (value === null) return 'Not recorded';
  const date = new Date(typeof value === 'number' && value < 1e12 ? value * 1000 : value);
  return Number.isNaN(date.valueOf()) ? String(value) : `${date.toISOString().replace('T', ' ').replace('.000Z', ' UTC')}`;
}

/** Server-gated UI only; this module does not authenticate users or grant permissions. */
export function mountInternshipDeskReview(root, { fetchImpl = globalThis.fetch } = {}) {
  if (mounted.has(root)) return mounted.get(root);
  const doc = root.ownerDocument;
  const win = doc.defaultView;
  const find = (name) => {
    const element = root.querySelector(`[data-idk-review-${name}]`);
    if (!element) throw new Error(`Missing review element: ${name}`);
    return element;
  };
  const status = find('status');
  const login = find('login');
  const load = find('load');
  const reload = find('reload');
  const more = find('more');
  const list = find('list');
  const empty = find('empty');
  const entries = new Map();
  let userId = null;
  let nextCursor = null;
  let busy = false;
  let blocked = null;
  let epoch = 0;
  let request = null;
  let serial = 0;
  let destroyed = false;
  let privateMasked = false;
  let needsRevalidation = false;
  let activeView = true;
  let visibilityEpoch = 0;

  function notice(message) { status.textContent = message; }
  function node(tag, text, className) {
    const element = doc.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }
  function textBlock(title, text) {
    const section = node('div');
    section.append(node('h4', title));
    const content = node('p', text || 'Not supplied');
    content.style.whiteSpace = 'pre-wrap';
    content.style.overflowWrap = 'anywhere';
    section.append(content);
    return section;
  }
  function controls() {
    root.setAttribute('aria-busy', String(busy));
    root.dataset.privateMasked = String(privateMasked);
    list.hidden = privateMasked;
    list.setAttribute('aria-busy', String(busy));
    load.hidden = userId !== null;
    load.disabled = busy || destroyed || privateMasked;
    reload.hidden = userId === null;
    reload.disabled = busy || destroyed || privateMasked;
    more.hidden = !nextCursor || blocked !== null;
    more.disabled = busy || destroyed || privateMasked;
    empty.hidden = userId === null || entries.size > 0 || busy;
    for (const entry of entries.values()) {
      if (!entry.form) continue;
      for (const control of [entry.note, entry.decision, entry.submit]) control.disabled = busy || blocked !== null || destroyed || privateMasked;
    }
  }
  function clearPrivate() {
    epoch += 1;
    request?.abort();
    request = null;
    for (const entry of entries.values()) {
      if (entry.note) entry.note.value = '';
      if (entry.decision) entry.decision.value = '';
      entry.card.replaceChildren();
    }
    entries.clear();
    list.replaceChildren();
    userId = null;
    nextCursor = null;
    busy = false;
    blocked = null;
    privateMasked = !activeView;
    needsRevalidation = !activeView;
    login.hidden = true;
    controls();
  }
  function unavailable(kind, message) {
    clearPrivate();
    blocked = kind;
    root.dataset.state = kind;
    login.hidden = kind === 'login' ? false : true;
    notice(message);
    controls();
  }
  function conflict(message) {
    blocked = 'conflict';
    root.dataset.state = 'conflict';
    nextCursor = null;
    for (const entry of entries.values()) {
      if (entry.decision) entry.decision.value = '';
      if (entry.feedback) entry.feedback.textContent = 'This queue must be reloaded before further feedback. Reloading discards these notes.';
    }
    notice(message);
    controls();
  }
  function handleAccess(response) {
    if (response.status === 401) {
      unavailable('login', 'Sign in to ask the server for the private queue. No private records are displayed.');
      return true;
    }
    if (response.status === 403) {
      unavailable('denied', 'Access is unavailable for this account. The queue and unsent notes have been cleared.');
      return true;
    }
    if (response.status === 503) {
      unavailable('disabled', 'The private review desk is disabled or unavailable. No local fallback or private queue is available.');
      return true;
    }
    return false;
  }
  function newRequest() {
    request = new (win?.AbortController || globalThis.AbortController)();
    return request;
  }

  function recordCard(record) {
    const card = node('article', undefined, 'idk-card idk-review-card');
    card.dataset.idkReviewCard = '';
    card.dataset.ownerId = record.ownerId;
    card.dataset.kind = record.kind;
    card.dataset.recordId = record.recordId;
    const headingId = `idk-record-${++serial}`;
    card.setAttribute('aria-labelledby', headingId);
    card.append(node('p', `${record.kind === 'bot' ? 'Bot sponsor' : 'Human'} learning record / ${STATUS_LABELS[record.status]}`, 'idk-kicker'));
    const heading = node('h3', record.label || 'Untitled learning record');
    heading.id = headingId;
    card.append(heading);
    const meta = node('dl', undefined, 'idk-meta');
    for (const [label, value] of [
      [record.kind === 'bot' ? 'Sponsor account' : 'Owner account', record.ownerId], ['Saved record version', String(record.version)],
      ['Submitted work version', record.submittedVersion === null ? 'Not submitted for review' : String(record.submittedVersion)],
      ['Interest recorded', timestamp(record.interestAt)], ['Updated', timestamp(record.updatedAt)], ['Proposed expiry', timestamp(record.expiresAt)],
    ]) {
      const pair = node('div');
      pair.append(node('dt', label), node('dd', value));
      meta.append(pair);
    }
    card.append(meta, textBlock('Learning goal', record.goal));
    if (record.kind === 'bot') card.append(textBlock('Bot name supplied by the sponsor', record.botName));
    const checklist = node('ul');
    record.onboarding.forEach((checked, index) => {
      const agreement = index === 0 && record.kind === 'bot' ? SPONSOR_AGREEMENT : ONBOARDING[index];
      checklist.append(node('li', `${checked ? 'Confirmed by owner' : 'Not confirmed'}: ${agreement}`));
    });
    const onboarding = node('section');
    onboarding.append(node('h4', 'Owner-reported working agreement'), checklist);
    const tasks = node('ul');
    Object.entries(TASK_LABELS).forEach(([key, label]) => tasks.append(node('li', `${label}: ${TASK_STATES[record.tasks[key]]}`)));
    const taskSection = node('section');
    taskSection.append(node('h4', 'Owner-reported task status'), tasks);
    const grid = node('div', undefined, 'idk-grid');
    grid.append(onboarding, taskSection);
    card.append(grid, textBlock('Evidence supplied for review', record.evidence));
    card.append(node('p', 'Evidence is shown as text. Links, code, and claims have not been opened, executed, or independently verified by this desk.', 'idk-small'));
    if (record.review) {
      const review = node('section', undefined, 'idk-notice');
      review.append(node('h4', 'Feedback recorded by the server'));
      review.append(node('p', `${STATUS_LABELS[record.review.decision]} / submission version ${record.review.submittedVersion}`));
      review.append(textBlock('Review note', record.review.note));
      review.append(node('p', `Reviewer account: ${record.review.reviewerId} · ${timestamp(record.review.reviewedAt)}`, 'idk-small'));
      card.append(review);
    } else card.append(node('p', 'No review is recorded for this submission.', 'idk-small'));

    const entry = { record, card, form: null, note: null, decision: null, submit: null, feedback: null };
    if (record.status !== 'review_requested' || record.ownerId === userId) {
      card.append(node('p', record.ownerId === userId
        ? 'Read-only: you cannot review your own record.'
        : 'Read-only: the owner has not requested a review of this version.', 'idk-status'));
      return entry;
    }
    const form = node('form');
    form.dataset.idkReviewForm = '';
    const decision = node('select');
    decision.dataset.idkReviewDecision = '';
    decision.id = `${headingId}-decision`;
    decision.name = 'decision';
    decision.required = true;
    for (const [value, label] of [['', 'Choose a feedback outcome'], ['changes_requested', 'Request another pass'], ['reviewed', 'Mark learning review complete']]) {
      const option = node('option', label);
      option.value = value;
      decision.append(option);
    }
    const decisionLabel = node('label', 'Feedback outcome', 'idk-field');
    decisionLabel.htmlFor = decision.id;
    const note = node('textarea');
    note.dataset.idkReviewNote = '';
    note.id = `${headingId}-note`;
    note.name = 'note';
    note.rows = 5;
    note.required = true;
    note.minLength = 10;
    note.maxLength = 1000;
    note.autocomplete = 'off';
    const noteLabel = node('label', 'Useful learning feedback · 10–1,000 characters', 'idk-field');
    noteLabel.htmlFor = note.id;
    const help = node('p', 'Describe what you checked and the next useful step. Do not include contact details, private links, credentials, or sensitive information. This feedback cannot authorize employment, pay, publication, deployment, or spending.', 'idk-small');
    help.id = `${headingId}-help`;
    note.setAttribute('aria-describedby', help.id);
    const feedback = node('p', '', 'idk-status');
    feedback.dataset.idkReviewFeedback = '';
    feedback.setAttribute('role', 'status');
    feedback.setAttribute('aria-live', 'polite');
    const submit = node('button', `Save learning feedback for record version ${record.version}`, 'idk-button');
    submit.type = 'submit';
    submit.dataset.idkReviewSubmit = '';
    const actions = node('div', undefined, 'idk-actions');
    actions.append(submit);
    form.append(node('h4', 'Give learning feedback'), decisionLabel, decision, noteLabel, note, help, feedback, actions);
    Object.assign(entry, { form, note, decision, submit, feedback });
    form.addEventListener('submit', (event) => { event.preventDefault(); void submitReview(entry); });
    card.append(form);
    return entry;
  }

  async function loadQueue(append = false) {
    if (destroyed || busy || (append && (!nextCursor || blocked))) return;
    const expectedUser = userId;
    const cursor = append ? nextCursor : null;
    if (!append) clearPrivate();
    const token = epoch;
    const controller = newRequest();
    busy = true;
    root.dataset.state = 'loading';
    notice(append ? 'Loading the next page from the server…' : 'Asking the server for the private review queue…');
    controls();
    try {
      const url = cursor ? `${ENDPOINT}?cursor=${encodeURIComponent(cursor)}` : ENDPOINT;
      const response = await fetchImpl(url, { method: 'GET', credentials: 'same-origin', cache: 'no-store', signal: controller.signal });
      if (token !== epoch || destroyed) return;
      if (handleAccess(response)) return;
      if (!response.ok) throw new Error('Queue request failed');
      const body = await response.json();
      if (token !== epoch || destroyed) return;
      if (expectedUser && isId(body?.userId) && body.userId !== expectedUser) {
        unavailable('login', 'The signed-in account changed. The queue and notes were cleared. Sign in again, then load the queue.');
        return;
      }
      if (!validEnvelope(body, true)) throw new Error('Unexpected queue response');
      // Do not silently replace a previously inspected version or its unsent notes.
      if (append && body.records.some((record) => entries.has(keyOf(record)))) {
        conflict('The queue changed while paging. Reload the queue and discard notes before reviewing the latest submissions.');
        return;
      }
      userId = body.userId;
      nextCursor = body.nextCursor;
      blocked = null;
      for (const record of body.records) {
        const entry = recordCard(record);
        entries.set(keyOf(record), entry);
        list.append(entry.card);
      }
      root.dataset.state = 'ready';
      notice(`${entries.size} ${entries.size === 1 ? 'record' : 'records'} loaded from the server.${nextCursor ? ' More records are available.' : ' End of the current queue.'}`);
    } catch {
      if (token !== epoch || destroyed) return;
      unavailable('unavailable', 'The server could not provide a valid queue. Private records and notes have been cleared. Try loading again; there is no local fallback.');
    } finally {
      if (token === epoch && !destroyed) { busy = false; request = null; controls(); void revalidateAccess(); }
    }
  }

  async function submitReview(entry) {
    if (destroyed || busy || blocked || privateMasked || !userId || entries.get(keyOf(entry.record)) !== entry) return;
    const record = entry.record;
    if (record.status !== 'review_requested' || record.ownerId === userId) return;
    const note = entry.note.value.trim();
    const decision = entry.decision.value;
    if (!isDecision(decision) || note.length < 10 || note.length > 1000) {
      entry.feedback.textContent = 'Choose an outcome and write 10–1,000 characters of learning feedback.';
      (isDecision(decision) ? entry.note : entry.decision).focus();
      return;
    }
    const token = epoch;
    const expectedUser = userId;
    const controller = newRequest();
    busy = true;
    entry.feedback.textContent = 'Saving feedback for this submitted version…';
    notice('Saving learning feedback. Queue controls are paused until the server responds.');
    controls();
    try {
      const response = await fetchImpl(ENDPOINT, {
        method: 'POST', credentials: 'same-origin', cache: 'no-store', signal: controller.signal,
        headers: { 'Content-Type': 'application/json', 'X-PointCast-User': expectedUser },
        body: JSON.stringify({ ownerId: record.ownerId, kind: record.kind, recordId: record.recordId, version: record.version, decision, note }),
      });
      if (token !== epoch || destroyed) return;
      if (handleAccess(response)) return;
      if (response.status === 409) {
        conflict('This submitted version changed. No review is confirmed. Reload the queue and discard notes, then inspect the current version before submitting again.');
        return;
      }
      if (response.status === 400 || response.status === 422) {
        entry.feedback.textContent = 'The server did not accept this feedback. Check the outcome and note before submitting again.';
        notice('Feedback was not accepted. No saved review is confirmed.');
        return;
      }
      if (!response.ok) throw new Error('Save outcome unknown');
      const body = await response.json();
      if (token !== epoch || destroyed) return;
      if (isId(body?.userId) && body.userId !== expectedUser) {
        unavailable('login', 'The signed-in account changed. The queue and notes were cleared. Sign in again, then load the queue.');
        return;
      }
      if (!validEnvelope(body, false)) throw new Error('Unexpected review response');
      const updated = body.records[0];
      if (body.records.length !== 1 || keyOf(updated) !== keyOf(record) || updated.recordId !== record.recordId || updated.version < record.version || updated.status !== decision
        || !updated.review || updated.review.decision !== decision || updated.review.reviewerId !== expectedUser
        || updated.review.submittedVersion !== record.submittedVersion) throw new Error('Saved review did not match the submission');
      entry.note.value = '';
      entry.decision.value = '';
      const replacement = recordCard(updated);
      entries.set(keyOf(updated), replacement);
      entry.card.replaceWith(replacement.card);
      notice('The server recorded learning feedback for this submitted version. This grants no hiring, pay, publication, deployment, or spending approval.');
      replacement.card.tabIndex = -1;
      replacement.card.focus();
    } catch {
      if (token !== epoch || destroyed) return;
      conflict('The save outcome could not be confirmed. Do not resubmit. Reload the queue and discard notes to check the server’s current review before taking another action.');
    } finally {
      if (token === epoch && !destroyed) { busy = false; request = null; controls(); void revalidateAccess(); }
    }
  }

  // An account can change in another tab without sending this window an event.
  // Mask first, then revalidate server access without replacing unsent notes.
  async function revalidateAccess() {
    if (destroyed || busy || !activeView || !needsRevalidation) return;
    if (!userId) {
      privateMasked = false;
      needsRevalidation = false;
      controls();
      return;
    }
    const expectedUser = userId;
    const token = epoch;
    const visibilityToken = visibilityEpoch;
    const controller = newRequest();
    busy = true;
    notice('Checking current account access before showing the private queue…');
    controls();
    try {
      const response = await fetchImpl(ENDPOINT, { method: 'GET', credentials: 'same-origin', cache: 'no-store', signal: controller.signal });
      if (token !== epoch || destroyed) return;
      if (handleAccess(response)) return;
      if (!response.ok) throw new Error('Access check failed');
      const body = await response.json();
      if (token !== epoch || destroyed) return;
      if (isId(body?.userId) && body.userId !== expectedUser) {
        unavailable('login', 'The signed-in account changed. The queue and notes were cleared. Sign in again, then load the queue.');
        return;
      }
      if (!validEnvelope(body, true)) throw new Error('Unexpected access response');
      if (visibilityToken !== visibilityEpoch || !activeView) return;
      const changed = body.records.some((record) => {
        const previous = entries.get(keyOf(record))?.record;
        return previous && (previous.recordId !== record.recordId || previous.version !== record.version
          || previous.submittedVersion !== record.submittedVersion || previous.status !== record.status);
      });
      privateMasked = false;
      needsRevalidation = false;
      if (changed) conflict('Account access was rechecked, but a loaded record changed. Your notes are preserved. Reload the queue and discard notes before reviewing the current version.');
      else notice(blocked === 'conflict'
        ? 'Account access was rechecked. The queue still requires an explicit reload; unsent notes are preserved until you discard them.'
        : 'Account access was rechecked. Your unsent notes are unchanged. Feedback still applies only to the exact saved record and submitted work version.');
      // Only the first server page is probed here. Other loaded pages remain
      // protected by recordId + version comparison on every review POST.
    } catch {
      if (token !== epoch || destroyed) return;
      unavailable('unavailable', 'Current account access could not be confirmed. Private records and notes have been cleared. Load the queue again to retry.');
    } finally {
      if (token === epoch && !destroyed) { busy = false; request = null; controls(); if (needsRevalidation && activeView) void revalidateAccess(); }
    }
  }

  const onLoad = () => { void loadQueue(); };
  const onMore = () => { void loadQueue(true); };
  const onAccountChange = () => {
    if (destroyed) return;
    unavailable('login', 'The account session changed. The private queue and unsent notes were cleared. Sign in if needed, then load the queue again.');
  };
  const onPageHide = () => {
    if (destroyed) return;
    unavailable('unavailable', 'The private queue and notes were cleared when this page was left. Load the queue again to ask the server for current access and records.');
  };
  const onBlur = () => {
    if (destroyed) return;
    activeView = false;
    visibilityEpoch += 1;
    privateMasked = true;
    needsRevalidation = true;
    controls();
  };
  const onFocus = () => {
    if (destroyed) return;
    activeView = true;
    void revalidateAccess();
  };
  const onVisibility = () => { if (doc.visibilityState === 'hidden') onBlur(); else onFocus(); };
  const eventTarget = win || doc;
  load.addEventListener('click', onLoad);
  reload.addEventListener('click', onLoad);
  more.addEventListener('click', onMore);
  eventTarget.addEventListener('pc:auth-change', onAccountChange, true);
  eventTarget.addEventListener('pc:auth-refresh', onAccountChange, true);
  eventTarget.addEventListener('pagehide', onPageHide);
  eventTarget.addEventListener('blur', onBlur);
  eventTarget.addEventListener('focus', onFocus);
  doc.addEventListener('visibilitychange', onVisibility);
  const api = {
    reload: () => loadQueue(),
    destroy() {
      if (destroyed) return;
      destroyed = true;
      clearPrivate();
      load.removeEventListener('click', onLoad);
      reload.removeEventListener('click', onLoad);
      more.removeEventListener('click', onMore);
      eventTarget.removeEventListener('pc:auth-change', onAccountChange, true);
      eventTarget.removeEventListener('pc:auth-refresh', onAccountChange, true);
      eventTarget.removeEventListener('pagehide', onPageHide);
      eventTarget.removeEventListener('blur', onBlur);
      eventTarget.removeEventListener('focus', onFocus);
      doc.removeEventListener('visibilitychange', onVisibility);
      mounted.delete(root);
      notice('The private review queue has been cleared.');
    },
  };
  mounted.set(root, api);
  void loadQueue();
  return api;
}
