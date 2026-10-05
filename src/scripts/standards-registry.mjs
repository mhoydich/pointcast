/**
 * Append passport lines seen on the live devnet that are not in the snapshot.
 * Sightings stay self-declared. This script does not fetch remote passport URIs.
 */
import { parsePassportLines } from '../lib/passport-check.mjs';

const DEVNET = 'https://pointcast-devnet.mhoydich.workers.dev';

function knownNames() {
  return new Set([...document.querySelectorAll('[data-registry-name]')].map((el) => el.getAttribute('data-registry-name')));
}

async function scan() {
  const host = document.getElementById('live-rows');
  const note = document.getElementById('live-note');
  if (!host || !note) return;
  const seen = knownNames();
  const fresh = [];
  let before = '';
  try {
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
          for (const fields of parsePassportLines(tx?.payload?.body || '')) {
            if (fields.v !== '0.1' || !fields.name || seen.has(fields.name)) continue;
            seen.add(fields.name);
            fresh.push({ fields, height: block.height, tx: tx.hash, label: tx.label || '' });
          }
        }
      }
      if (!data.next_before || data.next_before <= 1) break;
      before = String(data.next_before);
    }
  } catch (error) {
    note.textContent = error instanceof Error ? error.message : 'The devnet did not answer.';
    return;
  }

  if (!fresh.length) {
    note.textContent = 'Live feed checked. No new passport: v=0.1 name beyond the snapshot.';
    return;
  }
  note.textContent = 'These names were on the public feed just now. They are not in the published snapshot. Still self-declared.';
  for (const row of fresh) {
    const article = document.createElement('article');
    article.className = 'seed';
    article.dataset.registryName = row.fields.name;
    const no = document.createElement('p');
    no.className = 'seed-no';
    no.textContent = 'LIVE';
    const level = document.createElement('p');
    level.className = 'post__tag';
    level.textContent = 'self-declared';
    const copy = document.createElement('div');
    const title = document.createElement('h3');
    title.textContent = row.fields.name;
    const report = document.createElement('p');
    report.className = 'report';
    report.textContent = `passport line at height ${row.height}, tx ${row.tx}. Label: ${row.label || 'unlabeled'}. Hash on the line: ${row.fields.hash || 'none'}. URI: ${row.fields.uri || 'none'}.`;
    copy.append(title, report);
    article.append(no, level, copy);
    host.append(article);
  }
}

scan();
