/** Bell Choir's original pentatonic bell palette, in hertz. */
export const frequencies = Object.freeze([
  261.63, 293.66, 329.63, 392, 440, 523.25,
  587.33, 659.25, 783.99, 880, 1046.5, 1174.66,
]);

/**
 * Build one chorus in seconds. Pace multiplies the song's original tempo.
 * Line and word are indices so sound and lyric highlighting share one clock.
 */
export function buildTimeline(song, pace = 1) {
  if (!Number.isFinite(song?.bpm) || song.bpm <= 0 ||
      !Number.isFinite(pace) || pace <= 0 || !Array.isArray(song.lines)) {
    throw new TypeError('A song with a positive tempo and pace is required.');
  }
  const beat = 60 / (song.bpm * pace);
  const events = [];
  let beats = 0;
  for (let i = 0; i < 4; i++) {
    events.push({ time: beats * beat, note: 0, count: 4 - i, volume: 0.10 });
    beats++;
  }
  song.lines.forEach((line, lineIndex) => {
    if (!Array.isArray(line.words) || !Array.isArray(line.notes) ||
        !Array.isArray(line.beats) || line.words.length !== line.notes.length ||
        line.words.length !== line.beats.length) {
      throw new TypeError('Each lyric word needs a note and beat duration.');
    }
    line.words.forEach((word, wordIndex) => {
      const note = line.notes[wordIndex];
      const durationBeats = line.beats[wordIndex];
      if (typeof word !== 'string' || !Number.isInteger(note) || note < 0 ||
          note >= frequencies.length || !Number.isFinite(durationBeats) || durationBeats <= 0) {
        throw new TypeError('Lyric notes and beat durations must be valid.');
      }
      events.push({
        time: beats * beat,
        note,
        line: lineIndex,
        word: wordIndex,
        volume: 0.30,
        duration: durationBeats * beat,
      });
      beats += durationBeats;
    });
  });
  return { events, total: beats * beat, beat };
}

/**
 * A conservative local practice tuner, not a singing-quality measurement.
 * Normalized autocorrelation tolerates input gain and a constant microphone
 * offset. The earliest peak close to the strongest peak avoids choosing a
 * later repetition (an octave-down error); interpolation refines sample lags.
 * Search above the accepted pitch range too, so a high tone cannot masquerade
 * as an in-range subharmonic. Unvoiced, quiet, or uncertain frames return null.
 */
export function detectPitch(samples, sampleRate) {
  if (!(samples instanceof Float32Array) || samples.length < 128 ||
      !Number.isFinite(sampleRate) || sampleRate < 8000) return null;

  let mean = 0;
  for (const sample of samples) {
    if (!Number.isFinite(sample)) return null;
    mean += sample;
  }
  mean /= samples.length;
  const centered = new Float32Array(samples.length);
  let energy = 0;
  for (let i = 0; i < samples.length; i++) {
    centered[i] = samples[i] - mean;
    energy += centered[i] * centered[i];
  }
  const rms = Math.sqrt(energy / samples.length);
  if (rms < 0.01) return null;

  const maxLag = Math.min(Math.ceil(sampleRate / 50), Math.floor(samples.length / 2));
  const correlation = new Float64Array(maxLag + 1);
  correlation[0] = 1;
  for (let lag = 1; lag <= maxLag; lag++) {
    let product = 0;
    let pairedEnergy = 0;
    for (let i = 0; i < samples.length - lag; i++) {
      const left = centered[i];
      const right = centered[i + lag];
      product += left * right;
      pairedEnergy += left * left + right * right;
    }
    correlation[lag] = pairedEnergy > 0 ? 2 * product / pairedEnergy : 0;
  }

  const peaks = [];
  let leftInitialLobe = false;
  for (let lag = 1; lag < maxLag; lag++) {
    if (correlation[lag] <= 0) leftInitialLobe = true;
    if (!leftInitialLobe || correlation[lag] < 0.9 ||
        correlation[lag] <= correlation[lag - 1] ||
        correlation[lag] < correlation[lag + 1]) continue;
    const before = correlation[lag - 1];
    const middle = correlation[lag];
    const after = correlation[lag + 1];
    const curvature = before - 2 * middle + after;
    const offset = curvature === 0 ? 0 : 0.5 * (before - after) / curvature;
    const height = Math.min(1, middle - 0.25 * (before - after) * offset);
    peaks.push({ lag: lag + offset, confidence: height });
  }
  if (!peaks.length) return null;
  const strongest = Math.max(...peaks.map(peak => peak.confidence));
  const peak = peaks.find(candidate => candidate.confidence >= strongest * 0.995);
  const frequency = sampleRate / peak.lag;
  if (frequency < 70 || frequency > 1000) return null;
  return { frequency, confidence: peak.confidence, rms };
}

/** The nearest equal-tempered note, with its octave and signed cents offset. */
export function pitchLabel(frequency) {
  if (!Number.isFinite(frequency) || frequency <= 0) return null;
  const midi = Math.round(69 + 12 * Math.log2(frequency / 440));
  const reference = 440 * 2 ** ((midi - 69) / 12);
  const names = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
  return {
    note: `${names[((midi % 12) + 12) % 12]}${Math.floor(midi / 12) - 1}`,
    cents: Math.round(1200 * Math.log2(frequency / reference)),
    frequency: reference,
  };
}
