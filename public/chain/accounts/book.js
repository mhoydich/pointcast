import { makeNet, pcc } from '../apps/chain-kit.js';
import { MAX_ACCOUNTS, MAX_FILE_BYTES, STORAGE_KEY, publicAddress, localLabel, bookDocument, parseBook, mergeBook, loadBook, saveBook, createReader } from './model.mjs';

export function mountAccountBook(root, env = {}) {
  const doc = root.ownerDocument;
  const win = doc.defaultView;
  const find = (key) => root.querySelector(`[data-${key}]`);
  const identity = { chainId: root.dataset.chainId, genesis: root.dataset.genesis };
  let storage;
  try { storage = env.storage ?? win.localStorage; } catch { storage = null; }
  const loaded = loadBook(storage, identity);
  let accounts = loaded.accounts;
  let blocked = Boolean(loaded.error);
  let persistent = !loaded.unavailable;
  let view = { state: 'loading', rows: [] };
  let importGeneration = 0;
  const drafts = new Map();
  const list = find('list');
  const notice = (message) => { find('message').textContent = message; };
  const el = (tag, text, className) => {
    const node = doc.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (className) node.className = className;
    return node;
  };
  const button = (text, action, className = 'quiet') => {
    const node = el('button', text, className); node.type = 'button'; node.addEventListener('click', action); return node;
  };
  function storageState() {
    find('storage').textContent = blocked ? `Your saved book could not be loaded: ${loaded.error} The saved data has been left untouched. Clear this local save to start again.` : persistent ? 'Addresses and labels are saved only in this browser. Clearing browser data removes them; export a copy to keep them.' : 'Browser storage is unavailable or full. Changes last only for this visit; export your book before leaving.';
    find('reset-storage').hidden = !blocked;
    for (const control of find('add-form').elements) control.disabled = blocked;
    find('import').disabled = blocked;
    find('export').disabled = blocked || accounts.length === 0;
    find('storage').dataset.warning = String(blocked || !persistent);
  }
  function commit(next, message) {
    if (blocked) return;
    accounts = next;
    persistent = saveBook(storage, accounts, identity);
    storageState(); notice(message); render(); reader.refresh(accounts);
  }
  async function copy(address) {
    try { await (env.clipboard ?? win.navigator.clipboard).writeText(address); notice('Public address copied.'); }
    catch { notice('Copy is unavailable here. Select the full public address on the card and copy it.'); }
  }
  function render() {
    const active = doc.activeElement;
    const focused = active?.dataset?.labelAddress;
    const selection = focused ? [active.selectionStart, active.selectionEnd] : null;
    find('count').textContent = `${accounts.length} / ${MAX_ACCOUNTS} saved`;
    find('refresh').disabled = view.state === 'loading' || view.state === 'paused';
    find('list').setAttribute('aria-busy', String(view.state === 'loading'));
    find('network-state').textContent = view.state === 'ready' ? 'Identity matched' : view.state === 'paused' ? 'Reads paused' : view.state === 'loading' ? 'Checking identity…' : 'Unavailable';
    find('status').textContent = view.state === 'ready' ? `Checked ${new Date(view.checkedAt).toLocaleString()} · reads between blocks ${view.fromHeight.toLocaleString('en-US')} and ${view.toHeight.toLocaleString('en-US')}. Refresh to check again.` : view.state === 'loading' ? 'Checking chain identity and reading saved addresses…' : view.message;
    find('reload').hidden = view.state !== 'paused';
    list.replaceChildren();
    if (!accounts.length) {
      const empty = el('div', undefined, 'book-empty');
      empty.append(el('span', '◎', 'empty-mark'), el('h3', 'A place for the addresses you follow'), el('p', 'Add a public address below. Give it a label you will recognize, then check its play balance here.'));
      list.append(empty);
    }
    for (const entry of accounts) {
      const result = view.rows.find((row) => row.address === entry.address);
      const card = el('article', undefined, 'account-card');
      const head = el('div', undefined, 'card-head');
      head.append(el('span', ({ tz1: 'tz1 account', tz2: 'tz2 account', agent: 'Agent account', passkey: 'Passkey account' })[pcc.addressKind(entry.address)], 'account-kind'), el('span', 'WATCH ONLY', 'watch-tag'));
      const heading = el('h3', entry.label || 'Unlabeled account');
      const address = el('code', entry.address, 'public-address');
      const balance = el('p', undefined, 'balance');
      if (result?.state === 'ready' && result.exists) balance.append(el('strong', result.balance.toLocaleString('en-US')), el('span', 'play ATTN'));
      else balance.append(el('strong', '—'), el('span', 'play ATTN'));
      const state = el('p', view.state === 'loading' ? 'Reading…' : result?.state === 'ready' ? result.exists ? `Account exists · next nonce ${result.nextNonce.toLocaleString('en-US')}` : 'No account exists at this address on this devnet.' : result?.state === 'error' ? 'Account reply unavailable or unexpected. Refresh to try again.' : 'Balance unavailable.', 'account-state');
      const form = el('form', undefined, 'label-form');
      const label = el('label', 'Local label');
      const input = el('input'); input.type = 'text'; input.maxLength = 64; input.value = drafts.get(entry.address) ?? entry.label; input.placeholder = 'Name this address';
      input.dataset.labelAddress = entry.address;
      input.addEventListener('input', () => drafts.set(entry.address, input.value));
      input.setAttribute('aria-label', `Local label for ${entry.address}`); label.append(input);
      const save = el('button', 'Save label', 'quiet'); save.type = 'submit'; form.append(label, save);
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        try { const label = localLabel(input.value); drafts.delete(entry.address); commit(accounts.map((item) => item.address === entry.address ? { ...item, label } : item), 'Local label saved.'); }
        catch (error) { notice(error.message); input.focus(); }
      });
      const actions = el('div', undefined, 'card-actions');
      const remove = button('Remove', () => { drafts.delete(entry.address); commit(accounts.filter((item) => item.address !== entry.address), 'Address removed from this book.'); find('address').focus(); }, 'remove');
      remove.setAttribute('aria-label', `Remove ${entry.label || entry.address} from this book`);
      actions.append(button('Copy address', () => copy(entry.address)), remove);
      card.append(head, heading, address, balance, state, form, actions); list.append(card);
    }
    if (focused) {
      const replacement = list.querySelector(`input[data-label-address="${focused}"]`);
      if (replacement) { replacement.focus(); replacement.setSelectionRange(...selection); }
    }
  }
  const net = env.net ?? makeNet(root.dataset.api, { timeoutMs: 6000 });
  const reader = createReader(net, identity, (next) => { view = next; render(); }, env);
  find('add-form').addEventListener('submit', (event) => {
    event.preventDefault(); if (blocked) return;
    try {
      const address = publicAddress(find('address').value);
      const label = localLabel(find('label').value);
      if (accounts.some((entry) => entry.address === address)) throw new Error('That address is already in your book. Edit its label on the saved card.');
      if (accounts.length >= MAX_ACCOUNTS) throw new Error(`Your book is full (${MAX_ACCOUNTS} addresses). Remove one before adding another.`);
      commit([...accounts, { address, label }], 'Public address saved. Watching does not prove ownership.');
      find('add-form').reset(); find('address').focus();
    } catch (error) { notice(error.message); }
  });
  find('refresh').addEventListener('click', () => reader.refresh(accounts));
  find('reload').addEventListener('click', () => win.location.reload());
  find('reset-storage').addEventListener('click', () => {
    try { storage.removeItem(STORAGE_KEY); blocked = false; accounts = []; storageState(); notice('Unreadable local save cleared. You can add public addresses again.'); reader.refresh(accounts); }
    catch { notice('Browser storage could not be cleared. Change this site’s storage settings and reload.'); }
  });
  find('export').addEventListener('click', () => {
    if (blocked || !accounts.length) return;
    const blob = new win.Blob([JSON.stringify(bookDocument(accounts, identity), null, 2) + '\n'], { type: 'application/json' });
    const url = win.URL.createObjectURL(blob);
    const link = el('a'); link.href = url; link.download = 'pointcast-public-account-book.json'; doc.body.append(link); link.click(); link.remove();
    win.setTimeout(() => win.URL.revokeObjectURL(url), 1000);
    notice('Exported public addresses and local labels. Treat labels as information you may want to keep private.');
  });
  find('import').addEventListener('change', async () => {
    const ticket = ++importGeneration;
    const file = find('import').files?.[0]; if (!file || blocked) return;
    try {
      if (file.size > MAX_FILE_BYTES) throw new Error('This file is too large. Choose an Account Book JSON file under 24 KiB.');
      const text = await file.text(); if (ticket !== importGeneration || blocked) return;
      const incoming = parseBook(text, identity);
      const merged = mergeBook(accounts, incoming);
      commit(merged.accounts, `Imported ${merged.added} new address${merged.added === 1 ? '' : 'es'}; skipped ${merged.skipped} already saved. Existing labels were kept.`);
    } catch (error) { if (ticket === importGeneration) notice(error.message); }
    finally { if (ticket === importGeneration) find('import').value = ''; }
  });
  win.addEventListener('storage', (event) => {
    if (event.key !== STORAGE_KEY && event.key !== null) return;
    // Another tab may have changed or deleted this book; stop stale requests
    // and reload the saved list before allowing another local write.
    reader.invalidate(); importGeneration++;
    win.location.reload();
  });
  storageState(); render(); reader.refresh(accounts);
  return { reader, getAccounts: () => accounts.map((entry) => ({ ...entry })) };
}

const root = globalThis.document?.querySelector('[data-account-book]');
if (root) mountAccountBook(root);
