export const SKILL_LINE = {
  id: 'PC-BEACH-COMMONS-V18-SKILL-LINE',
  title: 'The Skill Line',
  subtitle: 'Bring one thing. Ask for one counterpart. Open one line.',
  dek: 'A consent-forward call for makers, repairers, teachers, testers, hosts, documentarians, movers, and coordinators around the Radius 25 working pairs.',
  url: 'https://pointcast.xyz/beach-commons/v18/skills',
  jsonUrl: 'https://pointcast.xyz/beach-commons/v18/skills.json',
  blockUrl: 'https://pointcast.xyz/b/0549',
  publishedAt: '2026-07-31',
  updatedAt: '2026-07-31T23:20:00-07:00',
  contact: 'hello@pointcast.xyz',
  status: 'Independent editorial call and browser-local declaration instrument. No event, job, public registry, funded role, or automatic match is announced.',
} as const;

export const SKILL_LANES = [
  { id: 'make', number: '01', title: 'Make + build', verb: 'fabricate', color: '#e5ad38', prompt: 'I can turn a sketch into a useful object, fixture, textile, circuit, vessel, or small run.' },
  { id: 'repair', number: '02', title: 'Repair + maintain', verb: 'keep working', color: '#df6242', prompt: 'I can diagnose failure, service materials, design for return, or teach maintenance.' },
  { id: 'teach', number: '03', title: 'Teach + explain', verb: 'make legible', color: '#7667a8', prompt: 'I can translate a hard system, coach a first attempt, demonstrate a method, or build a lesson.' },
  { id: 'test', number: '04', title: 'Test + measure', verb: 'prove', color: '#247f9f', prompt: 'I can instrument, observe, audit, compare, inspect, or name what would count as evidence.' },
  { id: 'host', number: '05', title: 'Host + welcome', verb: 'open the room', color: '#c34f70', prompt: 'I can make arrival clear, hold a table, support access, pace a gathering, or help people feel expected.' },
  { id: 'document', number: '06', title: 'Document + translate', verb: 'carry the story', color: '#4594a2', prompt: 'I can photograph, record, draw, write, map, edit, caption, translate, or make instructions travel.' },
  { id: 'move', number: '07', title: 'Move + source', verb: 'complete the handoff', color: '#a77737', prompt: 'I can procure, pack, route, transport, inventory, return, or connect a material to its next useful stop.' },
  { id: 'coordinate', number: '08', title: 'Coordinate + steward', verb: 'hold the edges', color: '#4d936c', prompt: 'I can schedule, budget, moderate, check consent, protect habitat, close loops, or give a project a clean ending.' },
] as const;

export const OPEN_BRIEFS = [
  {
    id: 'salt-air-repair', number: '01', title: 'Salt-Air Repair Bench',
    question: 'Can one portable bench make beach gear easier to inspect, clean, patch, and return?',
    finish: 'One packed bench, four repeat repairs, a material log, and everything removed.',
    needs: ['repair', 'make', 'document'], pair: 'Repairable coast kit', window: 'One afternoon proof',
  },
  {
    id: 'shade-that-returns', number: '02', title: 'Shade That Returns',
    question: 'What reversible shade room feels calm, carries by hand, and tells every part how to go home?',
    finish: 'Three assemblies, one access pass, one wind stop rule, and a complete pack-out.',
    needs: ['make', 'test', 'host'], pair: 'Sea meets space', window: 'Ninety-day build',
  },
  {
    id: 'hard-thing', number: '03', title: 'Explain the Hard Thing',
    question: 'Can a difficult regional system become a ten-minute public lesson without losing the truth?',
    finish: 'One diagram, one demonstration, three listener tests, and a corrected field card.',
    needs: ['teach', 'document', 'test'], pair: 'Explain a hard system', window: 'Two-week studio',
  },
  {
    id: 'arrival-handoff', number: '04', title: 'The Arrival Handoff',
    question: 'Can a traveler move from a regional gateway to one local experience without confusion or a private car?',
    finish: 'One tested route, one accessible alternative, one multilingual card, and honest timing.',
    needs: ['move', 'host', 'document'], pair: 'Arrival field guide', window: 'One route test',
  },
  {
    id: 'field-sound', number: '05', title: 'Field Sound Line',
    question: 'What can wind, waves, tools, and short voices teach when the recording setup stays small?',
    finish: 'A twenty-minute listening sequence, full credits, safe levels, and no captured conversation without consent.',
    needs: ['document', 'test', 'coordinate'], pair: 'Public problem studio', window: 'One listening day',
  },
  {
    id: 'elements-score', number: '06', title: 'Elements Score',
    question: 'Can sun, wind, water, and changing light become fair rules for a public game?',
    finish: 'Four element rules, one weather cancellation rule, one access adaptation, and a playable score.',
    needs: ['host', 'test', 'coordinate'], pair: 'Elements league', window: 'One seasonal rehearsal',
  },
] as const;

export const COMMUNICATION_MODES = [
  { id: 'copy', title: 'Copy only', detail: 'Make the card and keep it in your clipboard. PointCast receives nothing.' },
  { id: 'share', title: 'Open share sheet', detail: 'Your device lets you choose the person or app. Nothing is auto-posted.' },
  { id: 'relay', title: 'Request one introduction', detail: 'Open an email draft to PointCast. You review and send it; a match is never promised.' },
] as const;

export const BOARD_RULES = [
  'Declare a capability, not a personality category or permanent communal role.',
  'Ask for one counterpart around one finishable brief; broad networking comes later.',
  'Use an alias if you prefer. Do not place private contact details in text you plan to post publicly.',
  'A relay means permission for one bounded introduction, not a mailing list or public directory.',
  'Skilled labor, production, hosting, and review should be paid when a project becomes real.',
  'Anyone can decline, pause, leave, or ask for their introduction request to be deleted.',
  'No beach, campus, shop, workplace, agency, or venue is available until its actual steward says so.',
  'The first score is whether a small thing finished safely, usefully, accessibly, and with a clean ending.',
] as const;

export const SIGNAL_TEMPLATE = {
  title: 'RADIUS 25 · SKILL SIGNAL',
  emptyAlias: 'A neighbor in the 25-mile field',
  defaultBring: 'I can bring one concrete, inspectable skill.',
  defaultNeed: 'I am looking for one counterpart who can help finish the proof.',
} as const;

export function laneById(id: string) {
  return SKILL_LANES.find((lane) => lane.id === id) ?? SKILL_LANES[0];
}

export function briefById(id: string) {
  return OPEN_BRIEFS.find((brief) => brief.id === id) ?? OPEN_BRIEFS[0];
}
