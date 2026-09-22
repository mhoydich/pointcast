import assert from 'node:assert/strict';
import test from 'node:test';
import { PAD_BY_ID } from '../src/lib/nouns-drum-club-audio.ts';
import { NOUNS_DRUM_CLUB_BANDMATES } from '../src/lib/nouns-drum-club-bandmates.ts';
import {
  bandmateArrangementPrompt,
  composeBandmateScore,
  dailyBandmateQuartet,
  decodeBandmateQuartet,
  encodeBandmateQuartet,
  nounsDrumClubArrangementPlayUrl,
  nounsDrumClubBandmateArrangement,
  validateBandmateQuartet,
} from '../src/lib/nouns-drum-club-arrangements.ts';
import { decodeScore, encodeScore } from '../src/lib/nouns-drum-club-score.ts';

const roles = ['drum', 'bass', 'mallet', 'chord'];
const roleFamilies = {
  drum: new Set(['drums']),
  bass: new Set(['bass']),
  mallet: new Set(['mallets']),
  chord: new Set(['chords', 'ear-candy']),
};

test('quartet codec strictly requires four IDs in drum, bass, mallet, chord order', () => {
  const quartet = [0, 3, 6, 9];
  assert.deepEqual(validateBandmateQuartet(quartet), quartet);
  assert.equal(encodeBandmateQuartet(quartet), '0,3,6,9');
  assert.deepEqual(decodeBandmateQuartet('0,3,6,9'), quartet);
  for (const invalid of [null, '', '0,3,6', '0,3,6,9,10', '0,3,6,nope', '3,0,6,9', '0,3,6,12', '0,3,6,6', '0, 3,6,9']) {
    assert.equal(decodeBandmateQuartet(invalid), null);
  }
  assert.equal(validateBandmateQuartet([0, 3, 9, 6]), null);
  assert.equal(validateBandmateQuartet([null, 3, 6, 9]), null);
  assert.equal(validateBandmateQuartet(['0', 3, 6, 9]), null);
  assert.throws(() => encodeBandmateQuartet([3, 0, 6, 9]), /drum, bass, mallet, and chord/);
});

test('daily rotation covers all 81 valid quartets exactly once over 81 consecutive UTC days', () => {
  const seen = new Set();
  for (let offset = 0; offset < 81; offset++) {
    const date = new Date(Date.UTC(2026, 8, 22 + offset, 23, 59));
    const quartet = dailyBandmateQuartet(date);
    seen.add(encodeBandmateQuartet(quartet));
    assert.deepEqual(quartet.map((id) => NOUNS_DRUM_CLUB_BANDMATES[id].role), roles);
    assert.deepEqual(dailyBandmateQuartet(date.toISOString().slice(0, 10)), quartet);
  }
  assert.equal(seen.size, 81);
  assert.deepEqual(dailyBandmateQuartet('2026-09-22'), dailyBandmateQuartet(new Date('2026-09-22T08:45:00-07:00')));
  assert.notDeepEqual(dailyBandmateQuartet('2026-09-22'), dailyBandmateQuartet(new Date('2026-09-22T18:45:00-07:00')));
  assert.throws(() => dailyBandmateQuartet('2026-02-30'), /invalid/);
});

test('composition keeps only each cast member family and uses median tempo with mean swing', () => {
  const quartet = [0, 3, 6, 9];
  const score = composeBandmateScore(quartet, 'First quartet');
  assert.equal(score.name, 'First quartet');
  assert.equal(score.tempo, 105); // middle values are 104 and 106
  assert.equal(score.swing, 0.13);
  assert.deepEqual(decodeScore(encodeScore(score)), score);
  assert.equal(new Set(score.lanes.map((lane) => lane.padId)).size, score.lanes.length);
  for (const lane of score.lanes) {
    const pad = PAD_BY_ID.get(lane.padId);
    assert.ok(pad);
    const owner = NOUNS_DRUM_CLUB_BANDMATES.find((member) => quartet.includes(member.id) && member.score.lanes.some((candidate) => candidate.padId === lane.padId) && roleFamilies[member.role].has(pad.family));
    assert.ok(owner, `${lane.padId} must belong to the selected member's cast family`);
    assert.ok(roleFamilies[owner.role].has(pad.family));
    assert.equal(lane.steps.length, 16);
  }
  assert.ok(score.lanes.some((lane) => PAD_BY_ID.get(lane.padId)?.family === 'drums'));
  assert.ok(score.lanes.some((lane) => PAD_BY_ID.get(lane.padId)?.family === 'bass'));
  assert.ok(score.lanes.some((lane) => PAD_BY_ID.get(lane.padId)?.family === 'mallets'));
  assert.ok(score.lanes.some((lane) => PAD_BY_ID.get(lane.padId)?.family === 'chords'));
  assert.ok(score.lanes.length <= 36);
});

test('all 81 arrangements are bounded, codec-safe, complete bands that never mutate source scores', () => {
  const sourceBefore = JSON.stringify(NOUNS_DRUM_CLUB_BANDMATES.map((member) => member.score));
  const scoreEncodings = new Set();
  for (let offset = 0; offset < 81; offset++) {
    const quartet = dailyBandmateQuartet(new Date(Date.UTC(2026, 0, 1 + offset)));
    const score = composeBandmateScore(quartet);
    const encoded = encodeScore(score);
    assert.ok(encoded.length < 12_000);
    assert.deepEqual(decodeScore(encoded), score);
    scoreEncodings.add(encoded);
    assert.equal(new Set(score.lanes.map((lane) => lane.padId)).size, score.lanes.length);
    assert.ok(score.lanes.length > 0 && score.lanes.length <= 36);
    const families = new Set(score.lanes.map((lane) => PAD_BY_ID.get(lane.padId)?.family));
    for (const family of ['drums', 'bass', 'mallets', 'chords']) assert.ok(families.has(family));
  }
  assert.equal(scoreEncodings.size, 81);
  assert.equal(JSON.stringify(NOUNS_DRUM_CLUB_BANDMATES.map((member) => member.score)), sourceBefore);
});

test('daily arrangement carries an authored prompt and an exact remixable beat and band URL', () => {
  const arrangement = nounsDrumClubBandmateArrangement('2026-09-22');
  assert.equal(arrangement.dateKey, '2026-09-22');
  assert.equal(arrangement.members.length, 4);
  assert.deepEqual(arrangement.members.map((member) => member.id), arrangement.quartet);
  assert.equal(arrangement.prompt, bandmateArrangementPrompt(arrangement.quartet));
  for (const member of arrangement.members) assert.match(arrangement.prompt, new RegExp(member.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.match(arrangement.prompt, /Leave one step empty/);
  const url = new URL(arrangement.playUrl);
  assert.equal(url.origin, 'https://pointcast.xyz');
  assert.equal(url.pathname, '/nouns/drum-club/');
  assert.deepEqual(decodeBandmateQuartet(url.searchParams.get('band')), arrangement.quartet);
  assert.deepEqual(decodeScore(url.searchParams.get('beat')), arrangement.score);
  assert.equal(arrangement.playUrl, nounsDrumClubArrangementPlayUrl(arrangement.quartet, arrangement.score));
});
