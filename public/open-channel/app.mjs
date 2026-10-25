import { SCENES } from './scenes.mjs';
import { createNarrator } from './narrator.mjs';
import { getNarrationClip, RECORDINGS_READY } from './narration-catalog.mjs';
import { setupVoiceSettings } from './voice-settings.mjs';
import { createSession, startSession, chooseReply, parseVoiceChoice, exportSession } from './engine.mjs';
const $ = (id) => document.getElementById(id);
const sessions = new Map(SCENES.map(scene => [scene.id, createSession(scene)]));
let scene = SCENES[0];
let narration = false;
let micGeneration = 0;
let recognition = null;
const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const session = () => sessions.get(scene.id);
const node = () => scene.nodes[session().nodeId];
const stateLabel = () => !session().nodeId ? 'READY TO TUNE IN' : node()?.ending ? 'SCENE COMPLETE' : 'YOUR TURN';
function setStatus(message) { $('status').textContent = message; }
const narrator = createNarrator({ onState(state) {
  $('console').classList.toggle('speaking', state.status === 'speaking');
  $('interrupt').disabled = !['loading', 'speaking'].includes(state.status);
  if (state.status === 'loading') setStatus(state.source === 'recording' ? 'LOADING RECORDED VOICE' : 'STARTING DEVICE VOICE');
  else if (state.status === 'speaking') setStatus(state.source === 'recording' ? 'RECORDED VOICE PLAYING' : 'DEVICE VOICE SPEAKING');
  else if (state.status === 'error') setStatus(state.source === 'recording' ? 'RECORDING UNAVAILABLE · TRY AGAIN OR CHOOSE A DEVICE VOICE' : 'DEVICE VOICE UNAVAILABLE · READ ALONG');
  else setStatus(stateLabel());
} });
const voiceSettings = setupVoiceSettings(narrator, { recordingsReady: RECORDINGS_READY, onChange() { setStatus('VOICE CHANGED · TAP HEAR LINE TO LISTEN'); } });
function stopSpeech() { narrator.stop(); }
function stopMic(message = '') {
  micGeneration++;
  const old = recognition;
  recognition = null;
  if (old) { old.onresult = old.onerror = old.onend = null; try { old.abort(); } catch {} }
  $('mic').textContent = 'Start microphone';
  $('mic-status').textContent = message || (!Recognition ? 'Voice commands are unavailable here. Use the reply buttons.' : node()?.choices?.length ? 'Tap the microphone and say “one” or “two.”' : 'Tune in to a scene with reply choices.');
}
function speak() {
  stopSpeech();
  if (!narration || !node()) return;
  stopMic();
  narrator.play({ text: node().text, audioUrl: getNarrationClip(`characters/${scene.id}/${session().nodeId}`, node().text), ...voiceSettings.getOptions() });
}
function renderChannels() {
  $('channel-list').replaceChildren(...SCENES.map(item => {
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'channel-card';
    button.setAttribute('aria-pressed', String(scene.id === item.id));
    button.setAttribute('aria-label', `${item.title}, with ${item.character}`);
    for (const [className, text] of [['card-number', `CH. ${item.number}`], ['card-arrow', '↗'], ['card-title', item.title], ['card-person', `with ${item.character}`], ['card-description', item.tagline]]) {
      const span = document.createElement('span'); span.className = className; span.textContent = text;
      if (className === 'card-arrow') span.setAttribute('aria-hidden', 'true');
      button.append(span);
    }
    button.addEventListener('click', () => selectScene(item));
    return button;
  }));
}
function renderTranscript() {
  $('transcript').replaceChildren(...session().turns.map(turn => {
    const li = document.createElement('li');
    if (turn.speaker === 'You') li.className = 'user';
    const speaker = document.createElement('b'); speaker.textContent = turn.speaker;
    li.append(speaker, document.createTextNode(turn.text)); return li;
  }));
  $('empty-transcript').hidden = session().turns.length > 0;
  $('transcript').scrollTop = $('transcript').scrollHeight;
  $('save').disabled = !session().turns.length;
}
function render() {
  const current = node();
  $('console').classList.toggle('active', Boolean(current));
  $('start-panel').hidden = Boolean(current);
  $('conversation').hidden = !current;
  $('frequency').textContent = `CH. ${scene.number} / ${scene.title.toUpperCase()}`;
  $('character-initial').textContent = scene.character.slice(0, 1);
  $('character-name').textContent = scene.character;
  $('character-role').textContent = scene.role.toUpperCase();
  $('scene-description').textContent = scene.description;
  $('console').style.setProperty('--accent', scene.color);
  const hex = scene.color.replace('#', '');
  $('console').style.setProperty('--accent-rgb', [0, 2, 4].map(start => parseInt(hex.slice(start, start + 2), 16)).join(','));
  $('line-label').textContent = current?.ending ? 'THE LAST WORD' : `${scene.character.toUpperCase()} / ON THE LINE`;
  $('line').textContent = current?.text || '';
  $('ending').hidden = !current?.ending;
  $('ending').textContent = current?.ending ? `Ending / ${current.ending}` : '';
  $('choices').replaceChildren(...(current?.choices || []).map((choice, index) => {
    const button = document.createElement('button'); button.type = 'button';
    const number = document.createElement('span'); number.className = 'choice-number'; number.textContent = String(index + 1);
    const label = document.createElement('span'); label.textContent = choice.label;
    button.append(number, label); button.addEventListener('click', () => choose(index)); return button;
  }));
  $('note').value = session().note;
  $('restart').disabled = !current;
  $('replay').disabled = !current || !narration;
  $('mic').disabled = !Recognition || !(current?.choices?.length);
  setStatus(stateLabel());
  renderTranscript();
}
function selectScene(next) {
  stopSpeech(); stopMic(); scene = next; renderChannels(); render(); stopMic();
  // Keep keyboard focus after replacing the channel buttons.
  [...$('channel-list').children][SCENES.indexOf(next)].focus({ preventScroll: true });
}
function choose(index) {
  const next = chooseReply(scene, session(), index);
  if (next === session()) return;
  stopSpeech(); stopMic(); sessions.set(scene.id, next); render(); stopMic();
  $('line').focus({ preventScroll: true }); speak();
}
$('start').addEventListener('click', () => { sessions.set(scene.id, startSession(scene, session())); render(); stopMic(); $('line').focus({ preventScroll: true }); speak(); });
$('narration').addEventListener('click', () => {
  narration = !narration;
  $('narration').setAttribute('aria-pressed', String(narration));
  $('narration').textContent = narration ? '◖)) Voice on' : '◖)) Voice off';
  $('replay').disabled = !node() || !narration;
  if (narration) speak(); else stopSpeech();
});
$('replay').addEventListener('click', speak);
$('interrupt').addEventListener('click', stopSpeech);
$('restart').addEventListener('click', () => {
  stopSpeech(); stopMic(); const note = session().note;
  sessions.set(scene.id, startSession(scene, { ...createSession(scene), note }));
  render(); stopMic(); $('line').focus({ preventScroll: true }); speak();
});
$('mic').addEventListener('click', () => {
  if (recognition) { stopMic('Microphone stopped.'); return; }
  if (!Recognition || !node()?.choices?.length) return;
  stopSpeech(); stopMic();
  const generation = micGeneration;
  const currentScene = scene.id;
  const currentNode = session().nodeId;
  const instance = new Recognition(); recognition = instance;
  instance.lang = 'en-US'; instance.interimResults = false; instance.maxAlternatives = 1; instance.continuous = false;
  $('mic').textContent = 'Stop microphone';
  $('mic-status').textContent = 'Opening microphone…';
  instance.onstart = () => { if (generation === micGeneration) $('mic-status').textContent = 'Listening for “one” or “two”…'; };
  instance.onresult = (event) => {
    if (generation !== micGeneration || scene.id !== currentScene || session().nodeId !== currentNode) return;
    const text = event.results[0]?.[0]?.transcript || '';
    const index = parseVoiceChoice(text, node().choices.length);
    stopMic();
    if (index < 0) { $('mic-status').textContent = 'No choice selected. Try saying just “one” or “two,” or tap a reply.'; return; }
    choose(index);
  };
  instance.onerror = (event) => {
    if (generation !== micGeneration) return;
    const message = ['not-allowed', 'service-not-allowed'].includes(event.error) ? 'Microphone access was declined. You can use the reply buttons.' : event.error === 'no-speech' ? 'No speech detected. Tap to try again, or choose a reply.' : 'Speech recognition is unavailable. Use the reply buttons.';
    stopMic(message);
  };
  instance.onend = () => { if (generation === micGeneration) stopMic('Microphone stopped. Tap to try again, or choose a reply.'); };
  try { instance.start(); } catch { stopMic('Microphone could not start. Use the reply buttons.'); }
});
document.querySelector('.voice-tools').addEventListener('toggle', (event) => { if (!event.target.open) stopMic('Microphone stopped.'); });
$('note').addEventListener('input', () => { session().note = $('note').value; });
$('save').addEventListener('click', () => {
  if (!session().turns.length) return;
  const blob = new Blob([exportSession(scene, session())], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob); const link = document.createElement('a');
  link.href = url; link.download = `open-channel-${scene.id}.txt`; document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
for (let i = 0; i < 27; i++) {
  const bar = document.createElement('i'); bar.style.setProperty('--height', `${5 + ((i * 13) % 25)}px`); bar.style.setProperty('--delay', `${-(i % 7) / 7}s`); $('wave').append(bar);
}
document.addEventListener('visibilitychange', () => { if (document.hidden) { stopSpeech(); stopMic('Microphone stopped while this tab was hidden.'); } });
window.addEventListener('pagehide', () => { stopSpeech(); stopMic(); });
renderChannels(); render(); stopMic();
