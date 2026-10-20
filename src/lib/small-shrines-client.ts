import { SHRINES, SHRINE_DURATION } from '../data/small-shrines';
import { createShrineAudio, type ShrineAudioMode } from './small-shrines-audio';

export function initializeSmallShrines() {
  const root = document.querySelector<HTMLElement>('#small-shrines');
  if (!root || root.dataset.bound) return;
  root.dataset.bound = 'true';
  const get = <T extends HTMLElement>(id: string) => root.querySelector<T>(`#${id}`)!;
  const begin = get<HTMLButtonElement>('ss-begin');
  const end = get<HTMLButtonElement>('ss-end');
  const time = get<HTMLOutputElement>('ss-time');
  const progress = get<HTMLProgressElement>('ss-progress');
  const timerStatus = get<HTMLParagraphElement>('ss-timer-status');
  const mode = get<HTMLSelectElement>('ss-sound-mode');
  const listen = get<HTMLButtonElement>('ss-listen');
  const stop = get<HTMLButtonElement>('ss-stop');
  const volume = get<HTMLInputElement>('ss-volume');
  const mute = get<HTMLButtonElement>('ss-mute');
  const audioStatus = get<HTMLParagraphElement>('ss-audio-status');
  const controller = new AbortController();
  const { signal } = controller;
  let room = SHRINES[0];
  let elapsed = 0;
  let startedAt = 0;
  let running = false;
  let interval: ReturnType<typeof setInterval> | undefined;
  let phaseIndex = -1;
  let cleaned = false;
  const sound = createShrineAudio({ onStateChange(state) {
    if (cleaned) return;
    root.dataset.audio = state.status;
    listen.disabled = state.status === 'starting';
    listen.textContent = state.status === 'starting' ? 'Starting…' : state.status === 'playing' ? 'Restart' : 'Listen';
    stop.disabled = state.status !== 'playing' && state.status !== 'starting';
    mute.setAttribute('aria-pressed', String(state.muted));
    mute.textContent = state.muted ? 'Unmute' : 'Mute';
    audioStatus.textContent = state.status === 'error' ? 'Sound could not start. Tap Listen to try again.' : state.status === 'starting' ? 'Opening sound…' : state.status === 'playing' ? (state.muted || state.volume === 0 ? 'Sound is muted.' : 'Listening. Stop whenever you like.') : 'Sound is off. Listening is optional.';
  }});
  sound.setVolume(0.25);
  [begin,mode,listen,volume,mute].forEach(control => control.disabled = false);
  function cue(index: number) {
    if (index === phaseIndex) return;
    phaseIndex = index;
    const selected = root.querySelector<HTMLElement>(`[data-room="${room.id}"]`)!;
    selected.querySelector('.ss-phase')!.textContent = room.phases[index].label;
    selected.querySelector('.ss-cue p')!.textContent = room.phases[index].text;
  }
  function render() {
    const current = Math.min(SHRINE_DURATION, elapsed + (running ? (performance.now() - startedAt) / 1000 : 0));
    const left = Math.ceil(SHRINE_DURATION - current);
    time.value = `${Math.floor(left / 60)}:${String(left % 60).padStart(2,'0')}`;
    progress.value = current;
    cue(Math.min(room.phases.length-1, Math.floor(current / 15)));
    if (running && current >= SHRINE_DURATION) {
      elapsed = SHRINE_DURATION;
      running = false;
      clearInterval(interval);
      sound.stop();
      begin.textContent = 'Begin again →';
      end.disabled = true;
      timerStatus.textContent = 'Your minute is complete. Notice the room around you, and return in your own time.';
    }
  }
  function pauseTimer(message: string) {
    if (!running) return;
    elapsed = Math.min(SHRINE_DURATION, elapsed + (performance.now() - startedAt) / 1000);
    running = false;
    clearInterval(interval);
    begin.textContent = 'Resume minute →';
    timerStatus.textContent = message;
    render();
  }
  function reset(message: string) {
    clearInterval(interval);
    running = false;
    elapsed = 0;
    phaseIndex = -1;
    sound.stop();
    begin.textContent = 'Begin a minute →';
    end.disabled = true;
    timerStatus.textContent = message;
    render();
  }
  function selectRoom(focus = false) {
    const id = window.location.hash.slice(1);
    const next = SHRINES.find(item => item.id === id) || SHRINES[0];
    room = next;
    root.querySelectorAll<HTMLElement>('[data-room]').forEach(panel => panel.hidden = panel.dataset.room !== room.id);
    root.querySelectorAll<HTMLAnchorElement>('[data-door]').forEach(door => {
      if (door.dataset.door === room.id) door.setAttribute('aria-current','true');
      else door.removeAttribute('aria-current');
    });
    mode.value = room.audioMode;
    reset('Eyes open is welcome. Breathe in your own way. Leave whenever you like.');
    if (focus) document.getElementById(`${room.id}-title`)?.focus({preventScroll:true});
  }
  begin.addEventListener('click', () => {
    if (running) { pauseTimer('Paused. Take the time you need.'); sound.stop(); return; }
    if (elapsed >= SHRINE_DURATION) { elapsed = 0; phaseIndex = -1; }
    running = true;
    startedAt = performance.now();
    begin.textContent = 'Pause minute';
    end.disabled = false;
    timerStatus.textContent = 'A quiet minute has begun. Listening is optional.';
    interval = setInterval(render,250);
    render();
  }, {signal});
  end.addEventListener('click', () => reset('The pause has ended. Take one small thing you noticed back into your day.'), {signal});
  listen.addEventListener('click', () => { void sound.start(mode.value as ShrineAudioMode); }, {signal});
  stop.addEventListener('click', () => sound.stop(), {signal});
  mute.addEventListener('click', () => sound.setMuted(!sound.getState().muted), {signal});
  volume.addEventListener('input', () => sound.setVolume(Number(volume.value)/100), {signal});
  mode.addEventListener('change', () => { sound.stop(); audioStatus.textContent = 'Sound changed. Tap Listen when you are ready.'; }, {signal});
  window.addEventListener('hashchange', () => selectRoom(true), {signal});
  document.addEventListener('visibilitychange', () => { if (document.hidden) { pauseTimer('Paused while you were away. Resume when you are ready.'); sound.stop(); } }, {signal});
  function cleanup() { cleaned = true; clearInterval(interval); sound.dispose(); controller.abort(); delete root.dataset.bound; }
  document.addEventListener('astro:before-swap', cleanup, {signal, once:true});
  window.addEventListener('pagehide', () => { pauseTimer('Paused while you were away. Resume when you are ready.'); sound.stop(); }, {signal});
  selectRoom();
}
