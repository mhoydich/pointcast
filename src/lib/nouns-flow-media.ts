/** Finite, original STARJAM audio through the browser's media playback route. */
export function mountNounsFlowMedia(root: HTMLElement): () => void {
  const doc = root.ownerDocument, win = doc.defaultView!;
  const lifetime = new win.AbortController(), options = { signal: lifetime.signal };
  const q = <T extends HTMLElement = HTMLElement>(selector: string) => root.querySelector<T>(selector);
  const track = q<HTMLAudioElement>('[data-flow-track]')!;
  const test = q<HTMLAudioElement>('[data-flow-speaker-test]')!;
  const testButton = q<HTMLButtonElement>('[data-flow-test-sound]');
  const sound = q<HTMLButtonElement>('[data-flow-sound]');
  const slider = q<HTMLInputElement>('[data-flow-volume]');
  const haptics = q<HTMLButtonElement>('[data-flow-haptics]');
  const effects = [0, 1, 2].map(lane => q<HTMLAudioElement>(`[data-flow-hit-audio="${lane}"]`));
  const worlds = ['garden', 'rush', 'shell', 'storm'], paces = ['drift', 'gentle', 'playful'];
  let world = 'garden', pace = 'gentle', volume = 35, enabled = true, closed = false;
  let running = false, pendingStart = false, preview = false, elapsed = 0;
  let version = 0, startTimer: number | undefined, loadTimer: number | undefined, failureTimer: number | undefined;
  let laneTimer: number | undefined, gestureLane: number | undefined, gestureUsed = false;
  let hapticsOn = false, hapticsAvailable = typeof win.navigator.vibrate === 'function';
  let message = 'Tap Test sound for a little welcome tune.';
  const hidden = () => doc.visibilityState === 'hidden';
  const persist = (key: string, value: string) => { try { win.localStorage.setItem(`pointcast:starjam:${key}`, value); } catch { /* Optional preferences. */ } };
  try {
    enabled = win.localStorage.getItem('pointcast:starjam:sound') !== 'off';
    const saved = win.localStorage.getItem('pointcast:starjam:volume');
    if (saved !== null && saved.trim() && Number.isFinite(Number(saved))) volume = Math.round(Math.max(0, Math.min(100, Number(saved))));
  } catch { /* Play without storage. */ }
  const playing = (media: HTMLAudioElement) => !media.paused && !media.ended && media.readyState >= 2;
  function clock(media: boolean) {
    const next = media ? 'media' : 'wall';
    if (root.dataset.flowAudioClock === next) return;
    root.dataset.flowAudioClock = next;
    root.dispatchEvent(new win.CustomEvent('nouns-flow:audio-clock', { detail: { mode: next } }));
  }
  function render() {
    root.dataset.flowAudioState = 'media';
    root.dataset.flowAudioOutput = !enabled ? 'muted' : !volume ? 'zero-volume' : preview && playing(test) ? 'test'
      : running && playing(track) ? 'playing' : preview || pendingStart || (running && root.dataset.flowAudioClock === 'media') ? 'starting' : 'idle';
    root.dataset.flowAudioPace = pace; root.dataset.flowAudioWorld = world;
    const status = q('[data-flow-audio-status]'); if (status) status.textContent = message;
    if (testButton) testButton.disabled = running || root.dataset.state === 'playing';
    if (sound) {
      sound.disabled = false; sound.setAttribute('aria-pressed', String(enabled));
      sound.setAttribute('aria-label', enabled ? 'Mute STARJAM sound' : 'Enable STARJAM sound');
      sound.title = enabled ? 'Sound on' : 'Sound off';
    }
    if (slider) { slider.disabled = false; slider.value = String(volume); slider.setAttribute('aria-valuetext', `${volume} percent`); }
    const readout = q('[data-flow-volume-value]'); if (readout) readout.textContent = `${volume}%`;
    if (haptics) {
      haptics.disabled = !hapticsAvailable; haptics.setAttribute('aria-pressed', String(hapticsOn));
      haptics.textContent = `Haptic taps · ${hapticsAvailable ? hapticsOn ? 'on' : 'off' : 'unavailable'}`;
      haptics.setAttribute('aria-label', hapticsOn ? 'Disable haptic taps' : 'Enable haptic taps');
    }
    const note = q('[data-flow-haptics-note]'); if (note) note.textContent = hapticsAvailable ? 'Optional little taps on your successful hits.' : 'Haptics are unavailable in this browser or device.';
  }
  function gains() {
    for (const media of [track, test, ...effects]) if (media) { media.volume = volume / 100; media.muted = !enabled || !volume; }
  }
  function clearTimers() {
    win.clearTimeout(startTimer); win.clearTimeout(loadTimer); win.clearTimeout(failureTimer); win.clearTimeout(laneTimer);
    startTimer = loadTimer = failureTimer = laneTimer = undefined;
  }
  function pauseElements() { for (const media of [track, test, ...effects]) media?.pause(); }
  function stop() {
    ++version; clearTimers(); pendingStart = false; running = false; preview = false; gestureLane = undefined;
    pauseElements(); clock(false);
    if (hapticsOn) { try { win.navigator.vibrate?.(0); } catch { /* Optional. */ } }
  }
  function fail(text: string) {
    const shouldPause = pendingStart || running || root.dataset.state === 'playing';
    stop(); message = text; render();
    const token = version;
    if (shouldPause) failureTimer = win.setTimeout(() => {
      if (!closed && token === version && root.dataset.state === 'playing') root.dispatchEvent(new win.CustomEvent('nouns-flow:audio-interrupted', { detail: { reason: 'media-playback' } }));
    }, 0);
  }
  function configure() {
    const nextWorld = root.dataset.world, nextPace = q<HTMLSelectElement>('[data-flow-pace]')?.value || root.dataset.pace;
    world = nextWorld && worlds.includes(nextWorld) ? nextWorld : 'garden';
    pace = nextPace && paces.includes(nextPace) ? nextPace : 'gentle';
    const src = `/audio/starjam/${world}-${pace}.m4a`;
    if (track.getAttribute('src') !== src) { track.src = src; track.load(); }
  }
  function seek(seconds: number) { try { track.currentTime = Math.max(0, Math.min(35, seconds)); } catch { /* loadedmetadata applies the pending offset. */ } }
  function requestTrack() {
    if (closed || hidden() || !enabled || !volume) { clock(false); return; }
    const token = ++version; win.clearTimeout(loadTimer); win.clearTimeout(failureTimer);
    configure(); gains();
    const presented = Number(root.dataset.flowElapsedMs);
    if (Number.isFinite(presented)) elapsed = Math.max(0, Math.min(35000, presented));
    seek(elapsed / 1000); clock(true);
    message = 'Loading your beat…'; render();
    // This call must stay synchronous in the original trusted Start/Resume gesture.
    try {
      const requested = track.play();
      loadTimer = win.setTimeout(() => { if (token === version && !playing(track)) fail('The music is taking a moment. Try Resume jam, or open Sound and feel.'); }, 8000);
      void Promise.resolve(requested).then(() => {
        if (closed || token !== version) return;
        win.clearTimeout(loadTimer);
        if (hidden() || !enabled || !volume || (!running && !pendingStart)) { track.pause(); clock(false); return; }
        message = 'Soundtrack playback started. Phone volume follows your volume buttons.'; render();
      }, () => { if (!closed && token === version) fail('Playback was blocked. Open Sound and feel and try the native player or direct tune link.'); });
    } catch { fail('Playback could not start. Try the native player in Sound and feel.'); }
  }
  function playTest() {
    if (running || root.dataset.state === 'playing' || hidden() || closed) return;
    stop(); enabled = true; if (!volume) volume = 35;
    persist('sound', 'on'); persist('volume', String(volume)); gains();
    preview = true; test.currentTime = 0; message = 'Starting the welcome tune…'; render();
    const token = version;
    try { void Promise.resolve(test.play()).catch(() => { if (!closed && token === version) { preview = false; message = 'Tap the native player below, or open the tune directly.'; render(); } }); }
    catch { preview = false; message = 'Use the native player below to try the tune.'; render(); }
  }
  function rememberLane(lane: number) {
    gestureLane = lane; gestureUsed = false; win.clearTimeout(laneTimer);
    laneTimer = win.setTimeout(() => { gestureLane = undefined; }, 0);
  }
  root.addEventListener('click', event => {
    const target = event.target instanceof win.Element ? event.target.closest<HTMLButtonElement>('button') : null;
    if (!event.isTrusted || !target || target.disabled || closed || hidden()) return;
    if (target.matches('[data-flow-test-sound]')) playTest();
    else if (target.matches('[data-flow-start]') && ['ready', 'paused'].includes(root.dataset.state || '') && !root.querySelector('dialog[open]')) {
      const resume = root.dataset.state === 'paused'; stop(); if (!resume) elapsed = 0;
      pendingStart = true;
      // Keep intent through native capture/target microtask checkpoints.
      startTimer = win.setTimeout(() => { if (pendingStart) { stop(); render(); } }, 0);
      requestTrack();
    } else if (target.matches('[data-flow-sound]')) {
      enabled = !enabled; persist('sound', enabled ? 'on' : 'off'); gains();
      if (!enabled) { ++version; win.clearTimeout(loadTimer); pauseElements(); preview = false; clock(false); message = 'Sound off. The visual jam keeps going.'; }
      else if (running) requestTrack();
      else message = 'Sound on. Start a jam or test the welcome tune.';
      render();
    } else if (target.matches('[data-flow-haptics]') && hapticsAvailable) { hapticsOn = !hapticsOn; render(); }
  }, { ...options, capture: true });
  root.addEventListener('pointerdown', event => {
    const target = event.target instanceof win.Element ? event.target.closest<HTMLButtonElement>('[data-flow-lane]') : null;
    if (event.isTrusted && event.button === 0 && target && !target.disabled && running && !hidden() && !root.querySelector('dialog[open]')) rememberLane(Number(target.dataset.flowLane));
  }, { ...options, capture: true });
  doc.addEventListener('keydown', event => {
    if (!event.isTrusted || event.repeat || event.altKey || event.ctrlKey || event.metaKey || closed || hidden() || !running || root.querySelector('dialog[open]')) return;
    const target = event.target instanceof win.Element ? event.target : null;
    if (target?.closest('input,textarea,select,[contenteditable=true]')) return;
    const lane = ({ d: 0, f: 1, j: 2, '1': 0, '2': 1, '3': 2 } as Record<string, number>)[event.key.toLowerCase()];
    if (lane !== undefined) rememberLane(lane);
  }, { ...options, capture: true });
  slider?.addEventListener('input', () => {
    volume = Math.round(Math.max(0, Math.min(100, Number(slider.value) || 0))); persist('volume', String(volume)); gains();
    if (!volume) { ++version; win.clearTimeout(loadTimer); pauseElements(); preview = false; clock(false); }
    message = 'Mix updated. On iPhone, use the phone’s volume buttons.'; render();
  }, options);
  const detail = (event: Event) => (event as CustomEvent<Record<string, unknown>>).detail || {};
  root.addEventListener('nouns-flow:start', () => { if (!pendingStart || closed || hidden()) return; pendingStart = false; win.clearTimeout(startTimer); running = true; render(); }, options);
  root.addEventListener('nouns-flow:pause', event => { const ms = Number(detail(event).elapsedMs); if (Number.isFinite(ms)) elapsed = Math.max(0, Math.min(35000, ms)); stop(); render(); }, options);
  root.addEventListener('nouns-flow:beat', event => { const value = detail(event); const ms = Number(value.index) * Number(value.intervalMs); if (running && Number.isFinite(ms)) elapsed = Math.max(elapsed, Math.min(35000, ms)); }, options);
  root.addEventListener('nouns-flow:finish', () => { stop(); elapsed = 0; message = 'That was your jam. Ready for an encore?'; render(); }, options);
  root.addEventListener('nouns-flow:world', () => { stop(); elapsed = 0; configure(); render(); }, options);
  root.addEventListener('nouns-flow:hit', event => {
    const value = detail(event), lane = Number(value.lane);
    if (!running || closed || hidden() || gestureLane !== lane || gestureUsed || !Number.isInteger(lane) || ![0, 1, 2].includes(lane) || !['good', 'perfect'].includes(String(value.grade))) return;
    gestureUsed = true;
    if (hapticsOn) { try { if (win.navigator.vibrate(value.grade === 'perfect' ? 12 : 8) === false) hapticsAvailable = hapticsOn = false; } catch { hapticsAvailable = hapticsOn = false; } }
    const effect = effects[lane];
    if (effect && enabled && volume) { effect.currentTime = 0; try { void Promise.resolve(effect.play()).catch(() => {}); } catch { /* Optional accent cannot stop the soundtrack. */ } }
  }, options);
  track.addEventListener('loadedmetadata', () => { if (pendingStart || running) seek(elapsed / 1000); }, options);
  track.addEventListener('playing', () => { if (!closed && (running || pendingStart) && enabled && volume && !hidden()) { win.clearTimeout(loadTimer); message = 'Soundtrack playback started. Phone volume follows your volume buttons.'; render(); } else track.pause(); }, options);
  track.addEventListener('pause', () => { if (running && root.dataset.flowAudioClock === 'media' && track.paused && !track.ended && !hidden()) fail('Sound was interrupted. Tap Resume jam to pick it back up.'); }, options);
  track.addEventListener('error', () => { if (running || pendingStart) fail('The soundtrack could not load. Open Sound and feel to try the direct tune.'); }, options);
  track.addEventListener('ended', () => { if (running && track.currentTime < 34.7) fail('The soundtrack stopped early. Tap Resume jam to try again.'); }, options);
  test.addEventListener('play', () => {
    if (closed || hidden() || running || !test.closest('dialog')?.open) { test.pause(); return; }
    preview = true; enabled = true; if (!volume) volume = 35; gains(); persist('sound', 'on');
    message = 'Starting the welcome tune…'; render();
  }, options);
  test.addEventListener('playing', () => { if (preview && !closed && !hidden()) { message = 'Welcome tune playback started. Can you hear it?'; render(); } else test.pause(); }, options);
  test.addEventListener('pause', () => { if (test.paused && preview) { preview = false; message = 'Welcome tune paused. Tap the native player to continue.'; render(); } }, options);
  test.addEventListener('ended', () => { preview = false; message = 'Welcome tune finished. If it was silent, try the direct tune link and check your phone’s audio output.'; render(); }, options);
  test.addEventListener('error', () => { preview = false; message = 'The welcome tune could not load. Try the direct link below.'; render(); }, options);
  const cancelPreview = () => { if (preview) { ++version; test.pause(); preview = false; render(); } };
  const dialogs = new win.MutationObserver(() => { if (preview && !test.closest('dialog')?.open) cancelPreview(); });
  for (const dialog of root.querySelectorAll('dialog')) { dialogs.observe(dialog, { attributes: true, attributeFilter: ['open'] }); dialog.addEventListener('close', cancelPreview, options); dialog.addEventListener('cancel', cancelPreview, options); }
  doc.addEventListener('visibilitychange', () => { if (hidden()) { if (running || pendingStart) fail('Paused while away. Tap Resume jam when you return.'); else stop(); } render(); }, options);
  win.addEventListener('pagehide', () => { stop(); render(); }, options);
  configure(); gains(); render();
  return () => { if (closed) return; stop(); closed = true; lifetime.abort(); dialogs.disconnect(); for (const media of [track, test, ...effects]) if (media) { media.removeAttribute('src'); media.load(); } render(); };
}
