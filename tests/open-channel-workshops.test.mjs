import { test } from 'node:test';
import assert from 'node:assert/strict';
import { WORKSHOPS, buildOutline, getProgress } from '../public/open-channel/workshops.mjs';

test('both workshops offer three complete, distinct guided scenarios', () => {
  assert.deepEqual(Object.keys(WORKSHOPS), ['pitch', 'story']);
  for (const config of Object.values(WORKSHOPS)) {
    assert.equal(config.scenarios.length, 3);
    assert.equal(new Set(config.scenarios.map(scenario => scenario.id)).size, 3);
    assert.match(config.accent, /^#[0-9a-f]{6}$/i);
    assert.ok(config.timerSeconds > 0);
    assert.ok(config.checklist.length >= 3);
    for (const scenario of config.scenarios) {
      assert.equal(scenario.prompts.length, config.id === 'pitch' ? 5 : 6);
      assert.equal(new Set(scenario.prompts.map(prompt => prompt.id)).size, scenario.prompts.length);
      for (const prompt of scenario.prompts) {
        for (const key of ['id', 'label', 'question', 'hint', 'placeholder']) assert.ok(prompt[key]?.trim(), `${scenario.id}: ${key}`);
      }
    }
  }
});

test('progress counts supplied nonblank strings only, without grading content', () => {
  const scenario = WORKSHOPS.pitch.scenarios[0];
  assert.deepEqual(getProgress(scenario), { completed: 0, total: 5, remaining: 5, percent: 0 });
  assert.deepEqual(getProgress(scenario, { audience: '  one person  ', offer: '0', evidence: '\n ', concern: false, next: 42, unrelated: 'text' }), { completed: 2, total: 5, remaining: 3, percent: 40 });
  const answers = Object.fromEntries(scenario.prompts.map(prompt => [prompt.id, 'A supplied answer.']));
  assert.deepEqual(getProgress(scenario, answers), { completed: 5, total: 5, remaining: 0, percent: 100 });
  assert.equal(getProgress(scenario, Object.create({ audience: 'inherited text' })).completed, 0);
});

test('empty outlines label every unanswered section instead of inventing content', () => {
  for (const config of Object.values(WORKSHOPS)) {
    for (const scenario of config.scenarios) {
      const outline = buildOutline(config, scenario);
      assert.equal(outline.match(/\[Not answered\]/g).length, scenario.prompts.length);
      assert.ok(outline.includes('No AI-written answers or automated evaluation'));
      assert.ok(outline.includes('Dessa is not connected'));
      for (const prompt of scenario.prompts) assert.ok(outline.includes(prompt.label));
    }
  }
});

test('outlines preserve the actual user words and ignore unrelated answer fields', () => {
  const config = WORKSHOPS.story;
  const scenario = config.scenarios[0];
  const answer = '  Rain on the pier.\n“I think it was Tuesday,” she said. <uncertain>  ';
  const answers = { character: answer, injected: 'THIS MUST NOT APPEAR', ending: false };
  const snapshot = structuredClone(answers);
  const outline = buildOutline(config, scenario, answers);
  assert.ok(outline.includes(answer.trim()));
  assert.ok(!outline.includes('THIS MUST NOT APPEAR'));
  assert.equal(outline.match(/\[Not answered\]/g).length, 5);
  assert.deepEqual(answers, snapshot);
  assert.ok(outline.includes('https://pointcast.xyz/open-channel/story-booth/'));
});

test('a complete speaking card contains each supplied answer once and the correct route', () => {
  const config = WORKSHOPS.pitch;
  const scenario = config.scenarios[1];
  const answers = Object.fromEntries(scenario.prompts.map((prompt, index) => [prompt.id, `UNIQUE ANSWER ${index + 1}.`]));
  const outline = buildOutline(config, scenario, answers);
  for (const answer of Object.values(answers)) assert.equal(outline.split(answer).length - 1, 1);
  assert.ok(!outline.includes('[Not answered]'));
  assert.ok(outline.includes('Speaking card'));
  assert.ok(outline.includes('https://pointcast.xyz/open-channel/pitch-room/'));
});
