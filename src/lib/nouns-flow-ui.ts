import { advanceFlow, createFlow, FLOW_LOOKAHEAD_MS, FLOW_PACES, hitFlow, pauseFlow, startFlow } from './nouns-flow-engine.mjs';
import { coGameWorlds, type CoGameWorldId } from './co-games-worlds';
import { nounRoster } from './co-games-roster';

type Pace = keyof typeof FLOW_PACES;
type FlowState = ReturnType<typeof createFlow>;
type Transition = ReturnType<typeof advanceFlow> | ReturnType<typeof hitFlow>;
type HitEvent = Transition['events'][number] & { type: 'hit'; grade: 'good' | 'perfect'; rescue: boolean };
// The JavaScript engine's inferred event shape starts with misses; narrow the
// additional successful-hit fields at this boundary instead of asserting them.
const isHitEvent = (event: Transition['events'][number]): event is HitEvent => event.type === 'hit'
  && 'grade' in event && (event.grade === 'good' || event.grade === 'perfect')
  && 'rescue' in event && typeof event.rescue === 'boolean';

/** Local practice only. Never connects to a model, wallet, or remote service. */
export function mountNounsFlow(root: HTMLElement): () => void {
  const doc = root.ownerDocument, win = doc.defaultView!;
  const lifetime = new win.AbortController(), options = { signal: lifetime.signal };
  const q = <T extends HTMLElement = HTMLElement>(selector: string) => root.querySelector<T>(selector);
  const notesLayer = q('[data-flow-notes]');
  const effectsLayer = q('[data-flow-effects]');
  const mediaTrack = q<HTMLAudioElement>('[data-flow-track]');
  const paceSelect = q<HTMLSelectElement>('[data-flow-pace]');
  const firstPace = paceSelect?.value;
  let state: FlowState = createFlow({ pace: firstPace && Object.hasOwn(FLOW_PACES, firstPace) ? firstPace : 'gentle', world: 'garden' });
  let frame: number | null = null, anchor = 0, anchorElapsed = 0, lastBeat = -1;
  let closed = false, imageVersion = 0;
  let cheerTimer: number | null = null;
  let pendingImage: HTMLImageElement | null = null;
  const notes = new Map<number, HTMLElement>();
  const flashes = new Map<number, number>();
  const text = (selector: string, value: string | number) => {
    const element = q(selector), next = String(value);
    if (element && element.textContent !== next) element.textContent = next;
  };
  const emit = (name: string, detail: Record<string, unknown> = {}) => root.dispatchEvent(new win.CustomEvent(`nouns-flow:${name}`, {
    bubbles: true, detail: Object.freeze({ pace: state.pace, world: state.world, ...detail }),
  }));
  const dialogOpen = () => Boolean(root.querySelector('dialog[open]'));
  const activeTime = () => root.dataset.flowAudioClock === 'media' && mediaTrack && Number.isFinite(mediaTrack.currentTime)
    ? Math.max(anchorElapsed, mediaTrack.currentTime * 1000)
    : anchorElapsed + Math.max(0, win.performance.now() - anchor);

  function shuffle() {
    const pool = [...nounRoster];
    const crew = Array.from({ length: 4 }, () => pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
    root.querySelectorAll<HTMLImageElement>('[data-flow-noun]').forEach(image => {
      const noun = crew[Number(image.dataset.flowNoun)];
      if (noun) { image.src = noun.src; image.alt = noun.name; }
    });
  }

  function world() {
    const place = coGameWorlds[state.world as CoGameWorldId];
    text('[data-flow-world-name]', place.name); text('[data-flow-world-story]', place.story);
    root.dataset.world = state.world;
    const landscape = q<HTMLImageElement>('[data-flow-landscape]');
    const version = ++imageVersion;
    if (pendingImage) { pendingImage.onload = null; pendingImage.onerror = null; }
    if (landscape && landscape.getAttribute('src') !== place.src) {
      pendingImage = new win.Image();
      pendingImage.onload = () => { if (!closed && version === imageVersion) { landscape.src = place.src; pendingImage = null; } };
      pendingImage.onerror = () => { if (version === imageVersion) pendingImage = null; };
      pendingImage.src = place.src;
    }
    root.querySelectorAll<HTMLElement>('[data-flow-world]').forEach(button => button.setAttribute('aria-current', String(button.dataset.flowWorld === state.world)));
  }

  function renderNotes() {
    if (!notesLayer) return;
    const height = notesLayer.clientHeight || notesLayer.getBoundingClientRect().height || 500;
    const visible = new Set<number>();
    for (const note of state.notes) {
      const until = note.at - state.elapsedMs;
      if (note.grade !== 'pending' || until > FLOW_LOOKAHEAD_MS || until < -FLOW_PACES[state.pace as Pace].windowMs) continue;
      visible.add(note.id);
      let element = notes.get(note.id);
      if (!element) {
        element = doc.createElement('span'); element.className = 'flow-note';
        element.dataset.noteId = String(note.id); element.dataset.lane = String(note.lane);
        element.setAttribute('aria-hidden', 'true'); element.style.position = 'absolute';
        element.style.left = `${(note.lane + .5) / 3 * 100}%`;
        element.style.transform = 'translate(-50%, -50%)';
        element.style.pointerEvents = 'none';
        notes.set(note.id, element); notesLayer.append(element);
      }
      element.dataset.grade = note.grade;
      element.style.top = `${height * .82 * (1 - until / FLOW_LOOKAHEAD_MS)}px`;
    }
    for (const [id, element] of notes) if (!visible.has(id)) { element.remove(); notes.delete(id); }
  }

  function render() {
    root.dataset.state = state.status; root.dataset.pace = state.pace; root.dataset.flowElapsedMs = String(state.elapsedMs);
    text('[data-flow-score]', state.score); text('[data-flow-health]', Math.ceil(state.health));
    text('[data-flow-enemy]', Math.ceil(state.enemy)); text('[data-flow-streak]', state.combo);
    text('[data-flow-time]', `${Math.ceil((state.durationMs - state.elapsedMs) / 1000)}s`);
    const health = q('[data-flow-health-fill]'), enemy = q('[data-flow-enemy-fill]');
    if (health) health.style.width = `${state.health}%`;
    if (enemy) enemy.style.width = `${state.enemy}%`;
    const progress = q<HTMLProgressElement>('[data-flow-progress]');
    if (progress) {
      if (progress.tagName === 'PROGRESS') { progress.max = 100; progress.value = state.elapsedMs / state.durationMs * 100; }
      else progress.style.width = `${state.elapsedMs / state.durationMs * 100}%`;
    }
    const playing = state.status === 'playing', paused = state.status === 'paused';
    root.querySelectorAll<HTMLButtonElement>('[data-flow-lane]').forEach(button => { button.disabled = !playing; });
    const start = q<HTMLButtonElement>('[data-flow-start]');
    if (start) { start.disabled = state.status === 'won' || state.status === 'lost'; start.textContent = playing ? 'Pause jam' : paused ? 'Resume jam' : 'Let’s jam!'; }
    const pause = q<HTMLButtonElement>('[data-flow-pause]'); if (pause) pause.disabled = !playing;
    if (paceSelect) paceSelect.disabled = playing;
    root.querySelectorAll<HTMLButtonElement>('[data-flow-world],[data-flow-next-world],[data-flow-shuffle]').forEach(button => { button.disabled = playing; });
    const result = q('[data-flow-result]');
    if (result) result.hidden = state.status !== 'won' && state.status !== 'lost';
    if (state.status === 'won' || state.status === 'lost') {
      text('[data-flow-result-kicker]', state.status === 'won' ? 'THE WHOLE CREW IS DANCING' : 'THERE’S ANOTHER BEAT WAITING');
      text('[data-flow-result-title]', state.status === 'won' ? 'You made it pop!' : 'Keep the good notes.');
      text('[data-flow-result-copy]', state.status === 'won'
        ? `${coGameWorlds[state.world as CoGameWorldId].victory} ${state.score} points · best streak ${state.bestCombo}.`
        : state.hits > 0
          ? `${state.hits} notes caught · best streak ${state.bestCombo}. Your crew is ready for an encore.`
          : 'Your crew is still with you. Try Drift for a little more room to catch the light.');
    }
    renderNotes();
  }

  function stopFrame() { if (frame !== null) win.cancelAnimationFrame(frame); frame = null; }
  function clearFlashes() {
    for (const timer of flashes.values()) win.clearTimeout(timer);
    flashes.clear();
    root.querySelectorAll<HTMLElement>('[data-flow-lane]').forEach(button => { delete button.dataset.active; });
    if (cheerTimer !== null) win.clearTimeout(cheerTimer);
    cheerTimer = null; delete root.dataset.cheer;
    effectsLayer?.replaceChildren();
    delete root.dataset.lastGrade; delete root.dataset.hitLane;
  }
  function celebrate(lane: number, streak: boolean) {
    if (effectsLayer) {
      const burst = doc.createElement('span');
      burst.className = 'flow-hit-burst'; burst.dataset.lane = String(lane);
      burst.dataset.streak = String(streak);
      burst.style.left = `${(lane + .5) / 3 * 100}%`;
      for (const symbol of ['✦', '♪', '✧']) {
        const spark = doc.createElement('i'); spark.textContent = symbol; burst.append(spark);
      }
      // One small burst at a time keeps the falling notes easy to follow.
      effectsLayer.replaceChildren(burst);
    }
    if (streak) {
      root.dataset.cheer = 'true';
      if (cheerTimer !== null) win.clearTimeout(cheerTimer);
      cheerTimer = win.setTimeout(() => { delete root.dataset.cheer; cheerTimer = null; }, 520);
    }
  }
  function apply(result: Transition) {
    state = result.state;
    for (const event of result.events) {
      const { type, ...detail } = event;
      if (isHitEvent(event)) {
        const streak = event.combo > 0 && event.combo % 5 === 0;
        const cheer = streak ? (event.combo >= 15 ? 'STAR POWER!' : event.combo >= 10 ? 'What a groove!' : 'You’re on a roll!')
          : event.grade === 'perfect' ? ['Pop! Perfect.', 'Right on the beat!', 'Sweet spot!'][state.hits % 3]
            : ['Lovely!', 'Keep it rolling!', 'That’s the groove!'][state.hits % 3];
        text('[data-flow-feedback]', `${cheer} ${event.combo} streak${event.rescue ? ' · Buddy +5' : ''}`);
        celebrate(event.lane, streak);
        root.dataset.lastGrade = event.grade; root.dataset.hitLane = String(event.lane);
        const pad = q(`[data-flow-lane="${event.lane}"]`);
        if (pad) {
          pad.dataset.active = 'true'; win.clearTimeout(flashes.get(event.lane));
          flashes.set(event.lane, win.setTimeout(() => { delete pad.dataset.active; flashes.delete(event.lane); }, 120));
        }
      }
      if (type === 'miss') text('[data-flow-feedback]', 'Here comes your next beat.');
      if (type === 'mistap') text('[data-flow-feedback]', 'Wait for the glow — then tap!');
      if (type === 'finish') {
        stopFrame(); text('[data-flow-feedback]', state.status === 'won' ? 'One world. All that joy!' : 'One more for the good feeling?');
      }
      emit(type, detail);
    }
    render();
    if (result.events.some(event => event.type === 'finish')) q<HTMLButtonElement>('[data-flow-restart]')?.focus();
  }

  function schedule() { if (!closed && state.status === 'playing' && frame === null) frame = win.requestAnimationFrame(step); }
  function step() {
    frame = null;
    if (closed || state.status !== 'playing') return;
    if (doc.hidden || dialogOpen()) { pause(doc.hidden ? 'hidden' : 'dialog'); return; }
    apply(advanceFlow(state, activeTime()));
    if (state.status === 'playing') {
      const intervalMs = 60000 / FLOW_PACES[state.pace as Pace].bpm;
      const beat = Math.floor(state.elapsedMs / intervalMs);
      if (beat > lastBeat) { lastBeat = beat; emit('beat', { index: beat, intervalMs }); }
      schedule();
    }
  }

  function start() {
    if (closed || doc.hidden || dialogOpen() || (state.status !== 'ready' && state.status !== 'paused')) return;
    const resumed = state.status === 'paused';
    state = startFlow(state); anchorElapsed = state.elapsedMs; anchor = win.performance.now();
    text('[data-flow-feedback]', resumed ? 'And we’re back! Find the glow.' : 'Here we go! Tap each note at the glow.');
    render(); emit('start', { resumed, bpm: FLOW_PACES[state.pace as Pace].bpm, durationMs: state.durationMs }); schedule();
  }

  function pause(reason: string) {
    if (closed || state.status !== 'playing') return;
    // Visibility/dialog events freeze at the last presented frame, so hidden time
    // can never create a batch of unseen misses.
    if (reason === 'manual') apply(advanceFlow(state, activeTime()));
    if (state.status !== 'playing') return;
    state = pauseFlow(state); anchorElapsed = state.elapsedMs; stopFrame(); clearFlashes();
    text('[data-flow-feedback]', 'Paused. Resume whenever you’re ready.');
    render(); emit('pause', { paused: true, reason, elapsedMs: state.elapsedMs });
  }

  function reset(pace: Pace = state.pace as Pace, destination: CoGameWorldId = state.world as CoGameWorldId) {
    if (closed) return;
    if (state.status === 'playing') pause('reset');
    stopFrame(); clearFlashes(); state = createFlow({ pace, world: destination }); lastBeat = -1; anchorElapsed = 0;
    if (paceSelect) paceSelect.value = pace;
    world(); render(); text('[data-flow-feedback]', 'Your local practice buddy is ready. Start when you are.');
    emit('world');
  }

  function strike(lane: number) {
    if (closed || state.status !== 'playing' || doc.hidden || dialogOpen()) return;
    apply(hitFlow(state, lane, activeTime()));
  }

  q('[data-flow-start]')?.addEventListener('click', () => { if (state.status === 'playing') pause('manual'); else start(); }, options);
  q('[data-flow-pause]')?.addEventListener('click', () => pause('manual'), options);
  q('[data-flow-restart]')?.addEventListener('click', () => reset(), options);
  q('[data-flow-shuffle]')?.addEventListener('click', () => { if (state.status !== 'playing') shuffle(); }, options);
  q('[data-flow-next-world]')?.addEventListener('click', () => {
    if (state.status === 'playing') return;
    const worlds = Object.keys(coGameWorlds) as CoGameWorldId[];
    reset(state.pace as Pace, worlds[(worlds.indexOf(state.world as CoGameWorldId) + 1) % worlds.length]); shuffle();
  }, options);
  paceSelect?.addEventListener('change', () => {
    if (state.status !== 'playing' && Object.hasOwn(FLOW_PACES, paceSelect.value)) reset(paceSelect.value as Pace);
  }, options);
  root.addEventListener('click', event => {
    const button = event.target instanceof win.Element ? event.target.closest<HTMLButtonElement>('[data-flow-world]') : null;
    const destination = button?.dataset.flowWorld;
    if (!destination || state.status === 'playing' || !Object.hasOwn(coGameWorlds, destination)) return;
    root.querySelectorAll<HTMLDialogElement>('dialog[open]').forEach(dialog => dialog.close());
    reset(state.pace as Pace, destination as CoGameWorldId); shuffle();
  }, options);
  root.querySelectorAll<HTMLElement>('[data-flow-lane]').forEach(button => button.addEventListener('pointerdown', event => {
    if (event.button !== 0 && event.pointerType !== 'touch') return;
    event.preventDefault(); strike(Number(button.dataset.flowLane));
  }, options));
  doc.addEventListener('keydown', event => {
    if (event.repeat || event.ctrlKey || event.altKey || event.metaKey || dialogOpen()) return;
    const target = event.target instanceof win.Element ? event.target : null;
    if (target?.closest('input,textarea,select,[contenteditable="true"]')) return;
    if (event.key === 'Escape') { if (state.status === 'playing') { event.preventDefault(); pause('manual'); } return; }
    const lane = ({ d: 0, f: 1, j: 2, '1': 0, '2': 1, '3': 2 } as Record<string, number>)[event.key.toLowerCase()];
    if (lane === undefined || state.status !== 'playing') return;
    event.preventDefault(); strike(lane);
  }, options);
  root.addEventListener('nouns-flow:audio-interrupted', () => pause('audio'), options);
  root.addEventListener('nouns-flow:audio-clock', () => {
    anchorElapsed = state.elapsedMs; anchor = win.performance.now();
  }, options);
  doc.addEventListener('visibilitychange', () => { if (doc.hidden) pause('hidden'); }, options);
  const dialogs = new win.MutationObserver(() => { if (dialogOpen()) pause('dialog'); });
  root.querySelectorAll('dialog').forEach(dialog => dialogs.observe(dialog, { attributes: true, attributeFilter: ['open'] }));
  shuffle(); world(); render(); text('[data-flow-feedback]', 'Your local practice buddy is ready. Start when you are.');
  return () => {
    if (closed) return;
    if (state.status === 'playing') pause('cleanup');
    closed = true; ++imageVersion; stopFrame(); clearFlashes(); lifetime.abort(); dialogs.disconnect();
    if (pendingImage) { pendingImage.onload = null; pendingImage.onerror = null; }
    for (const note of notes.values()) note.remove(); notes.clear();
  };
}
