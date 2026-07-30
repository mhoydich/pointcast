import {
  COACH_AXIS_LABELS,
  POINTCAST_COACHES_50,
  type CoachAxis,
  type CoachCard,
  type CoachScorecard,
} from './pointcast-coaches-50';

export type CoachWeatherBand = 'heating' | 'clearing' | 'storm-cell';

export type CoachWeatherFront = {
  order: number;
  band: CoachWeatherBand;
  coach: CoachCard;
  pressure: number;
  exactRoom: CoachAxis;
  headline: string;
  forecast: string;
  trigger: string;
  movement: 0;
};

const coachesByName = new Map(
  POINTCAST_COACHES_50.map((entry) => [entry.coach, entry]),
);

const front = (
  order: number,
  band: CoachWeatherBand,
  coachName: string,
  pressure: number,
  exactRoom: CoachAxis,
  headline: string,
  forecast: string,
  trigger: string,
): CoachWeatherFront => {
  const coach = coachesByName.get(coachName);

  if (!coach) {
    throw new Error(`Coach Weather references an unknown coach: ${coachName}`);
  }

  return {
    order,
    band,
    coach,
    pressure,
    exactRoom,
    headline,
    forecast,
    trigger,
    movement: 0,
  };
};

export const COACH_WEATHER_FRONTS: CoachWeatherFront[] = [
  front(
    1,
    'heating',
    'Lane Kiffin',
    96,
    'aura',
    'New city. Same voltage. Much larger weather.',
    'LSU supplies a local player ecology, Saturday-night theater, and an expectation cycle that can accelerate faster than any scheme.',
    'The first month asks whether motion can produce institutional calm.',
  ),
  front(
    2,
    'heating',
    'Kyle Whittingham',
    95,
    'program',
    'The sport’s cleanest portability test.',
    'Michigan did not hire a mood. It hired a two-decade operating system and placed it inside a different recruiting map, staff market, and public scale.',
    'Watch whether the inherited language becomes ordinary behavior before the first rivalry test.',
  ),
  front(
    3,
    'heating',
    'Kalen DeBoer',
    92,
    'fans',
    'Inheritance is becoming authorship.',
    'The Alabama question is no longer whether DeBoer can follow the previous room. It is which parts of the room are recognizably his.',
    'The temperature moves when adaptation starts to feel like a tradition instead of an exception.',
  ),
  front(
    4,
    'heating',
    'Jon Sumrall',
    91,
    'capital',
    'Florida offers fuel and almost no warm-up lap.',
    'The roster geography, facilities, league position, and public impatience all arrive at once. Urgency is useful until it begins designing the work.',
    'The opening depth-chart decisions reveal whether capital is being converted or merely activated.',
  ),
  front(
    5,
    'heating',
    'Lincoln Riley',
    90,
    'program',
    'The beautiful part is proven. The whole is on trial.',
    'USC still possesses quarterback imagination, Los Angeles reach, and national attention. The 2026 weather sits over resistance, physical trust, and repeatability.',
    'The front clears when the least glamorous unit becomes dependable.',
  ),
  front(
    6,
    'clearing',
    'Curt Cignetti',
    64,
    'program',
    'Clarity is its own kind of weather.',
    'Indiana begins from proof rather than aspiration. The risk is not confusion; it is the new weight of being studied, copied, and expected.',
    'The room stays clear if success changes the attention without changing the standards.',
  ),
  front(
    7,
    'clearing',
    'Marcus Freeman',
    62,
    'players',
    'Person, place, and roster are telling one story.',
    'Notre Dame enters with unusually clean alignment among recruiting reach, player trust, public meaning, and the coach’s way of carrying the job.',
    'The remaining cloud is exact: can the complete room produce the final two wins?',
  ),
  front(
    8,
    'clearing',
    'Dan Lanning',
    65,
    'capital',
    'The laboratory has become a football identity.',
    'Oregon’s resources no longer read as decoration. They appear in competition, roster depth, recruiting speed, and the program’s appetite for iteration.',
    'The forecast changes when an opponent makes the lab play slow.',
  ),
  front(
    9,
    'clearing',
    'Mike Elko',
    68,
    'capital',
    'Restraint has become the ambitious idea.',
    'Texas A&M has never lacked inputs. Elko’s early work is to make diagnosis, sequencing, and conversion feel more valuable than another acquisition headline.',
    'The first close game audits whether the room trusts its adult tempo.',
  ),
  front(
    10,
    'clearing',
    'Kalani Sitake',
    60,
    'region',
    'Belonging remains a competitive system.',
    'BYU’s place, faith, diaspora, emotional register, and player profile reinforce one another more naturally than most expensive program plans.',
    'The sky tightens only when weekly talent math overwhelms the belonging engine.',
  ),
  front(
    11,
    'storm-cell',
    'Matt Campbell',
    97,
    'fans',
    'A builder enters a room that already seats the future.',
    'Penn State supplies scale, margin, facilities, and a public that can turn patience into pressure between possessions. Campbell’s intimacy now has 107,000 witnesses.',
    'Watch whether developmental patience can operate at championship speed without becoming theater.',
  ),
  front(
    12,
    'storm-cell',
    'James Franklin',
    96,
    'region',
    'A reboot specialist meets a region asking to recognize itself.',
    'Virginia Tech needs more than recruiting organization. It needs the state, the stadium, alumni energy, and football language to reconnect.',
    'The storm either organizes around regional belonging or collapses into another capital slogan.',
  ),
];

export const COACH_WEATHER_BANDS = [
  {
    id: 'heating',
    label: 'Five heating rooms',
    note: 'Expectation, inheritance, or a new institutional scale is concentrating pressure before kickoff.',
    color: '#ff6843',
  },
  {
    id: 'clearing',
    label: 'Five clearing rooms',
    note: 'The coach, players, place, and public story currently agree about what the work is.',
    color: '#b9ff45',
  },
  {
    id: 'storm-cell',
    label: 'Two storm cells',
    note: 'Volatility, not condemnation: new rooms where multiple conditions can change at once.',
    color: '#7ca8ff',
  },
] as const;

export const COACH_WEATHER_CADENCE = [
  {
    day: 'MON',
    time: '08:30 PT',
    title: 'The Front Map',
    note: 'Five heating, five clearing, and the exact room carrying the pressure.',
  },
  {
    day: 'WED',
    time: '12:14 PT',
    title: 'Room of the Week',
    note: 'One coach-program system inspected beyond the record and the press conference.',
  },
  {
    day: 'FRI',
    time: '15:30 PT',
    title: 'Saturday Pressure',
    note: 'The decisions, matchups, substitutions, and public bargains worth watching.',
  },
  {
    day: 'SUN',
    time: '21:08 PT',
    title: 'Movement Report',
    note: 'What actually changed, what did not, and the receipt attached to every move.',
  },
] as const;

export const PROGRAM_BUILD_DEFAULT: CoachScorecard = Object.fromEntries(
  COACH_AXIS_LABELS.map((axis) => [axis.id, axis.weight]),
) as CoachScorecard;

export const normalizeProgramShape = (
  scores: CoachScorecard,
): CoachScorecard => {
  const amplified = COACH_AXIS_LABELS.map((axis) => ({
    id: axis.id,
    value: Math.max(1, scores[axis.id] - 5) ** 2,
  }));
  const total = amplified.reduce((sum, axis) => sum + axis.value, 0);

  return Object.fromEntries(
    amplified.map((axis) => [axis.id, (axis.value / total) * 100]),
  ) as CoachScorecard;
};

export type ProgramMatch = {
  coach: CoachCard;
  similarity: number;
  shape: CoachScorecard;
  signature: CoachAxis[];
};

export const matchProgramBuild = (
  build: CoachScorecard,
): ProgramMatch => {
  const total = COACH_AXIS_LABELS.reduce(
    (sum, axis) => sum + build[axis.id],
    0,
  );
  const normalizedBuild = Object.fromEntries(
    COACH_AXIS_LABELS.map((axis) => [
      axis.id,
      total > 0 ? (build[axis.id] / total) * 100 : 0,
    ]),
  ) as CoachScorecard;

  return POINTCAST_COACHES_50.map((coach) => {
    const shape = normalizeProgramShape(coach.scores);
    const distance = COACH_AXIS_LABELS.reduce(
      (sum, axis) =>
        sum + Math.abs(normalizedBuild[axis.id] - shape[axis.id]),
      0,
    );
    const signature = [...COACH_AXIS_LABELS]
      .sort((a, b) => shape[b.id] - shape[a.id])
      .slice(0, 2)
      .map((axis) => axis.id);

    return {
      coach,
      similarity: Math.max(0, Math.round(100 - distance / 2)),
      shape,
      signature,
    };
  }).sort(
    (a, b) =>
      b.similarity - a.similarity || a.coach.rank - b.coach.rank,
  )[0];
};

export const COACH_WEATHER_FEATURE = {
  spec: 'pointcast.college-football.coach-weather/v1',
  title: 'COACH WEATHER',
  subtitle: 'Preseason Pressure Map · Dispatch 000',
  dek: 'Rankings say where coaches stand. Weather says what can move them.',
  publishedAt: '2026-07-29T16:10:00-07:00',
  updatedAt: '2026-07-29T16:10:00-07:00',
  asOf: '2026-07-29',
  season: 2026,
  dispatch: '000',
  byline: 'PointCast Coaches Desk',
  canonical: 'https://pointcast.xyz/25/magazine/coach-weather',
  machineEdition: 'https://pointcast.xyz/25/magazine/coach-weather.json',
  block: '0545',
  rankingBase: 'https://pointcast.xyz/25/magazine/coaches-50',
  socialImage:
    'https://pointcast.xyz/images/pointcast-coach-weather/social-card.png',
  thesis:
    'The ranking is a position. Coach Weather is the pressure system around it: the room most likely to change, the evidence that would move it, and the receipt when it does.',
  baseline:
    'No coach moves before the first game. Dispatch 000 records preseason pressure only; every movement field is zero so the season begins with an honest baseline.',
  boundary:
    'Coach Weather is an unofficial, timestamped editorial lens—not a hot-seat report, rumor market, employment evaluation, prediction model, injury report, audited financial analysis, or official publication of any coach, school, conference, broadcaster, award, or governing body.',
  matcherBoundary:
    'Build Your Program is a local editorial toy. Allocations stay in the browser, the result is not a personality test or recommendation, and no school or coach endorses the match.',
} as const;
