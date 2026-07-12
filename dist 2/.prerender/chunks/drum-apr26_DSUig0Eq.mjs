import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { a as renderTemplate, e as renderHead } from './prerender_CmTjnOuJ.mjs';
import 'clsx';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(raw || cooked.slice()) }));
var _a;
const $$DrumApr26 = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate(_a || (_a = __template(['<html lang="en"> <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Drum Room · Apr 26 Special Edition — PointCast</title><meta name="description" content="8-pad beat machine with 16-step sequencer. Kick, snare, hats, clap, toms, ride — all synthesized in the browser. Apr 26 special edition from pointcast.xyz."><meta property="og:title" content="Drum Room · Apr 26 Special Edition"><meta property="og:description" content="8 pads. 16 steps. synthesized. tap Q W E R · A S D F."><meta property="og:image" content="https://pointcast.xyz/images/og-drum.png"><meta property="og:url" content="https://pointcast.xyz/drum-apr26"><meta property="og:type" content="website"><meta name="twitter:card" content="summary_large_image"><link rel="icon" href="/favicon.ico">', `</head> <body> <div class="pc-strip"> <a href="/drum" class="pc-back">← drum</a> <span class="pc-label">apr 26 &middot; special edition</span> <span class="pc-attr">— cc</span> </div> <div class="title">Beat Machine</div> <div class="subtitle">Apr 26 Special Edition &nbsp;·&nbsp; pointcast.xyz</div> <div class="controls"> <div class="pill"> <span class="pill-label">BPM</span> <button class="icon-btn" id="bpm-dn">−</button> <span class="bpm-val" id="bpm-val">120</span> <button class="icon-btn" id="bpm-up">+</button> </div> <button class="transport-btn play-btn" id="play-btn">▶&nbsp; Play</button> <button class="transport-btn clear-btn" id="clear-btn">Clear</button> <div class="pill"> <span class="pill-label">Vol</span> <input type="range" id="vol" min="0" max="1" step="0.02" value="0.78"> </div> <div class="pill"> <span class="swing-label">Swing</span> <input type="range" id="swing" min="0" max="0.08" step="0.005" value="0"> <span class="swing-val" id="swing-val">0%</span> </div> </div> <div class="presets" id="presets"></div> <div class="pads-grid" id="pads-grid"></div> <div class="sequencer"> <div class="seq-inner" id="seq-inner"></div> </div> <div class="hint">Keys: Q W E R &nbsp;·&nbsp; A S D F &nbsp;|&nbsp; Space: play/stop &nbsp;|&nbsp; ↑↓: BPM</div> <script>
  'use strict';

  const SOUNDS = [
    { id:'kick',    name:'Kick',     key:'q', color:'#ff9f43', glyph:'◉' },
    { id:'snare',   name:'Snare',    key:'w', color:'#4d96ff', glyph:'◈' },
    { id:'hihat',   name:'Hi-Hat',   key:'e', color:'#4ecdc4', glyph:'⊕' },
    { id:'openhat', name:'Open Hat', key:'r', color:'#48d768', glyph:'⊙' },
    { id:'clap',    name:'Clap',     key:'a', color:'#ff6b9d', glyph:'✦' },
    { id:'tomh',    name:'Tom Hi',   key:'s', color:'#b07fff', glyph:'▲' },
    { id:'toml',    name:'Tom Lo',   key:'d', color:'#ff6b6b', glyph:'▼' },
    { id:'ride',    name:'Ride',     key:'f', color:'#ffd93d', glyph:'◎' },
  ];

  const STEPS = 16;
  let bpm = 120, swing = 0, isPlaying = false;
  let currentStep = 0, nextNoteTime = 0, schedulerTimer = null;

  const seq = {};
  SOUNDS.forEach(({ id }) => { seq[id] = new Array(STEPS).fill(false); });

  const PRESETS = {
    basic: {
      label: 'Basic',
      kick:    [1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0],
      snare:   [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],
      hihat:   [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0],
      openhat: [0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1],
    },
    funk: {
      label: 'Funk',
      kick:    [1,0,0,1,0,0,1,0,0,1,0,0,1,0,0,0],
      snare:   [0,0,0,0,1,0,0,1,0,0,1,0,0,1,0,0],
      hihat:   [1,1,0,1,1,0,1,1,0,1,1,0,1,1,0,1],
      openhat: [0,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0],
      clap:    [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],
    },
    hiphop: {
      label: 'Hip-Hop',
      kick:    [1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0],
      snare:   [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],
      hihat:   [0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,1],
      openhat: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      clap:    [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],
    },
    dnb: {
      label: "D'n'B",
      kick:    [1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0],
      snare:   [0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0],
      hihat:   [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0],
      openhat: [0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1],
      clap:    [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],
      tomh:    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0],
    },
    techno: {
      label: 'Techno',
      kick:    [1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0],
      snare:   [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],
      hihat:   [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      openhat: [0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1],
      ride:    [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0],
    },
    bossa: {
      label: 'Bossa',
      kick:    [1,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0],
      snare:   [0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0],
      hihat:   [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0],
      clap:    [0,0,1,0,0,1,0,0,1,0,0,1,0,0,1,0],
      ride:    [1,0,1,0,0,1,0,0,1,0,1,0,0,1,0,0],
    },
    jazz: {
      label: 'Jazz',
      kick:    [1,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0],
      snare:   [0,0,0,0,1,0,0,1,0,0,1,0,0,0,1,0],
      hihat:   [1,0,0,1,0,0,1,0,0,1,0,0,1,0,0,0],
      ride:    [1,0,1,1,0,1,1,0,1,1,0,1,1,0,1,1],
    },
  };

  let currentPreset = 'basic';
  function loadPreset(name) {
    currentPreset = name;
    const p = PRESETS[name] || {};
    SOUNDS.forEach(({ id }) => {
      seq[id] = Array.from({ length: STEPS }, (_, i) => !!(p[id] && p[id][i]));
    });
    renderSeq();
    document.querySelectorAll('.preset-btn').forEach(b => b.classList.toggle('active', b.dataset.preset === name));
  }

  // ── Audio ──
  let actx = null, masterGain = null, noiseBuffer = null;

  function initAudio() {
    if (actx) return;
    actx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = actx.createGain();
    masterGain.gain.value = parseFloat(document.getElementById('vol').value);
    masterGain.connect(actx.destination);
  }

  function resumeCtx() { if (actx && actx.state === 'suspended') actx.resume(); }

  function getNoise() {
    if (noiseBuffer) return noiseBuffer;
    const buf = actx.createBuffer(1, actx.sampleRate * 2, actx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return (noiseBuffer = buf);
  }

  function mkOsc(freq, type, t, dur, g0, g1, f1) {
    const o = actx.createOscillator(), g = actx.createGain();
    o.connect(g); g.connect(masterGain);
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (f1 !== undefined) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(g0, t);
    g.gain.exponentialRampToValueAtTime(Math.max(g1, 1e-4), t + dur);
    o.start(t); o.stop(t + dur + 0.01);
  }

  function mkNoise(fType, fFreq, fQ, t, dur, g0) {
    const src = actx.createBufferSource();
    src.buffer = getNoise();
    src.loop = true;
    const f = actx.createBiquadFilter();
    f.type = fType; f.frequency.value = fFreq;
    if (fQ) f.Q.value = fQ;
    const g = actx.createGain();
    src.connect(f); f.connect(g); g.connect(masterGain);
    g.gain.setValueAtTime(g0, t);
    g.gain.exponentialRampToValueAtTime(1e-4, t + dur);
    src.start(t); src.stop(t + dur + 0.01);
  }

  let compressor = null;
  function getComp() {
    if (compressor) return compressor;
    compressor = actx.createDynamicsCompressor();
    compressor.threshold.value = -18; compressor.knee.value = 6;
    compressor.ratio.value = 4; compressor.attack.value = 0.003; compressor.release.value = 0.15;
    compressor.connect(actx.destination);
    masterGain.disconnect(); masterGain.connect(compressor);
    return compressor;
  }

  const drums = {
    kick(t)    { getComp(); mkOsc(165,'sine',t,0.50,1.3,1e-4,28); mkOsc(1300,'sine',t,0.014,0.55,1e-4); },
    snare(t)   { mkOsc(195,'triangle',t,0.14,0.75,1e-4,75); mkNoise('highpass',750,1.2,t,0.24,1.0); mkNoise('bandpass',3500,0.6,t,0.12,0.4); },
    hihat(t)   { mkNoise('bandpass',9500,0.7,t,0.065,0.55); mkNoise('highpass',13000,1,t,0.04,0.25); },
    openhat(t) { mkNoise('bandpass',8500,0.6,t,0.42,0.48); mkNoise('highpass',12000,1.2,t,0.42,0.22); },
    clap(t)    { for (let i=0;i<3;i++) { mkNoise('bandpass',1050,1.0,t+i*0.013,0.13,0.62); mkNoise('highpass',2500,0.5,t+i*0.013,0.1,0.28); } },
    tomh(t)    { mkOsc(265,'sine',t,0.27,1.0,1e-4,105); mkOsc(800,'sine',t,0.025,0.45,1e-4); },
    toml(t)    { mkOsc(135,'sine',t,0.40,1.1,1e-4,50); mkOsc(400,'sine',t,0.022,0.38,1e-4); },
    ride(t)    { mkNoise('highpass',6500,1,t,0.60,0.3); mkOsc(1650,'triangle',t,0.50,0.22,1e-4); mkOsc(3300,'triangle',t,0.20,0.1,1e-4); },
  };

  // ── Scheduler ──
  const LOOKAHEAD = 25, SCHEDULE_S = 0.1;
  function stepDur() { return 60 / bpm / 4; }
  function swingOffset(s) { return (s % 2 === 1) ? swing : 0; }

  function tick() {
    while (nextNoteTime < actx.currentTime + SCHEDULE_S) {
      SOUNDS.forEach(({ id }) => { if (seq[id][currentStep]) drums[id](nextNoteTime + swingOffset(currentStep)); });
      const step = currentStep;
      const fireIn = (nextNoteTime - actx.currentTime) * 1000;
      setTimeout(() => {
        setPlayhead(step);
        SOUNDS.forEach(({ id }) => { if (seq[id][step]) flashPad(id); });
      }, Math.max(0, fireIn));
      currentStep = (currentStep + 1) % STEPS;
      nextNoteTime += stepDur();
    }
    schedulerTimer = setTimeout(tick, LOOKAHEAD);
  }

  function startPlay() {
    initAudio(); resumeCtx(); isPlaying = true;
    currentStep = 0; nextNoteTime = actx.currentTime + 0.05; tick();
    const btn = document.getElementById('play-btn');
    btn.textContent = '■ Stop'; btn.classList.add('active');
  }
  function stopPlay() {
    isPlaying = false; clearTimeout(schedulerTimer); schedulerTimer = null; setPlayhead(-1);
    const btn = document.getElementById('play-btn');
    btn.textContent = '▶ Play'; btn.classList.remove('active');
  }
  function togglePlay() { isPlaying ? stopPlay() : startPlay(); }

  // ── Pads ──
  function buildPads() {
    const grid = document.getElementById('pads-grid');
    SOUNDS.forEach(({ id, name, key, color, glyph }) => {
      const pad = document.createElement('div');
      pad.className = 'pad'; pad.style.setProperty('--c', color); pad.dataset.id = id;
      pad.innerHTML = \`<span class="pad-glyph">\${glyph}</span><span class="pad-name">\${name}</span><span class="pad-key">\${key.toUpperCase()}</span>\`;
      const fire = () => { initAudio(); resumeCtx(); drums[id](actx.currentTime); flashPad(id); };
      pad.addEventListener('mousedown', fire);
      pad.addEventListener('touchstart', e => { e.preventDefault(); fire(); }, { passive: false });
      grid.appendChild(pad);
    });
  }

  function flashPad(id) {
    const pad = document.querySelector(\`.pad[data-id="\${id}"]\`);
    if (!pad) return;
    pad.classList.remove('hit'); void pad.offsetWidth; pad.classList.add('hit');
    setTimeout(() => pad.classList.remove('hit'), 160);
  }

  // ── Sequencer ──
  function buildSeq() {
    const container = document.getElementById('seq-inner');
    container.innerHTML = '';
    const hdr = document.createElement('div'); hdr.className = 'seq-heading'; hdr.textContent = '16-Step Sequencer'; container.appendChild(hdr);
    const beatRow = document.createElement('div'); beatRow.className = 'beat-labels';
    for (let g = 0; g < 4; g++) {
      const grp = document.createElement('div'); grp.className = 'beat-grp';
      for (let s = 0; s < 4; s++) { const n = document.createElement('div'); n.className = 'beat-num'; n.textContent = s === 0 ? (g+1) : '·'; grp.appendChild(n); }
      beatRow.appendChild(grp);
    }
    container.appendChild(beatRow);
    SOUNDS.forEach(({ id, name, color }) => {
      const row = document.createElement('div'); row.className = 'seq-row';
      const label = document.createElement('div'); label.className = 'seq-name'; label.style.color = color; label.textContent = name; row.appendChild(label);
      const groups = document.createElement('div'); groups.className = 'seq-groups';
      for (let g = 0; g < 4; g++) {
        const grp = document.createElement('div'); grp.className = 'seq-grp';
        for (let s = 0; s < 4; s++) {
          const i = g*4+s;
          const btn = document.createElement('div');
          btn.className = 'seq-step'; btn.style.setProperty('--c', color);
          btn.dataset.sound = id; btn.dataset.step = i;
          if (seq[id][i]) btn.classList.add('on');
          btn.addEventListener('click', () => { initAudio(); seq[id][i] = !seq[id][i]; btn.classList.toggle('on', seq[id][i]); });
          grp.appendChild(btn);
        }
        groups.appendChild(grp);
      }
      row.appendChild(groups); container.appendChild(row);
    });
  }

  function renderSeq() {
    SOUNDS.forEach(({ id }) => {
      document.querySelectorAll(\`.seq-step[data-sound="\${id}"]\`).forEach((btn, i) => btn.classList.toggle('on', seq[id][i]));
    });
  }

  let lastHead = -1;
  function setPlayhead(step) {
    if (lastHead === step) return;
    document.querySelectorAll('.seq-step.playhead').forEach(el => el.classList.remove('playhead'));
    if (step >= 0) document.querySelectorAll(\`.seq-step[data-step="\${step}"]\`).forEach(el => el.classList.add('playhead'));
    lastHead = step;
  }

  // ── Presets ──
  function buildPresets() {
    const bar = document.getElementById('presets');
    Object.entries(PRESETS).forEach(([key, { label }]) => {
      const btn = document.createElement('button');
      btn.className = 'preset-btn'; btn.textContent = label; btn.dataset.preset = key;
      btn.addEventListener('click', () => loadPreset(key));
      bar.appendChild(btn);
    });
  }

  // ── Keyboard ──
  const keyMap = {};
  SOUNDS.forEach(({ id, key }) => keyMap[key] = id);
  const held = new Set();
  document.addEventListener('keydown', e => {
    if (e.repeat) return;
    const k = e.key.toLowerCase();
    if (k === ' ')         { e.preventDefault(); initAudio(); togglePlay(); return; }
    if (k === 'arrowup')   { e.preventDefault(); changeBpm(+5); return; }
    if (k === 'arrowdown') { e.preventDefault(); changeBpm(-5); return; }
    if (keyMap[k] && !held.has(k)) {
      held.add(k); initAudio(); resumeCtx();
      drums[keyMap[k]](actx.currentTime); flashPad(keyMap[k]);
    }
  });
  document.addEventListener('keyup', e => held.delete(e.key.toLowerCase()));

  // ── BPM & Controls ──
  function changeBpm(d) { bpm = Math.max(40, Math.min(220, bpm + d)); document.getElementById('bpm-val').textContent = bpm; }

  let bpmTimer = null;
  function holdBpm(delta) { bpmTimer = setInterval(() => changeBpm(delta), 75); }
  ['bpm-dn','bpm-up'].forEach(id => {
    const d = id === 'bpm-up' ? +1 : -1;
    const btn = document.getElementById(id);
    btn.addEventListener('click', () => changeBpm(d));
    btn.addEventListener('mousedown', () => holdBpm(d));
    ['mouseup','mouseleave'].forEach(ev => btn.addEventListener(ev, () => clearInterval(bpmTimer)));
  });

  document.getElementById('play-btn').addEventListener('click', () => { initAudio(); togglePlay(); });
  document.getElementById('clear-btn').addEventListener('click', () => {
    SOUNDS.forEach(({ id }) => seq[id].fill(false));
    renderSeq();
    document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
  });
  document.getElementById('vol').addEventListener('input', e => { if (masterGain) masterGain.gain.value = parseFloat(e.target.value); });
  document.getElementById('swing').addEventListener('input', e => {
    swing = parseFloat(e.target.value);
    document.getElementById('swing-val').textContent = Math.round(swing / 0.08 * 100) + '%';
  });

  // ── Boot ──
  buildPresets(); buildPads(); buildSeq(); loadPreset('basic');
  <\/script> </body> </html>`], ['<html lang="en"> <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Drum Room · Apr 26 Special Edition — PointCast</title><meta name="description" content="8-pad beat machine with 16-step sequencer. Kick, snare, hats, clap, toms, ride — all synthesized in the browser. Apr 26 special edition from pointcast.xyz."><meta property="og:title" content="Drum Room · Apr 26 Special Edition"><meta property="og:description" content="8 pads. 16 steps. synthesized. tap Q W E R · A S D F."><meta property="og:image" content="https://pointcast.xyz/images/og-drum.png"><meta property="og:url" content="https://pointcast.xyz/drum-apr26"><meta property="og:type" content="website"><meta name="twitter:card" content="summary_large_image"><link rel="icon" href="/favicon.ico">', `</head> <body> <div class="pc-strip"> <a href="/drum" class="pc-back">← drum</a> <span class="pc-label">apr 26 &middot; special edition</span> <span class="pc-attr">— cc</span> </div> <div class="title">Beat Machine</div> <div class="subtitle">Apr 26 Special Edition &nbsp;·&nbsp; pointcast.xyz</div> <div class="controls"> <div class="pill"> <span class="pill-label">BPM</span> <button class="icon-btn" id="bpm-dn">−</button> <span class="bpm-val" id="bpm-val">120</span> <button class="icon-btn" id="bpm-up">+</button> </div> <button class="transport-btn play-btn" id="play-btn">▶&nbsp; Play</button> <button class="transport-btn clear-btn" id="clear-btn">Clear</button> <div class="pill"> <span class="pill-label">Vol</span> <input type="range" id="vol" min="0" max="1" step="0.02" value="0.78"> </div> <div class="pill"> <span class="swing-label">Swing</span> <input type="range" id="swing" min="0" max="0.08" step="0.005" value="0"> <span class="swing-val" id="swing-val">0%</span> </div> </div> <div class="presets" id="presets"></div> <div class="pads-grid" id="pads-grid"></div> <div class="sequencer"> <div class="seq-inner" id="seq-inner"></div> </div> <div class="hint">Keys: Q W E R &nbsp;·&nbsp; A S D F &nbsp;|&nbsp; Space: play/stop &nbsp;|&nbsp; ↑↓: BPM</div> <script>
  'use strict';

  const SOUNDS = [
    { id:'kick',    name:'Kick',     key:'q', color:'#ff9f43', glyph:'◉' },
    { id:'snare',   name:'Snare',    key:'w', color:'#4d96ff', glyph:'◈' },
    { id:'hihat',   name:'Hi-Hat',   key:'e', color:'#4ecdc4', glyph:'⊕' },
    { id:'openhat', name:'Open Hat', key:'r', color:'#48d768', glyph:'⊙' },
    { id:'clap',    name:'Clap',     key:'a', color:'#ff6b9d', glyph:'✦' },
    { id:'tomh',    name:'Tom Hi',   key:'s', color:'#b07fff', glyph:'▲' },
    { id:'toml',    name:'Tom Lo',   key:'d', color:'#ff6b6b', glyph:'▼' },
    { id:'ride',    name:'Ride',     key:'f', color:'#ffd93d', glyph:'◎' },
  ];

  const STEPS = 16;
  let bpm = 120, swing = 0, isPlaying = false;
  let currentStep = 0, nextNoteTime = 0, schedulerTimer = null;

  const seq = {};
  SOUNDS.forEach(({ id }) => { seq[id] = new Array(STEPS).fill(false); });

  const PRESETS = {
    basic: {
      label: 'Basic',
      kick:    [1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0],
      snare:   [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],
      hihat:   [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0],
      openhat: [0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1],
    },
    funk: {
      label: 'Funk',
      kick:    [1,0,0,1,0,0,1,0,0,1,0,0,1,0,0,0],
      snare:   [0,0,0,0,1,0,0,1,0,0,1,0,0,1,0,0],
      hihat:   [1,1,0,1,1,0,1,1,0,1,1,0,1,1,0,1],
      openhat: [0,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0],
      clap:    [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],
    },
    hiphop: {
      label: 'Hip-Hop',
      kick:    [1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0],
      snare:   [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],
      hihat:   [0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,1],
      openhat: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      clap:    [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],
    },
    dnb: {
      label: "D'n'B",
      kick:    [1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0],
      snare:   [0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0],
      hihat:   [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0],
      openhat: [0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1],
      clap:    [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],
      tomh:    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0],
    },
    techno: {
      label: 'Techno',
      kick:    [1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0],
      snare:   [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],
      hihat:   [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      openhat: [0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1],
      ride:    [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0],
    },
    bossa: {
      label: 'Bossa',
      kick:    [1,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0],
      snare:   [0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0],
      hihat:   [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0],
      clap:    [0,0,1,0,0,1,0,0,1,0,0,1,0,0,1,0],
      ride:    [1,0,1,0,0,1,0,0,1,0,1,0,0,1,0,0],
    },
    jazz: {
      label: 'Jazz',
      kick:    [1,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0],
      snare:   [0,0,0,0,1,0,0,1,0,0,1,0,0,0,1,0],
      hihat:   [1,0,0,1,0,0,1,0,0,1,0,0,1,0,0,0],
      ride:    [1,0,1,1,0,1,1,0,1,1,0,1,1,0,1,1],
    },
  };

  let currentPreset = 'basic';
  function loadPreset(name) {
    currentPreset = name;
    const p = PRESETS[name] || {};
    SOUNDS.forEach(({ id }) => {
      seq[id] = Array.from({ length: STEPS }, (_, i) => !!(p[id] && p[id][i]));
    });
    renderSeq();
    document.querySelectorAll('.preset-btn').forEach(b => b.classList.toggle('active', b.dataset.preset === name));
  }

  // ── Audio ──
  let actx = null, masterGain = null, noiseBuffer = null;

  function initAudio() {
    if (actx) return;
    actx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = actx.createGain();
    masterGain.gain.value = parseFloat(document.getElementById('vol').value);
    masterGain.connect(actx.destination);
  }

  function resumeCtx() { if (actx && actx.state === 'suspended') actx.resume(); }

  function getNoise() {
    if (noiseBuffer) return noiseBuffer;
    const buf = actx.createBuffer(1, actx.sampleRate * 2, actx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return (noiseBuffer = buf);
  }

  function mkOsc(freq, type, t, dur, g0, g1, f1) {
    const o = actx.createOscillator(), g = actx.createGain();
    o.connect(g); g.connect(masterGain);
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (f1 !== undefined) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(g0, t);
    g.gain.exponentialRampToValueAtTime(Math.max(g1, 1e-4), t + dur);
    o.start(t); o.stop(t + dur + 0.01);
  }

  function mkNoise(fType, fFreq, fQ, t, dur, g0) {
    const src = actx.createBufferSource();
    src.buffer = getNoise();
    src.loop = true;
    const f = actx.createBiquadFilter();
    f.type = fType; f.frequency.value = fFreq;
    if (fQ) f.Q.value = fQ;
    const g = actx.createGain();
    src.connect(f); f.connect(g); g.connect(masterGain);
    g.gain.setValueAtTime(g0, t);
    g.gain.exponentialRampToValueAtTime(1e-4, t + dur);
    src.start(t); src.stop(t + dur + 0.01);
  }

  let compressor = null;
  function getComp() {
    if (compressor) return compressor;
    compressor = actx.createDynamicsCompressor();
    compressor.threshold.value = -18; compressor.knee.value = 6;
    compressor.ratio.value = 4; compressor.attack.value = 0.003; compressor.release.value = 0.15;
    compressor.connect(actx.destination);
    masterGain.disconnect(); masterGain.connect(compressor);
    return compressor;
  }

  const drums = {
    kick(t)    { getComp(); mkOsc(165,'sine',t,0.50,1.3,1e-4,28); mkOsc(1300,'sine',t,0.014,0.55,1e-4); },
    snare(t)   { mkOsc(195,'triangle',t,0.14,0.75,1e-4,75); mkNoise('highpass',750,1.2,t,0.24,1.0); mkNoise('bandpass',3500,0.6,t,0.12,0.4); },
    hihat(t)   { mkNoise('bandpass',9500,0.7,t,0.065,0.55); mkNoise('highpass',13000,1,t,0.04,0.25); },
    openhat(t) { mkNoise('bandpass',8500,0.6,t,0.42,0.48); mkNoise('highpass',12000,1.2,t,0.42,0.22); },
    clap(t)    { for (let i=0;i<3;i++) { mkNoise('bandpass',1050,1.0,t+i*0.013,0.13,0.62); mkNoise('highpass',2500,0.5,t+i*0.013,0.1,0.28); } },
    tomh(t)    { mkOsc(265,'sine',t,0.27,1.0,1e-4,105); mkOsc(800,'sine',t,0.025,0.45,1e-4); },
    toml(t)    { mkOsc(135,'sine',t,0.40,1.1,1e-4,50); mkOsc(400,'sine',t,0.022,0.38,1e-4); },
    ride(t)    { mkNoise('highpass',6500,1,t,0.60,0.3); mkOsc(1650,'triangle',t,0.50,0.22,1e-4); mkOsc(3300,'triangle',t,0.20,0.1,1e-4); },
  };

  // ── Scheduler ──
  const LOOKAHEAD = 25, SCHEDULE_S = 0.1;
  function stepDur() { return 60 / bpm / 4; }
  function swingOffset(s) { return (s % 2 === 1) ? swing : 0; }

  function tick() {
    while (nextNoteTime < actx.currentTime + SCHEDULE_S) {
      SOUNDS.forEach(({ id }) => { if (seq[id][currentStep]) drums[id](nextNoteTime + swingOffset(currentStep)); });
      const step = currentStep;
      const fireIn = (nextNoteTime - actx.currentTime) * 1000;
      setTimeout(() => {
        setPlayhead(step);
        SOUNDS.forEach(({ id }) => { if (seq[id][step]) flashPad(id); });
      }, Math.max(0, fireIn));
      currentStep = (currentStep + 1) % STEPS;
      nextNoteTime += stepDur();
    }
    schedulerTimer = setTimeout(tick, LOOKAHEAD);
  }

  function startPlay() {
    initAudio(); resumeCtx(); isPlaying = true;
    currentStep = 0; nextNoteTime = actx.currentTime + 0.05; tick();
    const btn = document.getElementById('play-btn');
    btn.textContent = '■ Stop'; btn.classList.add('active');
  }
  function stopPlay() {
    isPlaying = false; clearTimeout(schedulerTimer); schedulerTimer = null; setPlayhead(-1);
    const btn = document.getElementById('play-btn');
    btn.textContent = '▶ Play'; btn.classList.remove('active');
  }
  function togglePlay() { isPlaying ? stopPlay() : startPlay(); }

  // ── Pads ──
  function buildPads() {
    const grid = document.getElementById('pads-grid');
    SOUNDS.forEach(({ id, name, key, color, glyph }) => {
      const pad = document.createElement('div');
      pad.className = 'pad'; pad.style.setProperty('--c', color); pad.dataset.id = id;
      pad.innerHTML = \\\`<span class="pad-glyph">\\\${glyph}</span><span class="pad-name">\\\${name}</span><span class="pad-key">\\\${key.toUpperCase()}</span>\\\`;
      const fire = () => { initAudio(); resumeCtx(); drums[id](actx.currentTime); flashPad(id); };
      pad.addEventListener('mousedown', fire);
      pad.addEventListener('touchstart', e => { e.preventDefault(); fire(); }, { passive: false });
      grid.appendChild(pad);
    });
  }

  function flashPad(id) {
    const pad = document.querySelector(\\\`.pad[data-id="\\\${id}"]\\\`);
    if (!pad) return;
    pad.classList.remove('hit'); void pad.offsetWidth; pad.classList.add('hit');
    setTimeout(() => pad.classList.remove('hit'), 160);
  }

  // ── Sequencer ──
  function buildSeq() {
    const container = document.getElementById('seq-inner');
    container.innerHTML = '';
    const hdr = document.createElement('div'); hdr.className = 'seq-heading'; hdr.textContent = '16-Step Sequencer'; container.appendChild(hdr);
    const beatRow = document.createElement('div'); beatRow.className = 'beat-labels';
    for (let g = 0; g < 4; g++) {
      const grp = document.createElement('div'); grp.className = 'beat-grp';
      for (let s = 0; s < 4; s++) { const n = document.createElement('div'); n.className = 'beat-num'; n.textContent = s === 0 ? (g+1) : '·'; grp.appendChild(n); }
      beatRow.appendChild(grp);
    }
    container.appendChild(beatRow);
    SOUNDS.forEach(({ id, name, color }) => {
      const row = document.createElement('div'); row.className = 'seq-row';
      const label = document.createElement('div'); label.className = 'seq-name'; label.style.color = color; label.textContent = name; row.appendChild(label);
      const groups = document.createElement('div'); groups.className = 'seq-groups';
      for (let g = 0; g < 4; g++) {
        const grp = document.createElement('div'); grp.className = 'seq-grp';
        for (let s = 0; s < 4; s++) {
          const i = g*4+s;
          const btn = document.createElement('div');
          btn.className = 'seq-step'; btn.style.setProperty('--c', color);
          btn.dataset.sound = id; btn.dataset.step = i;
          if (seq[id][i]) btn.classList.add('on');
          btn.addEventListener('click', () => { initAudio(); seq[id][i] = !seq[id][i]; btn.classList.toggle('on', seq[id][i]); });
          grp.appendChild(btn);
        }
        groups.appendChild(grp);
      }
      row.appendChild(groups); container.appendChild(row);
    });
  }

  function renderSeq() {
    SOUNDS.forEach(({ id }) => {
      document.querySelectorAll(\\\`.seq-step[data-sound="\\\${id}"]\\\`).forEach((btn, i) => btn.classList.toggle('on', seq[id][i]));
    });
  }

  let lastHead = -1;
  function setPlayhead(step) {
    if (lastHead === step) return;
    document.querySelectorAll('.seq-step.playhead').forEach(el => el.classList.remove('playhead'));
    if (step >= 0) document.querySelectorAll(\\\`.seq-step[data-step="\\\${step}"]\\\`).forEach(el => el.classList.add('playhead'));
    lastHead = step;
  }

  // ── Presets ──
  function buildPresets() {
    const bar = document.getElementById('presets');
    Object.entries(PRESETS).forEach(([key, { label }]) => {
      const btn = document.createElement('button');
      btn.className = 'preset-btn'; btn.textContent = label; btn.dataset.preset = key;
      btn.addEventListener('click', () => loadPreset(key));
      bar.appendChild(btn);
    });
  }

  // ── Keyboard ──
  const keyMap = {};
  SOUNDS.forEach(({ id, key }) => keyMap[key] = id);
  const held = new Set();
  document.addEventListener('keydown', e => {
    if (e.repeat) return;
    const k = e.key.toLowerCase();
    if (k === ' ')         { e.preventDefault(); initAudio(); togglePlay(); return; }
    if (k === 'arrowup')   { e.preventDefault(); changeBpm(+5); return; }
    if (k === 'arrowdown') { e.preventDefault(); changeBpm(-5); return; }
    if (keyMap[k] && !held.has(k)) {
      held.add(k); initAudio(); resumeCtx();
      drums[keyMap[k]](actx.currentTime); flashPad(keyMap[k]);
    }
  });
  document.addEventListener('keyup', e => held.delete(e.key.toLowerCase()));

  // ── BPM & Controls ──
  function changeBpm(d) { bpm = Math.max(40, Math.min(220, bpm + d)); document.getElementById('bpm-val').textContent = bpm; }

  let bpmTimer = null;
  function holdBpm(delta) { bpmTimer = setInterval(() => changeBpm(delta), 75); }
  ['bpm-dn','bpm-up'].forEach(id => {
    const d = id === 'bpm-up' ? +1 : -1;
    const btn = document.getElementById(id);
    btn.addEventListener('click', () => changeBpm(d));
    btn.addEventListener('mousedown', () => holdBpm(d));
    ['mouseup','mouseleave'].forEach(ev => btn.addEventListener(ev, () => clearInterval(bpmTimer)));
  });

  document.getElementById('play-btn').addEventListener('click', () => { initAudio(); togglePlay(); });
  document.getElementById('clear-btn').addEventListener('click', () => {
    SOUNDS.forEach(({ id }) => seq[id].fill(false));
    renderSeq();
    document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
  });
  document.getElementById('vol').addEventListener('input', e => { if (masterGain) masterGain.gain.value = parseFloat(e.target.value); });
  document.getElementById('swing').addEventListener('input', e => {
    swing = parseFloat(e.target.value);
    document.getElementById('swing-val').textContent = Math.round(swing / 0.08 * 100) + '%';
  });

  // ── Boot ──
  buildPresets(); buildPads(); buildSeq(); loadPreset('basic');
  <\/script> </body> </html>`])), renderHead());
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-apr26.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-apr26.astro";
const $$url = "/drum-apr26";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
    __proto__: null,
    default: $$DrumApr26,
    file: $$file,
    url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
