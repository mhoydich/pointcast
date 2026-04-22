/**
 * /houseplants.json - machine-readable mirror of the houseplant learning lab.
 */
import type { APIRoute } from 'astro';
import {
  CARE_LIGHT_OPTIONS,
  HOUSEPLANT_DIAGNOSTICS,
  HOUSEPLANT_LESSONS,
  HOUSEPLANT_PROFILES,
  HOUSEPLANT_SOURCES,
} from '../lib/houseplants';

export const GET: APIRoute = async () => {
  const payload = {
    $schema: 'https://pointcast.xyz/houseplants.json',
    name: 'Houseplant learning lab',
    description:
      'A practical learning module for indoor plant care: light, watering, soil, humidity, feeding, repotting, propagation, symptoms, and common plant profiles.',
    home: 'https://pointcast.xyz/houseplants',
    generatedAt: new Date().toISOString(),
    sourceBlock: {
      id: '0333',
      url: 'https://pointcast.xyz/b/0333',
      jsonUrl: 'https://pointcast.xyz/b/0333.json',
    },
    learningModel: {
      premise: 'Plants are easier to care for when you read the environment before treating the symptom.',
      sequence: ['light', 'water', 'air in the root zone', 'humidity', 'feeding', 'repotting', 'propagation', 'diagnosis'],
      ruleOfThumb: 'Change one variable at a time and observe new growth, not old damage.',
    },
    lightOptions: CARE_LIGHT_OPTIONS,
    lessons: HOUSEPLANT_LESSONS,
    profiles: HOUSEPLANT_PROFILES,
    diagnostics: HOUSEPLANT_DIAGNOSTICS,
    sources: HOUSEPLANT_SOURCES,
    adjacent: {
      nature: 'https://pointcast.xyz/nature',
      natureJson: 'https://pointcast.xyz/nature.json',
      gardenChannel: 'https://pointcast.xyz/c/garden',
      local: 'https://pointcast.xyz/local',
      localJson: 'https://pointcast.xyz/local.json',
    },
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
