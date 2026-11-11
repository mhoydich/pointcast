import { SCENES } from './scenes.mjs';
import { WORKSHOPS } from './workshops.mjs';
import { AUDIO_MANIFEST } from './audio-manifest.mjs';

/** Only these authored lines are eligible for recorded narration. Draft answers are never included. */
export const NARRATION_LINES = [
  ...SCENES.flatMap(scene => Object.entries(scene.nodes).map(([nodeId, node]) => ({
    key: `characters/${scene.id}/${nodeId}`,
    text: node.text,
  }))),
  ...Object.values(WORKSHOPS).flatMap(workshop => workshop.scenarios.flatMap(scenario => scenario.prompts.map(prompt => ({
    key: `${workshop.id}/${scenario.id}/${prompt.id}`,
    text: `${prompt.question} ${prompt.hint}`,
  })))),
];

const authoredText = new Map(NARRATION_LINES.map(line => [line.key, line.text]));
const localAudioPath = /^\/open-channel\/audio\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-]+\.mp3$/;

/** A missing or stale recording stays unavailable instead of speaking mismatched text. */
export function getNarrationClip(key, text, manifest = AUDIO_MANIFEST) {
  if (typeof key !== 'string' || typeof text !== 'string' || authoredText.get(key) !== text) return null;
  const clips = manifest?.clips;
  if (!clips || typeof clips !== 'object' || !Object.hasOwn(clips, key)) return null;
  const clip = clips[key];
  if (!clip || clip.text !== text || typeof clip.src !== 'string' || !localAudioPath.test(clip.src)) return null;
  return clip.src;
}

export function getRecordingCoverage(manifest = AUDIO_MANIFEST) {
  const total = NARRATION_LINES.length;
  const recorded = NARRATION_LINES.filter(line => getNarrationClip(line.key, line.text, manifest)).length;
  return { recorded, total, complete: total > 0 && recorded === total };
}

export const RECORDING_COUNT = getRecordingCoverage().recorded;
export const RECORDINGS_READY = getRecordingCoverage().complete;
