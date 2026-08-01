import type { APIRoute } from 'astro';
import { BOARD_RULES, COMMUNICATION_MODES, OPEN_BRIEFS, SIGNAL_TEMPLATE, SKILL_LANES, SKILL_LINE } from '../../../lib/beach-commons-skill-line';

export const GET: APIRoute = () => new Response(JSON.stringify({
  ...SKILL_LINE,
  premise: 'Declare one concrete capability, choose one finishable brief, ask for one counterpart, and decide exactly which communication action you welcome.',
  skillLanes: SKILL_LANES,
  openBriefs: OPEN_BRIEFS,
  communicationModes: COMMUNICATION_MODES,
  signalTemplate: SIGNAL_TEMPLATE,
  boardRules: BOARD_RULES,
  interaction: {
    availability: 'human HTML companion only',
    composition: 'browser-local and ephemeral',
    actions: ['copy to clipboard', 'open operating-system share sheet', 'open user-controlled email draft'],
    automaticPosting: false,
    automaticMatching: false,
    publicDirectory: false,
    storage: false,
    cookies: false,
    analytics: false,
    identity: false,
    geolocation: false,
    registration: false,
    networkWrites: false,
  },
  methodology: {
    companionTo: 'https://pointcast.xyz/beach-commons/v18',
    status: 'The six briefs are editorial seeds. They are not scheduled events, funded jobs, active teams, permitted activities, partner requests, or proof that a real person has volunteered.',
    privacy: 'No declaration is stored or published by the page. Copy remains user-controlled clipboard state. Share opens the device share chooser. Email opens a draft to hello@pointcast.xyz; the visitor decides whether to send it.',
    relay: 'A relay request permits at most one bounded introduction. It is not consent to a mailing list, public directory, promotion, or unrestricted sharing. PointCast does not promise a reply or match.',
    labor: 'Skilled labor, hosting, production, and qualified review should be paid when an editorial seed becomes real work.',
    activityBoundary: 'No coalition, event, job, role, match, payment, funding, permit, site, procurement, physical setup, environmental activity, public program, or partnership is announced or promised.',
  },
}, null, 2), { headers: {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'public, max-age=300, s-maxage=3600',
  'Access-Control-Allow-Origin': '*',
  Link: '<https://pointcast.xyz/beach-commons/v18/skills>; rel="alternate"; type="text/html"',
} });
