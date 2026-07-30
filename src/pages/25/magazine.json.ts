import type { APIRoute } from 'astro';
import {
  COLLEGE_FOOTBALL_MAGAZINE,
  COLLEGE_FOOTBALL_RESEARCH_SOURCES,
  SONG_YARD_PROGRAMS,
  SONG_YARD_REPERTOIRE,
  SONG_YARD_REPERTOIRE_PROGRAMS,
} from '../../lib/pointcast-college-football-magazine';
import { HOUSE_WE_BORROWED } from '../../lib/pointcast-college-house';
import { ROW_BY_ROW } from '../../lib/pointcast-sorority-row';
import { POINTCAST_SOUND_OF_FOCUS } from '../../lib/pointcast-focus';
import {
  COACH_WEATHER_FEATURE,
  COACH_WEATHER_FRONTS,
} from '../../lib/pointcast-coach-weather';
import {
  FAN_CLIQUE_FEATURE,
  FAN_CLIQUE_TEAMS,
} from '../../lib/pointcast-fan-clique';

export const GET: APIRoute = () => new Response(JSON.stringify({
  ...COLLEGE_FOOTBALL_MAGAZINE,
  counts: {
    departments: COLLEGE_FOOTBALL_MAGAZINE.departments.length,
    selectablePrograms: SONG_YARD_PROGRAMS.length,
    pointcast25Programs: SONG_YARD_PROGRAMS.filter((program) => program.cohort === 'pointcast-25').length,
    openFieldPrograms: SONG_YARD_PROGRAMS.filter((program) => program.cohort === 'open-field').length,
    researchedRepertoirePrograms: SONG_YARD_REPERTOIRE_PROGRAMS.length,
    songReferences: SONG_YARD_REPERTOIRE.length,
    documentedUses: SONG_YARD_REPERTOIRE.filter((track) => track.evidence !== 'pointcast-candidate').length,
  },
  openFieldPrograms: SONG_YARD_PROGRAMS
    .filter((program) => program.cohort === 'open-field')
    .map((program) => ({
      fieldNumber: program.fieldNumber,
      slug: program.slug,
      school: program.school,
      conference: program.conference,
      city: program.city,
      state: program.state,
      currentStadium: program.currentStadium,
      markName: program.markName,
      practiceRoom: `https://pointcast.xyz/25/2029/song-yard#${program.slug}`,
    })),
  repertoire: SONG_YARD_REPERTOIRE,
  features: [
    {
      title: FAN_CLIQUE_FEATURE.title,
      subtitle: FAN_CLIQUE_FEATURE.subtitle,
      human: FAN_CLIQUE_FEATURE.canonical,
      machine: FAN_CLIQUE_FEATURE.machineEdition,
      liveEndpoint: FAN_CLIQUE_FEATURE.liveEndpoint,
      eligiblePrograms: FAN_CLIQUE_TEAMS.length,
      score: 'accepted clicks',
    },
    {
      title: COACH_WEATHER_FEATURE.title,
      subtitle: COACH_WEATHER_FEATURE.subtitle,
      human: COACH_WEATHER_FEATURE.canonical,
      machine: COACH_WEATHER_FEATURE.machineEdition,
      block: `https://pointcast.xyz/b/${COACH_WEATHER_FEATURE.block}`,
      pressureFronts: COACH_WEATHER_FRONTS.length,
      movementCount: COACH_WEATHER_FRONTS.reduce(
        (sum, front) => sum + Math.abs(front.movement),
        0,
      ),
      matcherCandidates: 50,
    },
    {
      title: HOUSE_WE_BORROWED.title,
      subtitle: HOUSE_WE_BORROWED.subtitle,
      human: HOUSE_WE_BORROWED.canonical,
      machine: HOUSE_WE_BORROWED.machineEdition,
      block: `https://pointcast.xyz/b/${HOUSE_WE_BORROWED.block}`,
      plates: HOUSE_WE_BORROWED.plates.length,
      imageGenerator: HOUSE_WE_BORROWED.credits.imageGeneration,
    },
    {
      title: ROW_BY_ROW.title,
      subtitle: ROW_BY_ROW.subtitle,
      human: ROW_BY_ROW.canonical,
      machine: ROW_BY_ROW.machineEdition,
      block: `https://pointcast.xyz/b/${ROW_BY_ROW.block}`,
      plates: ROW_BY_ROW.plates.length,
      imageGenerator: ROW_BY_ROW.credits.imageGeneration,
    },
    {
      title: POINTCAST_SOUND_OF_FOCUS.title,
      subtitle: POINTCAST_SOUND_OF_FOCUS.subtitle,
      human: POINTCAST_SOUND_OF_FOCUS.canonical,
      machine: POINTCAST_SOUND_OF_FOCUS.machineEdition,
      block: `https://pointcast.xyz/b/${POINTCAST_SOUND_OF_FOCUS.block}`,
      interactiveLab: POINTCAST_SOUND_OF_FOCUS.interactiveLab,
      focusModes: POINTCAST_SOUND_OF_FOCUS.focusModes.length,
      spotifyPlaylists: POINTCAST_SOUND_OF_FOCUS.rights.spotifyPlaylistsCreatedForFeature,
      byline: POINTCAST_SOUND_OF_FOCUS.byline,
    },
  ],
  researchSources: COLLEGE_FOOTBALL_RESEARCH_SOURCES,
  rights: {
    hostsRecordings: false,
    streamsRecordings: false,
    reproducesLyrics: false,
    reconstructsProtectedMelodies: false,
    providerLinks: 'Spotify search links open on the provider. PointCast does not proxy or restream audio.',
    evidenceLabels: {
      'stadium-ritual': 'A reliable source documents repeated game-day use.',
      'documented-performance': 'A source documents a band or program performance without claiming permanence.',
      'pointcast-candidate': 'An editorial regional or structural proposal, not an adopted tradition.',
    },
  },
  discovery: {
    human: COLLEGE_FOOTBALL_MAGAZINE.canonical,
    machine: COLLEGE_FOOTBALL_MAGAZINE.machineEdition,
    currentBoard: 'https://pointcast.xyz/25',
    songYard: 'https://pointcast.xyz/25/2029/song-yard',
    songYardJson: 'https://pointcast.xyz/25/2029/song-yard.json',
    mascotDesk: 'https://pointcast.xyz/mascot-battler',
    seasonLedger: 'https://pointcast.xyz/25/season',
    houseDesk: HOUSE_WE_BORROWED.canonical,
    houseDeskJson: HOUSE_WE_BORROWED.machineEdition,
    rowByRow: ROW_BY_ROW.canonical,
    rowByRowJson: ROW_BY_ROW.machineEdition,
    soundOfFocus: POINTCAST_SOUND_OF_FOCUS.canonical,
    soundOfFocusJson: POINTCAST_SOUND_OF_FOCUS.machineEdition,
    soundOfFocusInteractiveLab: POINTCAST_SOUND_OF_FOCUS.interactiveLab,
    coachWeather: COACH_WEATHER_FEATURE.canonical,
    coachWeatherJson: COACH_WEATHER_FEATURE.machineEdition,
    fanClique: FAN_CLIQUE_FEATURE.canonical,
    fanCliqueJson: FAN_CLIQUE_FEATURE.machineEdition,
    fanCliqueLive: FAN_CLIQUE_FEATURE.liveEndpoint,
    block: 'https://pointcast.xyz/b/0530',
  },
}, null, 2), {
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'public, max-age=300, s-maxage=3600',
    'Access-Control-Allow-Origin': '*',
  },
});
