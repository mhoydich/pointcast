/* PMM motion sprint, 2026-10-23: the three directions the sprint sketched and scored, for the lab at
   /pmm/motion/. Each covers connect, send, receive, react, mood and their-mood; every other event,
   and every event with reduced motion on, plays the chosen system in motion.js. The app never loads
   this file. Why these lost, and what the chosen system took from each: docs/design-sprints/2026-10-23-pmm-motion.md */
import { register, kit, EMOTE_FPS } from './motion.js';

export const SKETCHED = Object.freeze(['connect', 'send', 'receive', 'react', 'mood', 'their-mood']);
import { mood } from './moods.temp.js'; // TEMP: ../moods/moods.js once #1533 merges

const { k, fade, self, tint, sparks, sprite, KEEP, grad, tape, ring, sweep, flavourKeys, lateFade, FLAVOUR } = kit;
// Raster's mood flavour is how many lines a frame draws: hyped in two, tired in eight.
const lines = (id) => `steps(${id === 'hyped' ? 2 : id === 'tired' ? 8 : id === 'soft' || id === 'calm' ? 6 : 4}, end)`;

// Raster: the screen draws itself line by line, and the border carries the colour.
register('raster', {
  connect: (o) => [ring(tape(o.theirMood), 220, 900)],
  send: (o) => [self([k(0, 0, 0, 0, [1, 0], 1), k(1)], lines(o.mood), { origin: '50% 0%' }), sweep(mood(o.mood).color)],
  receive: (o) => [self([k(0, 0, 0, 0, [1, 0], 1), k(1)], lines(o.theirMood), { origin: '50% 0%' }), sweep(mood(o.theirMood).color)],
  react: (o) => [sprite(o.mood, EMOTE_FPS, [k(0, 0, 0, 0, [1, 0]), k(1)], `steps(8, end)`, KEEP)],
  mood: (o) => [ring(tape(o.mood), 220, 600)],
  'their-mood': (o) => [ring(tape(o.theirMood), 220, 600)],
});
// Arcade: everything twice as big, with particles and a shake.
register('arcade', {
  connect: (o) => [self([k(0, 0, 0, 0, 0.9), k(0.3, -6, 0, 0, 1.04), k(0.5, 6), k(0.7, -3), k(1)], `steps(2, end)`), sparks(mood(o.theirMood).color, 10, 60)],
  send: (o) => [self(flavourKeys(o.mood, 1.6), FLAVOUR[mood(o.mood).id].ease), sparks(mood(o.mood).color, 6, 24)],
  receive: (o) => [self(flavourKeys(o.theirMood, 2.5), FLAVOUR[mood(o.theirMood).id].ease), sparks(mood(o.theirMood).color, 8, 30)],
  react: (o) => [sprite(o.mood, EMOTE_FPS, [k(0, 0, 10, 0, 0, 0), k(0.4, 0, -6, 0, 1.8, 1), k(1)], undefined, KEEP), sparks(mood(o.mood).color, 8, 28)],
  mood: (o) => [self([k(0, 0, 0, 0, 0.7), k(0.3, 0, -6, 0, 1.2), k(0.6, 0, 0, 0, 0.95), k(1)], `steps(2, end)`), sparks(mood(o.mood).color, 8, 30)],
  'their-mood': (o) => [self([k(0), k(0.25, -5), k(0.5, 5), k(0.75, -2), k(1)], `steps(1, end)`), tint(mood(o.theirMood).color, fade(0.6, 0), { ease: `steps(8, end)` })],
});
// Quiet: no movement at all. Mood is the timing of a fade and a wash of colour.
const qEase = { calm: 'ease-in-out', hyped: `steps(2, end)`, soft: 'cubic-bezier(.2,.8,.2,1)', sunny: 'ease-out', salty: `steps(3, end)`, tired: 'cubic-bezier(.7,0,.9,.4)', curious: 'cubic-bezier(.3,1.4,.6,1)', low: 'ease-in' };
register('quiet', {
  connect: (o) => [tint(grad(mood(o.mood).color, mood(o.theirMood).color), fade(0.5, 0), { ease: 'ease-out' })],
  send: (o) => [self(lateFade(o.mood), qEase[mood(o.mood).id])],
  receive: (o) => [self(lateFade(o.theirMood), qEase[mood(o.theirMood).id]), tint(mood(o.theirMood).color, fade(0.3, 0), { ease: 'ease-out' })],
  react: (o) => [sprite(o.mood, 2, fade(0, 1), 'ease-out', KEEP)],
  mood: (o) => [tint(mood(o.was).color, fade(0.85, 0), { crossfade: true, ease: qEase[mood(o.mood).id] })],
  'their-mood': (o) => [tint(grad(mood(o.mood).color, mood(o.was).color), fade(0.85, 0), { crossfade: true, ease: qEase[mood(o.theirMood).id] })],
});

