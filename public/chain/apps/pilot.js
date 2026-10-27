import { makeNet, pinnedStatus, isHex64, isWhole, isObj } from './chain-kit.js';
import { receiptView } from '../receipt/model.mjs';

// This page never sends a transaction, holds a key or stores visitor data.
export function mountPilot(root, net = makeNet(root.dataset.api)) {
  const get = (name) => root.querySelector(`[data-${name}]`);
  const find = get('find'), status = get('status'), example = get('example');
  let generation = 0;
  get('practice').addEventListener('click', () => {
    get('practice-result').textContent = 'PRACTICE ONLY · Status: simulated · Network: none · Transaction: none · Value: none. No transaction was sent. A real receipt would name a transaction and its reported block.';
  });
  get('copy').addEventListener('click', async () => {
    const hash = get('hash').textContent;
    const current = generation;
    if (!isHex64(hash)) return;
    try {
      await root.ownerDocument.defaultView.navigator.clipboard.writeText(hash);
      if (current === generation) status.textContent = 'Hash copied. Paste it into Receipt Desk.';
    } catch {
      if (current !== generation) return;
      status.textContent = 'Copy is unavailable. Select the hash above to copy it.';
      get('hash').focus();
    }
  });
  async function check() {
    const s = await pinnedStatus(net, root.dataset.genesis);
    if (s.chainId !== root.dataset.chainId) throw new Error('network identity changed');
    return s;
  }
  find.addEventListener('click', async () => {
    const current = ++generation;
    find.disabled = true; example.hidden = true; get('hash').textContent = ''; get('height').textContent = '';
    status.textContent = 'Checking the network and looking for an example…';
    try {
      await check();
      const feed = await net.get('/feed?limit=10');
      if (!isObj(feed) || !Array.isArray(feed.blocks)) throw new Error('unreadable feed');
      let chosen;
      for (const block of feed.blocks.slice(0, 10)) {
        if (!isObj(block) || !isWhole(block.height) || !Array.isArray(block.txs)) continue;
        const tx = block.txs.slice(0, 20).find((item) => isObj(item) && isHex64(item.hash));
        if (tx) { chosen = { hash: tx.hash, height: block.height }; break; }
      }
      if (!chosen) throw new Error('no recent example');
      const tx = await net.get('/tx/' + chosen.hash);
      const checked = await check();
      const view = receiptView(chosen.hash, tx, checked.height);
      if (view.state !== 'included' || view.height !== chosen.height) throw new Error('inconsistent example');
      if (current !== generation) return;
      get('hash').textContent = chosen.hash; get('height').textContent = String(chosen.height);
      status.textContent = 'Example read from the pinned devnet.'; example.hidden = false;
    } catch (error) {
      if (current !== generation) return;
      status.textContent = error?.name === 'GenesisChanged' || error?.message === 'network identity changed'
        ? 'The network identity changed. This page cannot safely show an example until updated.'
        : 'No example is available right now. Please try again later.';
    } finally { if (current === generation) find.disabled = false; }
  });
}
const root = globalThis.document?.querySelector('[data-pilot]');
if (root) mountPilot(root);
