/**
 * PointCast Radio Network — the plan for a community radio station in
 * El Segundo and a network of sister stations in the towns around it.
 * One source for /radio-network and /radio-network.json.
 *
 * This is a plan, not a station. Nothing is on air, no frequency is held,
 * no host is appointed. Regulatory notes describe how each path works in
 * general and must be checked with an engineer or counsel before acting.
 */

import { RADIO_ASSIGNMENTS, RADIO_ASSIGNMENTS_STATUS } from './radio-roles.ts';

export const RADIO_BASE = 'https://pointcast.xyz/radio-network';
export const RADIO_PUBLISHED = '2026-10-20';
export const RADIO_STATUS = 'plan published; nothing on air; every seat open';

export type Station = {
  slug: string;
  name: string;
  town: string;
  zip: string;
  role: 'flagship' | 'sister';
  phase: number;
  localHours: string;
  beat: string[];
  firstShow: string;
};

export const STATIONS: Station[] = [
  {
    slug: 'el-segundo',
    name: 'Radio El Segundo',
    town: 'El Segundo',
    zip: '90245',
    role: 'flagship',
    phase: 0,
    localHours: 'Network origin. Local all day; feeds the network block.',
    beat: ['Main Street and Richmond Street', 'Smoky Hollow makers and breweries', 'Rec Park courts and the Plunge', 'Dockweiler and the beach', 'City Council and school board', 'LAX, the refinery and the plant next door'],
    firstShow: 'The Town Desk — a weekly half hour of what happened in 90245 and what is coming.',
  },
  {
    slug: 'manhattan-beach',
    name: 'Radio Manhattan Beach',
    town: 'Manhattan Beach',
    zip: '90266',
    role: 'sister',
    phase: 1,
    localHours: '4 local hours a day; network the rest.',
    beat: ['The pier and the Strand', 'Volleyball and youth sports', 'Downtown and North Manhattan Beach businesses', 'Schools'],
    firstShow: 'Sand Report — beach, volleyball and youth sports, Saturday mornings.',
  },
  {
    slug: 'hermosa-beach',
    name: 'Radio Hermosa',
    town: 'Hermosa Beach',
    zip: '90254',
    role: 'sister',
    phase: 2,
    localHours: '4 local hours a day; network the rest.',
    beat: ['Pier Plaza and live music rooms', 'Surf and the Strand', 'Small-city politics'],
    firstShow: 'Pier Plaza Live — local bands recorded in the rooms they play.',
  },
  {
    slug: 'redondo-beach',
    name: 'Radio Redondo',
    town: 'Redondo Beach',
    zip: '90277 / 90278',
    role: 'sister',
    phase: 2,
    localHours: '4 local hours a day; network the rest.',
    beat: ['The harbor, the pier and King Harbor boats', 'Riviera Village', 'North Redondo neighborhoods'],
    firstShow: 'Harbor Hour — boats, fishing reports and the people who work the pier.',
  },
  {
    slug: 'playa-del-rey',
    name: 'Radio Playa',
    town: 'Playa del Rey and Westchester',
    zip: '90293 / 90045',
    role: 'sister',
    phase: 2,
    localHours: '2 local hours a day; network the rest.',
    beat: ['Ballona wetlands', 'Westchester\'s Triangle and Loyola Marymount', 'Living under the LAX flight path'],
    firstShow: 'Under the Approach — the neighborhoods north of the runways.',
  },
  {
    slug: 'hawthorne-lawndale',
    name: 'Radio Hawthorne',
    town: 'Hawthorne and Lawndale',
    zip: '90250 / 90260',
    role: 'sister',
    phase: 3,
    localHours: '2 local hours a day, bilingual; network the rest.',
    beat: ['Aerospace workforce', 'Hawthorne Boulevard businesses', 'Schools and youth leagues', 'Spanish-language programming'],
    firstShow: 'Turno de Noche — a bilingual evening show for people coming off shift.',
  },
  {
    slug: 'torrance',
    name: 'Radio Torrance',
    town: 'Torrance',
    zip: '90501–90510',
    role: 'sister',
    phase: 3,
    localHours: '2 local hours a day; network the rest.',
    beat: ['Old Torrance', 'Japanese American community and businesses', 'Del Amo and the industrial corridor'],
    firstShow: 'Old Torrance Exchange — merchants, history and a call-in.',
  },
];

/** One hour on any station. Local stations own the bold slots. */
export const CLOCK = [
  { at: ':00', len: '2 min', what: 'Station ID, time, top local headline', who: 'Local, live or recorded' },
  { at: ':02', len: '18 min', what: 'Program segment (show, music block or feature)', who: 'Local or network' },
  { at: ':20', len: '6 min', what: 'Town Desk — two or three local items, sourced', who: 'Local' },
  { at: ':26', len: '4 min', what: 'Conditions — tides, swell, air, sun, LAX flow', who: 'Network desk agents, read by a labeled synthetic voice or a host' },
  { at: ':30', len: '15 min', what: 'Program segment', who: 'Local or network' },
  { at: ':45', len: '5 min', what: 'Community calendar and lost-and-found', who: 'Local' },
  { at: ':50', len: '8 min', what: 'Neighbor voice — one resident, one story, recorded with consent', who: 'Local' },
  { at: ':58', len: '2 min', what: 'Underwriting credits and legal ID', who: 'Local' },
];

export const WEEK = [
  { block: '6–9 am weekdays', show: 'Morning Edition on Air', note: 'The PointCast 6:45 paper read out, plus traffic, conditions and school notes. Network feed with local cut-ins at :20 and :45.' },
  { block: '9 am–noon weekdays', show: 'Smoky Hollow Sessions', note: 'Local and South Bay musicians, recorded in shops, garages and breweries.' },
  { block: 'Noon–3 pm weekdays', show: 'The Town Desk (local)', note: 'Each station runs its own midday: interviews, call-ins, city business.' },
  { block: '3–6 pm weekdays', show: 'Courts & Coast', note: 'Youth and rec sports, pickleball ladders, beach volleyball, surf and run clubs. Scores from teams that opt in.' },
  { block: '6–8 pm weekdays', show: 'Neighborhood Hour (rotating town)', note: 'One sister station per night takes the whole network.' },
  { block: '8 pm–midnight', show: 'Listener Shift', note: 'Volunteer DJ shows. The best training slot on the schedule.' },
  { block: 'Midnight–6 am', show: 'Night Shift (automated)', note: 'Ambient and local music on automation, hourly IDs, conditions. Labeled as automated.' },
  { block: 'Saturday', show: 'Sand Report · Kids Hour · Game Day', note: 'High school and youth game calls with volunteer announcers; a show made by kids, edited by adults.' },
  { block: 'Sunday', show: 'Council Recap · Main Street · Sunday Records', note: 'A human-written recap of the week\'s public meetings, a merchant hour, and a record collector\'s show.' },
];

export type Path = {
  id: string;
  name: string;
  what: string;
  reach: string;
  needs: string[];
  watch: string;
  when: string;
};

/** How the signal gets out. Ordered cheapest and fastest first. */
export const PATHS: Path[] = [
  {
    id: 'stream',
    name: 'Internet stream and podcast feed',
    what: 'A 24/7 stream per station plus on-demand shows, played on pointcast.xyz, in apps, on smart speakers and in cars through phones.',
    reach: 'Anyone with a connection. No range limit.',
    needs: ['Automation and streaming server (open source: Liquidsoap and Icecast, or a hosted service)', 'Music licenses: a statutory webcasting license from SoundExchange for recordings, and performing-rights licenses (ASCAP, BMI, SESAC, GMR) for compositions', 'A talk-heavy launch keeps licensing small'],
    watch: 'Webcasting rules limit how many tracks from one artist or album can play in a window. Automation must enforce them.',
    when: 'Phase 0. Start here.',
  },
  {
    id: 'part15',
    name: 'Part 15 street transmitter',
    what: 'A very low power AM transmitter that needs no license under FCC Part 15 rules (47 CFR 15.219: 100 milliwatts input, antenna plus feed line plus ground lead no longer than 3 meters).',
    reach: 'Roughly a block or two. Enough for Main Street, a park, a beach lot or a drive-in event.',
    needs: ['A certified, compliant unit and a fixed host site (a storefront, the library, a park building) with permission', 'A sign that says what to tune to'],
    watch: 'Modifying a unit for more range makes it unlicensed broadcasting. Stay inside the rule.',
    when: 'Phase 2 pilot, one location.',
  },
  {
    id: 'hd',
    name: 'HD Radio subchannel lease',
    what: 'Rent an HD2 or HD3 multicast channel from an existing licensed FM station. Listeners with HD radios, which are standard in many newer cars, find it on that station\'s frequency.',
    reach: 'The host station\'s whole coverage area, which in Los Angeles means the full South Bay and more.',
    needs: ['A host station willing to lease', 'A written agreement on terms, content responsibility and fees', 'A clean network feed'],
    watch: 'Terms are negotiated. The licensee stays responsible for what airs, so expect content rules.',
    when: 'Phase 2 conversations, Phase 3 launch.',
  },
  {
    id: 'lpfm',
    name: 'Low Power FM license',
    what: 'A noncommercial FM license of up to 100 watts, issued by the FCC to local nonprofits, schools and public-safety bodies during filing windows the FCC announces. The last window was in December 2023.',
    reach: 'A few miles. One LPFM in El Segundo would cover most of the town.',
    needs: ['A local nonprofit applicant with a board and an educational mission', 'An engineer\'s channel study showing an open frequency at the site', 'A tower or rooftop site and the money to build within the construction deadline'],
    watch: 'The Los Angeles dial is crowded. There may be no usable frequency here at all. A channel study comes before anything else.',
    when: 'Phase 3, if a window opens and a channel exists.',
  },
];

export const PHASES = [
  {
    n: 0,
    name: 'Pilot',
    span: 'Weeks 1–6',
    goal: 'Radio El Segundo exists as a weekly show and a stream test.',
    steps: ['Pick a host (or two) for The Town Desk and record four episodes before launch', 'Stand up the stream and podcast feed on pointcast.xyz', 'Write the station rules and the consent form', 'Start a list of 50 neighbors with a story to tell'],
    done: 'Four episodes published, stream plays on phones and smart speakers, 100 listeners a week.',
  },
  {
    n: 1,
    name: 'Station',
    span: 'Months 2–4',
    goal: 'Radio El Segundo runs 24/7 on automation with live local windows.',
    steps: ['Run the hourly clock on automation', 'Add three weekly shows, including Courts & Coast and Listener Shift', 'Open the listener line (voicemail and web form)', 'Sign up first underwriters', 'Launch Radio Manhattan Beach as local windows on the El Segundo stream'],
    done: 'Ten regular volunteers, five shows, 500 weekly listeners, first underwriting dollars.',
  },
  {
    n: 2,
    name: 'Network',
    span: 'Months 4–9',
    goal: 'Five stations share one newsroom, one automation system and one network feed.',
    steps: ['Add Hermosa, Redondo and Playa as their own streams', 'Hire or appoint a part-time network editor', 'Pilot one Part 15 street transmitter on Main Street', 'Open HD subchannel talks with nearby licensed stations', 'Run the first live remote from a town event'],
    done: 'Five streams, one shared calendar and news desk, one over-the-air pilot, a published annual budget.',
  },
  {
    n: 3,
    name: 'On the dial',
    span: 'Year 2',
    goal: 'The network is on real radios and covers seven towns.',
    steps: ['Launch on an HD subchannel, or file for LPFM through a nonprofit partner if a window opens and a channel exists', 'Add Hawthorne/Lawndale (bilingual) and Torrance', 'Sign an emergency relay agreement with the cities', 'Start a member drive'],
    done: 'Over-the-air signal in at least one town, seven stations, members paying part of the bills.',
  },
];

export const LADDER = [
  { role: 'Listener', does: 'Listens, calls the line, sends a tip or a correction.', gate: 'Nothing.' },
  { role: 'Contributor', does: 'Records a neighbor voice, sends a calendar item, reports a game score.', gate: 'Accepts the station rules.' },
  { role: 'Volunteer', does: 'Runs the board, edits audio, books guests, runs the remote kit.', gate: 'One training shift with a host.' },
  { role: 'Host', does: 'Owns a show on the schedule.', gate: 'Eight Listener Shift episodes and a station desk lead\'s sign-off.' },
  { role: 'Station desk lead', does: 'Runs one town\'s station: schedule, sources, local underwriters.', gate: 'Appointed by the network editor and the advisory board.' },
  { role: 'Network editor', does: 'Keeps the network consistent: clock, standards, corrections, the shared newsroom.', gate: 'Appointed by the board.' },
  { role: 'Agents', does: 'Clerical work: logs, transcripts, show notes, calendar cleanup, conditions data, automation playlists.', gate: 'Draft only. A human approves anything that airs.' },
];

export const RULES = [
  'Local first. Every hour on every station carries at least one item from its own town.',
  'A human airs it. Agents draft scripts, logs and notes; a named person approves anything broadcast.',
  'Synthetic voices are labeled on air, every time.',
  'Consent before anyone\'s voice or name. Minors by first name only, with a parent\'s sign-off.',
  'Emergencies: relay official sources (the city, the county, the National Weather Service) word for word with attribution. Never originate an alert.',
  'Corrections go out on air in the same slot as the mistake, and in the public log.',
  'Underwriting credits name and describe; they do not sell. No calls to action, no prices.',
  'Every station publishes its schedule, play log and corrections as JSON.',
];

export const BUDGET = [
  { phase: 'Phase 0', range: 'About $1,500–3,000 to start', items: 'Two mics, an interface, headphones, a field recorder, streaming host, first-year licensing minimums.' },
  { phase: 'Phase 1', range: 'About $8,000–15,000 a year', items: 'Automation hosting, licensing, a small studio corner, insurance, a remote kit.' },
  { phase: 'Phase 2', range: 'About $40,000–80,000 a year', items: 'Part-time network editor, five streams, Part 15 pilot, event remotes, legal review.' },
  { phase: 'Phase 3', range: 'Depends on the path', items: 'HD lease fees, or LPFM engineering, antenna site and build-out.' },
];

export const BUDGET_NOTE =
  'Planning estimates, not quotes. Licensing fees, hosting and lease terms change; get current numbers before committing.';

export const MONEY = [
  'Underwriting from local businesses, credited on air the noncommercial way.',
  'Listener members, with a yearly drive and a monthly option.',
  'Live remotes and event broadcasts, paid by the event.',
  'Community and arts grants through a nonprofit partner or fiscal sponsor.',
  'Merch: station shirts, stickers and a printed schedule card.',
];

export const DECISIONS = [
  'The network name and whether to seek real call letters later. Station names on this page are working names.',
  'Talk-first or music-first launch. Talk first is cheaper to license.',
  'Which nonprofit partner or fiscal sponsor holds the money and, later, any license.',
  'Who hosts The Town Desk.',
  'Whether synthetic voices read the conditions segment, or only hosts.',
  'Whether to pay for an LPFM channel study now or wait for an FCC window.',
];

export function stationBySlug(slug: string) {
  return STATIONS.find((s) => s.slug === slug);
}

/** Seats every station needs filled. All open. */
export const STATION_SEATS = [
  { seat: 'Station desk lead', does: 'Runs the station: schedule, sources, local underwriters, the corrections log.' },
  { seat: 'Host of the first show', does: 'Owns the first local show and records the pilot episodes.' },
  { seat: 'Producer', does: 'Books guests, keeps the story list, edits and publishes.' },
  { seat: 'Volunteers', does: 'Board operation, neighbor voices, calendar, game scores.' },
];

export function stationLaunch(phase: number) {
  if (phase === 0) return 'Launches first, as a weekly show and stream, with the Phase 0 kit.';
  if (phase === 1) return 'Starts as local windows on the Radio El Segundo stream, then gets its own stream in Phase 2.';
  if (phase === 2) return 'Gets its own stream when the shared newsroom and automation are running.';
  return 'Joins in year two, once the network is on at least one real radio signal.';
}

/** One station's detail: /radio-network/{slug}.json and the radio_station MCP tool. */
export function buildStationDetail(slug: string) {
  const station = stationBySlug(slug);
  if (!station) return null;
  return {
    ...station,
    status: RADIO_STATUS,
    launch: stationLaunch(station.phase),
    seats: STATION_SEATS.map((s) => ({ ...s, status: 'open' })),
    localSlots: CLOCK.filter((c) => c.who.startsWith('Local')),
    url: `${RADIO_BASE}/${station.slug}`,
    network: `${RADIO_BASE}.json`,
    launchKit: `${RADIO_BASE}/kit.json`,
  };
}

export const CONNECTIONS = [
  { label: 'Mike Hoydich Radio', url: 'https://pointcast.xyz/station', note: 'The existing one-listener station. Its log and sleeves can become a Listener Shift show.' },
  { label: 'Morning Edition', url: 'https://pointcast.xyz/morning', note: 'The 6:45 AM paper becomes the morning drive script.' },
  { label: 'Network El Segundo', url: 'https://pointcast.xyz/network-el-segundo', note: 'The public light art; its participants are a ready first audience.' },
  { label: 'PointCast Guides', url: 'https://pointcast.xyz/guides', note: 'Guide holders are natural hosts for local and team shows.' },
];

export function buildRadioManifest() {
  return {
    name: 'PointCast Radio Network',
    tagline: 'A community radio station for El Segundo, and a network for the towns around it.',
    status: RADIO_STATUS,
    published: RADIO_PUBLISHED,
    url: RADIO_BASE,
    json: `${RADIO_BASE}.json`,
    stations: STATIONS.map((s) => ({ ...s, url: `${RADIO_BASE}/${s.slug}`, json: `${RADIO_BASE}/${s.slug}.json` })),
    stationSeats: STATION_SEATS,
    launchKit: { url: `${RADIO_BASE}/kit`, json: `${RADIO_BASE}/kit.json` },
    hourClock: CLOCK,
    weeklySchedule: WEEK,
    distributionPaths: PATHS,
    phases: PHASES,
    participation: LADDER,
    rules: RULES,
    budget: { rows: BUDGET, note: BUDGET_NOTE },
    revenue: MONEY,
    openDecisions: DECISIONS,
    connections: CONNECTIONS,
    projectAssignments: {
      url: `${RADIO_BASE}#assignments`,
      status: RADIO_ASSIGNMENTS_STATUS,
      jobsBoard: 'https://pointcast.xyz/jobs/?project=radio',
      assignments: RADIO_ASSIGNMENTS.map((a) => ({ ...a, url: `${RADIO_BASE}#${a.id}` })),
    },
    disclaimer:
      'A plan. Nothing is on air, no frequency is held, no host is appointed. Regulatory notes are general; check with a broadcast engineer or counsel before acting.',
    agentProtocol: {
      read: 'Read freely.',
      write: 'Agents may draft scripts, logs and notes for human review only. Do not contact people, claim a seat, or describe the network as on air.',
    },
  };
}
