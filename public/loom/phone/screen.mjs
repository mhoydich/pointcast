import { addFullRequest } from './full-request.mjs';
import { BOARD, MAX_REPLY, OWNER, blockedPulls, endpoints, inbox, postReply, threadUrl } from './phone.mjs';

const { api, canPost } = endpoints(location);
const get = (id) => document.getElementById(id);
const name = get('post-name');
const refresh = get('refresh');
const feedback = get('overview');
const cards = new Map();
const nameKey = 'loom.phone.name';
let loading = false;
let posting = false;

function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text) node.textContent = text;
  if (className) node.className = className;
  return node;
}

function link(text, href) {
  const node = element('a', text, 'thread');
  node.href = href;
  return node;
}

function button(text, primary = false) {
  const node = element('button', text, primary ? 'primary' : '');
  node.type = 'button';
  return node;
}

function syncControls() {
  refresh.disabled = loading || posting;
  for (const control of document.querySelectorAll('[data-post]')) {
    const state = cards.get(control.dataset.post);
    control.disabled = posting || ['posted', 'unknown'].includes(state.status);
  }
}

function drawCard(row, group) {
  if (!cards.has(row.target)) cards.set(row.target, { draft: '', expanded: false, status: '' });
  const state = cards.get(row.target);
  const card = element('article');
  const context = group === 'blocked' ? [row.by, 'Board report'] : [row.by, row.room];
  card.append(element('p', context.filter(Boolean).join(' · '), 'meta'));
  for (const note of row.notes ?? [{ text: row.text, prs: [] }]) {
    card.append(element('p', note.text, 'question'));
    const links = element('div', '', 'links');
    for (const pr of note.prs) {
      const [owner, project, , number] = new URL(pr).pathname.slice(1).split('/');
      const label = owner === 'mhoydich' && project === 'pointcast' ? `PR #${number}` : `${owner}/${project} #${number}`;
      links.append(link(label, pr));
    }
    if (note.prs.length) card.append(links);
  }
  if (group === 'gates' && row.text.endsWith('…')) addFullRequest(card, row.target, read);
  card.append(link('Open thread', threadUrl(row.target)));
  if (!canPost) return card;

  const result = element('p', '', 'result');
  result.setAttribute('role', 'status');
  const showResult = () => {
    const texts = {
      pending: 'Posting…', posted: 'Loom accepted the public reply.', limited: 'Loom is limiting replies. Try again in a moment.',
      rejected: 'Loom declined the reply. Check the thread and try again.',
      unknown: 'The reply may have posted. Open the thread to check.', invalid: 'Enter a name and a short reply.',
    };
    result.textContent = texts[state.status] ?? '';
    if (state.url) result.append(' ', link('View reply', state.url));
  };

  async function send(body) {
    if (posting || ['posted', 'unknown'].includes(state.status)) return;
    if (!name.value.trim()) {
      get('name-error').textContent = 'Enter your name to post a public reply.';
      name.focus();
      return;
    }
    if (!body.trim()) {
      result.textContent = 'Enter a short reply.';
      return;
    }
    const displayName = name.value.trim();
    try { localStorage.setItem(nameKey, displayName); } catch { /* Storage is optional. */ }
    posting = true;
    state.status = 'pending';
    syncControls();
    showResult();
    const receipt = await postReply(api, row.target, displayName, body);
    Object.assign(state, receipt);
    if (state.status === 'posted') {
      state.draft = '';
      state.expanded = false;
      textarea.value = '';
      form.hidden = true;
      reply.setAttribute('aria-expanded', 'false');
      reply.textContent = 'Write a reply';
    }
    posting = false;
    syncControls();
    showResult();
  }

  const actions = element('div', '', 'actions');
  const quick = group === 'gates' ? ['Yes', 'No'] : ['Got it'];
  for (const value of quick) {
    const tap = button(`Post “${value}”`, value !== 'No');
    tap.dataset.post = row.target;
    tap.addEventListener('click', () => send(value));
    actions.append(tap);
  }
  const reply = button(state.expanded ? 'Hide reply' : 'Write a reply');
  reply.dataset.post = row.target;
  reply.setAttribute('aria-expanded', String(state.expanded));
  reply.addEventListener('click', () => {
    state.expanded = !state.expanded;
    form.hidden = !state.expanded;
    reply.setAttribute('aria-expanded', String(state.expanded));
    reply.textContent = state.expanded ? 'Hide reply' : 'Write a reply';
    if (state.expanded) textarea.focus();
  });
  actions.append(reply);

  const form = element('form');
  form.hidden = !state.expanded;
  const label = element('label', 'Short reply');
  const textarea = element('textarea');
  textarea.rows = 2;
  textarea.maxLength = MAX_REPLY;
  textarea.required = true;
  textarea.value = state.draft;
  textarea.addEventListener('input', () => { state.draft = textarea.value; });
  label.append(textarea);
  const submit = button('Post reply', true);
  submit.type = 'submit';
  submit.dataset.post = row.target;
  form.addEventListener('submit', (event) => { event.preventDefault(); send(textarea.value); });
  form.append(label, element('p', 'Use your phone keyboard’s microphone to dictate.', 'dictation'), submit);
  card.append(actions, form, result);
  showResult();
  return card;
}

async function read(query) {
  const response = await fetch(`${api}?${new URLSearchParams(query)}`, {
    credentials: 'omit', redirect: 'error', signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) throw new Error('read_failed');
  return response.json();
}

function drawSection(id, items, empty) {
  const section = get(id);
  if (items?.length) section.replaceChildren(...items.map((item) => drawCard(item, id)));
  else section.replaceChildren(element('p', items ? empty : 'Couldn’t load this section. Tap Refresh to retry.', 'empty'));
  return items?.length ?? 0;
}

async function load() {
  loading = true;
  syncControls();
  feedback.textContent = 'Checking the Loom…';
  const [feed, board] = await Promise.allSettled([
    read({ for: OWNER, format: 'json' }).then(inbox), read({ to: BOARD }).then(blockedPulls),
  ]);
  const { gates = null, replies = null } = feed.status === 'fulfilled' ? feed.value : {};
  const blocked = board.status === 'fulfilled' ? board.value : null;
  let cardCount = drawSection('gates', gates, 'No open yes-or-no asks.');
  cardCount += drawSection('replies', replies, 'No replies since the last seen mark.');
  cardCount += drawSection('blocked', blocked, 'No blocked PRs in the retained board reports.');
  get('queue').hidden = false;
  get('identity').hidden = !canPost || !cardCount;
  const partial = !gates || !replies || !blocked;
  feedback.textContent = `${cardCount} ${cardCount === 1 ? 'item' : 'items'} to review${partial ? ' in the sections that loaded' : ''}.`;
  loading = false;
  syncControls();
}

if (canPost) {
  try {
    name.value = (localStorage.getItem(nameKey) || (localStorage.getItem('loom.akind') !== 'agent' ? localStorage.getItem('loom.name') : '') || '').slice(0, 40);
  } catch { /* Storage is optional. */ }
  name.addEventListener('input', () => { get('name-error').textContent = ''; });
}
get('preview-note').hidden = canPost;
refresh.hidden = false;
refresh.addEventListener('click', load);
load();
