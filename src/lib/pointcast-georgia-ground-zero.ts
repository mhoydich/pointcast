export type GeorgiaSourceKind = 'primary' | 'official-data' | 'reported';

export interface GeorgiaGroundZeroSource {
  id: string;
  label: string;
  outlet: string;
  kind: GeorgiaSourceKind;
  url: string;
  note: string;
}

export const GEORGIA_GROUND_ZERO_FEATURE = {
  spec: 'pointcast.college-football.georgia-ground-zero/v1',
  title: 'GEORGIA, GROUND ZERO',
  subtitle: 'The machine, the town, and the Saturday it still has to deserve',
  dek: 'Georgia may be the most complete operating system in college football. Athens is the reason it still feels like more than one.',
  thesis:
    'The machine is amazing because it works. Georgia is amazing only if the machine still belongs to the players, students, workers, town, state, and small irrational rituals that make Saturday worth running.',
  publishedAt: '2026-08-08T10:18:00-07:00',
  updatedAt: '2026-08-08T10:18:00-07:00',
  asOf: '2026-08-08',
  season: 2026,
  issue: '001',
  desk: 'Program Desk',
  dispatch: '001',
  byline: 'PointCast Program Desk · reported and written by Codex',
  source:
    'Michael Hoydich chat directive, 2026-08-08: University of Georgia as ground zero in college football—how the machine works, how it stays non-machine, and what the modern experience means for students, fans, and the state.',
  canonical: 'https://pointcast.xyz/25/magazine/georgia-ground-zero',
  machineEdition: 'https://pointcast.xyz/25/magazine/georgia-ground-zero.json',
  socialImage:
    'https://pointcast.xyz/images/pointcast-georgia-ground-zero/social-card.png',
  heroImage:
    'https://pointcast.xyz/images/pointcast-georgia-ground-zero/the-machine-and-the-bell.webp',
  block: '0566',
  boundary:
    'Unofficial, timestamped editorial analysis. Reporting categories are kept distinct from PointCast interpretation. Financial figures are institutional reporting categories, not a simple profit statement. PointCast is not affiliated with or endorsed by the University of Georgia, Georgia Athletics, the SEC, the NCAA, the NFL, any coach, player, sponsor, or media company named.',
  visualCredit:
    'Original editorial art generated with OpenAI image generation under Codex art direction for PointCast. It is interpretive collage, not documentary photography or a literal rendering of Sanford Stadium, Athens, or any individual.',
} as const;

export const GEORGIA_GROUND_ZERO_READOUT = [
  {
    value: '93,033',
    label: 'SANFORD CAPACITY',
    note: 'A major stadium sewn into campus instead of marooned beyond it.',
    sourceId: 'sanford',
  },
  {
    value: '$149.3M',
    label: 'FY2025 FOOTBALL REVENUE',
    note: 'An EADA reporting category—not a claim of football profit.',
    sourceId: 'eada',
  },
  {
    value: '82',
    label: 'NFL PICKS · SMART ERA',
    note: 'Georgia Athletics’ count after the 2026 draft.',
    sourceId: 'draft',
  },
  {
    value: '$80',
    label: '2026 STUDENT HOME PACKAGE',
    note: 'Seven games if demand and the priority system permit a full package.',
    sourceId: 'student-tickets',
  },
  {
    value: '14+',
    label: 'HOURS ON A SHORT GAME DAY',
    note: 'One official’s workday in UGA’s account of the invisible operation.',
    sourceId: 'gameday-workers',
  },
] as const;

export const GEORGIA_MACHINE_INPUTS = [
  {
    number: '01',
    name: 'THE RADIUS',
    title: 'A state that keeps making football players.',
    body:
      'Georgia is not the largest state in the sport. It is one of the densest. NFL data counted 143 players from Georgia high schools on 2025 kickoff rosters and 22 Georgia high-school alumni selected in the 2025 draft. The home territory is a renewable competitive advantage—but only if relationships remain stronger than extraction.',
    sourceIds: ['nfl-rosters', 'nfl-draft-geography'],
  },
  {
    number: '02',
    name: 'THE REPETITION',
    title: 'Hard Tuesday is the product.',
    body:
      'Kirby Smart describes a developmental factory in plain language: grow the bottom of the roster toward the top, surround positions with many trained eyes, and make practice demanding enough that the game feels recognizable. Georgia’s fewest returning starters of the Smart era make 2026 a useful audit of that claim.',
    sourceIds: ['spring', 'fall-camp'],
  },
  {
    number: '03',
    name: 'THE PEOPLE',
    title: 'Continuity is an information advantage.',
    body:
      'A stable staff does more than preserve scheme. It keeps thousands of observations, corrections, trust deposits, and recruiting relationships inside the building. Smart said staff retention gives him more time to coach motivation and relationships. The machine’s quietest advantage may be memory.',
    sourceIds: ['fall-camp', 'roster'],
  },
  {
    number: '04',
    name: 'THE CAPITAL',
    title: 'Money buys fewer excuses, not guaranteed Saturdays.',
    body:
      'Georgia Athletics reported $233.5 million in total revenue and $226.7 million in total expenses for FY2025; football’s revenue category was $149.3 million. Capital makes staff depth, facilities, travel, nutrition, recruiting, and player support ordinary. It also turns every unconverted advantage into a public question.',
    sourceIds: ['eada', 'ncaa-finance'],
  },
  {
    number: '05',
    name: 'THE PROOF',
    title: 'The next level recognizes the work.',
    body:
      'Eight Bulldogs were drafted in 2026, bringing Georgia Athletics’ Smart-era total to 82 NFL selections in ten drafts. Championships explain the ceiling. Draft development explains why the room replenishes: recruits can see the path leaving Athens as clearly as the one entering it.',
    sourceIds: ['draft', 'kirby'],
  },
] as const;

export const GEORGIA_2026_LEDGER = [
  { date: 'SEP 05', opponent: 'TENNESSEE STATE', place: 'ATHENS', read: 'THE OPENING' },
  { date: 'SEP 19', opponent: 'ARKANSAS', place: 'FAYETTEVILLE', read: 'THE FIRST ROAD' },
  { date: 'SEP 26', opponent: 'OKLAHOMA', place: 'ATHENS', read: 'THE NEW WEIGHT' },
  { date: 'OCT 10', opponent: 'ALABAMA', place: 'TUSCALOOSA', read: 'THE STANDARD' },
  { date: 'OCT 17', opponent: 'AUBURN', place: 'ATHENS', read: 'THE MEMORY' },
  { date: 'OCT 31', opponent: 'FLORIDA', place: 'ATLANTA', read: 'THE MOVED RITUAL' },
  { date: 'NOV 07', opponent: 'OLE MISS', place: 'OXFORD', read: 'THE SCAR' },
  { date: 'NOV 28', opponent: 'GEORGIA TECH', place: 'ATHENS', read: 'THE STATE LINE' },
] as const;

export const GEORGIA_HEDGES_TEST = [
  {
    number: '01',
    question: 'CAN THE STUDENT STILL GET IN?',
    read: 'Protect affordable, abundant student access before manufacturing one more premium experience.',
  },
  {
    number: '02',
    question: 'ARE PLAYERS PEOPLE BEFORE THEY ARE INVENTORY?',
    read: 'Direct revenue sharing is overdue. Development should still include education, time, health, voice, and a life after the depth chart.',
  },
  {
    number: '03',
    question: 'DOES ATHENS WIN ON THE OTHER 358 DAYS?',
    read: 'Route visitor energy into local rooms, workers, music, public space, and businesses—not only the controlled stadium economy.',
  },
  {
    number: '04',
    question: 'CAN A PLAYER ARRIVE UNFINISHED?',
    read: 'Keep development visible. A sport made entirely of acquired certainty has no room for discovery.',
  },
  {
    number: '05',
    question: 'CAN ANOTHER SPORT OWN THE CATHEDRAL?',
    read: 'Georgia opens Sanford’s 2026 public calendar with women’s soccer. That is not a footnote; it is a model for a university stadium.',
  },
  {
    number: '06',
    question: 'CAN THE PROGRAM SURVIVE BEING MORTAL?',
    read: 'If one loss turns every relationship into an asset review, the machine has started consuming the institution it was built to serve.',
  },
  {
    number: '07',
    question: 'DOES THE BELL RING FOR SOMETHING ELSE?',
    read: 'UGA’s Chapel Bell marks athletic victories and academic accomplishment. Keep the second half of that sentence loud.',
  },
] as const;

export const GEORGIA_GROUND_ZERO_SOURCES: GeorgiaGroundZeroSource[] = [
  {
    id: 'gameday-workers',
    label: 'Game day’s unsung heroes',
    outlet: 'UGA Today',
    kind: 'primary',
    url: 'https://news.uga.edu/uga-game-day-heroes/',
    note: 'Pre-sunrise barricades, transit, safety, custodial work, and the duration of game-day operations.',
  },
  {
    id: 'fall-camp',
    label: 'Smart, players preview 2026 fall camp',
    outlet: 'Georgia Athletics',
    kind: 'primary',
    url: 'https://georgiadogs.com/news/2026/8/5/football-smart-players-preview-fall-camp',
    note: 'Roster state, camp phases, staff retention, identity, and the 2026 women’s soccer match in Sanford Stadium.',
  },
  {
    id: 'spring',
    label: 'Smart, players preview 2026 spring practices',
    outlet: 'Georgia Athletics',
    kind: 'primary',
    url: 'https://georgiadogs.com/news/2026/3/17/football-smart-players-preview-spring-practices',
    note: 'Returning experience, player development, practice standards, and staff observation.',
  },
  {
    id: 'student-tickets',
    label: '2026 student football tickets',
    outlet: 'The Georgia Bulldog Club',
    kind: 'primary',
    url: 'https://thegeorgiabulldogclub.com/policies-and-procedures/student-tickets/',
    note: 'Prices, lottery packages, ticket donation, strikes, digital entry, general admission, and away-game prices.',
  },
  {
    id: 'sanford',
    label: 'Dooley Field at Sanford Stadium',
    outlet: 'Georgia Athletics',
    kind: 'primary',
    url: 'https://georgiadogs.com/sports/2023/7/11/facility-SanfordStadium',
    note: 'Official stadium history and 93,033 capacity.',
  },
  {
    id: 'eada',
    label: '2025 EADA Survey',
    outlet: 'University of Georgia Athletic Association',
    kind: 'official-data',
    url: 'https://georgiadogs.com/documents/download/2025/10/29/2025_EADA_Survey.pdf',
    note: 'FY2025 athletics and football revenue and expense reporting categories.',
  },
  {
    id: 'ncaa-finance',
    label: '2025 NCAA Financial Report',
    outlet: 'University of Georgia Athletic Association',
    kind: 'official-data',
    url: 'https://georgiadogs.com/documents/download/2026/1/15/2025_NCAA_Financial_Report.pdf',
    note: 'Contributions, recruiting, coaching compensation, and other NCAA reporting categories.',
  },
  {
    id: 'draft',
    label: 'Georgia closes the 2026 NFL Draft',
    outlet: 'Georgia Athletics',
    kind: 'primary',
    url: 'https://georgiadogs.com/news/2026/4/25/football-two-bulldogs-selected-on-day-three-of-the-2026-nfl-draft',
    note: 'Eight 2026 selections and Georgia Athletics’ Smart-era draft count.',
  },
  {
    id: 'kirby',
    label: 'Kirby Smart coaching profile',
    outlet: 'Georgia Athletics',
    kind: 'primary',
    url: 'https://georgiadogs.com/staff-directory/kirby-smart/399',
    note: 'Program record, championships, and development history.',
  },
  {
    id: 'schedule',
    label: 'Georgia’s 2026 football schedule',
    outlet: 'Georgia Athletics',
    kind: 'primary',
    url: 'https://georgiadogs.com/news/2025/12/11/sec-announces-georgias-2026-football-schedule',
    note: 'Official opponents, sites, and the Florida game’s move to Atlanta.',
  },
  {
    id: 'season-close',
    label: 'Ole Miss 39, Georgia 34 · CFP quarterfinal',
    outlet: 'Georgia Athletics',
    kind: 'primary',
    url: 'https://georgiadogs.com/news/2026/1/2/football-rebels-knock-off-bulldogs-39-34-in-cfp-quarterfinal',
    note: 'The 12–2 close to the 2025 season after Georgia won the SEC championship.',
  },
  {
    id: 'nfl-rosters',
    label: 'High schools represented on 2025 NFL kickoff rosters',
    outlet: 'NFL Play Football',
    kind: 'official-data',
    url: 'https://playfootball.nfl.com/news-events/news-and-features/texas-and-south-florida-high-schools-dominate-nfl-kickoff-weekend-rosters/',
    note: 'State-of-high-school count, including 143 players from Georgia high schools.',
  },
  {
    id: 'nfl-draft-geography',
    label: 'High schools represented in the 2025 NFL Draft',
    outlet: 'NFL',
    kind: 'official-data',
    url: 'https://www.nfl.com/news/246-high-schools-have-players-selected-in-2025-nfl-draft',
    note: 'State count, including 22 selections from Georgia high schools.',
  },
  {
    id: 'traditions',
    label: 'UGA history and traditions',
    outlet: 'University of Georgia',
    kind: 'primary',
    url: 'https://www.uga.edu/about/history-and-traditions',
    note: 'The Chapel Bell, Light Up Sanford, band ritual, and other campus traditions.',
  },
  {
    id: 'athens-music',
    label: 'In a music town, tomorrow’s leaders take center stage',
    outlet: 'UGA Today',
    kind: 'primary',
    url: 'https://news.uga.edu/in-a-music-town-tomorrows-leaders-take-center-stage/',
    note: 'Athens music history and the continuing student/community music ecosystem.',
  },
  {
    id: 'house-settlement',
    label: 'House settlement roster changes',
    outlet: 'NCAA',
    kind: 'primary',
    url: 'https://www.ncaa.org/media-center-di-board-of-directors-formally-adopts-changes-to-roster-limits/',
    note: 'Roster limits, scholarship changes, and the post-settlement Division I framework.',
  },
  {
    id: 'roster',
    label: '2026 Georgia football roster and staff',
    outlet: 'Georgia Athletics',
    kind: 'primary',
    url: 'https://georgiadogs.com/sports/football/roster',
    note: 'Current player and staff listing.',
  },
] as const;

export const georgiaGroundZeroSource = (id: string) => {
  const source = GEORGIA_GROUND_ZERO_SOURCES.find((item) => item.id === id);
  if (!source) throw new Error(`Unknown Georgia Ground Zero source: ${id}`);
  return source;
};
