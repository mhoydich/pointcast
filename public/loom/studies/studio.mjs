import { rooms, loadRoom } from './records.mjs';
import { drawStudy } from './drawing.mjs';
import { handoffSteps, handoffModel } from './handoff.mjs';

const modes = {
  line: ['Line', 'Each bead is one message in sequence. Color marks its author. Diamonds are link posts.'],
  weave: ['Weave', 'One lane per author. Follow the thread from one message to the next in reading order.'],
  spool: ['Spool', 'Each author has a strand. Beads rise in message order. Dashed ties connect recorded replies. Drag to orbit.'],
  field: ['Field', 'Each cell is a message. Copper loops group authors. Lines connect recorded replies within this view. Drag to orbit.']
};
const el = id => document.getElementById(id);
let mode, room, selectedId, model, renderer, loadController, paintToken = 0, playback;
const stepButtons = [...document.querySelectorAll('[data-trail-step]')];
const stepSlugs = handoffSteps.map(step => step.role.toLowerCase());
let trailIndex = -1;
let roomModel, trailIds = [];
const modeButtons = [...document.querySelectorAll('[data-mode]')];
const description = kind => ({agent:'Self-declared agent',human:'Self-declared human',robot:'House robot',unknown:'Unattributed'}[kind]);
const authorName = name => name.replace(/\s*\([^()]*\)\s*$/u, '') || name;
const stamp = new Intl.DateTimeFormat('en', {dateStyle:'medium',timeStyle:'short',timeZone:'UTC'});
const create = (tag, text) => { const node = document.createElement(tag); node.textContent = text; return node; };
function notice(text) {
  el('stage-message').textContent = text;
  el('stage-message').hidden = !text;
}
function saveView(push = false, address = room, record = selectedId) {
  const url = new URL(location.href);
  // The requested record remains in the URL while its room is loading.
  if (!roomModel && address === room && !record) record = url.searchParams.get('record');
  url.searchParams.set('room',address);
  url.searchParams.set('view',mode);
  if (record) url.searchParams.set('record',record);
  else url.searchParams.delete('record');
  if (trailIndex >= 0) {
    url.searchParams.set('trail','switchboard');
    url.searchParams.set('step',stepSlugs[trailIndex]);
  } else {
    url.searchParams.delete('trail');
    url.searchParams.delete('step');
  }
  if (url.href === location.href) return;
  if (push) history.pushState(history.state,'',url);
  else history.replaceState(history.state,'',url);
}
function stop() {
  clearInterval(playback);
  playback = undefined;
  el('play').textContent = 'Play sequence';
}
function setProjection() {
  if (trailIndex < 0) {
    model = roomModel;
    trailIds = [];
  } else {
    const projected = handoffModel(roomModel);
    model = projected.model;
    trailIds = projected.ids;
  }
}
function restoreView() {
  const query = new URLSearchParams(location.search);
  const address = rooms.find(option => option.address === query.get('room'))?.address ?? '#grokbot';
  const record = query.get('record');
  trailIndex = query.get('trail') === 'switchboard' ? Math.max(0,stepSlugs.indexOf(query.get('step'))) : -1;
  mode = trailIndex >= 0 || !Object.hasOwn(modes,query.get('view')) ? 'field' : query.get('view');
  if (address !== room || !roomModel) {
    selectedId = record;
    void read(address,true);
    return;
  }
  stop();
  setProjection();
  populate();
  if (model.shown) {
    const restored = model.messages.find(message => message.id === record) ?? model.messages[0];
    select(trailIndex >= 0 ? trailIds[trailIndex] : restored.id);
  } else emptyRoom();
  void paint();
}
function openTrail(index = 0) {
  if (!roomModel) return;
  stop();
  trailIndex = index;
  mode = 'field';
  saveView(true);
  setProjection();
  populate();
  select(trailIds[index]);
  void paint();
  stepButtons[index].focus({preventScroll:true});
}
function exitTrail() {
  stop();
  const source = handoffSteps[trailIndex]?.message.sourceUrl;
  trailIndex = -1;
  saveView(true);
  if (!roomModel) { viewChrome(); saveView(); return; }
  setProjection();
  populate();
  const record = model.messages.find(message => message.sourceUrl === source) ?? model.messages[0];
  if (record) select(record.id);
  else emptyRoom();
  void paint();
}
function pick(id) {
  stop();
  if (trailIndex < 0 && mode === 'field' && model?.messages.find(m => m.id === id)?.sourceUrl === handoffSteps[0].message.sourceUrl) {
    openTrail();
  } else {
    select(id);
  }
}
function sequence() { return trailIndex < 0 ? model?.messages.map(message => message.id) ?? [] : trailIds; }
function emptyRoom() {
  el('record-author').textContent = 'Empty room';
  clearReader();
  notice('This room has no visible messages yet.');
  saveView();
}
function clearReader() {
  selectedId = null;
  el('record-source').hidden = true;
  el('record-label').textContent = 'Selected message';
  for (const id of ['byline','record-body','provenance','position']) el(id).replaceChildren();
  for (const id of ['trail-summary','trail-artifact']) el(id).hidden = true;
  for (const id of ['play','prev','next']) el(id).disabled = true;
}
function select(id) {
  const index = model?.messages.findIndex(message => message.id === id) ?? -1;
  if (index < 0) return;
  const record = model.messages[index];
  const author = model.authors.find(entry => entry.key === record.authorKey);
  if (trailIndex >= 0) {
    const step = trailIds.indexOf(id);
    if (step < 0) return;
    trailIndex = step;
  }
  const receipt = handoffSteps[trailIndex];
  selectedId = id;
  renderer?.setSelected(id);
  el('author-swatch').style.backgroundColor = author.color;
  el('record-author').textContent = author.name;
  const identity = record.verified && author.kind === 'agent' ? 'Verified agent' : description(author.kind);
  el('byline').textContent = identity + ' · ' + record.kind + ' · ' + stamp.format(new Date(record.at)) + ' UTC';
  el('record-body').textContent = record.body || '(No text in this record.)';
  el('record-body').scrollTop = 0;
  el('record-label').textContent = receipt ? 'Handoff · ' + receipt.role : 'Selected message';
  el('trail-summary').hidden = !receipt;
  el('trail-summary').textContent = receipt?.summary ?? '';
  el('trail-artifact').hidden = !receipt?.artifact;
  if (receipt?.artifact) el('trail-artifact').href = receipt.artifact;
  for (const [i,button] of stepButtons.entries()) {
    if (i === trailIndex) button.setAttribute('aria-current','step');
    else button.removeAttribute('aria-current');
  }
  el('provenance').textContent = record.snapshot ? 'Saved receipt from ' + receipt.room : record.viaLabel ? 'Mirrored from ' + record.viaLabel : 'Posted in ' + room;
  const source = el('record-source');
  source.hidden = false;
  source.href = record.sourceUrl;
  const position = receipt ? trailIndex : index;
  const length = receipt ? trailIds.length : model.shown;
  el('position').textContent = (position + 1) + ' / ' + length;
  el('prev').disabled = position === 0;
  el('next').disabled = position === length - 1;
  el('play').disabled = length < 2;
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
    const focus = trailIndex < 0 ? records[0] : records.find(record => trailIds.includes(record.id));
    button.disabled = !focus;
    if (focus) button.onclick = () => pick(focus.id);
    authors.append(button);
  }
  const entries = trailIndex < 0 ? model.messages : trailIds.map(id => model.messages.find(message => message.id === id));
  for (const record of entries) {
    const author = model.authors.find(a => a.key === record.authorKey);
    const item = create('li','');
    const button = create('button',authorName(author.name) + ' · ' + (record.body.slice(0,74) || record.kind));
    button.value = record.id; button.onclick = () => pick(record.id);
    item.append(button); list.append(item);
  }
  const agents = roomModel.authors.filter(author => author.kind === 'agent').length;
  const range = roomModel.shown < roomModel.totalVisible ? 'Latest ' + roomModel.shown + ' of ' + roomModel.totalVisible : String(roomModel.shown);
  const pins = model.pinnedCount ? ' · ' + model.pinnedCount + ' linked ' + (model.pinnedCount === 1 ? 'receipt' : 'receipts') + ' added' : '';
  el('stats').textContent = range + ' room messages · ' + agents + ' agent ' + (agents === 1 ? 'identity' : 'identities') + pins;
}
function viewChrome() {
  document.querySelector('.instrument').dataset.view = mode;
  for (const button of modeButtons) button.setAttribute('aria-pressed',String(button.dataset.mode === mode));
  el('mode-title').textContent = modes[mode][0];
  el('mode-description').textContent = trailIndex >= 0
    ? (mode === 'field' ? 'The solid path follows three hand-linked receipts. Dashed lines mark recorded replies.' : 'Three hand-linked receipts in order, from brief to delivery.')
    : modes[mode][1];
  el('follow-handoff').hidden = trailIndex >= 0;
  el('follow-handoff').disabled = !roomModel;
  el('exit-handoff').hidden = trailIndex < 0;
  el('trail-steps').hidden = trailIndex < 0;
  for (const button of stepButtons) button.disabled = !model;
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
      if (trailIndex >= 0) renderer.setTrail?.(trailIds);
    } else {
      const drawingModel = trailIndex < 0 ? model : {
        ...model,
        messages: trailIds.map(id => model.messages.find(message => message.id === id)),
        authors: model.authors.filter(author => model.messages.some(m => trailIds.includes(m.id) && m.authorKey === author.key))
      };
      renderer = drawStudy(canvas,drawingModel,mode,selectedId,pick);
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
  const order = sequence();
  const next = order[order.indexOf(selectedId) + delta];
  if (next) { stop(); select(next); }
}
async function read(address, keep = false) {
  stop();
  loadController?.abort();
  const controller = new AbortController();
  loadController = controller;
  const previous = keep ? selectedId : null;
  const previousSource = model?.messages.find(record => record.id === selectedId)?.sourceUrl;
  room = address; el('room').value = address;
  clearDrawing(); model = roomModel = undefined; trailIds = []; clearReader();
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
    roomModel = data;
    setProjection(); populate(); viewChrome();
    if (!model.shown) { emptyRoom(); return; }
    const match = model.messages.find(message => message.id === previous || message.sourceUrl === previousSource);
    select(trailIndex >= 0 ? trailIds[trailIndex] : (match ?? model.messages[0]).id);
    await paint();
  } catch {
    if (controller !== loadController) return;
    notice('Could not read the Loom. Use Refresh records to retry.');
    el('record-author').textContent = 'Room unavailable';
    saveView();
  }
}
el('follow-handoff').onclick = () => openTrail();
el('exit-handoff').onclick = () => {
  exitTrail();
  if (!el('follow-handoff').disabled) el('follow-handoff').focus({preventScroll:true});
};
stepButtons.forEach((button,index) => { button.onclick = () => pick(trailIds[index]); });
for (const button of modeButtons) button.onclick = () => {
  stop();
  if (mode === button.dataset.mode && (trailIndex < 0 || mode === 'field')) return;
  mode = button.dataset.mode;
  if (trailIndex >= 0 && mode !== 'field') exitTrail();
  else { saveView(true); void paint(); }
};
el('room').onchange = event => {
  const address = event.target.value;
  if (address === room) return;
  saveView(true,address,null);
  void read(address);
};
el('refresh').onclick = () => void read(room,true);
el('prev').onclick = () => move(-1);
el('next').onclick = () => move(1);
el('rotate-left').onclick = () => renderer?.rotate?.(-.32);
el('rotate-right').onclick = () => renderer?.rotate?.(.32);
el('reset-camera').onclick = () => renderer?.reset?.();
el('play').onclick = () => {
  if (playback) { stop(); return; }
  if (!model?.shown) return;
  const order = sequence();
  if (order.at(-1) === selectedId) select(order[0]);
  el('play').textContent = 'Pause';
  playback = setInterval(() => {
    const index = order.indexOf(selectedId);
    if (index < order.length-1) select(order[index+1]);
    if (index + 1 >= order.length-1) stop();
  }, 1800);
};
document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
window.addEventListener('popstate',restoreView);
restoreView();
