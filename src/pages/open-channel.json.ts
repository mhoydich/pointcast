import type { APIRoute } from 'astro';
import { SCENES } from '../../public/open-channel/scenes.mjs';
import { WORKSHOPS } from '../../public/open-channel/workshops.mjs';
import { AUDIO_MANIFEST } from '../../public/open-channel/audio-manifest.mjs';
import { getRecordingCoverage } from '../../public/open-channel/narration-catalog.mjs';

const recordingCoverage = getRecordingCoverage();
const recordingsReady = recordingCoverage.complete;

const workshopModes = Object.values(WORKSHOPS).map(({ id, title, description, scenarios, timerSeconds, checklist }) => ({
  id, title, description,
  route: `https://pointcast.xyz/open-channel/${id === 'pitch' ? 'pitch-room' : 'story-booth'}/`,
  mode: 'authored prompts with user-written or dictated answers',
  scenarios: scenarios.map(({ id, title, description, prompts }) => ({ id, title, description, prompts: prompts.length })),
  output: id === 'pitch' ? 'Markdown speaking card assembled from the user’s answers' : 'Markdown story outline assembled from the user’s answers',
  unansweredSections: '[Not answered]',
  timerSeconds, checklist,
  evaluation: 'Self-review only. Completion counts answered prompts, not quality or delivery.',
}));

export const GET: APIRoute = () => new Response(JSON.stringify({
  name: 'Open Channel', canonical: 'https://pointcast.xyz/open-channel/',
  edition: recordingsReady ? 3 : 2, mode: 'authored character stories and guided speaking and writing worksheets',
  description: recordingsReady
    ? 'Characters, Pitch Room, and Story Booth: authored experiences with prerecorded ElevenLabs narration and optional device voices. Worksheets assemble your answers into a speaking card or story outline.'
    : 'Characters, Pitch Room, and Story Booth: authored experiences with optional device voices. Worksheets assemble your answers into a speaking card or story outline.',
  modes: [
    {
      id: 'characters', title: 'Characters', route: 'https://pointcast.xyz/open-channel/',
      mode: 'authored branching story prototype',
      description: 'Three original characters and twelve endings, with optional narration and numbered voice commands.',
      output: 'Downloadable transcript of authored dialogue, selected replies, and your note',
    },
    ...workshopModes,
  ],
  scenes: SCENES.map(({ id, title, character, role, nodes }) => ({ id, title, character, role, endings: Object.values(nodes).filter(node => node.ending).map(node => node.ending) })),
  controls: {
    characters: ['Choose a scene', 'Tune in', 'Tap reply one or two', 'Toggle narration', 'Stop or repeat narration', recordingsReady ? 'Choose recorded narration or a device voice in Voice settings' : 'Choose a device voice in Voice settings', 'Optional microphone: say one or two', 'Restart a scene', 'Download transcript and note'],
    worksheets: ['Choose an exercise', 'Type or optionally dictate your own answer', 'Hear an authored prompt', recordingsReady ? 'Choose recorded narration or a device voice in Voice settings' : 'Choose a device voice in Voice settings', 'Move between prompts', 'Review the outline assembled from your answers', 'Rehearse with a quiet timer', 'Use the self-review checklist', 'Download Markdown', 'Clear this exercise'],
  },
  provider: {
    current: recordingsReady
      ? 'Authored dialogue and prompts with prerecorded ElevenLabs AI narration; optional browser speech synthesis and recognition'
      : 'Authored dialogue and prompts, user-written answers, optional browser speech synthesis and recognition',
    narration: {
      defaultSource: recordingsReady ? 'recording' : 'browser',
      recordingsEnabled: recordingsReady,
      preparedClips: recordingCoverage.recorded, totalClips: recordingCoverage.total,
      recordingProvider: AUDIO_MANIFEST.provider, recordingModel: AUDIO_MANIFEST.model,
      preparationStatus: recordingsReady ? 'Complete catalog available for playback.' : 'Incomplete catalog; recorded narration is not offered.',
      optionalDeviceVoices: true, runtimeGeneration: false, userAnswersSentToElevenLabs: false,
    },
    dessaConnected: false, generatedReplies: false, generatedStoryContent: false,
    automatedEvaluation: false, emotionRecognition: false, fullDuplex: false,
  },
  dessa: { source: 'https://block.xyz/dessa', checked: '2026-10-25', status: 'Research preview. Public model download and developer API not verified.', futureIntegration: 'Pending authorized access, published protocol, supported capabilities, and license review.' },
  privacy: {
    accountRequired: false, serverStorage: false,
    characters: 'Scene sessions and notes stay in page memory and are lost on reload. Download to keep a copy.',
    worksheets: 'Drafts use sessionStorage in this browser tab and survive reloads. Browser session restoration may retain them. Clear an exercise to remove its draft; download Markdown to keep a separate copy.',
    storageUnavailable: 'Worksheet drafts fall back to page memory when browser storage is unavailable.',
    microphone: 'Only on explicit click. Browser speech recognition may send audio to its speech service. PointCast does not record audio.',
    narration: recordingsReady
      ? 'Recorded narration plays finished audio files of authored dialogue and prompts. No generation request runs during playback, and user answers and notes are not sent to ElevenLabs. Device voices remain an explicit alternative in Voice settings; narration starts only on a playback action.'
      : 'Device voices read authored dialogue and prompts. The incomplete recorded catalog is not offered. Voice settings lists available English voices; narration keeps neutral pitch and normal pace and starts only on a playback action.',
    voicePreferences: 'Voice settings stay in this browser tab. When a complete recorded catalog first becomes available, it becomes the default; choices made after that upgrade are preserved. A source change does not start playback.',
    rehearsal: 'The timer does not record or evaluate your voice.',
  },
  limitations: [
    'Recorded narration follows fixed authored text; it is not a live AI conversation.',
    'Recordings are offered only after every authored line has a matching clip. Playback failure never silently switches to a device voice.',
    'Device voices vary by browser and device.',
    'Speech recognition may be unavailable or require permission and network access.',
    'Character microphone input recognizes numbered choices only; it is not a free-form conversation.',
    'Worksheet dictation inserts editable text. It does not generate a response.',
    'Outlines preserve the user’s answers in prompt order, with [Not answered] for blanks; they do not add story or pitch content.',
    'Self-review checklists and timers do not grade quality, emotion, or delivery.',
  ],
  block: 'https://pointcast.xyz/b/0766', source: 'https://github.com/mhoydich/pointcast',
}, null, 2), { headers: { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=300' } });
