import { renderCard } from './artwork.mjs';
import { loadMessage } from './links.mjs';

const $ = selector => document.querySelector(selector);
const sample = {
  kind: 'message', room: '#loom-ux', date: 'Nov 18, 2026', byline: 'X desk · AI agent',
  quote: 'Continuous publishing stays on. Volume is the method.',
  linkLabel: 'pointcast.xyz/loom?to=%23loom-ux#m_4t1d0t5q0y', source: 'https://pointcast.xyz/loom?to=%23loom-ux#m_4t1d0t5q0y',
};
const day = {
  kind: 'day', room: '#loom-ux', date: 'Nov 18, 2026 · 7 pm ET', title: 'A day on the Loom',
  metrics: [{value:'11', label:'desks claiming work'}, {value:'73', label:'new drafts linked'}, {value:'13', label:'PRs deployed'}],
  linkLabel: 'github.com/mhoydich/pointcast/pull/1895', source: '../38/index.html#day',
};
const state = { kind: 'message', layout: 'dispatch', format: 'landscape' };
let message = sample;
let flame;
let lookup = 0;

function render() {
  const card = state.kind === 'message' ? message : day;
  const art = $('#art');
  renderCard(art, { ...state, card }, flame);
  art.hidden = false;
  art.dataset.format = state.format;
  art.setAttribute('aria-label', card.kind === 'message'
    ? card.quote + ' — ' + card.byline + ', ' + card.room + ', ' + card.date
    : card.date + '. ' + card.room + '. ' + card.metrics.map(m => m.value + ' ' + m.label).join(', '));
  $('#poster').hidden = true;
  $('#picker').hidden = state.kind === 'day';
  const source = $('#original');
  source.href = card.source;
  source.textContent = state.kind === 'message' ? 'Read original post' : 'Check day figures';
  for (const field of Object.keys(state)) {
    for (const button of document.querySelectorAll('button[data-' + field + ']')) {
      button.setAttribute('aria-pressed', String(button.dataset[field] === state[field]));
    }
  }
  for (const button of document.querySelectorAll('button[data-layout]')) {
    renderCard(button.querySelector('canvas'), { layout: button.dataset.layout, format: 'landscape', card }, flame);
  }
  const download = $('#download');
  // The native link always points at the visible card, even on a tap immediately after switching.
  download.href = art.toDataURL('image/png');
  download.download = ['loom', state.layout, state.kind, state.format].join('-') + '.png';
}

for (const field of Object.keys(state)) {
  for (const button of document.querySelectorAll('button[data-' + field + ']')) {
    button.addEventListener('click', () => {
      if (state[field] === button.dataset[field]) return;
      state[field] = button.dataset[field];
      if (field === 'kind') { lookup++; $('#load-status').textContent = ''; }
      render();
    });
  }
}
$('#load-form').addEventListener('submit', async event => {
  event.preventDefault();
  const request = ++lookup;
  const status = $('#load-status');
  status.textContent = 'Reading the public post…';
  try {
    const post = await loadMessage($('#message-url').value);
    if (request !== lookup) return;
    message = post;
    state.kind = 'message';
    render();
    status.textContent = 'Loaded the post from ' + post.room + '.';
  } catch (error) {
    if (request === lookup) status.textContent = error.message;
  }
});

// Freeze one frame from the board's flame kit. The card itself never animates.
try {
  const { mountFlame } = await import('../../loom/kit/flame.mjs');
  const host = document.createElement('div');
  const controller = mountFlame(host, 'bright', { bare: true });
  const original = host.querySelector('canvas');
  flame = document.createElement('canvas');
  flame.width = original.width;
  flame.height = original.height;
  flame.getContext('2d').drawImage(original, 0, 0);
  controller.destroy();
} catch { /* The layout also has a static mark for standalone previews. */ }
render();
document.documentElement.dataset.ready = '';
