import { QUIET_MS, nextIndex, swipe, flameView, safeCard } from './model.mjs';
const $ = id => document.getElementById(id);
const film = $('film'), sound = $('crackle'), root = $('card');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let cards, index = 0, phase = 'arrival', elapsed = 0, since = 0, consent = false, epoch = 0, drag;
sound.volume = .25;
const active = () => ['quiet','ready'].includes(phase) && !document.hidden;
function stopMedia() { film.pause(); sound.pause(); root.dataset.playing = 'false'; }
function paint() {
  const view = flameView(elapsed, phase === 'quiet' || phase === 'ready');
  root.style.setProperty('--fire-brightness', view.brightness);
  $('arrival').hidden = !['arrival','paused'].includes(phase);
  $('quiet').hidden = phase !== 'quiet';
  $('ways').hidden = phase !== 'ready';
  $('pause').hidden = !['quiet','ready'].includes(phase);
}
function tick() {
  if (phase !== 'quiet') return;
  const now = performance.now(); elapsed += now - since; since = now;
  if (elapsed >= QUIET_MS) { phase = 'ready'; $('status').textContent = 'Stay here, open the thread, or move on.'; }
  paint();
}
function pause() {
  if (!['quiet','ready'].includes(phase)) return;
  tick(); epoch++; phase = 'paused'; consent = false; drag = null; stopMedia();
  $('status').textContent = 'Paused. Tap to continue, with sound or in silence.'; paint();
}
async function begin(withSound) {
  if (!cards || document.hidden || !['arrival','paused'].includes(phase)) return;
  const run = ++epoch; consent = withSound; phase = elapsed >= QUIET_MS ? 'ready' : 'quiet'; since = performance.now();
  $('status').textContent = ''; paint(); $('quote').focus({preventScroll:true});
  const pending = [];
  if (!reduced.matches) {
    film.src ||= 'https://pointcast.xyz/pray/fire/media/hearth-loop.mp4';
    pending.push(film.play().then(() => { if (active() && !reduced.matches) root.dataset.playing = 'true'; else film.pause(); }).catch(() => { if (run === epoch) $('status').textContent = 'The still fire is here; video could not play.'; }));
  }
  if (consent) pending.push(sound.play().then(() => { if (!active() || !consent) sound.pause(); }).catch(() => { if (run === epoch) $('status').textContent = 'Sound could not start. The quiet moment continues.'; }));
  await Promise.all(pending);
  if (!active()) stopMedia();
}
function settle() { elapsed = 0; since = performance.now(); phase = 'quiet'; $('status').textContent = ''; paint(); $('quote').focus({preventScroll:true}); }
function move(direction) {
  if (phase !== 'ready') return;
  index = nextIndex(index, direction, cards.length); const card = cards[index];
  // PR 1713's visualizer pattern: source text through textContent, no HTML injection.
  $('topic').textContent = card.topic; $('quote').textContent = '“' + card.quote + '”';
  $('author').textContent = card.author; $('thread').href = card.url; settle();
}
$('light').addEventListener('click', () => begin(true));
$('silent').addEventListener('click', () => begin(false));
$('pause').addEventListener('click', () => { pause(); $('silent').focus(); });
$('stay').addEventListener('click', settle);
$('next').addEventListener('click', () => move(1));
root.addEventListener('pointerdown', e => {
  if (phase !== 'ready' || e.button !== 0 || !e.isPrimary || e.target.closest('button,a')) return;
  drag = { id:e.pointerId, x:e.clientX, y:e.clientY }; root.setPointerCapture(e.pointerId);
});
function release(e, cancelled = false) {
  const direction = swipe(drag, {id:e.pointerId,x:e.clientX,y:e.clientY}, cancelled);
  if (drag?.id === e.pointerId) drag = null;
  if (direction) move(direction);
}
root.addEventListener('pointerup', e => release(e));
root.addEventListener('pointercancel', e => release(e, true));
root.addEventListener('lostpointercapture', e => release(e, true));
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { pause(); $('silent').focus(); }
  if (['ArrowLeft','ArrowRight'].includes(e.key) && !e.altKey && !e.metaKey && !e.ctrlKey) { e.preventDefault(); move(e.key === 'ArrowLeft' ? -1 : 1); }
});
document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
window.addEventListener('pagehide', pause);
reduced.addEventListener('change', () => { if (reduced.matches) { film.pause(); root.dataset.playing = 'false'; } });
setInterval(tick, 250);
// Curated snapshots, not a feed. No board fetch, write, account or storage.
fetch(new URL('./cards.json', import.meta.url)).then(r => { if (!r.ok) throw Error(); return r.json(); }).then(data => {
  if (!Array.isArray(data) || data.length !== 3 || !data.every(safeCard)) throw Error();
  cards = data; paint();
}).catch(() => {
  $('status').textContent = 'The still card is here. The other cards could not load.';
  $('thread').hidden = false; $('stay').hidden = true; $('next').hidden = true;
  $('ways').hidden = false; $('ways').querySelector('p').hidden = true;
});
