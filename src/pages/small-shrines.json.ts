import type { APIRoute } from 'astro';
import { SHRINES, SHRINE_DURATION } from '../data/small-shrines';

const origin = 'https://pointcast.xyz';
const absolute = (path: string) => new URL(path, origin).href;

export const GET: APIRoute = () => new Response(JSON.stringify({
  title: 'Small Shrines',
  version: 1,
  url: absolute('/small-shrines/'),
  description: 'Four secular places to pause with artwork, original one-minute meditations, and optional procedural sound.',
  durationSeconds: SHRINE_DURATION,
  access: { accountRequired: false, free: true },
  practice: {
    eyesOpen: true,
    breathing: 'Natural breathing; no prescribed pace or breath holding.',
    timing: 'Four optional timed prompts; visitors can also read at their own pace and stop at any time.',
  },
  credits: {
    meditations: 'Original text written by Codex for Small Shrines at Michael Hoydich’s request.',
    spaceNames: 'Editorial names for these meditation spaces, not asserted original artwork titles.',
    generatedArt: 'Ocean and Night: original artwork generated with OpenAI image_gen.',
    existingArt: 'Garden and Memory: Michael Hoydich’s existing Midjourney works; source links are recorded with each space.',
    profile: 'https://www.midjourney.com/@mhoydich',
    provenance: absolute('/images/small-shrines/provenance.json'),
  },
  audio: {
    implementation: 'Original procedural Web Audio synthesis informed by existing PointCast Nouns and Drum audio patterns.',
    samples: false,
    autoplay: false,
    activation: 'Explicit user activation only.',
    modes: [
      { id: 'tide', label: 'Tide' },
      { id: 'drone', label: 'Warm drone' },
      { id: 'bowl', label: 'Bowl' },
      { id: 'pulse', label: 'Soft pulse' },
    ],
    controls: ['Play', 'Stop', 'Volume', 'Mute'],
    backgroundBehavior: 'Stops when the page is hidden or left; never resumes automatically.',
  },
  shrines: SHRINES.map((shrine) => ({
    ...shrine,
    url: absolute(`/small-shrines/#${shrine.id}`),
    image: absolute(shrine.image),
    sourceUrl: absolute(shrine.sourceUrl),
    durationSeconds: SHRINE_DURATION,
  })),
  links: {
    home: absolute('/'),
    shrineIndex: absolute('/shrines'),
    elementalShrine: absolute('/elemental-shrine'),
    openRoad: absolute('/open-road'),
  },
}, null, 2), {
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=300' },
});
