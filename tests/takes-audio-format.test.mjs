import assert from 'node:assert/strict';
import test from 'node:test';
import { TakesAudio, KEY_SOUNDS } from '../src/scripts/takes-audio.mjs';
import { parseDoc, serializeDoc } from '../src/scripts/takes-core.mjs';
import { GET } from '../src/pages/takes.json.ts';

// Inspect emitted audio events, not sound quality. No microphone or speakers required.
function typingEvents(mode, volume, key) {
  const audio = new TakesAudio({ keys: mode, keyVolume: volume, enabled: true });
  audio.ctx = { currentTime: 0 };
  const events = [];
  audio.out = (_pan, gain) => ({ gain });
  audio.noiseBurst = (_time, _length, output, options) => events.push({ kind: 'noise', gain: output.gain * options.gain });
  audio.play = (_voice, _frequency, options) => events.push({ kind: 'tone', gain: options.vel });
  audio.key(key);
  return events;
}

test('zero typing volume silences letters, spaces and Enter in every typing mode', () => {
  for (const mode of Object.keys(KEY_SOUNDS)) {
    for (const key of ['a', ' ', 'Enter']) {
      assert.deepEqual(typingEvents(mode, 0, key), [], `${mode}/${JSON.stringify(key)}`);
    }
  }
});

test('typing volume scales every emitted noise and tone, including Enter bells', () => {
  for (const mode of Object.keys(KEY_SOUNDS).filter(mode => mode !== 'off')) {
    for (const key of ['a', ' ', 'Enter']) {
      const soft = typingEvents(mode, 0.25, key);
      const loud = typingEvents(mode, 0.5, key);
      assert.ok(soft.length > 0, `${mode} emits ${JSON.stringify(key)}`);
      assert.equal(soft.length, loud.length);
      soft.forEach((event, index) => {
        assert.equal(event.kind, loud[index].kind);
        assert.equal(event.gain * 2, loud[index].gain, `${mode}/${JSON.stringify(key)}/${event.kind}`);
      });
    }
  }
});

test('the public JSON paragraph example parses and round-trips as two alternatives', async () => {
  const response = GET();
  assert.equal(response.status, 200);
  const { format } = await response.json();
  const document = parseDoc(format.paragraphTakes);
  assert.equal(document.blocks.length, 1);
  assert.deepEqual(document.blocks[0].versions, ['version one', 'version two (chosen)']);
  assert.equal(document.blocks[0].active, 1);
  assert.equal(serializeDoc(document), `${format.paragraphTakes}\n`);
});
