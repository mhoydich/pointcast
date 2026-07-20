/**
 * Tests for src/lib/observatory-score.mjs — the Agent-Web Observatory rubric.
 *
 * Coverage:
 *  - Weights sum to 100 and every probe maps to a real group
 *  - agents.json dual-location max logic (either location earns the 20)
 *  - Validators reject SPA HTML masquerading as JSON/text surfaces
 *  - feed-json / feed-xml sniffing
 *  - robots parsing: AI stanzas, blanket blocks, observatory opt-out
 *  - diffScans emits exactly the expected events across transitions
 *  - apex normalization + one-hop extraction bounds
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');

const {
  SCORE_GROUPS,
  PROBES,
  validateProbeBody,
  scoreProbes,
  parseRobotsAiDirectives,
  normalizeApexDomain,
  extractHopDomains,
  diffScans,
} = await import(path.join(REPO_ROOT, 'src/lib/observatory-score.mjs'));

const { OBSERVATORY_SEEDS, CRAWLER_OPERATOR_DOMAINS, MAX_DOMAINS } = await import(
  path.join(REPO_ROOT, 'src/lib/observatory-seeds.mjs')
);

// ─── Rubric shape ────────────────────────────────────────────────────────────

test('score group weights sum to exactly 100', () => {
  const total = Object.values(SCORE_GROUPS).reduce((a, b) => a + b, 0);
  assert.equal(total, 100);
});

test('every probe maps to a defined group; every group has a probe', () => {
  for (const probe of PROBES) {
    assert.ok(SCORE_GROUPS[probe.group] !== undefined, `probe ${probe.id} has unknown group ${probe.group}`);
  }
  for (const group of Object.keys(SCORE_GROUPS)) {
    assert.ok(PROBES.some((p) => p.group === group), `group ${group} has no probes`);
  }
});

test('probe ids and paths are unique', () => {
  assert.equal(new Set(PROBES.map((p) => p.id)).size, PROBES.length);
  assert.equal(new Set(PROBES.map((p) => p.path)).size, PROBES.length);
});

// ─── Scoring ─────────────────────────────────────────────────────────────────

const allValid = () =>
  Object.fromEntries(PROBES.map((p) => [p.id, { servedValid: true }]));

test('all surfaces valid scores 100', () => {
  assert.equal(scoreProbes(allValid()).score, 100);
});

test('no surfaces valid scores 0 with a full breakdown', () => {
  const { score, breakdown } = scoreProbes({});
  assert.equal(score, 0);
  assert.equal(Object.keys(breakdown).length, Object.keys(SCORE_GROUPS).length);
  for (const row of Object.values(breakdown)) {
    assert.equal(row.earned, 0);
    assert.equal(row.via, null);
  }
});

test('agents group: either location earns the full 20, both do not double', () => {
  const rootOnly = scoreProbes({ agentsJson: { servedValid: true } });
  assert.equal(rootOnly.score, 20);
  assert.equal(rootOnly.breakdown.agents.via, 'agentsJson');

  const wellKnownOnly = scoreProbes({ wellKnownAgents: { servedValid: true } });
  assert.equal(wellKnownOnly.score, 20);
  assert.equal(wellKnownOnly.breakdown.agents.via, 'wellKnownAgents');

  const both = scoreProbes({
    agentsJson: { servedValid: true },
    wellKnownAgents: { servedValid: true },
  });
  assert.equal(both.score, 20);
});

// ─── Validators ──────────────────────────────────────────────────────────────

test('json validator rejects SPA HTML served for unknown paths', () => {
  assert.equal(validateProbeBody('json', '<!doctype html><html>…', 'text/html', true), false);
  assert.equal(validateProbeBody('json', '{"name":"x"}', 'text/html', true), false);
  assert.equal(validateProbeBody('json', 'not json', 'application/json', true), false);
  assert.equal(validateProbeBody('json', '{"name":"x"}', 'application/json', true), true);
  assert.equal(validateProbeBody('json', '{"name":"x"}', 'application/json', false), false);
});

test('text-llms validator wants real llms.txt shape, not an HTML shell', () => {
  assert.equal(validateProbeBody('text-llms', '# Site\n> about\nhttps://a.example/x', 'text/plain', true), true);
  assert.equal(validateProbeBody('text-llms', '<html><body>404</body></html>', 'text/html', true), false);
  assert.equal(validateProbeBody('text-llms', 'short', 'text/plain', true), false);
});

test('feed-json validator requires a JSON Feed shape', () => {
  assert.equal(
    validateProbeBody('feed-json', '{"version":"https://jsonfeed.org/version/1.1","items":[]}', 'application/feed+json', true),
    true,
  );
  assert.equal(validateProbeBody('feed-json', '{"unrelated":true}', 'application/json', true), false);
  assert.equal(validateProbeBody('feed-json', '"just a string"', 'application/json', true), false);
});

test('feed-xml validator sniffs rss/atom and rejects HTML shells', () => {
  assert.equal(validateProbeBody('feed-xml', '<?xml version="1.0"?><rss version="2.0"><channel/></rss>', 'application/rss+xml', true), true);
  assert.equal(validateProbeBody('feed-xml', '<feed xmlns="http://www.w3.org/2005/Atom"></feed>', 'application/atom+xml', true), true);
  assert.equal(validateProbeBody('feed-xml', '<html><head></head><body>app</body></html>', 'text/html', true), false);
});

test('robots-ai validator requires a named AI crawler', () => {
  assert.equal(validateProbeBody('robots-ai', 'User-agent: GPTBot\nDisallow: /', 'text/plain', true), true);
  assert.equal(validateProbeBody('robots-ai', 'User-agent: *\nDisallow:', 'text/plain', true), false);
});

// ─── robots directives / opt-out gate ───────────────────────────────────────

test('parseRobotsAiDirectives detects AI stanzas + blanket block', () => {
  const r = parseRobotsAiDirectives('User-agent: GPTBot\nDisallow: /\n\nUser-agent: *\nDisallow: /');
  assert.equal(r.hasAiStanzas, true);
  assert.equal(r.blocksAll, true);
  assert.equal(r.blocksObservatory, false);
});

test('parseRobotsAiDirectives detects an observatory-specific opt-out', () => {
  const r = parseRobotsAiDirectives('User-agent: pointcast-observatory\nDisallow: /');
  assert.equal(r.blocksObservatory, true);
  assert.equal(r.blocksAll, false);
});

test('parseRobotsAiDirectives: partial disallows are not a block', () => {
  const r = parseRobotsAiDirectives('User-agent: *\nDisallow: /admin\nAllow: /');
  assert.equal(r.blocksAll, false);
});

test('parseRobotsAiDirectives: grouped user-agents share the record', () => {
  const r = parseRobotsAiDirectives('User-agent: somebot\nUser-agent: *\nDisallow: /');
  assert.equal(r.blocksAll, true);
});

// ─── Apex + hop extraction ───────────────────────────────────────────────────

test('normalizeApexDomain strips scheme, path, and docs-y subdomains', () => {
  assert.equal(normalizeApexDomain('https://developers.google.com/search/docs'), 'google.com');
  assert.equal(normalizeApexDomain('www.example.com'), 'example.com');
  assert.equal(normalizeApexDomain('https://docs.perplexity.ai/guides'), 'perplexity.ai');
  assert.equal(normalizeApexDomain('sub.deep.example.co.uk'), 'sub.deep.example.co.uk');
  assert.equal(normalizeApexDomain('127.0.0.1'), null);
  assert.equal(normalizeApexDomain('localhost'), null);
  assert.equal(normalizeApexDomain(''), null);
});

test('extractHopDomains finds linked domains, skips self + known, respects max', () => {
  const body = JSON.stringify({
    name: 'Example',
    homepage: 'https://example.com/',
    peers: ['https://alpha.example.org/agents.json', 'https://beta.dev/x'],
    docs: { link: 'https://gamma.io', dup: 'https://alpha.example.org/other' },
    more: 'https://delta.net https://epsilon.ai',
  });
  const hops = extractHopDomains(body, 'example.com', new Set(['beta.dev']), 3);
  assert.deepEqual(hops, ['alpha.example.org', 'gamma.io', 'delta.net']);
});

test('extractHopDomains returns [] for invalid JSON', () => {
  assert.deepEqual(extractHopDomains('not json', 'x.com'), []);
});

// ─── diffScans ───────────────────────────────────────────────────────────────

const NOW = Date.UTC(2026, 6, 20, 12, 0, 0);

function record(domain, probes, score, robots = {}) {
  return { domain, probes, score, robots };
}

test('diffScans: first scan (prev=null) emits nothing', () => {
  assert.deepEqual(diffScans(null, record('a.com', {}, 0), NOW), []);
});

test('diffScans emits surface-added + score-changed on adoption', () => {
  const prev = record('a.com', { llms: { servedValid: false } }, 0);
  const next = record('a.com', { llms: { servedValid: true, hash: 'abc' } }, 20);
  const events = diffScans(prev, next, NOW);
  const kinds = events.map((e) => e.kind).sort();
  assert.deepEqual(kinds, ['score-changed', 'surface-added']);
  const scoreEvent = events.find((e) => e.kind === 'score-changed');
  assert.equal(scoreEvent.prevScore, 0);
  assert.equal(scoreEvent.newScore, 20);
  assert.equal(events[0].day, '2026-07-20');
});

test('diffScans emits surface-removed on regression', () => {
  const prev = record('a.com', { feedXml: { servedValid: true, hash: 'x' } }, 10);
  const next = record('a.com', { feedXml: { servedValid: false } }, 0);
  const kinds = diffScans(prev, next, NOW).map((e) => e.kind).sort();
  assert.deepEqual(kinds, ['score-changed', 'surface-removed']);
});

test('diffScans emits content-changed only on hash flip of a valid surface', () => {
  const prev = record('a.com', { llms: { servedValid: true, hash: 'aaa' } }, 20);
  const next = record('a.com', { llms: { servedValid: true, hash: 'bbb' } }, 20);
  const events = diffScans(prev, next, NOW);
  assert.equal(events.length, 1);
  assert.equal(events[0].kind, 'content-changed');
});

test('diffScans: identical scans emit nothing', () => {
  const prev = record('a.com', { llms: { servedValid: true, hash: 'aaa' } }, 20, { hasAiStanzas: true });
  const next = record('a.com', { llms: { servedValid: true, hash: 'aaa' } }, 20, { hasAiStanzas: true });
  assert.deepEqual(diffScans(prev, next, NOW), []);
});

test('diffScans emits robots-changed when directives flip', () => {
  const prev = record('a.com', {}, 0, { hasAiStanzas: false, blocksAll: false });
  const next = record('a.com', {}, 0, { hasAiStanzas: true, blocksAll: false });
  const events = diffScans(prev, next, NOW);
  assert.equal(events.length, 1);
  assert.equal(events[0].kind, 'robots-changed');
});

// ─── Seeds sanity ────────────────────────────────────────────────────────────

test('seed roster: unique domains, known categories, includes the control row', () => {
  const domains = OBSERVATORY_SEEDS.map((s) => s.domain);
  assert.equal(new Set(domains).size, domains.length, 'duplicate seed domain');
  assert.ok(domains.length <= MAX_DOMAINS);
  assert.ok(domains.includes('pointcast.xyz'), 'control row missing');
  const categories = new Set(['control', 'ai-lab', 'publisher', 'dev-tool', 'agent-native']);
  for (const seed of OBSERVATORY_SEEDS) {
    assert.ok(categories.has(seed.category), `unknown category ${seed.category}`);
    assert.equal(normalizeApexDomain(seed.domain), seed.domain, `seed ${seed.domain} is not apex-normalized`);
  }
});

test('crawler operator map values are apex-normalized ai:* targets', () => {
  for (const [type, domain] of Object.entries(CRAWLER_OPERATOR_DOMAINS)) {
    assert.ok(type.startsWith('ai:'), `non-AI type ${type}`);
    assert.equal(normalizeApexDomain(domain), domain);
  }
});
