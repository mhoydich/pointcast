// Shared playback for authored narration. Browser synthesis is an explicit mode,
// never an automatic replacement for a missing or failed recording.
const NOVELTY_VOICE = /^(?:Albert|Bad News|Bahh|Bells|Boing|Bubbles|Cellos|Deranged|Good News|Hysterical|Jester|Organ|Pipe Organ|Trinoids|Whisper|Zarvox)(?:\s*\([^)]*\))?$/i;
const language = value => String(value || '').replaceAll('_', '-').toLowerCase();
const isEnglish = value => /^en(?:-|$)/.test(language(value));

function voiceScore(voice, locale) {
  const name = String(voice.name || '');
  let score = language(voice.lang) === locale ? 40 : 0;
  if (voice.default) score += 20;
  // Names are hints rather than a guarantee of voice quality. Locality is not.
  if (/\bpremium\b/i.test(name)) score += 120;
  else if (/\b(?:natural|neural)\b/i.test(name)) score += 100;
  else if (/\benhanced\b/i.test(name)) score += 90;
  if (NOVELTY_VOICE.test(name)) score -= 1000;
  return score;
}

export function createNarrator({ onState = () => {}, window: browser = globalThis.window, startTimeoutMs = 10000, voicesWaitMs = 500 } = {}) {
  const synthesis = browser?.speechSynthesis;
  const locale = language([browser?.navigator?.language, ...(browser?.navigator?.languages || [])].find(isEnglish) || 'en-US');
  const schedule = browser?.setTimeout?.bind(browser) || globalThis.setTimeout;
  const unschedule = browser?.clearTimeout?.bind(browser) || globalThis.clearTimeout;
  const subscribers = new Set();
  let generation = 0;
  let active = null;
  let destroyed = false;
  let lastSource = 'recording';

  function getVoices() {
    let voices;
    try { voices = Array.from(synthesis?.getVoices() || []); } catch { return []; }
    return voices.filter(voice => isEnglish(voice.lang)).sort((a, b) =>
      voiceScore(b, locale) - voiceScore(a, locale) || String(a.name).localeCompare(String(b.name)));
  }
  const current = request => !destroyed && active === request && request.generation === generation;
  function report(status, source, message) {
    if (!destroyed) onState({ status, source, ...(message ? { message } : {}) });
  }
  function clearTimers(request) {
    unschedule(request.startTimer); unschedule(request.voiceTimer);
    request.startTimer = request.voiceTimer = null; request.waitingForVoices = false;
  }
  function releaseAudio(audio) {
    if (!audio) return;
    audio.onplaying = audio.onended = audio.onerror = null;
    try { audio.pause(); } catch {}
    try { audio.removeAttribute('src'); audio.load(); } catch {}
  }
  function release(request) {
    if (!request) return;
    clearTimers(request); releaseAudio(request.audio);
    if (request.utterance) {
      request.utterance.onstart = request.utterance.onend = request.utterance.onerror = null;
      try { synthesis?.cancel(); } catch {}
    }
  }
  function cancel() {
    generation++;
    const previous = active; active = null;
    release(previous);
  }
  function stop() { cancel(); report('stopped', lastSource); }
  function finish(request, status, message) {
    if (!current(request)) return;
    active = null; release(request); report(status, request.source, message);
  }
  function started(request) {
    if (!current(request) || request.started) return;
    request.started = true; clearTimers(request); report('speaking', request.source);
  }
  function startBrowser(request) {
    if (!current(request) || request.utterance) return;
    request.waitingForVoices = false; unschedule(request.voiceTimer);
    const voices = getVoices();
    const voice = voices.find(item => item.voiceURI === request.voiceURI) || voices[0];
    try {
      const utterance = new browser.SpeechSynthesisUtterance(request.text);
      request.utterance = utterance;
      if (voice) utterance.voice = voice;
      utterance.lang = voice?.lang || locale;
      utterance.rate = request.rate; utterance.pitch = 1;
      utterance.onstart = () => started(request);
      utterance.onend = () => finish(request, 'ended');
      utterance.onerror = () => finish(request, 'error', 'The browser voice could not play. Try another voice or read along.');
      synthesis.speak(utterance);
    } catch { finish(request, 'error', 'The browser voice is unavailable. You can read along.'); }
  }
  function voicesChanged() {
    const voices = getVoices();
    for (const callback of subscribers) callback(voices);
    if (active?.waitingForVoices && voices.length) startBrowser(active);
  }
  let restoreVoicesListener = () => {};
  if (synthesis?.addEventListener) {
    synthesis.addEventListener('voiceschanged', voicesChanged);
    restoreVoicesListener = () => synthesis.removeEventListener('voiceschanged', voicesChanged);
  } else if (synthesis) {
    const previous = synthesis.onvoiceschanged;
    const listener = event => { if (typeof previous === 'function') previous.call(synthesis, event); voicesChanged(); };
    synthesis.onvoiceschanged = listener;
    restoreVoicesListener = () => { if (synthesis.onvoiceschanged === listener) synthesis.onvoiceschanged = previous; };
  }

  function play({ text = '', audioUrl = '', mode = 'recording', voiceURI = '', rate = 1 } = {}) {
    if (destroyed) return;
    cancel();
    const source = mode === 'browser' ? 'browser' : 'recording';
    lastSource = source;
    const request = { generation, source, text: String(text), voiceURI, rate: Number.isFinite(rate) ? Math.max(0.5, Math.min(2, rate)) : 1 };
    active = request;
    report('loading', source);
    if (!current(request)) return;
    if (source === 'browser' && (!synthesis || !browser?.SpeechSynthesisUtterance)) {
      finish(request, 'error', 'Browser speech is unavailable. Choose narrated audio or read along.'); return;
    }
    if (source === 'recording' && (!audioUrl || !browser?.Audio)) {
      finish(request, 'error', 'Narrated audio is unavailable for this line. Choose Browser voice or read along.'); return;
    }
    request.startTimer = schedule(() => finish(request, 'error', source === 'recording'
      ? 'Narrated audio did not start. Try again, choose Browser voice, or read along.'
      : 'The browser voice did not start. Try another voice or read along.'), startTimeoutMs);
    if (source === 'browser') {
      if (getVoices().length) startBrowser(request);
      else {
        request.waitingForVoices = true;
        request.voiceTimer = schedule(() => startBrowser(request), Math.min(voicesWaitMs, startTimeoutMs));
      }
      return;
    }
    try {
      const audio = new browser.Audio(audioUrl); request.audio = audio;
      audio.preload = 'auto'; audio.playbackRate = request.rate; audio.preservesPitch = true;
      audio.onplaying = () => started(request);
      audio.onended = () => finish(request, 'ended');
      audio.onerror = () => finish(request, 'error', 'Narrated audio could not load. Try again, choose Browser voice, or read along.');
      const playback = audio.play();
      if (playback?.then) playback.then(() => {
        if (current(request)) started(request); else releaseAudio(audio);
      }, error => {
        if (!current(request)) return;
        finish(request, 'error', error?.name === 'NotAllowedError'
          ? 'Playback was blocked. Tap Hear again to start the narration.'
          : 'Narrated audio could not play. Try again, choose Browser voice, or read along.');
      });
    } catch { finish(request, 'error', 'Narrated audio could not play. Choose Browser voice or read along.'); }
  }
  function onVoicesChanged(callback) {
    if (destroyed || typeof callback !== 'function') return () => {};
    subscribers.add(callback); callback(getVoices());
    return () => subscribers.delete(callback);
  }
  function destroy() {
    if (destroyed) return;
    destroyed = true; cancel(); restoreVoicesListener(); subscribers.clear();
  }
  return { play, stop, getVoices, onVoicesChanged, destroy };
}
