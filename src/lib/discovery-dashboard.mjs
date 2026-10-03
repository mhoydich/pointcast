/** Public, deterministic helpers for the frozen discovery dashboard. */
export const CATEGORIES = [
  { id: 'seo', label: 'Technical SEO', short: 'SEO', description: 'Can search engines discover and read the public pages?' },
  { id: 'agents', label: 'Agent discovery', short: 'Agents', description: 'Can software find useful, documented entry points?' },
  { id: 'bots', label: 'Bot access', short: 'Bots', description: 'What do declared rules and synthetic requests reveal?' },
  { id: 'geo', label: 'AI search readiness', short: 'GEO', description: 'Is there readable evidence for generative search to use?' },
];

export const STATUS_LABELS = {
  pass: 'Pass', fail: 'Issue', warn: 'Review', expected: 'Expected', unmeasured: 'Unmeasured',
};
export const SEVERITY_LABELS = { high: 'High priority', medium: 'Medium priority', low: 'Low priority', info: 'Observation' };
const severityOrder = { high: 0, medium: 1, low: 2, info: 3 };

export function sortFindings(findings = []) {
  return [...findings].sort((a, b) => (severityOrder[a.severity] ?? 3) - (severityOrder[b.severity] ?? 3));
}

export function isActionable(record) {
  return ['fail', 'warn'].includes(record.status) && record.severity !== 'info';
}

export function matchesFilters(record, { category = 'all', status = 'all', query = '', actionable = false } = {}) {
  if (category !== 'all' && record.category !== category) return false;
  if (status !== 'all' && record.status !== status) return false;
  if (actionable && !isActionable(record)) return false;
  const haystack = typeof record.search === 'string' ? record.search : JSON.stringify(record);
  return haystack.toLocaleLowerCase('en').includes(query.trim().toLocaleLowerCase('en'));
}

export function snapshotAge(completedAt, now = Date.now()) {
  const completed = Date.parse(completedAt);
  if (!Number.isFinite(completed)) return { label: 'Check time unavailable', stale: true };
  const days = Math.max(0, Math.floor((now - completed) / 86_400_000));
  return { label: days === 0 ? 'Checked today' : `${days} day${days === 1 ? '' : 's'} since check`, stale: days >= 7 };
}

/** Quote all fields, preserve newlines, and neutralize spreadsheet formulas. */
export function csvCell(value) {
  let string = value == null ? '' : String(value);
  if (/^[\s]*[=+@-]/.test(string) || /^[\t\r]/.test(string)) string = `'${string}`;
  return `"${string.replaceAll('"', '""')}"`;
}

export function isBotRequest(bot) {
  return typeof bot.userAgent === 'string' && bot.userAgent.trim().length > 0;
}

export function botHttpLabel(bot) {
  if (!isBotRequest(bot)) return 'Not sent';
  return typeof bot.httpStatus === 'number' && bot.httpStatus > 0 ? String(bot.httpStatus) : 'No response';
}

export function filteredCsv(audit, filters = {}) {
  const siteUrl = typeof audit.site === 'string' ? audit.site : audit.site?.url || 'https://pointcast.xyz';
  const rows = [['Record type', 'ID / route', 'Category', 'Status', 'HTTP status', 'Severity', 'Title / kind', 'Observed', 'Evidence URL', 'Recommendation', 'Checked at']];
  for (const finding of sortFindings(audit.findings)) {
    if (!matchesFilters(finding, filters)) continue;
    rows.push(['finding', finding.id, finding.category, finding.status, '', finding.severity, finding.title,
      (finding.evidence || []).map((item) => item.observed).join('\n'), (finding.evidence || []).map((item) => item.url).join('\n'), finding.recommendation, audit.completedAt]);
  }
  for (const route of audit.routes || []) {
    if (!matchesFilters(route, filters)) continue;
    rows.push(['route', route.path, route.category, route.status, route.httpStatus, '', route.kind,
      (route.checks || []).map((item) => `${item.label}: ${item.observed}`).join('\n'), route.url, '', route.checkedAt]);
  }
  for (const bot of audit.botChecks || []) {
    if (!matchesFilters({ ...bot, category: 'bots' }, filters)) continue;
    rows.push([isBotRequest(bot) ? 'bot probe' : 'bot policy', bot.path, 'bots', bot.status, botHttpLabel(bot), '', bot.name, bot.observed, new URL(bot.path, siteUrl).href, '', bot.checkedAt]);
  }
  return `\uFEFF${rows.map((row) => row.map(csvCell).join(',')).join('\r\n')}\r\n`;
}
