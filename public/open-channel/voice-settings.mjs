/** Shared narration preferences. Selection never starts playback. */
export function setupVoiceSettings(narrator, { recordingsReady, onChange = () => {} }) {
  const $ = id => document.getElementById(id);
  const key = 'pointcast-open-channel-voice-v2';
  function readPreference(storageKey) {
    try { return JSON.parse(sessionStorage.getItem(storageKey) || 'null'); } catch { return null; }
  }
  const prior = readPreference(key);
  const legacy = readPreference('pointcast-open-channel-voice-v1');
  // The old release offered only device voices. Its automatic browser choice
  // must not hide the first complete recording release from returning visitors.
  const hasSeenRecordings = prior?.hasSeenRecordings === true || recordingsReady;
  let preferredMode = prior?.hasSeenRecordings === true && ['browser', 'recording'].includes(prior.mode)
    ? prior.mode : recordingsReady ? 'recording' : 'browser';
  const priorVoice = typeof prior?.voiceURI === 'string' ? prior.voiceURI : legacy?.voiceURI;
  const settings = {
    mode: preferredMode === 'recording' && !recordingsReady ? 'browser' : preferredMode,
    voiceURI: typeof priorVoice === 'string' ? priorVoice.slice(0, 500) : '',
  };
  const recordingOption = $('voice-mode').querySelector('[value="recording"]');
  $('voice-mode').hidden = !recordingsReady;
  document.querySelector('label[for="voice-mode"]').hidden = !recordingsReady;
  if (!recordingsReady) recordingOption?.remove();
  else if (!recordingOption) {
    const option = document.createElement('option'); option.value = 'recording'; option.textContent = 'Recorded voices · ElevenLabs';
    $('voice-mode').prepend(option);
  }
  $('voice-mode').value = settings.mode;
  function save() {
    // Keep the preferred source when recordings are temporarily unavailable.
    // Choosing another device voice in that state changes only its voice URI.
    try { sessionStorage.setItem(key, JSON.stringify({ mode: preferredMode, voiceURI: settings.voiceURI, hasSeenRecordings })); } catch {}
  }
  function paint() {
    $('browser-voice-row').hidden = settings.mode !== 'browser';
    $('voice-description').textContent = settings.mode === 'recording'
      ? 'AI narration recorded with ElevenLabs. Your answers are not sent to ElevenLabs.'
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
    if (!recordingsReady) return;
    narrator.stop(); settings.mode = $('voice-mode').value === 'recording' ? 'recording' : 'browser';
    preferredMode = settings.mode; paint(); save(); onChange();
  });
  $('browser-voice').addEventListener('change', () => {
    narrator.stop(); settings.voiceURI = $('browser-voice').value; save(); onChange();
  });
  populateVoices(); paint(); save();
  const unsubscribe = narrator.onVoicesChanged(populateVoices);
  return { getOptions: () => ({ mode: settings.mode, voiceURI: settings.voiceURI, rate: 1 }), destroy: unsubscribe };
}
