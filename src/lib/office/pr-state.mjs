const API = 'https://api.github.com/repos/mhoydich/pointcast';
const WEB = 'https://github.com/mhoydich/pointcast';
const sha = value => typeof value === 'string' && /^[a-f0-9]{40}$/.test(value);
const time = value => typeof value === 'string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{3})?Z$/.test(value) ? Date.parse(value) : NaN;

// No authentication, ambient credentials, redirects, retries, or background work.
async function get(number, fetcher, clock, maxAgeMs) {
  const controller = new AbortController();
  const deadline = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetcher(`${API}/pulls/${number}`, {
      method: 'GET', credentials: 'omit', redirect: 'error', cache: 'no-store',
      headers: { Accept: 'application/vnd.github+json' }, signal: controller.signal,
    });
    if (!response.ok) throw new Error('http_error');
    const date = Date.parse(response.headers.get('date'));
    const now = clock();
    if (!Number.isFinite(date) || date > now) throw new Error('invalid_observation_time');
    if (now - date > maxAgeMs) throw new Error('stale_response');
    const reader = response.body.getReader();
    const chunks = []; let size = 0;
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > 262144) { await reader.cancel(); throw new Error('oversize_response'); }
        chunks.push(value);
      }
    } finally { reader.releaseLock(); }
    const bytes = new Uint8Array(size); let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
    let pr;
    try { pr = JSON.parse(new TextDecoder().decode(bytes)); } catch { throw new Error('invalid_json'); }
    if (pr?.number !== number || pr?.base?.repo?.full_name !== 'mhoydich/pointcast' || !sha(pr?.head?.sha)) throw new Error('invalid_pr');
    return pr;
  } finally { clearTimeout(deadline); }
}
const known = new Set(['http_error', 'invalid_observation_time', 'stale_response', 'oversize_response', 'invalid_json', 'invalid_pr', 'head_changed', 'contradictory_state']);

export async function readPrStates({ prs, fetcher = fetch, now = Date.now(), maxAgeMs = 120000 } = {}) {
  const result = { schema: 'pointcast.office-data/v1', state: 'idle', observedAt: null,
    sourceUrl: `${WEB}/pulls`, data: { pullRequests: [] }, errors: [] };
  if (!Array.isArray(prs) || prs.length > 20 || prs.some(n => !Number.isSafeInteger(n) || n < 1) || !Number.isFinite(now) || !Number.isFinite(maxAgeMs) || maxAgeMs < 0 || maxAgeMs > 120000 || !Number.isFinite(new Date(now).getTime())) {
    return { ...result, state: 'error', errors: ['invalid_input'] };
  }
  const started = performance.now();
  const clock = () => now + Math.max(0, performance.now() - started);
  for (const number of new Set(prs)) {
    const row = { number, url: `${WEB}/pull/${number}`, headSha: null, state: 'unknown', blocked: null, mergedAt: null, mergeSha: null, evidence: [], errors: [] };
    try {
      const first = await get(number, fetcher, clock, maxAgeMs);
      const pr = await get(number, fetcher, clock, maxAgeMs);
      if (first.head.sha !== pr.head.sha) throw new Error('head_changed');
      row.headSha = pr.head.sha;
      const merged = p => p.merged === true && p.state === 'closed' && p.draft === false && sha(p.merge_commit_sha) && Number.isFinite(time(p.merged_at)) && time(p.merged_at) <= clock();
      if (pr.merged === true || first.merged === true) {
        if (!merged(first) || !merged(pr) || first.merged_at !== pr.merged_at || first.merge_commit_sha !== pr.merge_commit_sha) throw new Error('contradictory_state');
        row.state = 'merged'; row.mergedAt = pr.merged_at; row.mergeSha = pr.merge_commit_sha;
        row.evidence.push({ type: 'merged', headSha: row.headSha, sourceUrl: `${API}/pulls/${number}`, mergedAt: row.mergedAt, mergeSha: row.mergeSha });
      } else {
        if ([first, pr].some(p => p.merged !== false || p.merged_at !== null || !['open', 'closed'].includes(p.state) || typeof p.draft !== 'boolean') || first.state !== pr.state || first.draft !== pr.draft) throw new Error('contradictory_state');
        row.state = pr.state === 'closed' ? 'closed' : pr.draft ? 'draft' : 'open';
        if (pr.state === 'open' && [first, pr].every(p => p.mergeable === false && p.mergeable_state === 'dirty')) {
          row.blocked = true;
          row.evidence.push({ type: 'conflict', headSha: row.headSha, sourceUrl: `${API}/pulls/${number}` });
        }
      }
    } catch (error) {
      const code = known.has(error?.message) ? error.message : 'request_failed';
      row.state = 'unknown'; row.blocked = null; row.evidence = []; row.errors.push(code);
      result.errors.push(`pr_${number}:${code}`);
    }
    result.data.pullRequests.push(row);
  }
  result.state = result.errors.length ? (result.errors.every(e => e.endsWith(':stale_response')) ? 'stale' : 'error') : prs.length ? 'ok' : 'idle';
  if (result.state === 'ok') result.observedAt = new Date(clock()).toISOString();
  return result;
}
