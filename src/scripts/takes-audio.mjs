// TAKES — sound desk. Everything is synthesized in the browser with Web Audio;
// no samples are downloaded. Two rules carry over from the idea that started
// this: alternates ring high, the return to the original lands low.

export const SCALES = {
  pentatonic: { name: 'Major pentatonic', steps: [0, 2, 4, 7, 9] },
  minorPent: { name: 'Minor pentatonic', steps: [0, 3, 5, 7, 10] },
  lydian: { name: 'Lydian', steps: [0, 2, 4, 6, 7, 9, 11] },
  dorian: { name: 'Dorian', steps: [0, 2, 3, 5, 7, 9, 10] },
  insen: { name: 'In-sen', steps: [0, 1, 5, 7, 10] },
  wholeTone: { name: 'Whole tone', steps: [0, 2, 4, 6, 8, 10] },
  harmonicMinor: { name: 'Harmonic minor', steps: [0, 2, 3, 5, 7, 8, 11] },
};

export const VOICES = {
  glass: 'Glass bell',
  marimba: 'Marimba',
  kalimba: 'Kalimba',
  pluck: 'Plucked string',
  fm: 'FM chime',
  chip: '8-bit',
  pad: 'Soft pad',
  water: 'Water drop',
  typewriter: 'Typewriter',
};

export const AMBIENCE = {
  off: 'Silence',
  ocean: 'Ocean at the jetty',
  rain: 'Rain on the window',
  brown: 'Brown noise',
  tape: 'Tape hiss',
  drone: 'Drone in key',
};

export const KEY_SOUNDS = { off: 'Off', tick: 'Soft tick', typewriter: 'Typewriter', notes: 'Notes', drops: 'Rain drops' };

export const ROOTS = ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'];

export const AUDIO_DEFAULTS = {
  enabled: true,
  volume: 0.55,
  voice: 'glass',
  originalVoice: 'same',
  scale: 'pentatonic',
  root: 2,
  octave: 0,
  reverb: 0.35,
  space: 2.4,
  echo: 0.12,
  brightness: 0.7,
  length: 0.6,
  humanize: 0.25,
  spread: 0.5,
  keys: 'off',
  keyVolume: 0.35,
  ambience: 'off',
  ambienceVolume: 0.3,
  actions: true,
};

const mtof = m => 440 * Math.pow(2, (m - 69) / 12);

export class TakesAudio {
  constructor(settings = {}) {
    this.s = { ...AUDIO_DEFAULTS, ...settings };
    this.ctx = null;
    this.ambient = null;
    this.ksCache = new Map();
  }

  get ready() { return !!this.ctx; }

  // Must be called from a user gesture.
  ensure() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return true;
    }
    const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!AC) return false;
    const ctx = new AC();
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.comp = ctx.createDynamicsCompressor();
    this.comp.threshold.value = -14;
    this.comp.ratio.value = 4;
    this.tone = ctx.createBiquadFilter();
    this.tone.type = 'lowpass';
    this.bus = ctx.createGain();
    this.reverb = ctx.createConvolver();
    this.reverbSend = ctx.createGain();
    this.delay = ctx.createDelay(1.5);
    this.delayFb = ctx.createGain();
    this.delaySend = ctx.createGain();
    this.delayFilter = ctx.createBiquadFilter();
    this.delayFilter.type = 'lowpass';
    this.delayFilter.frequency.value = 2400;
    this.ambientBus = ctx.createGain();

    this.bus.connect(this.tone);
    this.tone.connect(this.master);
    this.tone.connect(this.reverbSend);
    this.tone.connect(this.delaySend);
    this.reverbSend.connect(this.reverb);
    this.reverb.connect(this.master);
    this.delaySend.connect(this.delay);
    this.delay.connect(this.delayFilter);
    this.delayFilter.connect(this.delayFb);
    this.delayFb.connect(this.delay);
    this.delayFilter.connect(this.master);
    this.ambientBus.connect(this.master);
    this.master.connect(this.comp);
    this.comp.connect(ctx.destination);
    this.noise = this.makeNoise('white');
    this.brownNoise = this.makeNoise('brown');
    this.apply(this.s, true);
    return true;
  }

  apply(settings, force = false) {
    const prev = this.s;
    this.s = { ...this.s, ...settings };
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const s = this.s;
    this.master.gain.setTargetAtTime(s.enabled ? s.volume : 0, t, 0.03);
    this.tone.frequency.setTargetAtTime(600 + Math.pow(s.brightness, 2) * 15000, t, 0.05);
    this.reverbSend.gain.setTargetAtTime(s.reverb * 1.1, t, 0.05);
    this.delaySend.gain.setTargetAtTime(s.echo, t, 0.05);
    this.delayFb.gain.setTargetAtTime(Math.min(0.75, s.echo * 2.2), t, 0.05);
    this.delay.delayTime.setTargetAtTime(0.18 + s.space * 0.06, t, 0.05);
    if (force || prev.space !== s.space || !this.reverb.buffer) this.reverb.buffer = this.makeImpulse(s.space);
    if (force || prev.ambience !== s.ambience || (s.ambience === 'drone' && (prev.root !== s.root || prev.octave !== s.octave))) this.setAmbience(s.ambience);
    this.ambientBus.gain.setTargetAtTime(s.enabled ? s.ambienceVolume * 0.6 : 0, t, 0.2);
  }

  makeNoise(kind) {
    const ctx = this.ctx;
    const len = ctx.sampleRate * 3;
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c);
      let last = 0;
      for (let i = 0; i < len; i++) {
        const w = Math.random() * 2 - 1;
        if (kind === 'brown') { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; } else d[i] = w;
      }
    }
    return buf;
  }

  makeImpulse(seconds) {
    const ctx = this.ctx;
    const len = Math.max(1, Math.floor(ctx.sampleRate * seconds));
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
    }
    return buf;
  }

  rootMidi() { return 60 + this.s.root + this.s.octave * 12; }

  // index 0 = the original (low), 1.. = alternates (high, climbing the scale)
  takeFreq(index) {
    const steps = (SCALES[this.s.scale] || SCALES.pentatonic).steps;
    if (index <= 0) return mtof(this.rootMidi() - 12);
    const k = index - 1;
    return mtof(this.rootMidi() + 12 + steps[k % steps.length] + 12 * Math.floor(k / steps.length));
  }

  scaleFreq(degree, octave = 0) {
    const steps = (SCALES[this.s.scale] || SCALES.pentatonic).steps;
    const n = ((degree % steps.length) + steps.length) % steps.length;
    return mtof(this.rootMidi() + steps[n] + 12 * (octave + Math.floor(degree / steps.length)));
  }

  out(pan, gain) {
    const ctx = this.ctx;
    const g = ctx.createGain();
    g.gain.value = gain;
    const p = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    if (p) {
      p.pan.value = Math.max(-1, Math.min(1, pan * this.s.spread));
      g.connect(p);
      p.connect(this.bus);
    } else g.connect(this.bus);
    return g;
  }

  env(param, t, peak, attack, decay, floor = 0.0001) {
    param.cancelScheduledValues(t);
    param.setValueAtTime(0.0001, t);
    param.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t + attack);
    param.exponentialRampToValueAtTime(floor, t + attack + decay);
  }

  osc(type, freq, t, stop, dest, detune = 0) {
    const o = this.ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    o.detune.value = detune;
    o.connect(dest);
    o.start(t);
    o.stop(stop);
    return o;
  }

  noiseBurst(t, dur, dest, { type = 'highpass', freq = 2000, q = 0.7, gain = 0.3 } = {}) {
    const src = this.ctx.createBufferSource();
    src.buffer = this.noise;
    const f = this.ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    const g = this.ctx.createGain();
    this.env(g.gain, t, gain, 0.002, dur);
    src.connect(f); f.connect(g); g.connect(dest);
    src.start(t, Math.random() * 2);
    src.stop(t + dur + 0.05);
    return f;
  }

  ksBuffer(freq, seconds) {
    const key = `${Math.round(freq)}:${seconds.toFixed(1)}`;
    if (this.ksCache.has(key)) return this.ksCache.get(key);
    const sr = this.ctx.sampleRate;
    const len = Math.floor(sr * seconds);
    const buf = this.ctx.createBuffer(1, len, sr);
    const d = buf.getChannelData(0);
    const n = Math.max(2, Math.round(sr / freq));
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    for (let i = n; i < len; i++) d[i] = 0.4985 * (d[i - n] + d[i - n - 1 >= 0 ? i - n - 1 : 0]);
    if (this.ksCache.size > 80) this.ksCache.clear();
    this.ksCache.set(key, buf);
    return buf;
  }

  // ---- one note ----
  play(voice, freq, { vel = 0.8, pan = 0, len = this.s.length, at = 0 } = {}) {
    if (!this.ctx || !this.s.enabled) return;
    const h = this.s.humanize;
    const t = this.ctx.currentTime + 0.005 + at + Math.random() * h * 0.012;
    const detune = (Math.random() * 2 - 1) * h * 12;
    const L = 0.12 + len * 1.6;
    const v = vel * (1 - Math.random() * h * 0.25);
    const o = this.out(pan, v * 0.5);
    switch (voice) {
      case 'marimba': {
        const g = this.ctx.createGain(); g.connect(o);
        this.env(g.gain, t, 0.9, 0.003, L * 0.5);
        this.osc('sine', freq, t, t + L, g, detune);
        const g2 = this.ctx.createGain(); g2.connect(o);
        this.env(g2.gain, t, 0.25, 0.002, 0.08);
        this.osc('sine', freq * 4, t, t + 0.2, g2, detune);
        this.noiseBurst(t, 0.015, o, { type: 'bandpass', freq: freq * 3, q: 2, gain: 0.15 });
        break;
      }
      case 'kalimba': {
        const g = this.ctx.createGain(); g.connect(o);
        this.env(g.gain, t, 0.8, 0.002, L * 0.9);
        const a = this.osc('triangle', freq * 1.012, t, t + L, g, detune);
        a.frequency.exponentialRampToValueAtTime(freq, t + 0.05);
        const g2 = this.ctx.createGain(); g2.connect(o);
        this.env(g2.gain, t, 0.12, 0.002, 0.12);
        this.osc('sine', freq * 5.95, t, t + 0.2, g2);
        this.noiseBurst(t, 0.01, o, { freq: 3500, gain: 0.08 });
        break;
      }
      case 'pluck': {
        const src = this.ctx.createBufferSource();
        src.buffer = this.ksBuffer(freq, Math.min(4, L * 1.4));
        src.detune.value = detune;
        const g = this.ctx.createGain(); g.gain.value = 0.9;
        src.connect(g); g.connect(o);
        src.start(t);
        break;
      }
      case 'fm': {
        const g = this.ctx.createGain(); g.connect(o);
        this.env(g.gain, t, 0.7, 0.004, L * 1.2);
        const car = this.osc('sine', freq, t, t + L * 1.3, g, detune);
        const mg = this.ctx.createGain();
        mg.gain.setValueAtTime(freq * 2.2, t);
        mg.gain.exponentialRampToValueAtTime(1, t + L);
        const mod = this.ctx.createOscillator();
        mod.frequency.value = freq * 3.5;
        mod.connect(mg); mg.connect(car.frequency);
        mod.start(t); mod.stop(t + L * 1.3);
        break;
      }
      case 'chip': {
        const g = this.ctx.createGain(); g.connect(o);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(0.28, t + 0.004);
        g.gain.setValueAtTime(0.28, t + 0.05 + len * 0.12);
        g.gain.linearRampToValueAtTime(0.0001, t + 0.07 + len * 0.15);
        const sq = this.osc('square', freq, t, t + 0.12 + len * 0.15, g);
        sq.frequency.setValueAtTime(freq * 2, t + 0.04);
        break;
      }
      case 'pad': {
        const g = this.ctx.createGain();
        const f = this.ctx.createBiquadFilter();
        f.type = 'lowpass'; f.frequency.value = Math.min(4000, freq * 4); f.Q.value = 0.5;
        f.connect(g); g.connect(o);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.4, t + 0.09);
        g.gain.exponentialRampToValueAtTime(0.0001, t + L * 1.8);
        this.osc('sawtooth', freq, t, t + L * 2, f, detune - 8);
        this.osc('sawtooth', freq, t, t + L * 2, f, detune + 8);
        this.osc('sine', freq / 2, t, t + L * 2, f);
        break;
      }
      case 'water': {
        const g = this.ctx.createGain(); g.connect(o);
        this.env(g.gain, t, 0.7, 0.003, 0.18 + len * 0.15);
        const s = this.osc('sine', freq * 0.6, t, t + 0.5, g, detune);
        s.frequency.exponentialRampToValueAtTime(freq * 1.6, t + 0.09);
        break;
      }
      case 'typewriter': {
        this.noiseBurst(t, 0.03, o, { type: 'bandpass', freq: 1800 + freq, q: 1.4, gain: 0.7 });
        const g = this.ctx.createGain(); g.connect(o);
        this.env(g.gain, t, 0.45, 0.002, 0.06);
        this.osc('square', freq / 2, t, t + 0.1, g);
        break;
      }
      default: { // glass
        const parts = [[1, 0.6, 1], [2.76, 0.18, 0.55], [5.4, 0.07, 0.3], [8.93, 0.03, 0.18]];
        for (const [ratio, amp, dec] of parts) {
          const g = this.ctx.createGain(); g.connect(o);
          this.env(g.gain, t, amp, 0.003, L * dec * 1.4);
          this.osc('sine', freq * ratio, t, t + L * 1.6, g, detune);
        }
      }
    }
  }

  // ---- events ----
  take(index, { pan = 0, total = 2 } = {}) {
    if (!this.ensureSilently()) return;
    const original = index === 0;
    const voice = original && this.s.originalVoice !== 'same' ? this.s.originalVoice : this.s.voice;
    this.play(voice, this.takeFreq(index), { vel: original ? 0.95 : 0.7, pan });
    if (original && total > 1) this.play(voice, this.takeFreq(0) * 1.5, { vel: 0.25, pan, at: 0.03 });
  }

  paragraph(index, { pan = 0 } = {}) {
    if (!this.ensureSilently()) return;
    if (index === 0) {
      this.play(this.s.voice, this.takeFreq(0), { vel: 0.9, pan });
      this.play(this.s.voice, this.takeFreq(0) / 2, { vel: 0.5, pan, at: 0.01 });
      return;
    }
    const f = this.takeFreq(index);
    this.play(this.s.voice, f, { vel: 0.6, pan });
    this.play(this.s.voice, f * 1.25, { vel: 0.4, pan, at: 0.05 });
  }

  action(name, { pan = 0 } = {}) {
    if (!this.s.actions || !this.ensureSilently()) return;
    const v = this.s.voice;
    const ctx = this.ctx;
    const t = ctx.currentTime + 0.005;
    if (name === 'create' || name === 'version') {
      [0, 2, 4].forEach((d, i) => this.play(v, this.scaleFreq(d, 1), { vel: 0.4, pan, at: i * 0.06, len: 0.3 }));
    } else if (name === 'commit' || name === 'promote') {
      this.play(v, this.scaleFreq(0, 1), { vel: 0.5, pan, len: 0.4 });
      this.play(v, this.scaleFreq(4, 1), { vel: 0.4, pan, at: 0.09, len: 0.5 });
    } else if (name === 'dim' || name === 'undim') {
      const o = this.out(pan, 0.5);
      const g = ctx.createGain(); g.connect(o);
      this.env(g.gain, t, 0.35, 0.01, 0.35);
      const s = this.osc('sine', name === 'dim' ? 660 : 330, t, t + 0.45, g);
      s.frequency.exponentialRampToValueAtTime(name === 'dim' ? 330 : 660, t + 0.3);
    } else if (name === 'stash' || name === 'unstash') {
      const o = this.out(name === 'stash' ? 0.8 : -0.4, 0.5);
      const f = this.noiseBurst(t, 0.4, o, { type: 'bandpass', freq: 400, q: 3, gain: 0.5 });
      f.frequency.exponentialRampToValueAtTime(name === 'stash' ? 4000 : 300, t + 0.35);
    } else if (name === 'edit') {
      this.play(v, this.scaleFreq(2, 0), { vel: 0.25, pan, len: 0.2 });
    } else if (name === 'error') {
      this.play('chip', this.takeFreq(0) * 0.75, { vel: 0.3, len: 0.1 });
    } else if (name === 'save') {
      [4, 2, 0].forEach((d, i) => this.play(v, this.scaleFreq(d, 1), { vel: 0.3, at: i * 0.05, len: 0.25 }));
    }
  }

  key(ch) {
    if (this.s.keys === 'off' || !this.ctx || !this.s.enabled) return;
    const t = this.ctx.currentTime + 0.002;
    const o = this.out((Math.random() - 0.5) * 0.6, this.s.keyVolume * 0.6);
    const space = ch === ' ' || ch === 'Enter';
    if (this.s.keys === 'tick') {
      this.noiseBurst(t, 0.012, o, { type: 'bandpass', freq: space ? 1200 : 3200, q: 1, gain: 0.4 });
    } else if (this.s.keys === 'typewriter') {
      this.noiseBurst(t, space ? 0.05 : 0.025, o, { type: 'bandpass', freq: space ? 900 : 2200 + Math.random() * 600, q: 1.2, gain: 0.8 });
      if (ch === 'Enter') this.play('glass', 2093, { vel: 0.2, len: 0.4 });
    } else if (this.s.keys === 'notes') {
      const code = (ch || ' ').charCodeAt(0);
      this.play(this.s.voice === 'typewriter' ? 'glass' : this.s.voice, this.scaleFreq(code % 10, 0), { vel: space ? 0.12 : 0.18 * this.s.keyVolume * 2, len: 0.25 });
    } else if (this.s.keys === 'drops') {
      this.play('water', this.scaleFreq(Math.floor(Math.random() * 8), 1), { vel: 0.2 * this.s.keyVolume * 2, len: 0.1 });
    }
  }

  ensureSilently() {
    if (!this.ctx) return false;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.s.enabled;
  }

  // ---- ambience ----
  setAmbience(kind) {
    if (this.ambient) {
      const old = this.ambient;
      const t = this.ctx.currentTime;
      old.gain.gain.setTargetAtTime(0.0001, t, 0.4);
      setTimeout(() => { old.stop(); old.gain.disconnect(); }, 2000);
      this.ambient = null;
    }
    if (!this.ctx || !kind || kind === 'off') return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.setTargetAtTime(1, t, 0.8);
    gain.connect(this.ambientBus);
    const nodes = [];
    const timers = [];
    const loop = buf => {
      const s = ctx.createBufferSource();
      s.buffer = buf; s.loop = true; s.start(t, Math.random() * 2);
      nodes.push(s); return s;
    };
    const filt = (type, freq, q = 0.7) => { const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q; return f; };
    const lfo = (rate, depth, param) => {
      const o = ctx.createOscillator(); o.frequency.value = rate;
      const g = ctx.createGain(); g.gain.value = depth;
      o.connect(g); g.connect(param); o.start(); nodes.push(o);
    };
    if (kind === 'brown') {
      const f = filt('lowpass', 700);
      loop(this.brownNoise).connect(f); f.connect(gain);
    } else if (kind === 'tape') {
      const hp = filt('highpass', 3000); const lp = filt('lowpass', 9000);
      const g = ctx.createGain(); g.gain.value = 0.18;
      loop(this.noise).connect(hp); hp.connect(lp); lp.connect(g); g.connect(gain);
      const hum = ctx.createOscillator(); hum.frequency.value = 60;
      const hg = ctx.createGain(); hg.gain.value = 0.02;
      hum.connect(hg); hg.connect(gain); hum.start(); nodes.push(hum);
    } else if (kind === 'ocean') {
      const f = filt('lowpass', 500);
      const swell = ctx.createGain(); swell.gain.value = 0.55;
      loop(this.brownNoise).connect(f); f.connect(swell); swell.connect(gain);
      lfo(0.075, 0.45, swell.gain);
      lfo(0.075, 380, f.frequency);
      const foam = filt('highpass', 2500); const fg = ctx.createGain(); fg.gain.value = 0.04;
      loop(this.noise).connect(foam); foam.connect(fg); fg.connect(gain);
      lfo(0.075, 0.035, fg.gain);
    } else if (kind === 'rain') {
      const bp = filt('bandpass', 1400, 0.4); const g = ctx.createGain(); g.gain.value = 0.35;
      loop(this.noise).connect(bp); bp.connect(g); g.connect(gain);
      const low = filt('lowpass', 300); const lg = ctx.createGain(); lg.gain.value = 0.5;
      loop(this.brownNoise).connect(low); low.connect(lg); lg.connect(gain);
      const drip = () => {
        if (!this.ambient || this.ambient.kind !== 'rain') return;
        const now = ctx.currentTime;
        const o = ctx.createGain(); o.gain.value = 0.05 + Math.random() * 0.06; o.connect(gain);
        const s = ctx.createOscillator(); s.type = 'sine';
        const f0 = 1500 + Math.random() * 2500;
        s.frequency.setValueAtTime(f0, now); s.frequency.exponentialRampToValueAtTime(f0 * 1.7, now + 0.03);
        const e = ctx.createGain(); this.env(e.gain, now, 0.6, 0.001, 0.04);
        s.connect(e); e.connect(o); s.start(now); s.stop(now + 0.08);
        timers.push(setTimeout(drip, 60 + Math.random() * 380));
      };
      timers.push(setTimeout(drip, 300));
    } else if (kind === 'drone') {
      const f = filt('lowpass', 420, 1.2);
      const g = ctx.createGain(); g.gain.value = 0.14;
      f.connect(g); g.connect(gain);
      const r = this.rootMidi() - 24;
      [[r, -6], [r, 6], [r + 7, 0], [r + 12, 3]].forEach(([m, d]) => {
        const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = mtof(m); o.detune.value = d;
        o.connect(f); o.start(); nodes.push(o);
      });
      lfo(0.05, 160, f.frequency);
    }
    this.ambient = {
      kind, gain,
      stop: () => { timers.forEach(clearTimeout); nodes.forEach(n => { try { n.stop(); } catch {} }); },
    };
  }

  audition() {
    if (!this.ensure()) return;
    [1, 2, 3, 0].forEach((i, k) => setTimeout(() => this.take(i, { pan: (k - 1.5) / 2 }), k * 260));
  }
}
