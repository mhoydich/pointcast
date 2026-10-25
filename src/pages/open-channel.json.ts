import type { APIRoute } from 'astro';
import { SCENES } from '../../public/open-channel/scenes.mjs';
import { WORKSHOPS } from '../../public/open-channel/workshops.mjs';

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
  edition: 2, mode: 'authored character stories and guided speaking and writing worksheets',
  description: 'Characters, Pitch Room, and Story Booth: three authored experiences with optional browser speech. Worksheets assemble your answers into a speaking card or story outline.',
  modes: [
    {
      id: 'characters', title: 'Characters', route: 'https://pointcast.xyz/open-channel/',
      mode: 'authored branching story prototype',
      description: 'Three original characters and twelve endings, with optional browser narration and numbered voice commands.',
      output: 'Downloadable transcript of authored dialogue, selected replies, and your note',
    },
    ...workshopModes,
  ],
  scenes: SCENES.map(({ id, title, character, role, nodes }) => ({ id, title, character, role, endings: Object.values(nodes).filter(node => node.ending).map(node => node.ending) })),
  controls: {
    characters: ['Choose a scene', 'Tune in', 'Tap reply one or two', 'Toggle browser narration', 'Stop or repeat narration', 'Optional microphone: say one or two', 'Restart a scene', 'Download transcript and note'],
    worksheets: ['Choose an exercise', 'Type or optionally dictate your own answer', 'Hear an authored prompt', 'Move between prompts', 'Review the outline assembled from your answers', 'Rehearse with a quiet timer', 'Use the self-review checklist', 'Download Markdown', 'Clear this exercise'],
  },
  provider: {
    current: 'Authored dialogue and prompts, user-written answers, optional browser speech synthesis and recognition',
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
    narration: 'Optional browser speech synthesis reads authored dialogue or prompts. Available voices depend on the browser and device.',
    rehearsal: 'The timer does not record or evaluate your voice.',
  },
  limitations: [
    'Browser voices vary by device.',
    'Speech recognition may be unavailable or require permission and network access.',
    'Character microphone input recognizes numbered choices only; it is not a free-form conversation.',
    'Worksheet dictation inserts editable text. It does not generate a response.',
    'Outlines preserve the user’s answers in prompt order, with [Not answered] for blanks; they do not add story or pitch content.',
    'Self-review checklists and timers do not grade quality, emotion, or delivery.',
  ],
  block: 'https://pointcast.xyz/b/0766', source: 'https://github.com/mhoydich/pointcast',
}, null, 2), { headers: { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=300' } });
