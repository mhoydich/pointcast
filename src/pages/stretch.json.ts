/**
 * /stretch.json - machine-readable mirror of /stretch (Stretch with Claude).
 */
import type { APIRoute } from 'astro';
import { GUIDE, MIN_LOGGED_SECONDS, MOODS, POSES, SAFETY, SESSIONS, STORAGE_KEY, buildTimeline, getPose } from '../lib/stretch.mjs';

export const GET: APIRoute = async () => {
  const payload = {
    $schema: 'https://pointcast.xyz/stretch.json',
    name: 'Stretch with Claude',
    description:
      'A short guided stretch and yoga break for people on phones and at desks: three sessions, a pixel figure per pose, and a before-and-after mood check-in kept in the browser.',
    home: 'https://pointcast.xyz/stretch',
    guide: {
      name: GUIDE.name,
      note: 'The guide copy is written by Claude in the PointCast house voice. It is not Mike Hoydich speaking.',
    },
    safety: SAFETY,
    archiveBlock: { id: '0763', url: 'https://pointcast.xyz/b/0763', jsonUrl: 'https://pointcast.xyz/b/0763.json' },
    sessions: SESSIONS.map((s) => {
      const timeline = buildTimeline(s);
      return {
        id: s.id,
        name: s.name,
        minutes: s.minutes,
        seconds: timeline.total,
        for: s.for,
        steps: timeline.steps.map((t) => ({ pose: t.poseId, name: getPose(t.poseId)?.name, seconds: t.seconds, startsAt: t.start })),
      };
    }),
    poses: POSES.map((p) => ({
      id: p.id,
      name: p.name,
      setting: p.setting,
      instruction: p.instruction,
      breath: p.breath,
      breathPattern: { inhale: p.pattern[0], hold: p.pattern[1], exhale: p.pattern[2], holdAfter: p.pattern[3] },
      ...(p.sides ? { sides: 'first side, then the other side for the second half of the hold' } : {}),
      easeOffIf: p.easeOff,
      ...(p.optional ? { optional: p.optional } : {}),
      plannedImage: `https://pointcast.xyz/images/stretch/${p.id}.png`,
    })),
    images: 'The page draws each pose as a pixel figure on canvas. plannedImage plates are prompted in scripts/plates/batch/stretch.json and may not exist yet.',
    moods: MOODS,
    storage: {
      localStorageKey: STORAGE_KEY,
      stores: ['sound on or off', 'logged session count', 'seconds actually stretched (skipped poses do not count)', 'last ten sessions with before and after mood'],
      minimumLoggedSeconds: MIN_LOGGED_SECONDS,
      optional: 'pc:mood is written only if the visitor opts in after a session, and only for moods with a plain site match (calm, hyped, curious, tired, low).',
      serverPersistence: false,
    },
    timing: 'The clock keeps running in a background tab or while the phone app is switched away, until you pause.',
    controls: { space: 'pause or resume', arrowRight: 'next pose', arrowLeft: 'previous pose (or restart this one)', m: 'sound on or off' },
    related: [
      { label: 'Ocean Meditation', url: 'https://pointcast.xyz/meditate' },
      { label: 'Breathe California', url: 'https://pointcast.xyz/breathe-california' },
      { label: 'Drum Meditate', url: 'https://pointcast.xyz/drum-meditate' },
      { label: 'Moods', url: 'https://pointcast.xyz/moods' },
      { label: 'PMM', url: 'https://pointcast.xyz/pmm/' },
    ],
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
