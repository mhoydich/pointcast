import { createArenaReplay } from './arena-replay.js';
import { setupFromParams } from './arena-links.mjs';

let cleanup;
function initArena() {
  cleanup?.(); cleanup = undefined;
  const form = document.getElementById('arena-form');
  if (!form) return;
  const $ = id => document.getElementById(id);
  const controller = new AbortController(), options = { signal: controller.signal };
  const replay = createArenaReplay();
  cleanup = () => { controller.abort(); replay.destroy(); };
  let catalog, rulesVersion;
  const status = text => { $('arena-status').textContent = text; };
  function input() {
    const seed = Number($('arena-seed').value);
    if (!$('arena-seed').value.trim() || !Number.isInteger(seed) || seed < 0 || seed > 4294967295) throw Error('Choose a whole-number seed from 0 to 4294967295.');
    return { seed, left: { gang: $('left-gang').value, tactic: $('left-tactic').value }, right: { gang: $('right-gang').value, tactic: $('right-tactic').value } };
  }
  function example() {
    try { $('arena-example').textContent = `GET https://pointcast.xyz/api/nouns-battler/arena\n\nPOST https://pointcast.xyz/api/nouns-battler/arena\nContent-Type: application/json\n\n${JSON.stringify(input(), null, 2)}\n\n// Optional commissioned record: POST /api/agent/battler\n// Body: {"match": <the input above>, "rulesVersion": "${rulesVersion}", "maxSpendUnits": "10000"}\n// No payment signature: receive terms only (HTTP 402).`; } catch {}
    for (const side of ['left','right']) $(side+'-hint').textContent = catalog?.tactics.find(t => t.id === $(side+'-tactic').value)?.description || '';
  }
  async function json(url, init = {}) {
    const response = await fetch(url, { ...init, signal: controller.signal });
    const data = await response.json();
    if (!response.ok) throw Error(data.error?.message || data.error || 'The exhibition service is unavailable. Try again.');
    return data;
  }
  function showResult(data, label, autoplay = false) {
    const match = data.match || data.result?.match;
    if (!match) throw Error('The replay record is incomplete.');
    replay.load(data, catalog, autoplay);
    $('arena-result').textContent = match.winner === 'draw' ? 'An evenly matched playground.' : `${catalog.gangs.find(g => g.id === match.input[match.winner].gang)?.name || match.winner} take the exhibition!`;
    $('arena-proof').textContent = `${label} · ${match.rulesVersion} · ${match.reason} · Survivors ${match.survivors.left}–${match.survivors.right} · Match hash: ${data.matchHash || data.result?.matchHash || 'not supplied'}`;
  }
  form.addEventListener('submit', async event => {
    event.preventDefault();
    try {
      const body = input(); $('arena-run').disabled = true;
      status('The server is running your exhibition…');
      const data = await json('/api/nouns-battler/arena', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!data.ok || !data.match) throw Error('The exhibition could not start. Try again.');
      showResult(data, 'Server-run practice result', true);
      status('Exhibition complete. This is your practice result; Rivalry Night’s published result stays the same.');
    } catch (error) { if (!controller.signal.aborted) status(String(error.message || error)); }
    finally { if (!controller.signal.aborted) $('arena-run').disabled = !catalog; }
  }, options);
  $('arena-random').addEventListener('click', () => { $('arena-seed').value = String(crypto.getRandomValues(new Uint32Array(1))[0]); example(); }, options);
  $('arena-quote').addEventListener('click', async () => {
    const button = $('arena-quote'); button.disabled = true;
    try {
      const response = await fetch('/api/agent/battler', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ match: input(), rulesVersion, maxSpendUnits: '10000' }), signal: controller.signal });
      const data = await response.json();
      $('arena-terms').hidden = false; $('arena-terms').textContent = `HTTP ${response.status} · No payment submitted\n${JSON.stringify(data, null, 2)}`;
    } catch (error) { if (!controller.signal.aborted) status(`Could not retrieve terms: ${error.message}`); }
    finally { if (!controller.signal.aborted) button.disabled = false; }
  }, options);
  form.addEventListener('change', example, options);
  (async () => {
    try {
      const data = await json('/api/nouns-battler/arena');
      if (!data.ok || !data.catalog) throw Error('Catalog unavailable. Reload to try again.');
      catalog = data.catalog; rulesVersion = data.rulesVersion;
      const params = new URLSearchParams(location.search), setup = setupFromParams(params, catalog);
      for (const side of ['left','right']) {
        for (const kind of ['gang','tactic']) {
          const select = $(side+'-'+kind);
          select.replaceChildren(...catalog[kind === 'gang' ? 'gangs' : 'tactics'].map(item => { const option = document.createElement('option'); option.value = item.id; option.textContent = item.name; return option; }));
          select.disabled = false; select.value = setup[side][kind];
        }
      }
      $('arena-seed').value = String(setup.seed);
      $('arena-run').disabled = false; $('arena-quote').disabled = false;
      example(); status('Pick your tactics, then run your free exhibition.');
      const actionId = params.get('record');
      if (actionId) {
        if (!/^pai_[a-zA-Z0-9_-]+$/.test(actionId)) throw Error('That record link is not valid.');
        status('Opening commissioned record…');
        const action = await json('/api/actions/'+encodeURIComponent(actionId));
        const result = action.result || action.action?.result;
        if (action.status !== 'succeeded' || !result?.match) { status('This commissioned record is not complete yet. Reload this link later to check its status.'); return; }
        showResult({ ...action, result }, `Commissioned server-run record · ${actionId}`);
        status('Commissioned record loaded. Press Play replay to watch.');
      }
    } catch (error) { if (!controller.signal.aborted) status(error.message); }
  })();
}
initArena();
document.addEventListener('astro:page-load', initArena);
document.addEventListener('astro:before-swap', () => { cleanup?.(); cleanup = undefined; });
