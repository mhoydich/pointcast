import { makeNet, pinnedStatus, isHex64, isWhole, isObj } from './chain-kit.js';
import { receiptView } from '../receipt/model.mjs';

// The practice and example flows never send a transaction or hold a key.
export function mountPilot(root, net = makeNet(root.dataset.api)) {
  const get = (name) => root.querySelector(`[data-${name}]`);
  const find = get('find'), status = get('status'), example = get('example');
  let generation = 0;
  let practice = null;
  const examples = { agent: 'creative agent publishing', ues: 'UES lesson completion', local: 'neighborhood event' };
  get('practice').addEventListener('click', () => {
    const choice = get('scenario').value;
    const example = Object.hasOwn(examples, choice) ? examples[choice] : examples.agent;
    practice = {
      format: 'pointcast-local-practice-card', version: 1, example,
      evidence: { declaration: 'simulated example', signing: 'not performed', execution: 'not sent', chain: 'not checked', verification: 'not performed' },
      notice: 'Practice only. No transaction or publication was made; this is not a UES credential or proof of a real event.',
    };
    get('practice-result').textContent = `PRACTICE ONLY · Example: ${example} · Status: simulated · Network: none · Transaction: none · Value: none. No transaction was sent. A real receipt would name a transaction and its reported block.`;
    get('download').disabled = false;
    get('download-status').textContent = '';
  });
  get('download').addEventListener('click', () => {
    if (!practice) return;
    const win = root.ownerDocument.defaultView;
    let url, link;
    try {
      url = win.URL.createObjectURL(new Blob([JSON.stringify(practice, null, 2) + '\n'], { type: 'application/json' }));
      link = root.ownerDocument.createElement('a');
      link.href = url; link.download = 'pointcast-practice-card.json'; link.hidden = true;
      root.append(link); link.click();
      get('download-status').textContent = 'Your browser was asked to save the practice card. It is not a chain receipt.';
    } catch {
      get('download-status').textContent = 'The card could not be downloaded on this device.';
    } finally {
      link?.remove();
      if (url) win.setTimeout(() => win.URL.revokeObjectURL(url), 1000);
    }
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
    find.disabled = true; example.hidden = true;
    for (const field of ['hash', 'height', 'block-hash', 'network', 'genesis']) get(field).textContent = '';
    status.textContent = 'Checking the network and looking for an example…';
    try {
      await check();
      const feed = await net.get('/feed?limit=10');
      if (!isObj(feed) || !Array.isArray(feed.blocks)) throw new Error('unreadable feed');
      let chosen;
      for (const block of feed.blocks.slice(0, 10)) {
        if (!isObj(block) || !isWhole(block.height) || !isHex64(block.hash) || !Array.isArray(block.txs)) continue;
        const tx = block.txs.slice(0, 20).find((item) => isObj(item) && isHex64(item.hash));
        if (tx) { chosen = { hash: tx.hash, height: block.height, blockHash: block.hash }; break; }
      }
      if (!chosen) throw new Error('no recent example');
      const tx = await net.get('/tx/' + chosen.hash);
      const checked = await check();
      const view = receiptView(chosen.hash, tx, checked.height);
      if (view.state !== 'included' || view.height !== chosen.height) throw new Error('inconsistent example');
      if (current !== generation) return;
      get('hash').textContent = chosen.hash; get('height').textContent = String(chosen.height);
      get('block-hash').textContent = chosen.blockHash; get('network').textContent = checked.chainId; get('genesis').textContent = checked.genesis;
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
