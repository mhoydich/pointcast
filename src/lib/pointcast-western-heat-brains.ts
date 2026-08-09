export const WESTERN_HEAT_BRAINS_FEATURE = {
  spec: 'pointcast.college-football.western-heat-brains/v1',
  title: 'WESTERN HEAT / BRAINS 25',
  subtitle: 'Three kinds of pressure. One Saturday scoreboard for brains.',
  dek: 'Colorado, Arizona State, and Wyoming reveal what football does to a university—then a parallel Power 25 separates research resources from results, stars, and the next proof.',
  thesis:
    'Football already has a language for collective excellence. Research has the work, the rivalries, and the breakout players; what it lacks is a recurring public scoreboard honest enough to keep power and proof apart.',
  publishedAt: '2026-08-08T15:30:00-07:00',
  updatedAt: '2026-08-08T15:30:00-07:00',
  asOf: '2026-08-08',
  season: 2026,
  issue: '002',
  desk: 'Western Desk / Brains Desk',
  byline: 'PointCast Magazine · reported and written by Codex',
  source:
    'Michael Hoydich chat directive, 2026-08-08: compare Colorado, Wyoming, and Arizona State as football institutions, then create a parallel science competition edition with a Brains category of the day.',
  canonical: 'https://pointcast.xyz/25/magazine/western-heat-brains',
  machineEdition: 'https://pointcast.xyz/25/magazine/western-heat-brains.json',
  socialImage:
    'https://pointcast.xyz/images/pointcast-western-heat-brains/social-card.png',
  heroImage:
    '/images/pointcast-western-heat-brains/double-field.webp',
  westernImage:
    '/images/pointcast-western-heat-brains/western-field.webp',
  brainsImage:
    '/images/pointcast-western-heat-brains/brains-field.webp',
  block: '0568',
  boundary:
    'Unofficial, timestamped PointCast editorial analysis. Heat scores are disclosed editorial judgments, not weather forecasts, betting advice, or win projections. The research Power 25 reproduces the latest NSF/NCSES FY2024 expenditure ranking; money measures scale, not discovery quality. Unlike student competitions remain separate results. PointCast is not affiliated with or endorsed by any school, conference, athletics program, government agency, researcher, coach, player, or competition named.',
  visualCredit:
    'Original abstract editorial art generated with OpenAI image generation under Codex art direction for PointCast. The landscapes are interpretive studies, not documentary photography, literal campuses, or official school marks.',
} as const;

export const WESTERN_HEAT_PROGRAMS = [
  {
    id: 'colorado',
    order: '01',
    school: 'Colorado',
    institution: 'University of Colorado Boulder',
    conference: 'Big 12',
    record: '2025 · 3–9 · Big 12 1–8',
    temperature: 94,
    status: 'Proof demanded',
    thesis: 'The attention did not leave. The alibi did.',
    question: 'Can visibility become program depth after novelty becomes administration?',
    case: 'Colorado still owns attention that remains legible beyond wins and losses.',
    doubt: 'A 3–9 season turns every branding success into a football question; visibility without roster depth becomes expensive theater.',
    nextProof: 'The opening month, beginning at Georgia Tech: does the team look built, or merely assembled?',
    schoolEffect: 'It opens a national aperture that CU has deliberately pointed toward research and campus life.',
    movement: 'Holding at 94°. The pressure rises because the audience stayed.',
  },
  {
    id: 'arizona-state',
    order: '02',
    school: 'Arizona State',
    institution: 'Arizona State University',
    conference: 'Big 12',
    record: '2025 · 8–5 · Big 12 6–3',
    temperature: 92,
    status: 'Valley activated',
    thesis: 'Football makes a distributed university happen at one time.',
    question: 'Can a breakthrough become the operating floor of a vast university?',
    case: 'ASU has the strongest current football floor and verified ticket, student-attendance, and regional-spending heat.',
    doubt: 'The 2024 breakthrough can become a shrine instead of an operating standard.',
    nextProof: 'Whether 8–5 reads as consolidation or descent when the 2026 Big 12 schedule tightens.',
    schoolEffect: 'It compresses a vast institution and a sprawling Valley into one shared civic clock.',
    movement: 'Up to 92°. Less spectacle than Colorado, more verified football heat.',
  },
  {
    id: 'wyoming',
    order: '03',
    school: 'Wyoming',
    institution: 'University of Wyoming',
    conference: 'Mountain West',
    record: '2025 · 4–8 · MW 2–6',
    temperature: 90,
    status: 'Statewide stakes',
    thesis: 'The record is cool. The stakes are incandescent.',
    question: 'Can national-scale belonging remain affordable for a small state?',
    case: 'No program in the trio carries greater institutional leverage per Saturday.',
    doubt: 'The financial and conference gap can turn identity into nostalgia; 16 points per game will not protect a civic ritual forever.',
    nextProof: 'Whether a 41-player signing class becomes a recognizable Wyoming team before volatility becomes the whole story.',
    schoolEffect: 'It functions as a statewide commons for Wyoming’s only four-year public university.',
    movement: 'Up to 90°. The record is cool; the stakes are incandescent.',
  },
] as const;

export const BRAINS_POWER_25 = [
  [1, 'Johns Hopkins University', 'APL included', 4129.264],
  [2, 'University of Pennsylvania', 'Medical depth', 2167.504],
  [3, 'UC San Francisco', 'Health system', 2127.637],
  [4, 'Michigan–Ann Arbor', 'Public flagship', 2110.961],
  [5, 'Wisconsin–Madison', 'Public flagship', 1933.229],
  [6, 'UCLA', 'Public research', 1896.227],
  [7, 'UC San Diego', 'Public research', 1881.289],
  [8, 'Washington–Seattle', 'Public research', 1691.302],
  [9, 'Stanford', 'Private research', 1641.961],
  [10, 'Cornell', 'Private / land-grant', 1613.631],
  [11, 'UNC Chapel Hill', 'Public flagship', 1598.751],
  [12, 'Ohio State', 'Public flagship', 1581.57],
  [13, 'Duke', 'Private research', 1580.756],
  [14, 'University of Maryland', 'Two campuses', 1539.52],
  [15, 'Georgia Tech', 'Engineering', 1528.637],
  [16, 'Yale', 'Private research', 1519.694],
  [17, 'University of Pittsburgh', 'Health + research', 1504.665],
  [18, 'New York University', 'Private research', 1500.732],
  [19, 'Harvard', 'Private research', 1494.527],
  [20, 'Columbia', 'Private research', 1449.535],
  [21, 'Minnesota–Twin Cities', 'Public flagship', 1409.71],
  [22, 'Texas A&M', 'Public flagship', 1393.825],
  [23, 'UT MD Anderson', 'Cancer center', 1363.321],
  [24, 'Vanderbilt / VUMC', 'Medical center', 1327.87],
  [25, 'Penn State', 'Public flagship', 1302.971],
] as const;

export const BRAINS_SCOREBOARD = [
  {
    rank: 1,
    school: 'Virginia',
    result: 'NASA Lunabotics · Off World Grand Prize',
    star: 'Craig Kalkwarf · 22-person team',
    read: 'A wheel detached in the finals. The team reconfigured the robot, kept moving, then installed the prepared replacement.',
    sourceId: 'lunabotics',
  },
  {
    rank: 2,
    school: 'Missouri S&T',
    result: 'University Rover Challenge · repeat champion · 469.6 points',
    star: 'Mars Rover Design Team',
    read: 'The machine is smaller than the Hopkins resource table. The result is cleaner: enter a defined arena and finish first.',
    sourceId: 'urc',
  },
  {
    rank: 3,
    school: 'MIT',
    result: 'NASA RASC-AL · first and second',
    star: 'Lunar power systems',
    read: 'The winning concept treated power as infrastructure—architecture that lets every other component operate.',
    sourceId: 'rascal',
  },
  {
    rank: 4,
    school: 'USC',
    result: 'DOE Marine Energy · overall winner',
    star: 'Technical + community proof',
    read: 'Design, build, test, community connection, pitch, and poster work all counted. Public value was part of the score.',
    sourceId: 'marine',
  },
  {
    rank: 5,
    school: 'South Dakota State',
    result: 'NASA Gateways to Blue Skies · first place',
    star: 'Team WINGMAN',
    read: 'A mid-sized public university took the maintenance category—a precise reason scale cannot be the only board.',
    sourceId: 'blue-skies',
  },
] as const;

export const BRAINS_WESTERN_SCOUTING = [
  {
    school: 'Arizona State',
    rank: 37,
    amount: '$1.003B',
    proof: 'NASA’s Psyche mission is led from ASU by Lindy Elkins-Tanton. ASU also leads the nation in non-science-and-engineering R&D spending.',
    stars: 'Lindy Elkins-Tanton',
  },
  {
    school: 'Colorado',
    rank: 51,
    amount: '$717.9M',
    proof: 'JILA, NIST, and a 2026 quantum-translation push make Boulder a place where clocks, atoms, and companies share a depth chart.',
    stars: 'Adam Kaufman · Anya Grafov',
  },
  {
    school: 'Wyoming',
    rank: 152,
    amount: '$167.3M',
    proof: 'Raw scale is modest; movement is not. Reported R&D rose from $93.2M in FY2021, while 273 students presented in the 2026 undergraduate research event.',
    stars: 'Thomas Boothby · Lily Brongo',
  },
] as const;

export const BRAINS_DIALS = [
  ['01', 'Scale', 'Resources, people, facilities, and time.'],
  ['02', 'Proof', 'Results that survived contact with a real test.'],
  ['03', 'Student agency', 'Undergraduates and graduates doing consequential work.'],
  ['04', 'Public value', 'A legible benefit beyond prestige.'],
  ['05', 'Openness', 'Methods, data, access, explanation, and the ability to be checked.'],
] as const;

export const WESTERN_HEAT_SOURCES = [
  ['colorado-results', 'Colorado 2025 results', 'CU Athletics', 'https://cubuffs.com/sports/football/schedule/2025'],
  ['colorado-schedule', 'Colorado 2026 schedule', 'CU Athletics', 'https://cubuffs.com/news/2026/1/21/colorado-footballs-2026-schedule-released-by-big-12-conference'],
  ['colorado-tickets', 'Colorado season-ticket demand', 'CU Athletics', 'https://cubuffs.com/news/2025/6/6/football-season-tickets-sold-out-for-third-straight-season'],
  ['colorado-prime', 'CU Prime Attention research campaign', 'CU Boulder', 'https://www.colorado.edu/today/2024/11/07/coach-prime-video-campaigns-campus-magazines-recognized-national-awards'],
  ['asu-results', 'Arizona State 2025 results', 'Sun Devil Athletics', 'https://thesundevils.com/sports/football/schedule/season/2025'],
  ['asu-opener', 'ASU opener and ticket figures', 'ASU News', 'https://news.asu.edu/20250831-sun-devil-community-asu-football-soldout-opener-most-anticipated-season'],
  ['asu-impact', 'Sun Devil football economic-impact report', 'ASU News', 'https://news.asu.edu/20250828-sun-devil-community-sun-devil-football-touchdown-arizona-economy-55M'],
  ['phoenix-climate', 'Phoenix September normals', 'National Weather Service', 'https://www.weather.gov/psr/September2021ClimateData'],
  ['wyoming-results', 'Wyoming 2025 statistics', 'Wyoming Athletics', 'https://gowyo.com/sports/football/stats'],
  ['wyoming-2026', 'Wyoming 2026 schedule and signing context', 'Wyoming Athletics', 'https://gowyo.com/news/2026/3/9/wyoming-announces-2026-football-schedule.aspx'],
  ['wyoming-impact', 'UW athletics economic-impact summary', 'University of Wyoming', 'https://www.uwyo.edu/news/uw-in-the-news/2025/09/uw-in-the-news2.html'],
  ['laramie-climate', 'Laramie climate normals', 'National Weather Service', 'https://www.weather.gov/riw/cms_wyclimatenormals'],
] as const;

export const BRAINS_SOURCES = [
  ['herd', 'FY2024 HERD overview', 'NSF / NCSES', 'https://ncses.nsf.gov/pubs/nsf26305'],
  ['herd-table', 'FY2024 institution ranking table', 'NSF / NCSES', 'https://ncses.nsf.gov/pubs/nsf26304/assets/data-tables/tables/nsf26304-tab006.pdf'],
  ['herd-nonse', 'FY2024 non-S&E expenditure table', 'NSF / NCSES', 'https://ncses.nsf.gov/pubs/nsf26304/assets/data-tables/tables/nsf26304-tab023.pdf'],
  ['lunabotics', '2026 Lunabotics winners', 'NASA', 'https://www.nasa.gov/centers-and-facilities/kennedy/nasas-2026-lunabotics-winning-student-teams-engineering-lunar-future/'],
  ['urc', '2026 University Rover Challenge results', 'Mars Society', 'https://urc.marssociety.org/home/about-urc/urc2026-scores'],
  ['rascal', '2026 RASC-AL winners', 'NASA', 'https://www.nasa.gov/directorates/stmd/prizes-challenges-crowdsourcing-program/center-of-excellence-for-collaborative-innovation-coeci/nasa-announces-winners-of-2026-university-innovation-competition/'],
  ['marine', '2026 Marine Energy winners', 'U.S. Department of Energy', 'https://www.energy.gov/cmei/water/articles/does-hydropower-and-hydrokinetic-office-announces-winners-2026-marine-energy'],
  ['blue-skies', 'Gateways to Blue Skies winners', 'NASA', 'https://www.nasa.gov/aeronautics/nasa-announces-winners-in-university-aeronautics-competition/'],
  ['parker', 'Parker Solar Probe 28th close pass', 'NASA', 'https://science.nasa.gov/blogs/parker-solar-probe/2026/06/11/parker-solar-probe-makes-28th-close-pass-of-sun/'],
  ['psyche', 'Psyche mission overview', 'NASA', 'https://science.nasa.gov/mission/psyche/mission-overview/'],
  ['colorado-quantum', 'Colorado quantum seed grants', 'CU Boulder', 'https://www.colorado.edu/today/2026/04/29/colorado-advances-quantum-innovation-3rd-round-seed-grants'],
  ['wyoming-honors', 'Wyoming research honors', 'University of Wyoming', 'https://www.uwyo.edu/research/announcements/news/untitled.html'],
  ['wyoming-students', 'Wyoming undergraduate research event', 'University of Wyoming', 'https://www.uwyo.edu/news/2026/05/uw-community-college-students-present-research-win-awards.html'],
] as const;

export function brainsSource(id: string) {
  const source = BRAINS_SOURCES.find(([sourceId]) => sourceId === id);
  if (!source) throw new Error(`Unknown Brains 25 source: ${id}`);
  return { id: source[0], label: source[1], outlet: source[2], url: source[3] };
}
