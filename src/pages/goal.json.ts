import type { APIRoute } from 'astro';
import { GOAL_RELEASE, GOAL_TYPE_LABELS, GOAL_WITNESSES, HORIZON_BANDS, MACHINE_LOOPS, MACHINE_META, MACHINE_NOTES, MACHINE_PRINCIPLES, SEED_GOALS } from '../lib/goalMachine';

export const GET: APIRoute = async () => {
  const payload = {
    $schema: 'https://pointcast.xyz/goal.json',
    name: MACHINE_META.title,
    subtitle: MACHINE_META.subtitle,
    tagline: MACHINE_META.tagline,
    thesis: MACHINE_META.thesis,
    release: {
      marker: GOAL_RELEASE.version,
      label: GOAL_RELEASE.label,
      storageSchema: GOAL_RELEASE.storageSchema,
      storageKey: GOAL_RELEASE.storageKey,
      v9JournalKey: GOAL_RELEASE.journalKey,
      fieldWitnessTag: GOAL_RELEASE.fieldWitnessTag,
    },
    v1: {
      name: 'The Field + The Witness',
      field: {
        metaphor: 'A browser-local El Segundo soccer field with one goal post. The active goal is a glowing pixel ball.',
        progressMath: 'marks.length / horizon, capped at 100%. One daily mark moves the ball one yard-step toward the post.',
        pastGoals: 'The last 10 kept, retired-honestly, or abandoned goals render as ghost balls in the back of the net.',
      },
      witness: {
        source: 'V9 Fellowship companion pattern, compacted for /goal.',
        default: 'gandalf',
        fieldName: 'goalWitness',
        companions: GOAL_WITNESSES.map((w) => ({
          id: w.id,
          name: w.name,
          mark: w.mark,
          stand: w.stand,
          role: w.role,
          accent: w.accent,
        })),
      },
      completion: {
        status: 'kept',
        journalWrite: true,
        journalTags: [GOAL_RELEASE.fieldWitnessTag, 'goal-machine', GOAL_RELEASE.version],
        keepsake: 'Stamped pixel postcard rendered inline after completion.',
      },
      migration: {
        legacyV0Shape: 'A direct goal object at pointcast.goal.machine.v0 still loads.',
        v1Shape: 'The same key normalizes to an envelope with activeGoal, pastGoals, lastKeepsake, lastSpeech, and updatedAt.',
        dataLossPolicy: 'Replacing an active goal archives the old one as abandoned; retiring archives it as retired-honestly.',
      },
    },
    authors: MACHINE_META.authors,
    principles: MACHINE_PRINCIPLES,
    goalTypes: GOAL_TYPE_LABELS,
    witnesses: GOAL_WITNESSES,
    seedGoals: SEED_GOALS,
    machineLoops: MACHINE_LOOPS,
    horizonBands: HORIZON_BANDS,
    notes: MACHINE_NOTES,
    counts: {
      seedGoals: SEED_GOALS.length,
      principles: MACHINE_PRINCIPLES.length,
      loops: MACHINE_LOOPS.length,
      bands: HORIZON_BANDS.length,
    },
    generatedAt: new Date().toISOString(),
    human: 'https://pointcast.xyz/goal',
    parent: 'https://pointcast.xyz/university-of-el-segundo',
    related: {
      ues: 'https://pointcast.xyz/university-of-el-segundo',
      commons: 'https://pointcast.xyz/commons',
      marineLayer: 'https://pointcast.xyz/marine-layer',
      civicLayer: 'https://pointcast.xyz/civic-layer',
      commonForms: 'https://pointcast.xyz/common-forms',
    },
  };
  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=300', 'Access-Control-Allow-Origin': '*' },
  });
};
