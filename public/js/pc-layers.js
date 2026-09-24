/*!
 * PointCast Layers — a portable audio-visual layer deck for any PointCast page.
 *
 * Drop in:   <script src="/js/pc-layers.js" defer></script>
 * Mounts a "LAYERS" chip into the footer bar (.fb__right) when it exists,
 * otherwise floats a pill bottom-right. Everything is opt-in per viewer and
 * remembered locally. Nothing plays until the viewer presses ON AIR.
 *
 * Page hooks (so it can live anywhere, not just /shortwave):
 *   PCLayers.ping("text", {x, y})   -> ripple + morse for any event on the page
 *   PCLayers.register({id, kind:'sound'|'sight', name, start(ctx,out), stop(), draw(g,t,w,h,level)})
 *   PCLayers.set("static", {on:true, level:.4})
 *   <body data-pc-layers-feed=".my-list">  -> watch a different stream for new items
 */
(() => {
  if (window.PCLayers) return;
  const KEY = 'pc-layers-v1';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- state ----------
  const defaults = {
    open: false, onAir: false, band: 7.2, master: 0.7,
    layers: {
      static:  { on: true,  level: 0.25 },
      carrier: { on: true,  level: 0.35 },
      morse:   { on: true,  level: 0.5  },
      pulse:   { on: false, level: 0.3  },
      scan:    { on: false, level: 0.35 },
      grain:   { on: false, level: 0.3  },
      waves:   { on: !reduced, level: 0.6 },
      sky:     { on: false, level: 0.4  },
      meter:   { on: true,  level: 0.8  },
    },
  };
  let S;
  try { S = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { S = {}; }
  S = { ...defaults, ...S, layers: { ...defaults.layers, ...(S.layers || {}) } };
  S.onAir = false; // audio always needs a fresh gesture
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };

  // ---------- styles ----------
  const css = `
  .pcl-chip{all:unset;box-sizing:border-box;display:inline-flex;align-items:center;gap:8px;height:28px;padding:0 10px;border:1px solid rgba(253,242,214,.28);border-radius:4px;color:#fdf2d6;font:600 11px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.14em;cursor:pointer;background:rgba(253,242,214,.04)}
  .pcl-chip:hover,.pcl-chip[aria-expanded=true]{background:rgba(253,242,214,.12)}
  .pcl-chip:focus-visible{outline:2px solid #e8b04a;outline-offset:2px}
  .pcl-chip .pcl-mini{display:inline-flex;gap:2px;align-items:flex-end;height:12px}
  .pcl-chip .pcl-mini i{display:block;width:2px;background:#6fbf8e;height:3px;transition:height .08s}
  .pcl-chip.on .pcl-dot{background:#e5484d;box-shadow:0 0 6px #e5484d}
  .pcl-dot{width:6px;height:6px;border-radius:50%;background:#6b645a}
  .pcl-float{position:fixed;right:16px;bottom:16px;z-index:60;background:rgba(26,23,19,.97)}
  .pcl-deck{position:fixed;left:50%;bottom:48px;transform:translateX(-50%);z-index:61;width:min(680px,calc(100vw - 32px));max-height:calc(100vh - 120px);overflow:auto;background:#1a1713;color:#fdf2d6;border:1px solid #3a342b;border-radius:8px;box-shadow:0 18px 50px rgba(0,0,0,.45);font:13px/1.4 "Inter Variable",Inter,system-ui,sans-serif}
  .pcl-deck[hidden]{display:none}
  .pcl-head{display:flex;align-items:center;gap:12px;padding:12px 14px;border-bottom:1px solid #3a342b}
  .pcl-title{font:700 11px/1 ui-monospace,Menlo,monospace;letter-spacing:.18em;color:#e8b04a}
  .pcl-freq{font:600 20px/1 ui-monospace,Menlo,monospace;letter-spacing:.04em;margin-left:auto;font-variant-numeric:tabular-nums}
  .pcl-freq small{font-size:10px;color:#a79d8c;letter-spacing:.14em;margin-left:4px}
  .pcl-x{all:unset;cursor:pointer;padding:4px 8px;color:#a79d8c;font-size:16px}
  .pcl-x:focus-visible{outline:2px solid #e8b04a}
  .pcl-tune{padding:10px 14px 4px}
  .pcl-dial{position:relative;height:34px;border-radius:4px;background:repeating-linear-gradient(90deg,#3a342b 0 1px,transparent 1px 10px),linear-gradient(#221e19,#221e19);overflow:hidden}
  .pcl-dial::after{content:"";position:absolute;inset:0;background:repeating-linear-gradient(90deg,#6b645a 0 1px,transparent 1px 50px);opacity:.8;pointer-events:none}
  .pcl-dial input{position:absolute;inset:0;width:100%;height:100%;margin:0;opacity:0;cursor:ew-resize}
  .pcl-needle{position:absolute;top:0;bottom:0;width:2px;background:#e5484d;box-shadow:0 0 8px #e5484d;pointer-events:none;z-index:1}
  .pcl-dial:focus-within{outline:2px solid #e8b04a;outline-offset:2px}
  .pcl-scale{display:flex;justify-content:space-between;font:10px/1 ui-monospace,Menlo,monospace;color:#a79d8c;padding:5px 1px 0}
  .pcl-row{display:flex;flex-wrap:wrap;gap:8px;align-items:center;padding:10px 14px}
  .pcl-air{all:unset;cursor:pointer;display:inline-flex;align-items:center;gap:8px;padding:8px 12px;border-radius:4px;border:1px solid #5a2a2a;font:700 11px/1 ui-monospace,Menlo,monospace;letter-spacing:.16em}
  .pcl-air[aria-pressed=true]{background:#5a1f1f;border-color:#e5484d}
  .pcl-air[aria-pressed=true] .pcl-dot{background:#e5484d;box-shadow:0 0 8px #e5484d}
  .pcl-air:focus-visible,.pcl-pre:focus-visible{outline:2px solid #e8b04a;outline-offset:2px}
  .pcl-pre{all:unset;cursor:pointer;padding:6px 10px;border-radius:999px;border:1px solid #3a342b;font:600 11px/1 ui-monospace,Menlo,monospace;letter-spacing:.08em;color:#d8ccb4}
  .pcl-pre:hover{border-color:#a79d8c}
  .pcl-master{display:flex;align-items:center;gap:8px;margin-left:auto;font:10px/1 ui-monospace,Menlo,monospace;letter-spacing:.14em;color:#a79d8c}
  .pcl-cols{display:grid;grid-template-columns:1fr 1fr;gap:0;border-top:1px solid #3a342b}
  @media (max-width:560px){.pcl-cols{grid-template-columns:1fr}.pcl-col+.pcl-col{border-left:0!important;border-top:1px solid #3a342b}}
  .pcl-col{padding:10px 14px 14px}
  .pcl-col+.pcl-col{border-left:1px solid #3a342b}
  .pcl-col h4{margin:0 0 8px;font:700 10px/1 ui-monospace,Menlo,monospace;letter-spacing:.2em;color:#a79d8c}
  .pcl-layer{display:grid;grid-template-columns:34px 1fr 90px;align-items:center;gap:10px;padding:6px 0}
  .pcl-layer label{display:block;cursor:pointer}
  .pcl-layer b{display:block;font-weight:600;font-size:13px}
  .pcl-layer span{display:block;font-size:11px;color:#a79d8c}
  .pcl-sw{all:unset;cursor:pointer;width:30px;height:16px;border-radius:999px;background:#3a342b;position:relative;transition:background .15s}
  .pcl-sw::after{content:"";position:absolute;top:2px;left:2px;width:12px;height:12px;border-radius:50%;background:#a79d8c;transition:transform .15s,background .15s}
  .pcl-sw[aria-checked=true]{background:#2f5b40}
  .pcl-sw[aria-checked=true]::after{transform:translateX(14px);background:#bfe8cd}
  .pcl-sw:focus-visible{outline:2px solid #e8b04a;outline-offset:2px}
  .pcl-deck input[type=range].pcl-f{width:100%;accent-color:#e8b04a}
  .pcl-foot{padding:8px 14px 12px;font-size:11px;color:#a79d8c;border-top:1px solid #3a342b}
  .pcl-foot kbd{font:10px ui-monospace,Menlo,monospace;border:1px solid #3a342b;border-radius:3px;padding:1px 4px}
  .pcl-canvas{position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:38}
  .pcl-scan{position:fixed;inset:0;pointer-events:none;z-index:38;background:repeating-linear-gradient(0deg,rgba(0,0,0,.35) 0 1px,transparent 1px 3px);mix-blend-mode:multiply}
  `;
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  // ---------- audio engine ----------
  let ctx, master, analyser, freqData;
  const nodes = {};
  function ensureAudio() {
    if (ctx) return ctx;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain(); master.gain.value = 0;
    analyser = ctx.createAnalyser(); analyser.fftSize = 128;
    freqData = new Uint8Array(analyser.frequencyBinCount);
    master.connect(analyser); analyser.connect(ctx.destination);
    return ctx;
  }
  const bandHz = () => 55 * Math.pow(2, (S.band - 3) / 3); // 3–12 MHz dial -> ~55–440Hz carrier
  function noiseBuffer() {
    const b = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return b;
  }

  const sound = {
    static: {
      name: 'Static', note: 'band hiss, tuned by the dial',
      start(out) {
        const src = ctx.createBufferSource(); src.buffer = noiseBuffer(); src.loop = true;
        const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 0.8;
        const g = ctx.createGain(); g.gain.value = 0;
        const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 0.13; lg.gain.value = 0.35;
        lfo.connect(lg); lg.connect(g.gain);
        src.connect(bp); bp.connect(g); g.connect(out); src.start(); lfo.start();
        return { g, bp, stop() { src.stop(); lfo.stop(); }, retune() { bp.frequency.setTargetAtTime(bandHz() * 12, ctx.currentTime, .1); } };
      },
      gain: l => l * 0.22,
    },
    carrier: {
      name: 'Carrier', note: 'a low drone the dial bends',
      start(out) {
        const g = ctx.createGain(); g.gain.value = 0;
        const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900;
        const a = ctx.createOscillator(), b = ctx.createOscillator(), c = ctx.createOscillator();
        a.type = 'sawtooth'; b.type = 'sawtooth'; c.type = 'sine';
        [a, b, c].forEach(o => { o.connect(lp); o.start(); });
        lp.connect(g); g.connect(out);
        const node = { g, stop() { [a, b, c].forEach(o => o.stop()); },
          retune() { const f = bandHz(), t = ctx.currentTime;
            a.frequency.setTargetAtTime(f, t, .2); b.frequency.setTargetAtTime(f * 1.006, t, .2); c.frequency.setTargetAtTime(f * 1.5, t, .2); } };
        node.retune(); return node;
      },
      gain: l => l * 0.08,
    },
    morse: {
      name: 'Morse', note: 'every new post keys out in code',
      start(out) { const g = ctx.createGain(); g.gain.value = 0; g.connect(out); return { g, stop() {} }; },
      gain: l => l * 0.5,
    },
    pulse: {
      name: 'Pulse', note: 'a slow town heartbeat',
      start(out) {
        const g = ctx.createGain(); g.gain.value = 0; g.connect(out);
        const id = setInterval(() => {
          const o = ctx.createOscillator(), e = ctx.createGain(), t = ctx.currentTime;
          o.frequency.setValueAtTime(90, t); o.frequency.exponentialRampToValueAtTime(40, t + .25);
          e.gain.setValueAtTime(.9, t); e.gain.exponentialRampToValueAtTime(.001, t + .35);
          o.connect(e); e.connect(g); o.start(t); o.stop(t + .4);
          beat = performance.now();
        }, 1200);
        return { g, stop() { clearInterval(id); } };
      },
      gain: l => l * 0.6,
    },
  };
  let beat = 0;

  function applyAudio() {
    if (!ctx) return;
    const t = ctx.currentTime;
    master.gain.setTargetAtTime(S.onAir ? S.master : 0, t, .15);
    for (const id in sound) {
      const L = S.layers[id]; if (!L) continue;
      if (S.onAir && L.on && !nodes[id]) nodes[id] = sound[id].start(master);
      const n = nodes[id]; if (!n) continue;
      n.g.gain.setTargetAtTime(L.on ? sound[id].gain(L.level) : 0, t, .12);
      n.retune && n.retune();
    }
    extra.filter(x => x.kind === 'sound').forEach(x => {
      const L = S.layers[x.id] || (S.layers[x.id] = { on: false, level: .5 });
      if (S.onAir && L.on && !x._n) x._n = x.start(ctx, master);
      if (x._n && x._n.g) x._n.g.gain.setTargetAtTime(L.on ? L.level : 0, t, .12);
    });
  }

  // morse
  const MORSE = { a:'.-',b:'-...',c:'-.-.',d:'-..',e:'.',f:'..-.',g:'--.',h:'....',i:'..',j:'.---',k:'-.-',l:'.-..',m:'--',n:'-.',o:'---',p:'.--.',q:'--.-',r:'.-.',s:'...',t:'-',u:'..-',v:'...-',w:'.--',x:'-..-',y:'-.--',z:'--..',0:'-----',1:'.----',2:'..---',3:'...--',4:'....-',5:'.....',6:'-....',7:'--...',8:'---..',9:'----.' };
  function keyMorse(text) {
    if (!ctx || !S.onAir || !nodes.morse || !S.layers.morse.on) return;
    const unit = 0.06, f = 600 + (S.band - 3) * 40;
    let t = ctx.currentTime + 0.05;
    const word = (text || 'pc').toLowerCase().replace(/[^a-z0-9 ]/g, '').trim().split(/\s+/)[0].slice(0, 6) || 'pc';
    for (const ch of word) {
      for (const sym of (MORSE[ch] || '')) {
        const d = sym === '.' ? unit : unit * 3;
        const o = ctx.createOscillator(), e = ctx.createGain();
        o.frequency.value = f; e.gain.setValueAtTime(0, t); e.gain.linearRampToValueAtTime(.8, t + .005);
        e.gain.setValueAtTime(.8, t + d - .005); e.gain.linearRampToValueAtTime(0, t + d);
        o.connect(e); e.connect(nodes.morse.g); o.start(t); o.stop(t + d + .01);
        t += d + unit;
      }
      t += unit * 2;
    }
  }

  // ---------- sight engine ----------
  const cv = document.createElement('canvas'); cv.className = 'pcl-canvas'; cv.setAttribute('aria-hidden', 'true');
  const scan = document.createElement('div'); scan.className = 'pcl-scan'; scan.setAttribute('aria-hidden', 'true');
  const g = cv.getContext('2d');
  let W = 0, H = 0, dpr = 1;
  function resize() { dpr = Math.min(2, devicePixelRatio || 1); W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; g.setTransform(dpr, 0, 0, dpr, 0, 0); }
  const ripples = [];
  let grainTile;
  function makeGrain() {
    grainTile = document.createElement('canvas'); grainTile.width = grainTile.height = 128;
    const gg = grainTile.getContext('2d'), im = gg.createImageData(128, 128);
    for (let i = 0; i < im.data.length; i += 4) { const v = Math.random() * 255; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; }
    gg.putImageData(im, 0, 0);
  }

  const sight = {
    waves: { name: 'Waves', note: 'posts + taps ripple out' },
    sky:   { name: 'Sky', note: 'the band tints the page' },
    grain: { name: 'Grain', note: 'film noise over everything' },
    scan:  { name: 'Scanlines', note: 'old-set CRT lines' },
    meter: { name: 'Meter', note: 'live spectrum on the bar' },
  };
  const sightOn = () => ['waves', 'sky', 'grain'].some(k => S.layers[k].on) || extra.some(x => x.kind === 'sight' && S.layers[x.id]?.on);

  let raf = 0, levelSmooth = 0;
  function level() {
    if (analyser && S.onAir) { analyser.getByteFrequencyData(freqData); let s = 0; for (const v of freqData) s += v; return s / freqData.length / 255; }
    return 0;
  }
  function frame(now) {
    raf = requestAnimationFrame(frame);
    const lv = level(); levelSmooth += (lv - levelSmooth) * .2;
    updateMini();
    if (!sightOn() && !ripples.length) { g.clearRect(0, 0, W, H); return; }
    g.clearRect(0, 0, W, H);
    const hue = ((S.band - 3) / 9) * 300 + 180;
    if (S.layers.sky.on) {
      const a = S.layers.sky.level * .22 * (1 + levelSmooth * 2);
      const gr = g.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, `hsla(${hue},70%,60%,${a})`); gr.addColorStop(.6, `hsla(${hue + 40},70%,55%,${a * .3})`); gr.addColorStop(1, `hsla(${hue + 80},70%,50%,${a})`);
      g.fillStyle = gr; g.fillRect(0, 0, W, H);
      if (beat && now - beat < 350 && S.layers.pulse.on) { g.fillStyle = `hsla(${hue},80%,60%,${.06 * (1 - (now - beat) / 350)})`; g.fillRect(0, 0, W, H); }
    }
    if (S.layers.waves.on) {
      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i], age = (now - r.t) / 1000;
        if (age > 2.4) { ripples.splice(i, 1); continue; }
        for (let k = 0; k < 3; k++) {
          const a = age - k * .22; if (a < 0) continue;
          g.beginPath(); g.arc(r.x, r.y, 8 + a * 220, 0, Math.PI * 2);
          g.strokeStyle = `hsla(${r.hue ?? hue},80%,55%,${S.layers.waves.level * (1 - a / 2.4) * .7})`;
          g.lineWidth = 2; g.stroke();
        }
      }
    } else ripples.length = 0;
    if (S.layers.grain.on) {
      if (!grainTile) makeGrain();
      g.save(); g.globalAlpha = S.layers.grain.level * .18; g.globalCompositeOperation = 'overlay';
      const p = g.createPattern(grainTile, 'repeat'); g.translate(Math.random() * 128, Math.random() * 128);
      g.fillStyle = p; g.fillRect(-128, -128, W + 256, H + 256); g.restore();
    }
    extra.forEach(x => { if (x.kind === 'sight' && S.layers[x.id]?.on && x.draw) x.draw(g, now, W, H, levelSmooth); });
  }

  function applySight() {
    scan.style.display = S.layers.scan.on ? '' : 'none';
    scan.style.opacity = S.layers.scan.level;
    if (!raf) raf = requestAnimationFrame(frame);
  }

  // ---------- UI ----------
  const chip = document.createElement('button');
  chip.className = 'pcl-chip'; chip.type = 'button';
  chip.setAttribute('aria-haspopup', 'dialog'); chip.setAttribute('aria-expanded', 'false');
  chip.innerHTML = `<span class="pcl-dot"></span>LAYERS<span class="pcl-mini" aria-hidden="true">${'<i></i>'.repeat(6)}</span>`;
  const minis = chip.querySelectorAll('.pcl-mini i');
  let tick = 0;
  function updateMini() {
    if (++tick % 3) return;
    const show = S.layers.meter.on;
    chip.querySelector('.pcl-mini').style.display = show ? '' : 'none';
    if (!show) return;
    minis.forEach((m, i) => {
      let v = 0;
      if (freqData && S.onAir) v = freqData[2 + i * 4] / 255;
      m.style.height = (3 + v * 9 * S.layers.meter.level) + 'px';
    });
  }

  const deck = document.createElement('div');
  deck.className = 'pcl-deck'; deck.hidden = true;
  deck.setAttribute('role', 'dialog'); deck.setAttribute('aria-label', 'Layers');

  const PRESETS = {
    Quiet:  { static: [0], carrier: [0], morse: [1, .35], pulse: [0], scan: [0], grain: [0], waves: [1, .5], sky: [0], meter: [1] },
    Radio:  { static: [1, .3], carrier: [1, .35], morse: [1, .5], pulse: [0], scan: [1, .3], grain: [0], waves: [1, .6], sky: [0], meter: [1] },
    Storm:  { static: [1, .7], carrier: [1, .5], morse: [1, .6], pulse: [1, .4], scan: [1, .5], grain: [1, .5], waves: [1, .9], sky: [1, .6], meter: [1] },
    Off:    { static: [0], carrier: [0], morse: [0], pulse: [0], scan: [0], grain: [0], waves: [0], sky: [0], meter: [0] },
  };

  const layerRow = (id, meta) => `
    <div class="pcl-layer">
      <button class="pcl-sw" role="switch" data-sw="${id}" aria-checked="${S.layers[id].on}" aria-labelledby="pcl-l-${id}"></button>
      <label id="pcl-l-${id}" data-lb="${id}"><b>${meta.name}</b><span>${meta.note || ''}</span></label>
      <input class="pcl-f" type="range" min="0" max="1" step="0.01" value="${S.layers[id].level}" data-f="${id}" aria-label="${meta.name} level">
    </div>`;

  function render() {
    const soundList = { ...Object.fromEntries(Object.entries(sound).map(([k, v]) => [k, v])), ...Object.fromEntries(extra.filter(x => x.kind === 'sound').map(x => [x.id, x])) };
    const sightList = { ...sight, ...Object.fromEntries(extra.filter(x => x.kind === 'sight').map(x => [x.id, x])) };
    const pct = ((S.band - 3) / 9) * 100;
    deck.innerHTML = `
      <div class="pcl-head">
        <span class="pcl-title">LAYERS</span>
        <span style="font-size:12px;color:#a79d8c">${document.title.split('—')[0].split('·')[0].trim() || 'PointCast'}</span>
        <span class="pcl-freq" aria-live="polite"><span data-freq>${S.band.toFixed(3)}</span><small>MHz</small></span>
        <button class="pcl-x" data-close aria-label="Close layers">×</button>
      </div>
      <div class="pcl-tune">
        <div class="pcl-dial"><span class="pcl-needle" style="left:${pct}%"></span>
          <input type="range" min="3" max="12" step="0.005" value="${S.band}" data-band aria-label="Tune the band"></div>
        <div class="pcl-scale"><span>3</span><span>4.5</span><span>6</span><span>7.5</span><span>9</span><span>10.5</span><span>12</span></div>
      </div>
      <div class="pcl-row">
        <button class="pcl-air" data-air aria-pressed="${S.onAir}"><span class="pcl-dot"></span>ON AIR</button>
        ${Object.keys(PRESETS).map(p => `<button class="pcl-pre" data-pre="${p}">${p}</button>`).join('')}
        <label class="pcl-master">VOL <input class="pcl-f" style="width:80px" type="range" min="0" max="1" step="0.01" value="${S.master}" data-master aria-label="Master volume"></label>
      </div>
      <div class="pcl-cols">
        <div class="pcl-col"><h4>SOUND</h4>${Object.entries(soundList).map(([k, v]) => layerRow(k, v)).join('')}</div>
        <div class="pcl-col"><h4>SIGHT</h4>${Object.entries(sightList).map(([k, v]) => layerRow(k, v)).join('')}</div>
      </div>
      <div class="pcl-foot">Yours only — saved in this browser. Sound starts with ON AIR. <kbd>L</kbd> opens, <kbd>Esc</kbd> closes. Tap anywhere with Waves on.</div>`;
  }

  function setOpen(v) {
    S.open = v; deck.hidden = !v; chip.setAttribute('aria-expanded', String(v)); save();
    if (v) { render(); deck.querySelector('[data-air]').focus(); }
  }
  function setAir(v) {
    if (v) { ensureAudio(); ctx.resume(); }
    S.onAir = v; chip.classList.toggle('on', v);
    const b = deck.querySelector('[data-air]'); if (b) b.setAttribute('aria-pressed', String(v));
    applyAudio(); save();
    if (v) keyMorse('pc');
  }

  chip.addEventListener('click', () => setOpen(deck.hidden));
  deck.addEventListener('click', e => {
    const t = e.target.closest('button,label[data-lb]'); if (!t) return;
    if (t.dataset.close !== undefined) return setOpen(false), chip.focus();
    if (t.dataset.air !== undefined) return setAir(!S.onAir);
    const id = t.dataset.sw || t.dataset.lb;
    if (id) { S.layers[id].on = !S.layers[id].on; deck.querySelector(`[data-sw="${id}"]`).setAttribute('aria-checked', S.layers[id].on); commit(); return; }
    if (t.dataset.pre) {
      const p = PRESETS[t.dataset.pre];
      for (const k in p) { S.layers[k].on = !!p[k][0]; if (p[k][1] != null) S.layers[k].level = p[k][1]; }
      if (t.dataset.pre !== 'Off' && t.dataset.pre !== 'Quiet' && !S.onAir) setAir(true);
      if (t.dataset.pre === 'Off' && S.onAir) setAir(false);
      render(); commit();
    }
  });
  deck.addEventListener('input', e => {
    const t = e.target;
    if (t.dataset.f) { S.layers[t.dataset.f].level = +t.value; if (!S.layers[t.dataset.f].on) { S.layers[t.dataset.f].on = true; deck.querySelector(`[data-sw="${t.dataset.f}"]`).setAttribute('aria-checked', 'true'); } }
    if (t.dataset.master !== undefined) S.master = +t.value;
    if (t.dataset.band !== undefined) {
      S.band = +t.value;
      deck.querySelector('[data-freq]').textContent = S.band.toFixed(3);
      deck.querySelector('.pcl-needle').style.left = ((S.band - 3) / 9 * 100) + '%';
    }
    commit();
  });
  function commit() { applyAudio(); applySight(); save(); }

  addEventListener('keydown', e => {
    if (e.target.closest && e.target.closest('input,textarea,[contenteditable=true],select')) return;
    if ((e.key === 'l' || e.key === 'L') && !e.metaKey && !e.ctrlKey && !e.altKey) { e.preventDefault(); setOpen(deck.hidden); }
    if (e.key === 'Escape' && !deck.hidden) { setOpen(false); chip.focus(); }
  });
  addEventListener('pointerdown', e => {
    if (!S.layers.waves.on || e.target.closest('.pcl-deck,.pcl-chip')) return;
    ripples.push({ x: e.clientX, y: e.clientY, t: performance.now() });
  }, { passive: true });
  addEventListener('resize', resize);

  // ---------- feed watcher (shortwave by default, any list via data attr) ----------
  function watchFeed() {
    const sel = document.body.dataset.pcLayersFeed || '.sw-stream';
    const feed = document.querySelector(sel);
    if (!feed) return;
    new MutationObserver(muts => {
      muts.forEach(m => m.addedNodes.forEach(n => {
        if (n.nodeType !== 1) return;
        const r = (n.querySelector('img') || n).getBoundingClientRect();
        const txt = (n.innerText || '').split('\n').find(l => l.trim().length > 2 && !/…|\.\.\./.test(l)) || n.innerText;
        ping(txt.replace(/^\S+\s+/, ''), { x: r.left + r.width / 2, y: Math.max(40, Math.min(innerHeight - 60, r.top + r.height / 2)) });
      }));
    }).observe(feed, { childList: true });
  }

  function ping(text, at = {}) {
    if (S.layers.waves.on) ripples.push({ x: at.x ?? innerWidth / 2, y: at.y ?? innerHeight - 60, t: performance.now(), hue: at.hue });
    keyMorse(text);
  }

  // ---------- extension API ----------
  const extra = [];
  window.PCLayers = {
    ping,
    open: () => setOpen(true), close: () => setOpen(false),
    set(id, v) { if (S.layers[id]) Object.assign(S.layers[id], v); if (!deck.hidden) render(); commit(); },
    register(layer) { extra.push(layer); if (!S.layers[layer.id]) S.layers[layer.id] = { on: !!layer.on, level: layer.level ?? .5 }; if (!deck.hidden) render(); commit(); },
    get state() { return JSON.parse(JSON.stringify(S)); },
  };

  // ---------- mount ----------
  function mount() {
    const home = document.querySelector('.fb__right');
    if (home) home.prepend(chip); else { chip.classList.add('pcl-float'); document.body.appendChild(chip); }
    document.body.append(cv, scan, deck);
    resize(); applySight(); watchFeed();
    if (S.open) setOpen(true);
  }
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', mount) : mount();
})();
