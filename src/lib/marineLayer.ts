/**
 * Marine Layer — University of El Segundo's meditative track (Track 07).
 *
 * Place-based sitting practice anchored to El Segundo geography.
 * Page: /marine-layer · JSON: /marine-layer.json
 */

export type MarineLayerSession = {
  week: number;
  slug: string;
  title: string;
  place: string;
  timeOfDay: string;
  duration: string;
  breath: string;
  prompt: string;
  artifact: string;
};

export const MARINE_LAYER_SESSIONS: MarineLayerSession[] = [
  { week: 1, slug: 'plaza-dawn-sit', title: 'Plaza Dawn Sit', place: 'Plaza El Segundo, north fountain bench', timeOfDay: 'predawn, before commerce wakes', duration: '30 min', breath: '4–7–8 (in 4, hold 7, out 8) — eight rounds, then natural breath.', prompt: 'Name one thing the marine layer is hiding from you right now.', artifact: 'A one-line note posted to the session log.' },
  { week: 2, slug: 'powerline-walk', title: 'Powerline Walk', place: 'Powerline easement above town, looking west toward Chevron', timeOfDay: 'first light', duration: '40 min walk + 10 min sit', breath: 'Box breath 4–4–4–4 while walking, paced to footfall.', prompt: 'Hold one civic worry for ten breaths, then set it down beside the path.', artifact: 'A photograph of where you set it down.' },
  { week: 3, slug: 'imperial-blue-hour', title: 'Imperial Blue Hour', place: 'Imperial Avenue overlook, top of the dunes', timeOfDay: 'sunset into blue hour', duration: '30 min', breath: 'Counted breath to sixty, restart on any drift.', prompt: 'Name one person you owe a small follow-up to. Do not draft the message yet.', artifact: 'The follow-up sent within 24 hours, logged as done.' },
  { week: 4, slug: 'library-quiet-hour', title: 'Library Quiet Hour', place: 'El Segundo Public Library, second-floor reading room', timeOfDay: 'midweek afternoon', duration: '50 min, no screens', breath: 'Natural breath. Counted only when the room hums.', prompt: 'Open one book at random. The first sentence becomes the koan for the week.', artifact: 'The sentence written out by hand, photographed, posted.' },
  { week: 5, slug: 'flight-path-sit', title: 'Flight-Path Sit', place: 'El Porto sand, directly under the LAX 25R approach', timeOfDay: 'evening rush, eyes closed', duration: '20 min', breath: 'Resonant 5.5–5.5 in nose, out nose. Plane sounds are the bell.', prompt: 'Each plane is someone arriving from somewhere. Bless one of them.', artifact: 'A tally count of planes — the day you stopped counting becomes a note.' },
  { week: 6, slug: 'refinery-lights', title: 'Refinery Lights', place: 'Chevron edge, sidewalk along El Segundo Boulevard', timeOfDay: 'dusk, when the towers light up', duration: '25 min', breath: 'Coherent 5–5, eyes soft on a single flare.', prompt: 'Notice the parts of the city you usually pretend are not here.', artifact: 'One sentence about what you saw — no judgment, just description.' },
  { week: 7, slug: 'court-stillness', title: 'Court Stillness', place: 'Recreation Park pickleball courts, between game windows', timeOfDay: 'whenever the court empties for ten minutes', duration: '10 min sit at the center mark', breath: 'Long exhale, double the inhale.', prompt: 'The body that was just running is now just standing. Welcome it back.', artifact: 'Written into the Honey League log as a Bring action (1 point).' },
  { week: 8, slug: 'pier-closer', title: 'Pier Closer', place: 'Manhattan Beach pier (radius edge — frame as edge sit)', timeOfDay: 'last light, walking out and back', duration: '60 min, including the closing roster', breath: 'Long exhale, eyes on horizon, no count.', prompt: 'Who hosts the next First Sit, and where? Lock it before the room dissolves.', artifact: 'The next steward named, the next date set, posted to the session log.' },
];

export const FIRST_MARINE_FORMAT = [
  { minutes: '0-10', label: 'Arrive in fog', detail: 'No introductions yet. Park, walk to the bench, sit. The room assembles itself.' },
  { minutes: '10-20', label: 'Frame', detail: 'What Marine Layer is, what it is not, how a place-based sitting practice differs from an app timer.' },
  { minutes: '20-50', label: 'First sit', detail: 'Thirty minutes. 4–7–8 for the first eight rounds, then natural breath. The marine layer is the bell.' },
  { minutes: '50-65', label: 'One round of names', detail: 'One sentence each: where you sat, what you noticed, no commentary from anyone else.' },
  { minutes: '65-75', label: 'Lock the eight', detail: 'Pick the next session, name a steward, and put the eight-week calendar on the wall.' },
];

export const MARINE_LAYER_STEWARDSHIP = [
  { role: 'Sitter', threshold: 'attend one session', detail: 'Show up. Sit. Post the one-line artifact to the log within the same day.' },
  { role: 'Bell', threshold: 'three sessions', detail: 'Carries the timer, opens and closes the sit, and welcomes the first-timers.' },
  { role: 'Place', threshold: 'host one sit', detail: 'Picks the location, posts the time, brings nothing else. The place is the curriculum.' },
  { role: 'Layer', threshold: 'host the eight', detail: 'Carries one full eight-week cycle, hands the calendar to the next Layer at the Pier Closer.' },
];

export const MARINE_LAYER_PRINCIPLES = [
  'The place is the curriculum. We do not import a meditation, we let the location teach the breath.',
  'No app required. The /meditate room is a tool, not the room. The room is El Segundo.',
  'One artifact per sit. Small, public, and dated. A note, a photo, a count, a name.',
  'Silence outranks insight. We do not summarize what someone said in the round of names.',
  'The marine layer is the bell. If you cannot hear traffic, planes, surf, or fog, you are sitting in the wrong place.',
];
