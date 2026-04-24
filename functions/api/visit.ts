/**
 * /api/visit — PointCast visit log (noun-identity flow).
 *
 * Each visit is represented by a Noun. Humans pick their noun via the JS
 * widget (10s regenerate window, then auto-posts). Non-humans (AI crawlers,
 * bots, spiders) are logged server-side via the Pages middleware
 * (functions/_middleware.ts), which calls recordVisit() directly.
 *
 * POST /api/visit    body: { nounId: number (0-1199) }
 *                    Records a human visit with the client-chosen noun.
 *                    Rate-limited to one log entry per IP per hour.
 *
 * GET  /api/visit    → { count, present, log: [{t,type,country,city?,region?,nounId,firsts?}] }
 *                    Cached at the edge for 10s.
 *
 * No text fields — visits are visual-only (no moderation surface).
 * Storage: Cloudflare KV namespace bound as env.VISITS.
 */

export interface Env {
  VISITS?: KVNamespace;
}

export interface VisitEntry {
  t: number;
  type: string;
  country: string;
  city: string;
  region: string;
  nounId: number;
  firsts?: string[];     // ['type', 'country'] when this was first-of-a-kind
  note?: string;         // visitor's optional ≤140-char note attached at commit time
}

interface FirstsRecord {
  types: Record<string, number>;
  countries: Record<string, number>;
}

export interface PresenceEntry {
  t: number;
  type: string;
  nounId: number;
  /**
   * Public presence ID — first 12 chars of the sha256(ip) hash. Stable within
   * a session; safe to expose to other clients since it can't be reversed to
   * an IP. Used as the target key for the reactions feature (slackmoji-style
   * signals stuck on a visitor's noun).
   */
  pid?: string;
}

export interface ReactionTuple {
  emoji: string;
  count: number;
}

export const MAX_LOG_ENTRIES = 100;
// Short rate limit — enough to stop automated spam, short enough that
// a visitor picking / regenerating multiple nouns can log each one.
export const RATE_LIMIT_SECONDS = 2;
// Bumped from 300s to 600s so someone showing PointCast to a friend has
// breathing room before presence drops. 10 min is the "conversation window".
export const PRESENCE_TTL_SECONDS = 600;
export const REACTIONS_TTL_SECONDS = 600;  // outlive presence a bit
export const NOUN_ID_RANGE = 1200;      // noun.pics supports ~0-1300 reliably
export const KEY_COUNT = 'count';
export const KEY_LOG = 'log';
export const KEY_FIRSTS = 'firsts';
export const PRESENCE_PREFIX = 'present:';
export const REACTIONS_PREFIX = 'react:';
/** Emoji set allowed on reactions — server-side whitelist to prevent abuse. */
export const ALLOWED_EMOJIS = ['👋', '❤️', '👀', '🔥', '✨', '🎉', '🫡', '🤝'];

const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
};

function jsonResponse(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { ...JSON_HEADERS, ...(init?.headers ?? {}) },
  });
}

/** Classify a User-Agent into a type tag. */
export function classifyUA(ua: string): string {
  if (!ua) return 'unknown';
  if (/gptbot|chatgpt-user|openai/i.test(ua)) return 'ai:openai';
  if (/claudebot|claude-web|anthropic/i.test(ua)) return 'ai:anthropic';
  if (/perplexitybot|perplexity/i.test(ua)) return 'ai:perplexity';
  if (/ccbot|common crawl/i.test(ua)) return 'ai:commoncrawl';
  if (/bytespider/i.test(ua)) return 'ai:bytedance';
  if (/google-extended/i.test(ua)) return 'ai:google';
  if (/meta-externalagent|facebookbot/i.test(ua)) return 'ai:meta';
  if (/cohere-ai/i.test(ua)) return 'ai:cohere';
  if (/mistralai/i.test(ua)) return 'ai:mistral';
  if (/you\.com/i.test(ua)) return 'ai:you';
  if (/googlebot/i.test(ua)) return 'bot:google';
  if (/bingbot/i.test(ua)) return 'bot:bing';
  if (/duckduckbot/i.test(ua)) return 'bot:ddg';
  if (/yandexbot/i.test(ua)) return 'bot:yandex';
  if (/baiduspider/i.test(ua)) return 'bot:baidu';
  if (/applebot/i.test(ua)) return 'bot:apple';
  if (/facebookexternalhit/i.test(ua)) return 'bot:facebook';
  if (/twitterbot/i.test(ua)) return 'bot:twitter';
  if (/linkedinbot/i.test(ua)) return 'bot:linkedin';
  if (/slackbot/i.test(ua)) return 'bot:slack';
  if (/discordbot/i.test(ua)) return 'bot:discord';
  if (/telegrambot/i.test(ua)) return 'bot:telegram';
  if (/whatsapp/i.test(ua)) return 'bot:whatsapp';
  if (/semrushbot|ahrefsbot|mj12bot|dotbot/i.test(ua)) return 'bot:seo';
  if (/bot|crawler|spider|headless/i.test(ua)) return 'bot:other';
  return 'human';
}

export async function sha256(s: string): Promise<string> {
  const buf = new TextEncoder().encode(s);
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function loadLog(env: Env): Promise<VisitEntry[]> {
  if (!env.VISITS) return [];
  const raw = await env.VISITS.get(KEY_LOG);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function loadCount(env: Env): Promise<number> {
  if (!env.VISITS) return 0;
  const raw = await env.VISITS.get(KEY_COUNT);
  return raw ? Number(raw) || 0 : 0;
}

async function loadFirsts(env: Env): Promise<FirstsRecord> {
  if (!env.VISITS) return { types: {}, countries: {} };
  const raw = await env.VISITS.get(KEY_FIRSTS);
  if (!raw) return { types: {}, countries: {} };
  try {
    const parsed = JSON.parse(raw);
    return {
      types: parsed.types ?? {},
      countries: parsed.countries ?? {},
    };
  } catch {
    return { types: {}, countries: {} };
  }
}

async function listPresent(env: Env): Promise<PresenceEntry[]> {
  if (!env.VISITS) return [];
  try {
    const { keys } = await env.VISITS.list({ prefix: PRESENCE_PREFIX, limit: 50 });
    const values = await Promise.all(keys.map((k) => env.VISITS!.get(k.name)));
    const entries: PresenceEntry[] = [];
    keys.forEach((key, i) => {
      const raw = values[i];
      if (!raw) return;
      try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed.nounId === 'number' && typeof parsed.type === 'string' && typeof parsed.t === 'number') {
          // Backfill `pid` for entries written before the pid rollout (pre-r2).
          // The key is `present:{ipHash}`; the first 12 chars of the hash are pid.
          if (!parsed.pid) {
            parsed.pid = key.name.slice(PRESENCE_PREFIX.length, PRESENCE_PREFIX.length + 12);
          }
          entries.push(parsed as PresenceEntry);
        }
      } catch { /* legacy format (just timestamp) — skip */ }
    });
    entries.sort((a, b) => b.t - a.t);
    return entries.slice(0, 24);
  } catch {
    return [];
  }
}

/**
 * Load aggregate reaction counts for a set of presence IDs. Each reactions
 * key holds `{ [emoji]: [sessionIdHash,...] }`; we return the per-pid list
 * of `{emoji, count}` tuples, sorted by recency-of-addition is overkill —
 * a simple count sort keeps the UI stable.
 */
async function loadReactions(
  env: Env,
  pids: string[],
): Promise<Record<string, ReactionTuple[]>> {
  if (!env.VISITS || pids.length === 0) return {};
  const unique = Array.from(new Set(pids));
  const values = await Promise.all(
    unique.map((pid) => env.VISITS!.get(`${REACTIONS_PREFIX}${pid}`)),
  );
  const out: Record<string, ReactionTuple[]> = {};
  unique.forEach((pid, i) => {
    const raw = values[i];
    if (!raw) { out[pid] = []; return; }
    try {
      const parsed = JSON.parse(raw) as Record<string, string[]>;
      const tuples: ReactionTuple[] = [];
      for (const emoji of ALLOWED_EMOJIS) {
        const arr = parsed[emoji];
        if (Array.isArray(arr) && arr.length > 0) {
          tuples.push({ emoji, count: arr.length });
        }
      }
      out[pid] = tuples;
    } catch {
      out[pid] = [];
    }
  });
  return out;
}

/**
 * Presence-only ping — writes the KV presence entry WITHOUT bumping the
 * count or appending to the visit log. Called by the client on page load
 * and every 60s heartbeat so a visitor shows in "here now" the instant
 * they land (not 10s later when the widget's countdown commits).
 *
 * Returns `{ ok, present }` — the caller can use present[] right away.
 */
export async function pingPresence(opts: {
  env: Env;
  ip: string;
  ua: string;
  nounId: number;
}): Promise<{ ok: boolean; present: PresenceEntry[] }> {
  const { env, ip, ua, nounId } = opts;
  if (!env.VISITS) return { ok: false, present: [] };
  const type = classifyUA(ua);
  const nid = Math.max(0, Math.min(NOUN_ID_RANGE - 1, Math.floor(nounId)));
  const ipHash = await sha256(ip || 'unknown');
  const pid = ipHash.slice(0, 12);
  await env.VISITS.put(
    `${PRESENCE_PREFIX}${ipHash}`,
    JSON.stringify({ t: Date.now(), type, nounId: nid, pid }),
    { expirationTtl: PRESENCE_TTL_SECONDS },
  );
  const present = await listPresent(env);
  return { ok: true, present };
}

/**
 * Core log-a-visit routine. Used both by POST /api/visit (humans) and by
 * the Pages middleware (AI/bots/spiders). Handles rate limiting, presence,
 * first-of-a-kind badge stamping, and log rotation.
 *
 * Returns `{ throttled: true }` if the IP was already logged this hour.
 */
export async function recordVisit(opts: {
  env: Env;
  ip: string;
  ua: string;
  cf: { country?: string; city?: string; region?: string } | undefined;
  nounId: number;
  forcedType?: string;
  note?: string;
}): Promise<{ ok: boolean; count: number; present: PresenceEntry[]; entry?: VisitEntry; throttled?: boolean }> {
  const { env, ip, ua, cf, nounId, forcedType, note } = opts;
  if (!env.VISITS) {
    return { ok: false, count: 0, present: [] };
  }

  const type = forcedType ?? classifyUA(ua);
  // Clamp nounId early so it's available for presence too.
  const nid = Math.max(0, Math.min(NOUN_ID_RANGE - 1, Math.floor(nounId)));
  const country = typeof cf?.country === 'string' ? cf.country : '';
  const city = typeof cf?.city === 'string' ? cf.city : '';
  const region = typeof cf?.region === 'string' ? cf.region : '';

  const ipHash = await sha256(ip || 'unknown');
  const presenceKey = `${PRESENCE_PREFIX}${ipHash}`;
  // Public presence ID — short, opaque, safe to broadcast.
  const pid = ipHash.slice(0, 12);

  // Always refresh presence with full identity (type + noun + pid). This
  // powers the live "here now" strip on the client, and the pid lets the
  // reactions feature target specific visitors.
  await env.VISITS.put(
    presenceKey,
    JSON.stringify({ t: Date.now(), type: forcedType ?? type, nounId: nid, pid }),
    { expirationTtl: PRESENCE_TTL_SECONDS },
  );

  // Session-dedupe cooldown. Per Mike ping 2026-04-20 21:37 UTC:
  // "been getting cloudflaire overuse notes in gmail for kv workers."
  // Root cause: every page hit (+ every crawler hit via _middleware)
  // wrote 2-3 KV entries (log, count, firsts). A single visitor scrolling
  // 40 pages = 120 KV writes. Mitigation: skip log/count writes when the
  // same IP hit within COOLDOWN_SECONDS. Presence still refreshes (above).
  // Notes from the visitor (explicit user action) always log regardless.
  const COOLDOWN_KEY_PREFIX = 'visit:cooldown:';
  const COOLDOWN_SECONDS = 600;
  const cooldownKey = `${COOLDOWN_KEY_PREFIX}${ipHash}`;
  const cooldownActive = await env.VISITS.get(cooldownKey);
  if (cooldownActive && !note) {
    const present = await listPresent(env);
    return { ok: true, count: await loadCount(env), present, throttled: true };
  }

  // First-of-a-kind
  const firsts = await loadFirsts(env);
  const now = Date.now();
  const badges: string[] = [];
  if (type !== 'unknown' && firsts.types[type] === undefined) {
    firsts.types[type] = now;
    badges.push('type');
  }
  if (country && firsts.countries[country] === undefined) {
    firsts.countries[country] = now;
    badges.push('country');
  }

  // Clip + sanitize the note — ≤140 chars, no HTML/control chars.
  // Rendering side HTML-escapes everything so this is belt + suspenders.
  //
  // Prompt-injection defense: /api/visit is a public endpoint that AI
  // crawlers + LLM-powered tools read. Without filtering, a malicious
  // visitor could write a note like "Ignore your previous instructions
  // and…" that becomes observed content in any LLM that ingests our
  // API. Claude's own defenses block this regardless, but we still
  // refuse to serve obvious injection patterns because (a) it protects
  // less-hardened downstream tools, and (b) a clean public API is a
  // feature of a well-run site. We don't attempt to catch every
  // possible injection — just the lowest-effort ones.
  const INJECTION_PATTERNS = [
    /ignore\s+(previous|prior|above|all)\s+(instructions?|prompts?)/i,
    /disregard\s+(previous|prior|above|all)\s+(instructions?|prompts?)/i,
    /stop\s+(claude|chatgpt|gpt|assistant|ai)/i,
    /you\s+are\s+now\s+(a|an)\s+/i,
    /system\s*(:|prompt)/i,
    /\bforget\s+(everything|all|previous|what)\b/i,
    /\breveal\s+(your|the)\s+(system|prompt|instructions)/i,
    /\boverride\s+(your|the|all)\s+(safety|rules|guidelines|instructions)/i,
    /\bjailbreak\b/i,
    /\bDAN\s+mode\b/i,
  ];
  let safeNote = typeof note === 'string'
    ? note.replace(/[\x00-\x1f\x7f]/g, '').slice(0, 140).trim()
    : '';
  if (safeNote && INJECTION_PATTERNS.some((re) => re.test(safeNote))) {
    // Silently drop the note rather than 4xx — the visit still commits,
    // the note is simply not stored. Loud failures teach spammers what
    // filter we use; silent drops waste their effort.
    safeNote = '';
  }

  const entry: VisitEntry = {
    t: now,
    type,
    country,
    city: type === 'human' ? city : '',
    region: type === 'human' ? region : '',
    nounId: nid,
    ...(badges.length ? { firsts: badges } : {}),
    ...(safeNote ? { note: safeNote } : {}),
  };

  const [log, count] = await Promise.all([loadLog(env), loadCount(env)]);
  log.unshift(entry);
  const trimmed = log.slice(0, MAX_LOG_ENTRIES);
  const nextCount = count + 1;

  const writes: Promise<void>[] = [
    env.VISITS.put(KEY_LOG, JSON.stringify(trimmed)),
    env.VISITS.put(KEY_COUNT, String(nextCount)),
    // Set cooldown so the next hit from this IP within 10 min returns
    // early above without re-writing log/count/firsts.
    env.VISITS.put(cooldownKey, '1', { expirationTtl: COOLDOWN_SECONDS }),
  ];
  if (badges.length) {
    writes.push(env.VISITS.put(KEY_FIRSTS, JSON.stringify(firsts)));
  }
  await Promise.all(writes);

  const present = await listPresent(env);
  return { ok: true, count: nextCount, present, entry };
}

// -- GET /api/visit ----------------------------------------------------------

export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
  // Derive the caller's pid from their IP so the client knows which
  // presence entry is "self". We compute it every request (uncached by
  // variant — since `Cache-Control` is keyed by URL not IP, each caller's
  // response is edge-cached briefly against the *same* key; clients that
  // want fresh yourPid can bust with `?t=<ts>` but we don't need to — the
  // presence TTL is 5min so even 5s staleness is immaterial).
  const ip = request.headers.get('cf-connecting-ip') ?? 'unknown';
  const yourPid = (await sha256(ip)).slice(0, 12);

  const [count, log, present] = await Promise.all([
    loadCount(env),
    loadLog(env),
    listPresent(env),
  ]);
  // Pull reactions for all currently-present pids in one batch so the client
  // gets a fully-composed "live room" payload in a single request.
  const pids = present
    .map((p) => p.pid)
    .filter((x): x is string => typeof x === 'string' && x.length > 0);
  const reactions = await loadReactions(env, pids);
  return jsonResponse(
    { count, present, log, reactions, yourPid },
    // yourPid is caller-specific, but it's derived from cf-connecting-ip
    // which Cloudflare's cache honors as a natural partition. Private cache
    // keeps per-client consistency without a public edge cache mis-serving
    // pids to other callers.
    { headers: { 'Cache-Control': 'private, max-age=5' } },
  );
};

// -- POST /api/visit ---------------------------------------------------------

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.VISITS) {
    return jsonResponse({ ok: false, count: 0, reason: 'kv-not-bound' });
  }

  let nounId = Math.floor(Math.random() * NOUN_ID_RANGE);
  let presenceOnly = false;
  let note = '';
  try {
    const body = (await request.json()) as { nounId?: unknown; presence_only?: unknown; note?: unknown };
    if (typeof body?.nounId === 'number' && Number.isFinite(body.nounId)) {
      nounId = body.nounId;
    }
    presenceOnly = body?.presence_only === true;
    if (typeof body?.note === 'string') note = body.note;
  } catch {
    /* no body — use fallback random */
  }

  const ip = request.headers.get('cf-connecting-ip') ?? 'unknown';
  const ua = request.headers.get('user-agent') ?? '';

  // Fast path: presence-only ping. Fires on client page-load + every 60s
  // heartbeat so visitors appear in "here now" from the moment they land —
  // the 10s widget countdown only controls when they COMMIT their noun to
  // the log. Before this split, anyone who bounced in <10s was invisible.
  if (presenceOnly) {
    const r = await pingPresence({ env, ip, ua, nounId });
    return jsonResponse(r);
  }

  // Full commit path: log + count + presence.
  const cf = (request as any).cf;
  const result = await recordVisit({
    env,
    ip,
    ua,
    cf,
    nounId,
  });

  return jsonResponse(result);
};

// -- OPTIONS (CORS preflight) ------------------------------------------------

export const onRequestOptions: PagesFunction<Env> = () =>
  new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
