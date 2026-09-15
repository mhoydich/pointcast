import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const directory = new URL('../public/audio/starjam/', import.meta.url);
const manifest = JSON.parse(readFileSync(new URL('manifest.json', directory), 'utf8'));

test('every world and pace has its own finite, bounded soundtrack', () => {
  const soundtracks = manifest.tracks.filter(track => track.world);
  assert.equal(soundtracks.length, 12);
  assert.equal(manifest.loop, false);
  assert.equal(manifest.beatOffsetSeconds, 0);
  for (const world of ['garden', 'rush', 'shell', 'storm']) {
    for (const [pace, bpm] of Object.entries({ drift: 72, gentle: 96, playful: 120 })) {
      const track = soundtracks.find(item => item.world === world && item.pace === pace);
      assert.ok(track, `${world}/${pace}`);
      assert.equal(track.file, `${world}-${pace}.m4a`);
      assert.equal(track.bpm, bpm);
      assert.ok(Math.abs(track.durationSeconds - 35) < 0.025, track.file);
    }
  }
  assert.equal(new Set(soundtracks.map(track => track.sha256)).size, 12);
});

test('welcome, lane hits and a quieter level-clear fanfare have finite original assets', () => {
  const welcome = manifest.tracks.find(track => track.kind === 'welcome');
  assert.equal(welcome.file, 'welcome.m4a');
  assert.ok(Math.abs(welcome.durationSeconds - 3) < 0.025);
  const hits = manifest.tracks.filter(track => track.kind === 'hit');
  assert.equal(hits.length, 3);
  for (let lane = 0; lane < 3; lane++) {
    const hit = hits.find(track => track.lane === lane);
    assert.equal(hit.file, `hit-${lane}.m4a`);
    assert.ok(hit.durationSeconds >= 0.25 && hit.durationSeconds <= 0.32);
  }
  assert.equal(new Set(hits.map(track => track.sha256)).size, 3);
  const fanfare = manifest.tracks.find(track => track.kind === 'level-clear');
  assert.equal(fanfare.file, 'level-clear.m4a');
  assert.ok(Math.abs(fanfare.durationSeconds - 1.5) < 0.025);
  assert.ok(fanfare.decodedPcm.peakDbfs <= -6, 'overlay must retain headroom');
  assert.ok(fanfare.decodedPcm.rmsDbfs > -23.5 && fanfare.decodedPcm.rmsDbfs < -20);
  assert.ok(fanfare.decodedPcm.rmsDbfs < welcome.decodedPcm.rmsDbfs - 4);
  assert.equal(new Set(manifest.tracks.map(track => track.sha256)).size, 17);
});

test('the score develops by adding parts and note density, with a fuller last ten seconds', () => {
  const generator = fileURLToPath(new URL('../scripts/generate-starjam-soundtracks.py', import.meta.url));
  const renderScore = () => execFileSync('python3', [generator, '--score-json'], { encoding: 'utf8', maxBuffer: 2_000_000 });
  const serialized = renderScore();
  assert.equal(serialized, renderScore(), 'composition must be deterministic');
  const scores = JSON.parse(serialized);
  assert.equal(Object.keys(scores).length, 12);
  for (const track of manifest.tracks.filter(item => item.world)) {
    const events = scores[`${track.world}-${track.pace}`];
    const phases = track.arrangement.phases;
    assert.equal(track.arrangement.gainAutomation, 'none');
    assert.deepEqual(phases.map(({ name, startSeconds, endSeconds }) => [name, startSeconds, endSeconds]), [
      ['opening', 0, 8], ['lift', 8, 17], ['bloom', 17, 25], ['celebration', 25, 35],
    ]);
    assert.equal(events[0].at, 0, track.file);
    assert.ok(events.every(event => event.at >= 0 && event.at < 35), track.file);
    for (const phase of phases) {
      const section = events.filter(event => event.at >= phase.startSeconds && event.at < phase.endSeconds);
      const layers = Object.fromEntries([...new Set(section.map(event => event.layer))].sort()
        .map(layer => [layer, section.filter(event => event.layer === layer).length]));
      assert.deepEqual(phase.layers, layers, `${track.file}/${phase.name}: metadata matches rendered score`);
      assert.equal(phase.events, section.length);
      assert.equal(phase.eventsPerSecond, Number((section.length / (phase.endSeconds - phase.startSeconds)).toFixed(3)));
      assert.ok(phase.decodedPcm.peakDbfs < -0.5);
      assert.ok(Math.abs(phase.decodedPcm.rmsDbfs - phase.sourcePcm.rmsDbfs) < 0.5, track.file);
    }
    assert.deepEqual(Object.keys(phases[0].layers), ['bass', 'pluck']);
    assert.ok(phases[1].layers.kick && phases[1].layers.backbeat);
    assert.ok(phases[2].layers.chord && phases[2].layers.hat);
    assert.ok(phases[3].layers.bell && phases[3].layers.answer && phases[3].layers.cadence);
    for (let index = 1; index < phases.length; index++) {
      assert.ok(phases[index].eventsPerSecond > phases[index - 1].eventsPerSecond,
        `${track.file}: ${phases[index].name} adds activity`);
    }
    const pluckRate = phase => (phase.layers.pluck + (phase.layers.answer || 0)) / (phase.endSeconds - phase.startSeconds);
    assert.ok(pluckRate(phases[3]) > pluckRate(phases[0]) * 1.5, track.file);
    for (const layer of ['bass', 'pluck', 'chord', 'answer', 'bell']) {
      assert.equal(new Set(events.filter(event => event.layer === layer).map(event => event.level)).size, 1,
        `${track.file}/${layer}: development must not just turn up existing parts`);
    }
    const rise = phases[3].decodedPcm.rmsDbfs - phases[0].decodedPcm.rmsDbfs;
    assert.ok(rise > 2 && rise < 10, `${track.file}: comfortable audible development (${rise} dB)`);
  }
});

test('delivered AAC files match their decoded PCM verification manifest', () => {
  assert.equal(manifest.version, 2);
  assert.equal(manifest.tracks.length, 17);
  let bytes = 0;
  for (const track of manifest.tracks) {
    const data = readFileSync(new URL(track.file, directory));
    assert.equal(data.toString('ascii', 4, 8), 'ftyp', track.file);
    assert.ok(data.includes(Buffer.from('mp4a')), track.file);
    assert.equal(data.byteLength, track.bytes, track.file);
    assert.ok(data.byteLength < 512 * 1024, track.file);
    assert.equal(createHash('sha256').update(data).digest('hex'), track.sha256, track.file);
    assert.equal(track.channels, 1);
    assert.equal(track.sampleRate, 44100);
    assert.equal(track.codec, 'AAC-LC');
    assert.ok(track.decodedPcm.peakDbfs < -0.5, track.file);
    assert.ok(track.decodedPcm.rmsDbfs > -26 && track.decodedPcm.rmsDbfs < -11, track.file);
    assert.ok(track.decodedPcm.firstSignalSeconds < 0.025, track.file);
    bytes += data.byteLength;
  }
  assert.equal(bytes, manifest.totalBytes);
  assert.ok(bytes < 4_000_000);
  assert.deepEqual(readdirSync(directory).filter(name => name.endsWith('.m4a')).sort(), manifest.tracks.map(track => track.file).sort());
  assert.equal(readdirSync(directory).filter(name => name.endsWith('.wav')).length, 0);
});
