import { advanceDrip, createDrip, pauseDrip, popDrip, startDrip, type DripTransition } from './nouns-drip-engine.ts';
import { coGameWorlds, type CoGameWorldId } from './co-games-worlds';
import { nounRoster } from './co-games-roster';

/** Noun Drip shares only the stage, controls and explicit native-audio contract. */
export function mountNounsDrip(root: HTMLElement): () => void {
  const doc = root.ownerDocument, win = doc.defaultView!;
  const lifetime = new win.AbortController(), options = { signal: lifetime.signal };
  const q = <T extends HTMLElement = HTMLElement>(selector: string) => root.querySelector<T>(selector);
  const canvas = q('[data-drip-canvas]'), particles = q('[data-drip-particles]');
  const media = q<HTMLAudioElement>('[data-flow-track]');
  const pace = q<HTMLSelectElement>('[data-flow-pace]');
  let world: CoGameWorldId = Object.hasOwn(coGameWorlds, root.dataset.world || '') ? root.dataset.world as CoGameWorldId : 'garden';
  let state = createDrip(Object.keys(coGameWorlds).indexOf(world));
  let anchor = 0, anchorElapsed = 0, frame: number | null = null, closed = false;
  const nodes = new Map<number, HTMLButtonElement>();
  const reduceMotion = win.matchMedia?.('(prefers-reduced-motion: reduce)');
  const text = (selector: string, value: string | number) => {
    const element = q(selector), next = String(value);
    if (element && element.textContent !== next) element.textContent = next;
  };
  const dialogOpen = () => Boolean(root.querySelector('dialog[open]'));
  const emit = (name: string, detail: Record<string, unknown> = {}) => root.dispatchEvent(new win.CustomEvent(`nouns-flow:${name}`, {
    bubbles: true, detail: { pace: pace?.value || 'gentle', world, mode: 'drip', ...detail },
  }));
  const activeTime = () => root.dataset.flowAudioClock === 'media' && media && Number.isFinite(media.currentTime)
    ? Math.max(anchorElapsed, media.currentTime * 1000) : anchorElapsed + Math.max(0, win.performance.now() - anchor);
  const stopFrame = () => { if (frame !== null) win.cancelAnimationFrame(frame); frame = null; };

  function render() {
    root.dataset.state = state.status === 'finished' ? 'won' : state.status;
    root.dataset.pace = pace?.value || 'gentle';
    root.dataset.flowElapsedMs = String(state.elapsedMs);
    text('[data-flow-score]', state.count); text('[data-flow-streak]', state.collected.length);
    text('[data-flow-time]', `${Math.ceil((state.durationMs - state.elapsedMs) / 1000)}s`);
    text('[data-flow-world-name]', coGameWorlds[world].name);
    const progress = q<HTMLProgressElement>('[data-flow-progress]'); if (progress) progress.value = state.elapsedMs / state.durationMs * 100;
    const playing = state.status === 'playing';
    const start = q<HTMLButtonElement>('[data-flow-start]');
    if (start) { start.disabled = state.status === 'finished'; start.textContent = playing ? 'Pause the drip' : state.status === 'paused' ? 'Keep dripping!' : 'Let it drip!'; }
    const pause = q<HTMLButtonElement>('[data-flow-pause]'); if (pause) pause.disabled = !playing;
    if (pace) pace.disabled = playing;
    root.querySelectorAll<HTMLButtonElement>('[data-flow-world],[data-flow-next-world],[data-flow-shuffle]').forEach(button => { button.disabled = playing; });
    const result = q('[data-flow-result]'); if (result) result.hidden = state.status !== 'finished';
    if (state.status === 'finished') {
      text('[data-flow-result-kicker]', 'A LITTLE SHOWER OF GOOD FEELINGS');
      text('[data-flow-result-title]', state.count ? 'Look at your little crew!' : 'A lovely little drift.');
      text('[data-flow-result-copy]', state.count ? `${state.count} pops · ${state.collected.length} different friends. Every tap was a good one.` : 'The Nouns will wait for you. Start another shower whenever you like.');
    }
    if (!canvas) return;
    const visible = new Set(state.nouns.map(item => item.id));
    for (const [id, element] of nodes) if (!visible.has(id)) { element.remove(); nodes.delete(id); }
    for (const item of state.nouns) {
      const portrait = nounRoster[item.rosterIndex];
      let button = nodes.get(item.id);
      if (!button) {
        button = doc.createElement('button'); button.type = 'button'; button.className = 'drip-noun';
        button.dataset.dripNoun = String(item.id); button.dataset.dripLane = String(item.lane);
        button.setAttribute('aria-label', `Pop ${portrait.name}`); button.style.setProperty('--drip-accent', portrait.accent);
        const image = doc.createElement('img'); image.src = portrait.src; image.alt = ''; image.draggable = false; image.width = image.height = 80;
        const label = doc.createElement('span'); label.textContent = portrait.name;
        button.append(image, label); canvas.append(button); nodes.set(item.id, button);
      }
      button.disabled = !playing;
      const settled = item.slot < 3 ? 83 : 30;
      const progress = reduceMotion?.matches ? 1 : Math.min(1, Math.max(0, (state.elapsedMs - item.bornAt) / 5500));
      button.style.left = `${18 + item.lane * 32}%`;
      button.style.top = `${6 + (settled - 6) * progress}%`;
      button.dataset.settled = String(progress === 1);
    }
  }

  function burst(lane: number, at: string, count: number) {
    if (!particles) return;
    const pop = doc.createElement('span'); pop.className = 'drip-pop';
    pop.style.left = `${18 + lane * 32}%`; pop.style.top = at;
    for (const symbol of ['✦', '+1', '♪']) { const spark = doc.createElement('i'); spark.textContent = symbol; pop.append(spark); }
    particles.replaceChildren(pop);
    text('[data-flow-feedback]', count % 5 === 0 ? `${count} pops! What a little party.` : ['Pop! Hello, friend.', 'A tiny burst of joy.', 'That one had sparkle.', 'Oh, good Noun!'][count % 4]);
  }
  function apply(transition: DripTransition) {
    state = transition.state;
    let focusNext: number | null | undefined;
    for (const event of transition.events) {
      if (event.type === 'pop') {
        const button = nodes.get(event.nodeId), focused = doc.activeElement === button;
        burst(event.lane, button?.style.top || '50%', event.count);
        root.dispatchEvent(new win.CustomEvent('nouns-drip:pop', { bubbles: true, detail: { ...event, nodeId: String(event.nodeId) } }));
        if (focused) {
          const next = state.nouns.find(item => item.lane === event.lane) || state.nouns[0];
          focusNext = next?.id ?? null;
        }
      } else {
        stopFrame(); render(); emit('finish', { status: 'won', count: state.count, score: state.score });
      }
    }
    render();
    if (focusNext !== undefined) (focusNext === null ? canvas : nodes.get(focusNext))?.focus({ preventScroll: true });
    if (state.status === 'finished') q<HTMLButtonElement>('[data-flow-restart]')?.focus();
  }
  function schedule() { if (!closed && state.status === 'playing' && frame === null) frame = win.requestAnimationFrame(step); }
  function step() {
    frame = null;
    if (closed || state.status !== 'playing') return;
    if (doc.hidden || dialogOpen()) { pause(doc.hidden ? 'hidden' : 'dialog'); return; }
    apply(advanceDrip(state, activeTime())); schedule();
  }
  function start() {
    if (closed || doc.hidden || dialogOpen() || !['ready', 'paused'].includes(state.status)) return;
    const resumed = state.status === 'paused';
    state = startDrip(state); anchorElapsed = state.elapsedMs; anchor = win.performance.now();
    text('[data-flow-feedback]', 'Tap any Noun, any time. They’re happy to wait.');
    render(); emit('start', { resumed, durationMs: state.durationMs }); schedule();
  }
  function pause(reason: string) {
    if (closed || state.status !== 'playing') return;
    if (reason === 'manual') apply(advanceDrip(state, activeTime()));
    if (state.status !== 'playing') return;
    state = pauseDrip(state); anchorElapsed = state.elapsedMs; stopFrame(); particles?.replaceChildren();
    render(); emit('pause', { reason, elapsedMs: state.elapsedMs });
  }
  function reset(destination: CoGameWorldId = world) {
    if (state.status === 'playing') pause('reset');
    stopFrame(); particles?.replaceChildren(); world = destination;
    for (const button of nodes.values()) button.remove(); nodes.clear();
    state = createDrip(Object.keys(coGameWorlds).indexOf(world)); anchorElapsed = 0;
    root.dataset.world = world;
    const image = q<HTMLImageElement>('[data-flow-landscape]'); if (image) image.src = coGameWorlds[world].src;
    root.querySelectorAll<HTMLElement>('[data-flow-world]').forEach(button => button.setAttribute('aria-current', String(button.dataset.flowWorld === world)));
    render(); emit('world');
  }
  function pop(button: HTMLButtonElement) {
    if (closed || state.status !== 'playing' || doc.hidden || dialogOpen() || button.disabled) return;
    apply(popDrip(state, Number(button.dataset.dripNoun), activeTime()));
  }
  canvas?.addEventListener('pointerdown', event => {
    if (event.button !== 0 && event.pointerType !== 'touch') return;
    const button = event.target instanceof win.Element ? event.target.closest<HTMLButtonElement>('[data-drip-noun]') : null;
    if (button) { event.preventDefault(); pop(button); }
  }, options);
  canvas?.addEventListener('click', event => {
    const button = event.target instanceof win.Element ? event.target.closest<HTMLButtonElement>('[data-drip-noun]') : null;
    if (button) pop(button);
  }, options);
  doc.addEventListener('keydown', event => {
    if (event.repeat || event.ctrlKey || event.altKey || event.metaKey || dialogOpen() || state.status !== 'playing') return;
    const target = event.target instanceof win.Element ? event.target : null;
    if (target?.closest('input,textarea,select,[contenteditable=true]')) return;
    if (event.key === 'Escape') { event.preventDefault(); pause('manual'); return; }
    const lane = ({ d: 0, f: 1, j: 2, '1': 0, '2': 1, '3': 2 } as Record<string, number>)[event.key.toLowerCase()];
    if (lane === undefined) return;
    const oldest = state.nouns.find(item => item.lane === lane);
    if (oldest) { event.preventDefault(); const button = nodes.get(oldest.id); if (button) pop(button); }
  }, options);
  q('[data-flow-start]')?.addEventListener('click', () => state.status === 'playing' ? pause('manual') : start(), options);
  q('[data-flow-pause]')?.addEventListener('click', () => pause('manual'), options);
  q('[data-flow-restart]')?.addEventListener('click', () => reset(), options);
  q('[data-flow-next-world]')?.addEventListener('click', () => {
    const worlds = Object.keys(coGameWorlds) as CoGameWorldId[];
    reset(worlds[(worlds.indexOf(world) + 1) % worlds.length]);
  }, options);
  pace?.addEventListener('change', () => { if (state.status !== 'playing') reset(); }, options);
  root.addEventListener('click', event => {
    const target = event.target instanceof win.Element ? event.target.closest<HTMLElement>('[data-flow-world]') : null;
    if (state.status === 'playing' || !target || !Object.hasOwn(coGameWorlds, target.dataset.flowWorld || '')) return;
    root.querySelectorAll<HTMLDialogElement>('dialog[open]').forEach(dialog => dialog.close());
    reset(target.dataset.flowWorld as CoGameWorldId);
  }, options);
  root.addEventListener('nouns-flow:audio-interrupted', () => pause('audio'), options);
  root.addEventListener('nouns-flow:audio-clock', () => { anchorElapsed = state.elapsedMs; anchor = win.performance.now(); }, options);
  doc.addEventListener('visibilitychange', () => { if (doc.hidden) pause('hidden'); }, options);
  win.addEventListener('pagehide', () => pause('pagehide'), options);
  const dialogs = new win.MutationObserver(() => { if (dialogOpen()) pause('dialog'); });
  root.querySelectorAll('dialog').forEach(dialog => dialogs.observe(dialog, { attributes: true, attributeFilter: ['open'] }));
  reduceMotion?.addEventListener('change', render, options);
  reset();
  return () => {
    if (closed) return;
    pause('mode'); closed = true; stopFrame(); lifetime.abort(); dialogs.disconnect();
    particles?.replaceChildren(); for (const button of nodes.values()) button.remove(); nodes.clear();
  };
}
