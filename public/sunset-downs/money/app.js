import { EDITIONS, DENOMINATIONS, stableCredit, designId, renderNote } from './note.mjs';
const $ = id => document.getElementById(id);
const portraits = new Map();
let note = '';
let renderVersion = 0;
function selected() { return { id: $('edition').value, denomination: Number(new FormData($('note-form')).get('numeral')), stable: stableCredit($('stable').value) }; }
async function portrait(id) {
  if (!EDITIONS.some(item => item.id === id)) throw new Error('Choose an edition from the cast.');
  if (!portraits.has(id)) {
    const request = fetch(`../art/nouns/${id}.svg`).then(response => { if (!response.ok) throw new Error('The original portrait is unavailable. Please try again.'); return response.text(); });
    portraits.set(id, request);
    request.catch(() => portraits.delete(id));
  }
  return portraits.get(id);
}
function status(text) { $('status').textContent = text; }
async function update() {
  const version = ++renderVersion;
  note = '';
  $('download').disabled = true; $('print').disabled = true;
  try {
    const { id, denomination, stable } = selected();
    const original = await portrait(id);
    if (version !== renderVersion) return;
    note = renderNote(id, denomination, stable, original);
    const image = document.createElement('img');
    image.src = `data:image/svg+xml,${encodeURIComponent(note)}`;
    image.alt = `${EDITIONS.find(item => item.id === id).name}, ${denomination} Studio Scrip, credited to ${stable}. Prop scrip. No cash value.`;
    image.style.width = '100%'; image.style.height = 'auto'; image.style.display = 'block';
    $('note-preview').replaceChildren(image);
    $('note-preview').setAttribute('aria-label', image.alt);
    $('design-label').textContent = `DESIGN ${designId(id, denomination)}`;
    document.querySelectorAll('[data-edition]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.edition === id)));
    $('download').disabled = false; $('print').disabled = false;
    status('');
  } catch (error) { if (version === renderVersion) status(error.message || 'The note could not be prepared. Please try again.'); }
}
function download() {
  if (!note || $('download').disabled) return;
  const { id, denomination } = selected();
  const url = URL.createObjectURL(new Blob([note], { type: 'image/svg+xml;charset=utf-8' }));
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = `sunset-downs-${id}-${denomination}-prop-scrip.svg`;
  document.body.append(anchor); anchor.click(); anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
  status('SVG download requested. A reprintable art note; no game funds were added.');
}
async function printSheet() {
  if ($('print').disabled) return;
  $('print').disabled = true;
  try {
    const { id, stable } = selected(); const original = await portrait(id);
    const sheet = $('print-sheet'); sheet.replaceChildren();
    const heading = document.createElement('p'); heading.className = 'print-heading'; heading.textContent = 'SUNSET DOWNS × NOUNS MONEY / STUDIO SCRIP 01'; sheet.append(heading);
    const subtitle = document.createElement('p'); subtitle.className = 'print-subtitle'; subtitle.textContent = `${EDITIONS.find(item => item.id === id).name} · ${stable} · 180 × 70 mm · Print at 100% / Actual Size`; sheet.append(subtitle);
    const images = [];
    for (const value of DENOMINATIONS) {
      const wrapper = document.createElement('div'); wrapper.className = 'print-note';
      const img = document.createElement('img'); img.src = `data:image/svg+xml,${encodeURIComponent(renderNote(id, value, stable, original))}`; img.alt = `${value} prop scrip. No cash value.`; img.style.width = '180mm'; img.style.height = '70mm';
      wrapper.append(img); sheet.append(wrapper); images.push(img);
    }
    const calibration = document.createElement('div'); calibration.className = 'print-calibration'; calibration.textContent = 'This line must measure 50 mm.'; sheet.append(calibration);
    const footer = document.createElement('p'); footer.className = 'print-footer'; footer.textContent = 'COLLECTIBLE ART · PROP SCRIP · NO CASH VALUE. Front-face RGB proof; no cash redemption, ownership rights or physical production proof. Disable Fit/Shrink and verify the reference line.'; sheet.append(footer);
    await Promise.all(images.map(img => img.decode()));
    window.print();
    status('Print sheet prepared: three notes, 180 × 70 mm each. Check 100% / Actual Size and the 50 mm line.');
  } catch (error) { status(error.message || 'The print sheet could not be prepared.'); }
  finally { $('print').disabled = !note; }
}
for (const [index, edition] of EDITIONS.entries()) {
  const button = document.createElement('button'); button.type = 'button'; button.className = 'cast-card'; button.dataset.edition = edition.id; button.setAttribute('aria-pressed', 'false');
  const number = document.createElement('span'); number.className = 'cast-number'; number.textContent = `0${index+1} / STUDIO ORIGINAL`;
  const image = document.createElement('img'); image.src = `../art/nouns/${edition.id}.svg`; image.width = 320; image.height = 320; image.loading = 'lazy'; image.alt = `Original Nouns horse portrait for ${edition.name}`;
  const name = document.createElement('h3'); name.textContent = edition.name;
  const role = document.createElement('p'); role.className = 'role'; role.textContent = edition.role;
  const line = document.createElement('p'); line.textContent = edition.line;
  button.append(number, image, name, role, line);
  button.addEventListener('click', () => { $('edition').value = edition.id; update(); $('atelier').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }); });
  $('cast-grid').append(button);
}
$('note-form').addEventListener('submit', event => event.preventDefault());
$('note-form').addEventListener('input', update);
$('download').addEventListener('click', download);
$('print').addEventListener('click', printSheet);
try {
  const stable = JSON.parse(localStorage.getItem('pointcast:sunset-downs:stable:v1') || 'null');
  if (stable && typeof stable.name === 'string') $('stable').value = stableCredit(stable.name);
} catch { /* A stable credit can always be entered by hand. */ }
update();
