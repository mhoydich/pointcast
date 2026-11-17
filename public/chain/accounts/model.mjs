import { pcc, cleanText, isObj, isWhole, pinnedStatus } from '../apps/chain-kit.js';

export const MAX_ACCOUNTS = 24;
export const MAX_FILE_BYTES = 24576;
export const STORAGE_KEY = 'pointcast.account-book.v1';
export const CONCURRENCY = 4;
const FORMAT = 'pointcast-account-book';
const exactKeys = (value, keys) => isObj(value) && Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key));

export function publicAddress(value) {
  if (typeof value !== 'string' || value.length > 80) throw new Error('Enter a public PointCast address: tz1, tz2, pca1 or pcp1.');
  const address = value.trim();
  if (!pcc.isAddress(address)) throw new Error('That public address did not pass its checksum. Use a tz1, tz2, pca1 or pcp1 address.');
  return address;
}

export function localLabel(value) {
  if (typeof value !== 'string' || Array.from(value).length > 64) throw new Error('Labels can contain up to 64 characters.');
  return cleanText(value, 64);
}

export function bookDocument(accounts, identity) {
  return { format: FORMAT, version: 1, chainId: identity.chainId, genesis: identity.genesis, accounts: accounts.map(({ address, label }) => ({ address, label })) };
}

/** Strict public-only schema, shared by imports and local storage. No keys or cached balances. */
export function parseBook(text, identity) {
  if (typeof text !== 'string' || new TextEncoder().encode(text).length > MAX_FILE_BYTES) throw new Error('This file is too large. Choose an Account Book JSON file under 24 KiB.');
  let doc;
  try { doc = JSON.parse(text); } catch { throw new Error('This is not readable JSON. Choose an Account Book export.'); }
  if (!exactKeys(doc, ['format', 'version', 'chainId', 'genesis', 'accounts']) || doc.format !== FORMAT || doc.version !== 1) throw new Error('Unsupported Account Book format. Only version 1 public-address exports are accepted; never select a key backup.');
  if (doc.chainId !== identity.chainId || doc.genesis !== identity.genesis) throw new Error('This book belongs to a different chain or genesis. It was not imported. Check the chain page for reset information.');
  if (!Array.isArray(doc.accounts) || doc.accounts.length > MAX_ACCOUNTS) throw new Error(`A book can contain at most ${MAX_ACCOUNTS} addresses.`);
  const seen = new Set();
  return doc.accounts.map((entry) => {
    if (!exactKeys(entry, ['address', 'label'])) throw new Error('Each entry must contain only a public address and label. Key backups are not accepted.');
    const address = publicAddress(entry.address);
    if (seen.has(address)) throw new Error('This file contains duplicate addresses. No entries were imported.');
    seen.add(address);
    return { address, label: localLabel(entry.label) };
  });
}

export function mergeBook(current, incoming) {
  const seen = new Set(current.map((entry) => entry.address));
  const added = incoming.filter((entry) => !seen.has(entry.address));
  if (current.length + added.length > MAX_ACCOUNTS) throw new Error(`Import would exceed ${MAX_ACCOUNTS} addresses. Remove some saved addresses first.`);
  return { accounts: [...current, ...added], added: added.length, skipped: incoming.length - added.length };
}

export function loadBook(storage, identity) {
  let text;
  try { text = storage.getItem(STORAGE_KEY); } catch { return { accounts: [], unavailable: true, error: '' }; }
  if (text === null) return { accounts: [], unavailable: false, error: '' };
  try { return { accounts: parseBook(text, identity), unavailable: false, error: '' }; }
  catch (error) { return { accounts: [], unavailable: false, error: error.message }; }
}

export function saveBook(storage, accounts, identity) {
  try { storage.setItem(STORAGE_KEY, JSON.stringify(bookDocument(accounts, identity))); return true; } catch { return false; }
}

export function accountView(value, address) {
  if (!isObj(value) || value.address !== address || typeof value.exists !== 'boolean' || !isWhole(value.balance) || !isWhole(value.next_nonce)) throw new Error('Unexpected account reply; balance unavailable.');
  if (!value.exists && (value.balance !== 0 || value.next_nonce !== 0)) throw new Error('Inconsistent account reply; balance unavailable.');
  return { exists: value.exists, balance: value.balance, nextNonce: value.next_nonce };
}

export async function checkIdentity(net, identity) {
  // readStatus cleans display text. Compare the raw chain ID too, so a reply
  // with hidden characters or surrounding spaces cannot normalize to our pin.
  let rawChainId;
  const status = await pinnedStatus({ get: async (path) => { const value = await net.get(path); rawChainId = value?.chain_id; return value; } }, identity.genesis);
  if (rawChainId !== identity.chainId) throw Object.assign(new Error('CHAIN ID CHANGED'), { name: 'ChainChanged' });
  return status;
}

export const isIdentityError = (error) => error?.name === 'GenesisChanged' || error?.name === 'ChainChanged';

/** One active batch, at most four account reads in flight, one coalesced successor.
 * Invalidating is synchronous; a superseded batch never publishes any result.
 * Each request is time/size bounded by makeNet. Identity failure is latched
 * until reload, and erases every balance rather than retaining a stale total.
 */
export function createReader(net, identity, onState, { now = () => Date.now() } = {}) {
  let generation = 0;
  let queued = null;
  let running = null;
  let paused = false;
  const current = (ticket) => ticket === generation;
  async function batch(entries, ticket) {
    try {
      const before = await checkIdentity(net, identity);
      if (!current(ticket)) return;
      let cursor = 0;
      const rows = new Array(entries.length);
      await Promise.all(Array.from({ length: Math.min(CONCURRENCY, entries.length) }, async () => {
        while (current(ticket) && cursor < entries.length) {
          const index = cursor++;
          const { address } = entries[index];
          try {
            const payload = await net.get(`/account/${encodeURIComponent(address)}`);
            rows[index] = { address, state: 'ready', ...accountView(payload, address) };
          } catch { rows[index] = { address, state: 'error' }; }
        }
      }));
      if (!current(ticket)) return;
      const after = await checkIdentity(net, identity);
      if (after.height < before.height) throw new Error('The devnet height moved backwards. Refresh later.');
      if (!current(ticket)) return;
      onState({ state: 'ready', rows, checkedAt: now(), fromHeight: before.height, toHeight: after.height });
    } catch (error) {
      // Identity mismatch always invalidates the current view, even when the
      // request that discovered it was superseded while /status was in flight.
      if (isIdentityError(error)) {
        paused = true; queued = null; generation++;
        onState({ state: 'paused', rows: [], message: 'Network identity changed. Balances are hidden and live reads are paused. Check the chain page for a reset notice, then reload this page.' });
      } else if (current(ticket)) onState({ state: 'error', rows: [], message: 'The devnet could not be read safely. Balances are hidden. Try refreshing in a moment.' });
    }
  }
  async function drain() {
    while (queued && !paused) {
      const next = queued; queued = null;
      await batch(next.entries, next.ticket);
    }
  }
  return {
    refresh(entries) {
      if (paused) return Promise.resolve();
      const ticket = ++generation;
      queued = { entries: entries.map((entry) => ({ ...entry })), ticket };
      onState({ state: 'loading', rows: [] });
      if (!running) running = drain().finally(() => { running = null; });
      return running;
    },
    invalidate() { generation++; queued = null; },
  };
}
