import { createArenaReplay } from './arena-replay.js';

let cleanup;
function initRivalryNight() {
  cleanup?.(); cleanup = undefined;
  const root = document.querySelector('[data-rivalry-record]');
  if (!root) return;
  const controller = new AbortController(), replay = createArenaReplay(root);
  cleanup = () => { controller.abort(); replay.destroy(); };
  const status = root.querySelector('#arena-status');
  root.querySelector('#rivalry-copy').addEventListener('click', async () => {
    const input = root.querySelector('#rivalry-link'), shareStatus = root.querySelector('#rivalry-share-status');
    try { await navigator.clipboard.writeText(input.value); if (!controller.signal.aborted) shareStatus.textContent = 'Match link copied.'; }
    catch { if (!controller.signal.aborted) { input.focus(); input.select(); shareStatus.textContent = 'Select and copy the match link above.'; } }
  }, { signal: controller.signal });
  (async () => {
    try {
      const response = await fetch(root.dataset.rivalryRecord, { signal: controller.signal });
      if (!response.ok) throw Error('The replay could not load. Reload to try again; the result and original record are below.');
      const record = await response.json();
      if (record.matchHash !== root.dataset.matchHash || !record.catalog) throw Error('This replay does not match the published result.');
      const canonical = value => value === null || typeof value !== 'object' ? JSON.stringify(value) : Array.isArray(value) ? '['+value.map(canonical).join(',')+']' : '{'+Object.keys(value).sort().map(key=>JSON.stringify(key)+':'+canonical(value[key])).join(',')+'}';
      const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonical(record.match)));
      const actualHash = Array.from(new Uint8Array(digest), n => n.toString(16).padStart(2,'0')).join('');
      if (actualHash !== record.matchHash) throw Error('The replay record failed its integrity check.');
      if (controller.signal.aborted) return;
      replay.load(record, record.catalog, false);
      status.textContent = 'The published replay is ready. Press Play replay to watch.';
    } catch (error) { if (!controller.signal.aborted) status.textContent = error.message; }
  })();
}
initRivalryNight();
document.addEventListener('astro:page-load', initRivalryNight);
document.addEventListener('astro:before-swap', () => { cleanup?.(); cleanup = undefined; });
