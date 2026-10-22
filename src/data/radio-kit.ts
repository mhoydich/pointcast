/**
 * Phase 0 launch kit for Radio El Segundo — the working documents a first
 * host and producer need to make four pilot episodes of The Town Desk.
 * Shared by /radio-network/kit and /radio-network/kit.json.
 *
 * Templates, not finished copy: station IDs and credits are written in a
 * neutral station voice for a host to rework, not in Mike Hoydich's voice.
 */

export const KIT_PUBLISHED = '2026-10-22';

/** Six weeks from "yes" to four published episodes. */
export const PILOT_WEEKS = [
  {
    week: 1,
    name: 'Decide',
    tasks: [
      'Answer the open decisions on /radio-network: name, talk-first or music-first, first host',
      'Pick a fiscal sponsor or decide to run the pilot as a PointCast project for now',
      'Order the starter gear (below)',
      'Reserve the recording spot: a quiet room with soft furnishings beats a bare studio',
    ],
  },
  {
    week: 2,
    name: 'Build',
    tasks: [
      'Set up the podcast feed and a stream test page on pointcast.xyz',
      'Record a station ID set and a 30-second promo',
      'Print the consent form and the neighbor-voice question card',
      'Start the story list: 50 neighbors, businesses and groups with something to say',
    ],
  },
  {
    week: 3,
    name: 'Record',
    tasks: [
      'Record episode 1 with the rundown below; do a full listen-back the next day',
      'Collect two neighbor voices with signed consent',
      'Write the show notes and transcript (agents may draft; the host approves)',
    ],
  },
  {
    week: 4,
    name: 'Record',
    tasks: [
      'Record episode 2; fix what the listen-back of episode 1 found',
      'Ask two Main Street businesses about underwriting the pilot',
      'Draft the station rules page and the corrections log',
    ],
  },
  {
    week: 5,
    name: 'Bank',
    tasks: [
      'Record episodes 3 and 4 so the launch has a backlog',
      'Test the stream on an iPhone, an Android phone, a smart speaker and a car through CarPlay or Android Auto',
      'Brief Manus on a real-listener QA pass',
    ],
  },
  {
    week: 6,
    name: 'Launch',
    tasks: [
      'Publish episode 1 and a PointCast block announcing the pilot',
      'Put the schedule card up at three places on Main Street, with permission',
      'Count listeners for the week and log it in the station JSON',
    ],
  },
];

/** The Town Desk, a 28-minute weekly show. Times are from the top of the episode. */
export const RUNDOWN = [
  { at: '0:00', len: '0:30', item: 'Cold open', note: 'One line of tape from this week: a neighbor, a council moment, the sound of the place.' },
  { at: '0:30', len: '0:30', item: 'Station ID and theme', note: 'Use ID 1 below.' },
  { at: '1:00', len: '4:00', item: 'The week in 90245', note: 'Three to five items, each with a named, checkable source. No item without one.' },
  { at: '5:00', len: '9:00', item: 'The conversation', note: 'One guest, one subject: a business owner, a coach, a city staffer, a teacher.' },
  { at: '14:00', len: '0:30', item: 'Underwriting credit', note: 'Read as written. See the credit rules below.' },
  { at: '14:30', len: '4:00', item: 'Conditions and calendar', note: 'Tides, surf, air, the week\'s events, lost and found.' },
  { at: '18:30', len: '5:00', item: 'Neighbor voice', note: 'One resident, one story, recorded with signed consent.' },
  { at: '23:30', len: '3:00', item: 'Mailbag and corrections', note: 'Read last week\'s corrections first, then listener notes.' },
  { at: '26:30', len: '1:30', item: 'Next week and close', note: 'What is coming, how to reach the show, ID 2.' },
];

export const GEAR = [
  { item: 'Two dynamic broadcast microphones', why: 'Dynamic mics reject room noise, which matters outside a studio.' },
  { item: 'A two-input USB audio interface', why: 'Records host and guest on separate tracks.' },
  { item: 'Two pairs of closed-back headphones', why: 'Host and guest both hear themselves; nothing bleeds into the mics.' },
  { item: 'Two desk mic stands or boom arms, two pop filters', why: 'Steady distance to the mic is most of good sound.' },
  { item: 'A handheld field recorder with a windscreen', why: 'Neighbor voices, events and the beach. Wind is the enemy.' },
  { item: 'An editing app and loudness meter', why: 'Free editors are enough. Normalize every episode to the same loudness.' },
  { item: 'A hosted podcast feed and a stream server', why: 'Hosted is fine for the pilot; open-source automation comes in Phase 1.' },
];

export const STATION_IDS = [
  { id: 'ID 1 — top of show', text: 'This is Radio El Segundo. Local first, from 90245.' },
  { id: 'ID 2 — close', text: 'You have been listening to The Town Desk on Radio El Segundo, part of the PointCast Radio Network. Tell us what we missed.' },
  { id: 'ID 3 — network', text: 'Radio El Segundo, and stations up and down the South Bay. The PointCast Radio Network.' },
  { id: 'ID 4 — automation (Phase 1)', text: 'Radio El Segundo. You are listening to the overnight automated program.' },
];

export const CREDIT_RULES = [
  'Name the business and say what it is and where. That is all.',
  'No prices, discounts, "best", "call now" or "visit today".',
  'Same length every time, about 15 seconds.',
  'The host reads it as written; no ad-libbed endorsements.',
  'Underwriters never get a say in what the show covers. Say so in the agreement.',
];

export const CREDIT_TEMPLATE =
  'Support for The Town Desk comes from [business], [what it is in five to eight words], on [street] in El Segundo.';

/** Plain-language consent for recording a neighbor. Not legal advice; have counsel review before use. */
export const CONSENT = {
  title: 'Recording consent — Radio El Segundo',
  lines: [
    'I agree to be recorded by Radio El Segundo on the date below.',
    'Radio El Segundo may broadcast, stream and publish the recording, a transcript and my first name and town, on its stations and on pointcast.xyz.',
    'I may ask for my full name, last name or any part of the recording to be left out, before or after it airs. After it airs, the station will remove it from its own feeds and pages within seven days.',
    'I am 18 or older, or a parent or guardian has signed below.',
    'No payment is involved.',
  ],
  fields: ['Name', 'How you want to be credited on air', 'Email or phone for follow-up (kept private, never published)', 'Signature and date', 'Parent or guardian signature and date (if under 18)'],
  note: 'Template only. Have counsel review it before it is used.',
};

export const NEIGHBOR_QUESTIONS = [
  'How long have you been here, and what brought you?',
  'Where in town do you go that most people don\'t know about?',
  'What changed here that you miss, and what changed that you are glad about?',
  'Who should we talk to next?',
];

export const VOLUNTEER_SHIFT = [
  'Sit in on one full recording, headphones on.',
  'Run levels for one segment while the host watches.',
  'Edit one segment and compare with the host\'s edit.',
  'Record one neighbor voice with the consent form, start to finish.',
  'Read the station rules aloud with the host and ask about anything unclear.',
];

export function buildKitManifest() {
  return {
    name: 'Radio El Segundo — Phase 0 launch kit',
    status: 'templates; nothing recorded or on air',
    published: KIT_PUBLISHED,
    pilotWeeks: PILOT_WEEKS,
    townDeskRundown: RUNDOWN,
    gear: GEAR,
    stationIds: STATION_IDS,
    underwriting: { rules: CREDIT_RULES, template: CREDIT_TEMPLATE },
    consentForm: CONSENT,
    neighborQuestions: NEIGHBOR_QUESTIONS,
    volunteerFirstShift: VOLUNTEER_SHIFT,
    note: 'Station IDs and credits are neutral templates for a host to rework. The consent form needs counsel review before use.',
  };
}
