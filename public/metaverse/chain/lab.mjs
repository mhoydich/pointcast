import {createLab, appendVisit, verifyLedger} from './protocol.mjs';

const el = id => document.getElementById(id);
const buildings = window.LoomBuildings;
const plateIds = buildings.map(plate => plate.id);
let lab;
for (const plate of buildings) el('plate').append(new Option(plate.name, plate.id));

function showBlocks() {
  const {blocks} = lab.ledger;
  el('height').textContent = String(blocks.length);
  const list = el('blocks');
  list.replaceChildren();
  list.start = blocks.length;
  for (const block of blocks.slice(-8).reverse()) {
    const entry = document.createElement('li');
    const name = buildings.find(plate => plate.id === block.plate).name;
    const voters = block.votes.map(vote => String.fromCharCode(65 + vote.validator)).join(' + ');
    entry.textContent = name + ' · ' + voters;
    list.append(entry);
  }
}

async function verify(ledger, pin = '') {
  const result = await verifyLedger(ledger, plateIds, pin);
  el('verify-status').textContent = 'Verified ' + result.count + ' blocks. Genesis ' + result.genesis + '.';
}

el('proposal').addEventListener('submit', async event => {
  event.preventDefault();
  if (!lab || el('append').disabled) return;
  el('append').disabled = true;
  const approvals = [...event.currentTarget.querySelectorAll('input[type=checkbox]:checked')].map(input => Number(input.value));
  try {
    const block = await appendVisit(lab, el('plate').value, approvals, plateIds);
    el('append-status').textContent = 'Block ' + block.height + ' accepted with ' + block.votes.length + ' signatures.';
    el('verify-status').textContent = '';
    showBlocks();
  } catch (error) { el('append-status').textContent = error.message; }
  finally { el('append').disabled = false; }
});
el('verify').onclick = async () => {
  try { await verify(structuredClone(lab.ledger), lab.ledger.genesis); }
  catch (error) { el('verify-status').textContent = error.message; }
};
el('file').onchange = () => { el('inspect').disabled = !el('file').files.length; };
el('inspect').onclick = async () => {
  const file = el('file').files[0];
  try {
    if (!file || file.size > 1048576) throw new Error('Choose a file of 1 MiB or less.');
    await verify(JSON.parse(await file.text()), el('pin').value.trim().toLowerCase());
  } catch (error) { el('verify-status').textContent = 'Verification failed. ' + error.message; }
};
el('export').onclick = () => {
  const url = URL.createObjectURL(new Blob([JSON.stringify(lab.ledger, null, 2)], {type: 'application/json'}));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'pointcast-district-' + lab.ledger.genesis.slice(0, 12) + '.json';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
};
try {
  lab = await createLab();
  el('genesis').textContent = lab.ledger.genesis;
  el('append-status').textContent = 'Genesis ready. Select the validators for the first visit.';
  for (const id of ['append', 'verify', 'export']) el(id).disabled = false;
} catch {
  el('append-status').textContent = 'This browser could not initialize Web Crypto. Open the lab over HTTPS in a current browser.';
  el('genesis').textContent = 'Unavailable';
}
