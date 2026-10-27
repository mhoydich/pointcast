import { makeNet, pinnedStatus, cleanText, isWhole, isObj } from './chain-kit.js';

// All chain text is hostile; render with textContent only. Pin every read to the
// network the page was built for. This page never loads or handles signing keys.
const root = document.querySelector('[data-mist]');
if (root) {
  const find = (key) => root.querySelector(`[data-${key}]`);
  const net = makeNet(root.dataset.api);
  const status = find('status');
  const network = find('network');
  const activity = find('activity');
  const accountResult = find('account-result');
  const refreshButton = find('refresh');
  const fields = ['chain', 'height', 'accounts', 'mempool'];
  let online = false;
  let generation = 0;
  let accountGeneration = 0;
  const text = (key, value) => { find(key).textContent = value; };
  const number = (v) => isWhole(v) ? v.toLocaleString('en-US') : '—';
  const reset = () => { for (const key of fields) text(key, '—'); };
  const errorText = (err) => (err?.name === 'GenesisChanged' || err?.name === 'ChainChanged') ? 'The network identity changed. Reads are paused; check the chain page for a reset notice.' : 'The devnet could not be read. Try refreshing in a moment.';
  async function check() {
    const result = await pinnedStatus(net, root.dataset.genesis);
    if (result.chainId !== root.dataset.chainId) { const error = new Error('Unexpected chain ID'); error.name = 'ChainChanged'; throw error; }
    return result;
  }
  function drawFeed(feed) {
    activity.replaceChildren();
    if (!isObj(feed) || !Array.isArray(feed.blocks)) throw new Error('Invalid feed');
    let count = 0;
    for (const block of feed.blocks.slice(0, 12)) {
      if (!isObj(block) || !isWhole(block.height) || !Array.isArray(block.txs)) continue;
      for (const tx of block.txs.slice(0, 20)) {
        if (!isObj(tx) || count >= 20) continue;
        const row = document.createElement('div'); row.className = 'activity-row';
        const height = document.createElement('b'); height.textContent = `#${number(block.height)}`;
        const details = document.createElement('div');
        const title = document.createElement('span'); title.textContent = cleanText(tx.payload?.title, 140) || cleanText(tx.kind, 80) || 'Transaction';
        const meta = document.createElement('small'); meta.textContent = `Type: ${cleanText(tx.kind, 60) || 'unknown'} · From: ${cleanText(tx.sender, 80) || 'unknown'}`;
        details.append(title, meta); row.append(height, details); activity.append(row); count++;
      }
    }
    if (!count) { const empty = document.createElement('p'); empty.textContent = 'No recent transactions in this feed.'; activity.append(empty); }
  }
  async function refresh() {
    const request = ++generation; ++accountGeneration;
    online = false; reset(); accountResult.textContent = 'No account selected.';
    status.textContent = 'Checking network identity…'; network.textContent = 'Connecting…'; refreshButton.disabled = true;
    try {
      const st = await check();
      const feed = await net.get('/feed?limit=10');
      // Check again: a reset during the feed read must not display old numbers.
      await check();
      if (request !== generation) return;
      drawFeed(feed); text('chain', st.chainId); text('height', number(st.height)); text('accounts', number(st.accounts)); text('mempool', number(st.mempool));
      online = true; network.textContent = 'Identity matched'; status.textContent = `Network identity matched · checked ${new Date().toLocaleTimeString()}.`;
    } catch (err) {
      if (request !== generation) return;
      online = false; reset(); activity.replaceChildren(); const p = document.createElement('p'); p.textContent = 'Activity unavailable.'; activity.append(p);
      network.textContent = 'Unavailable'; status.textContent = errorText(err);
    } finally { if (request === generation) refreshButton.disabled = false; }
  }
  refreshButton.addEventListener('click', refresh);
  find('account-form').addEventListener('submit', async (event) => {
    event.preventDefault(); const accountRequest = ++accountGeneration; const address = find('address').value.trim();
    if (!/^(?:tz[1-4]|pca)[1-9A-HJ-NP-Za-km-z]{20,60}$/.test(address)) { accountResult.textContent = 'Enter a valid-looking public devnet address (tz1–tz4 or pca).'; return; }
    if (!online) { accountResult.textContent = 'Check the network before looking up an account.'; return; }
    const request = generation;
    accountResult.textContent = 'Reading account…';
    try {
      await check(); const account = await net.get(`/account/${encodeURIComponent(address)}`); await check();
      if (request !== generation || accountRequest !== accountGeneration) return;
      if (!isObj(account) || account.address !== address || typeof account.exists !== 'boolean' || !isWhole(account.balance) || !isWhole(account.next_nonce)) throw new Error('Invalid account');
      accountResult.textContent = account.exists ? `${address} · ${number(account.balance)} play ATTN · next nonce ${number(account.next_nonce)}` : 'No account exists at that address on this devnet.';
    } catch (err) {
      if (request !== generation || accountRequest !== accountGeneration) return;
      if (err?.name === 'GenesisChanged' || err?.name === 'ChainChanged') {
        online = false; reset(); network.textContent = 'Unavailable'; status.textContent = errorText(err);
        activity.replaceChildren(); const p = document.createElement('p'); p.textContent = 'Activity unavailable.'; activity.append(p);
      }
      accountResult.textContent = errorText(err);
    }
  });
  refresh();
}
