import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { a as renderTemplate, r as renderComponent, m as maybeRenderHead } from './prerender_CmTjnOuJ.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { $ as $$DrumNav } from './DrumNav_D5cUUl3f.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(raw || cooked.slice()) }));
var _a;
const $$DrumJam = createComponent(async ($$result, $$props, $$slots) => {
  const title = "/drum-jam — emergent jam mode";
  const description = "When 3 or more visitors are in the room, /drum-jam auto-assigns parts and the room jams. Kick, snare, hat, bass, lead, hand-percussion — your part is yours, your tap amplifies it. Drum hub multiplayer.";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": "https://pointcast.xyz/drum-jam",
    name: "PointCast Drum · Jam",
    url: "https://pointcast.xyz/drum-jam",
    description
  };
  return renderTemplate(_a || (_a = __template(["", ` <script>
  (function () {
    'use strict';
    const PARTS = ['kick', 'snare', 'hat', 'bass', 'lead', 'shaker'];
    const PROGRESSION = [
      // [chord-name, root-hz]
      ['Am',  220.00],
      ['F',   174.61],
      ['C',   261.63],
      ['G',   196.00],
      ['Am',  220.00],
      ['F',   174.61],
      ['C',   261.63],
      ['E',   164.81],
    ];
    // Pattern per part (16 steps per bar)
    const PATTERNS = {
      kick:   [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,1,0],
      snare:  [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,1],
      hat:    [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,1],
      bass:   [1,0,0,0, 0,0,1,0, 1,0,0,0, 0,0,1,0],
      lead:   [0,0,1,0, 0,0,0,0, 0,0,1,0, 0,0,1,0],
      shaker: [1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1],
    };

    function getSession() {
      try {
        const k = 'pc:session';
        let s = localStorage.getItem(k);
        if (!s) { s = Math.random().toString(36).slice(2) + Date.now().toString(36); localStorage.setItem(k, s); }
        return s;
      } catch { return 'jm-' + Math.random().toString(36).slice(2, 10); }
    }
    function hash32(str) {
      let h = 5381;
      for (let i = 0; i < str.length; i++) h = (h * 33 + str.charCodeAt(i)) & 0x7fffffff;
      return h;
    }

    const session = getSession();
    const myPart = PARTS[hash32('part:' + session) % PARTS.length];

    document.getElementById('jm-part').textContent = myPart.toUpperCase();
    document.getElementById('jm-pattern').textContent = PATTERNS[myPart].join(' · ');

    let ctx = null;
    let masterGain = null;
    let lpf = null;
    let bpm = 104;
    let stepDur = 0;
    let nextTickAt = 0;
    let stepIndex = 0; // 0..15 within bar
    let barIndex = 0;  // 0..7
    let timer = null;
    let jamming = false;
    let myAmp = 0.45;
    let amplifyUntil = 0;

    function ensureCtx() {
      if (ctx) return;
      const AC = window.AudioContext || window.webkitAudioContext;
      ctx = new AC();
      lpf = ctx.createBiquadFilter();
      lpf.type = 'lowpass';
      lpf.frequency.value = 6000;
      lpf.Q.value = 0.7;
      masterGain = ctx.createGain();
      masterGain.gain.value = 0.55;
      lpf.connect(masterGain);
      masterGain.connect(ctx.destination);
    }

    function recomputeStepDur() { stepDur = 60 / bpm / 4; }
    recomputeStepDur();

    // Synth recipes — same family as /drum-radio + /drum-daily
    function kick(t, amp) {
      const o = ctx.createOscillator(); o.type = 'sine';
      const g = ctx.createGain();
      o.frequency.setValueAtTime(140, t);
      o.frequency.exponentialRampToValueAtTime(50, t + 0.18);
      g.gain.setValueAtTime(0.001, t);
      g.gain.exponentialRampToValueAtTime(0.5 * amp, t + 0.005);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      o.connect(g); g.connect(lpf); o.start(t); o.stop(t + 0.25);
    }
    function snare(t, amp) {
      const buf = ctx.createBuffer(1, ctx.sampleRate * 0.18, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 2);
      const n = ctx.createBufferSource(); n.buffer = buf;
      const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 1500;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.001, t);
      g.gain.exponentialRampToValueAtTime(0.4 * amp, t + 0.005);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      n.connect(f); f.connect(g); g.connect(lpf); n.start(t);
    }
    function hat(t, amp) {
      const buf = ctx.createBuffer(1, ctx.sampleRate * 0.05, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 4);
      const n = ctx.createBufferSource(); n.buffer = buf;
      const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 6500;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.001, t);
      g.gain.exponentialRampToValueAtTime(0.18 * amp, t + 0.002);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
      n.connect(f); f.connect(g); g.connect(lpf); n.start(t);
    }
    function bass(t, hz, amp) {
      const o = ctx.createOscillator(); o.type = 'triangle';
      o.frequency.value = hz / 2;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.001, t);
      g.gain.linearRampToValueAtTime(0.32 * amp, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.32);
      o.connect(g); g.connect(lpf); o.start(t); o.stop(t + 0.34);
    }
    function lead(t, hz, amp) {
      [1, 1.498, 2].forEach((mul, i) => {
        const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = hz * mul;
        const g = ctx.createGain();
        const peak = [0.18, 0.10, 0.06][i] * amp;
        g.gain.setValueAtTime(0.001, t);
        g.gain.linearRampToValueAtTime(peak, t + 0.01);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
        o.connect(g); g.connect(lpf); o.start(t); o.stop(t + 0.62);
      });
    }
    function shaker(t, amp) {
      const buf = ctx.createBuffer(1, ctx.sampleRate * 0.04, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 6);
      const n = ctx.createBufferSource(); n.buffer = buf;
      const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 4000;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.001, t);
      g.gain.exponentialRampToValueAtTime(0.10 * amp, t + 0.002);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
      n.connect(f); f.connect(g); g.connect(lpf); n.start(t);
    }
    function partFire(part, t, hz, amp) {
      if (part === 'kick')   kick(t, amp);
      if (part === 'snare')  snare(t, amp);
      if (part === 'hat')    hat(t, amp);
      if (part === 'bass')   bass(t, hz, amp);
      if (part === 'lead')   lead(t, hz, amp);
      if (part === 'shaker') shaker(t, amp);
    }

    let presentParts = new Set([myPart]);
    function tick() {
      if (!jamming) return;
      const now = ctx.currentTime;
      while (nextTickAt < now + 0.1) {
        const chord = PROGRESSION[barIndex % PROGRESSION.length];
        for (const part of presentParts) {
          if (PATTERNS[part][stepIndex]) {
            // Use my amplified amp only for my part
            const amp = part === myPart && Date.now() < amplifyUntil ? 1.0 : 0.55;
            partFire(part, nextTickAt, chord[1], amp);
          }
        }
        const idxLocal = stepIndex;
        const barLocal = barIndex;
        const chordName = chord[0];
        setTimeout(() => {
          document.getElementById('jm-bars').textContent = \`\${barLocal + 1}\`;
          document.getElementById('jm-chord').textContent = chordName;
        }, Math.max(0, (nextTickAt - now) * 1000));
        nextTickAt += stepDur;
        stepIndex += 1;
        if (stepIndex >= 16) { stepIndex = 0; barIndex = (barIndex + 1) % 8; }
      }
      timer = setTimeout(tick, 25);
    }

    function startJam(parts) {
      ensureCtx();
      jamming = true;
      presentParts = new Set(parts);
      stepIndex = 0; barIndex = 0;
      nextTickAt = ctx.currentTime + 0.05;
      tick();
      const sign = document.getElementById('jm-sign');
      sign.textContent = '— JAM ON —';
      sign.dataset.state = 'on';
    }
    function stopJam() {
      jamming = false;
      if (timer) { clearTimeout(timer); timer = null; }
      // Solo grace: keep your part going for a few ticks
      presentParts = new Set([myPart]);
      const sign = document.getElementById('jm-sign');
      sign.textContent = '— SOLO MODE —';
      sign.dataset.state = 'solo';
      ensureCtx();
      let i = 0;
      const soloTimer = setInterval(() => {
        if (jamming) { clearInterval(soloTimer); return; }
        if (i++ > 60) { clearInterval(soloTimer); sign.textContent = '— WAITING —'; sign.dataset.state = ''; return; }
        const t = ctx.currentTime;
        const chord = PROGRESSION[Math.floor(i / 16) % PROGRESSION.length];
        if (PATTERNS[myPart][i % 16]) partFire(myPart, t + 0.02, chord[1], 0.45);
      }, stepDur * 1000);
    }

    function tap() {
      amplifyUntil = Date.now() + 1500;
      try {
        fetch('/api/sounds', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'jam', sessionId: session, part: myPart, action: 'amplify' }),
        });
        const el = document.getElementById('jm-broadcast');
        if (el) el.textContent = \`amplified · \${myPart}\`;
      } catch {}
      const tapBtn = document.getElementById('jm-tap');
      tapBtn.classList.remove('jm__tap--bump');
      void tapBtn.offsetWidth;
      tapBtn.classList.add('jm__tap--bump');
    }

    document.getElementById('jm-tap').addEventListener('click', tap);
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && !e.repeat && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        tap();
      }
    });
    document.getElementById('jm-tempo').addEventListener('input', (e) => {
      bpm = Number(e.target.value || 104);
      recomputeStepDur();
      document.getElementById('jm-bpm').textContent = \`\${bpm} BPM\`;
    });

    function isHumanEntry(p) {
      const t = (p && p.type) || '';
      return p && typeof p.nounId === 'number' && !t.startsWith('bot:');
    }
    async function selfRegister() {
      // Make this visitor present in /api/visit so jam mode actually
      // sees a roster. Idempotent (IP-throttled server-side).
      try {
        let nounId = 0;
        try {
          const stored = localStorage.getItem('pc:nounId');
          const n = stored ? Number(stored) : NaN;
          nounId = Number.isFinite(n) ? n : (hash32(session) % 1200);
        } catch { nounId = hash32(session) % 1200; }
        try { localStorage.setItem('pc:nounId', String(nounId)); } catch {}
        await fetch('/api/visit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nounId, note: 'drum-jam' }),
        });
      } catch {}
    }
    selfRegister();

    async function pollVisit() {
      try {
        const r = await fetch('/api/visit', { cache: 'no-store' });
        if (!r.ok) return;
        const data = await r.json();
        const present = (Array.isArray(data.present) ? data.present : []).filter(isHumanEntry);
        // Always include self
        const selfPid = (await sha256(session)).slice(0, 10);
        if (!present.find((p) => p.pid === selfPid)) {
          present.push({ pid: selfPid, nounId: hash32(session) % 1200, type: 'human', city: 'you', country: '' });
        }
        // Render roster
        const roster = document.getElementById('jm-roster');
        roster.innerHTML = '';
        if (present.length === 0) {
          roster.innerHTML = '<li class="jm__roster-empty mono">just you in the room · jam needs 3+</li>';
        } else {
          present.slice(0, 12).forEach((p) => {
            const part = PARTS[hash32('part:' + (p.pid || '')) % PARTS.length];
            const li = document.createElement('li');
            li.className = 'jm__roster-row' + (p.pid === selfPid ? ' jm__roster-row--me' : '');
            li.innerHTML = \`
              <img src="https://noun.pics/\${p.nounId}.svg" alt="" width="20" height="20" loading="lazy" />
              <span class="jm__roster-noun mono">noun #\${p.nounId}</span>
              <span class="jm__roster-part mono" data-part="\${part}">\${part.toUpperCase()}</span>
            \`;
            roster.appendChild(li);
          });
        }
        document.getElementById('jm-humans').textContent = String(present.length);
        const allParts = new Set(present.map((p) => PARTS[hash32('part:' + (p.pid || '')) % PARTS.length]));
        if (present.length >= 3) {
          if (!jamming) startJam(allParts);
          else { presentParts = allParts; }
        } else {
          if (jamming) stopJam();
        }
      } catch {}
    }

    // tiny sha256 polyfill (sync isn't possible in browser; use SubtleCrypto async)
    async function sha256(s) {
      const enc = new TextEncoder().encode(s);
      const hash = await crypto.subtle.digest('SHA-256', enc);
      return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('');
    }

    pollVisit();
    setInterval(pollVisit, 5000);
  })();
<\/script>`], ["", ` <script>
  (function () {
    'use strict';
    const PARTS = ['kick', 'snare', 'hat', 'bass', 'lead', 'shaker'];
    const PROGRESSION = [
      // [chord-name, root-hz]
      ['Am',  220.00],
      ['F',   174.61],
      ['C',   261.63],
      ['G',   196.00],
      ['Am',  220.00],
      ['F',   174.61],
      ['C',   261.63],
      ['E',   164.81],
    ];
    // Pattern per part (16 steps per bar)
    const PATTERNS = {
      kick:   [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,1,0],
      snare:  [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,1],
      hat:    [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,1],
      bass:   [1,0,0,0, 0,0,1,0, 1,0,0,0, 0,0,1,0],
      lead:   [0,0,1,0, 0,0,0,0, 0,0,1,0, 0,0,1,0],
      shaker: [1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1],
    };

    function getSession() {
      try {
        const k = 'pc:session';
        let s = localStorage.getItem(k);
        if (!s) { s = Math.random().toString(36).slice(2) + Date.now().toString(36); localStorage.setItem(k, s); }
        return s;
      } catch { return 'jm-' + Math.random().toString(36).slice(2, 10); }
    }
    function hash32(str) {
      let h = 5381;
      for (let i = 0; i < str.length; i++) h = (h * 33 + str.charCodeAt(i)) & 0x7fffffff;
      return h;
    }

    const session = getSession();
    const myPart = PARTS[hash32('part:' + session) % PARTS.length];

    document.getElementById('jm-part').textContent = myPart.toUpperCase();
    document.getElementById('jm-pattern').textContent = PATTERNS[myPart].join(' · ');

    let ctx = null;
    let masterGain = null;
    let lpf = null;
    let bpm = 104;
    let stepDur = 0;
    let nextTickAt = 0;
    let stepIndex = 0; // 0..15 within bar
    let barIndex = 0;  // 0..7
    let timer = null;
    let jamming = false;
    let myAmp = 0.45;
    let amplifyUntil = 0;

    function ensureCtx() {
      if (ctx) return;
      const AC = window.AudioContext || window.webkitAudioContext;
      ctx = new AC();
      lpf = ctx.createBiquadFilter();
      lpf.type = 'lowpass';
      lpf.frequency.value = 6000;
      lpf.Q.value = 0.7;
      masterGain = ctx.createGain();
      masterGain.gain.value = 0.55;
      lpf.connect(masterGain);
      masterGain.connect(ctx.destination);
    }

    function recomputeStepDur() { stepDur = 60 / bpm / 4; }
    recomputeStepDur();

    // Synth recipes — same family as /drum-radio + /drum-daily
    function kick(t, amp) {
      const o = ctx.createOscillator(); o.type = 'sine';
      const g = ctx.createGain();
      o.frequency.setValueAtTime(140, t);
      o.frequency.exponentialRampToValueAtTime(50, t + 0.18);
      g.gain.setValueAtTime(0.001, t);
      g.gain.exponentialRampToValueAtTime(0.5 * amp, t + 0.005);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      o.connect(g); g.connect(lpf); o.start(t); o.stop(t + 0.25);
    }
    function snare(t, amp) {
      const buf = ctx.createBuffer(1, ctx.sampleRate * 0.18, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 2);
      const n = ctx.createBufferSource(); n.buffer = buf;
      const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 1500;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.001, t);
      g.gain.exponentialRampToValueAtTime(0.4 * amp, t + 0.005);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      n.connect(f); f.connect(g); g.connect(lpf); n.start(t);
    }
    function hat(t, amp) {
      const buf = ctx.createBuffer(1, ctx.sampleRate * 0.05, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 4);
      const n = ctx.createBufferSource(); n.buffer = buf;
      const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 6500;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.001, t);
      g.gain.exponentialRampToValueAtTime(0.18 * amp, t + 0.002);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
      n.connect(f); f.connect(g); g.connect(lpf); n.start(t);
    }
    function bass(t, hz, amp) {
      const o = ctx.createOscillator(); o.type = 'triangle';
      o.frequency.value = hz / 2;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.001, t);
      g.gain.linearRampToValueAtTime(0.32 * amp, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.32);
      o.connect(g); g.connect(lpf); o.start(t); o.stop(t + 0.34);
    }
    function lead(t, hz, amp) {
      [1, 1.498, 2].forEach((mul, i) => {
        const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = hz * mul;
        const g = ctx.createGain();
        const peak = [0.18, 0.10, 0.06][i] * amp;
        g.gain.setValueAtTime(0.001, t);
        g.gain.linearRampToValueAtTime(peak, t + 0.01);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
        o.connect(g); g.connect(lpf); o.start(t); o.stop(t + 0.62);
      });
    }
    function shaker(t, amp) {
      const buf = ctx.createBuffer(1, ctx.sampleRate * 0.04, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 6);
      const n = ctx.createBufferSource(); n.buffer = buf;
      const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 4000;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.001, t);
      g.gain.exponentialRampToValueAtTime(0.10 * amp, t + 0.002);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
      n.connect(f); f.connect(g); g.connect(lpf); n.start(t);
    }
    function partFire(part, t, hz, amp) {
      if (part === 'kick')   kick(t, amp);
      if (part === 'snare')  snare(t, amp);
      if (part === 'hat')    hat(t, amp);
      if (part === 'bass')   bass(t, hz, amp);
      if (part === 'lead')   lead(t, hz, amp);
      if (part === 'shaker') shaker(t, amp);
    }

    let presentParts = new Set([myPart]);
    function tick() {
      if (!jamming) return;
      const now = ctx.currentTime;
      while (nextTickAt < now + 0.1) {
        const chord = PROGRESSION[barIndex % PROGRESSION.length];
        for (const part of presentParts) {
          if (PATTERNS[part][stepIndex]) {
            // Use my amplified amp only for my part
            const amp = part === myPart && Date.now() < amplifyUntil ? 1.0 : 0.55;
            partFire(part, nextTickAt, chord[1], amp);
          }
        }
        const idxLocal = stepIndex;
        const barLocal = barIndex;
        const chordName = chord[0];
        setTimeout(() => {
          document.getElementById('jm-bars').textContent = \\\`\\\${barLocal + 1}\\\`;
          document.getElementById('jm-chord').textContent = chordName;
        }, Math.max(0, (nextTickAt - now) * 1000));
        nextTickAt += stepDur;
        stepIndex += 1;
        if (stepIndex >= 16) { stepIndex = 0; barIndex = (barIndex + 1) % 8; }
      }
      timer = setTimeout(tick, 25);
    }

    function startJam(parts) {
      ensureCtx();
      jamming = true;
      presentParts = new Set(parts);
      stepIndex = 0; barIndex = 0;
      nextTickAt = ctx.currentTime + 0.05;
      tick();
      const sign = document.getElementById('jm-sign');
      sign.textContent = '— JAM ON —';
      sign.dataset.state = 'on';
    }
    function stopJam() {
      jamming = false;
      if (timer) { clearTimeout(timer); timer = null; }
      // Solo grace: keep your part going for a few ticks
      presentParts = new Set([myPart]);
      const sign = document.getElementById('jm-sign');
      sign.textContent = '— SOLO MODE —';
      sign.dataset.state = 'solo';
      ensureCtx();
      let i = 0;
      const soloTimer = setInterval(() => {
        if (jamming) { clearInterval(soloTimer); return; }
        if (i++ > 60) { clearInterval(soloTimer); sign.textContent = '— WAITING —'; sign.dataset.state = ''; return; }
        const t = ctx.currentTime;
        const chord = PROGRESSION[Math.floor(i / 16) % PROGRESSION.length];
        if (PATTERNS[myPart][i % 16]) partFire(myPart, t + 0.02, chord[1], 0.45);
      }, stepDur * 1000);
    }

    function tap() {
      amplifyUntil = Date.now() + 1500;
      try {
        fetch('/api/sounds', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'jam', sessionId: session, part: myPart, action: 'amplify' }),
        });
        const el = document.getElementById('jm-broadcast');
        if (el) el.textContent = \\\`amplified · \\\${myPart}\\\`;
      } catch {}
      const tapBtn = document.getElementById('jm-tap');
      tapBtn.classList.remove('jm__tap--bump');
      void tapBtn.offsetWidth;
      tapBtn.classList.add('jm__tap--bump');
    }

    document.getElementById('jm-tap').addEventListener('click', tap);
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && !e.repeat && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        tap();
      }
    });
    document.getElementById('jm-tempo').addEventListener('input', (e) => {
      bpm = Number(e.target.value || 104);
      recomputeStepDur();
      document.getElementById('jm-bpm').textContent = \\\`\\\${bpm} BPM\\\`;
    });

    function isHumanEntry(p) {
      const t = (p && p.type) || '';
      return p && typeof p.nounId === 'number' && !t.startsWith('bot:');
    }
    async function selfRegister() {
      // Make this visitor present in /api/visit so jam mode actually
      // sees a roster. Idempotent (IP-throttled server-side).
      try {
        let nounId = 0;
        try {
          const stored = localStorage.getItem('pc:nounId');
          const n = stored ? Number(stored) : NaN;
          nounId = Number.isFinite(n) ? n : (hash32(session) % 1200);
        } catch { nounId = hash32(session) % 1200; }
        try { localStorage.setItem('pc:nounId', String(nounId)); } catch {}
        await fetch('/api/visit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nounId, note: 'drum-jam' }),
        });
      } catch {}
    }
    selfRegister();

    async function pollVisit() {
      try {
        const r = await fetch('/api/visit', { cache: 'no-store' });
        if (!r.ok) return;
        const data = await r.json();
        const present = (Array.isArray(data.present) ? data.present : []).filter(isHumanEntry);
        // Always include self
        const selfPid = (await sha256(session)).slice(0, 10);
        if (!present.find((p) => p.pid === selfPid)) {
          present.push({ pid: selfPid, nounId: hash32(session) % 1200, type: 'human', city: 'you', country: '' });
        }
        // Render roster
        const roster = document.getElementById('jm-roster');
        roster.innerHTML = '';
        if (present.length === 0) {
          roster.innerHTML = '<li class="jm__roster-empty mono">just you in the room · jam needs 3+</li>';
        } else {
          present.slice(0, 12).forEach((p) => {
            const part = PARTS[hash32('part:' + (p.pid || '')) % PARTS.length];
            const li = document.createElement('li');
            li.className = 'jm__roster-row' + (p.pid === selfPid ? ' jm__roster-row--me' : '');
            li.innerHTML = \\\`
              <img src="https://noun.pics/\\\${p.nounId}.svg" alt="" width="20" height="20" loading="lazy" />
              <span class="jm__roster-noun mono">noun #\\\${p.nounId}</span>
              <span class="jm__roster-part mono" data-part="\\\${part}">\\\${part.toUpperCase()}</span>
            \\\`;
            roster.appendChild(li);
          });
        }
        document.getElementById('jm-humans').textContent = String(present.length);
        const allParts = new Set(present.map((p) => PARTS[hash32('part:' + (p.pid || '')) % PARTS.length]));
        if (present.length >= 3) {
          if (!jamming) startJam(allParts);
          else { presentParts = allParts; }
        } else {
          if (jamming) stopJam();
        }
      } catch {}
    }

    // tiny sha256 polyfill (sync isn't possible in browser; use SubtleCrypto async)
    async function sha256(s) {
      const enc = new TextEncoder().encode(s);
      const hash = await crypto.subtle.digest('SHA-256', enc);
      return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('');
    }

    pollVisit();
    setInterval(pollVisit, 5000);
  })();
<\/script>`])), renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "jsonLd": jsonLd, "data-astro-cid-oiezavxq": true }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="jm" id="jm-main" data-astro-cid-oiezavxq> ${renderComponent($$result2, "DrumNav", $$DrumNav, { "current": "jam", "data-astro-cid-oiezavxq": true })} <header class="jm__head" data-astro-cid-oiezavxq> <p class="jm__kicker" data-astro-cid-oiezavxq>DRUM HUB · JAM · EMERGENT · MULTIPLAYER</p> <h1 class="jm__title" data-astro-cid-oiezavxq><em data-astro-cid-oiezavxq>The room jams when enough of us show up.</em></h1> <p class="jm__dek" data-astro-cid-oiezavxq>
Three visitors and the room enters JAM MODE — everyone gets a part by stable hash of their session id, and the room locks to an 8-bar progression. Tap your part louder. Your part stays yours.
</p> </header> <section class="jm__stage" data-astro-cid-oiezavxq> <div class="jm__sign" data-astro-cid-oiezavxq> <span class="jm__sign-bulb" aria-hidden="true" data-astro-cid-oiezavxq></span> <span class="jm__sign-text mono" id="jm-sign" data-astro-cid-oiezavxq>— WAITING —</span> </div> <div class="jm__panel" data-astro-cid-oiezavxq> <div class="jm__counts" data-astro-cid-oiezavxq> <div class="jm__count-row" data-astro-cid-oiezavxq> <span class="jm__count-num" id="jm-humans" data-astro-cid-oiezavxq>—</span> <span class="jm__count-label mono" data-astro-cid-oiezavxq>in the room</span> </div> <div class="jm__count-row" data-astro-cid-oiezavxq> <span class="jm__count-num" id="jm-bars" data-astro-cid-oiezavxq>—</span> <span class="jm__count-label mono" data-astro-cid-oiezavxq>bar / 8</span> </div> <div class="jm__count-row" data-astro-cid-oiezavxq> <span class="jm__count-num" id="jm-chord" data-astro-cid-oiezavxq>—</span> <span class="jm__count-label mono" data-astro-cid-oiezavxq>chord</span> </div> </div> <div class="jm__your-part" data-astro-cid-oiezavxq> <p class="jm__your-eyebrow mono" data-astro-cid-oiezavxq>your part</p> <p class="jm__your-name" id="jm-part" data-astro-cid-oiezavxq>—</p> <p class="jm__your-pattern mono" id="jm-pattern" data-astro-cid-oiezavxq>— · — · — · — · — · — · — · —</p> </div> <button type="button" class="jm__tap" id="jm-tap" data-astro-cid-oiezavxq> <span class="jm__tap-glyph" data-astro-cid-oiezavxq>●</span> <span class="jm__tap-label mono" data-astro-cid-oiezavxq>tap to amplify · or press space</span> </button> <div class="jm__panel-row" data-astro-cid-oiezavxq> <span class="jm__panel-label mono" data-astro-cid-oiezavxq>tempo</span> <input id="jm-tempo" type="range" min="80" max="140" value="104" data-astro-cid-oiezavxq> <span class="jm__panel-val mono" id="jm-bpm" data-astro-cid-oiezavxq>104 BPM</span> </div> <p class="jm__broadcast mono" id="jm-broadcast" data-astro-cid-oiezavxq>— off —</p> </div> <ul class="jm__roster" id="jm-roster" role="list" data-astro-cid-oiezavxq> <li class="jm__roster-empty mono" data-astro-cid-oiezavxq>just you in the room · jam needs 3+</li> </ul> </section> <footer class="jm__foot" data-astro-cid-oiezavxq> <p data-astro-cid-oiezavxq>
Jam mode reads <code data-astro-cid-oiezavxq>/api/visit</code> for the present roster + your
        own session, hashes pid → 1 of 6 parts (kick / snare / hat / bass /
        lead / shaker), and locks every part's pattern + pitch to the same
        rotating 8-bar progression. Tap to bump your part's amplitude for
        2 bars. Your part stays yours; rejoin tomorrow with the same pid
        and you'll get the same part.
</p> <p class="jm__credit mono" data-astro-cid-oiezavxq>v0.1 · 2026-04-28 · Mike Hoydich + Claude Code · El Segundo · sprint 2/4 (batch 2)</p> </footer> </main> ` }));
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-jam.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-jam.astro";
const $$url = "/drum-jam";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$DrumJam,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
