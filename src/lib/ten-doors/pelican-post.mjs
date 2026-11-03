/** Pelican Post keeps no postcard text outside its textarea. */
export function mountPelicanPost(root) {
  const doc = root.ownerDocument;
  const win = doc.defaultView;
  const $ = (id) => root.querySelector(`#${id}`);
  const form = $('pp-form'), text = $('pp-text'), send = $('pp-send');
  const journey = $('pp-journey'), complete = $('pp-complete');
  const skip = $('pp-skip'), again = $('pp-again'), sound = $('pp-sound');
  const status = $('pp-status'), total = $('pp-total'), count = $('pp-count');
  const events = new win.AbortController();
  const on = (target, type, fn) => target.addEventListener(type, fn, { signal: events.signal });
  const motion = win.matchMedia('(prefers-reduced-motion: reduce)');
  const canvas = $('pp-bay');
  let context = null;
  try {
    context = canvas.getContext('2d');
    const dpr = Math.min(win.devicePixelRatio || 1, 2);
    canvas.width = 720 * dpr; canvas.height = 320 * dpr;
    context?.setTransform(dpr, 0, 0, dpr, 0, 0);
  } catch { /* The words and buttons work without a canvas. */ }

  let state = 'composing', frame = 0, startedAt = null, destroyed = false;
  let soundOn = false, audioContext = null;
  let released = 0;
  try {
    const value = JSON.parse(win.localStorage.getItem('pelican-post:count') || '0');
    if (Number.isSafeInteger(value) && value >= 0) released = value;
  } catch { /* Storage is optional. */ }

  function tally() {
    total.textContent = released
      ? `${released} ${released === 1 ? 'card' : 'cards'} let go here.`
      : '';
  }
  function updateInput() {
    count.textContent = `${Math.max(0, 140 - text.value.length)} characters left`;
    send.disabled = state !== 'composing' || !text.value.trim();
  }
  function show(next) {
    state = next;
    root.dataset.state = next;
    form.hidden = next !== 'composing';
    journey.hidden = next !== 'flying';
    complete.hidden = next !== 'released';
  }
  function stopSound() {
    if (!audioContext) return;
    const previous = audioContext;
    audioContext = null;
    try { previous.close()?.catch(() => {}); } catch { /* Already closed. */ }
  }
  function chime() {
    if (!soundOn || doc.hidden || destroyed) return;
    try {
      const AC = win.AudioContext || win.webkitAudioContext;
      if (!AC) throw new Error('Sound unavailable');
      audioContext ||= new AC();
      audioContext.resume()?.catch(() => { stopSound(); });
      [523.25, 659.25, 783.99].forEach((frequency, i) => {
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();
        const at = audioContext.currentTime + i * 0.12;
        oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(0, at);
        gain.gain.linearRampToValueAtTime(0.055, at + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.8);
        oscillator.connect(gain); gain.connect(audioContext.destination);
        oscillator.start(at); oscillator.stop(at + 0.85);
      });
    } catch {
      stopSound(); soundOn = false;
      sound.setAttribute('aria-pressed', 'false');
      sound.textContent = 'Sound unavailable';
      status.textContent = 'Sound is unavailable. The quiet ritual still works.';
    }
  }
  function finish(focus = true) {
    if (state !== 'flying' || destroyed) return;
    win.cancelAnimationFrame(frame); frame = 0;
    const ownedFocus = journey.contains(doc.activeElement);
    show('released');
    released = Math.min(Number.MAX_SAFE_INTEGER, released + 1);
    try { win.localStorage.setItem('pelican-post:count', JSON.stringify(released)); }
    catch { /* Private mode or full storage: keep the count for this visit. */ }
    tally(); draw(1);
    status.textContent = 'Let go. Your card is gone.';
    if (focus && ownedFocus && !doc.hidden) again.focus({ preventScroll: true });
  }
  function tick(now) {
    if (destroyed || state !== 'flying') return;
    startedAt ??= now;
    const progress = Math.min(1, (now - startedAt) / 4200);
    draw(progress);
    if (progress >= 1) finish();
    else frame = win.requestAnimationFrame(tick);
  }
  function reset(focus = false) {
    text.value = '';
    show('composing'); updateInput(); draw(0);
    status.textContent = 'Take your time.';
    if (focus) text.focus({ preventScroll: true });
  }

  on(text, 'input', updateInput);
  on(form, 'submit', (event) => {
    event.preventDefault();
    if (state !== 'composing' || !text.value.trim() || destroyed) return;
    // Clear before any animation or optional sound can fail. Never copy the words.
    text.value = '';
    show('flying'); updateInput();
    status.textContent = 'On its way. Your words have been cleared.';
    skip.focus({ preventScroll: true });
    chime();
    if (motion.matches || !context) finish();
    else { startedAt = null; frame = win.requestAnimationFrame(tick); }
  });
  on(skip, 'click', () => finish());
  on(again, 'click', () => { if (state === 'released') reset(true); });
  on(sound, 'click', () => {
    soundOn = !soundOn;
    sound.setAttribute('aria-pressed', String(soundOn));
    sound.textContent = soundOn ? 'Sound on' : 'Sound off';
    if (soundOn) chime(); else stopSound();
  });
  on(motion, 'change', () => { if (motion.matches) finish(); });
  on(doc, 'visibilitychange', () => {
    if (doc.hidden) { finish(false); stopSound(); }
  });

  // No idle animation: the bay rests while you write, and after the flight.
  function draw(progress) {
    if (!context) return;
    const g = context, W = 720, H = 320;
    const sky = g.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#f8d9b0'); sky.addColorStop(1, '#f4e9d8');
    g.fillStyle = sky; g.fillRect(0, 0, W, H);
    g.fillStyle = '#f6c47a'; g.beginPath(); g.arc(560, 94, 30, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#7fa8b8'; g.fillRect(0, 174, W, H - 174);
    for (let i = 0; i < 18; i += 1) {
      g.fillStyle = 'rgba(255,255,255,0.5)';
      g.fillRect((i * 53 + progress * 40) % W, 188 + (i % 6) * 18, 22, 2);
    }
    g.fillStyle = '#5c5550';
    for (let x = 420; x < 680; x += 26) { g.beginPath(); g.ellipse(x, 184, 16, 9, 0, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = '#ead7b3'; g.beginPath(); g.moveTo(0, H); g.lineTo(0, 250); g.quadraticCurveTo(160, 230, 260, H); g.fill();
    // The paper is always blank; the scene never receives the textarea value.
    if (progress >= 1) return;
    const flying = state === 'flying';
    const x = flying ? 106 + progress * 660 : 106;
    const y = flying ? 255 - Math.min(140, progress * 360) + Math.sin(progress * 20) * 3 : 255;
    const flap = flying ? Math.sin(progress * 42) * 13 : 4;
    g.strokeStyle = '#3a2f25'; g.lineWidth = 3; g.lineCap = 'round';
    g.beginPath(); g.moveTo(x - 23, y - flap); g.quadraticCurveTo(x - 8, y - 5, x, y); g.quadraticCurveTo(x + 8, y - 5, x + 23, y - flap); g.stroke();
    g.fillStyle = '#b88130'; g.beginPath(); g.moveTo(x + 2, y); g.lineTo(x + 20, y + 4); g.lineTo(x + 2, y + 6); g.fill();
    if (flying && progress < 0.64) { g.fillStyle = '#fffaf0'; g.fillRect(x + 5, y + 7, 14, 10); }
    else if (flying && progress < 0.9) {
      const fall = (progress - 0.64) / 0.26;
      g.globalAlpha = 1 - fall; g.fillStyle = '#fffaf0';
      g.fillRect(534 + fall * 20, 130 + fall * 70, 14, 10); g.globalAlpha = 1;
    }
  }

  reset(); tally();
  sound.setAttribute('aria-pressed', 'false');
  sound.textContent = 'Sound off';
  sound.disabled = false;
  return () => {
    destroyed = true;
    text.value = ''; updateInput();
    win.cancelAnimationFrame(frame);
    events.abort(); stopSound();
    // Disabled until a fresh mount, including browser Back from bfcache.
    send.disabled = true; sound.disabled = true;
  };
}
