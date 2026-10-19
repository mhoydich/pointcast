/**
 * /front-desk/agents — read the JSON twin, then POST a check-in.
 * Rendering uses textContent. The company field is the honeypot.
 */

const $ = (id) => document.getElementById(id);

function digits(id, word) {
  const el = $(id);
  if (!el) return;
  el.replaceChildren();
  el.setAttribute('aria-label', word);
  const text = String(word || '–');
  for (const ch of text) {
    const span = document.createElement('span');
    span.className = 'digit is-on';
    span.textContent = ch;
    el.append(span);
  }
}

function row(visitor) {
  const li = document.createElement('li');
  const name = document.createElement('strong');
  name.textContent = visitor.name;
  const level = document.createElement('p');
  level.className = 'lvl';
  level.textContent = visitor.level;
  const purpose = document.createElement('p');
  purpose.className = 'note';
  purpose.textContent = visitor.purpose || '';
  li.append(name, level, purpose);
  return li;
}

function paintList(id, visitors, empty) {
  const list = $(id);
  if (!list) return;
  list.replaceChildren();
  if (!visitors.length) {
    const li = document.createElement('li');
    li.className = 'note';
    li.textContent = empty;
    list.append(li);
    return;
  }
  for (const visitor of visitors) list.append(row(visitor));
}

function paint(board) {
  digits('count-all', String(board?.counts?.all ?? 0));
  digits('count-human', String(board?.counts?.human ?? 0));
  digits('count-agent', String(board?.counts?.agent ?? 0));
  digits('count-date', board?.date || '–');
  const levels = board?.counts?.levels || {};
  const line = $('level-line');
  if (line) {
    line.textContent = `self-declared ${levels['self-declared'] ?? 0} · key-signed ${levels['key-signed'] ?? 0} · operator-vouched ${levels['operator-vouched'] ?? 0} · registered-onchain ${levels['registered-onchain'] ?? 0}`;
  }
  const visitors = Array.isArray(board?.visitors) ? board.visitors : [];
  paintList('list-human', visitors.filter((v) => v.kind === 'human'), 'No people yet today.');
  paintList('list-agent', visitors.filter((v) => v.kind === 'agent'), 'No agents yet today.');
}

async function load() {
  try {
    const response = await fetch('/front-desk/agents.json', { headers: { accept: 'application/json' } });
    const board = await response.json();
    paint(board);
  } catch {
    const line = $('level-line');
    if (line) line.textContent = 'The book did not answer. The JSON twin is /front-desk/agents.json.';
  }
}

function showSlip(visit, repeat) {
  const slip = $('slip');
  const body = $('slip-body');
  if (!slip || !body || !visit) return;
  slip.hidden = false;
  body.textContent = JSON.stringify({ repeat: Boolean(repeat), stamp: visit.stamp, receipt: visit.receipt }, null, 2);
}

async function submit(form, statusId, body) {
  const status = $(statusId);
  if (status) status.textContent = 'Sending…';
  try {
    const response = await fetch('/api/front-desk', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.ok) {
      if (status) status.textContent = data.error || 'The desk did not take that.';
      return;
    }
    if (status) status.textContent = data.repeat ? 'Already in the book today.' : `Checked in at ${data.visit?.level}.`;
    showSlip(data.visit, data.repeat);
    form.reset();
    await load();
  } catch {
    if (status) status.textContent = 'The desk did not answer.';
  }
}

function companyOf(form) {
  return new FormData(form).get('company');
}

const agentForm = $('agent-form');
agentForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = new FormData(agentForm);
  const passportText = String(data.get('passport') || '').trim();
  const body = { company: companyOf(agentForm) };
  if (passportText) {
    try {
      body.passport = JSON.parse(passportText);
    } catch {
      const status = $('agent-status');
      if (status) status.textContent = 'That passport is not JSON.';
      return;
    }
  } else {
    body.name = data.get('name');
    body.operator = data.get('operator');
    body.purpose = data.get('purpose');
  }
  submit(agentForm, 'agent-status', body);
});

const agentSubmit = $('agent-submit');
if (agentForm && agentSubmit) agentSubmit.disabled = false;

const humanForm = $('human-form');
humanForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = new FormData(humanForm);
  submit(humanForm, 'human-status', {
    handle: data.get('handle'),
    kind: 'human',
    company: companyOf(humanForm),
  });
});

const humanSubmit = $('human-submit');
if (humanForm && humanSubmit) humanSubmit.disabled = false;

load();
