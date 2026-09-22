import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildTimeline, detectPitch, frequencies, pitchLabel } from '../src/lib/karaoke.mjs';

const songs = JSON.parse(readFileSync(new URL('../src/data/bell-choir-songs.json', import.meta.url), 'utf8'));
const close = (actual, expected, tolerance = 1e-9) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} should be within ${tolerance} of ${expected}`);

function signal(frequency, sampleRate, { length = 4096, amplitude = 0.3, phase = 0.37, offset = 0, harmonics = [] } = {}) {
  return Float32Array.from({ length }, (_, i) => {
    const angle = 2 * Math.PI * frequency * i / sampleRate + phase;
    return offset + amplitude * Math.sin(angle) +
      harmonics.reduce((sum, [multiple, level]) => sum + level * Math.sin(multiple * angle), 0);
  });
}

function noise(length = 4096) {
  let state = 42;
  return Float32Array.from({ length }, () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return (state / 2 ** 32 - 0.5) * 0.6;
  });
}

test('bell palette retains the original twelve frequencies', () => {
  assert.deepEqual(frequencies, [261.63, 293.66, 329.63, 392, 440, 523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66]);
});

for (const song of songs) {
  test(`${song.title}: every original word, note, and beat has one timed event`, () => {
    const before = JSON.stringify(song);
    const { events, total, beat } = buildTimeline(song);
    close(beat, 60 / song.bpm);
    assert.deepEqual(events.slice(0, 4), [4, 3, 2, 1].map((count, i) => ({
      time: i * beat, note: 0, count, volume: 0.10,
    })));
    assert.equal(events.length, 4 + song.lines.reduce((sum, line) => sum + line.words.length, 0));
    let eventIndex = 4;
    let elapsedBeats = 4;
    song.lines.forEach((line, lineIndex) => {
      assert.equal(line.words.length, line.notes.length);
      assert.equal(line.words.length, line.beats.length);
      line.words.forEach((_, wordIndex) => {
        const event = events[eventIndex++];
        assert.equal(event.line, lineIndex);
        assert.equal(event.word, wordIndex);
        assert.equal(event.note, line.notes[wordIndex]);
        assert.equal(event.volume, 0.30);
        close(event.time, elapsedBeats * beat);
        close(event.duration, line.beats[wordIndex] * beat);
        elapsedBeats += line.beats[wordIndex];
      });
    });
    close(total, elapsedBeats * beat);
    close(events.at(-1).time + events.at(-1).duration, total);
    assert.equal(JSON.stringify(song), before, 'timeline creation does not alter the song');
  });

  test(`${song.title}: gentle and lively pace scale the complete timeline`, () => {
    const original = buildTimeline(song);
    for (const pace of [0.8, 1.15]) {
      const scaled = buildTimeline(song, pace);
      close(scaled.total, original.total / pace);
      close(scaled.beat, original.beat / pace);
      assert.equal(scaled.events.length, original.events.length);
      scaled.events.forEach((event, i) => {
        close(event.time, original.events[i].time / pace);
        if (event.duration) close(event.duration, original.events[i].duration / pace);
      });
    }
  });
}

test('invalid timing data fails instead of producing an invalid audio schedule', () => {
  for (const pace of [0, -1, NaN, Infinity]) assert.throws(() => buildTimeline(songs[0], pace), TypeError);
  assert.throws(() => buildTimeline({ bpm: 0, lines: [] }), TypeError);
  assert.throws(() => buildTimeline({ bpm: 90, lines: [{ words: ['hello'], notes: [], beats: [1] }] }), TypeError);
  assert.throws(() => buildTimeline({ bpm: 90, lines: [{ words: ['hello'], notes: [30], beats: [1] }] }), TypeError);
});

for (const sampleRate of [44100, 48000]) {
  for (const frequency of [110, 220, 440, 660]) {
    test(`${frequency} Hz at ${sampleRate} samples/s stays at the fundamental`, () => {
      const result = detectPitch(signal(frequency, sampleRate), sampleRate);
      assert.ok(result);
      close(result.frequency, frequency, 0.5);
      assert.ok(result.confidence >= 0.99 && result.confidence <= 1);
      assert.ok(result.rms > 0.19 && result.rms < 0.23);
    });
  }

  test(`harmonic-rich voice signal at ${sampleRate} samples/s keeps its fundamental`, () => {
    for (const frequency of [110, 220, 440]) {
      const samples = signal(frequency, sampleRate, { amplitude: 0.08, harmonics: [[2, 0.3], [3, 0.14]] });
      const result = detectPitch(samples, sampleRate);
      assert.ok(result);
      close(result.frequency, frequency, 0.5);
    }
  });

  test(`out-of-range tones at ${sampleRate} samples/s cannot alias into the practice range`, () => {
    for (const frequency of [50, 60, 65, 1050, 1200, 2000, 4000]) {
      assert.equal(detectPitch(signal(frequency, sampleRate), sampleRate), null, `${frequency} Hz`);
    }
  });

  test(`silence, constant offsets, quiet input, and seeded noise are ignored at ${sampleRate}`, () => {
    assert.equal(detectPitch(new Float32Array(4096), sampleRate), null);
    assert.equal(detectPitch(new Float32Array(4096).fill(0.2), sampleRate), null);
    assert.equal(detectPitch(signal(220, sampleRate, { amplitude: 0.003 }), sampleRate), null);
    assert.equal(detectPitch(noise(), sampleRate), null);
  });
}

test('microphone-sized frames and DC offset retain a clear sung note', () => {
  for (const frequency of [110, 220, 440, 660]) {
    const result = detectPitch(signal(frequency, 48000, { length: 2048, offset: 0.2 }), 48000);
    assert.ok(result);
    close(result.frequency, frequency, 0.5);
  }
});

test('invalid microphone samples do not produce a pitch', () => {
  assert.equal(detectPitch(new Float32Array(32), 48000), null);
  assert.equal(detectPitch(new Float32Array(2048).fill(NaN), 48000), null);
  assert.equal(detectPitch(noise(), 0), null);
});

test('note labels use the nearest equal-tempered pitch and signed cents', () => {
  assert.deepEqual(pitchLabel(440), { note: 'A4', cents: 0, frequency: 440 });
  assert.deepEqual(pitchLabel(220), { note: 'A3', cents: 0, frequency: 220 });
  assert.equal(pitchLabel(261.625565).note, 'C4');
  assert.equal(pitchLabel(440 * 2 ** (20 / 1200)).cents, 20);
  assert.equal(pitchLabel(440 * 2 ** (-30 / 1200)).cents, -30);
  close(pitchLabel(660).frequency, 659.255114, 0.001);
  assert.equal(pitchLabel(660).note, 'E5');
  for (const invalid of [0, -1, NaN, Infinity]) assert.equal(pitchLabel(invalid), null);
});
