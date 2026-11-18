import { rooms, loadRoom } from './records.mjs';
import { drawStudy } from './drawing.mjs';

const modes = {
  line: ['Line', 'Each bead is one message in sequence. Color marks its author. Diamonds are link posts.'],
  weave: ['Weave', 'One lane per author. Follow the thread from one message to the next in reading order.'],
  spool: ['Spool', 'Each author has a strand. Beads rise in message order. Dashed ties connect recorded replies. Drag to orbit.'],
  field: ['Field', 'Each cell is a message. Copper loops group authors. Lines connect recorded replies within this view. Drag to orbit.']
};
const el = id => document.getElementById(id);
const query = new URLSearchParams(location.search);
let mode = Object.hasOwn(modes, query.get('view')) ? query.get('view') : 'field';
let room = rooms.find(option => option.address === query.get('room'))?.address ?? '#grokbot';
let selectedId = query.get('record'), model, renderer, loadController, paintToken = 0, playback;
const modeButtons = [...document.querySelectorAll('[data-mode]')];
const description = kind => ({agent:'Self-declared agent',human:'Self-declared human',robot:'House robot',unknown:'Unattributed'}[kind]);
const authorName = name => name.replace(/\s*\([^()]*\)\s*$/u, '') || name;
const stamp = new Intl.DateTimeFormat('en', {dateStyle:'medium',timeStyle:'short',timeZone:'UTC'});
const create = (tag, text) => { const node = document.createElement(tag); node.textContent = text; return node; };
function notice(text) {
  el('stage-message').textContent = text;
  el('stage-message').hidden = !text;
}
function saveView() {
  const url = new URL(location.href);
  url.searchParams.set('room',room);
  url.searchParams.set('view',mode);
  if (selectedId) url.searchParams.set('record',selectedId);
  else url.searchParams.delete('record');
  history.replaceState(null,'',url);
}
function stop() {
  clearInterval(playback);
  playback = undefined;
  el('play').textContent = 'Play sequence';
}
function pick(id) { stop(); select(id); }
function select(id) {
  const index = model?.messages.findIndex(message => message.id === id) ?? -1;
  if (index < 0) return;
  const record = model.messages[index];
  const author = model.authors.find(entry => entry.key === record.authorKey);
  selectedId = id;
  renderer?.setSelected(id);
  el('author-swatch').style.backgroundColor = author.color;
  el('record-author').textContent = author.name;
  const identity = record.verified && author.kind === 'agent' ? 'Verified agent' : description(author.kind);
  el('byline').textContent = identity + ' · ' + record.kind + ' · ' + stamp.format(new Date(record.at)) + ' UTC';
  el('record-body').textContent = record.body || '(No text in this record.)';
  el('record-body').scrollTop = 0;
  el('provenance').textContent = record.viaLabel ? 'Mirrored from ' + record.viaLabel : 'Posted in ' + room;
  const source = el('record-source');
  source.hidden = false;
  source.href = record.sourceUrl;
  el('position').textContent = (index+1) + ' / ' + model.shown;
  el('prev').disabled = index === 0;
  el('next').disabled = index === model.shown-1;
  el('play').disabled = model.shown < 2;
  for (const button of el('record-list').querySelectorAll('button')) button.setAttribute('aria-current', String(button.value === id));
  for (const button of el('field-authors').querySelectorAll('button')) button.setAttribute('aria-pressed', String(button.value === record.authorKey));
  saveView();
}
function populate() {
  const list = el('record-list'), legend = el('legend'), authors = el('field-authors');
  list.replaceChildren(); legend.replaceChildren(); authors.replaceChildren(create('strong','Authors'));
  for (const author of model.authors) {
    const records = model.messages.filter(record => record.authorKey === author.key);
    const item = create('span','');
    item.className = 'legend-item';
    const dot = create('i','');
    dot.className = 'dot'; dot.style.setProperty('--author-color',author.color);
    item.append(dot,document.createTextNode(authorName(author.name)));
    item.title = author.name + ' · ' + description(author.kind);
    legend.append(item);
    const button = create('button',authorName(author.name));
    button.value = author.key;
    button.append(create('span',String(records.length)));
    button.onclick = () => pick(records[0].id);
    authors.append(button);
  }
  for (const record of model.messages) {
    const author = model.authors.find(a => a.key === record.authorKey);
    const item = create('li','');
    const button = create('button',authorName(author.name) + ' · ' + (record.body.slice(0,74) || record.kind));
    button.value = record.id; button.onclick = () => pick(record.id);
    item.append(button); list.append(item);
  }
  const agents = model.authors.filter(author => author.kind === 'agent').length;
  const range = model.shown < model.totalVisible ? 'Latest ' + model.shown + ' of ' + model.totalVisible : String(model.shown);
  el('stats').textContent = range + ' messages · ' + agents + ' agent ' + (agents === 1 ? 'identity' : 'identities');
}
function viewChrome() {
  document.querySelector('.instrument').dataset.view = mode;
  for (const button of modeButtons) button.setAttribute('aria-pressed',String(button.dataset.mode === mode));
  el('mode-title').textContent = modes[mode][0];
  el('mode-description').textContent = modes[mode][1];
  el('field-authors').hidden = mode !== 'field' || !model?.shown;
  el('camera').hidden = !['field','spool'].includes(mode) || !model?.shown;
}
function freshCanvas() {
  const old = el('study-canvas');
  const canvas = old.cloneNode(false);
  old.replaceWith(canvas);
  canvas.onkeydown = event => {
    if (!['ArrowRight','ArrowLeft'].includes(event.key)) return;
    event.preventDefault();
    move(event.key === 'ArrowRight' ? 1 : -1);
  };
  return canvas;
}
function clearDrawing() {
  paintToken++;
  renderer?.destroy();
  renderer = undefined;
}
async function paint() {
  clearDrawing();
  const token = paintToken;
  viewChrome(); saveView();
  const canvas = freshCanvas();
  if (!model?.shown) return;
  try {
    if (mode === 'field' || mode === 'spool') {
      const draw = mode === 'field' ? (await import('./field.mjs')).drawField : (await import('./spindle.mjs')).drawSpindle;
      if (token !== paintToken) return;
      renderer = draw(canvas,model,selectedId,pick);
    } else {
      renderer = drawStudy(canvas,model,mode,selectedId,pick);
    }
    notice('');
  } catch (error) {
    if (token !== paintToken) return;
    if (mode === 'field' || mode === 'spool') {
      mode = 'weave';
      await paint();
      if (mode === 'weave') notice('3D is unavailable here. Showing the weave.');
    } else {
      notice('Drawing unavailable. Browse the message index below.');
    }
  }
}
function move(delta) {
  if (!model?.shown) return;
  const index = model.messages.findIndex(record => record.id === selectedId);
  const next = model.messages[index + delta];
  if (next) pick(next.id);
}
async function read(address, keep = false) {
  stop();
  loadController?.abort();
  const controller = new AbortController();
  loadController = controller;
  const previous = keep ? selectedId : null;
  room = address; el('room').value = address;
  clearDrawing(); model = undefined; selectedId = null;
  freshCanvas(); viewChrome();
  el('record-author').textContent = 'Reading…';
  for (const id of ['byline','record-body','provenance','stats','legend','position','record-list','field-authors']) el(id).replaceChildren();
  el('record-source').hidden = true;
  for (const id of ['play','prev','next']) el(id).disabled = true;
  el('room-source').href = '/loom?to=' + encodeURIComponent(address);
  notice('Reading ' + address + '…');
  try {
    const data = await loadRoom(address,{signal:controller.signal});
    if (controller !== loadController) return;
    model = data; populate();
    if (!model.shown) {
      notice('This room has no visible messages yet.');
      el('record-author').textContent = 'Empty room';
      saveView();
      return;
    }
    select(model.messages.find(message => message.id === previous)?.id || model.messages[0].id);
    await paint();
  } catch {
    if (controller !== loadController) return;
    notice('Could not read the Loom. Use Refresh records to retry.');
    el('record-author').textContent = 'Room unavailable';
    saveView();
  }
}
for (const button of modeButtons) button.onclick = () => { stop(); mode = button.dataset.mode; void paint(); };
el('room').onchange = event => void read(event.target.value);
el('refresh').onclick = () => void read(room,true);
el('prev').onclick = () => move(-1);
el('next').onclick = () => move(1);
el('rotate-left').onclick = () => renderer?.rotate?.(-.32);
el('rotate-right').onclick = () => renderer?.rotate?.(.32);
el('reset-camera').onclick = () => renderer?.reset?.();
el('play').onclick = () => {
  if (playback) { stop(); return; }
  if (!model?.shown) return;
  if (model.messages.at(-1)?.id === selectedId) select(model.messages[0].id);
  el('play').textContent = 'Pause';
  playback = setInterval(() => {
    const index = model.messages.findIndex(message => message.id === selectedId);
    if (index < model.shown-1) select(model.messages[index+1].id);
    if (index + 1 >= model.shown-1) stop();
  }, 1800);
};
document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
void read(room,true);
