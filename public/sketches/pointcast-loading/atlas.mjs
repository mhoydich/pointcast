import { stills } from './flame-stills.mjs';

const element = id => document.getElementById(id);
const search = element('search-input');
const card = element('state-card');
const title = element('state-title');
const action = element('state-action');
const detail = element('state-detail');
const list = element('matches');
const replay = element('replay');
const announcement = element('announcement');
const flameView = element('flame-view');
const still = element('flame-still');
const previewLength = 1200;
const resultLimit = 6;

let blocks;
let loading = false;
let mountFlame;
let flame;

function unmountFlame() {
  flame?.destroy();
  flame = undefined;
  delete flameView.dataset.mounted;
}

function showFlame(state) {
  if (state === 'results') { unmountFlame(); return; }
  const pose = state === 'loading' ? 'steady' : 'embers';
  if (still.dataset.pose !== pose) {
    still.src = stills[pose];
    still.dataset.pose = pose;
  }
  if (!mountFlame) return;
  try {
    if (!flame) {
      flame = mountFlame(flameView, pose, {bare: true, particles: false});
      if (!flameView.querySelector('canvas')?.getContext('2d')) throw new Error('Canvas unavailable');
      flameView.dataset.mounted = 'true';
    }
    flame.setState(pose);
    flame.setAvailable(state !== 'error');
  } catch {
    // Artwork is optional; the Atlas state still comes from its own request.
    unmountFlame();
    flameView.querySelector('figure')?.remove();
    mountFlame = undefined;
  }
}

function show(state, heading, more = '', button = '') {
  card.dataset.state = state;
  title.textContent = heading;
  detail.textContent = more;
  detail.hidden = !more;
  action.textContent = button;
  action.hidden = !button;
  list.hidden = state !== 'results';
  if (list.hidden) list.replaceChildren();
  replay.disabled = state === 'loading';
  const status = [heading, more].filter(Boolean).join(' ');
  if (announcement.textContent !== status) announcement.textContent = status;
  showFlame(state);
}

function showMatches() {
  if (loading || !blocks) return;
  const query = search.value.trim().toLowerCase();
  const matches = blocks.filter(block => block.title.toLowerCase().includes(query));
  if (!matches.length) {
    if (!blocks.length) show('empty', 'No blocks yet', '', 'Open PointCast');
    else show('empty', 'No matching blocks', '', 'Clear search');
    return;
  }
  const count = matches.length;
  const heading = count === 1 ? '1 block' : count + ' blocks';
  show('results', heading, count > resultLimit ? 'Showing the first ' + resultLimit + '.' : '');
  list.replaceChildren(...matches.slice(0, resultLimit).map(block => {
    const row = document.createElement('li');
    const link = document.createElement('a');
    link.href = '/b/' + block.id;
    link.textContent = block.title;
    row.append(link);
    return row;
  }));
}

async function load(preview = false) {
  if (loading) return;
  loading = true;
  const focusStatus = action === document.activeElement || replay === document.activeElement;
  show('loading', 'Loading the atlas…');
  if (focusStatus) title.focus({preventScroll: true});
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  // Only a requested replay holds the frame long enough to inspect the flame.
  const frame = preview ? new Promise(resolve => setTimeout(resolve, previewLength)) : undefined;
  try {
    const response = await fetch('/atlas/blocks-atlas.json', {signal: controller.signal, credentials: 'omit'});
    if (!response.ok) throw new Error('Atlas unavailable');
    const atlas = await response.json();
    if (atlas?.ok === false || !Array.isArray(atlas?.points) ||
        !atlas.points.every(point => typeof point?.title === 'string' && /^\d+$/.test(point.id))) {
      throw new Error('Invalid atlas index');
    }
    if (frame) await frame;
    blocks = atlas.points;
    loading = false;
    showMatches();
  } catch {
    loading = false;
    blocks = undefined;
    show('error', 'Atlas unavailable', '', 'Try again');
  } finally {
    clearTimeout(timeout);
  }
}

action.addEventListener('click', () => {
  if (card.dataset.state === 'error') { void load(); return; }
  if (!blocks?.length) { location.assign('/'); return; }
  search.value = '';
  search.focus();
  showMatches();
});
search.addEventListener('input', showMatches);
replay.addEventListener('click', () => void load(true));
window.addEventListener('pagehide', event => { if (!event.persisted) unmountFlame(); });

element('sketch').hidden = false;
void load();
import('/loom/kit/flame.mjs').then(kit => {
  mountFlame = kit.mountFlame;
  showFlame(card.dataset.state);
}).catch(() => {
  // Before the shared kit is released, the local stills show its two resting poses.
  mountFlame = undefined;
});
