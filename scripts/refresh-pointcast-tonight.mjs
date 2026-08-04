import { writeFile } from 'node:fs/promises';

const USER_AGENT = 'PointCastTonight/1.0 (+https://pointcast.xyz/tonight; editorial candidate refresh)';
const OUTPUT = process.argv.find((arg) => arg.startsWith('--output='))?.slice(9)
  || '/tmp/pointcast-tonight-candidate.json';

const sources = [
  {
    id: 'lacma-weekly',
    url: 'https://www.lacma.org/event-calendar-weekly/2026-08-03',
    robots: 'https://www.lacma.org/robots.txt',
    path: '/event-calendar-weekly/2026-08-03',
    automation: 'allowed',
    parser: parseLacma,
  },
  {
    id: 'torrance-summer-nights',
    url: 'https://www.torranceca.gov/Our-Community/Citywide-Special-Events/Special-Events/Torrance-Summer-Nights',
    robots: 'https://www.torranceca.gov/robots.txt',
    path: '/Our-Community/Citywide-Special-Events/Special-Events/Torrance-Summer-Nights',
    automation: 'allowed',
    parser: parseTorrance,
  },
  {
    id: 'manhattan-beach-calendar',
    url: 'https://www.manhattanbeach.gov/residents/city-calendar-month-view/-curm-8/-cury-2026',
    automation: 'manual-only',
  },
  {
    id: 'la-cityview',
    url: 'https://lacity.gov/tv/schedule',
    automation: 'manual-only',
  },
];

function text(value = '') {
  return value
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&#039;|&apos;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function robotsAllows(robotsText, path) {
  const groups = robotsText.split(/(?=^user-agent:)/gim);
  const group = groups.find((entry) => /^user-agent:\s*\*/im.test(entry));
  if (!group) return { allowed: false, reason: 'No User-agent: * group found; fail closed.' };
  const rules = [...group.matchAll(/^(allow|disallow):\s*(.*)$/gim)]
    .map((match) => ({ kind: match[1].toLowerCase(), value: match[2].trim() }))
    .filter((rule) => rule.value && path.startsWith(rule.value))
    .sort((a, b) => b.value.length - a.value.length);
  if (!rules.length) return { allowed: true, reason: 'No matching disallow rule.' };
  return { allowed: rules[0].kind === 'allow', reason: `${rules[0].kind}: ${rules[0].value}` };
}

async function fetchText(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT, Accept: 'text/html,text/plain;q=0.9,*/*;q=0.5' },
      redirect: 'follow',
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

function parseLacma(html) {
  const cards = html.split(/<div class="card-event\b/).slice(1);
  return cards.map((card) => {
    const nameBlock = card.match(/card-event__name[\s\S]*?<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
    const dateBlock = card.match(/card-event__date[\s\S]*?<span>(.*?)<\/span>\s*\|\s*<span>(.*?)<\/span>/i);
    if (!nameBlock || !dateBlock) return null;
    return {
      title: text(nameBlock[2]),
      url: nameBlock[1],
      dateLabel: text(dateBlock[1]),
      timeLabel: text(dateBlock[2]),
    };
  }).filter(Boolean);
}

function parseTorrance(html) {
  const links = [...html.matchAll(/<a[^>]+href="([^"]*\/Our-Community\/Events\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)];
  const seen = new Set();
  return links.map((match) => {
    const title = text(match[2]);
    const url = new URL(match[1], 'https://www.torranceca.gov').href;
    if (!title || seen.has(url)) return null;
    seen.add(url);
    return { title, url };
  }).filter(Boolean);
}

const candidate = {
  generatedAt: new Date().toISOString(),
  generatedBy: USER_AGENT,
  promotion: 'candidate-only; human review required; never auto-published',
  sources: [],
};

for (const source of sources) {
  if (source.automation !== 'allowed') {
    candidate.sources.push({ id: source.id, url: source.url, status: 'skipped', reason: 'manual-only source; no bypass attempted' });
    continue;
  }

  try {
    const robotsText = await fetchText(source.robots);
    const decision = robotsAllows(robotsText, source.path);
    if (!decision.allowed) {
      candidate.sources.push({ id: source.id, url: source.url, status: 'skipped', reason: `robots denied: ${decision.reason}` });
      continue;
    }
    const html = await fetchText(source.url);
    const discoveries = source.parser(html);
    candidate.sources.push({ id: source.id, url: source.url, status: 'read', robots: decision.reason, discoveries });
  } catch (error) {
    candidate.sources.push({ id: source.id, url: source.url, status: 'error', reason: error instanceof Error ? error.message : String(error) });
  }
}

await writeFile(OUTPUT, `${JSON.stringify(candidate, null, 2)}\n`, 'utf8');
console.log(`PointCast Tonight candidate written to ${OUTPUT}`);
for (const source of candidate.sources) {
  console.log(`${source.id}: ${source.status}${source.discoveries ? ` · ${source.discoveries.length} discoveries` : ''}${source.reason ? ` · ${source.reason}` : ''}`);
}
