const KEY = 'pointcast:nouns-money:design-set:v1';
let release = () => {};

export function initNounsMoney() {
  release();
  const room = document.querySelector('[data-nouns-money]');
  if (!room) return;
  let catalog;
  try { catalog = JSON.parse(room.querySelector('#nouns-money-catalog').textContent); }
  catch { return; }
  const ids = new Set(catalog.map(note => note.id));
  const normalize = raw => Array.isArray(raw) ? [...new Set(raw.filter(id => typeof id === 'string' && ids.has(id)))].slice(0, 10) : [];
  const parse = raw => { try { return normalize(JSON.parse(raw || '[]')); } catch { return []; } };
  let saved = [];
  let durable = true;
  try { saved = parse(localStorage.getItem(KEY)); } catch { durable = false; }
  const storage = room.querySelector('[data-set-storage]');
  const render = () => {
    room.querySelector('[data-set-count]').textContent = `${saved.length} / ${catalog.length} saved${saved.length === catalog.length ? ' · first set complete!' : ''}`;
    room.querySelectorAll('[data-save-design]').forEach(button => {
      const kept = saved.includes(button.dataset.saveDesign);
      const note = catalog.find(note => note.id === button.dataset.saveDesign);
      button.setAttribute('aria-pressed', String(kept));
      button.setAttribute('aria-label', `${kept ? 'Remove' : 'Save'} ${note.name}${kept ? ' from saved set' : ''}`);
      button.textContent = kept ? 'Saved ✓' : 'Save design +';
      button.closest('[data-note-card]').classList.toggle('is-saved', kept);
    });
    storage.textContent = durable
      ? 'Saved on this device only. Clearing browser data removes the saved list; export a copy to keep it.'
      : 'Browser storage is unavailable. This set lasts for this visit only; export a copy to keep it.';
  };
  const click = event => {
    const button = event.target.closest('[data-save-design]');
    if (!button || !room.contains(button) || !ids.has(button.dataset.saveDesign)) return;
    if (durable) { try { saved = parse(localStorage.getItem(KEY)); } catch { durable = false; } }
    const id = button.dataset.saveDesign;
    saved = saved.includes(id) ? saved.filter(item => item !== id) : normalize([...saved, id]);
    try { localStorage.setItem(KEY, JSON.stringify(saved)); } catch { durable = false; }
    render();
  };
  const exportSet = () => {
    const data = {schema:'pointcast.nouns-money.design-set/v1', exportedAt:new Date().toISOString(), source:'https://pointcast.xyz/nouns-money/', meaning:'Saved design preferences only; no physical possession, NFT ownership or transfer is established.', designs:catalog.filter(note => saved.includes(note.id))};
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2) + '\n'], {type:'application/json'}));
    const anchor = document.createElement('a');
    anchor.href = url; anchor.download = 'nouns-money-my-design-set.json';
    document.body.append(anchor); anchor.click(); anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const onStorage = event => { if (event.key === KEY || event.key === null) { saved = parse(event.newValue); render(); } };
  room.addEventListener('click', click);
  const exportButton = room.querySelector('[data-set-export]');
  exportButton.addEventListener('click', exportSet);
  window.addEventListener('storage', onStorage);
  release = () => { room.removeEventListener('click', click); exportButton.removeEventListener('click', exportSet); window.removeEventListener('storage', onStorage); };
  render();
}
