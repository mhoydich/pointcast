/** Page-local prayer interaction. Personal words stay on this page. */
import artCatalog from '../data/still-light-art.json';
const prayers: Record<string, string> = {
  self: 'God of compassion, meet me where I am. Bring comfort to my body, steadiness to my heart, and kindness to the care around me. Help me receive the support I need, one day at a time.',
  others: 'God of compassion, hold the person I love in tenderness. May they find comfort, skilled care, and companionship. Give us patience with uncertainty, and help us show our love in small, practical ways.',
  caregivers: 'God of compassion, be close to those who care for others. Give them moments of rest, support when they are weary, and room for their own needs. May kindness surround the care they give.',
};
const blessings = ['May peace accompany you.', 'May kindness find you today.', 'There is room for you here.', 'May you feel supported, one moment at a time.', 'Carry this little light with you.', 'May rest meet you where you are.', 'May love be close at hand.', 'Take all the time you need.'];
const families = ['bell', 'gong', 'bowl', 'chime'];

export function initializeStillLight() {
  const root = document.querySelector<HTMLElement>('#still-light');
  if (!root || root.dataset.ready) return;
  root.dataset.ready = 'true';
  const get = <T extends HTMLElement>(id: string) => root.querySelector<T>(`#sl-${id}`)!;
  const soundButton = get<HTMLButtonElement>('sound');
  const motionButton = get<HTMLButtonElement>('motion');
  const soundNote = get('sound-note');
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  let motionPaused = motionQuery.matches;
  let soundOn = false;
  let context: AudioContext | null = null;
  let master: GainNode | null = null;
  const nodes = new Set<OscillatorNode>();
  const timers = new Set<ReturnType<typeof setTimeout>>();
  let soundEpoch = 0;
  let lastFamily = '';
  let lastBlessing = -1;
  let lastRing = 0;
  let disposed = false;
  const cleanups: Array<() => void> = [];
  const listen = (target: EventTarget, type: string, callback: EventListener) => {
    target.addEventListener(type, callback);
    cleanups.push(() => target.removeEventListener(type, callback));
  };
  const later = (callback: () => void, ms: number) => {
    const timer = setTimeout(() => { timers.delete(timer); callback(); }, ms);
    timers.add(timer);
  };
  const syncMotion = () => {
    root.dataset.motion = motionPaused ? 'paused' : 'playing';
    motionButton.disabled = motionQuery.matches;
    motionButton.textContent = motionQuery.matches ? 'Reduced motion on' : motionPaused ? 'Motion paused' : 'Pause motion';
    motionButton.setAttribute('aria-pressed', String(motionPaused));
  };
  const silence = () => {
    soundEpoch++;
    for (const node of nodes) { try { node.stop(); node.disconnect(); } catch {} }
    nodes.clear();
  };
  const syncSound = () => {
    soundButton.setAttribute('aria-pressed', String(soundOn));
    soundButton.textContent = soundOn ? 'Sound on · mute' : 'Sound off';
    soundNote.textContent = soundOn ? 'A gentle sound follows Amen. Use the Sound button to mute at any time.' : 'The room is in silence.';
  };
  const enableAudio = async () => {
    const Constructor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Constructor) throw new Error('Audio unavailable');
    if (!context) {
      context = new Constructor();
      master = context.createGain();
      master.gain.value = 0.12;
      const limiter = context.createDynamicsCompressor();
      limiter.threshold.value = -18; limiter.ratio.value = 8;
      master.connect(limiter); limiter.connect(context.destination);
    }
    if (context.state === 'suspended') await context.resume();
  };
  const ring = async () => {
    if (!soundOn || disposed || document.hidden) return;
    const epoch = soundEpoch;
    try { await enableAudio(); } catch {
      soundOn = false; syncSound(); soundNote.textContent = 'Sound is unavailable in this browser. You can still enjoy a quiet closing.'; return;
    }
    if (!soundOn || disposed || document.hidden || epoch !== soundEpoch || !context || !master) return;
    // Avoid stacked audio when Amen is tapped repeatedly.
    if (context.currentTime - lastRing < 0.35 && lastRing !== 0) return;
    lastRing = context.currentTime;
    silence();
    const chosen = get<HTMLSelectElement>('tone').value;
    const choices = families.filter(family => family !== lastFamily);
    const family = families.includes(chosen) ? chosen : choices[Math.floor(Math.random() * choices.length)];
    lastFamily = family;
    const base = (family === 'gong' ? 120 : family === 'bowl' ? 190 : family === 'chime' ? 510 : 350) * Math.pow(2, (Math.random() * 2 - 1) / 12);
    const ratios = family === 'gong' ? [1, 1.41, 2.08, 2.56, 3.2] : family === 'bowl' ? [1, 2, 2.76, 4.07] : [1, 2.76, 5.4];
    const now = context.currentTime;
    const strikes = family === 'chime' ? [0, .34, .76] : [0];
    for (const [strikeIndex, delay] of strikes.entries()) {
      for (const [index, ratio] of ratios.entries()) {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        // A soft mallet attack and long fundamental make the sound settle gently.
        // Higher partials fade sooner, leaving a warm tail instead of a sharp ring.
        const duration = (family === 'gong' ? 9 : family === 'bowl' ? 8 : 6) / (1 + index * .22);
        const attack = family === 'gong' ? .14 : .09;
        oscillator.type = 'sine';
        oscillator.frequency.value = base * ratio * (strikeIndex === 1 ? 1.25 : strikeIndex === 2 ? 1.5 : 1);
        gain.gain.setValueAtTime(0.0001, now + delay);
        gain.gain.exponentialRampToValueAtTime(.28 / Math.pow(index + 1, 1.9) / strikes.length, now + delay + attack);
        gain.gain.exponentialRampToValueAtTime(.0001, now + delay + duration);
        oscillator.connect(gain); gain.connect(master);
        nodes.add(oscillator);
        oscillator.onended = () => { nodes.delete(oscillator); oscillator.disconnect(); gain.disconnect(); };
        oscillator.start(now + delay); oscillator.stop(now + delay + duration + .05);
      }
    }
  };
  root.querySelectorAll<HTMLButtonElement>('button').forEach(button => { button.disabled = false; });
  syncMotion();
  listen(motionButton, 'click', () => { motionPaused = !motionPaused; syncMotion(); });
  listen(motionQuery, 'change', () => { motionPaused = motionQuery.matches; syncMotion(); });
  listen(soundButton, 'click', async () => {
    soundOn = !soundOn;
    syncSound();
    if (!soundOn) { silence(); return; }
    try { await enableAudio(); } catch { soundOn = false; syncSound(); soundNote.textContent = 'Sound is unavailable in this browser. The cards still work in silence.'; }
  });
  root.querySelectorAll<HTMLButtonElement>('[data-candle]').forEach(button => {
    listen(button, 'click', () => {
      const lit = button.getAttribute('aria-pressed') !== 'true';
      button.setAttribute('aria-pressed', String(lit));
      button.setAttribute('aria-label', `Candle for ${button.dataset.candle}`);
      get('candle-note').textContent = lit ? `A light for ${button.dataset.candle}.` : 'The candle rests. You can light it again whenever you wish.';
    });
  });
  const water = get<HTMLButtonElement>('water');
  listen(water, 'click', () => {
    water.querySelectorAll('.sl-ripple').forEach(node => node.remove());
    const ripple = document.createElement('span'); ripple.className = 'sl-ripple'; ripple.setAttribute('aria-hidden', 'true'); water.append(ripple);
    get('water-note').textContent = 'A small ripple. A little space to breathe.';
    later(() => ripple.remove(), 1900);
  });
  const artwork: Record<string, string> = Object.fromEntries(artCatalog.map(art => [art.id, art.alt]));
  listen(get('art-kind'), 'change', () => {
    const choice = get<HTMLSelectElement>('art-kind').value;
    if (!artwork[choice]) return;
    const image = get<HTMLImageElement>('art');
    image.src = `/images/still-light/${choice}.webp`;
    image.srcset = `/images/still-light/${choice}-480.webp 480w, /images/still-light/${choice}.webp 1024w`;
    image.alt = artwork[choice];
  });
  listen(get('prayer-kind'), 'change', () => {
    const kind = get<HTMLSelectElement>('prayer-kind').value;
    get('prayer-text').textContent = prayers[kind] || prayers.self;
    get('closing').hidden = true;
  });
  listen(get('name'), 'input', () => {
    const name = get<HTMLInputElement>('name').value.trim();
    get('dedication').textContent = name ? `Holding ${name} in prayer.` : '';
    get('dedication').hidden = !name;
  });
  listen(get('amen'), 'click', () => {
    const indices = blessings.map((_, index) => index).filter(index => index !== lastBlessing);
    lastBlessing = indices[Math.floor(Math.random() * indices.length)];
    get('closing').hidden = false;
    get('blessing').textContent = blessings[lastBlessing];
    void ring();
  });
  listen(document, 'visibilitychange', () => {
    if (document.hidden) { silence(); if (context?.state === 'running') void context.suspend(); }
  });
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    silence();
    timers.forEach(clearTimeout); timers.clear();
    cleanups.forEach(cleanup => cleanup());
    if (context && context.state !== 'closed') void context.close();
    delete root.dataset.ready;
  };
  listen(window, 'pagehide', (event) => {
    if ((event as PageTransitionEvent).persisted) { silence(); if (context?.state === 'running') void context.suspend(); }
    else dispose();
  });
  listen(document, 'astro:before-swap', dispose);
  return { dispose };
}
