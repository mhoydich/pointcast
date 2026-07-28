import type { APIRoute } from 'astro';
import {
  COLLEGE_FOOTBALL_MAGAZINE,
  SONG_YARD_PROGRAMS,
  SONG_YARD_REPERTOIRE,
} from '../../../lib/pointcast-college-football-magazine';
import {
  POINTCAST_2029_SONG_YARD,
  SONG_YARD_DISCOVERY,
  SONG_YARD_PARTS,
  SONG_YARD_PRACTICE_PATH,
  SONG_YARD_RULES,
  SONG_YARD_SEEDS,
} from '../../../lib/pointcast-2029-song-yard';

export const GET: APIRoute = () => new Response(JSON.stringify({
  ...POINTCAST_2029_SONG_YARD,
  thesis:
    'A stadium song should be learned somewhere kind before it is expected somewhere loud. The Song Yard is a public rehearsal commons for short, original, printable call-and-answer material.',
  methodology: {
    songSeeds:
      'Six short original PointCast exercises explore arrival, weather, walking, weekday stadium use, quiet listening, and the postgame walk. They do not reproduce or adapt official fight songs, alma maters, copyrighted recordings, or institutional lyrics.',
    arrangement:
      'Each seed has four legible roles: Call, Answer, Floor, and Hands. Practice mode isolates one role with a light guide click. Whole Bowl mode spatializes all four roles across the Transit Porch, Student End, Band Terrace, and Afterglow Table.',
    synthesis:
      'All guide audio is created after a visitor gesture with browser-native oscillators and deterministic generated noise. There are no samples, crowd recordings, remote audio files, autoplay, streaming requests, or synthesized human voices.',
    pitchListener:
      'Optional microphone access feeds a local Web Audio analyser for transient pitch estimation. The microphone is not connected to an output, recorder, upload, account, analytics event, score, voiceprint, or server request. Leaving the page stops the tracks.',
    authorship:
      'Michael Hoydich directed the stadium-song practice area. Codex / OpenAI developed the original song seeds, four-part rehearsal method, spatial bowl model, browser-audio guide, local pitch listener, data contract, and PointCast implementation.',
  },
  capabilities: {
    sampleFreeWebAudio: true,
    originalSongSeeds: SONG_YARD_SEEDS.length,
    selectableIdentitySystems: SONG_YARD_PROGRAMS.length,
    researchedRepertoirePrograms: SONG_YARD_PROGRAMS.filter((program) => program.repertoire.length > 0).length,
    songReferences: SONG_YARD_REPERTOIRE.length,
    selectablePracticeParts: SONG_YARD_PARTS.length,
    tempoAdjustment: true,
    keyAdjustment: true,
    optionalLoop: true,
    spatialWholeBowlMode: true,
    optionalLocalPitchListener: true,
    microphoneRequiredForCoreExperience: false,
    recordsVoice: false,
    storesVoice: false,
    uploadsVoice: false,
    voiceIdentification: false,
    voiceScoring: false,
    accountRequired: false,
    audioSamples: 0,
    autoplay: false,
    serverUpload: false,
    telemetryAdded: false,
  },
  parts: SONG_YARD_PARTS,
  songSeeds: SONG_YARD_SEEDS,
  practicePath: SONG_YARD_PRACTICE_PATH,
  writingRules: SONG_YARD_RULES,
  programs: SONG_YARD_PROGRAMS.map((program) => ({
    fieldNumber: program.fieldNumber,
    cohort: program.cohort,
    slug: program.slug,
    school: program.school,
    conference: program.conference,
    city: program.city,
    state: program.state,
    currentStadium: program.currentStadium,
    markName: program.markName,
    primary: program.primary,
    secondary: program.secondary,
    paper: program.paper,
    repertoire: program.repertoire,
  })),
  identities: SONG_YARD_PROGRAMS.map((program) => ({
    rank: program.fieldNumber,
    slug: program.slug,
    school: program.school,
    markName: program.markName,
    primary: program.primary,
    secondary: program.secondary,
    paper: program.paper,
    cohort: program.cohort,
  })),
  repertoire: SONG_YARD_REPERTOIRE,
  magazine: {
    human: COLLEGE_FOOTBALL_MAGAZINE.canonical,
    machine: COLLEGE_FOOTBALL_MAGAZINE.machineEdition,
  },
  discovery: SONG_YARD_DISCOVERY,
}, null, 2), {
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'public, max-age=300, s-maxage=3600',
    'Access-Control-Allow-Origin': '*',
  },
});
