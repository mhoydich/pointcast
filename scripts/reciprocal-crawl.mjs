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
  'ai:perplexity':   'https://docs.perplexity.ai/guides/perplexity-crawlers',
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
  'bot:apple':       'https://support.apple.com/en-us/119829',
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
 * The probe battery. For each operator's domain we test how many agent-native
 * surfaces they actually serve. PointCast hits 5/5; today most operators hit
 * 0/5.
 *
 * Each kind has a validator (validateBody): the response has to look like a
 * real surface, not just 200 OK. Many operator domains are SPAs that return
 * text/html for any unknown path — we have to peek at the body shape.
 */
const PROBE_KINDS = [
  { kind: 'agents.json', path: '/.well-known/agents.json',     expect: 'json' },
  { kind: 'ai-plugin',   path: '/.well-known/ai-plugin.json',  expect: 'json' },
  { kind: 'llms.txt',    path: '/llms.txt',                    expect: 'text-llms' },
  { kind: 'llms-full',   path: '/llms-full.txt',               expect: 'text-llms' },
  { kind: 'robots-ai',   path: '/robots.txt',                  expect: 'robots-ai' },
];

/**
 * Strip well-known docs subdomains (developers., docs., support., etc.) to
 * find the apex where robots.txt + llms.txt actually live. `developers.google.com`
 * doesn't have AI-bot stanzas in its robots — `google.com` does.
 */
const apexFor = (operatorUrl) => {
  try {
    const u = new URL(operatorUrl);
    const parts = u.hostname.split('.');
    const subPrefixes = ['developers', 'developer', 'docs', 'support', 'help', 'about', 'platform', 'www'];
    while (parts.length > 2 && subPrefixes.includes(parts[0])) parts.shift();
    return `${u.protocol}//${parts.join('.')}`;
  } catch { return null; }
};

const targetsForOperator = (operatorUrl) => {
  const out = [{ kind: 'operator', url: operatorUrl, expect: 'reachable' }];
  const origin = (() => { try { return new URL(operatorUrl).origin; } catch { return null; } })();
  const apex = apexFor(operatorUrl);
  // Probe at the operator's origin AND the apex domain. If both resolve to
  // the same URL we dedupe. Apex is where real robots/llms typically live.
  const seen = new Set();
  for (const base of [origin, apex].filter(Boolean)) {
    for (const k of PROBE_KINDS) {
      const url = base + k.path;
      if (seen.has(url)) continue;
      seen.add(url);
      out.push({ kind: k.kind, url, expect: k.expect });
    }
  }
  return out;
};

/** Known AI-bot User-agents — used to detect "real" robots.txt files that
 *  acknowledge AI crawlers vs. generic ones that only address Googlebot. */
const AI_BOT_AGENTS = /User-agent:\s*(GPTBot|ChatGPT-User|ClaudeBot|anthropic-ai|PerplexityBot|Google-Extended|GoogleOther|CCBot|Bytespider|MistralAI|cohere-ai|FacebookBot|Meta-ExternalAgent|Applebot-Extended|YouBot)/i;

/**
 * Validate that a response actually serves the agent-native shape we asked
 * for. Returns a boolean — `true` means "this site really publishes this."
 */
const validateBody = (expect, body, contentType, ok) => {
  if (!ok) return false;
  if (expect === 'reachable') return true;
  if (!body) return false;
  if (expect === 'json') {
    if (!contentType.includes('json')) return false;
    try { JSON.parse(body); return true; } catch { return false; }
  }
  if (expect === 'text-llms') {
    if (contentType.includes('html')) return false;
    return body.length > 32 && (/^#\s/m.test(body) || /https?:\/\//.test(body));
  }
  if (expect === 'robots-ai') {
    if (contentType.includes('html')) return false;
    return AI_BOT_AGENTS.test(body);
  }
  return false;
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

const probe = async (url, expect) => {
  const t0 = Date.now();
  try {
    const r = await fetch(url, {
      method: 'GET',
      headers: { 'User-Agent': POINTCAST_UA, 'Accept': 'text/html, application/json, text/plain, */*' },
      redirect: 'follow',
      signal: AbortSignal.timeout(15_000),
    });
    const latency = Date.now() - t0;
    const ct = r.headers.get('content-type') || '';
    // For text/json kinds we always read; for `reachable` (the operator doc)
    // we don't need the body — saves bandwidth and parse cycles on full HTML.
    const wantBody = expect !== 'reachable';
    const body = wantBody ? (await r.text()).slice(0, 8192) : '';
    const served = validateBody(expect, body, ct, r.ok);
    return {
      ok: r.ok,
      status: r.status,
      latency_ms: latency,
      content_type: ct,
      final_url: r.url,
      served,
      sample: served && body ? body.slice(0, 280) : undefined,
    };
  } catch (e) {
    return { ok: false, status: 0, latency_ms: Date.now() - t0, served: false, error: e.message };
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
    const targets = targetsForOperator(operatorUrl);

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

      const result = await probe(target.url, target.expect);
      probed++;
      const badge = result.served ? `${C.green}✓ served${C.reset}` : `${C.dim}- ${result.status || 'ERR'}${C.reset}`;
      console.log(`${badge}  ${type.padEnd(16)} ${target.kind.padEnd(11)} ${String(result.latency_ms).padStart(5)}ms  ${target.url}`);

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

const SCORED_KINDS = PROBE_KINDS.map((k) => k.kind); // 5 surfaces, not the operator doc

const writeHandshakeSummary = () => {
  const allHandshakes = loadHandshakes();
  if (allHandshakes.length === 0) return;

  const summaryPath = resolve(repoRoot, 'src/data/handshakes.json');
  // For each (type, kind) keep the BEST recent probe — a `served=true` beats
  // any `served=false` (because we now probe both origin and apex per kind,
  // and we want the row to credit the operator if EITHER serves the surface).
  // Within served-equal, keep the most recent.
  const byType = {};
  const isServed = (h) => !!(h.served ?? h.real_agents_json);
  for (const h of allHandshakes) {
    const t = h.original_type;
    byType[t] ??= {};
    const cur = byType[t][h.target_kind];
    if (!cur) { byType[t][h.target_kind] = h; continue; }
    const newBetter = isServed(h) && !isServed(cur);
    const sameQuality = isServed(h) === isServed(cur);
    if (newBetter || (sameQuality && h.t > cur.t)) byType[t][h.target_kind] = h;
  }

  const rows = Object.entries(byType).sort().map(([type, kinds]) => {
    const surfaces = {};
    let score = 0;
    for (const k of SCORED_KINDS) {
      const probe = kinds[k];
      // Old records lack `served`; back-compat: if it was the agents_json
      // handshake, fall back to its legacy `real_agents_json` field.
      const served = probe ? !!(probe.served ?? probe.real_agents_json) : false;
      surfaces[k] = {
        url: probe?.target ?? null,
        status: probe?.status ?? null,
        served,
      };
      if (served) score++;
    }
    const op = kinds.operator;
    return {
      type,
      operator_url: op?.target ?? null,
      operator_status: op?.status ?? null,
      operator_ok: !!op?.ok,
      surfaces,
      agent_native_score: score,
      last_observed_country: op?.original_visit_country || '',
      last_handshake_at: new Date(Math.max(...Object.values(kinds).map((p) => p?.t || 0))).toISOString(),
    };
  });

  const summary = {
    generated_at: new Date().toISOString(),
    ua: POINTCAST_UA,
    scored_kinds: SCORED_KINDS,
    totals: {
      crawler_types_handshook: rows.length,
      operators_reachable: rows.filter((r) => r.operator_ok).length,
      // How many operators serve at least one agent-native surface?
      operators_with_any_surface: rows.filter((r) => r.agent_native_score > 0).length,
      // Per-surface counts — useful for "X of N serve agents.json" framings.
      surface_counts: SCORED_KINDS.reduce((acc, k) => {
        acc[k] = rows.filter((r) => r.surfaces[k]?.served).length;
        return acc;
      }, {}),
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
