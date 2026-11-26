import { createHash } from 'node:crypto';
import { isIP } from 'node:net';
import { Bonjour } from 'bonjour-service';
import { validAddress } from './store.js';

const LOOM = 'https://pointcast.xyz/api/loom';

async function getJson(url, signal, fetchJson = fetch) {
  const response = await fetchJson(url, {
    redirect: 'error',
    signal: AbortSignal.any([signal, AbortSignal.timeout(5000)]),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

export function startSync({ store, port, mdns, peers, bridge, interval, fetchJson, onError }) {
  const discovered = new Map();
  const cursors = new Map();
  const bridgeCursors = new Map();
  const stop = new AbortController();
  let bonjour;
  let browser;
  let active;

  if (mdns) {
    const name = `noun-${createHash('sha256').update(store.id).digest('hex').slice(0, 32)}`;
    bonjour = new Bonjour(undefined, onError);
    const service = bonjour.publish({ name, type: 'noun', protocol: 'tcp', port });
    service.on('error', onError);
    browser = bonjour.find({ type: 'noun', protocol: 'tcp' }, peer => {
      const ip = peer.referer?.address;
      if (peer.name === name || !isIP(ip) || !peer.port) return;
      discovered.set(peer.fqdn, `http://${isIP(ip) === 6 ? '[' + ip + ']' : ip}:${peer.port}`);
    });
    browser.on('down', peer => discovered.delete(peer.fqdn));
  }

  async function pull(peer) {
    const have = await getJson(new URL('/have', peer), stop.signal, fetchJson);
    if (!have || typeof have !== 'object' || Array.isArray(have)) throw new Error('Invalid have response');
    if (!cursors.has(peer)) cursors.set(peer, new Map());
    const cursor = cursors.get(peer);
    for (const [address, max] of Object.entries(have)) {
      if (!validAddress(address) || !Number.isSafeInteger(max) || max < 0) continue;
      let since = cursor.get(address) ?? 0;
      if (max < since) since = 0;
      cursor.set(address, since);
      if (max === since) continue;
      const url = new URL('/lines', peer);
      url.search = new URLSearchParams({ to: address, since });
      const lines = await getJson(url, stop.signal, fetchJson);
      if (!Array.isArray(lines)) throw new Error('Invalid lines response');
      for (const line of lines) {
        if (line?.address !== address || line.seq !== since + 1) throw new Error('Invalid peer sequence');
        store.ingest(line);
        cursor.set(address, ++since);
      }
    }
  }

  async function pullLoom(address) {
    const url = new URL(LOOM);
    url.search = new URLSearchParams({ to: address, since: bridgeCursors.get(address) ?? 0 });
    const data = await getJson(url, stop.signal, fetchJson);
    if (!data.ok || data.spec !== 'pointcast.loom/v1' ||
        !Array.isArray(data.ops) || !Number.isSafeInteger(data.seq)) {
      throw new Error('Invalid Loom response');
    }
    if (!data.exists) return;
    for (const op of data.ops) {
      if (op.op !== 'append') continue;
      const image = op.media?.url ?? null;
      if (!op.body?.trim() && !image) continue;
      const nonce = createHash('sha256').update(JSON.stringify([address, data.log.key, op.id]))
        .digest('base64url');
      store.originate({ address, sender: `Loom: ${op.from?.name ?? 'Unknown'}`, body: op.body ?? '', image },
        { time: op.at, nonce });
    }
    bridgeCursors.set(address, data.seq);
  }

  function tick() {
    if (active) return;
    const targets = new Set([...peers, ...discovered.values()]);
    for (const peer of cursors.keys()) {
      if (!targets.has(peer)) cursors.delete(peer);
    }
    active = Promise.allSettled([...Array.from(targets, pull), ...bridge.map(pullLoom)])
      .then(results => {
        for (const result of results) {
          if (result.status === 'rejected' && !stop.signal.aborted) onError(result.reason);
        }
      })
      .finally(() => { active = undefined; });
  }

  const timer = setInterval(tick, interval);
  timer.unref();
  tick();

  return async () => {
    clearInterval(timer);
    stop.abort();
    browser?.stop();
    if (bonjour) {
      await new Promise(resolve => bonjour.unpublishAll(resolve));
      await new Promise(resolve => bonjour.destroy(resolve));
    }
    await active;
  };
}
