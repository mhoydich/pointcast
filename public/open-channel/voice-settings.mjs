/** Shared narration preferences. Selection never starts playback. */
export function setupVoiceSettings(narrator, { recordingsReady, onChange = () => {} }) {
  const $ = id => document.getElementById(id);
  const key = 'pointcast-open-channel-voice-v1';
  const settings = { mode: recordingsReady ? 'recording' : 'browser', voiceURI: '' };
  try {
    const prior = JSON.parse(sessionStorage.getItem(key) || 'null');
    if (prior?.mode === 'browser' || (prior?.mode === 'recording' && recordingsReady)) settings.mode = prior.mode;
    if (typeof prior?.voiceURI === 'string') settings.voiceURI = prior.voiceURI.slice(0, 500);
  } catch {}
  const recordingOption = $('voice-mode').querySelector('[value="recording"]');
  if (!recordingsReady) {
    recordingOption.remove();
    $('voice-mode').hidden = true;
    document.querySelector('label[for="voice-mode"]').hidden = true;
  }
  $('voice-mode').value = settings.mode;
  function save() { try { sessionStorage.setItem(key, JSON.stringify(settings)); } catch {} }
  function paint() {
    $('browser-voice-row').hidden = settings.mode !== 'browser';
    $('voice-description').textContent = settings.mode === 'recording'
      ? 'Pre-recorded AI narration by ElevenLabs. Your answers are not sent to a voice generator.'
      : 'Choose an English voice available on this device. Voice quality varies by browser. Playback uses the voice’s natural pitch and pace.';
  }
  function populateVoices() {
    const voices = narrator.getVoices();
    const automatic = document.createElement('option'); automatic.value = ''; automatic.textContent = voices[0] ? `Automatic — ${voices[0].name}` : 'Browser default';
    $('browser-voice').replaceChildren(automatic, ...voices.map(voice => {
      const option = document.createElement('option'); option.value = voice.voiceURI; option.textContent = `${voice.name} · ${voice.lang}`; return option;
    }));
    if (voices.some(voice => voice.voiceURI === settings.voiceURI)) $('browser-voice').value = settings.voiceURI;
    else $('browser-voice').value = '';
  }
  $('voice-mode').addEventListener('change', () => {
    narrator.stop(); settings.mode = $('voice-mode').value === 'recording' && recordingsReady ? 'recording' : 'browser';
    paint(); save(); onChange();
  });
  $('browser-voice').addEventListener('change', () => {
    narrator.stop(); settings.voiceURI = $('browser-voice').value; save(); onChange();
  });
  populateVoices(); paint();
  const unsubscribe = narrator.onVoicesChanged(populateVoices);
  return { getOptions: () => ({ mode: settings.mode, voiceURI: settings.voiceURI, rate: 1 }), destroy: unsubscribe };
}
