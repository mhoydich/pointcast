const REPO = 'mhoydich/pointcast';
const PAGE_SIZE = 20;
const MAX_PAGES = 3;
const SHOW = 3;
export const historyUrl = 'https://github.com/' + REPO + '/pulls?q=is%3Apr+is%3Amerged+base%3Amain';
const pacificDate = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit',
});
const checkedTime = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/Los_Angeles', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
});

export const dayKey = date => pacificDate.format(date);
export const asOf = date => checkedTime.format(date) + ' PT';

function confirmedMerge(pr, today, now) {
  if (pr.base?.repo?.full_name !== REPO || pr.base.ref !== 'main' || pr.state !== 'closed' || pr.draft !== false) return false;
  if (!Number.isSafeInteger(pr.number) || pr.number < 1 || typeof pr.title !== 'string' || !pr.title.trim()) return false;
  if (!/^[0-9a-f]{40}$/.test(pr.merge_commit_sha ?? '')) return false;
  const merged = Date.parse(pr.merged_at);
  return Number.isFinite(merged) && merged <= now.getTime() && dayKey(merged) === today;
}

async function readPage(page, request) {
  const url = new URL('https://api.github.com/repos/' + REPO + '/pulls');
  url.search = new URLSearchParams({
    state: 'closed', base: 'main', sort: 'updated', direction: 'desc', per_page: String(PAGE_SIZE), page: String(page),
  });
  const response = await request(url, { credentials: 'omit', referrerPolicy: 'no-referrer', signal: AbortSignal.timeout(6000) });
  if (!response.ok) throw new Error('GitHub pull requests unavailable');
  const rows = await response.json();
  if (!Array.isArray(rows) || !rows.every(pr => pr && typeof pr.state === 'string' && 'merged_at' in pr)) {
    throw new Error('Unreadable GitHub response');
  }
  return rows;
}

export async function readMergedToday(now = new Date(), request = fetch) {
  const today = dayKey(now);
  const matches = new Map();
  // A PR can be updated after it merges. Show examples, and use update time
  // only to prove we have scanned far enough back to establish an empty day.
  for (let page = 1; page <= MAX_PAGES; page++) {
    let rows;
    try {
      rows = await readPage(page, request);
    } catch (error) {
      if (page === 1) throw error;
      break;
    }
    for (const pr of rows) {
      if (!confirmedMerge(pr, today, now)) continue;
      matches.set(pr.number, { number: pr.number, title: pr.title.trim(), href: 'https://github.com/' + REPO + '/pull/' + pr.number });
      if (matches.size === SHOW) return { items: [...matches.values()], complete: false };
    }
    const lastUpdate = Date.parse(rows.at(-1)?.updated_at);
    if (rows.length < PAGE_SIZE || (Number.isFinite(lastUpdate) && dayKey(lastUpdate) < today)) {
      return { items: [...matches.values()], complete: true };
    }
  }
  return { items: [...matches.values()], complete: false };
}
