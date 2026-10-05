import { CATS, FAMILIES } from '../catalog.js';
import { createSculptureScene } from './sculpture-scene.js';

const $ = selector => document.querySelector(selector);
const ALL = new Map(CATS.map(cat => [cat.id, cat]));
const STORAGE_KEY = 'lucky-cat:art:v2:exhibition';
const STARTER = ['kiln-celadon', 'wire-copper-pod', 'color-warm-window'];
const NOTES = {
  classic: 'Start with the gesture: two ears, a raised paw, and a small token. A soft silhouette makes an old good-luck tradition feel like familiar company.',
  kiln: 'Follow the contour before the color. The rim, the belly, and the fine surface marks turn a familiar figure into a vessel study. Try warm evening light to read the glaze.',
  block: 'Count the separate pieces. A wedge, a column, and a bright edge can make a figure without smoothing away the joints. An unexpected proportion gives this family its playful stance.',
  stone: 'Look at the opening as carefully as the mass around it. From one angle it holds a shadow; from another it opens the whole sculpture to the room.',
  wire: 'Turn slowly. The shell and the space inside it are both part of the form. An edge becomes a line; two layers become a little world with a changing outline.',
  balance: 'Follow the raised paw toward its counterweight. A hanging leaf or disc makes the good-luck gesture feel suspended between rest and motion. Pause the movement to study the relationship.',
  color: 'Watch one hue against the next. The recesses and framed edges make color feel deeper than a flat surface. Compare two pieces under the same light, then move the light.',
  master: 'A milestone brings several constructions together. An opening, a suspended form, a layered surface: these pieces gather the vocabulary of the collection into another kind of good-luck gesture.'
};
const SOURCE_NAMES = {
  classic: 'MLIT · Tokoname maneki-neko', kiln: 'V&A · Lucie Rie', block: 'Cooper Hewitt · Living with Memphis',
  stone: 'Cranbrook Art Museum · Barbara Hepworth', wire: 'Ruth Asawa estate · Sculpture',
  balance: 'Calder Foundation · Standing mobile', color: 'Albers Foundation · Interaction of Color'
};
let selectedId = 'wire-brass-nest';
let comparisonId = 'stone-pebble';
let showingComparison = false;
let familyId = 'all';
let focus = 'full';
let lighting = 'daylight';
let reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
let catalogPage = 0;
let query = '';
let show = { title: 'Three kinds of good luck', ids: [...STARTER] };
let toastTimer;
let scene;
let lastDesignId = null;
let stillImage;
let storageAvailable = true;

const node = (tag, className, text) => {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
};
function validIds(ids) {
  const seen = new Set();
  return Array.from({ length: 3 }, (_, index) => {
    const id = Array.isArray(ids) ? ids[index] : null;
    if (typeof id !== 'string' || !ALL.has(id) || seen.has(id)) return null;
    seen.add(id); return id;
  });
}
function cleanTitle(title) {
  return typeof title === 'string' ? title.slice(0, 60) : 'Three kinds of good luck';
}
function restoreShow() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (saved && Array.isArray(saved.ids)) show = { title: cleanTitle(saved.title), ids: validIds(saved.ids) };
  } catch { storageAvailable = false; }
  const params = new URL(location.href).searchParams;
  if (params.has('show')) {
    show = { title: cleanTitle(params.get('title') || 'A little exhibition'), ids: validIds(params.get('show').split(',')) };
  }
  if (ALL.has(params.get('work'))) selectedId = params.get('work');
  else if (params.has('show') && show.ids.some(Boolean)) selectedId = show.ids.find(Boolean);
  if (['daylight', 'amber', 'moon'].includes(params.get('light'))) lighting = params.get('light');
}
function toast(text) {
  clearTimeout(toastTimer);
  $('#art-toast').textContent = text;
  $('#art-toast').hidden = false;
  toastTimer = setTimeout(() => { $('#art-toast').hidden = true; }, 5000);
}
function persistShow() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(show)); }
  catch { storageAvailable = false; }
  const url = new URL(location.href);
  if (url.searchParams.has('show')) {
    url.searchParams.set('show', show.ids.join(','));
    url.searchParams.set('title', show.title || 'A little exhibition');
    history.replaceState(history.state, '', url.pathname + url.search + url.hash);
  }
  $('#art-share-output').hidden = true;
  $('#art-show-status').textContent = storageAvailable ? 'Your arrangement is saved on this device.' : 'Your arrangement is ready. Share its link to keep a copy.';
}
function tourWorks() { return familyId === 'all' ? CATS : CATS.filter(cat => cat.family === familyId); }
function visibleWork() { return ALL.get(showingComparison ? comparisonId : selectedId); }
function announce(text) { $('#art-announcement').textContent = text; }
function scrollToStage() { $('#exhibition').scrollIntoView({ behavior: reducedMotion ? 'instant' : 'smooth', block: 'start' }); }
function setWork(id, { scroll = false } = {}) {
  if (!ALL.has(id)) return;
  selectedId = id;
  showingComparison = false;
  if (familyId !== 'all' && ALL.get(id).family !== familyId) familyId = 'all';
  if (comparisonId === selectedId) comparisonId = CATS.find(cat => cat.id !== selectedId && cat.family !== ALL.get(selectedId).family)?.id || 'classic';
  renderTours();
  renderWork();
  renderComparison();
  renderCatalog();
  if (scroll) scrollToStage();
}
function applyDesign() {
  const cat = visibleWork();
  if (cat.id !== lastDesignId) {
    scene?.setDesign(cat);
    lastDesignId = cat.id;
    if (stillImage) { stillImage.src = `/lucky-cat/cats/${cat.id}.png`; stillImage.alt = `${cat.name}, ${cat.form.toLowerCase()} in ${cat.material.toLowerCase()}`; }
  }
}
function renderWork() {
  const cat = visibleWork();
  const family = FAMILIES.find(item => item.id === cat.family);
  const tour = tourWorks();
  const position = tour.findIndex(item => item.id === selectedId);
  $('#art-tour-position').textContent = `${position + 1} / ${tour.length}`;
  $('#art-room-label').textContent = family.name.toUpperCase();
  const live = scene?.getDebugState?.().available ?? Boolean(scene);
  $('#art-view-label').textContent = `${live ? 'LIVE SCULPTURE' : 'STILL PORTRAIT'}${showingComparison ? ' · COMPARISON B' : ''}`;
  $('#art-work-number').textContent = `Nº ${cat.number} / 060`;
  $('#art-work-family').textContent = family.name.toUpperCase();
  $('#art-work-title').textContent = cat.name;
  $('#art-work-material').textContent = `${cat.material} · ${cat.form}`;
  $('#art-work-description').textContent = family.principle;
  $('#art-curator-note').textContent = NOTES[cat.family];
  const source = $('#art-family-source');
  source.hidden = !family.source;
  if (family.source) { source.href = family.source; source.textContent = `${SOURCE_NAMES[family.id]} ↗`; }
  $('#art-add-work').textContent = show.ids.includes(cat.id) ? 'Already in my exhibition ✓' : 'Add to my exhibition +';
  $('#art-add-work').disabled = show.ids.includes(cat.id);
  applyDesign();
  const canvas = $('#art-scene canvas');
  if (canvas) canvas.setAttribute('aria-label', `${cat.name}, ${cat.material}. Drag or use arrow keys to orbit. Scroll or use plus and minus to zoom. Home returns to the whole sculpture.`);
  $('#art-focus-controls').hidden = !live;
  $('#art-light').disabled = !live;
  $('#art-motion').hidden = !live;
  $('#art-save-view').hidden = !live;
  if (!live) $('#art-view-hint').textContent = 'This browser is showing still portraits. Explore the families, compare works, and arrange an exhibition.';
  announce(`${cat.name}. ${cat.material}. ${showingComparison ? 'Comparison B.' : `Work ${position + 1} of ${tour.length}.`}`);
}
function renderTours() {
  const wrap = $('#art-family-tours');
  if (!wrap.childElementCount) {
    for (const family of [{ id: 'all', name: 'All 60 works' }, ...FAMILIES]) {
      const button = node('button', '', family.name);
      button.type = 'button'; button.dataset.family = family.id;
      button.onclick = () => {
        familyId = family.id;
        catalogPage = 0;
        const works = tourWorks();
        setWork(works.some(cat => cat.id === selectedId) ? selectedId : works[0].id);
      };
      wrap.append(button);
    }
  }
  for (const button of wrap.querySelectorAll('button')) button.setAttribute('aria-pressed', String(button.dataset.family === familyId));
}
function renderComparison() {
  const a = ALL.get(selectedId), b = ALL.get(comparisonId);
  $('#art-comparison-select').value = comparisonId;
  $('#art-compare-a-name').textContent = a.name;
  $('#art-compare-b-name').textContent = b.name;
  $('#art-compare-a').setAttribute('aria-pressed', String(!showingComparison));
  $('#art-compare-b').setAttribute('aria-pressed', String(showingComparison));
  const common = a.family === b.family ? 'Two variations within one family. Look for a change in proportion, opening, or surface rather than the shared gesture.' : `${a.name} works with ${a.material.toLowerCase()}; ${b.name} with ${b.material.toLowerCase()}. Look at the edge, the opening, and the space each form holds.`;
  $('#art-comparison-note').textContent = common;
}
function renderShow() {
  const wrap = $('#art-show-plinths');
  wrap.replaceChildren();
  for (let index = 0; index < 3; index++) {
    const cat = ALL.get(show.ids[index]);
    const article = node('article', 'art-plinth');
    const number = node('div', 'art-plinth-number');
    number.append(node('span', '', `PLINTH 0${index + 1}`), node('span', '', cat ? `Nº ${cat.number}` : 'OPEN'));
    const portrait = node('button', 'art-plinth-portrait');
    portrait.type = 'button';
    if (cat) {
      const img = node('img'); img.src = `/lucky-cat/cats/${cat.id}.png`; img.alt = ''; img.loading = 'lazy'; img.width = 320; img.height = 260;
      portrait.append(img); portrait.setAttribute('aria-label', `Look closely at ${cat.name}`); portrait.onclick = () => setWork(cat.id, { scroll: true });
    } else {
      portrait.append(node('span', 'art-plinth-empty', '+')); portrait.setAttribute('aria-label', `Place the current sculpture on plinth ${index + 1}`); portrait.onclick = () => placeWork(index);
    }
    article.append(number, portrait, node('h3', '', cat?.name || 'A space for a form'), node('p', 'art-plinth-material', cat?.material || 'Choose from the looking room'));
    const actions = node('div', 'art-plinth-actions');
    const place = node('button', 'art-plinth-place', cat ? 'Replace with current work' : 'Place current work');
    place.type = 'button'; place.onclick = () => placeWork(index); actions.append(place);
    if (cat) {
      const moves = node('div', 'art-plinth-move');
      for (const [delta, label] of [[-1, '←'], [1, '→']]) {
        const move = node('button', '', label); move.type = 'button'; move.disabled = index + delta < 0 || index + delta >= 3;
        move.setAttribute('aria-label', `Move ${cat.name} ${delta < 0 ? 'left' : 'right'}`);
        move.onclick = () => {
          const target = index + delta;
          [show.ids[index], show.ids[target]] = [show.ids[target], show.ids[index]];
          persistShow(); renderShow(); toast(`${cat.name} moved to plinth ${target + 1}.`);
        };
        moves.append(move);
      }
      actions.append(moves);
      const remove = node('button', 'art-text-button art-plinth-remove', 'Remove'); remove.type = 'button'; remove.setAttribute('aria-label', `Remove ${cat.name} from my exhibition`);
      remove.onclick = () => { show.ids[index] = null; persistShow(); renderShow(); renderWork(); toast(`${cat.name} removed from your exhibition.`); };
      actions.append(remove);
    }
    article.append(actions); wrap.append(article);
  }
  $('#art-share-show').disabled = !show.ids.some(Boolean);
  $('#art-clear-show').disabled = !show.ids.some(Boolean);
}
function placeWork(index) {
  const cat = visibleWork();
  const existing = show.ids.indexOf(cat.id);
  if (existing === index) return;
  if (existing >= 0) { toast(`${cat.name} is already on plinth ${existing + 1}. Use the arrows to move it.`); return; }
  show.ids[index] = cat.id;
  persistShow(); renderShow(); renderWork();
  toast(`${cat.name} placed on plinth ${index + 1}.`);
}
function catalogWorks() {
  const search = query.toLowerCase().trim();
  return tourWorks().filter(cat => !search || `${cat.name} ${cat.form} ${cat.material} ${FAMILIES.find(family => family.id === cat.family).name}`.toLowerCase().includes(search));
}
function renderCatalog() {
  const works = catalogWorks();
  const pages = Math.max(1, Math.ceil(works.length / 12));
  catalogPage = Math.min(catalogPage, pages - 1);
  $('#art-catalog-summary').textContent = `${works.length} ${works.length === 1 ? 'work' : 'works'}${familyId !== 'all' ? ` · ${FAMILIES.find(family => family.id === familyId).name}` : ' · eight families of form'}`;
  const grid = $('#art-catalog-grid'); grid.replaceChildren();
  for (const cat of works.slice(catalogPage * 12, catalogPage * 12 + 12)) {
    const button = node('button', 'art-catalog-card'); button.type = 'button'; button.setAttribute('aria-pressed', String(cat.id === selectedId));
    button.setAttribute('aria-label', `Look closely at ${cat.name}, ${cat.material}, work ${cat.number}`);
    const header = node('div'); header.append(node('span', '', `Nº ${cat.number}`), node('span', '', cat.family === 'master' ? 'MILESTONE' : FAMILIES.find(family => family.id === cat.family).name.toUpperCase()));
    const img = node('img'); img.src = `/lucky-cat/cats/${cat.id}.png`; img.alt = ''; img.loading = 'lazy'; img.width = 320; img.height = 260;
    button.append(header, img, node('strong', '', cat.name), node('span', '', cat.material)); button.onclick = () => setWork(cat.id, { scroll: true }); grid.append(button);
  }
  if (!works.length) grid.append(node('p', 'art-catalog-empty', 'No work matches this search. Try a material or another family.'));
  $('#art-catalog-page').textContent = `${catalogPage + 1} / ${pages}`;
  $('#art-catalog-previous').disabled = catalogPage === 0;
  $('#art-catalog-next').disabled = catalogPage >= pages - 1;
}
function renderReading() {
  const wrap = $('#art-family-reading');
  for (const family of FAMILIES) {
    const article = node('article', 'art-family-source');
    article.append(node('h3', '', family.name), node('p', '', `${family.material}. ${family.principle}`));
    if (family.source) { const link = node('a', '', `${SOURCE_NAMES[family.id]} ↗`); link.href = family.source; link.target = '_blank'; link.rel = 'noopener noreferrer'; article.append(link); }
    else article.append(node('p', '', 'Original hybrid forms drawn from the collection’s own sculptural vocabulary.'));
    wrap.append(article);
  }
}
async function shareShow() {
  const url = new URL('/lucky-cat/art/v2/', location.origin);
  url.searchParams.set('show', show.ids.join(','));
  url.searchParams.set('title', show.title || 'A little exhibition');
  url.searchParams.set('work', visibleWork().id);
  url.searchParams.set('light', lighting);
  $('#art-share-link').value = url.href;
  $('#art-open-share').href = url.href;
  $('#art-share-output').hidden = false;
  try { await navigator.clipboard.writeText(url.href); toast('Your exhibition link is copied. A little room, ready to share.'); }
  catch { $('#art-share-link').focus(); $('#art-share-link').select(); toast('Your exhibition link is ready below. Select it to copy.'); }
}
async function saveView() {
  if (!scene?.capture) { toast('A live sculpture view is needed to save an image.'); return; }
  try {
    const captured = await scene.capture({ width: 1600, height: 1200, transparent: false, background: '#f5f1e7' });
    const objectURL = captured instanceof Blob ? URL.createObjectURL(captured) : null;
    const href = objectURL || captured;
    if (typeof href !== 'string' || !href) throw new Error('No image was returned');
    const link = node('a'); link.href = href; link.download = `lucky-cat-${visibleWork().id}-${lighting}.png`; document.body.append(link); link.click(); link.remove();
    if (objectURL) setTimeout(() => URL.revokeObjectURL(objectURL), 1000);
    toast('Your sculpture view is saved as an image.');
  } catch { toast('This view could not be saved. You can still share your exhibition link.'); }
}

restoreShow();
$('#art-show-title').value = show.title;
$('#art-light').value = lighting;
try {
  scene = createSculptureScene($('#art-scene'), { reducedMotion });
  scene.setLighting(lighting); scene.setReducedMotion(reducedMotion); scene.setFocus(focus);
} catch {
  stillImage = node('img'); $('#art-scene').replaceChildren(stillImage);
  $('#art-view-hint').textContent = 'This browser is showing still portraits. Explore the families, compare works, and arrange an exhibition.';
  $('#art-focus-controls').hidden = true; $('#art-light').disabled = true; $('#art-motion').hidden = true; $('#art-save-view').hidden = true;
}
const comparisonSelect = $('#art-comparison-select');
for (const family of FAMILIES) {
  const group = node('optgroup'); group.label = family.name;
  for (const cat of CATS.filter(work => work.family === family.id)) { const option = node('option', '', `${cat.number} · ${cat.name}`); option.value = cat.id; group.append(option); }
  comparisonSelect.append(group);
}
comparisonSelect.onchange = () => {
  comparisonId = comparisonSelect.value;
  if (comparisonId === selectedId) { showingComparison = false; toast('These are the same work. Choose another to compare forms.'); }
  else showingComparison = true;
  renderWork(); renderComparison(); scrollToStage();
};
$('#art-compare-a').onclick = () => { showingComparison = false; renderWork(); renderComparison(); scrollToStage(); };
$('#art-compare-b').onclick = () => { showingComparison = true; renderWork(); renderComparison(); scrollToStage(); };
for (const [id, delta] of [['#art-previous', -1], ['#art-next', 1]]) $(id).onclick = () => {
  const works = tourWorks(), index = works.findIndex(cat => cat.id === selectedId);
  setWork(works[(index + delta + works.length) % works.length].id);
};
$('#art-focus-controls').onclick = event => {
  const button = event.target.closest('[data-focus]'); if (!button) return;
  focus = button.dataset.focus; scene?.setFocus(focus);
  for (const control of $('#art-focus-controls').querySelectorAll('button')) control.setAttribute('aria-pressed', String(control === button));
  $('#art-view-hint').textContent = ({ full: 'Walk around the silhouette. An opening can be as important as the solid form.', face: 'Two ears and a quiet expression keep a familiar gesture through every construction.', token: 'The small good-luck token connects a figure, a raised paw, and the surrounding space.', material: 'Try a second light. An edge, a reflection, or a shadow can tell another story about the surface.' })[focus];
};
$('#art-light').onchange = () => { lighting = $('#art-light').value; scene?.setLighting(lighting); announce(`${$('#art-light').selectedOptions[0].textContent} selected.`); };
function renderMotion() { document.body.classList.toggle('less-motion', reducedMotion); $('#art-motion').textContent = reducedMotion ? 'Motion paused' : 'Pause motion'; $('#art-motion').setAttribute('aria-pressed', String(reducedMotion)); }
$('#art-motion').onclick = () => { reducedMotion = !reducedMotion; scene?.setReducedMotion(reducedMotion); renderMotion(); };
$('#art-fullscreen').onclick = async () => {
  try { if (document.fullscreenElement) await document.exitFullscreen(); else await $('#art-sculpture-frame').requestFullscreen(); }
  catch { toast('This browser keeps the sculpture in the page. Use the detail controls for a closer look.'); }
};
document.addEventListener('fullscreenchange', () => { $('#art-fullscreen').textContent = document.fullscreenElement ? 'Return to the exhibition ↙' : 'Full screen ↗'; });
$('#art-add-work').onclick = () => {
  const emptyPlinth = show.ids.indexOf(null);
  if (emptyPlinth < 0) { toast('Your three plinths are full. Choose “Replace with current work” below to change one.'); $('#personal-show').scrollIntoView({ behavior: reducedMotion ? 'instant' : 'smooth' }); return; }
  placeWork(emptyPlinth);
};
$('#art-show-title').oninput = () => { show.title = cleanTitle($('#art-show-title').value); persistShow(); };
$('#art-clear-show').onclick = () => { show.ids = [null, null, null]; persistShow(); renderShow(); renderWork(); toast('Three open plinths. Begin with a form you love.'); };
$('#art-share-show').onclick = shareShow;
$('#art-save-view').onclick = saveView;
$('#art-search').oninput = () => { query = $('#art-search').value; catalogPage = 0; renderCatalog(); };
$('#art-catalog-previous').onclick = () => { catalogPage--; renderCatalog(); };
$('#art-catalog-next').onclick = () => { catalogPage++; renderCatalog(); };
addEventListener('pagehide', event => { if (!event.persisted) scene?.dispose(); });
renderTours(); renderWork(); renderComparison(); renderShow(); renderCatalog(); renderReading(); renderMotion();
if (new URL(location.href).searchParams.has('show')) $('#art-show-status').textContent = 'A shared exhibition. Make a change to save your own arrangement.';
