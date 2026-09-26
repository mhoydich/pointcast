/*!
 * KeyVoice — how writing sounds on PointCast's Key Diary and Key Letter.
 *
 * Vowels land on the chord (stable, singable), consonants walk the scale
 * between them, spaces rest, and punctuation cadences: "." settles on the
 * tonic, "?" lifts to the fifth, "!" leaps an octave, a new line drops a bass
 * note. Each mood is a mode + register + voice.
 *
 *   KeyVoice.moods                         [{ id, label, ... }]
 *   KeyVoice.noteFor(char, moodId, prev)   → MIDI number or null (rest)
 *   KeyVoice.play(midi, moodId, when?)     → sound it
 *   KeyVoice.ctx()                         → the shared AudioContext
 */
(function () {
  'use strict';
  if (window.KeyVoice) return;

  var MOODS = [
    { id: 'bright', label: 'Bright', emoji: '☀', root: 60, scale: [0, 2, 4, 7, 9], chord: [0, 4, 7], voice: 'bell', color: '#dfc48d' },
    { id: 'marine', label: 'Marine layer', emoji: '☁', root: 55, scale: [0, 2, 3, 5, 7, 9, 10], chord: [0, 3, 7], voice: 'felt', color: '#9dbbbb' },
    { id: 'tender', label: 'Tender', emoji: '♡', root: 60, scale: [0, 2, 4, 6, 7, 9, 11], chord: [0, 4, 7, 11], voice: 'glass', color: '#e7b7a9' },
    { id: 'blue', label: 'Blue', emoji: '☂', root: 57, scale: [0, 3, 5, 6, 7, 10], chord: [0, 3, 7], voice: 'felt', color: '#8fa7e0' },
    { id: 'restless', label: 'Restless', emoji: '⚡', root: 62, scale: [0, 2, 3, 7, 8], chord: [0, 3, 7], voice: 'pluck', color: '#e79a7e' },
    { id: 'grateful', label: 'Grateful', emoji: '✳', root: 58, scale: [0, 2, 4, 5, 7, 9, 11], chord: [0, 4, 7, 9], voice: 'bell', color: '#b3c8a4' },
  ];
  var byId = {};
  MOODS.forEach(function (m) { byId[m.id] = m; });

  var VOWELS = 'aeiouy';

  function mood(id) { return byId[id] || MOODS[0]; }

  /** Nearest scale tone at or above `target` semitones from the root. */
  function snap(m, semis) {
    var oct = Math.floor(semis / 12);
    var within = ((semis % 12) + 12) % 12;
    for (var i = 0; i < m.scale.length; i++) if (m.scale[i] >= within) return m.root + oct * 12 + m.scale[i];
    return m.root + (oct + 1) * 12 + m.scale[0];
  }

  function noteFor(ch, moodId, prev) {
    var m = mood(moodId);
    if (!ch) return null;
    if (ch === '\n') return m.root - 12;
    if (ch === '.') return m.root;
    if (ch === '?') return m.root + 7;
    if (ch === '!') return (prev || m.root) + 12 > m.root + 24 ? m.root + 12 : (prev || m.root) + 12;
    if (ch === ',' || ch === ';' || ch === ':') return m.root + m.chord[1];
    var c = ch.toLowerCase();
    var code = c.charCodeAt(0);
    if (VOWELS.indexOf(c) >= 0) {
      var v = VOWELS.indexOf(c);
      return m.root + 12 * (v >= 3 ? 1 : 0) + m.chord[v % m.chord.length];
    }
    if (code >= 97 && code <= 122) {
      // Consonants step through the mode: a–z spread over ~1.5 octaves.
      var idx = (code - 97) % 21;
      var deg = Math.floor(idx * m.scale.length * 1.5 / 21);
      return m.root + Math.floor(deg / m.scale.length) * 12 + m.scale[deg % m.scale.length];
    }
    if (code >= 48 && code <= 57) return snap(m, (code - 48) * 2 - 12);
    return null; // spaces and everything else rest
  }

  var ac = null, bus = null, verb = null;
  function ctx() {
    if (!ac) {
      ac = new (window.AudioContext || window.webkitAudioContext)();
      bus = ac.createGain();
      bus.gain.value = 0.55;
      var comp = ac.createDynamicsCompressor();
      comp.threshold.value = -18;
      bus.connect(comp).connect(ac.destination);
      verb = ac.createConvolver();
      var len = Math.floor(ac.sampleRate * 2.6);
      var ir = ac.createBuffer(2, len, ac.sampleRate);
      for (var ch = 0; ch < 2; ch++) {
        var d = ir.getChannelData(ch);
        for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
      }
      verb.buffer = ir;
      var wet = ac.createGain();
      wet.gain.value = 0.28;
      verb.connect(wet).connect(bus);
    }
    if (ac.state === 'suspended') ac.resume();
    return ac;
  }

  var VOICES = {
    bell: { parts: [[1, 'sine', 0.2], [2.01, 'sine', 0.06], [3.99, 'sine', 0.02]], attack: 0.006, len: 1.6 },
    felt: { parts: [[1, 'triangle', 0.18], [2, 'sine', 0.03]], attack: 0.02, len: 1.2, lowpass: 1400 },
    glass: { parts: [[1, 'sine', 0.14], [2.76, 'sine', 0.05], [5.4, 'sine', 0.02]], attack: 0.004, len: 2.2 },
    pluck: { parts: [[1, 'sawtooth', 0.06], [1, 'triangle', 0.1]], attack: 0.003, len: 0.5, lowpass: 2200 },
  };

  function play(midi, moodId, when, gain) {
    if (midi == null) return;
    try {
      var c = ctx();
      var v = VOICES[mood(moodId).voice] || VOICES.bell;
      var t = when || c.currentTime;
      var f = 440 * Math.pow(2, (midi - 69) / 12);
      var out = c.createGain();
      out.gain.value = gain == null ? 1 : gain;
      var node = out;
      if (v.lowpass) {
        var lp = c.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = v.lowpass;
        out.connect(lp);
        node = lp;
      }
      node.connect(bus);
      node.connect(verb);
      v.parts.forEach(function (p) {
        var o = c.createOscillator();
        var g = c.createGain();
        o.type = p[1];
        o.frequency.value = f * p[0];
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(p[2], t + v.attack);
        g.gain.exponentialRampToValueAtTime(0.0001, t + v.len / Math.sqrt(p[0]));
        o.connect(g).connect(out);
        o.start(t);
        o.stop(t + v.len + 0.05);
      });
    } catch (e) { /* no audio: the page still works */ }
  }

  window.KeyVoice = { moods: MOODS, mood: mood, noteFor: noteFor, play: play, ctx: ctx };
})();
