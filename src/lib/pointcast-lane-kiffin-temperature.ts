export type KiffinTemperatureBand = 'boiling' | 'hot' | 'watch';

export interface KiffinTemperatureReading {
  id: string;
  label: string;
  temperature: number;
  band: KiffinTemperatureBand;
  headline: string;
  read: string;
  proof: string;
  sourceIds: string[];
}

export interface KiffinSource {
  id: string;
  label: string;
  outlet: string;
  kind: 'primary' | 'reported' | 'commentary';
  url: string;
  note: string;
}

export const LANE_KIFFIN_TEMPERATURE_FEATURE = {
  spec: 'pointcast.college-football.lane-kiffin-temperature/v1',
  title: 'LANE KIFFIN TEMPERATURE CHECK',
  subtitle: 'The LSU merger audit before Game One',
  dek: 'The roster is new. The capital is organized. The old school is still winning. The first real measurement arrives in Oxford.',
  thesis:
    'LSU did not hire Lane Kiffin to make football interesting. It hired him to convert Louisiana, capital, portal fluency, and Saturday night into a championship system—and to do it while his former program remains a live rebuttal.',
  publishedAt: '2026-08-02T13:14:00-07:00',
  updatedAt: '2026-08-02T13:14:00-07:00',
  asOf: '2026-08-02',
  season: 2026,
  dispatch: '001',
  byline: 'PointCast Coaches Desk · reported and written by Codex',
  source:
    'Michael Hoydich chat directive, 2026-08-02: a Lane Kiffin check across players, press, area, foes, and the ecosystem, closing with what Paul Finebaum would say.',
  canonical: 'https://pointcast.xyz/25/magazine/lane-kiffin-temperature',
  machineEdition:
    'https://pointcast.xyz/25/magazine/lane-kiffin-temperature.json',
  socialImage:
    'https://pointcast.xyz/images/pointcast-lane-kiffin-temperature/social-card.png',
  block: '0553',
  pointcastRank: 9,
  overallTemperature: 96,
  overallBand: 'boiling' as const,
  status: 'PRESEASON · ZERO GAMES PLAYED',
  boundary:
    'Unofficial, timestamped editorial analysis. Temperatures are PointCast narrative signals, not predictions, polls, hot-seat grades, betting advice, employment evaluations, audited financial analysis, or measures of player sentiment. PointCast is not affiliated with LSU, Ole Miss, the SEC, ESPN, Paul Finebaum, or any coach or player named.',
  finebaumBoundary:
    'The closing “what Paul would probably say” is PointCast synthesis based on Finebaum’s documented public comments. It is explicitly not a quotation, transcript, endorsement, impersonation, or statement by Paul Finebaum or ESPN.',
} as const;

export const LANE_KIFFIN_TEMPERATURE_READINGS: KiffinTemperatureReading[] = [
  {
    id: 'program',
    label: 'PROGRAM',
    temperature: 94,
    band: 'hot',
    headline: 'The idea is proven. The institution is new.',
    read:
      'Kiffin arrives with 55 wins in six Ole Miss seasons and a repeatable offensive identity. LSU is the scale test: can a system built to create weekly advantages become calm enough to govern a championship-sized room?',
    proof:
      'His Ole Miss teams led the SEC in total offense four times and averaged at least 33 points in every season.',
    sourceIds: ['lsu-kiffin'],
  },
  {
    id: 'players',
    label: 'PLAYERS',
    temperature: 99,
    band: 'boiling',
    headline: 'A depth chart assembled like an opening statement.',
    read:
      'LSU’s 2026 roster is not a gentle inheritance. It is a high-speed reconstruction led by quarterback Sam Leavitt, tackle Jordan Seaton, edge Princewill Umanmielen, and a long list of transfers asked to become a team before they become a headline again.',
    proof:
      'CBS reported the top-ranked portal class, a 40-player transfer haul, and three of the portal’s top five players.',
    sourceIds: ['lsu-roster', 'cbs-portal'],
  },
  {
    id: 'capital',
    label: 'CAPITAL',
    temperature: 100,
    band: 'boiling',
    headline: 'Not merely more money. A football company.',
    read:
      'The seven-year, $91 million coaching deal is only the visible line. LSU also installed what it calls an NFL-style front office, with a general manager, assistant GMs, strategy, NIL, revenue-share management, partnerships, and roster construction under one operating roof.',
    proof:
      'The capital question is no longer access. It is conversion: do all these inputs make the football simpler?',
    sourceIds: ['ap-golding', 'lsu-front-office'],
  },
  {
    id: 'region',
    label: 'AREA',
    temperature: 91,
    band: 'hot',
    headline: 'Baton Rouge is not scenery. It is the competitive asset.',
    read:
      'Kiffin’s early LSU pitch has correctly treated Louisiana as more than a recruiting radius. Five-star Louisiana recruits stayed through the coaching change, and Ed Orgeron returned in a role built around recruiting and defense. The interesting test is whether local intensity becomes daily continuity rather than launch-week theater.',
    proof:
      'Kiffin credited “the power” of LSU for keeping elite Louisiana signees before his full staff was even in place.',
    sourceIds: ['cbs-portal', 'lsu-orgeron'],
  },
  {
    id: 'staff',
    label: 'STAFF',
    temperature: 88,
    band: 'watch',
    headline: 'The merger kept a defensive memory.',
    read:
      'This is not a total cultural wipe. Defensive coordinator Blake Baker enters Year Three at LSU and was one of four defensive coaches retained. That gives Kiffin’s new offense a useful counterweight: a unit with local language, returning habits, and a recent record of improvement.',
    proof:
      'LSU says Baker’s 2025 defense ranked fifth in SEC scoring defense and led the league in red-zone defense.',
    sourceIds: ['lsu-baker'],
  },
  {
    id: 'press',
    label: 'PRESS',
    temperature: 98,
    band: 'boiling',
    headline: 'The coach and the character remain impossible to separate.',
    read:
      'Kiffin’s fluency with attention is an asset until every football choice becomes a referendum on the persona. The press temperature moves because the coverage contains two ideas at once: elite operator, exhausting protagonist.',
    proof:
      'Finebaum’s public arc moved from saying Kiffin looked terrible during Ole Miss’s playoff run to predicting a likely LSU title within two or three years.',
    sourceIds: ['si-finebaum', 'sds-finebaum'],
  },
  {
    id: 'foes',
    label: 'FOES',
    temperature: 100,
    band: 'boiling',
    headline: 'September 19 is not a road game. It is a referendum with yard lines.',
    read:
      'LSU opens with Clemson, then visits Ole Miss in Week Three. After that come Texas A&M, Alabama, Texas, Tennessee, and Arkansas. The schedule does not allow the new program to remain conceptual for long.',
    proof:
      'Ole Miss returns quarterback Trinidad Chambliss and running back Kewan Lacy after a 13–2 season and national-semifinal run.',
    sourceIds: ['lsu-schedule', 'ap-golding', 'cbs-ole-miss'],
  },
  {
    id: 'fans',
    label: 'FANS',
    temperature: 96,
    band: 'boiling',
    headline: 'The grace period is approximately one kickoff.',
    read:
      'LSU’s public bargain is not “make us relevant.” The program has four national titles and a home schedule built for maximum theater. The fan question is whether Kiffin can make the attention feel shared instead of personally managed.',
    proof:
      'Clemson arrives for the opener; Alabama and Texas both come to Tiger Stadium in November.',
    sourceIds: ['lsu-kiffin', 'lsu-schedule'],
  },
];

export const LANE_KIFFIN_TIMELINE = [
  {
    date: 'NOV 30 · 2025',
    title: 'THE MOVE',
    note: 'Kiffin leaves Ole Miss after an 11–1 regular season and is named LSU head coach.',
    sourceId: 'lsu-kiffin',
  },
  {
    date: 'JAN · 2026',
    title: 'THE AFTERIMAGE',
    note: 'Ole Miss wins twice in the playoff after his departure, turning every LSU introduction into a split-screen.',
    sourceId: 'si-finebaum',
  },
  {
    date: 'FEB · 2026',
    title: 'THE HAUL',
    note: 'LSU closes the top-ranked portal class with 40 transfers and three of the portal’s top five players.',
    sourceId: 'cbs-portal',
  },
  {
    date: 'MAY–JUN · 2026',
    title: 'THE ORGANIZATION',
    note: 'Ed Orgeron joins; LSU completes an NFL-style front office around roster, NIL, and revenue-share work.',
    sourceId: 'lsu-front-office',
  },
  {
    date: 'JUL · 2026',
    title: 'THE TALKING SEASON',
    note: 'Finebaum dismisses the social-media character and still forecasts eventual championship proof.',
    sourceId: 'sds-finebaum',
  },
  {
    date: 'SEP 19 · 2026',
    title: 'THE EX',
    note: 'LSU at Ole Miss, 6:30 p.m. CT: the first game that will be interpreted before it is finished.',
    sourceId: 'lsu-schedule',
  },
] as const;

export const LANE_KIFFIN_ROSTER_BOARD = [
  {
    role: 'QB / THE ENGINE',
    name: 'Sam Leavitt',
    origin: 'Arizona State → LSU',
    read: 'The clearest bet in the rebuild: proven improvisational movement placed inside Kiffin’s answer-rich offense.',
  },
  {
    role: 'OT / THE MARGIN',
    name: 'Jordan Seaton',
    origin: 'Colorado → LSU',
    read: 'A premium tackle is where offensive imagination becomes executable rather than merely clever.',
  },
  {
    role: 'EDGE / THE HISTORY',
    name: 'Princewill Umanmielen',
    origin: 'Ole Miss → LSU',
    read: 'The old program inside the new one: talent, rivalry, transfer economics, and memory on the same snap.',
  },
  {
    role: 'DC / THE HOLDOVER',
    name: 'Blake Baker',
    origin: 'LSU, Year Three',
    read: 'Continuity on the side of the ball most capable of making the new era feel less like a collection.',
  },
] as const;

export const LANE_KIFFIN_FOE_BOARD = [
  {
    date: 'SEP 05',
    opponent: 'CLEMSON',
    place: 'TIGER STADIUM',
    label: 'THE FIRST IMPRESSION',
    read: 'No soft reveal. The new room opens under national light against a program that knows how to make identity feel older than a roster.',
  },
  {
    date: 'SEP 19',
    opponent: 'OLE MISS',
    place: 'OXFORD',
    label: 'THE EX',
    read: 'Pete Golding, Chambliss, Lacy, a semifinal memory, and every unresolved feeling packed into Week Three.',
  },
  {
    date: 'SEP 26',
    opponent: 'TEXAS A&M',
    place: 'TIGER STADIUM',
    label: 'THE RESOURCE MIRROR',
    read: 'Two expensive rooms asking which one can make acquisition disappear into ordinary football.',
  },
  {
    date: 'NOV 07',
    opponent: 'ALABAMA',
    place: 'TIGER STADIUM',
    label: 'THE OLD SCHOOL',
    read: 'Kiffin’s Saban education, LSU’s championship standard, and a rivalry that converts coaching biography into weather.',
  },
  {
    date: 'NOV 14',
    opponent: 'TEXAS',
    place: 'TIGER STADIUM',
    label: 'THE SCALE TEST',
    read: 'Brand, quarterback attention, regional reach, and capital—another room with almost no missing input.',
  },
] as const;

export const LANE_KIFFIN_FINEBAUM_CLOSE = {
  label: 'POINTCAST SYNTHESIS · NOT A QUOTATION',
  title: 'WHAT WOULD PAUL PROBABLY SAY?',
  setup:
    'Finebaum’s documented 2026 position is unusually complete: he has criticized Kiffin’s optics and persona while also saying the coach will probably win a national title at LSU within two or three years.',
  synthesis:
    'Lane is too good to dismiss and too interested in the theater to escape it. LSU did not pay for a clever rebuild; it paid for the playoff to feel ordinary. If he wins quickly, he is a genius. If Ole Miss beats him first, the whole country will call it karma before breakfast. The national title may come. The grace period will not.',
  method:
    'Written by PointCast from the tension between Finebaum’s January and July public comments. These words are PointCast’s, not Finebaum’s.',
  sourceIds: ['si-finebaum', 'sds-finebaum'],
} as const;

export const LANE_KIFFIN_SOURCES: KiffinSource[] = [
  {
    id: 'lsu-kiffin',
    label: 'Lane Kiffin · LSU coaching profile',
    outlet: 'LSU Athletics',
    kind: 'primary',
    url: 'https://lsusports.net/sports/fb/roster/season/2026/staff/lane-kiffin',
    note: 'Appointment date, career record, Ole Miss results, offensive history, and LSU program context.',
  },
  {
    id: 'lsu-roster',
    label: '2026 football roster',
    outlet: 'LSU Athletics',
    kind: 'primary',
    url: 'https://lsusports.net/sports/fb/roster',
    note: 'Current roster positions and listings, including Leavitt and Umanmielen.',
  },
  {
    id: 'lsu-schedule',
    label: '2026 football schedule',
    outlet: 'LSU Athletics',
    kind: 'primary',
    url: 'https://lsusports.net/sports/fb/schedule',
    note: 'Official dates, opponents, locations, and announced kickoff times.',
  },
  {
    id: 'lsu-front-office',
    label: 'Football announces front office staff',
    outlet: 'LSU Athletics',
    kind: 'primary',
    url: 'https://lsusports.net/news/2026/06/15/footballs-announces-front-office-staff',
    note: 'NFL-style front office, GM structure, strategy, NIL, revenue share, and roster construction.',
  },
  {
    id: 'lsu-orgeron',
    label: 'Lane Kiffin adds Ed Orgeron',
    outlet: 'LSU Athletics',
    kind: 'primary',
    url: 'https://lsusports.net/news/2026/05/20/lane-kiffin-adds-ed-orgeron-to-football-staff',
    note: 'Orgeron’s role as special assistant to recruiting and defense with a Louisiana emphasis.',
  },
  {
    id: 'lsu-baker',
    label: 'Blake Baker · LSU coaching profile',
    outlet: 'LSU Athletics',
    kind: 'primary',
    url: 'https://lsusports.net/sports/fb/roster/season/2026/staff/blake-baker',
    note: 'Defensive continuity, staff retention, and 2025 defensive performance.',
  },
  {
    id: 'cbs-portal',
    label: 'Kiffin discusses LSU’s aggressive portal approach',
    outlet: 'CBS Sports',
    kind: 'reported',
    url: 'https://www.cbssports.com/college-football/news/lane-kiffin-transfer-portal-lsu-recruiting-class/',
    note: 'Top-ranked class, 40-player haul, top-five transfers, and Kiffin’s account of LSU’s recruiting power.',
  },
  {
    id: 'cbs-ole-miss',
    label: 'Pete Golding’s Ole Miss transfer reload',
    outlet: 'CBS Sports',
    kind: 'reported',
    url: 'https://www.cbssports.com/college-football/news/pete-golding-ole-miss-transfer-portal-reload-cfp-lane-kiffin/',
    note: 'Ole Miss roster retention, No. 2 portal class, and 2026 expectations after Kiffin.',
  },
  {
    id: 'ap-golding',
    label: 'Pete Golding calls Kiffin “the ex”',
    outlet: 'Associated Press via The Washington Post',
    kind: 'reported',
    url: 'https://www.washingtonpost.com/sports/colleges/2026/07/22/pete-golding-lane-kiffin-ole-miss-lsu/04737508-860f-11f1-9cec-0fb26676f07e_story.html',
    note: 'Seven-year, $91 million LSU deal, Ole Miss semifinal aftermath, returning stars, and the Week Three reunion.',
  },
  {
    id: 'si-finebaum',
    label: 'Finebaum on Kiffin during the Ole Miss playoff run',
    outlet: 'Sports Illustrated',
    kind: 'commentary',
    url: 'https://www.si.com/college-football/paul-finebaum-lane-kiffin-looks-terrible-amid-ole-miss-playoff-run',
    note: 'Finebaum’s January criticism of the optics around Kiffin’s departure.',
  },
  {
    id: 'sds-finebaum',
    label: 'Finebaum on Kiffin at 2026 SEC Media Days',
    outlet: 'Saturday Down South',
    kind: 'commentary',
    url: 'https://www.saturdaydownsouth.com/news/college-football/paul-finebaum-has-biting-words-for-kalen-deboer-lane-kiffin-at-sec-media-days/',
    note: 'Finebaum’s July view of the persona and his two-to-three-year national-title forecast.',
  },
];

export const kiffinSource = (id: string) => {
  const source = LANE_KIFFIN_SOURCES.find((entry) => entry.id === id);
  if (!source) throw new Error(`Unknown Lane Kiffin source: ${id}`);
  return source;
};
