// The canvas contains the illustration. Its sibling text carries the same state.
const labels = {
  embers: 'Nothing waiting',
  steady: 'Standing by',
  bright: 'Something needs you',
  spark: 'Action received',
};
const heights = { embers: .12, steady: .70, bright: 1, spark: 1.12 };
const period = 34; // No more than 30 paints per second, including the crossfade.
const fade = 150;
const gold = '#ffcc66';
const defaultTongues = [
  [107, 64, -.96, 23, '#df512c'], [131, 88, .47, 25, '#f67c3e'],
  [117, 76, .13, 19, '#ffac4e'], [121, 39, .69, 14, '#ffde8f'],
];

function element(parent, tag, text) {
  const child = parent.ownerDocument.createElement(tag);
  if (text) child.textContent = text;
  parent.append(child);
  return child;
}

// All tongues have a common root so they stay attached while the tips breathe.
function tongue(ctx, x, height, lean, width, color) {
  ctx.save();
  ctx.translate(x, 137);
  ctx.scale(width, -height);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-1, 0);
  ctx.bezierCurveTo(-1.16, .46, -.22, .54, lean, 1);
  ctx.bezierCurveTo(lean + .42, .58, .86, .43, 1, .18);
  ctx.bezierCurveTo(1.10, -.04, .45, -.10, 0, -.09);
  ctx.bezierCurveTo(-.57, -.09, -.96, -.07, -1, 0);
  ctx.fill();
  ctx.restore();
}

function paint(ctx, state, time, elapsed, still, shape) {
  const phase = still ? 0 : Math.sin(time / 490);
  const height = heights[state] * (1 + .026 * phase);
  const flare = state === 'spark' && !still ? Math.sin(Math.PI * elapsed / 600) : 0;
  for (const [x, length, lean, width, color] of shape.tongues ?? defaultTongues) {
    tongue(ctx, x, height * length, lean + .1 * phase, width, color);
  }
  if (!flare || shape.particles === false) return;
  ctx.globalAlpha *= flare;
  ctx.fillStyle = gold;
  for (const [x, y, dx, dy] of [[96, 87, -13, -32], [143, 69, 14, -29], [119, 54, -7, -35]]) {
    const t = elapsed / 600;
    ctx.fillRect(x + dx * t, y + dy * t, 2.5, 4.5);
  }
}

/** Mount an independent flame. setAvailable(false) preserves the latest resting state. */
export function mountFlame(container, initialState = 'steady', shape = {}) {
  if (!['embers', 'steady', 'bright'].includes(initialState)) throw new RangeError('Unknown resting state');
  const doc = container.ownerDocument;
  const win = doc.defaultView;
  const panel = element(container, 'figure');
  panel.style.cssText = 'margin:0;overflow:hidden;background:#241e20;color:#fff9ed;border-radius:12px;font:500 17px/1.4 system-ui,sans-serif';
  const canvas = element(panel, 'canvas');
  canvas.width = 480;
  canvas.height = 328;
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText = 'display:block;width:100%;height:clamp(128px,28vh,210px);object-fit:contain';
  const caption = element(panel, 'figcaption');
  caption.style.cssText = 'border-top:1px solid #524549;padding:12px 16px;display:flex;align-items:baseline;justify-content:space-between;gap:10px;flex-wrap:wrap';
  caption.setAttribute('role', 'status');
  const title = element(caption, 'strong');
  const detail = element(caption, 'span');
  detail.style.color = '#eddbcf';
  if (shape.bare) {
    panel.style.background = 'transparent';
    caption.style.cssText = 'position:absolute;width:1px;height:1px;clip-path:inset(50%);overflow:hidden;white-space:nowrap';
  }
  const ctx = canvas.getContext('2d');
  const motion = win.matchMedia('(prefers-reduced-motion: reduce)');
  let resting = initialState, available = true, current = initialState, previous = current;
  let lastDraw = -Infinity, changedAt = 0, sparkedAt = 0, pending = false, ticker, deadline, disposed = false;
  const now = () => win.performance.now();

  function draw() {
    ticker = undefined;
    if (disposed || doc.hidden || !ctx) return;
    const t = now();
    const remaining = motion.matches && previous !== current ? changedAt + fade - t : 0;
    // Drawing this close to the end would push the settled sample outside the fade.
    if (remaining > 0 && remaining < period) {
      ticker = win.setTimeout(draw, Math.ceil(remaining));
      return;
    }
    if (t - lastDraw < period) {
      ticker = win.setTimeout(draw, Math.ceil(period - (t - lastDraw)));
      return;
    }
    lastDraw = t;
    ctx.setTransform(2, 0, 0, 2, 0, 0);
    ctx.clearRect(0, 0, 240, 164);
    if (!shape.bare) {
      ctx.fillStyle = '#8d7a7e';
      ctx.fillRect(57, 148, 126, 1);
      for (let i = 0; i < 11; i++) ctx.fillRect(57 + i * 12.5, 148, 1, i % 5 === 0 ? 6 : 3);
    }
    const mix = motion.matches && previous !== current ? Math.min(1, (t - changedAt) / fade) : 1;
    const layer = (state, alpha) => {
      ctx.save();
      ctx.globalAlpha = alpha;
      paint(ctx, state, t, Math.min(600, t - sparkedAt), motion.matches, shape);
      ctx.restore();
    };
    if (mix < 1) layer(previous, 1 - mix);
    layer(current, mix);
    if (mix < 1 || !motion.matches) {
      const next = remaining > 0 && remaining < 2 * period ? Math.ceil(remaining) : period;
      ticker = win.setTimeout(draw, next);
    }
  }

  function wake() {
    if (!doc.hidden && !disposed && ticker === undefined) draw();
  }

  function update() {
    const next = !available ? 'embers' : pending ? 'spark' : resting;
    if (next !== current) {
      previous = current;
      current = next;
      changedAt = now();
    }
    panel.dataset.state = current;
    const name = current[0].toUpperCase() + current.slice(1);
    const message = !available ? 'Board unavailable'
      : current === 'embers' ? shape.emptyLabel ?? labels.embers : labels[current];
    if (title.textContent !== name) title.textContent = name;
    if (detail.textContent !== message) detail.textContent = message;
    wake();
  }

  function clearSpark() {
    pending = false;
    win.clearTimeout(deadline);
  }
  function visibility() {
    win.clearTimeout(ticker);
    ticker = undefined;
    wake();
  }
  function destroy() {
    disposed = true;
    clearSpark();
    win.clearTimeout(ticker);
    doc.removeEventListener('visibilitychange', visibility);
    motion.removeEventListener('change', wake);
    panel.remove();
  }
  doc.addEventListener('visibilitychange', visibility);
  motion.addEventListener('change', wake);
  update();
  return {
    setState(state) {
      if (!['embers', 'steady', 'bright'].includes(state)) throw new RangeError('Unknown resting state');
      clearSpark();
      resting = state;
      update();
    },
    setAvailable(value) {
      clearSpark();
      available = Boolean(value);
      update();
    },
    spark() {
      if (!available || disposed) return;
      clearSpark();
      pending = true;
      sparkedAt = now();
      deadline = win.setTimeout(() => { pending = false; update(); }, 600);
      update();
    },
    destroy,
  };
}

/** Mount the interactive example in the sketch shell. */
export function mountDemo(container) {
  const example = element(container, 'div');
  const flame = mountFlame(example);
  const bar = element(example, 'div');
  bar.setAttribute('role', 'group');
  bar.setAttribute('aria-label', 'Try a flame state');
  bar.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;margin-top:12px';
  for (const name of ['Embers', 'Steady', 'Bright', 'Spark']) {
    const button = element(bar, 'button', name);
    button.type = 'button';
    button.style.cssText = 'flex:1 1 auto;min-width:44px;min-height:44px;padding:4px 8px;border:1px solid #857570;border-radius:7px;font:600 17px/1.4 system-ui;color:#302024;background:#fffaf3';
    if (name === 'Spark') button.style.cssText += ';background:#632e20;color:#fffaf3;border-color:#632e20';
    button.onclick = () => name === 'Spark' ? flame.spark() : flame.setState(name.toLowerCase());
  }
  return () => { flame.destroy(); example.remove(); };
}
