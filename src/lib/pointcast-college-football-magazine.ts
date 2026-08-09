import { POINTCAST_2029_IDENTITIES, type PointCast2029Identity } from './pointcast-2029';

export type CollegeFootballProgramCohort = 'pointcast-25' | 'open-field';
export type RepertoireEvidence =
  | 'stadium-ritual'
  | 'documented-performance'
  | 'pointcast-candidate';
export type RepertoireMoment = 'arrival' | 'in-game' | 'fourth-quarter' | 'postgame' | 'walk-home';

export interface RepertoireTrack {
  title: string;
  artist: string;
  evidence: RepertoireEvidence;
  moment: RepertoireMoment;
  note: string;
  sourceLabel: string;
  sourceUrl: string;
  listenUrl: string;
}

export interface SongYardProgram {
  fieldNumber: number;
  cohort: CollegeFootballProgramCohort;
  slug: string;
  school: string;
  short: string;
  conference: string;
  city: string;
  state: string;
  currentStadium: string;
  markName: string;
  markPaths: string[];
  primary: string;
  secondary: string;
  paper: string;
  repertoire: RepertoireTrack[];
}

const spotifySearch = (title: string, artist: string) =>
  `https://open.spotify.com/search/${encodeURIComponent(`${title} ${artist}`)}`;

const candidate = (
  title: string,
  artist: string,
  moment: RepertoireMoment,
  note: string,
  sourceUrl: string,
): RepertoireTrack => ({
  title,
  artist,
  evidence: 'pointcast-candidate',
  moment,
  note,
  sourceLabel: 'PointCast regional listening proposal',
  sourceUrl,
  listenUrl: spotifySearch(title, artist),
});

const AP_STADIUM_ANTHEMS =
  'https://apnews.com/article/college-football-stadium-anthems-garth-brooks-lsu-806aa9a18d18b5d69566a21c46f8bdbf';

const repertoireBySlug: Record<string, RepertoireTrack[]> = {
  lsu: [
    {
      title: "Callin' Baton Rouge",
      artist: 'Garth Brooks',
      evidence: 'stadium-ritual',
      moment: 'arrival',
      note: 'AP documents the Tiger Stadium crowd turning the Louisiana line into a shared war cry.',
      sourceLabel: 'Associated Press · college-football stadium anthems',
      sourceUrl: AP_STADIUM_ANTHEMS,
      listenUrl: spotifySearch("Callin' Baton Rouge", 'Garth Brooks'),
    },
    candidate('Louisiana Saturday Night', 'Mel McDaniel', 'in-game', 'A literal Saturday-place hook with a compact, teachable chorus.', AP_STADIUM_ANTHEMS),
    candidate('Born on the Bayou', 'Creedence Clearwater Revival', 'walk-home', 'A slower regional afterglow reference, proposed rather than presented as LSU custom.', AP_STADIUM_ANTHEMS),
  ],
  oregon: [
    {
      title: 'Shout',
      artist: 'The Isley Brothers',
      evidence: 'stadium-ritual',
      moment: 'fourth-quarter',
      note: 'AP identifies “Shout” as part of Oregon’s modern game-day repertoire.',
      sourceLabel: 'Associated Press · college-football stadium anthems',
      sourceUrl: AP_STADIUM_ANTHEMS,
      listenUrl: spotifySearch('Shout', 'The Isley Brothers'),
    },
    candidate('Louie Louie', 'The Kingsmen', 'in-game', 'A Portland garage-rock bridge with an extremely legible crowd shape.', AP_STADIUM_ANTHEMS),
    candidate('Feel It Still', 'Portugal. The Man', 'arrival', 'A Pacific Northwest pop pulse with room for a band arrangement.', AP_STADIUM_ANTHEMS),
  ],
  alabama: [
    {
      title: 'Dixieland Delight',
      artist: 'Alabama',
      evidence: 'stadium-ritual',
      moment: 'fourth-quarter',
      note: 'AP lists the track among college football’s established modern anthems and notes that crowd-added lines require care.',
      sourceLabel: 'Associated Press · college-football stadium anthems',
      sourceUrl: AP_STADIUM_ANTHEMS,
      listenUrl: spotifySearch('Dixieland Delight', 'Alabama'),
    },
    candidate('Sweet Home Alabama', 'Lynyrd Skynyrd', 'arrival', 'The obvious statewide reference; PointCast treats it as a candidate, not an owned stadium ritual.', AP_STADIUM_ANTHEMS),
    candidate('If We Make It Through December', 'Merle Haggard', 'walk-home', 'A deliberately quieter late-season counterweight to the giant entrance track.', AP_STADIUM_ANTHEMS),
  ],
  florida: [
    {
      title: "I Won't Back Down",
      artist: 'Tom Petty',
      evidence: 'stadium-ritual',
      moment: 'fourth-quarter',
      note: 'AP documents the fourth-quarter singalong and its Gainesville connection.',
      sourceLabel: 'Associated Press · college-football stadium anthems',
      sourceUrl: AP_STADIUM_ANTHEMS,
      listenUrl: spotifySearch("I Won't Back Down", 'Tom Petty'),
    },
    candidate('American Girl', 'Tom Petty and the Heartbreakers', 'arrival', 'A second Gainesville-rooted track with a faster opening stride.', AP_STADIUM_ANTHEMS),
    candidate("Runnin' Down a Dream", 'Tom Petty', 'postgame', 'A win-or-walk-home proposal that stays inside the same local artist lineage.', AP_STADIUM_ANTHEMS),
  ],
  michigan: [
    {
      title: 'Mr. Brightside',
      artist: 'The Killers',
      evidence: 'stadium-ritual',
      moment: 'fourth-quarter',
      note: 'AP reports that Michigan deliberately moved the song to the third-to-fourth-quarter break.',
      sourceLabel: 'Associated Press · college-football stadium anthems',
      sourceUrl: AP_STADIUM_ANTHEMS,
      listenUrl: spotifySearch('Mr. Brightside', 'The Killers'),
    },
    candidate('Lose Yourself', 'Eminem', 'arrival', 'A Detroit-scale opening reference; proposed here, not claimed as a Michigan Stadium custom.', AP_STADIUM_ANTHEMS),
    candidate("Don't Stop Believin'", 'Journey', 'walk-home', 'The South Detroit line supplies an easy all-ages afterglow chorus.', AP_STADIUM_ANTHEMS),
  ],
  'south-carolina': [
    {
      title: 'Sandstorm',
      artist: 'Darude',
      evidence: 'stadium-ritual',
      moment: 'in-game',
      note: 'AP includes “Sandstorm” among the school-specific modern stadium anthems.',
      sourceLabel: 'Associated Press · college-football stadium anthems',
      sourceUrl: AP_STADIUM_ANTHEMS,
      listenUrl: spotifySearch('Sandstorm', 'Darude'),
    },
    candidate('Rock You Like a Hurricane', 'Scorpions', 'arrival', 'A weather-first entrance proposal with a chorus that can survive a large bowl.', AP_STADIUM_ANTHEMS),
    candidate('September', 'Earth, Wind & Fire', 'walk-home', 'A warmer early-season communal exit rather than another defensive stinger.', AP_STADIUM_ANTHEMS),
  ],
};

const expansionPrograms: Array<Omit<SongYardProgram, 'fieldNumber' | 'cohort'>> = [
  {
    slug: 'west-virginia',
    school: 'West Virginia',
    short: 'WVU',
    conference: 'Big 12',
    city: 'Morgantown',
    state: 'West Virginia',
    currentStadium: 'Milan Puskar Stadium',
    markName: 'Mountain Switchback',
    markPaths: ['M8 79L31 29L48 59L63 20L92 79H73L64 52L49 85L33 56L25 79Z'],
    primary: '#17395c',
    secondary: '#e0ad2e',
    paper: '#eee5ce',
    repertoire: [
      {
        title: 'Take Me Home, Country Roads',
        artist: 'John Denver',
        evidence: 'stadium-ritual',
        moment: 'postgame',
        note: 'WVU Athletics says it has been part of every home pregame since 1972 and follows every home victory.',
        sourceLabel: 'West Virginia University Athletics · Country Roads',
        sourceUrl: 'https://wvusports.com/sports/2017/8/2/country-roads',
        listenUrl: spotifySearch('Take Me Home Country Roads', 'John Denver'),
      },
      candidate('West Virginia, My Home', 'Hazel Dickens', 'walk-home', 'An Appalachian authorship line proposed for the quieter edge of the day.', 'https://wvusports.com/sports/2017/8/2/country-roads'),
      candidate('Mountain Music', 'Alabama', 'arrival', 'A bright regional candidate whose call-and-answer can be learned outside the bowl.', 'https://wvusports.com/sports/2017/8/2/country-roads'),
    ],
  },
  {
    slug: 'ucla',
    school: 'UCLA',
    short: 'UCLA',
    conference: 'Big Ten',
    city: 'Los Angeles',
    state: 'California',
    currentStadium: 'Rose Bowl',
    markName: 'Pacific Ribbon',
    markPaths: ['M8 35C27 17 42 18 56 35C69 51 78 48 92 34V57C73 73 57 72 43 55C31 41 21 42 8 58Z'],
    primary: '#2b69a7',
    secondary: '#f0bf45',
    paper: '#edf0df',
    repertoire: [
      {
        title: 'Play That Funky Music',
        artist: 'Wild Cherry',
        evidence: 'documented-performance',
        moment: 'in-game',
        note: 'UCLA’s band history documents a Rose Bowl pregame performance with the dance team; this is evidence of use, not a claim of permanent ritual.',
        sourceLabel: 'UCLA Marching Band · traditions',
        sourceUrl: 'https://band.ucla.edu/traditions/',
        listenUrl: spotifySearch('Play That Funky Music', 'Wild Cherry'),
      },
      candidate('California Love', '2Pac feat. Dr. Dre', 'arrival', 'A Los Angeles-scale brass and drum proposal with an instantly shared first gesture.', 'https://band.ucla.edu/traditions/'),
      candidate('I Love L.A.', 'Randy Newman', 'postgame', 'A civic singalong candidate for the long Rose Bowl exit.', 'https://band.ucla.edu/traditions/'),
    ],
  },
  {
    slug: 'michigan-state',
    school: 'Michigan State',
    short: 'MSU',
    conference: 'Big Ten',
    city: 'East Lansing',
    state: 'Michigan',
    currentStadium: 'Spartan Stadium',
    markName: 'Cedar Step',
    markPaths: ['M16 18H84V34H33V47H76V63H33V82H16Z'],
    primary: '#1e5a44',
    secondary: '#101a18',
    paper: '#e8e4cf',
    repertoire: [
      {
        title: 'Thunderstruck',
        artist: 'AC/DC',
        evidence: 'stadium-ritual',
        moment: 'arrival',
        note: 'Michigan State student reporting in 2026 describes the familiar tunnel entrance with the track playing in Spartan Stadium.',
        sourceLabel: 'Spartan Newsroom · 2026 spring showcase',
        sourceUrl: 'https://news.jrn.msu.edu/2026/04/fans-get-first-glance-of-fitzgerald-era-in-msu-football-spring-showcase/',
        listenUrl: spotifySearch('Thunderstruck', 'AC/DC'),
      },
      candidate('Lose Yourself', 'Eminem', 'in-game', 'A Michigan-rooted pressure track proposed for the defensive side of the program.', 'https://news.jrn.msu.edu/2026/04/fans-get-first-glance-of-fitzgerald-era-in-msu-football-spring-showcase/'),
      candidate("Don't Stop Believin'", 'Journey', 'walk-home', 'A cross-generational Michigan afterglow candidate with a crowd-ready chorus.', 'https://news.jrn.msu.edu/2026/04/fans-get-first-glance-of-fitzgerald-era-in-msu-football-spring-showcase/'),
    ],
  },
  {
    slug: 'arizona-state',
    school: 'Arizona State',
    short: 'ASU',
    conference: 'Big 12',
    city: 'Tempe',
    state: 'Arizona',
    currentStadium: 'Mountain America Stadium',
    markName: 'Desert Relay',
    markPaths: ['M12 64H34L43 18H57L66 64H88V82H58L50 48L42 82H12Z'],
    primary: '#8d2442',
    secondary: '#e3a62f',
    paper: '#eddfc4',
    repertoire: [
      {
        title: 'Boom (Here Comes the Boom)',
        artist: 'P.O.D.',
        evidence: 'stadium-ritual',
        moment: 'arrival',
        note: 'A Sun Devil traditions archive documents the kickoff ritual — when the song calls “here comes the boom,” the stadium answers “boom” — and an ASU News alumni story confirms the track is P.O.D.’s and greets game use.',
        sourceLabel: 'Sun Devil traditions archive · kickoff boom response',
        sourceUrl: 'https://asutraditions.wordpress.com/traditions/',
        listenUrl: spotifySearch('Boom', 'P.O.D.'),
      },
      candidate('The Middle', 'Jimmy Eat World', 'fourth-quarter', 'A Mesa-made reassurance chorus that fits a late-game communal reset.', 'https://news.asu.edu/b/20250128-every-sun-devil-wins-firstever-license-plate-sweepstakes'),
      candidate('Hey Jealousy', 'Gin Blossoms', 'walk-home', 'A Tempe-born afterglow candidate with local authorship and an open chorus.', 'https://news.asu.edu/b/20250128-every-sun-devil-wins-firstever-license-plate-sweepstakes'),
    ],
  },
  {
    slug: 'colorado',
    school: 'Colorado',
    short: 'CU',
    conference: 'Big 12',
    city: 'Boulder',
    state: 'Colorado',
    currentStadium: 'Folsom Field',
    markName: 'Flatiron Run',
    markPaths: ['M8 82L28 37L39 57L55 17L92 82H72L56 48L41 84L28 63L20 82Z'],
    primary: '#22201d',
    secondary: '#c6a34a',
    paper: '#ece5d3',
    repertoire: [
      {
        title: 'Halftime (Stand Up and Get Crunk)',
        artist: 'Ying Yang Twins',
        evidence: 'documented-performance',
        moment: 'arrival',
        note: 'CU Boulder reported that the Golden Buffalo Marching Band played the Coach Prime theme at every game in the documented era.',
        sourceLabel: 'CU Boulder Today · band in the Prime era',
        sourceUrl: 'https://www.colorado.edu/today/2023/10/31/embracing-prime-era-how-band-thriving-beyond-field',
        listenUrl: spotifySearch('Halftime Stand Up and Get Crunk', 'Ying Yang Twins'),
      },
      candidate('Rocky Mountain High', 'John Denver', 'walk-home', 'A slow, place-specific exit proposal that lets the Flatirons remain in the song.', 'https://www.colorado.edu/today/2023/10/31/embracing-prime-era-how-band-thriving-beyond-field'),
      candidate('Rocky Mountain Way', 'Joe Walsh', 'in-game', 'A riff-first Colorado candidate with enough open space for the band and bowl.', 'https://www.colorado.edu/today/2023/10/31/embracing-prime-era-how-band-thriving-beyond-field'),
    ],
  },
  {
    slug: 'kansas',
    school: 'Kansas',
    short: 'KU',
    conference: 'Big 12',
    city: 'Lawrence',
    state: 'Kansas',
    currentStadium: 'David Booth Kansas Memorial Stadium',
    markName: 'Wheat Signal',
    markPaths: ['M48 9H57V91H48Z', 'M45 25L20 13V29L45 40ZM60 42L86 29V45L60 57ZM45 60L19 47V64L45 77Z'],
    primary: '#b52c32',
    secondary: '#24518a',
    paper: '#eee5cb',
    repertoire: [
      {
        title: 'Home on the Range',
        artist: 'The University of Kansas Marching Jayhawks',
        evidence: 'stadium-ritual',
        moment: 'postgame',
        note: 'KU band history says the state song became a permanent part of the repertoire; Kansas tourism documents it at the end of home football games.',
        sourceLabel: 'University of Kansas School of Music · band history',
        sourceUrl: 'https://music.ku.edu/alumni-band-ku-band-history',
        listenUrl: spotifySearch('Home on the Range', 'University of Kansas Marching Jayhawks'),
      },
      candidate('Carry on Wayward Son', 'Kansas', 'fourth-quarter', 'A Topeka-born rock chorus proposed as a modern Kansas counterweight.', 'https://music.ku.edu/alumni-band-ku-band-history'),
      candidate('Dust in the Wind', 'Kansas', 'walk-home', 'A deliberately quiet local-band reprise for the end of the day.', 'https://music.ku.edu/alumni-band-ku-band-history'),
    ],
  },
  {
    slug: 'rutgers',
    school: 'Rutgers',
    short: 'RU',
    conference: 'Big Ten',
    city: 'Piscataway',
    state: 'New Jersey',
    currentStadium: 'SHI Stadium',
    markName: 'Raritan Bell',
    markPaths: ['M26 67V43C26 27 36 17 50 17C64 17 74 27 74 43V67L87 78H13ZM40 82H60V91H40Z'],
    primary: '#b83135',
    secondary: '#242629',
    paper: '#eee5d4',
    repertoire: [
      {
        title: 'Born to Run',
        artist: 'Bruce Springsteen',
        evidence: 'documented-performance',
        moment: 'arrival',
        note: 'Rutgers’ arts magazine documents the marching band performing the New Jersey medley at MetLife Stadium.',
        sourceLabel: 'Rutgers Mason Gross · Field of Dreams',
        sourceUrl: 'https://www.masongross.rutgers.edu/wp-content/uploads/2024/07/MGSA-Spring-Issue-2014-3-27-FINAL-MED-RES_web.pdf',
        listenUrl: spotifySearch('Born to Run', 'Bruce Springsteen'),
      },
      {
        title: "Livin' on a Prayer",
        artist: 'Bon Jovi',
        evidence: 'documented-performance',
        moment: 'fourth-quarter',
        note: 'The same Rutgers account documents the marching band’s performance of the New Jersey anthem candidate.',
        sourceLabel: 'Rutgers Mason Gross · Field of Dreams',
        sourceUrl: 'https://www.masongross.rutgers.edu/wp-content/uploads/2024/07/MGSA-Spring-Issue-2014-3-27-FINAL-MED-RES_web.pdf',
        listenUrl: spotifySearch("Livin' on a Prayer", 'Bon Jovi'),
      },
      candidate('Welcome to the Black Parade', 'My Chemical Romance', 'walk-home', 'A New Jersey generational handoff proposed for the student end, not claimed as current custom.', 'https://www.masongross.rutgers.edu/wp-content/uploads/2024/07/MGSA-Spring-Issue-2014-3-27-FINAL-MED-RES_web.pdf'),
    ],
  },
  {
    slug: 'syracuse',
    school: 'Syracuse',
    short: 'SYR',
    conference: 'ACC',
    city: 'Syracuse',
    state: 'New York',
    currentStadium: 'JMA Wireless Dome',
    markName: 'Dome Light',
    markPaths: ['M12 73C15 34 30 16 50 16C70 16 85 34 88 73H71C68 46 61 34 50 34C39 34 32 46 29 73ZM9 78H91V90H9Z'],
    primary: '#d95d28',
    secondary: '#173856',
    paper: '#eee2c9',
    repertoire: [
      {
        title: 'Empire State of Mind',
        artist: 'Jay-Z feat. Alicia Keys',
        evidence: 'documented-performance',
        moment: 'arrival',
        note: 'A New York State Senate resolution records Syracuse and Rutgers performing the New York/New Jersey medley at Super Bowl XLVIII.',
        sourceLabel: 'New York State Senate · Syracuse marching-band resolution',
        sourceUrl: 'https://www.nysenate.gov/legislation/resolutions/2013/2013-j3552',
        listenUrl: spotifySearch('Empire State of Mind', 'Jay-Z Alicia Keys'),
      },
      candidate('New York State of Mind', 'Billy Joel', 'walk-home', 'A state-scale quiet reprise suited to the Dome emptying into winter.', 'https://www.nysenate.gov/legislation/resolutions/2013/2013-j3552'),
      candidate('New York Groove', 'Ace Frehley', 'postgame', 'A compact win-song proposal with a title the whole state can claim.', 'https://www.nysenate.gov/legislation/resolutions/2013/2013-j3552'),
    ],
  },
  {
    slug: 'wisconsin',
    school: 'Wisconsin',
    short: 'WIS',
    conference: 'Big Ten',
    city: 'Madison',
    state: 'Wisconsin',
    currentStadium: 'Camp Randall Stadium',
    markName: 'Lake Jump',
    markPaths: ['M10 24H28L39 61L50 34L61 61L72 24H90L69 85H53L50 73L47 85H31Z'],
    primary: '#b92d34',
    secondary: '#293447',
    paper: '#eee7d7',
    repertoire: [
      {
        title: 'Jump Around',
        artist: 'House of Pain',
        evidence: 'stadium-ritual',
        moment: 'fourth-quarter',
        note: 'AP traces the Camp Randall tradition to 1998 and the student-athlete game-presentation brainstorm that started it.',
        sourceLabel: 'Associated Press · college-football stadium anthems',
        sourceUrl: AP_STADIUM_ANTHEMS,
        listenUrl: spotifySearch('Jump Around', 'House of Pain'),
      },
      candidate('Roll Out the Barrel', 'Frankie Yankovic', 'in-game', 'A polka-scale bridge between older Wisconsin repertoire and the student section.', AP_STADIUM_ANTHEMS),
      candidate('Good Life', 'Kanye West feat. T-Pain', 'postgame', 'A Midwest pop exit proposal with an open celebratory refrain.', AP_STADIUM_ANTHEMS),
    ],
  },
  {
    slug: 'virginia-tech',
    school: 'Virginia Tech',
    short: 'VT',
    conference: 'ACC',
    city: 'Blacksburg',
    state: 'Virginia',
    currentStadium: 'Lane Stadium',
    markName: 'New River Pulse',
    markPaths: ['M8 49H29L40 18L52 71L64 36L73 49H92V67H65L56 55L39 91L29 67H8Z'],
    primary: '#7f243d',
    secondary: '#cb5f2d',
    paper: '#ede2cc',
    repertoire: [
      {
        title: 'Enter Sandman',
        artist: 'Metallica',
        evidence: 'stadium-ritual',
        moment: 'arrival',
        note: 'AP documents the 25-year Lane Stadium entrance tradition and its scoreboard-era origin.',
        sourceLabel: 'Associated Press · Enter Sandman at Virginia Tech',
        sourceUrl: 'https://apnews.com/article/4799104bef2def1decc2a638f37a1619',
        listenUrl: spotifySearch('Enter Sandman', 'Metallica'),
      },
      candidate('The Man', 'The Killers', 'in-game', 'A compact response candidate whose title naturally hands a line to the student section.', 'https://apnews.com/article/4799104bef2def1decc2a638f37a1619'),
      candidate('Take Me Home Tonight', 'Eddie Money', 'walk-home', 'A soft landing after the maximal entrance, proposed for the exit rather than kickoff.', 'https://apnews.com/article/4799104bef2def1decc2a638f37a1619'),
    ],
  },
];

const asTop25Program = (
  identity: PointCast2029Identity,
  fieldNumber: number,
): SongYardProgram => ({
  fieldNumber,
  cohort: 'pointcast-25',
  slug: identity.slug,
  school: identity.school,
  short: identity.short,
  conference: identity.conference,
  city: identity.city,
  state: identity.state,
  currentStadium: identity.currentStadium,
  markName: identity.markName,
  markPaths: identity.markPaths,
  primary: identity.primary,
  secondary: identity.secondary,
  paper: identity.paper,
  repertoire: repertoireBySlug[identity.slug] || [],
});

export const SONG_YARD_PROGRAMS: SongYardProgram[] = [
  ...POINTCAST_2029_IDENTITIES.map(asTop25Program),
  ...expansionPrograms.map((program, index) => ({
    ...program,
    fieldNumber: POINTCAST_2029_IDENTITIES.length + index + 1,
    cohort: 'open-field' as const,
  })),
];

export const SONG_YARD_REPERTOIRE_PROGRAMS = SONG_YARD_PROGRAMS.filter(
  (program) => program.repertoire.length > 0,
);

export const SONG_YARD_REPERTOIRE = SONG_YARD_REPERTOIRE_PROGRAMS.flatMap((program) =>
  program.repertoire.map((track) => ({
    program: program.school,
    programSlug: program.slug,
    cohort: program.cohort,
    ...track,
  })),
);

export const COLLEGE_FOOTBALL_MAGAZINE = {
  spec: 'pointcast.college-football-magazine/v1',
  title: 'POINTCAST COLLEGE FOOTBALL',
  issue: '001',
  issueName: "TALKIN' SEASON",
  publishedAt: '2026-07-28T09:42:00-07:00',
  canonical: 'https://pointcast.xyz/25/magazine',
  machineEdition: 'https://pointcast.xyz/25/magazine.json',
  block: '0530',
  thesis:
    'The ranking is one department. The season is the magazine: reasons, receipts, stadium life, mascots, future campuses, songs, and the memory of what changed.',
  departments: [
    {
      number: '01',
      name: 'The Belief Board',
      kicker: 'Ranking / reasons / next proof',
      description: 'The current 25, with a falsifiable case and doubt attached to every number.',
      href: '/25',
    },
    {
      number: '02',
      name: 'The Receipt Book',
      kicker: 'Sources / disagreements / corrections',
      description: 'What PointCast claimed, what the reference boards said, and what remains unresolved.',
      href: '/25/receipts',
    },
    {
      number: '03',
      name: 'The Song Yard',
      kicker: 'Stadium life / repertoire / practice',
      description: 'Original practice music beside a researched atlas of the songs crowds already know.',
      href: '/25/2029/song-yard',
    },
    {
      number: '04',
      name: 'The Mascot Desk',
      kicker: 'Local mythology / card battler',
      description: 'Place, weather, history, and creature class rendered as a playable Saturday mythology.',
      href: '/mascot-battler',
    },
    {
      number: '05',
      name: 'Future School',
      kicker: '2029 identities / stadiums / gear',
      description: 'Original visual systems and civic stadium futures built from place rather than borrowed logos.',
      href: '/25/2029',
    },
    {
      number: '06',
      name: 'Saturday Commons',
      kicker: 'Third spaces / fan tools / print shop',
      description: 'The field kit for everything useful around the game, including the days without a game.',
      href: '/25/2029/field-kit',
    },
    {
      number: '07',
      name: 'The Season Ledger',
      kicker: 'Every board / nothing deleted',
      description: 'The append-only memory that turns weekly opinion into an end-of-season autopsy.',
      href: '/25/season',
    },
    {
      number: '08',
      name: 'The House Desk',
      kicker: 'College life / fraternity / sorority / architecture',
      description: 'Longform campus culture: houses, friendships, traditions, capital, exclusions, access, and repair.',
      href: '/25/magazine/sorority-row',
      previousFeature: '/25/magazine/the-house-we-borrowed',
    },
    {
      number: '09',
      name: 'The Sound Desk',
      kicker: 'Attention / listening / playable study',
      description: 'The work before the stadium: five focus states, five listening rooms, and one private field study.',
      href: '/25/magazine/sound-of-focus',
    },
    {
      number: '10',
      name: 'The Coaches Desk',
      kicker: 'Program / capital / players / place / aura',
      description: 'The PointCast 50 for 2026: the coach, the seven rooms around the coach, and the next question.',
      href: '/25/magazine/coaches-50',
    },
    {
      number: '11',
      name: 'Coach Weather',
      kicker: 'Pressure / movement / receipts / return rhythm',
      description: 'The recurring forecast around the ranking: twelve preseason fronts, the exact room that can move, and a local program builder.',
      href: '/25/magazine/coach-weather',
    },
    {
      number: '12',
      name: 'Fan Clique',
      kicker: 'Choose / click / summon the crowd',
      description: 'A live social game with one rule: the school whose people click the button most leads the room.',
      href: '/25/fan-clique',
    },
    {
      number: '13',
      name: 'The Rally Desk',
      kicker: 'Recruit / relay / make the room visible',
      description: 'A 35-school promotion kit with team links, copyable calls, original campaign art, and one public media invitation.',
      href: '/25/fan-clique/rally',
    },
    {
      number: '14',
      name: 'The Noun Press',
      kicker: '50 Nouns / profiles / wallpaper / free editions',
      description: 'Fifty official-trait CC0 Nouns remixed through place, campus design research, and a six-study image press—free to download, remix, and collect.',
      href: '/25/collect/signal-stamps',
    },
    {
      number: '15',
      name: 'Kiffin Check',
      kicker: 'Players / capital / area / press / foes',
      description: 'A preseason LSU merger audit: eight ecosystem temperatures, the Ole Miss split screen, five season-changing games, and a carefully labeled Finebaum synthesis.',
      href: '/25/magazine/lane-kiffin-temperature',
    },
    {
      number: '16',
      name: 'California State Desk',
      kicker: 'Eight programs / five conferences / one missing ritual',
      description: 'A state report, 2025 attendance ledger, 2026 in-state circuit, and five-part compact for building a Saturday California can recognize as its own.',
      href: '/25/magazine/california-football',
    },
    {
      number: '17',
      name: 'The California Cup',
      kicker: 'Seven games / two trophies / one private circuit card',
      description: 'A season-long table that keeps football results separate from a five-dimension host invitation score, plus a browser-local fan card for picks and field-note priorities.',
      href: '/25/magazine/california-cup',
    },
    {
      number: '18',
      name: 'Georgia, Ground Zero',
      kicker: 'Machine / students / Athens / state / the Hedges Test',
      description: 'A reported field essay on college football’s most complete operating system—and seven questions for keeping the Saturday human.',
      href: '/25/magazine/georgia-ground-zero',
    },
    {
      number: '19',
      name: 'Western Heat / Brains 25',
      kicker: 'Football / research / place / public proof',
      description: 'A double issue on what football does to Colorado, Arizona State, and Wyoming—followed by a research Power 25 that keeps resources, results, and student agency on separate boards.',
      href: '/25/magazine/western-heat-brains',
    },
  ],
  sourcePolicy: [
    'Stadium ritual means a reliable source documents repeated game-day use.',
    'Documented performance means the band or program used the song, but permanence is not claimed.',
    'PointCast candidate means editorial proposal only: a regional or structural fit worth testing.',
    'Listening links open a licensed provider search. PointCast does not host, stream, sample, transcribe, or reproduce recordings or lyrics.',
  ],
  boundary:
    'Unofficial editorial magazine and speculative design system. PointCast is not affiliated with or endorsed by any school, conference, stadium, band, artist, label, publisher, or governing body.',
} as const;

export const COLLEGE_FOOTBALL_RESEARCH_SOURCES = [
  {
    label: 'Associated Press · How pop music became a modern college-football tradition',
    url: AP_STADIUM_ANTHEMS,
  },
  {
    label: 'West Virginia Athletics · Take Me Home, Country Roads',
    url: 'https://wvusports.com/sports/2017/8/2/country-roads',
  },
  {
    label: 'UCLA Marching Band · traditions',
    url: 'https://band.ucla.edu/traditions/',
  },
  {
    label: 'Spartan Newsroom · Thunderstruck entrance, 2026',
    url: 'https://news.jrn.msu.edu/2026/04/fans-get-first-glance-of-fitzgerald-era-in-msu-football-spring-showcase/',
  },
  {
    label: 'Sun Devil traditions archive · kickoff boom response',
    url: 'https://asutraditions.wordpress.com/traditions/',
  },
  {
    label: 'ASU News · P.O.D. boom response plate story',
    url: 'https://news.asu.edu/b/20250128-every-sun-devil-wins-firstever-license-plate-sweepstakes',
  },
  {
    label: 'CU Boulder Today · Halftime in the Prime-era band book',
    url: 'https://www.colorado.edu/today/2023/10/31/embracing-prime-era-how-band-thriving-beyond-field',
  },
  {
    label: 'University of Kansas School of Music · band history',
    url: 'https://music.ku.edu/alumni-band-ku-band-history',
  },
  {
    label: 'Rutgers Mason Gross · New Jersey / New York band medley',
    url: 'https://www.masongross.rutgers.edu/wp-content/uploads/2024/07/MGSA-Spring-Issue-2014-3-27-FINAL-MED-RES_web.pdf',
  },
  {
    label: 'New York State Senate · Syracuse marching-band resolution',
    url: 'https://www.nysenate.gov/legislation/resolutions/2013/2013-j3552',
  },
  {
    label: 'Associated Press · Enter Sandman at Virginia Tech',
    url: 'https://apnews.com/article/4799104bef2def1decc2a638f37a1619',
  },
] as const;
