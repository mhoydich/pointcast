// Loom Kit motion. No DOM access until a consumer mounts or animates a view.
export const MOTION = Object.freeze({
  press: 80, release: 220, cardOut: 300, cardIn: 260,
  sheet: 380, fade: 150, stagger: 30, listBudget: 240, listItem: 120,
  easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
});

const running = new WeakMap();
const reduced = (element) => Boolean(
  element.ownerDocument.defaultView?.matchMedia?.('(prefers-reduced-motion: reduce)').matches
);
const bounded = (value, maximum) => Math.max(-maximum, Math.min(maximum, value));

export function cancelMotion(element) {
  const animation = running.get(element);
  running.delete(element);
  animation?.cancel();
}

/** Resolves false if the effect was interrupted. Only the latest run can settle a view. */
export function playMotion(element, frames, {
  duration, easing = MOTION.easing, delay = 0, fade = [0.8, 1],
}) {
  cancelMotion(element);
  if (typeof element.animate !== 'function') return Promise.resolve(true);
  const quiet = reduced(element);
  const animation = element.animate(
    quiet ? fade.map((opacity) => ({ opacity })) : frames,
    { duration: quiet ? MOTION.fade : duration, delay: quiet ? 0 : delay, easing, fill: 'both' },
  );
  running.set(element, animation);
  return animation.finished.then(
    () => running.get(element) === animation,
    () => false,
  );
}

export const springFrames = (from) => [
  { transform: from, offset: 0 },
  { transform: 'scale(1.02)', offset: 0.55 },
  { transform: 'scale(1)', offset: 1 },
];

export function flickProjection({ x, y, vx, vy }, width) {
  const direction = Math.sign(x || vx) || 1;
  // The shared easing starts with slope 4. Aim for the measured release speed
  // at that slope and travel at least far enough to clear the card.
  const travel = Math.max(width + 24, Math.abs(x) + Math.abs(vx) * MOTION.cardOut / 4);
  return {
    x: direction * travel,
    y: bounded(y + vy * MOTION.cardOut / 4, 100),
    angle: bounded(direction * travel / 24, 6),
  };
}

export const staggerDelay = (index) => Math.min(
  Math.max(0, index) * MOTION.stagger,
  MOTION.listBudget - MOTION.listItem,
);

export function animateList(elements) {
  return Promise.all(Array.from(elements, (element, index) => playMotion(element, [
    { transform: 'translateY(12px)', opacity: 0 },
    { transform: 'translateY(0)', opacity: 1 },
  ], { duration: MOTION.listItem, delay: staggerDelay(index), fade: [0, 1] })));
}

const currentStyle = (element) => element.ownerDocument.defaultView.getComputedStyle(element);
const currentTransform = (element) => currentStyle(element).transform;
const position = ({ x, y, angle = 0 }) => `translate3d(${x}px, ${y}px, 0) rotate(${angle}deg)`;
const sheetPosition = (y) => `translate3d(0, ${y}px, 0)`;

export function bindPress(element, { signal } = {}) {
  let held = false;
  const press = () => {
    if (held) return;
    held = true;
    const { transform, opacity } = currentStyle(element);
    playMotion(element, [{ transform }, { transform: 'scale(0.97)' }], {
      duration: MOTION.press, fade: [Number(opacity), 0.84],
    });
  };
  const release = () => {
    if (!held) return;
    held = false;
    const { transform, opacity } = currentStyle(element);
    playMotion(element, springFrames(transform), {
      duration: MOTION.release, fade: [Number(opacity), 1],
    });
  };
  const listen = (type, fn) => element.addEventListener(type, fn, { signal });
  listen('pointerdown', (event) => { if (event.isPrimary && event.button === 0) press(); });
  for (const type of ['pointerup', 'pointercancel', 'pointerleave', 'blur']) listen(type, release);
  listen('keydown', (event) => { if (!event.repeat && [' ', 'Enter'].includes(event.key)) press(); });
  listen('keyup', (event) => { if ([' ', 'Enter'].includes(event.key)) release(); });
}

function bindDrag(element, { start, move, end, cancel }, signal) {
  let gesture = null;
  element.addEventListener('pointerdown', (event) => {
    if (!event.isPrimary || event.button !== 0 || gesture) return;
    gesture = { id: event.pointerId, startX: event.clientX, startY: event.clientY,
      x: 0, y: 0, vx: 0, vy: 0, at: event.timeStamp };
    start();
    element.setPointerCapture(event.pointerId);
  }, { signal });
  element.addEventListener('pointermove', (event) => {
    if (gesture?.id !== event.pointerId) return;
    const x = event.clientX - gesture.startX;
    const y = event.clientY - gesture.startY;
    const elapsed = Math.max(1, event.timeStamp - gesture.at);
    Object.assign(gesture, { x, y, vx: (x - gesture.x) / elapsed, vy: (y - gesture.y) / elapsed, at: event.timeStamp });
    move(gesture);
  }, { signal });
  element.addEventListener('pointerup', (event) => {
    if (gesture?.id !== event.pointerId) return;
    const result = gesture;
    gesture = null;
    if (event.timeStamp - result.at > 80) Object.assign(result, { vx: 0, vy: 0 });
    end(result);
  }, { signal });
  const reset = (event) => {
    if (gesture?.id !== event.pointerId) return;
    gesture = null;
    cancel();
  };
  for (const type of ['pointercancel', 'lostpointercapture']) element.addEventListener(type, reset, { signal });
}

function installStyles(document) {
  const href = new URL('./motion.css', import.meta.url).href;
  if (Array.from(document.querySelectorAll('link[rel="stylesheet"]')).some((link) => link.href === href)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  document.head.append(link);
}

const cards = [
  { icon: '✳', text: 'A room with a note waiting.' },
  { icon: '◆', text: 'A thread to pick up later.' },
  { icon: '◒', text: 'A quiet place to pause.' },
];

/** Render the standalone sketch in the Launch kit slot. Returns a teardown function. */
export function mountDemo(container) {
  const document = container.ownerDocument;
  const window = document.defaultView;
  const preference = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  installStyles(document);
  const lifecycle = new window.AbortController();
  const { signal } = lifecycle;
  const root = document.createElement('section');
  root.className = 'lm-motion-demo';
  // These strings belong to the sketch. No board content is inserted as HTML.
  root.innerHTML = `
    <h3 class="lm-motion-title">Motion</h3>
    <div class="lm-motion-stage">
      <article class="lm-motion-card" aria-label="Swipeable sample card">
        <span class="lm-motion-glyph" aria-hidden="true"></span><p></p>
      </article>
    </div>
    <div class="lm-motion-actions">
      <button type="button" data-motion-next>Next card</button>
      <button type="button" data-motion-open>Open sheet</button>
    </div>
    <p class="lm-motion-status" role="status"></p>
    <dialog class="lm-motion-dialog" aria-label="Motion sheet">
      <div class="lm-motion-sheet">
        <button type="button" class="lm-motion-handle" aria-label="Dismiss sheet"></button>
        <p>Pull down to put this sheet away.</p>
        <button type="button" class="lm-motion-close">Close</button>
      </div>
    </dialog>`;
  container.append(root);
  const card = root.querySelector('.lm-motion-card');
  const status = root.querySelector('.lm-motion-status');
  const dialog = root.querySelector('dialog');
  const sheet = root.querySelector('.lm-motion-sheet');
  const handle = root.querySelector('.lm-motion-handle');
  const close = root.querySelector('.lm-motion-close');
  const open = root.querySelector('[data-motion-open]');
  const next = root.querySelector('[data-motion-next]');
  for (const button of [next, open, close]) bindPress(button, { signal });

  let index = 0;
  let cardBase = 'none';
  const showCard = () => {
    card.querySelector('.lm-motion-glyph').textContent = cards[index].icon;
    card.querySelector('p').textContent = cards[index].text;
    status.textContent = `Card ${index + 1} of ${cards.length}`;
  };
  showCard();

  async function advance(gesture = { x: -1, y: 0, vx: 0, vy: 0 }) {
    const { transform, opacity } = currentStyle(card);
    card.style.transform = '';
    const target = position(flickProjection(gesture, card.offsetWidth));
    const finished = await playMotion(card, [
      { transform, opacity }, { transform: target, opacity: 0 },
    ], { duration: MOTION.cardOut, fade: [Number(opacity), 0] });
    if (!finished || signal.aborted) return;
    index = (index + 1) % cards.length;
    showCard();
    playMotion(card, [
      { transform: 'translateY(12px) scale(0.94)', opacity: 0 },
      { transform: 'translateY(0) scale(1)', opacity: 1 },
    ], { duration: MOTION.cardIn, fade: [0, 1] });
  }

  function settleCard() {
    const from = currentTransform(card);
    card.style.transform = '';
    playMotion(card, [
      { transform: from }, { transform: 'none' },
    ], { duration: MOTION.release });
  }
  bindDrag(card, {
    start() {
      cardBase = currentTransform(card);
      cancelMotion(card);
      card.style.transform = preference?.matches ? '' : cardBase;
    },
    move({ x, y }) {
      const translation = position({ x, y: bounded(y, 42), angle: bounded(x / 26, 6) });
      card.style.transform = preference?.matches ? '' : `${translation} ${cardBase === 'none' ? '' : cardBase}`;
    },
    end(gesture) {
      if (Math.abs(gesture.x) >= 72 || (Math.abs(gesture.x) >= 20 && Math.abs(gesture.vx) >= 0.55)) advance(gesture);
      else settleCard();
    },
    cancel: settleCard,
  }, signal);
  next.addEventListener('click', () => advance(), { signal });

  async function closeSheet() {
    if (!dialog.open) return;
    const { transform, opacity } = currentStyle(sheet);
    sheet.style.transform = '';
    const finished = await playMotion(sheet, [
      { transform, opacity }, { transform: sheetPosition(sheet.offsetHeight), opacity: 0 },
    ], { duration: MOTION.sheet, fade: [Number(opacity), 0] });
    if (finished && dialog.open) dialog.close();
  }
  open.addEventListener('click', () => {
    if (dialog.open) return;
    dialog.showModal();
    close.focus({ preventScroll: true });
    playMotion(sheet, [
      { transform: sheetPosition(sheet.offsetHeight) },
      { transform: sheetPosition(-5), offset: 0.78 },
      { transform: sheetPosition(0) },
    ], { duration: MOTION.sheet, fade: [0, 1] });
  }, { signal });
  close.addEventListener('click', closeSheet, { signal });
  dialog.addEventListener('cancel', (event) => { event.preventDefault(); closeSheet(); }, { signal });
  dialog.addEventListener('click', (event) => { if (event.target === dialog) closeSheet(); }, { signal });
  dialog.addEventListener('close', () => {
    cancelMotion(sheet);
    sheet.style.transform = '';
    dialog.style.removeProperty('--loom-motion-backdrop-alpha');
    open.focus({ preventScroll: true });
  }, { signal });

  let movedHandle = false;
  let initialSheetY = 0;
  function settleSheet() {
    const from = currentTransform(sheet);
    sheet.style.transform = '';
    dialog.style.removeProperty('--loom-motion-backdrop-alpha');
    playMotion(sheet, [{ transform: from }, { transform: sheetPosition(0) }], { duration: MOTION.sheet });
  }
  bindDrag(handle, {
    start() {
      movedHandle = false;
      const transform = currentTransform(sheet);
      initialSheetY = transform === 'none' ? 0 : new window.DOMMatrixReadOnly(transform).m42;
      cancelMotion(sheet);
      sheet.style.transform = preference?.matches ? '' : transform;
    },
    move({ y }) {
      movedHandle ||= Math.abs(y) > 8;
      if (preference?.matches) {
        sheet.style.transform = '';
        dialog.style.removeProperty('--loom-motion-backdrop-alpha');
        return;
      }
      const offset = Math.max(0, initialSheetY + y);
      sheet.style.transform = sheetPosition(offset);
      dialog.style.setProperty('--loom-motion-backdrop-alpha', String(0.72 * Math.max(0, 1 - offset / sheet.offsetHeight)));
    },
    end({ y, vy }) {
      if (y >= 70 || (y >= 20 && vy >= 0.55)) closeSheet();
      else settleSheet();
    },
    cancel: settleSheet,
  }, signal);
  handle.addEventListener('click', (event) => {
    if (!movedHandle || event.detail === 0) closeSheet();
  }, { signal });

  preference?.addEventListener?.('change', () => {
    for (const element of [card, sheet, next, open, close]) cancelMotion(element);
    cardBase = 'none';
    initialSheetY = 0;
    card.style.transform = '';
    sheet.style.transform = '';
    dialog.style.removeProperty('--loom-motion-backdrop-alpha');
  }, { signal });

  return () => {
    lifecycle.abort();
    for (const element of [card, sheet, next, open, close]) cancelMotion(element);
    if (dialog.open) dialog.close();
    root.remove();
  };
}
