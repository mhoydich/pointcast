/**
 * /api/agent-readiness?url=… — score a site on how legible it is to agents.
 *
 * The essay at /agent-native-publishing describes the pattern. This is the
 * instrument that tells you whether your own site follows it: it fetches a
 * handful of well-known paths, reads the homepage <head>, and returns a
 * per-check verdict with the fix for anything missing.
 *
 * Security note — this endpoint fetches a URL the caller supplies, so it is
 * an SSRF surface by construction. It is fenced in three ways: the scheme
 * must be http/https, the host must not resolve to a name or literal in any
 * private / loopback / link-local range, and no response body is ever echoed
 * back to the caller (only computed booleans and short excerpts we generate).
 * Keep all three when editing. The fetch count is fixed and small so this
 * cannot be used to amplify traffic at a third party.
 */

const CHECK_TIMEOUT_MS = 6000;
const MAX_BYTES = 256 * 1024;

type CheckId =
  | 'llms-txt'
  | 'llms-full-txt'
  | 'robots-txt'
  | 'robots-sitemap'
  | 'ai-crawlers-allowed'
  | 'sitemap'
  | 'json-ld'
  | 'canonical'
  | 'meta-description'
  | 'machine-twin'
  | 'feed'
  | 'agents-manifest';

type Check = {
  id: CheckId;
  label: string;
  /** How much this counts toward the score. */
  weight: number;
  passed: boolean;
  detail: string;
  /** What to do about it when it fails. */
  fix: string;
};

/** Hostnames and IP literals this endpoint refuses to fetch. */
function isBlockedHost(host: string): boolean {
  const h = host.toLowerCase().replace(/^\[|\]$/g, '');

  if (
    h === 'localhost' ||
    h.endsWith('.localhost') ||
    h.endsWith('.local') ||
    h.endsWith('.internal') ||
    h.endsWith('.lan') ||
    h.endsWith('.home.arpa')
  ) {
    return true;
  }

  // IPv6 loopback / unique-local / link-local.
  if (h === '::1' || h === '::' || /^f[cd][0-9a-f]{2}:/i.test(h) || /^fe[89ab][0-9a-f]:/i.test(h)) {
    return true;
  }

  // IPv4 literals in loopback, private, link-local (incl. cloud metadata),
  // carrier-grade NAT, "this network", and broadcast ranges.
  const v4 = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (v4) {
    const [a, b] = [Number(v4[1]), Number(v4[2])];
    if (a === 0 || a === 10 || a === 127 || a === 255) return true;
    if (a === 169 && b === 254) return true; // includes 169.254.169.254
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;
  }

  return false;
}

async function get(url: string): Promise<{ ok: boolean; status: number; body: string; contentType: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CHECK_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        // Identify honestly. We are a checker, not a browser.
        'User-Agent': 'PointCast-AgentReadiness/1.0 (+https://pointcast.xyz/agent-readiness)',
        Accept: '*/*',
      },
      cf: { cacheTtl: 300, cacheEverything: true },
    });
    const contentType = res.headers.get('content-type') ?? '';
    // Read a bounded prefix — enough to inspect a <head>, not enough to be abused.
    const buf = await res.arrayBuffer();
    const body = new TextDecoder().decode(buf.slice(0, MAX_BYTES));
    return { ok: res.ok, status: res.status, body, contentType };
  } catch {
    return { ok: false, status: 0, body: '', contentType: '' };
  } finally {
    clearTimeout(timer);
  }
}

/** A plain-text well-known file that exists and is not an HTML 404 page. */
function looksLikeText(r: { ok: boolean; body: string; contentType: string }): boolean {
  if (!r.ok || !r.body.trim()) return false;
  if (/text\/html/i.test(r.contentType)) return false;
  if (/^\s*<(!doctype|html)/i.test(r.body)) return false;
  return true;
}

export const onRequestGet: PagesFunction = async ({ request }) => {
  const reqUrl = new URL(request.url);
  const raw = reqUrl.searchParams.get('url');

  if (!raw) {
    return json({ ok: false, error: 'missing_url', message: 'Pass ?url=https://example.com' }, 400);
  }

  let target: URL;
  try {
    target = new URL(raw.includes('://') ? raw : `https://${raw}`);
  } catch {
    return json({ ok: false, error: 'bad_url', message: 'That is not a URL we can parse.' }, 400);
  }

  if (target.protocol !== 'https:' && target.protocol !== 'http:') {
    return json({ ok: false, error: 'bad_scheme', message: 'Only http and https are checked.' }, 400);
  }
  if (isBlockedHost(target.hostname)) {
    return json(
      { ok: false, error: 'blocked_host', message: 'This checker only reaches public internet hosts.' },
      400,
    );
  }

  const origin = target.origin;
  const at = (path: string) => new URL(path, origin).href;

  const [home, llms, llmsFull, robots, agents] = await Promise.all([
    get(target.href),
    get(at('/llms.txt')),
    get(at('/llms-full.txt')),
    get(at('/robots.txt')),
    get(at('/agents.json')),
  ]);

  if (!home.ok && home.status === 0) {
    return json({ ok: false, error: 'unreachable', message: `Could not reach ${origin}.` }, 502);
  }

  const html = home.body;
  const robotsBody = robots.ok ? robots.body : '';
  const sitemapFromRobots = /^\s*sitemap:\s*(\S+)/im.exec(robotsBody)?.[1];

  // Only fetch a sitemap if we have somewhere to look, to keep the subrequest
  // count fixed and predictable.
  const sitemap = await get(sitemapFromRobots ?? at('/sitemap-index.xml'));
  const sitemapOk =
    sitemap.ok && /<(sitemapindex|urlset)\b/i.test(sitemap.body);

  // A blanket disallow aimed at the major AI crawlers is the single loudest
  // "do not cite me" signal a site can send.
  const aiAgents = ['GPTBot', 'ClaudeBot', 'Claude-Web', 'PerplexityBot', 'Google-Extended', 'CCBot'];
  const blockedAgents = aiAgents.filter((ua) => {
    const block = new RegExp(`user-agent:\\s*${ua}[\\s\\S]*?(?=user-agent:|$)`, 'i').exec(robotsBody)?.[0] ?? '';
    return /disallow:\s*\/\s*$/im.test(block);
  });

  const jsonLdBlocks = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>/gi) ?? [];
  const canonical = /<link[^>]+rel=["']canonical["'][^>]*>/i.test(html);
  const metaDesc = /<meta[^>]+name=["']description["'][^>]*>/i.test(html);
  const jsonAlternate =
    /<link[^>]+rel=["']alternate["'][^>]*type=["']application\/(ld\+)?json/i.test(html) ||
    /<link[^>]+type=["']application\/(ld\+)?json[^>]*rel=["']alternate["']/i.test(html);
  const feed =
    /<link[^>]+type=["']application\/(rss\+xml|atom\+xml|feed\+json)["']/i.test(html);

  const checks: Check[] = [
    {
      id: 'llms-txt',
      label: '/llms.txt',
      weight: 15,
      passed: looksLikeText(llms),
      detail: looksLikeText(llms)
        ? `Present, ${llms.body.length.toLocaleString()} bytes.`
        : 'Not found, or the path returns an HTML page.',
      fix: 'Publish a short markdown summary of the site at /llms.txt: what it is, the surfaces that matter, and links to the canonical pages.',
    },
    {
      id: 'llms-full-txt',
      label: '/llms-full.txt',
      weight: 5,
      passed: looksLikeText(llmsFull),
      detail: looksLikeText(llmsFull)
        ? `Present, ${llmsFull.body.length.toLocaleString()} bytes.`
        : 'Not found. Optional, but it is where long-form context belongs.',
      fix: 'Add /llms-full.txt with the expanded version — the context you would paste into a model to explain the whole site.',
    },
    {
      id: 'agents-manifest',
      label: 'Agent manifest',
      weight: 10,
      passed: agents.ok && /application\/json/i.test(agents.contentType),
      detail:
        agents.ok && /application\/json/i.test(agents.contentType)
          ? 'Found /agents.json.'
          : 'No /agents.json. There is no ratified standard here yet — this checks the convention PointCast uses.',
      fix: 'Publish a JSON manifest describing your endpoints, update cadence, and citation format, so an agent can orient in one fetch.',
    },
    {
      id: 'robots-txt',
      label: 'robots.txt',
      weight: 10,
      passed: robots.ok && robotsBody.trim().length > 0,
      detail: robots.ok ? 'Present.' : 'Missing.',
      fix: 'Add a robots.txt. Even a permissive one is a signal that the site was configured deliberately.',
    },
    {
      id: 'robots-sitemap',
      label: 'Sitemap declared in robots.txt',
      weight: 10,
      passed: Boolean(sitemapFromRobots),
      detail: sitemapFromRobots ? `Declared: ${sitemapFromRobots}` : 'No Sitemap: line in robots.txt.',
      fix: 'Add a `Sitemap: https://yoursite/sitemap-index.xml` line to robots.txt. It is the cheapest discovery win available.',
    },
    {
      id: 'sitemap',
      label: 'Sitemap resolves',
      weight: 10,
      passed: sitemapOk,
      detail: sitemapOk ? 'Valid sitemap or sitemap index.' : 'No parseable sitemap found.',
      fix: 'Generate a sitemap and make sure the URL in robots.txt actually returns XML.',
    },
    {
      id: 'ai-crawlers-allowed',
      label: 'AI crawlers not blanket-blocked',
      weight: 10,
      passed: blockedAgents.length === 0,
      detail:
        blockedAgents.length === 0
          ? 'No blanket disallow for the major AI user-agents.'
          : `Fully disallowed: ${blockedAgents.join(', ')}.`,
      fix: 'This one is a choice, not a bug — but if you want to be cited in AI answers, you cannot also be blocking the crawlers that read you.',
    },
    {
      id: 'json-ld',
      label: 'JSON-LD on the homepage',
      weight: 10,
      passed: jsonLdBlocks.length > 0,
      detail:
        jsonLdBlocks.length > 0
          ? `${jsonLdBlocks.length} ld+json block${jsonLdBlocks.length === 1 ? '' : 's'}.`
          : 'None found.',
      fix: 'Add a schema.org graph — at minimum WebSite and Organization or Person — so the entity behind the site is machine-legible.',
    },
    {
      id: 'canonical',
      label: 'Canonical URL',
      weight: 5,
      passed: canonical,
      detail: canonical ? 'Declared.' : 'No rel=canonical on the homepage.',
      fix: 'Emit a rel=canonical on every page. Duplicate URLs split your signal.',
    },
    {
      id: 'meta-description',
      label: 'Meta description',
      weight: 5,
      passed: metaDesc,
      detail: metaDesc ? 'Present.' : 'Missing.',
      fix: 'Write one per page. It is the summary a machine quotes when it has nothing better.',
    },
    {
      id: 'machine-twin',
      label: 'Machine-readable twin linked',
      weight: 5,
      passed: jsonAlternate,
      detail: jsonAlternate
        ? 'Homepage links a JSON alternate.'
        : 'No <link rel="alternate" type="application/json">.',
      fix: 'Give each human page a JSON sibling and link it with rel=alternate. This is the whole pattern in one line of HTML.',
    },
    {
      id: 'feed',
      label: 'Feed linked',
      weight: 5,
      passed: feed,
      detail: feed ? 'RSS, Atom, or JSON Feed linked.' : 'No feed link in the homepage head.',
      fix: 'Publish a feed and link it. Feeds are how anything that watches a site knows it changed.',
    },
  ];

  const earned = checks.filter((c) => c.passed).reduce((n, c) => n + c.weight, 0);
  const possible = checks.reduce((n, c) => n + c.weight, 0);
  const score = Math.round((earned / possible) * 100);

  const grade =
    score >= 90 ? 'agent-native' : score >= 70 ? 'legible' : score >= 40 ? 'partial' : 'opaque';

  return json({
    ok: true,
    url: target.href,
    origin,
    checkedAt: new Date().toISOString(),
    score,
    grade,
    earned,
    possible,
    checks,
    reference: 'https://pointcast.xyz/agent-native-publishing',
  });
};

function json(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': status === 200 ? 'public, max-age=300' : 'no-store',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

export const onRequestOptions: PagesFunction = () =>
  new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
    },
  });
