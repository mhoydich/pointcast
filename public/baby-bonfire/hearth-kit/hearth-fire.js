/* Hearth Kit 0.1.0: <hearth-fire>, the Prayer Fire hearth film and its sound, as one tag.
 * https://pointcast.xyz/baby-bonfire/hearth-kit/  No dependencies. CC BY 4.0, PointCast.
 *
 * The film is muted, loops, loads when it comes near the screen and pauses off screen or in a
 * hidden tab. With reduced motion it is the still picture only. Sound never starts by itself:
 * only the built-in Sound button, or the host page calling light() or ring() from its own tap.
 * If a sound file cannot be loaded, a sound made in the browser plays instead.
 */
const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
const DEFAULT_MEDIA = new URL('/baby-bonfire/prayer/media/', import.meta.url).href;
const FILES = { film: 'hearth-loop.mp4', poster: 'hearth-poster.jpg', fire: 'fire.mp3', bowl: 'bowl.mp3', gong: 'gong.mp3' };
const RM = globalThis.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : null;

/* ---------- one AudioContext for the whole page, shared by every <hearth-fire> ---------- */
let ctx = null, bus = null, noise = null, silent = null;
const bufs = new Map();
const lit = new Set();
let popTimer = 0;

function audio() { // only ever reached from light() or ring()
  if (ctx || !AC) return ctx;
  try {
    ctx = new AC();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16; comp.knee.value = 18; comp.ratio.value = 3; comp.attack.value = 0.01; comp.release.value = 0.3;
    comp.connect(ctx.destination); bus = comp;
    noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const ch = noise.getChannelData(0);
    for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1;
  } catch (e) { ctx = null; }
  return ctx;
}
function unlockPhone() { // a silent looping <audio> lets Web Audio play on an iPhone with its ring switch off
  if (silent) return;
  try {
    const sr = 8000, n = sr / 2, buf = new ArrayBuffer(44 + n * 2), v = new DataView(buf);
    const w = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
    w(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); w(8, 'WAVEfmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
    v.setUint32(24, sr, true); v.setUint32(28, sr * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); w(36, 'data'); v.setUint32(40, n * 2, true);
    silent = document.createElement('audio'); silent.loop = true; silent.setAttribute('playsinline', '');
    silent.src = URL.createObjectURL(new Blob([buf], { type: 'audio/wav' }));
    const p = silent.play(); if (p && p.catch) p.catch(() => {});
  } catch (e) {}
}
function wake() { // resume inside the tap; resolves true once the context is running
  const c = audio();
  if (!c) return Promise.resolve(false);
  unlockPhone();
  let p; try { p = c.resume(); } catch (e) {}
  const t = new Promise((r) => setTimeout(r, 1500));
  return Promise.race([Promise.resolve(p).catch(() => {}), t]).then(() => c.state === 'running');
}
function buffer(url) {
  if (!bufs.has(url)) {
    bufs.set(url, fetch(url).then((r) => { if (!r.ok) throw new Error(url); return r.arrayBuffer(); })
      .then((ab) => new Promise((res, rej) => { const p = ctx.decodeAudioData(ab, res, rej); if (p && p.then) p.then(res, rej); })));
    bufs.get(url).catch(() => { bufs.delete(url); }); // a failed fetch can be tried again later
  }
  return bufs.get(url);
}
function looper(buf, dest, fade) { // loops a recording with equal-power fades across the seam
  const c = ctx, N = 48, up = new Float32Array(N), dn = new Float32Array(N);
  let stop = false, timer = 0;
  const live = [];
  for (let i = 0; i < N; i++) { const x = i / (N - 1); up[i] = Math.sin(x * Math.PI / 2); dn[i] = Math.cos(x * Math.PI / 2); }
  const playAt = (t) => {
    if (stop) return;
    t = Math.max(t, c.currentTime);
    const s = c.createBufferSource(), g = c.createGain(); s.buffer = buf; g.gain.value = 0;
    try { g.gain.setValueCurveAtTime(up, t, fade); g.gain.setValueCurveAtTime(dn, t + buf.duration - fade, fade); } catch (e) { g.gain.value = 1; }
    s.connect(g); g.connect(dest); s.start(t); s.stop(t + buf.duration + 0.1); live.push(s);
    const next = t + buf.duration - fade;
    const again = () => { if (stop) return; if (c.state !== 'running') { timer = setTimeout(again, 1000); return; } live.shift(); playAt(next); };
    timer = setTimeout(again, Math.max(0, (next - c.currentTime - 1.2) * 1000));
  };
  playAt(c.currentTime + 0.05);
  return () => { stop = true; clearTimeout(timer); live.forEach((s) => { try { s.stop(); } catch (e) {} }); };
}
function hush(dest) { // the generated fire bed: filtered noise, used when fire.mp3 cannot be had
  const s = ctx.createBufferSource(), lp = ctx.createBiquadFilter(), hp = ctx.createBiquadFilter(), g = ctx.createGain();
  s.buffer = noise; s.loop = true; lp.type = 'lowpass'; lp.frequency.value = 700; hp.type = 'highpass'; hp.frequency.value = 110; g.gain.value = 0.16;
  s.connect(lp); lp.connect(hp); hp.connect(g); g.connect(dest); s.start();
  return () => { try { s.stop(); } catch (e) {} };
}
function pop(t, dest, loud) { // one crackle: a short band of noise
  const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(), dur = 0.004 + Math.random() * 0.03;
  s.buffer = noise; f.type = 'bandpass'; f.frequency.value = 900 + Math.random() * 4200; f.Q.value = 0.8 + Math.random() * 2.5;
  g.gain.setValueAtTime((0.04 + Math.random() * 0.16) * loud, t); g.gain.exponentialRampToValueAtTime(0.0008, t + dur + 0.02);
  s.connect(f); f.connect(g);
  if (ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = (Math.random() - 0.5) * 0.7; g.connect(p); p.connect(dest); } else g.connect(dest);
  s.start(t, Math.random() * 0.9, dur + 0.05);
}
function crackle() { // one timer for every lit hearth on the page
  if (!ctx || document.hidden) return;
  const now = ctx.currentTime;
  lit.forEach((h) => {
    const rate = h._gen ? 3.2 : 1.2;
    let t = Math.max(h._nextPop || 0, now);
    while (t < now + 0.25) { pop(t, h._bed, h._gen ? 1 : 0.6); t += -Math.log(1 - Math.random()) / rate; }
    h._nextPop = t;
  });
}
function chime(dest, f, vel, dur) { // the generated bowl, from a few partials
  const t = ctx.currentTime, P = [[1, 1, 1], [1.003, 0.6, 0.9], [2.76, 0.42, 0.55], [5.4, 0.2, 0.32], [8.93, 0.08, 0.18]];
  for (const [r, a, d] of P) {
    const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.value = f * r;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vel * a * 0.5, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + dur * d);
    o.connect(g); g.connect(dest); o.start(t); o.stop(t + dur * d + 0.1);
  }
}
function gongMade(dest, vel) { // the generated gong
  const t = ctx.currentTime, R = [1, 1.48, 2.4, 2.97, 4.1, 5.4];
  R.forEach((r, i) => {
    const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.value = 98 * r;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vel * 0.34 / (i + 1), t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 8 / (1 + i * 0.5));
    o.connect(g); g.connect(dest); o.start(t); o.stop(t + 9);
  });
}

/* ---------- the element ---------- */
const CSS = `:host{display:block;position:relative;aspect-ratio:720/950;overflow:hidden;contain:content;background:#15100c center/cover no-repeat;border-radius:var(--hearth-radius,0);box-shadow:var(--hearth-glow,0 0 48px rgba(255,154,74,.16))}
:host([hidden]){display:none}
video{display:block;width:100%;height:100%;object-fit:cover;background:transparent}
button{position:absolute;right:max(10px,env(safe-area-inset-right));bottom:max(10px,env(safe-area-inset-bottom));display:inline-flex;align-items:center;gap:7px;min-height:36px;padding:0 13px;border:1px solid rgba(241,230,214,.4);border-radius:18px;background:rgba(21,16,12,.72);color:#f1e6d6;font:600 11px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.1em;text-transform:uppercase;cursor:pointer}
button:hover{border-color:#ffd27a}button:focus-visible{outline:2px solid #ffd27a;outline-offset:2px}
button i{width:8px;height:8px;border-radius:50%;background:#6b4f3a}
button[hidden]{display:none}
button[aria-pressed=true] i{background:#ffb24d;box-shadow:0 0 8px #ffb24d}`;

export class HearthFire extends HTMLElement {
  static get observedAttributes() { return ['media', 'sound', 'fit', 'volume']; }
  constructor() {
    super();
    const root = this.attachShadow({ mode: 'open' });
    root.innerHTML = `<style>${CSS}</style><video part="film" muted loop playsinline webkit-playsinline preload="none" disablepictureinpicture aria-hidden="true" tabindex="-1"></video><button part="sound" type="button" aria-pressed="false" aria-label="Sound" title="Sound"><i></i><span>Sound</span></button>`;
    this._v = root.querySelector('video');
    this._b = root.querySelector('button');
    this._v.muted = true; this._v.defaultMuted = true;
    this._lit = false; this._near = false; this._failed = false; this._stops = []; this._gen = false;
    this._b.addEventListener('click', () => (this._lit ? this.quiet() : this.light()));
    this._v.addEventListener('error', () => { this._failed = true; this._v.removeAttribute('src'); try { this._v.load(); } catch (e) {} });
    this._onVis = () => this._film();
  }
  get lit() { return this._lit; }
  get media() { const m = this.getAttribute('media') || DEFAULT_MEDIA; return m.endsWith('/') ? m : m + '/'; }
  get volume() { const v = parseFloat(this.getAttribute('volume')); return Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0.8; }
  _url(k) {
    try { return new URL(FILES[k], new URL(this.media, document.baseURI)).href; }
    catch (e) { return new URL(FILES[k], new URL(DEFAULT_MEDIA, document.baseURI)).href; } // a bad media attribute falls back
  }

  connectedCallback() {
    this._apply();
    document.addEventListener('visibilitychange', this._onVis);
    if (RM && RM.addEventListener) RM.addEventListener('change', this._onVis);
    if ('IntersectionObserver' in globalThis) {
      this._io = new IntersectionObserver((es) => { this._near = es[es.length - 1].isIntersecting; this._film(); }, { rootMargin: '200px' });
      this._io.observe(this);
    } else { this._near = true; this._film(); }
  }
  disconnectedCallback() {
    if (this._io) this._io.disconnect();
    document.removeEventListener('visibilitychange', this._onVis);
    if (RM && RM.removeEventListener) RM.removeEventListener('change', this._onVis);
    this._v.pause();
    if (this._lit) this.quiet();
  }
  attributeChangedCallback(name) {
    if (!this.shadowRoot) return;
    if (name === 'media') { this._failed = false; if (this._v.getAttribute('src')) this._v.removeAttribute('src'); }
    this._apply(); this._film();
  }
  _apply() {
    const poster = this._url('poster');
    this._v.poster = poster;
    this.style.backgroundImage = `url("${poster}")`;
    this._v.style.objectFit = this.getAttribute('fit') === 'contain' ? 'contain' : 'cover';
    this._b.hidden = this.getAttribute('sound') === 'off';
    if (this._out) this._out.gain.setTargetAtTime(this.volume, ctx.currentTime, 0.1);
  }
  _film() { // load near the screen, play when seen, rest otherwise; poster only with reduced motion
    const v = this._v, still = RM && RM.matches;
    if (still || this._failed) { v.pause(); return; }
    if (this._near && !v.getAttribute('src')) v.src = this._url('film');
    if (this._near && !document.hidden) { const p = v.play(); if (p && p.catch) p.catch(() => {}); } else v.pause();
  }
  _chain() {
    if (this._out) return;
    this._out = ctx.createGain(); this._out.gain.value = this.volume; this._out.connect(bus);
    this._bed = ctx.createGain(); this._bed.gain.value = 0.0001; this._bed.connect(this._out);
    this._fx = ctx.createGain(); this._fx.connect(this._out);
    const d = ctx.createDelay(1), fb = ctx.createGain(), lp = ctx.createBiquadFilter(), send = ctx.createGain();
    d.delayTime.value = 0.36; fb.gain.value = 0.34; lp.type = 'lowpass'; lp.frequency.value = 1800; send.gain.value = 0.35;
    this._fx.connect(send); send.connect(d); d.connect(lp); lp.connect(fb); fb.connect(d); lp.connect(this._out);
  }
  /** Start the fire bed. Call it from a tap. Resolves true when sound is playing. */
  light() {
    const woke = wake(); // synchronous part runs inside the caller's tap
    if (!ctx) return Promise.resolve(false);
    if (!this._lit) {
      this._lit = true; this._chain(); clearTimeout(this._end);
      // Stop whatever a quiet() still had fading, and anything left from before, so beds never stack.
      (this._fading || []).forEach((s) => s()); this._fading = null;
      this._stops.forEach((s) => s()); this._stops = [];
      this._gen = false;
      const tok = (this._tok = (this._tok || 0) + 1); // a late fetch from an earlier light() adds nothing
      buffer(this._url('fire')).then((b) => { if (this._lit && this._tok === tok) this._stops.push(looper(b, this._bed, 2)); },
        () => { if (this._lit && this._tok === tok) { this._gen = true; this._stops.push(hush(this._bed)); } });
      buffer(this._url('bowl')); buffer(this._url('gong'));
      this._bed.gain.cancelScheduledValues(ctx.currentTime);
      this._bed.gain.setTargetAtTime(0.9, ctx.currentTime + 0.1, 1.2);
      lit.add(this); if (!popTimer) popTimer = setInterval(crackle, 120);
      this._b.setAttribute('aria-pressed', 'true');
      this.dispatchEvent(new CustomEvent('hearth-lit', { bubbles: true, composed: true }));
    }
    return woke.then((ok) => { if (!ok && this._lit) this.quiet(); return ok; });
  }
  /** Fade the sound out and stop it. */
  quiet() {
    if (!this._lit) return;
    this._lit = false; lit.delete(this);
    if (!lit.size) { clearInterval(popTimer); popTimer = 0; }
    if (ctx && this._bed) {
      this._bed.gain.cancelScheduledValues(ctx.currentTime);
      this._bed.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.4);
    }
    const stops = this._stops; this._stops = [];
    this._fading = stops;
    this._end = setTimeout(() => { stops.forEach((s) => s()); if (this._fading === stops) this._fading = null; }, 1800);
    this._b.setAttribute('aria-pressed', 'false');
    this.dispatchEvent(new CustomEvent('hearth-quiet', { bubbles: true, composed: true }));
  }
  /** Strike 'bowl' or 'gong'. Call it from a tap. Resolves true when it sounded. */
  ring(name = 'bowl', vel = 0.8) {
    if (name !== 'bowl' && name !== 'gong') return Promise.resolve(false);
    const woke = wake();
    if (!ctx) return Promise.resolve(false);
    this._chain();
    const wait = new Promise((r) => setTimeout(r, 900, null));
    return Promise.all([woke, Promise.race([buffer(this._url(name)).catch(() => null), wait])]).then(([ok, b]) => {
      if (!ok) return false;
      if (b) {
        const s = ctx.createBufferSource(), g = ctx.createGain();
        s.buffer = b; s.playbackRate.value = 0.97 + Math.random() * 0.05; g.gain.value = name === 'bowl' ? vel * 0.9 : vel;
        s.connect(g); g.connect(this._fx); s.start();
      } else if (name === 'bowl') chime(this._fx, 392, vel, 7);
      else gongMade(this._fx, vel);
      return true;
    });
  }
}
if (!customElements.get('hearth-fire')) customElements.define('hearth-fire', HearthFire);
