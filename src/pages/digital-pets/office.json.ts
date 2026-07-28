import type { APIRoute } from 'astro';
import {
  DIGITAL_PETS_DECISION_GATES,
  DIGITAL_PETS_LAUNCH_EVIDENCE,
  DIGITAL_PETS_MEASUREMENT_RULES,
  DIGITAL_PETS_NEXT_ACTIONS,
  DIGITAL_PETS_OFFICE_META,
  DIGITAL_PETS_READ_LOOP,
  DIGITAL_PETS_ROLES,
  DIGITAL_PETS_SCORECARD,
  DIGITAL_PETS_WEEKS,
} from '../../lib/digital-pets-operations';

const base = 'https://pointcast.xyz';
const absolute = (path: string) => new URL(path, base).href;

export const GET: APIRoute = async () => {
  const payload = {
    ...DIGITAL_PETS_OFFICE_META,
    url: absolute(DIGITAL_PETS_OFFICE_META.route),
    jsonUrl: absolute(DIGITAL_PETS_OFFICE_META.jsonRoute),
    campaignUrl: absolute(DIGITAL_PETS_OFFICE_META.campaignRoute),
    bookUrl: absolute(DIGITAL_PETS_OFFICE_META.bookRoute),
    launch: DIGITAL_PETS_LAUNCH_EVIDENCE,
    nextActions: DIGITAL_PETS_NEXT_ACTIONS.map((action) => ({
      ...action,
      evidenceUrl: action.evidence.startsWith('http') ? action.evidence : absolute(action.evidence),
    })),
    roles: DIGITAL_PETS_ROLES,
    weeks: DIGITAL_PETS_WEEKS.map((week) => ({
      ...week,
      dispatches: week.dispatches.map((dispatch) => ({
        ...dispatch,
        url: absolute(dispatch.path),
      })),
    })),
    readLoop: DIGITAL_PETS_READ_LOOP,
    decisionGates: DIGITAL_PETS_DECISION_GATES,
    scorecard: DIGITAL_PETS_SCORECARD.map((row) => ({
      ...row,
      url: absolute(row.url),
    })),
    measurementRules: DIGITAL_PETS_MEASUREMENT_RULES,
    disclosure:
      'This is a public operating plan, not a claim of completed engagement. Michael Hoydich reports reactions and external signals manually. Codex / OpenAI maintains the production system and public scorecard.',
  };

  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=60, s-maxage=300',
      Link: `<${absolute(DIGITAL_PETS_OFFICE_META.route)}>; rel="alternate"; type="text/html"`,
    },
  });
};
