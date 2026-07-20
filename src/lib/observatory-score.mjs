/**
 * observatory-score.mjs — the Agent-Web Observatory scoring rubric.
 *
 * Pure module: no I/O, no timers, no crypto. The scanner Worker feeds it
 * probe results; tests feed it fixtures. Everything that could drift —
 * weights, validators, diffing — lives here so `node --test` covers it.
 *
 * Rubric: 9 fixed probe paths, grouped into 8 weighted surfaces summing
 * to 100. A surface only earns its weight when the response validates as
 * the real thing (validateProbeBody) — HTTP 200 alone never counts,
 * because many sites SPA-fallback text/html for every unknown path.
 *
 * agents.json is scored as one surface with two accepted locations
 * (/agents.json and /.well-known/agents.json): serving either earns the
 * full 20. PointCast itself serves both; most sites that adopt pick one.
 */

/** The robots.txt opt-out token. Single source of truth: the scanner UA
 *  (observatory-seeds.mjs) is built from this, and the opt-out parser
 *  matches on it — rebranding one without the other is impossible. */
export const OBSERVATORY_UA_TOKEN = 'pointcast-observatory';

/** Weighted surface groups. Weights sum to 100. */
export const SCORE_GROUPS = {
  llms: 20,
  llmsFull: 10,
  agents: 20,
  aiJson: 10,
  agentPayments: 10,
  robotsAi: 10,
  feedJson: 10,
  feedXml: 10,
};

/** The fixed probe battery. Nothing outside these paths is ever fetched. */
export const PROBES = [
  { id: 'llms', path: '/llms.txt', expect: 'text-llms', group: 'llms' },
  { id: 'llmsFull', path: '/llms-full.txt', expect: 'text-llms', group: 'llmsFull' },
  { id: 'agentsJson', path: '/agents.json', expect: 'json', group: 'agents' },
  { id: 'wellKnownAgents', path: '/.well-known/agents.json', expect: 'json', group: 'agents' },
  { id: 'wellKnownAi', path: '/.well-known/ai.json', expect: 'json', group: 'aiJson' },
  { id: 'agentPayments', path: '/.well-known/agent-payments.json', expect: 'json', group: 'agentPayments' },
  { id: 'robotsAi', path: '/robots.txt', expect: 'robots-ai', group: 'robotsAi' },
  { id: 'feedJson', path: '/feed.json', expect: 'feed-json', group: 'feedJson' },
  { id: 'feedXml', path: '/feed.xml', expect: 'feed-xml', group: 'feedXml' },
];

/** Known AI-crawler User-agent tokens — a robots.txt that names any of
 *  these is "AI-aware" vs. one that only addresses Googlebot. */
export const AI_BOT_AGENTS =
  /User-agent:\s*(GPTBot|ChatGPT-User|ClaudeBot|anthropic-ai|PerplexityBot|Google-Extended|GoogleOther|CCBot|Bytespider|MistralAI|cohere-ai|FacebookBot|Meta-ExternalAgent|Applebot-Extended|YouBot)/i;

/**
 * Does the response body actually look like the surface we probed for?
 * Returns boolean — true means "this site really publishes this."
 */
export function validateProbeBody(expect, body, contentType, ok) {
  if (!ok) return false;
  if (!body) return false;
  const ct = contentType || '';
  if (expect === 'json') {
    if (!ct.includes('json')) return false;
    try {
      JSON.parse(body);
      return true;
    } catch {
      return false;
    }
  }
  if (expect === 'text-llms') {
    if (ct.includes('html')) return false;
    return body.length > 32 && (/^#\s/m.test(body) || /https?:\/\//.test(body));
  }
  if (expect === 'robots-ai') {
    if (ct.includes('html')) return false;
    return AI_BOT_AGENTS.test(body);
  }
  if (expect === 'feed-json') {
    if (!ct.includes('json')) return false;
    try {
      const parsed = JSON.parse(body);
      if (!parsed || typeof parsed !== 'object') return false;
      return typeof parsed.version === 'string' || Array.isArray(parsed.items);
    } catch {
      return false;
    }
  }
  if (expect === 'feed-xml') {
    if (/<html[\s>]/i.test(body.slice(0, 512))) return false;
    return /<(rss|feed)[\s>]/i.test(body);
  }
  return false;
}

/**
 * Score a probe-result map { [probeId]: { servedValid } }.
 * Returns { score, breakdown: { [group]: { weight, earned, via } } }
 * where `via` names the probe that earned the group (null if none did).
 */
export function scoreProbes(probeResults) {
  const breakdown = {};
  let score = 0;
  for (const [group, weight] of Object.entries(SCORE_GROUPS)) {
    const members = PROBES.filter((p) => p.group === group);
    const winner = members.find((p) => probeResults?.[p.id]?.servedValid);
    const earned = winner ? weight : 0;
    breakdown[group] = { weight, earned, via: winner ? winner.id : null };
    score += earned;
  }
  return { score, breakdown };
}

/**
 * Parse robots.txt for the directives the Observatory cares about:
 *   hasAiStanzas      — names any known AI crawler (scoring signal)
 *   blocksAll         — the `*` group disallows everything
 *   blocksObservatory — a group matching our UA token disallows everything
 * blocksAll/blocksObservatory are the ethical opt-out gate: when either is
 * true the scanner records the robots result and probes nothing else.
 */
export function parseRobotsAiDirectives(text, uaToken = OBSERVATORY_UA_TOKEN) {
  const out = { hasAiStanzas: AI_BOT_AGENTS.test(text || ''), blocksAll: false, blocksObservatory: false };
  if (!text) return out;
  let currentAgents = [];
  let lastWasAgent = false;
  for (const rawLine of text.split('\n')) {
    const line = rawLine.replace(/#.*$/, '').trim();
    if (!line) continue;
    const m = line.match(/^([A-Za-z-]+)\s*:\s*(.*)$/);
    if (!m) continue;
    const field = m[1].toLowerCase();
    const value = m[2].trim();
    if (field === 'user-agent') {
      // Consecutive User-agent lines share the record that follows.
      if (!lastWasAgent) currentAgents = [];
      currentAgents.push(value.toLowerCase());
      lastWasAgent = true;
      continue;
    }
    lastWasAgent = false;
    // '/' and its wildcard form '/*' are both blanket disallows (RFC 9309).
    if (field === 'disallow' && (value === '/' || value === '/*')) {
      if (currentAgents.includes('*')) out.blocksAll = true;
      if (currentAgents.some((a) => a.includes(uaToken.toLowerCase()))) out.blocksObservatory = true;
    }
  }
  return out;
}

/**
 * Reduce a URL or hostname to a lowercase registrable-ish domain: strips
 * scheme/path/port and the common docs-y subdomains (www, docs, developers…)
 * so probes land where robots.txt + llms.txt actually live.
 * Returns null for IPs, localhost, and unparseable input.
 */
export function normalizeApexDomain(input) {
  if (!input || typeof input !== 'string') return null;
  let host;
  try {
    host = new URL(input.includes('://') ? input : `https://${input}`).hostname.toLowerCase();
  } catch {
    return null;
  }
  if (/^[\d.]+$/.test(host) || host.includes(':') || host === 'localhost') return null;
  const parts = host.split('.');
  if (parts.length < 2) return null;
  const subPrefixes = ['www', 'developers', 'developer', 'docs', 'support', 'help', 'about', 'platform'];
  while (parts.length > 2 && subPrefixes.includes(parts[0])) parts.shift();
  return parts.join('.');
}

/**
 * One-hop discovery: pull candidate domains out of a validated agents.json
 * body. Walks every string value for URLs, apex-normalizes, dedupes, and
 * drops the scanned domain itself + anything in `known`.
 */
export function extractHopDomains(agentsJsonBody, selfDomain, known = new Set(), max = 3) {
  let parsed;
  try {
    parsed = JSON.parse(agentsJsonBody);
  } catch {
    return [];
  }
  const found = [];
  const seen = new Set();
  const walk = (node) => {
    if (found.length >= max) return;
    if (typeof node === 'string') {
      for (const match of node.matchAll(/https?:\/\/[^\s"'<>)\]]+/g)) {
        const apex = normalizeApexDomain(match[0]);
        if (!apex || apex === selfDomain || known.has(apex) || seen.has(apex)) continue;
        seen.add(apex);
        found.push(apex);
        if (found.length >= max) return;
      }
      return;
    }
    if (Array.isArray(node)) {
      for (const item of node) walk(item);
      return;
    }
    if (node && typeof node === 'object') {
      for (const value of Object.values(node)) walk(value);
    }
  };
  walk(parsed);
  return found;
}

/**
 * Diff two scan records for one domain and emit change events.
 * `prev` may be null (first scan) — the caller emits domain-added itself,
 * so a first scan produces no events here.
 * Event shape: { t, day, domain, kind, probeId?, prevScore?, newScore?, detail }.
 */
export function diffScans(prev, next, now) {
  if (!prev) return [];
  const day = new Date(now).toISOString().slice(0, 10);
  const base = { t: now, day, domain: next.domain };
  const events = [];

  // When either scan is opted out, the non-robots probes were never fetched —
  // absent probes mean "declined to scan", not "stopped serving". Surface
  // diffs would publish false removals (or false adoptions on un-opt-out),
  // so only robots-changed and score-changed speak for opt-out transitions.
  const optedOutInvolved = !!prev.optedOut || !!next.optedOut;

  if (!optedOutInvolved) for (const probe of PROBES) {
    const before = prev.probes?.[probe.id];
    const after = next.probes?.[probe.id];
    const wasValid = !!before?.servedValid;
    const isValid = !!after?.servedValid;
    if (!wasValid && isValid) {
      events.push({ ...base, kind: 'surface-added', probeId: probe.id, detail: `now serves ${probe.path}` });
    } else if (wasValid && !isValid) {
      events.push({ ...base, kind: 'surface-removed', probeId: probe.id, detail: `stopped serving ${probe.path}` });
    } else if (wasValid && isValid && before?.hash && after?.hash && before.hash !== after.hash) {
      events.push({ ...base, kind: 'content-changed', probeId: probe.id, detail: `${probe.path} content changed` });
    }
  }

  const robotsBefore = prev.robots ?? {};
  const robotsAfter = next.robots ?? {};
  if (
    !!robotsBefore.hasAiStanzas !== !!robotsAfter.hasAiStanzas ||
    !!robotsBefore.blocksAll !== !!robotsAfter.blocksAll ||
    !!robotsBefore.blocksObservatory !== !!robotsAfter.blocksObservatory
  ) {
    events.push({ ...base, kind: 'robots-changed', detail: `robots.txt AI directives changed` });
  }

  if (prev.score !== next.score) {
    events.push({
      ...base,
      kind: 'score-changed',
      prevScore: prev.score,
      newScore: next.score,
      detail: `score ${prev.score} → ${next.score}`,
    });
  }

  return events;
}
