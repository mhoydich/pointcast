/**
 * sparrow-digest · nostr.ts — v0.35 TypeScript Nostr relay client
 *
 * Port of /Users/michaelhoydich/sparrow-app/Sources/SparrowApp/NostrRelayClient.swift
 * to the Cloudflare Workers runtime. Zero npm deps; uses the native
 * WebSocket API Workers expose.
 *
 * Scope: read-only. Opens one REQ per relay, collects EVENT frames
 * until EOSE (or a timeout), closes. No signing, no publishing, no
 * persistent streaming. The cron worker is a batch aggregator — it
 * doesn't care about live updates.
 *
 * Trust posture: no event signature verification. Same as the web
 * client + the native Swift version. A malicious relay could inject
 * events with a forged `pubkey` field; downstream consumers MUST still
 * check `ev.pubkey` is in the author list they asked for before
 * including the event in their aggregation.
 */

export interface NostrEvent {
  id: string;
  pubkey: string;
  kind: number;
  created_at: number;
  tags: string[][];
  content: string;
  sig?: string;
}

export interface NostrFilter {
  kinds?: number[];
  authors?: string[];
  since?: number;
  until?: number;
  limit?: number;
  [key: `#${string}`]: string[] | undefined;
}

export interface CollectOptions {
  /** Max milliseconds to wait for EOSE before forcing close. Default 8000. */
  timeoutMs?: number;
  /** Per-relay budget for EVENT ingestion. Default 500. Prevents runaway. */
  maxEvents?: number;
}

interface RelayResult {
  url: string;
  events: NostrEvent[];
  eose: boolean;
  error?: string;
  elapsedMs: number;
}

/**
 * Open one REQ on a single relay, collect EVENT frames, resolve on
 * EOSE (or timeout). Always resolves — errors land in `result.error`
 * and produce an empty event list.
 */
export function collectFromRelay(
  relayUrl: string,
  filter: NostrFilter,
  opts: CollectOptions = {},
): Promise<RelayResult> {
  const timeoutMs = opts.timeoutMs ?? 8_000;
  const maxEvents = opts.maxEvents ?? 500;
  const subId = `sd-${Math.random().toString(36).slice(2, 12)}`;
  const started = Date.now();

  return new Promise((resolve) => {
    const events: NostrEvent[] = [];
    let settled = false;
    let ws: WebSocket;

    const finish = (eose: boolean, error?: string) => {
      if (settled) return;
      settled = true;
      try { ws.close(); } catch { /* already closed */ }
      resolve({ url: relayUrl, events, eose, error, elapsedMs: Date.now() - started });
    };

    try {
      ws = new WebSocket(relayUrl);
    } catch (err) {
      return resolve({ url: relayUrl, events: [], eose: false, error: `ws init: ${String(err)}`, elapsedMs: 0 });
    }

    const safetyTimer = setTimeout(() => finish(false, 'timeout'), timeoutMs);

    ws.addEventListener('open', () => {
      try {
        ws.send(JSON.stringify(['REQ', subId, filter]));
      } catch (err) {
        clearTimeout(safetyTimer);
        finish(false, `send: ${String(err)}`);
      }
    });

    ws.addEventListener('message', (msg: MessageEvent) => {
      if (settled) return;
      let frame: unknown;
      try { frame = JSON.parse(typeof msg.data === 'string' ? msg.data : ''); }
      catch { return; }
      if (!Array.isArray(frame) || frame.length < 2) return;

      const kind = frame[0];
      if (kind === 'EVENT' && frame[1] === subId && frame[2]) {
        const ev = frame[2] as NostrEvent;
        if (
          typeof ev?.id === 'string' &&
          typeof ev?.pubkey === 'string' &&
          typeof ev?.kind === 'number'
        ) {
          events.push(ev);
          if (events.length >= maxEvents) {
            clearTimeout(safetyTimer);
            try { ws.send(JSON.stringify(['CLOSE', subId])); } catch {}
            finish(true);
          }
        }
      } else if (kind === 'EOSE' && frame[1] === subId) {
        clearTimeout(safetyTimer);
        try { ws.send(JSON.stringify(['CLOSE', subId])); } catch {}
        finish(true);
      }
    });

    ws.addEventListener('error', () => {
      clearTimeout(safetyTimer);
      finish(false, 'ws error');
    });

    ws.addEventListener('close', () => {
      clearTimeout(safetyTimer);
      if (!settled) finish(false, 'closed');
    });
  });
}

/**
 * Fan one REQ out across multiple relays concurrently; merge results.
 * Deduplicates by event.id across relays. Events that never pass the
 * author filter are dropped defensively (relays may echo spam).
 */
export async function collectAcrossRelays(
  relays: string[],
  filter: NostrFilter,
  opts: CollectOptions = {},
): Promise<{ events: NostrEvent[]; perRelay: RelayResult[] }> {
  const perRelay = await Promise.all(
    relays.map((url) => collectFromRelay(url, filter, opts)),
  );
  const seen = new Set<string>();
  const allowedAuthors = filter.authors ? new Set(filter.authors) : null;
  const merged: NostrEvent[] = [];
  for (const r of perRelay) {
    for (const ev of r.events) {
      if (seen.has(ev.id)) continue;
      if (allowedAuthors && !allowedAuthors.has(ev.pubkey)) continue;
      seen.add(ev.id);
      merged.push(ev);
    }
  }
  return { events: merged, perRelay };
}

/**
 * Keep the freshest event per (pubkey, d-tag) — the replaceable-event
 * contract for kind-30078. Caller supplies the d-tag; we read it off
 * each event's tags. Events without the expected d-tag are dropped.
 */
export function newestPerAuthorByDTag(
  events: NostrEvent[],
  expectedDTag: string,
): Map<string, NostrEvent> {
  const newest = new Map<string, NostrEvent>();
  for (const ev of events) {
    const d = ev.tags.find((t) => t[0] === 'd')?.[1];
    if (d !== expectedDTag) continue;
    const prior = newest.get(ev.pubkey);
    if (!prior || ev.created_at > prior.created_at) {
      newest.set(ev.pubkey, ev);
    }
  }
  return newest;
}
