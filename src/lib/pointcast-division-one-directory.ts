import programSource from '../data/division-one-football-programs.json';
import { POINTCAST_25 } from './pointcast-25';

export type DivisionOneSubdivision = 'FBS' | 'FCS';
export type DivisionOneInstitutionType = 'Public' | 'Private';

interface DivisionOneProgramSource {
  ncaaId: number;
  officialName: string;
  subdivision: DivisionOneSubdivision;
  conference: string;
  state: string;
  institutionType: DivisionOneInstitutionType;
  hbcu: boolean;
  institutionUrl: string | null;
  athleticsUrl: string | null;
}

const DISPLAY_NAME_OVERRIDES: Record<string, string> = {
  'Brigham Young University': 'BYU',
  'California Polytechnic State University, San Luis Obispo': 'Cal Poly',
  'Georgia Institute of Technology': 'Georgia Tech',
  'Indiana University, Bloomington': 'Indiana',
  'Louisiana State University': 'LSU',
  'Miami University (Ohio)': 'Miami (Ohio)',
  'Pennsylvania State University': 'Penn State',
  'Rutgers, The State University of New Jersey, New Brunswick': 'Rutgers',
  'Texas A&M University, College Station': 'Texas A&M',
  'The Ohio State University': 'Ohio State',
  'The University of Texas Rio Grande Valley': 'UT Rio Grande Valley',
  'U.S. Air Force Academy': 'Air Force',
  'U.S. Military Academy': 'Army',
  'U.S. Naval Academy': 'Navy',
  'University at Albany': 'Albany',
  'University at Buffalo, the State University of New York': 'Buffalo',
  'University of California, Berkeley': 'California',
  'University of California, Davis': 'UC Davis',
  'University of California, Los Angeles': 'UCLA',
  'University of Connecticut': 'UConn',
  'University of Hawaii, Manoa': 'Hawaiʻi',
  'University of Louisiana at Lafayette': 'Louisiana',
  'University of Louisiana at Monroe': 'ULM',
  'University of Maryland, College Park': 'Maryland',
  'University of Massachusetts Amherst': 'UMass',
  'University of Miami (Florida)': 'Miami',
  'University of Mississippi': 'Ole Miss',
  'University of Missouri, Columbia': 'Missouri',
  'University of Nebraska-Lincoln': 'Nebraska',
  'University of Nevada, Las Vegas': 'UNLV',
  'University of Nevada, Reno': 'Nevada',
  'University of North Carolina at Chapel Hill': 'North Carolina',
  'University of North Carolina at Charlotte': 'Charlotte',
  'University of South Carolina, Columbia': 'South Carolina',
  'University of Southern California': 'USC',
  'University of Tennessee, Knoxville': 'Tennessee',
  'University of Texas at Austin': 'Texas',
  'University of Texas at El Paso': 'UTEP',
  'University of Texas at San Antonio': 'UTSA',
  'University of Wisconsin-Madison': 'Wisconsin',
  'Virginia Polytechnic Institute and State University': 'Virginia Tech',
};

export const DIVISION_ONE_STATE_NAMES: Record<string, string> = {
  AL: 'Alabama', AR: 'Arkansas', AZ: 'Arizona', CA: 'California', CO: 'Colorado',
  CT: 'Connecticut', DC: 'District of Columbia', DE: 'Delaware', FL: 'Florida',
  GA: 'Georgia', HI: 'Hawaiʻi', IA: 'Iowa', ID: 'Idaho', IL: 'Illinois',
  IN: 'Indiana', KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', MA: 'Massachusetts',
  MD: 'Maryland', ME: 'Maine', MI: 'Michigan', MN: 'Minnesota', MO: 'Missouri',
  MS: 'Mississippi', MT: 'Montana', NC: 'North Carolina', ND: 'North Dakota',
  NE: 'Nebraska', NH: 'New Hampshire', NJ: 'New Jersey', NM: 'New Mexico',
  NV: 'Nevada', NY: 'New York', OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregon',
  PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota',
  TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VA: 'Virginia', WA: 'Washington',
  WI: 'Wisconsin', WV: 'West Virginia', WY: 'Wyoming',
};

export function divisionOneDisplayName(officialName: string): string {
  const override = DISPLAY_NAME_OVERRIDES[officialName];
  if (override) return override;

  return officialName
    .replace(/^The University of /, '')
    .replace(/^University of /, '')
    .replace(/ University$/, '')
    .replace(/, Main Campus$/, '')
    .trim();
}

export function divisionOneProgramSlug(officialName: string): string {
  return officialName
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

const pointcastRankBySchool = new Map(
  POINTCAST_25.teams.map((team) => [team.school, team.rank]),
);

const normalizedPrograms = (programSource as DivisionOneProgramSource[]).map((program) => {
  const displayName = divisionOneDisplayName(program.officialName);
  return {
    ...program,
    displayName,
    slug: divisionOneProgramSlug(program.officialName),
    stateName: DIVISION_ONE_STATE_NAMES[program.state] ?? program.state,
    pointcastRank: pointcastRankBySchool.get(displayName) ?? null,
  };
});

export const DIVISION_ONE_PROGRAMS = normalizedPrograms
  .slice()
  .sort((a, b) => {
    if (a.pointcastRank && b.pointcastRank) return a.pointcastRank - b.pointcastRank;
    if (a.pointcastRank) return -1;
    if (b.pointcastRank) return 1;
    if (a.subdivision !== b.subdivision) return a.subdivision === 'FBS' ? -1 : 1;
    return a.displayName.localeCompare(b.displayName);
  })
  .map((program, index) => ({ ...program, fieldPosition: index + 1 }));

export const DIVISION_ONE_CONFERENCES = Array.from(
  new Set(DIVISION_ONE_PROGRAMS.map((program) => program.conference)),
).sort((a, b) => a.localeCompare(b));

export const DIVISION_ONE_STATES = Array.from(
  new Set(DIVISION_ONE_PROGRAMS.map((program) => program.state)),
).sort((a, b) => (DIVISION_ONE_STATE_NAMES[a] ?? a).localeCompare(DIVISION_ONE_STATE_NAMES[b] ?? b));

export const DIVISION_ONE_DIRECTORY = {
  spec: 'pointcast.division-one-football-directory/v1',
  title: 'THE SATURDAY ATLAS',
  subtitle: 'Every Division I football program. One honest place to begin.',
  issue: 'Directory Desk 001',
  publishedAt: '2026-08-12T16:08:00-07:00',
  asOf: '2026-08-12',
  academicYear: '2026–27',
  canonical: 'https://pointcast.xyz/25/directory',
  machineEdition: 'https://pointcast.xyz/25/directory.json',
  socialImage: 'https://pointcast.xyz/images/pointcast-d1-directory/social-card.png',
  block: '0570',
  counts: {
    programs: DIVISION_ONE_PROGRAMS.length,
    fbs: DIVISION_ONE_PROGRAMS.filter((program) => program.subdivision === 'FBS').length,
    fcs: DIVISION_ONE_PROGRAMS.filter((program) => program.subdivision === 'FCS').length,
    hbcu: DIVISION_ONE_PROGRAMS.filter((program) => program.hbcu).length,
    statesAndDistrict: DIVISION_ONE_STATES.length,
    conferences: DIVISION_ONE_CONFERENCES.length,
  },
  fieldOrder:
    'The current PointCast 25 appears first in exact board order. Positions 26–266 are browse order: remaining FBS programs A–Z, then FCS programs A–Z. They are not a claimed national quality ranking.',
  studentPromise:
    'Use the atlas to find a school, compare football subdivisions and conference maps, open official campus and athletics sources, and keep a private browser-local shortlist. No signup, profile, location, or server write is required.',
  studentQuestions: [
    'How do student tickets work, and can first-year students realistically get them?',
    'Can students reach the stadium without a car, and what does the trip home feel like?',
    'Does football create one shared campus room—or crowd out the rest of campus life?',
    'What is the school like on the other six days, and on Saturdays when the team is away?',
    'Which official admissions, aid, housing, accessibility, and student-life pages answer the real decision?',
  ],
  sources: [
    {
      label: 'NCAA Directory · Division I-FBS football institutions',
      url: 'https://web3.ncaa.org/directory/memberList?division=I-FBS&sportCode=MFB&type=12',
      checkedAt: '2026-08-12',
      records: 138,
    },
    {
      label: 'NCAA Directory · Division I-FCS football institutions',
      url: 'https://web3.ncaa.org/directory/memberList?division=I-FCS&sportCode=MFB&type=12',
      checkedAt: '2026-08-12',
      records: 128,
    },
    {
      label: 'NCAA · Division I subdivisions and student-athlete overview',
      url: 'https://www.ncaa.org/division-i/',
      checkedAt: '2026-08-12',
    },
    {
      label: 'PointCast 25 · Board 000 methodology and receipts',
      url: 'https://pointcast.xyz/25',
      checkedAt: '2026-08-12',
    },
  ],
  boundaries: {
    official: false,
    affiliation:
      'Unofficial student-facing editorial directory. PointCast is not affiliated with or endorsed by the NCAA, any school, conference, athletics program, admissions office, or governing body.',
    ranking:
      'Only the first 25 programs carry a PointCast football rank. Directory position outside the top 25 is not a football, academic, admissions, value, or student-experience score.',
    admissions:
      'Institutional and athletics links are starting points. Students should verify current admissions, aid, housing, accessibility, ticket, safety, and program information with the institution.',
    privacy:
      'Search, filters, and the shortlist run in the browser. The page does not request location or send shortlist choices to PointCast.',
  },
} as const;

export type DivisionOneProgram = (typeof DIVISION_ONE_PROGRAMS)[number];
