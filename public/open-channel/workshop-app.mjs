import { WORKSHOPS, buildOutline, getProgress } from './workshops.mjs';
import { createNarrator } from './narrator.mjs';
import { getNarrationClip, RECORDINGS_READY } from './narration-catalog.mjs';
import { setupVoiceSettings } from './voice-settings.mjs';

const config = WORKSHOPS[document.body.dataset.workshop];
const $ = id => document.getElementById(id);
const storageKey = `pointcast-open-channel-${config.id}-v1`;
const emptyExercise = scenario => ({ answers: {}, index: 0, checks: config.checklist.map(() => false) });
const drafts = Object.fromEntries(config.scenarios.map(scenario => [scenario.id, emptyExercise(scenario)]));
let activeId = config.scenarios[0].id;
let storageAvailable = true;
try {
  const saved = JSON.parse(sessionStorage.getItem(storageKey) || 'null');
  if (saved && typeof saved === 'object') {
    if (config.scenarios.some(item => item.id === saved.activeId)) activeId = saved.activeId;
    for (const scenario of config.scenarios) {
      const prior = saved.drafts?.[scenario.id];
      if (!prior || typeof prior !== 'object') continue;
      const draft = drafts[scenario.id];
      if (Number.isInteger(prior.index)) draft.index = Math.max(0, Math.min(scenario.prompts.length - 1, prior.index));
      for (const prompt of scenario.prompts) {
        const answer = prior.answers?.[prompt.id];
        if (typeof answer === 'string') draft.answers[prompt.id] = answer.slice(0, 3000);
      }
      draft.checks = config.checklist.map((_, index) => prior.checks?.[index] === true);
    }
  }
} catch { storageAvailable = false; }
const scenario = () => config.scenarios.find(item => item.id === activeId);
const draft = () => drafts[activeId];
const prompt = () => scenario().prompts[draft().index];
const feedback = message => { $('feedback').textContent = message; };
function save() {
  try { sessionStorage.setItem(storageKey, JSON.stringify({ activeId, drafts })); storageAvailable = true; }
  catch { storageAvailable = false; }
  $('storage-status').textContent = storageAvailable
    ? 'Answers are stored in this browser tab. Download to keep a copy.'
    : 'Browser storage is unavailable. Answers last only while this page stays open. Download to keep a copy.';
}
function makeButton(text, action, className = '') {
  const button = document.createElement('button');
  button.type = 'button'; button.textContent = text; button.className = className;
  button.addEventListener('click', action); return button;
}
function renderOutline() {
  const progress = getProgress(scenario(), draft().answers);
  $('outline').replaceChildren(...scenario().prompts.map((item, index) => {
    const section = document.createElement('section');
    const heading = document.createElement('h3'); heading.textContent = `${index + 1}. ${item.label}`;
    const answer = document.createElement('p'); answer.textContent = draft().answers[item.id]?.trim() || 'Not answered yet';
    if (!draft().answers[item.id]?.trim()) answer.className = 'unanswered';
    section.append(heading, answer); return section;
  }));
  $('progress-label').textContent = `${progress.completed} of ${progress.total} prompts answered`;
  $('progress').max = progress.total; $('progress').value = progress.completed;
  $('download').disabled = progress.completed === 0;
  const words = $('answer').value.trim().match(/\S+/g)?.length || 0;
  $('word-count').textContent = `${words} ${words === 1 ? 'word' : 'words'}`;
  for (const [index, button] of [...$('step-rail').children].entries()) {
    const item = scenario().prompts[index];
    const complete = Boolean(draft().answers[item.id]?.trim());
    button.classList.toggle('complete', complete);
    button.setAttribute('aria-label', `Step ${index + 1}: ${item.label}${complete ? ', answered' : ', not answered'}`);
  }
}
function cancelClear() { $('clear').textContent = 'Clear this exercise'; $('cancel-clear').hidden = true; }
function render() {
  $('exercise-list').replaceChildren(...config.scenarios.map(item => {
    const button = makeButton('', () => selectExercise(item.id), 'exercise-card');
    button.setAttribute('aria-pressed', String(item.id === activeId));
    const title = document.createElement('strong'); title.textContent = item.title;
    const description = document.createElement('span'); description.textContent = item.description;
    button.append(title, description); return button;
  }));
  $('exercise-title').textContent = scenario().title;
  $('step-counter').textContent = `${draft().index + 1} / ${scenario().prompts.length}`;
  $('step-rail').replaceChildren(...scenario().prompts.map((item, index) => {
    const button = makeButton(String(index + 1).padStart(2, '0'), () => selectStep(index));
    if (index === draft().index) button.setAttribute('aria-current', 'step');
    return button;
  }));
  $('prompt-label').textContent = prompt().label;
  $('question').textContent = prompt().question;
  $('hint').textContent = prompt().hint;
  $('answer').placeholder = prompt().placeholder;
  $('answer').value = draft().answers[prompt().id] || '';
  $('previous').disabled = draft().index === 0;
  $('next').textContent = draft().index === scenario().prompts.length - 1 ? 'Review outline ↗' : 'Next prompt →';
  $('checklist').replaceChildren(...config.checklist.map((text, index) => {
    const label = document.createElement('label');
    const input = document.createElement('input'); input.type = 'checkbox'; input.checked = draft().checks[index];
    input.addEventListener('change', () => { draft().checks[index] = input.checked; save(); });
    const words = document.createElement('span'); words.textContent = text; label.append(input, words); return label;
  }));
  cancelClear(); renderOutline(); save();
}
function selectExercise(id) {
  stopSpeech(); stopRecognition(); resetTimer(); activeId = id; render();
  feedback('Your other exercises are kept in this tab.'); $('question').focus();
}
function selectStep(index) {
  if (index < 0 || index >= scenario().prompts.length) return;
  stopSpeech(); stopRecognition(); draft().index = index; render(); $('question').focus();
  feedback('You can skip a prompt and return to it later.');
}
$('answer').addEventListener('input', () => {
  draft().answers[prompt().id] = $('answer').value.slice(0, 3000); cancelClear(); save(); renderOutline();
});
$('previous').addEventListener('click', () => selectStep(draft().index - 1));
$('next').addEventListener('click', () => {
  if (draft().index < scenario().prompts.length - 1) return selectStep(draft().index + 1);
  stopSpeech(); stopRecognition();
  const progress = getProgress(scenario(), draft().answers);
  feedback(progress.remaining ? `${progress.remaining} ${progress.remaining === 1 ? 'prompt is' : 'prompts are'} still open. You can revisit any step or download your draft.` : 'Your outline is ready to review. Rehearse, revise, or download it.');
  $('outline').focus();
});
$('clear').addEventListener('click', () => {
  if ($('cancel-clear').hidden) { $('clear').textContent = 'Yes, clear this exercise'; $('cancel-clear').hidden = false; feedback('This removes only the current exercise from this tab.'); return; }
  stopSpeech(); stopRecognition(); resetTimer(); drafts[activeId] = emptyExercise(scenario()); render();
  feedback('This exercise is cleared. Your other exercises are still here.'); $('answer').focus();
});
$('cancel-clear').addEventListener('click', () => { cancelClear(); feedback('Your answers are kept.'); });
$('download').addEventListener('click', () => {
  if (!getProgress(scenario(), draft().answers).completed) return;
  const review = config.checklist.map((text, index) => `- [${draft().checks[index] ? 'x' : ' '}] ${text}`).join('\n');
  const text = `${buildOutline(config, scenario(), draft().answers)}\n## My own review\n\nSelf-reported checklist; not an automated score.\n\n${review}\n`;
  const url = URL.createObjectURL(new Blob([text], { type: 'text/markdown;charset=utf-8' }));
  const link = document.createElement('a'); link.href = url; link.download = `open-channel-${config.id}-${activeId}.md`;
  document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  feedback('Your Markdown download is ready.');
});

// Narration starts only on a button press and is cancelled when its prompt changes.
const narrator = createNarrator({ onState(state) {
  const busy = ['loading', 'speaking'].includes(state.status);
  $('hear-prompt').disabled = busy; $('stop-voice').disabled = !busy;
  if (state.status === 'loading') feedback(state.source === 'recording' ? 'Loading the recorded prompt…' : 'Starting the device voice…');
  if (state.status === 'speaking') feedback(state.source === 'recording' ? 'Playing the recorded prompt.' : 'Reading the prompt with your selected device voice.');
  if (state.status === 'ended') feedback('Prompt finished. Your answer is ready to edit.');
  if (state.status === 'error') feedback(state.source === 'recording' ? 'The recording could not play. Try again, or choose Device voice in Voice settings.' : 'The device voice could not play. Choose another voice or read the prompt above.');
} });
const voiceSettings = setupVoiceSettings(narrator, { recordingsReady: RECORDINGS_READY, onChange() { feedback('Voice changed. Press Hear prompt to listen.'); } });
function stopSpeech() { narrator.stop(); }
$('hear-prompt').addEventListener('click', () => {
  stopRecognition(); stopSpeech();
  const text = `${prompt().question} ${prompt().hint}`;
  narrator.play({ text, audioUrl: getNarrationClip(`${config.id}/${activeId}/${prompt().id}`, text), ...voiceSettings.getOptions() });
});
$('stop-voice').addEventListener('click', () => { stopSpeech(); feedback('Voice stopped.'); });

// Dictation appends final browser transcripts, never advances a step or invents an answer.
const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;
let recognitionGeneration = 0;
let recognitionTimeout;
function stopRecognition(message = 'Microphone is off.') {
  recognitionGeneration++; clearTimeout(recognitionTimeout);
  const previous = recognition; recognition = null;
  if (previous) { try { previous.abort(); } catch {} }
  $('dictate').textContent = 'Start microphone'; $('voice-status').textContent = message;
}
$('dictate').addEventListener('click', () => {
  if (recognition) { stopRecognition(); return; }
  if (!Recognition) return;
  stopSpeech(); stopRecognition();
  const generation = recognitionGeneration;
  const exerciseId = activeId; const promptId = prompt().id;
  const capture = new Recognition(); recognition = capture;
  capture.lang = 'en-US'; capture.continuous = false; capture.interimResults = false;
  let received = false;
  const current = () => generation === recognitionGeneration && recognition === capture && exerciseId === activeId && promptId === prompt().id;
  $('dictate').textContent = 'Stop microphone'; $('voice-status').textContent = 'Waiting for microphone access…';
  capture.onstart = () => { if (!current()) return; clearTimeout(recognitionTimeout); $('voice-status').textContent = 'Listening. Speak your answer, then pause.'; };
  capture.onresult = event => {
    if (!current()) return;
    const parts = [];
    for (let index = event.resultIndex; index < event.results.length; index++) {
      if (event.results[index].isFinal) parts.push(event.results[index][0].transcript);
    }
    const transcript = parts.join(' ').trim(); if (!transcript) return;
    received = true;
    const existing = $('answer').value;
    const combined = `${existing}${existing && !/\s$/.test(existing) ? ' ' : ''}${transcript}`;
    $('answer').value = combined.slice(0, 3000); draft().answers[promptId] = $('answer').value;
    cancelClear(); save(); renderOutline();
    feedback(combined.length > 3000 ? 'This answer reached the 3,000-character limit. Review the text before continuing.' : 'Dictation added. You can edit your words before continuing.');
  };
  capture.onerror = event => {
    if (!current()) return;
    const messages = { 'not-allowed': 'Microphone access was denied. You can type your answer.', 'audio-capture': 'No microphone is available. You can type your answer.', 'no-speech': 'No speech was heard. Try again or type your answer.', network: 'The browser speech service could not connect. You can type your answer.' };
    stopRecognition(messages[event.error] || 'Dictation stopped. Try again or type your answer.');
  };
  capture.onend = () => { if (current()) stopRecognition(received ? 'Microphone is off. Your words were added to the answer.' : 'Microphone is off. No words were added.'); };
  recognitionTimeout = setTimeout(() => { if (current()) stopRecognition('Microphone did not start. Try again or type your answer.'); }, 12000);
  try { capture.start(); } catch { stopRecognition('Microphone could not start. You can type your answer.'); }
});
const dictationPanel = document.querySelector('.dictation');
dictationPanel.addEventListener('toggle', () => { if (!dictationPanel.open) stopRecognition(); });
if (!Recognition) { $('dictate').disabled = true; $('voice-status').textContent = 'Dictation is unavailable in this browser. You can type every answer.'; }

// A silent local timer; no microphone or recording is tied to rehearsal.
let remainingMs = config.timerSeconds * 1000;
let deadline = 0;
let timerInterval;
function paintTimer() {
  const seconds = Math.max(0, Math.ceil(remainingMs / 1000));
  $('timer').textContent = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  $('timer-toggle').textContent = timerInterval ? 'Pause timer' : remainingMs === 0 ? 'Start again' : remainingMs < config.timerSeconds * 1000 ? 'Resume timer' : 'Start timer';
}
function pauseTimer() {
  if (timerInterval) remainingMs = Math.max(0, deadline - Date.now());
  clearInterval(timerInterval); timerInterval = null; paintTimer();
}
function resetTimer() { pauseTimer(); remainingMs = config.timerSeconds * 1000; paintTimer(); }
$('timer-toggle').addEventListener('click', () => {
  if (timerInterval) { pauseTimer(); return; }
  if (!remainingMs) remainingMs = config.timerSeconds * 1000;
  deadline = Date.now() + remainingMs;
  timerInterval = setInterval(() => {
    remainingMs = Math.max(0, deadline - Date.now());
    if (!remainingMs) { pauseTimer(); feedback('Time is up. Take a breath, then revise anything that felt unclear.'); }
    paintTimer();
  }, 250); paintTimer();
});
$('timer-reset').addEventListener('click', resetTimer);
function suspend() { stopSpeech(); stopRecognition(); pauseTimer(); }
document.addEventListener('visibilitychange', () => { if (document.hidden) suspend(); });
window.addEventListener('pagehide', suspend);
render(); paintTimer();
