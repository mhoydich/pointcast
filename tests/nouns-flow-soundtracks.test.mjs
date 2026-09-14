import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
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

test('the welcome and each lane have short original sound assets', () => {
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
});

test('delivered AAC files match their decoded PCM verification manifest', () => {
  let bytes = 0;
  for (const track of manifest.tracks) {
    const data = readFileSync(new URL(track.file, directory));
    assert.equal(data.toString('ascii', 4, 8), 'ftyp', track.file);
    assert.ok(data.includes(Buffer.from('mp4a')), track.file);
    assert.equal(data.byteLength, track.bytes, track.file);
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
  assert.equal(readdirSync(directory).filter(name => name.endsWith('.wav')).length, 0);
});
