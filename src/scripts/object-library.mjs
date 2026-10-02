export const STORAGE_KEY = 'pointcast.object-library.demo.v1';
const DURATIONS = { 'twenty-minutes': 'Twenty minutes', 'one-walk': 'One walk', 'one-evening': 'One evening', 'one-day': 'One day' };
const SEASONS = { winter: 'Winter', spring: 'Spring', summer: 'Summer', fall: 'Fall' };
const OUTCOMES = { 'not-tried': 'Not tried yet / just rehearsing', helped: 'Helped with this use', mixed: 'Some parts helped', 'not-helpful': 'Did not help this time' };
const text = value => typeof value === 'string' ? value.slice(0, 400) : '';
const timestamp = value => typeof value === 'string' && !Number.isNaN(Date.parse(value)) ? new Date(value).toISOString() : null;

export function normalizeState(value, library) {
  const raw = value && typeof value === 'object' ? value : {};
  const object = library.objects.find(item => item.id === raw.objectId);
  const useId = library.uses.some(item => item.id === raw.useId) ? raw.useId : (object?.utility ?? library.uses[0].id);
  const phase = object && ['plan', 'card', 'reflection'].includes(raw.phase) ? raw.phase : (object ? 'plan' : 'choose');
  return {
    version: 1, objectId: object?.id ?? '', useId,
    duration: Object.hasOwn(DURATIONS, raw.duration) ? raw.duration : 'twenty-minutes',
    season: Object.hasOwn(SEASONS, raw.season) ? raw.season : (object?.season ?? 'winter'),
    intention: text(raw.intention), phase,
    createdAt: ['card', 'reflection'].includes(phase) ? timestamp(raw.createdAt) : null,
    outcome: phase === 'reflection' && Object.hasOwn(OUTCOMES, raw.outcome) ? raw.outcome : 'not-tried',
    observation: phase === 'reflection' ? text(raw.observation) : '',
    reflectedAt: phase === 'reflection' ? timestamp(raw.reflectedAt) : null,
  };
}

export function createDemoCard(value, library, now = new Date().toISOString()) {
  const state = normalizeState(value, library);
  if (!state.objectId) return { ok: false, state, message: 'Choose a concept object before creating your demo card.' };
  return { ok: true, state: { ...state, phase: 'card', createdAt: timestamp(now), outcome: 'not-tried', observation: '', reflectedAt: null } };
}

export function completeReflection(value, reflection, library, now = new Date().toISOString()) {
  const state = normalizeState(value, library);
  if (!['card', 'reflection'].includes(state.phase)) return { ok: false, state, message: 'Create a demo borrow card before completing the return.' };
  return { ok: true, state: normalizeState({ ...state, outcome: reflection?.outcome, observation: reflection?.observation, phase: 'reflection', reflectedAt: now }, library) };
}

export function exportDemo(value, library) {
  const state = normalizeState(value, library);
  const object = library.objects.find(item => item.id === state.objectId);
  if (!object) return null;
  const use = library.uses.find(item => item.id === state.useId);
  return [
    'EL SEGUNDO OBJECT LIBRARY / PERSONAL DEMO NOTES',
    'Concept rehearsal only. No inventory, reservation, pickup, loan, payment or submission.',
    'These notes were kept in this browser and downloaded at your request.', '',
    `Object: ${object.name} / ${object.type}`, `State: ${state.phase === 'reflection' ? 'Demo returned with reflection' : state.phase === 'card' ? 'Demo borrow card created' : 'Plan only'}`,
    `Intended use: ${use.name}`, `Trial: ${DURATIONS[state.duration]}`, `Season: ${SEASONS[state.season]}`,
    `What to learn: ${state.intention || 'No intention added.'}`, '',
    `Suggested ritual: ${object.ritual}`, `Object limit: ${object.boundary}`, '',
    ...(state.phase === 'reflection' ? [`Reflection: ${OUTCOMES[state.outcome]}`, `Observation: ${state.observation || 'No observation added.'}`, ''] : []),
    `Weather connection: https://pointcast.xyz/weather-atlas/?season=${state.season}#living`,
    `Object: https://pointcast.xyz/object-library/#${object.id}`,
    'Factory connection: proposed Local Object Factory only; nothing has been sent to a maker.',
  ].join('\n');
}

export function initObjectLibrary(root, library, options = {}) {
  if (!root || root.dataset.initialized) return;
  root.dataset.initialized = 'true';
  const document = root.ownerDocument;
  const window = document.defaultView;
  const query = selector => root.querySelector(selector);
  const all = selector => [...root.querySelectorAll(selector)];
  let storage;
  try { storage = options.storage ?? window.localStorage; } catch { storage = null; }
  let state = normalizeState(null, library);
  let storageAvailable = Boolean(storage);
  try { const raw = storage?.getItem(STORAGE_KEY); if (raw) state = normalizeState(JSON.parse(raw), library); } catch { storageAvailable = false; }
  const planForm = query('[data-plan-form]');
  const reflectionForm = query('[data-reflection-form]');
  const status = query('[data-demo-status]');
  const field = name => planForm.elements.namedItem(name);
  const put = (selector, value) => { query(selector).textContent = value; };
  const announce = message => { status.textContent = `${message} ${storageAvailable ? 'Saved only in this browser.' : 'Browser storage is unavailable; keep a download before leaving.'}`; };
  const save = () => { try { if (!storage) throw new Error('Unavailable'); storage.setItem(STORAGE_KEY, JSON.stringify(state)); storageAvailable = true; } catch { storageAvailable = false; } };

  const render = () => {
    for (const name of ['objectId', 'useId', 'duration', 'season', 'intention']) field(name).value = state[name];
    all('[data-pick]').forEach(button => { const picked = button.dataset.pick === state.objectId; button.setAttribute('aria-pressed', String(picked)); button.closest('[data-object]').classList.toggle('ol-selected', picked); });
    const object = library.objects.find(item => item.id === state.objectId);
    const hasCard = Boolean(object && ['card', 'reflection'].includes(state.phase));
    query('[data-card-empty]').hidden = hasCard;
    query('[data-card-content]').hidden = !hasCard;
    reflectionForm.hidden = !hasCard;
    query('[data-export-demo]').disabled = !object;
    const phases = ['choose', 'plan', 'card', 'reflection'];
    all('[data-step]').forEach(item => { item.classList.toggle('ol-complete', phases.indexOf(item.dataset.step) < phases.indexOf(state.phase)); if (item.dataset.step === state.phase) item.setAttribute('aria-current', 'step'); else item.removeAttribute('aria-current'); });
    if (hasCard) {
      put('[data-card-status]', state.phase === 'reflection' ? 'DEMO RETURNED' : 'REHEARSED');
      put('[data-card-type]', object.type);
      put('[data-card-name]', object.name);
      put('[data-card-use]', library.uses.find(item => item.id === state.useId).name);
      put('[data-card-trial]', `${DURATIONS[state.duration]} / ${SEASONS[state.season]}`);
      put('[data-card-intention]', state.intention || object.question);
      query('[data-card-image]').src = `/images/object-library/${object.image}`;
      query('[data-card-image]').alt = `${object.name} concept illustration`;
      reflectionForm.elements.namedItem('outcome').value = state.outcome;
      reflectionForm.elements.namedItem('observation').value = state.observation;
      reflectionForm.querySelector('button').textContent = state.phase === 'reflection' ? 'Update my demo reflection ↺' : 'Complete the demo return ↺';
    }
  };
  const choose = id => {
    const object = library.objects.find(item => item.id === id);
    state = normalizeState({ ...state, objectId: id, useId: object?.utility, season: object?.season, phase: object ? 'plan' : 'choose', createdAt: null }, library);
    save(); render(); announce(object ? `${object.name} selected. Plan one use and create a demo card.` : 'Choose a concept object to begin.');
  };
  all('[data-pick]').forEach(button => button.addEventListener('click', () => {
    choose(button.dataset.pick);
    const heading = query('#ol-demo-title');
    heading.focus({ preventScroll: true });
    heading.scrollIntoView?.({ behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
  }));
  field('objectId').addEventListener('change', event => choose(event.target.value));
  const updatePlan = () => {
    state = normalizeState({ ...state, useId: field('useId').value, duration: field('duration').value, season: field('season').value, intention: field('intention').value, phase: state.objectId ? 'plan' : 'choose' }, library);
    save(); render(); announce('Plan updated. Create a fresh demo card when you are ready.');
  };
  ['useId', 'duration', 'season'].forEach(name => field(name).addEventListener('change', updatePlan));
  field('intention').addEventListener('input', () => {
    const input = field('intention'); const position = input.selectionStart;
    updatePlan(); input.setSelectionRange(position, position);
  });
  planForm.addEventListener('submit', event => {
    event.preventDefault();
    const result = createDemoCard(state, library);
    if (!result.ok) { announce(result.message); field('objectId').focus(); return; }
    state = result.state; save(); render(); announce('Demo borrow card created. Try the ritual with your own belongings, then record a reflection below. No real loan was created.');
  });
  reflectionForm.addEventListener('submit', event => {
    event.preventDefault();
    const result = completeReflection(state, { outcome: reflectionForm.elements.namedItem('outcome').value, observation: reflectionForm.elements.namedItem('observation').value }, library);
    if (!result.ok) { announce(result.message); return; }
    state = result.state; save(); render(); announce('Demo return complete. Your reflection stays here; download it if you want a copy. Nothing was submitted.');
  });
  query('[data-export-demo]').addEventListener('click', () => {
    const contents = exportDemo(state, library); if (!contents) return;
    try {
      const blob = new window.Blob([contents], { type: 'text/plain;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a'); link.href = url; link.download = `object-library-${state.objectId}-demo.txt`; document.body.append(link); link.click(); link.remove();
      window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);
      announce('Demo notes downloaded. No information was submitted.');
    } catch { announce('This browser could not download the notes. Your current demo remains on this page.'); }
  });
  query('[data-clear-demo]').addEventListener('click', () => {
    state = normalizeState(null, library);
    let cleared = true;
    try { storage?.removeItem(STORAGE_KEY); } catch { cleared = false; storageAvailable = false; }
    render();
    if (cleared) announce('Demo cleared from this page and browser storage.');
    else announce('Demo cleared from this page. This browser blocked storage removal; clear site data in browser settings to remove a previously saved copy.');
  });
  all('[data-filter]').forEach(button => button.addEventListener('click', () => {
    const filter = button.dataset.filter; let count = 0;
    all('[data-filter]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    all('[data-object]').forEach(card => { card.hidden = filter !== 'all' && card.dataset.utility !== filter; if (!card.hidden) count++; });
    put('[data-filter-status]', `Showing ${count} concept object${count === 1 ? '' : 's'}.`);
  }));
  all('[data-plan-form] select, [data-plan-form] textarea, [data-plan-form] button, [data-reflection-form] select, [data-reflection-form] textarea, [data-reflection-form] button').forEach(control => { control.disabled = false; });
  render();
  if (state.objectId) announce(state.phase === 'reflection' ? 'Your saved demo reflection is restored.' : 'Your local demo is restored.');
  else if (!storageAvailable) announce('This demo can still be used during this visit.');
  return { getState: () => ({ ...state }) };
}
