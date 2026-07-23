import type { APIRoute } from 'astro';

import {
  BELLFLOWER_META,
  BELLFLOWER_RECEIPT_KEY,
  BELLFLOWER_RECEIPT_SCHEMA,
  BELLFLOWER_STAGES,
  BELLFLOWER_STORAGE_KEY,
} from '../lib/bellflower.mjs';

export const prerender = true;

export const GET: APIRoute = () => {
  const payload = {
    ...BELLFLOWER_META,
    humanUrl: `https://pointcast.xyz${BELLFLOWER_META.route}`,
    jsonUrl: `https://pointcast.xyz${BELLFLOWER_META.jsonRoute}`,
    storage: {
      scope: 'local-browser-only',
      progressKey: BELLFLOWER_STORAGE_KEY,
      receiptKey: BELLFLOWER_RECEIPT_KEY,
    },
    receiptSchema: {
      id: BELLFLOWER_RECEIPT_SCHEMA,
      required: [
        'schema',
        'version',
        'receiptId',
        'experience',
        'route',
        'creditedTo',
        'startedAt',
        'completedAt',
        'stagesCompleted',
        'stageIds',
        'nounIds',
        'soundSource',
        'storage',
      ],
    },
    audio: {
      source: 'Original browser-native Web Audio synthesis',
      fetchedRecordings: [],
      engine:
        'Oscillators, generated pink noise, generated convolution room, per-gesture filtering and stereo position, wet/dry routing, gain staging, and dynamics limiting.',
      behavior: [
        'AudioContext is created or resumed only after a click, tap, or key gesture.',
        'A new sound gently quiets the previous voice to prevent uncontrolled stacking.',
        'Mute and replay remain available throughout the progression.',
        'Visual progression continues when Web Audio is unavailable.',
      ],
      rightsDecision: {
        researchedArchive: 'https://sound-effects.bbcrewind.co.uk/',
        researchedFaq: 'https://sound-effects.bbcrewind.co.uk/faqs',
        bbcRecordingsUsed: false,
        reason:
          'The BBC archive FAQ limits free use to non-commercial contexts and routes commercial use to Pro Sound Effects. Public PointCast use is commercial-capable, so no BBC recording is embedded without a specific compatible licence.',
      },
    },
    art: {
      liveBackgrounds: 'Existing tracked PointCast shrine artwork',
      nounSource: 'Noun portraits served by noun.pics; Nouns artwork is CC0.',
      attributionPolicy:
        'Bellflower does not label the live backgrounds as Midjourney outputs. The prompt queue is for possible future replacement art only.',
    },
    input: ['touch', 'mouse', 'Space', 'Enter'],
    reducedMotionUrl: 'https://pointcast.xyz/bellflower?motion=reduced',
    accessibility: [
      'Visible focus indicators',
      '44px minimum command targets',
      'Reduced-motion mode',
      'Live status announcements',
      'No autoplay audio',
    ],
    stages: BELLFLOWER_STAGES.map((stage) => ({
      id: stage.id,
      number: stage.number,
      title: stage.title,
      whisper: stage.whisper,
      ritual: stage.ritual,
      completion: stage.completion,
      background: stage.background,
      backgroundAlt: stage.backgroundAlt,
      nounId: stage.nounId,
      strikesRequired: stage.strikesRequired,
      accent: stage.accent,
      bloom: stage.bloom,
      sound: {
        id: stage.sound.id,
        label: stage.sound.label,
        synthesis: stage.sound,
      },
      laterArtPrompt: stage.midjourney,
    })),
  };

  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
      'Access-Control-Allow-Origin': '*',
    },
  });
};
