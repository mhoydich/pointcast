#!/usr/bin/env node
/**
 * reciprocal-crawl — when AI crawlers visit PointCast, look back at them.
 *
 * Reads recent AI/bot hits from tmp/visits/*.jsonl + the live API, then for
 * each unique crawler type that hit us today, fetches the crawler's public
 * identity / agent-protocol surface (their "front door"). Logs the handshake
 * so PointCast can claim a two-way map of the agentic web.
 *
 * Targets:
 *   - the operator's documented bot URL (from the UA they use to crawl us)
 *   - their /.well-known/agents.json (probe — ~zero adoption today, but the
 *     whole point of PointCast is to bet on this becoming a thing)
 *
 * Usage:
 *   node scripts/reciprocal-crawl.mjs            # one pass, log handshakes
 *   node scripts/reciprocal-crawl.mjs --dry      # show targets, don't fetch
 *   node scripts/reciprocal-crawl.mjs --force    # re-fetch even if seen today
 *
 * Output: tmp/visits/_handshakes.jsonl  (one line per crawl attempt)
 */

import { readFileSync, readdirSync, existsSync, mkdirSync, appendFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const dry = args.includes('--dry');
const force = args.includes('--force');

const repoRoot = resolve(fileURLToPath(import.meta.url), '..', '..');
const visitsDir = resolve(repoRoot, 'tmp/visits');
const handshakeLog = resolve(visitsDir, '_handshakes.jsonl');

/**
 * Each crawler type → their operator's documented identity URL. These are
 * the addresses the bot operators publish themselves; fetching one is the
 * polite version of "I see you, here's me looking back."
 *
 * Sourced from each bot's User-Agent string `+https://...` annotation.
 */
const RECIPROCAL = {
  'ai:openai':       'https://platform.openai.com/docs/bots',
  'ai:anthropic':    'https://www.anthropic.com/claudebot',
  'ai:perplexity':   'https://docs.perplexity.ai/guides/bots',
  'ai:google':       'https://developers.google.com/search/docs/crawling-indexing/overview-google-crawlers',
  'ai:meta':         'https://developers.facebook.com/docs/sharing/webmasters/web-crawlers',
  'ai:cohere':       'https://docs.cohere.com',
  'ai:mistral':      'https://mistral.ai',
  'ai:bytedance':    'https://www.bytedance.com',
  'ai:commoncrawl':  'https://commoncrawl.org/ccbot',
  'ai:you':          'https://about.you.com',
  // The non-AI bots are mostly link-unfurl; less interesting but still
  // worth handshakes — Twitter/Facebook unfurls drove a lot of today's load.
  'bot:google':      'https://developers.google.com/search/docs/crawling-indexing/googlebot',
  'bot:apple':       'https://support.apple.com/en-us/HT204683',
  'bot:bing':        'https://www.bing.com/webmasters/help/which-crawlers-does-bing-use-8c184ec0',
  'bot:facebook':    'https://developers.facebook.com/docs/sharing/webmasters/crawler/',
  'bot:twitter':     'https://developer.x.com/en/docs/twitter-for-websites/cards/guides/getting-started',
  'bot:linkedin':    'https://www.linkedin.com/help/linkedin/answer/a521928',
  'bot:slack':       'https://api.slack.com/robots',
  'bot:discord':     'https://discord.com',
  'bot:telegram':    'https://core.telegram.org/bots',
  'bot:whatsapp':    'https://faq.whatsapp.com',
  'bot:ddg':         'https://duckduckgo.com/duckduckgo-help-pages/results/duckduckbot/',
  'bot:yandex':      'https://yandex.com/support/webmaster/robot-workings/check-yandex-robots.html',
  'bot:baidu':       'https://help.baidu.com',
};

/**
 * Derive `/.well-known/agents.json` from a target URL — this is the
 * agent-native equivalent of robots.txt that PointCast publishes itself.
 * Probing here is forward-looking: today nobody serves it, but every probe
 * is a vote for the standard.
 */
const wellKnownFor = (url) => {
  try {
    const u = new URL(url);
    return `${u.origin}/.well-known/agents.json`;
  } catch {
    return null;
  }
};

const POINTCAST_UA = 'pointcast-reciprocal/0.1 (+https://pointcast.xyz/agents.json)';

const loadAllVisits = () => {
  const out = [];
  if (existsSync(visitsDir)) {
    for (const f of readdirSync(visitsDir).filter((x) => x.endsWith('.jsonl') && !x.startsWith('_'))) {
      for (const line of readFileSync(resolve(visitsDir, f), 'utf8').split('\n')) {
        if (!line) continue;
        try { out.push(JSON.parse(line)); } catch {}
      }
    }
  }
  return out;
};

const loadHandshakes = () => {
  if (!existsSync(handshakeLog)) return [];
  const out = [];
  for (const line of readFileSync(handshakeLog, 'utf8').split('\n')) {
    if (!line) continue;
    try { out.push(JSON.parse(line)); } catch {}
  }
  return out;
};

const dayOf = (t) => new Date(t).toISOString().slice(0, 10);

const probe = async (url) => {
  const t0 = Date.now();
  try {
    const r = await fetch(url, {
      method: 'GET',
      headers: { 'User-Agent': POINTCAST_UA, 'Accept': 'text/html, application/json, */*' },
      redirect: 'follow',
      signal: AbortSignal.timeout(15_000),
    });
    const latency = Date.now() - t0;
    const ct = r.headers.get('content-type') || '';
    const body = ct.includes('json') ? (await r.text()).slice(0, 4096) : '';
    // SPA index fallbacks (OpenAI, Apple, etc.) return 200 text/html for any
    // unknown path. Distinguish "real agents.json" (JSON body that parses)
    // from "site exists, returned its app shell."
    let realAgentsJson = false;
    if (body && r.ok) {
      try { JSON.parse(body); realAgentsJson = true; } catch {}
    }
    return {
      ok: r.ok,
      status: r.status,
      latency_ms: latency,
      content_type: ct,
      final_url: r.url,
      sample: body || undefined,
      real_agents_json: realAgentsJson,
    };
  } catch (e) {
    return { ok: false, status: 0, latency_ms: Date.now() - t0, error: e.message };
  }
};

const run = async () => {
  const visits = loadAllVisits();

  // Live API too — covers the rolling window even before today's snapshot.
  try {
    const r = await fetch('https://pointcast.xyz/api/visit?t=' + Date.now());
    const d = await r.json();
    const seen = new Set(visits.map((v) => v.t));
    for (const e of d.log || []) if (!seen.has(e.t)) visits.push(e);
  } catch (e) {
    console.error('warn: live fetch failed,', e.message);
  }

  // Group: which crawler types hit us, and what was the first time today.
  const today = dayOf(Date.now());
  const seenToday = new Map(); // type → earliest visit entry today
  for (const e of visits) {
    if (dayOf(e.t) !== today) continue;
    if (!RECIPROCAL[e.type]) continue;
    const cur = seenToday.get(e.type);
    if (!cur || e.t < cur.t) seenToday.set(e.type, e);
  }

  if (seenToday.size === 0) {
    console.log('no targetable crawler hits today.');
    return;
  }

  // Skip types we've already handshook today (unless --force).
  const handshakes = loadHandshakes();
  const alreadyDone = new Set(
    handshakes
      .filter((h) => dayOf(h.t) === today)
      .map((h) => `${h.original_type}|${h.target}`),
  );

  if (!existsSync(visitsDir)) mkdirSync(visitsDir, { recursive: true });

  const C = { dim: '\x1b[2m', reset: '\x1b[0m', cyan: '\x1b[36m', green: '\x1b[32m', red: '\x1b[31m', yellow: '\x1b[33m' };
  console.log(`\n${C.cyan}reciprocal crawl${C.reset}  ${seenToday.size} crawler types hit us today  ${C.dim}(UA: ${POINTCAST_UA})${C.reset}\n`);

  let probed = 0;
  for (const [type, visit] of seenToday) {
    const operatorUrl = RECIPROCAL[type];
    const wellKnown = wellKnownFor(operatorUrl);
    const targets = [
      { kind: 'operator', url: operatorUrl },
      { kind: 'agents.json', url: wellKnown },
    ].filter((t) => t.url);

    for (const target of targets) {
      const key = `${type}|${target.url}`;
      if (!force && alreadyDone.has(key)) {
        console.log(`${C.dim}skip ${type.padEnd(16)} ${target.kind.padEnd(11)} (already today)${C.reset}`);
        continue;
      }

      if (dry) {
        console.log(`${C.yellow}dry  ${type.padEnd(16)} ${target.kind.padEnd(11)} ${target.url}${C.reset}`);
        continue;
      }

      const result = await probe(target.url);
      probed++;
      const color = result.ok ? C.green : (result.status === 404 ? C.dim : C.red);
      console.log(`${color}${result.status || 'ERR'} ${type.padEnd(16)} ${target.kind.padEnd(11)} ${result.latency_ms}ms  ${target.url}${C.reset}`);

      const record = {
        t: Date.now(),
        original_type: type,
        original_visit_t: visit.t,
        original_visit_country: visit.country,
        target_kind: target.kind,
        target: target.url,
        ...result,
      };
      appendFileSync(handshakeLog, JSON.stringify(record) + '\n');
    }
  }

  console.log(`\n${C.dim}done. ${probed} probes written to tmp/visits/_handshakes.jsonl${C.reset}`);

  // Roll up the full handshake archive into a public-shaped summary at
  // src/data/handshakes.json. This is the data surface for /handshakes —
  // committed and shipped with each build. Keeps the page truthful without
  // requiring KV or runtime infra.
  writeHandshakeSummary();
};

const writeHandshakeSummary = () => {
  const allHandshakes = loadHandshakes();
  if (allHandshakes.length === 0) return;

  const summaryPath = resolve(repoRoot, 'src/data/handshakes.json');
  const byType = {};
  for (const h of allHandshakes) {
    byType[h.original_type] ??= { operator: null, agents_json: null };
    const slot = h.target_kind === 'agents.json' ? 'agents_json' : 'operator';
    const cur = byType[h.original_type][slot];
    if (!cur || h.t > cur.t) byType[h.original_type][slot] = h;
  }

  const rows = Object.entries(byType).sort().map(([type, slots]) => ({
    type,
    operator_url: slots.operator?.target ?? null,
    operator_status: slots.operator?.status ?? null,
    operator_ok: !!slots.operator?.ok,
    agents_json_url: slots.agents_json?.target ?? null,
    agents_json_status: slots.agents_json?.status ?? null,
    agents_json_real: !!slots.agents_json?.real_agents_json,
    last_observed_country: slots.operator?.original_visit_country || slots.agents_json?.original_visit_country || '',
    last_handshake_at: new Date(Math.max(slots.operator?.t || 0, slots.agents_json?.t || 0)).toISOString(),
  }));

  const summary = {
    generated_at: new Date().toISOString(),
    ua: POINTCAST_UA,
    totals: {
      crawler_types_handshook: rows.length,
      operators_reachable: rows.filter((r) => r.operator_ok).length,
      agents_json_serving: rows.filter((r) => r.agents_json_real).length,
      total_probes: allHandshakes.length,
    },
    handshakes: rows,
  };

  appendFileSyncSafe(summaryPath, JSON.stringify(summary, null, 2) + '\n', 'overwrite');
  console.log(`\x1b[2mwrote summary → src/data/handshakes.json\x1b[0m`);
};

const appendFileSyncSafe = (path, content, mode) => {
  const dir = path.split('/').slice(0, -1).join('/');
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  if (mode === 'overwrite') writeFileSync(path, content);
  else appendFileSync(path, content);
};

await run();
