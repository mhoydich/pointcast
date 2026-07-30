import { SONG_YARD_PROGRAMS } from './pointcast-college-football-magazine';

export const FAN_CLIQUE_FEATURE = {
  spec: 'pointcast.college-football.fan-clique/v1',
  slug: 'fan-clique-2026',
  title: 'FAN CLIQUE',
  subtitle: 'Vote for my team.',
  dek:
    'Not the best team. Not the biggest brand. Just the school whose people found this button and clicked it most.',
  publishedAt: '2026-07-30T10:18:00-07:00',
  canonical: 'https://pointcast.xyz/25/fan-clique',
  machineEdition: 'https://pointcast.xyz/25/fan-clique.json',
  liveEndpoint: 'https://pointcast.xyz/api/fan-clique',
  socialImage: 'https://pointcast.xyz/images/pointcast-college-football-magazine/social-card.png',
  season: 2026,
  cadence: 'Live standings refresh while the page is open.',
  boundary:
    'Fan Clique is a casual participation game, not a scientific poll or a ranking of football quality. One browser gets one counted click. PointCast is not affiliated with or endorsed by any school, conference, athletic program, or governing body.',
} as const;

export const FAN_CLIQUE_TEAMS = SONG_YARD_PROGRAMS.map((program) => ({
  fieldNumber: program.fieldNumber,
  cohort: program.cohort,
  slug: program.slug,
  school: program.school,
  short: program.short,
  conference: program.conference,
  city: program.city,
  state: program.state,
  primary: program.primary,
  secondary: program.secondary,
  paper: program.paper,
  markName: program.markName,
  markPaths: [...program.markPaths],
}));

export const FAN_CLIQUE_TEAM_SLUGS = new Set(
  FAN_CLIQUE_TEAMS.map((team) => team.slug),
);
