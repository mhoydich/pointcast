import type { APIRoute } from 'astro';
import {
  HAPTIC_DREAMS,
  HAPTIC_DREAMS_PLAYS,
  HAPTIC_DREAMS_SOURCES,
  HAPTIC_PATTERNS,
} from '../lib/pointcast-haptic-dreams';

export const GET: APIRoute = () =>
  new Response(
    JSON.stringify(
      {
        ...HAPTIC_DREAMS,
        status: 'published replay prototype',
        counts: {
          selectedPlays: HAPTIC_DREAMS_PLAYS.length,
          hapticPatterns: HAPTIC_PATTERNS.length,
          outputModes: 3,
          sources: HAPTIC_DREAMS_SOURCES.length,
        },
        protocol: {
          input: ['team', 'quarter', 'clock', 'possession', 'yards', 'result', 'score'],
          translation: ['direction', 'distance', 'duration', 'intensity', 'consequence'],
          outputs: ['eight-zone haptic sleeve', 'illustrated world', 'quiet generated sound', 'text translation'],
          sharedTransport: 'Browser BroadcastChannel synchronizes selected-play state between local tabs.',
        },
        patterns: HAPTIC_PATTERNS,
        plays: HAPTIC_DREAMS_PLAYS,
        sources: HAPTIC_DREAMS_SOURCES,
        artwork: {
          artist: 'Jon Snow',
          commissioner: 'KansasDAO / Adventure Networks',
          works: ['Art Deco Lion', 'Art Deco Train'],
          treatment: 'Web-sized derivatives of the original supplied PNG exports; no generative imitation or redraw.',
          localUse: 'The lion supplies the heraldic sigil. The train carries possession and momentum.',
        },
        editorialBoundary: {
          official: false,
          liveFeed: false,
          completePlayByPlay: false,
          medicalDevice: false,
          certifiedHardware: false,
          tokenOrNftOffer: false,
          note: HAPTIC_DREAMS.boundary,
        },
        discovery: {
          human: HAPTIC_DREAMS.canonical,
          machine: HAPTIC_DREAMS.machine,
          magazine: 'https://pointcast.xyz/25/magazine',
          sourcePlayByPlay: HAPTIC_DREAMS_SOURCES[0].url,
        },
      },
      null,
      2,
    ),
    {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=300, s-maxage=3600',
        'Access-Control-Allow-Origin': '*',
      },
    },
  );
