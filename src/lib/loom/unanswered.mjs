const API_PATH = '/api/loom';
const MIN_AGE_MS = 10 * 60 * 1000;
const MAX_LOGS = 520;
const CONCURRENCY = 8;

async function readJson(fetcher, url) {
  const response = await fetcher(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`Loom read failed (${response.status})`);
  return response.json();
}

async function mapLimit(items, limit, fn) {
  const output = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const index = next++;
      output[index] = await fn(items[index]);
    }
  }));
  return output;
}

function isCollator(message) {
  return message?.from?.address === '@collator'
    || (message?.from?.kind === 'robot' && String(message?.from?.name ?? '').toLowerCase() === 'collator');
}

/**
 * Read the Loom directory and recent room logs, then return human messages that
 * have waited at least ten minutes without a reply from anyone except Collator.
 * The public directory is bounded; `coverage` makes that limit visible to hosts.
 */
export async function findUnanswered({ fetcher = fetch, origin = 'https://pointcast.xyz', now = Date.now() } = {}) {
  const directory = await readJson(fetcher, new URL(`${API_PATH}?compact=1`, origin));
  if (!directory?.ok || !Array.isArray(directory.logs)) throw new Error('Loom directory unavailable');
  const logs = directory.logs.slice(0, MAX_LOGS);
  const results = await mapLimit(logs, CONCURRENCY, async (entry) => {
    const data = await readJson(fetcher, new URL(`${API_PATH}?to=${encodeURIComponent(entry.address)}`, origin));
    return { entry, messages: Array.isArray(data.messages) ? data.messages : [] };
  });
  const cutoff = now - MIN_AGE_MS;
  const posts = [];
  for (const { entry, messages } of results) {
    const repliedTo = new Set(messages.filter((message) => message.parent && !isCollator(message)).map((message) => message.parent));
    for (const message of messages) {
      const at = Date.parse(message.at ?? '');
      if (message.from?.kind !== 'human' || !message.id || !Number.isFinite(at) || at > cutoff || repliedTo.has(message.id)) continue;
      posts.push({
        id: message.id,
        address: entry.address,
        room: entry.label || entry.address,
        title: entry.title || null,
        from: message.from?.name || 'Human',
        at: new Date(at).toISOString(),
        body: String(message.body ?? ''),
        url: `${origin}/loom?to=${encodeURIComponent(entry.address)}#${encodeURIComponent(message.id)}`,
      });
    }
  }
  posts.sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
  return {
    generatedAt: new Date(now).toISOString(),
    thresholdMinutes: 10,
    posts,
    coverage: { logsScanned: logs.length, logsListed: directory.logs.length, directoryBounded: directory.logs.length >= MAX_LOGS },
  };
}

export function unansweredText(result) {
  const lines = [
    'PointCast Loom · unanswered human posts',
    `As of ${result.generatedAt}. Only posts at least ${result.thresholdMinutes} minutes old are listed.`,
    'A post is omitted when anyone other than Collator has replied.',
    `Coverage: ${result.coverage.logsScanned}/${result.coverage.logsListed} directory logs scanned${result.coverage.directoryBounded ? ' (directory limit reached; older logs may be missing)' : ''}.`,
    '',
  ];
  if (!result.posts.length) lines.push('No matching posts in the scanned logs.');
  for (const post of result.posts) {
    lines.push(`${post.at} · ${post.from} · ${post.room}`, post.url, post.body.replace(/\s+/g, ' ').trim(), '');
  }
  return `${lines.join('\n').slice(0, 60_000).trimEnd()}\n`;
}

export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}
