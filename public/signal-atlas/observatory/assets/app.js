(() => {
  'use strict';

  // Every value below describes original fictional art. No traffic is read.
  const residents = Object.freeze([
    { id: 'tessel', archetypeId: 'ledger', name: 'Tessel', kind: 'Cubic archivist', description: 'A patient keeper of small discoveries. Tessel builds a home from tidy blocks, leaving a little space for the unexpected.' },
    { id: 'kiri', archetypeId: 'threader', name: 'Kiri', kind: 'Folded explorer', description: 'Always looking at things from a different angle. Kiri follows the interesting edge, then folds a new route home.' },
    { id: 'ollo', archetypeId: 'tuner', name: 'Ollo', kind: 'Orbital listener', description: 'Quietly tuned to the room. Ollo collects imagined echoes, finding a familiar rhythm in unfamiliar places.' },
  ]);
  const $ = id => document.getElementById(id);
  const scene = document.querySelector('.observatory');
  const viewport = $('viewport');
  const supports3d = Boolean(window.CSS?.supports?.('transform-style', 'preserve-3d') && window.CSS.supports('perspective', '1px'));
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  let selected = 'tessel', yaw = -25, pitch = 56, drag = null, suppressClick = false, clickReset;
  const element = (tag, className, text) => {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
  };
  function cube(main = false) {
    const block = element('span', main ? 'cube main' : 'cube');
    for (const face of ['top', 'bottom', 'front', 'back', 'left', 'right']) {
      block.append(element('span', 'face ' + face + (face === 'front' && main ? ' eyes' : '')));
    }
    return block;
  }
  for (const resident of residents) {
    const button = element('button', 'resident ' + resident.id);
    button.type = 'button';
    button.dataset.resident = resident.id;
    button.setAttribute('aria-label', 'Select ' + resident.name + ', fictional ' + resident.kind.toLowerCase());
    button.setAttribute('aria-pressed', 'false');
    const sculpture = element('span', 'sculpture');
    sculpture.setAttribute('aria-hidden', 'true');
    sculpture.append(cube(), cube(true), cube());
    button.append(sculpture);
    $('creatures').append(button);
    const card = element('button', 'card ' + resident.id);
    card.type = 'button';
    card.dataset.resident = resident.id;
    card.setAttribute('aria-pressed', 'false');
    const symbol = element('span', 'symbol');
    symbol.setAttribute('aria-hidden', 'true');
    card.append(symbol, element('strong', '', resident.name), element('small', '', resident.kind));
    $('cards').append(card);
  }
  function selectCreature(id, announce = true) {
    const resident = residents.find(row => row.id === id || row.archetypeId === id);
    if (!resident) return false;
    selected = resident.id;
    document.querySelectorAll('[data-resident]').forEach(el => el.setAttribute('aria-pressed', String(el.dataset.resident === selected)));
    $('detail-name').textContent = resident.name;
    $('detail-description').textContent = resident.description;
    $('detail-kind').textContent = resident.kind;
    $('detail-index').textContent = String(residents.indexOf(resident) + 1).padStart(2, '0');
    if (announce) {
      $('announcement').textContent = resident.name + ' selected. ' + resident.kind + '. Fictional character study.';
      window.dispatchEvent(new CustomEvent('pointcast:creature-select', {
        detail: { id: resident.archetypeId, creatureId: resident.id, fictional: true, source: 'observatory-design-study' },
      }));
    }
    return true;
  }
  function renderCamera() {
    yaw = Math.max(-70, Math.min(45, yaw));
    pitch = Math.max(35, Math.min(70, pitch));
    // CSSOM updates keep camera interaction compatible with the route's strict CSP.
    $('world').style.transform = 'rotateX(' + pitch + 'deg) rotateZ(' + yaw + 'deg)';
  }
  function rotate(amount) { yaw += amount; renderCamera(); }
  function resetCamera() { yaw = -25; pitch = 56; renderCamera(); }
  document.querySelectorAll('[data-resident]').forEach(el => el.addEventListener('click', event => {
    if (suppressClick && event.detail !== 0) return;
    selectCreature(el.dataset.resident);
  }));
  $('rotate-left').addEventListener('click', () => rotate(-12));
  $('rotate-right').addEventListener('click', () => rotate(12));
  $('reset').addEventListener('click', resetCamera);
  viewport.addEventListener('keydown', event => {
    if (event.target !== viewport || scene.classList.contains('flat')) return;
    const actions = {
      ArrowLeft: () => rotate(-8), ArrowRight: () => rotate(8),
      ArrowUp: () => { pitch -= 5; renderCamera(); },
      ArrowDown: () => { pitch += 5; renderCamera(); }, Home: resetCamera,
    };
    if (Object.hasOwn(actions, event.key)) { event.preventDefault(); actions[event.key](); }
  });
  viewport.addEventListener('pointerdown', event => {
    if (event.button !== 0 || event.isPrimary === false || drag || scene.classList.contains('flat')) return;
    clearTimeout(clickReset);
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY, yaw, pitch, moved: false };
    suppressClick = false;
  });
  viewport.addEventListener('pointermove', event => {
    if (!drag || drag.id !== event.pointerId) return;
    if ((event.pointerType === 'mouse' || event.pointerType === 'pen') && event.buttons === 0) { endDrag(event); return; }
    const dx = event.clientX - drag.x, dy = event.clientY - drag.y;
    if (!drag.moved && Math.abs(dx) < 7) return;
    drag.moved = true;
    suppressClick = true;
    try { viewport.setPointerCapture(event.pointerId); } catch { /* Detached/cancelled pointer. */ }
    yaw = drag.yaw + dx * 0.3;
    pitch = drag.pitch - dy * 0.15;
    renderCamera();
  });
  function endDrag(event) {
    if (drag && event?.pointerId !== undefined && drag.id !== event.pointerId) return;
    drag = null;
    clearTimeout(clickReset);
    clickReset = setTimeout(() => { suppressClick = false; }, 0);
  }
  viewport.addEventListener('pointerup', endDrag);
  viewport.addEventListener('pointercancel', endDrag);
  viewport.addEventListener('lostpointercapture', endDrag);
  viewport.addEventListener('pointerleave', event => { if (drag && !drag.moved) endDrag(event); });
  function updateMotion() {
    const reduced = Boolean(reducedMotion?.matches);
    const flat = scene.classList.contains('flat');
    const motion = $('motion');
    motion.disabled = reduced || flat;
    if (motion.disabled) motion.checked = false;
    document.body.classList.toggle('motion-on', !motion.disabled && motion.checked);
    $('motion-note').textContent = reduced ? 'Motion off · system preference' : flat ? 'Motion unavailable in 2D' : 'Gentle motion';
  }
  function setFlat(flat) {
    flat = flat || !supports3d;
    endDrag();
    scene.classList.toggle('flat', flat);
    $('view-toggle').setAttribute('aria-pressed', String(flat));
    $('view-toggle').textContent = supports3d ? (flat ? '3D view' : '2D view') : '2D view only';
    viewport.tabIndex = flat ? -1 : 0;
    viewport.setAttribute('aria-label', flat ? '2D observatory. Select fictional characters using the cards below.' : '3D observatory. Drag to orbit, arrow keys to rotate, Home to reset. Select creatures using the cards below.');
    ['rotate-left', 'rotate-right', 'reset'].forEach(id => { $(id).disabled = flat; });
    $('scene-help').textContent = flat ? (supports3d ? 'Select a card to explore a companion.' : '3D is unavailable in this browser. Explore the cards below.') : 'Drag to look around · Tap a companion';
    updateMotion();
  }
  $('view-toggle').addEventListener('click', () => setFlat(!scene.classList.contains('flat')));
  $('view-toggle').disabled = !supports3d;
  $('motion').addEventListener('change', updateMotion);
  if (reducedMotion?.addEventListener) reducedMotion.addEventListener('change', updateMotion);
  else reducedMotion?.addListener?.(updateMotion);
  document.addEventListener('visibilitychange', () => document.body.classList.toggle('motion-paused', document.hidden));
  document.body.classList.toggle('motion-paused', document.hidden);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => document.body.classList.toggle('offscreen', !entries[0].isIntersecting)).observe(viewport);
  }
  window.PointCastObservatory = Object.freeze({
    selectCreature,
    getState: () => ({ selected, view: scene.classList.contains('flat') ? '2d' : '3d', connected: false, fictional: true, yaw, pitch }),
    version: '1.1.0',
  });
  selectCreature('tessel', false);
  setFlat(!supports3d);
  renderCamera();
})();
