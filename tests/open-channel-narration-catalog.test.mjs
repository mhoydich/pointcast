import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { AUDIO_MANIFEST } from '../public/open-channel/audio-manifest.mjs';
import { SCENES } from '../public/open-channel/scenes.mjs';
import { WORKSHOPS } from '../public/open-channel/workshops.mjs';
import { NARRATION_LINES, getNarrationClip, getRecordingCoverage, RECORDINGS_READY } from '../public/open-channel/narration-catalog.mjs';

const example = NARRATION_LINES[0];
const source = '/open-channel/audio/characters/last-signal/start.mp3';
const manifestWith = entry => ({ clips: { [example.key]: entry } });

test('the recording inventory covers all 54 authored lines with unique, stable keys', () => {
  assert.equal(NARRATION_LINES.length, 54);
  assert.equal(new Set(NARRATION_LINES.map(line => line.key)).size, 54);
  assert.deepEqual(['characters/', 'pitch/', 'story/'].map(prefix => NARRATION_LINES.filter(line => line.key.startsWith(prefix)).length), [21, 15, 18]);
  for (const scene of SCENES) {
    for (const [nodeId, node] of Object.entries(scene.nodes)) {
      assert.deepEqual(NARRATION_LINES.find(line => line.key === `characters/${scene.id}/${nodeId}`), { key: `characters/${scene.id}/${nodeId}`, text: node.text });
    }
  }
  for (const workshop of Object.values(WORKSHOPS)) {
    for (const scenario of workshop.scenarios) {
      for (const prompt of scenario.prompts) {
        const line = NARRATION_LINES.find(line => line.key === `${workshop.id}/${scenario.id}/${prompt.id}`);
        assert.equal(line?.text, `${prompt.question} ${prompt.hint}`);
        assert.ok(!line.text.includes(prompt.placeholder), 'placeholder answers are not narration');
      }
    }
  }
});

test('a clip is available only for an exact match with the current authored text', () => {
  const manifest = manifestWith({ src: source, text: example.text });
  assert.equal(getNarrationClip(example.key, example.text, manifest), source);
  assert.equal(getNarrationClip(example.key, `${example.text} `, manifest), null);
  assert.equal(getNarrationClip(example.key, example.text, manifestWith({ src: source, text: 'An older script.' })), null);
  const unknown = 'characters/not-a-scene/start';
  assert.equal(getNarrationClip(unknown, 'An unrelated line.', { clips: { [unknown]: { src: source, text: 'An unrelated line.' } } }), null);
});

test('recordings cannot resolve to external URLs, traversal paths, or URL suffixes', () => {
  const unsafe = [
    'https://example.com/voice.mp3', '//example.com/voice.mp3', '/other/voice.mp3',
    '/open-channel/audio/../voice.mp3', '/open-channel/audio/a/../../voice.mp3',
    '/open-channel/audio/%2e%2e/voice.mp3', '/open-channel/audio/voice.mp3?token=private',
    '/open-channel/audio/voice.mp3#part', '/open-channel/audio/voice.mp3/extra',
    '/open-channel/audio\\voice.mp3', '/open-channel/audio//voice.mp3',
    '/open-channel/audio/voice.wav', '/open-channel/audio/voice.mp3\n',
  ];
  for (const src of unsafe) assert.equal(getNarrationClip(example.key, example.text, manifestWith({ src, text: example.text })), null, src);
  assert.equal(getNarrationClip(example.key, example.text, manifestWith({ src: '/open-channel/audio/last-signal_start-42.mp3', text: example.text })), '/open-channel/audio/last-signal_start-42.mp3');
});

test('missing, malformed, and inherited manifest entries stay unavailable', () => {
  for (const manifest of [null, {}, { clips: null }, { clips: [] }, manifestWith(null), manifestWith({ text: example.text, src: 42 })]) {
    assert.equal(getNarrationClip(example.key, example.text, manifest), null);
  }
  const inherited = { clips: Object.create({ [example.key]: { src: source, text: example.text } }) };
  assert.equal(getNarrationClip(example.key, example.text, inherited), null);
  assert.equal(getNarrationClip(null, example.text, manifestWith({ src: source, text: example.text })), null);
});

test('coverage counts valid current recordings and never treats a partial catalog as ready', () => {
  assert.deepEqual(getRecordingCoverage({ clips: {} }), { recorded: 0, total: 54, complete: false });
  assert.deepEqual(getRecordingCoverage(manifestWith({ src: source, text: example.text })), { recorded: 1, total: 54, complete: false });
  const clips = Object.fromEntries(NARRATION_LINES.map((line, index) => [line.key, { text: line.text, src: `/open-channel/audio/clip-${index}.mp3` }]));
  assert.deepEqual(getRecordingCoverage({ clips }), { recorded: 54, total: 54, complete: true });
  clips[example.key].text = 'An older script.';
  assert.deepEqual(getRecordingCoverage({ clips }), { recorded: 53, total: 54, complete: false });
});


test('included recordings have verified MP3 assets and partial catalogs cannot enable recorded narration', async () => {
  assert.equal(AUDIO_MANIFEST.provider, 'ElevenLabs');
  assert.equal(AUDIO_MANIFEST.model, 'eleven_v4');
  const included = Object.keys(AUDIO_MANIFEST.clips);
  assert.ok(included.length > 0 && included.length <= 54, 'the draft must retain its completed recordings');
  const knownKeys = new Set(NARRATION_LINES.map(line => line.key));
  for (const key of included) assert.ok(knownKeys.has(key), `${key}: recording has no authored source`);
  const complete = included.length === 54;
  assert.deepEqual(getRecordingCoverage(), { recorded: included.length, total: 54, complete });
  assert.equal(RECORDINGS_READY, complete, 'partial coverage must keep recorded narration unavailable');
  const paths = new Set(), hashes = new Set();
  for (const line of NARRATION_LINES.filter(line => included.includes(line.key))) {
    const clip = AUDIO_MANIFEST.clips[line.key];
    const src = getNarrationClip(line.key, line.text);
    assert.ok(src, `${line.key} must match the current script and use a local MP3 path`);
    assert.ok(!paths.has(src), `${line.key} must not reuse another line's recording`); paths.add(src);
    for (const field of ['voiceId', 'voiceName', 'generationId']) {
      assert.equal(typeof clip[field], 'string', `${line.key}: ${field}`);
      assert.ok(clip[field].trim(), `${line.key}: ${field} is required provenance`);
    }
    assert.match(clip.sha256, /^[a-f0-9]{64}$/, `${line.key}: expected SHA256`);
    const bytes = await readFile(new URL(`../public${src}`, import.meta.url));
    assert.ok(bytes.length > 1000, `${line.key}: recording is empty or truncated`);
    const hasID3 = bytes.subarray(0, 3).toString('ascii') === 'ID3';
    const hasMpegFrame = bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0;
    assert.ok(hasID3 || hasMpegFrame, `${line.key}: expected MP3 audio, not an error response`);
    const hash = createHash('sha256').update(bytes).digest('hex');
    assert.equal(hash, clip.sha256, `${line.key}: recording bytes no longer match the manifest`);
    assert.ok(!hashes.has(hash), `${line.key}: duplicate recording bytes for a different line`); hashes.add(hash);
  }
  assert.ok(!JSON.stringify(AUDIO_MANIFEST).includes('X-Goog-'), 'signed generation URLs must not be shipped');
});
