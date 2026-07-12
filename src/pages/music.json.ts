/**
 * /music.json — agent + human-readable catalog of the pointcast music landscape.
 *
 * Companion to the human-facing /town-music and /sprint-overnight-2026-05-10
 * dashboard pages. This endpoint gives downstream consumers (other agents,
 * automated indexers, future plugins) a single source of truth for "what
 * music surfaces exist on pointcast.xyz, and what role does each play in
 * the listen→understand→play→create→capstone journey?"
 *
 * Schema is permissive — additive only. Versioned via `version` at the root.
 */

import type { APIRoute } from 'astro';

interface MusicPage {
  /** Where to find it on the site. */
  path: string;
  /** Human-readable title. */
  name: string;
  /** Which phase of the journey: listen / understand / play / create / capstone / meta. */
  phase: 'listen' | 'understand' | 'play' | 'create' | 'capstone' | 'meta';
  /** Short description, ~1 sentence. */
  description: string;
  /** Tags for filtering. */
  tags: string[];
  /** Persistent state key in localStorage (if any). */
  localStorageKey?: string;
  /** Whether this page produces a downloadable artifact. */
  exportable?: boolean;
  /** Date this page first shipped (YYYY-MM-DD). */
  shippedOn?: string;
  /** Lines of code in the page (rough). */
  approxLines?: number;
}

const MUSIC_PAGES: MusicPage[] = [
  // ---------- LISTEN ----------
  {
    path: '/cast-music-pro',
    name: 'Cast Music Pro',
    phase: 'listen',
    description: 'Spotify-shaped music app for the drum hub. UI polish layer with real typography hierarchy, animated album art, lyric tickers, onboarding modal, Wrapped-style summary.',
    tags: ['ui-polish', 'listen', 'spotify-shaped'],
    localStorageKey: 'pc-cmp-saved · pc-cmp-playlists · pc-cmp-recent · pc-cmp-plays',
    shippedOn: '2026-05-08',
    approxLines: 1615,
  },
  {
    path: '/cast-studio',
    name: 'Cast Studio',
    phase: 'listen',
    description: 'Synth engine depth pass. 8-bar arrangements per song, per-artist sound design, voice-led chord progressions, mastering bus (glue compression + soft clip + limiter), send-based reverb + delay.',
    tags: ['synth-engine', 'listen', 'mastering-bus'],
    shippedOn: '2026-05-08',
    approxLines: 1327,
  },
  {
    path: '/cast-real',
    name: 'Cast Real',
    phase: 'listen',
    description: 'Real recorded instrument samples loaded from the gleitz/midi-js-soundfonts CDN. Each Noun artist gets a different real instrument (trumpet, vibraphone, flute, choir pad). Drums stay synthesized.',
    tags: ['real-samples', 'listen', 'cdn-dependency'],
    shippedOn: '2026-05-08',
    approxLines: 999,
  },

  // ---------- UNDERSTAND ----------
  {
    path: '/drum-academy',
    name: 'Drum Academy',
    phase: 'understand',
    description: 'Ten interactive Web Audio lessons hosted by Noun teachers. Stereo, binaural, waveforms, AM, FM, reverb, compression, Karplus-Strong, ADSR, filter sweep.',
    tags: ['theory', 'understand', 'lessons'],
    shippedOn: '2026-05-09',
    approxLines: 1564,
  },

  // ---------- PLAY ----------
  {
    path: '/drum-school',
    name: 'Drum School',
    phase: 'play',
    description: 'Seven mini-games training real musical skills. Beat keeping, chord recognition, interval ear, rhythm echo, key recognition, tempo tap, melody memory. Star-based progression (max 21).',
    tags: ['ear-training', 'play', 'star-system'],
    localStorageKey: 'pc-ds-stars',
    shippedOn: '2026-05-09',
    approxLines: 1396,
  },

  // ---------- CREATE ----------
  {
    path: '/cast-make',
    name: 'Cast Make',
    phase: 'create',
    description: 'A 4-bar tiny composer. Pick a Noun kit, sketch chords, toggle drums, pick a lead phrase. Save 3 compositions, share via URL hash, render to a downloadable WAV.',
    tags: ['composer', 'create', '4-bar', 'wav-export'],
    localStorageKey: 'pc-make-slot-1 · pc-make-slot-2 · pc-make-slot-3',
    exportable: true,
    shippedOn: '2026-05-08',
    approxLines: 975,
  },
  {
    path: '/cast-make-pro',
    name: 'Cast Make Pro',
    phase: 'create',
    description: 'Pro-tier 8-bar composer. Per-bar drum patterns, 4-level velocity, swing slider, per-bar lead phrases, pad voicings, multi-track WAV+ZIP export, undo/redo, 8 save slots.',
    tags: ['composer', 'create', '8-bar', 'wav-export', 'multi-track', 'undo'],
    localStorageKey: 'pc-mp-slot-1 … pc-mp-slot-8',
    exportable: true,
    shippedOn: '2026-05-10',
    approxLines: 2170,
  },

  // ---------- CAPSTONE ----------
  {
    path: '/cast-graduate',
    name: 'Cast Graduate',
    phase: 'capstone',
    description: 'Reads your /drum-school stars + /cast-make compositions and awards a rank (Apprentice → Maestro). Generates a personalized "graduating-class Noun" deterministically from your progress.',
    tags: ['capstone', 'diploma', 'progression'],
    shippedOn: '2026-05-10',
    approxLines: 602,
  },

  // ---------- META / DISCOVERY ----------
  {
    path: '/town-music',
    name: 'Town Music',
    phase: 'meta',
    description: 'Music landscape dashboard. Surfaces all pages in the journey plus your local state: recently heard, your compositions, star rankings, a journey-map visualization.',
    tags: ['dashboard', 'meta', 'discovery'],
    shippedOn: '2026-05-10',
    approxLines: 679,
  },
  {
    path: '/sprint-overnight-2026-05-10',
    name: 'Overnight Sprint Dashboard',
    phase: 'meta',
    description: 'Public scoreboard of the 2026-05-10 overnight sprint. Seven parallel agents ship seven PRs in one night. Cards show PR #, merge SHA, line count per task.',
    tags: ['dashboard', 'meta', 'sprint-artifact'],
    shippedOn: '2026-05-11',
    approxLines: 311,
  },
];

const JOURNEY = [
  { phase: 'listen',     label: 'Listen',     intent: 'Hear what the drum hub can make.' },
  { phase: 'understand', label: 'Understand', intent: 'Learn how Web Audio primitives work.' },
  { phase: 'play',       label: 'Play',       intent: 'Train your ear and rhythm.' },
  { phase: 'create',     label: 'Create',     intent: 'Make your own song.' },
  { phase: 'capstone',   label: 'Capstone',   intent: 'See your progress as a diploma.' },
  { phase: 'meta',       label: 'Meta',       intent: 'Discover the landscape.' },
] as const;

export const GET: APIRoute = async () => {
  const payload = {
    $schema: 'https://pointcast.xyz/music.schema.json',
    version: 1,
    name: 'PointCast Music Landscape',
    description:
      'A catalog of the pointcast.xyz music app: every page in the listen → understand → play → create → capstone journey, with phase, description, persistent-state keys, and exportable flags. Intended for agents, plugins, and downstream tooling that want to discover or link into the music surfaces.',
    generatedAt: new Date().toISOString(),
    canonical: 'https://pointcast.xyz/music.json',
    landingPages: [
      'https://pointcast.xyz/town-music',
      'https://pointcast.xyz/sprint-overnight-2026-05-10',
    ],
    journey: JOURNEY,
    pages: MUSIC_PAGES.map((p) => ({
      ...p,
      canonicalUrl: `https://pointcast.xyz${p.path}`,
    })),
    counts: {
      pages: MUSIC_PAGES.length,
      byPhase: Object.fromEntries(
        JOURNEY.map((j) => [
          j.phase,
          MUSIC_PAGES.filter((p) => p.phase === j.phase).length,
        ]),
      ),
      totalApproxLines: MUSIC_PAGES.reduce((acc, p) => acc + (p.approxLines || 0), 0),
    },
    sharedLibraries: {
      'src/lib/audio-scheduler.ts': {
        purpose: 'Tiny shared Web Audio scheduler. trackSource() registers sources for stopAll(); schedule(fn, atCtxTime) parks timers across pause/resume. Adopted by cast-music-pro, cast-studio, cast-real, cast-make, cast-make-pro, drum-school.',
        adopters: [
          '/cast-music-pro',
          '/cast-studio',
          '/cast-real',
          '/cast-make',
          '/cast-make-pro',
          '/drum-school',
        ],
        notAdopted: [
          '/drum-academy (manual disconnect in each lesson stop() — punch-list item #6)',
        ],
      },
    },
    auditTrail: {
      latestAudit: 'docs/audit-2026-05-10-audio.md',
      punchListFixes: [
        { pr: 568, sha: 'c1c6302', items: '1-6 (BUGs + RACE + LEAKs)' },
        { pr: 574, sha: 'e3d0a56', items: '7-11 (POLISH + A11Y + PERF + BUG)' },
      ],
      deferredItems: [
        '12 — truncated-MP3 sanity check in cast-real (defer per audit note)',
      ],
    },
  };

  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'public, max-age=300, s-maxage=300',
    },
  });
};
