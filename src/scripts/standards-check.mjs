/**
 * /standards/check — paste or upload a passport, score it in the browser.
 * Devnet reads are public GET /feed and GET /block/{height}. No secrets.
 */
import {
  attestationPresent,
  canonicalPassport,
  checkKeySigned,
  classifyPassportLine,
  parsePassportLines,
  scorePassport,
  sha256Hex,
  validatePassport,
} from '../lib/passport-check.mjs';

const DEVNET = 'https://pointcast-devnet.mhoydich.workers.dev';
const EXAMPLE = '/standards/agent-identity/examples/grok.json';

const $ = (id) => document.getElementById(id);

function digits(id, word, on) {
  const el = $(id);
  if (!el) return;
  el.replaceChildren();
  el.setAttribute('aria-label', word);
  for (const ch of word) {
    const span = document.createElement('span');
    span.className = on ? 'digit is-on' : 'digit is-off';
    span.textContent = ch;
    el.append(span);
  }
}

function setText(id, text) {
  const el = $(id);
  if (el) el.textContent = text;
}

async function readFeed() {
  const records = [];
  let before = '';
  for (let page = 0; page < 6; page += 1) {
    const url = new URL(`${DEVNET}/feed`);
    url.searchParams.set('limit', '50');
    url.searchParams.set('channel', 'BOT');
    if (before) url.searchParams.set('before', before);
    const response = await fetch(url);
    if (!response.ok) throw new Error(`devnet feed ${response.status}`);
    const data = await response.json();
    for (const block of data.blocks || []) {
      for (const tx of block.txs || []) {
        const body = tx?.payload?.body || '';
        if (!String(body).includes('passport:')) continue;
        records.push({
          height: block.height,
          tx: tx.hash,
          label: tx.label || '',
          body,
        });
      }
    }
    if (!data.next_before || data.next_before <= 1) break;
    before = String(data.next_before);
  }
  return records;
}

async function readHeight(height) {
  const response = await fetch(`${DEVNET}/block/${height}`);
  if (!response.ok) throw new Error(`devnet block ${height} returned ${response.status}`);
  const block = await response.json();
  const found = [];
  for (const tx of block.txs || []) {
    const body = tx?.payload?.body || '';
    if (!String(body).includes('passport:')) continue;
    found.push({ height: block.height, tx: tx.hash, label: tx.label || '', body });
  }
  return found;
}

function paint(score, detail) {
  const on = score.levels;
  digits('lamp-l0', on['self-declared'] ? 'YES' : 'NO', on['self-declared']);
  digits('lamp-l1', on['key-signed'] ? 'YES' : 'NO', on['key-signed']);
  digits('lamp-l2', on['operator-vouched'] ? 'YES' : 'NO', on['operator-vouched']);
  digits('lamp-l3', on['registered-onchain'] ? 'YES' : 'NO', on['registered-onchain']);
  setText('reached', score.valid ? score.reached : 'none');
  setText('claimed', score.claimed || '—');
  setText('detail', detail);
}

async function runCheck(raw) {
  const errorsEl = $('errors');
  errorsEl.replaceChildren();
  let doc;
  try {
    doc = JSON.parse(raw);
  } catch (error) {
    const item = document.createElement('li');
    item.textContent = error instanceof Error ? error.message : 'That is not JSON.';
    errorsEl.append(item);
    paint(scorePassport({}, ['bad json'], { ok: false }, { present: false }, []), 'Fix the JSON and check again.');
    return;
  }

  const errors = validatePassport(doc);
  for (const error of errors) {
    const item = document.createElement('li');
    item.textContent = error;
    errorsEl.append(item);
  }

  const canonical = canonicalPassport(doc);
  const hash = canonical ? await sha256Hex(canonical) : '';
  setText('hash', hash || '—');

  const keySigned = errors.length ? { ok: false, reason: 'Schema first. The signature was not checked.' } : await checkKeySigned(doc);
  const attestation = attestationPresent(doc);
  setText('key-note', keySigned.reason);
  setText('attest-note', attestation.present
    ? `Attestation field present at ${attestation.where}. This page does not ask Ethereum or EAS if it is real.`
    : 'No attestation field and no ethereum.easUID.');

  let live = [];
  let liveNote = '';
  try {
    const bag = await readFeed();
    const hinted = Number(doc?.devnet?.height);
    if (Number.isInteger(hinted) && hinted > 0) {
      const extra = await readHeight(hinted);
      for (const row of extra) {
        if (!bag.some((item) => item.tx === row.tx)) bag.push(row);
      }
    }
    live = bag.flatMap((row) => parsePassportLines(row.body).map((fields) => {
      const classified = classifyPassportLine(doc, fields, hash);
      return { ...classified, height: row.height, tx: row.tx, label: row.label, fields };
    })).filter((row) => row.nameOk);
    if (!live.length) liveNote = 'No passport: v=0.1 line with this name was in the public BOT feed just now.';
  } catch (error) {
    liveNote = error instanceof Error ? error.message : 'The devnet did not answer.';
  }

  const score = scorePassport(doc, errors, keySigned, attestation, live);
  const hits = live.filter((row) => row.cited);
  const hitText = hits.length
    ? hits.map((row) => `height ${row.height}, tx ${row.tx}, label “${row.label || 'unlabeled'}”${row.hashMatches ? ', hash matches' : ', no matching hash'}`).join('; ')
    : liveNote;
  const detail = [
    score.valid ? 'Schema accepts this document, so self-declared is on.' : 'Schema rejected the document, so every lamp stays off.',
    hitText,
    'registered-onchain lights only when a devnet line names this passport and its hash equals the canonical SHA-256. A keyless name is still a claim.',
  ].filter(Boolean).join(' ');
  paint(score, detail);
}

function boot() {
  const form = $('check-form');
  const file = $('passport-file');
  const load = $('load-example');
  const submit = $('check-submit');
  if (!form) return;

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const raw = String(new FormData(form).get('passport') || '');
    runCheck(raw);
  });

  // Native submission stays disabled until local handling is attached.
  if (submit) submit.disabled = false;

  file?.addEventListener('change', async () => {
    const picked = file.files?.[0];
    if (!picked) return;
    const text = await picked.text();
    const box = form.querySelector('textarea');
    if (box) box.value = text;
    runCheck(text);
  });

  load?.addEventListener('click', async () => {
    setText('detail', 'Loading the grok example…');
    const response = await fetch(EXAMPLE);
    const text = await response.text();
    const box = form.querySelector('textarea');
    if (box) box.value = text;
    runCheck(text);
  });
}

boot();
