import { makeNet, pinnedStatus, cleanText } from '../apps/chain-kit.js';
import { receiptView } from './model.mjs';

const root = document.querySelector('[data-receipt-desk]');
const form = root.querySelector('[data-form]');
const input = root.querySelector('#hash');
const status = root.querySelector('[data-status]');
const output = root.querySelector('[data-result]');
const button = root.querySelector('[data-submit]');
const net = makeNet(root.dataset.api);
let run = 0;
const node = (tag, value) => { const n = document.createElement(tag); n.textContent = value; return n; };
function render(view, hash, network) {
  const section = document.createElement('section'); section.className = 'result'; section.setAttribute('aria-label', 'Transaction result');
  section.append(node('h2', view.title), node('p', view.detail));
  const dl = document.createElement('dl');
  function row(label, value) { if (value === undefined || value === null || value === '') return; const dt = node('dt', label); const dd = node('dd', String(value)); dl.append(dt, dd); }
  row('Transaction', hash); row('Network', network.chainId); row('Observed tip', network.height);
  if (view.state === 'included') { row('Block height', view.height); row('Blocks since inclusion', view.since); row('Kind', cleanText(view.kind, 100)); row('Sender', cleanText(view.sender, 100)); }
  if (view.state === 'rejected') row('Reported reason', cleanText(view.reason, 240));
  section.append(dl);
  const a = node('a', 'Link to this lookup'); const u = new URL(location.href); u.search = ''; u.hash = ''; u.searchParams.set('hash', hash); a.href = u.href; section.append(a); output.replaceChildren(section);
}
async function lookup() {
  const id = ++run; const hash = input.value.trim().toLowerCase();
  output.replaceChildren(); status.textContent = ''; input.setCustomValidity('');
  if (!/^[a-f0-9]{64}$/.test(hash)) { button.disabled = false; input.setCustomValidity('Enter a 64-character hexadecimal transaction hash.'); input.reportValidity(); return; }
  input.value = hash; button.disabled = true; status.textContent = 'Checking the devnet…';
  try {
    await pinnedStatus(net, root.dataset.genesis);
    const tx = await net.get('/tx/' + hash);
    // Check again so an intervening reset cannot silently mix networks.
    const chain = await pinnedStatus(net, root.dataset.genesis);
    const view = receiptView(hash, tx, chain.height);
    if (id !== run) return;
    render(view, hash, chain); status.textContent = 'Checked now. Refresh the lookup for the latest node response.';
  } catch (err) {
    if (id !== run) return;
    status.textContent = err?.name === 'GenesisChanged' ? 'The devnet has reset or changed identity. This page cannot safely show this receipt until updated.' : `Could not check the transaction: ${cleanText(err?.message, 180) || 'the node did not respond.'}`;
  } finally { if (id === run) button.disabled = false; }
}
form.addEventListener('submit', (event) => { event.preventDefault(); lookup(); });
input.addEventListener('input', () => input.setCustomValidity(''));
const fromLink = new URL(location.href).searchParams.get('hash');
if (fromLink && /^[a-fA-F0-9]{64}$/.test(fromLink)) { input.value = fromLink; lookup(); }
