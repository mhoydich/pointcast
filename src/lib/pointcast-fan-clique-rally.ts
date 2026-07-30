import {
  FAN_CLIQUE_FEATURE,
  FAN_CLIQUE_TEAMS,
} from './pointcast-fan-clique';

const campaign = 'fan-clique-rally-001';
const canonical = 'https://pointcast.xyz/25/fan-clique/rally';

const taggedGameUrl = (slug: string) => {
  const url = new URL(FAN_CLIQUE_FEATURE.canonical);
  url.searchParams.set('team', slug);
  url.searchParams.set('utm_source', 'fan-clique-rally');
  url.searchParams.set('utm_medium', 'fan-share');
  url.searchParams.set('utm_campaign', campaign);
  return url.toString();
};

export const FAN_CLIQUE_RALLY = {
  spec: 'pointcast.college-football.fan-clique-rally/v1',
  slug: campaign,
  title: 'MAKE YOUR SCHOOL IMPOSSIBLE TO IGNORE.',
  subtitle: 'The Fan Clique Rally Kit',
  dek:
    'Thirty-five schools. One live room. Pick yours, copy the call, and see which crowd can move a public board.',
  publishedAt: '2026-07-30T11:06:00-07:00',
  canonical,
  machineEdition: `${canonical}.json`,
  liveEndpoint: FAN_CLIQUE_FEATURE.liveEndpoint,
  game: FAN_CLIQUE_FEATURE.canonical,
  socialImage:
    'https://pointcast.xyz/images/pointcast-fan-clique-rally/social-card.png',
  assets: [
    {
      number: '01',
      title: 'The Room Is Open',
      src: '/images/pointcast-fan-clique-rally/the-room-is-open.png',
    },
    {
      number: '02',
      title: 'Conference Rush',
      src: '/images/pointcast-fan-clique-rally/conference-rush.png',
    },
    {
      number: '03',
      title: 'Send In Your People',
      src: '/images/pointcast-fan-clique-rally/send-in-your-people.png',
    },
  ],
  launchLadder: [
    {
      threshold: 1,
      label: 'FIRST CLICK',
      instruction: 'Choose a school and make the board real.',
    },
    {
      threshold: 25,
      label: 'FIRST SECTION',
      instruction: 'Move the link through one student or alumni group.',
    },
    {
      threshold: 100,
      label: 'THE ROOM',
      instruction: 'A hundred accepted clicks turns a test into a crowd.',
    },
  ],
  mediaTargets: [
    {
      name: 'Barstool College Football Show',
      href: 'https://www.barstoolsports.com/shows/52/college-football-show',
      role: 'Public invitation: pick any school and send in its people.',
    },
    {
      name: 'Unnecessary Roughness',
      href: 'https://www.barstoolsports.com/shows/88/unnecessary-roughness/about',
      role: 'Public invitation: call the first rivalry and watch the board.',
    },
  ],
  challengeCopy:
    'The room is open: 35 schools, one click per browser, one live crowd board. Pick yours and send in your people. https://pointcast.xyz/25/fan-clique/rally @barstoolsports @UnnecRoughness — which school owns the room?',
  boundary:
    'PointCast is independent and unaffiliated with Barstool Sports, its shows, every school, conference, athletic program, and governing body named here. This is a public editorial invitation, not a partnership, sponsorship, endorsement, or scientific poll.',
} as const;

export const FAN_CLIQUE_RALLY_TEAMS = FAN_CLIQUE_TEAMS.map((team) => {
  const gameUrl = taggedGameUrl(team.slug);
  return {
    ...team,
    gameUrl,
    rallyCopy: `${team.school} people: the room is open. One browser, one click. Bring the crowd. ${gameUrl}`,
    groupCopy: `${team.school} is on the PointCast Fan Clique board. One browser gets one counted click—no account, no poll math. If you can find this message, you can move the room: ${gameUrl}`,
  };
});
