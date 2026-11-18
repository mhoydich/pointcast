const day = 24 * 60 * 60 * 1000;
const messageId = /^m_[0-9a-z]{6,24}$/;

export function recentLogs(payload, now = Date.now()) {
  if (payload?.ok !== true || payload.spec !== 'pointcast.loom/v1' ||
      payload.kvBound !== true || payload.exists !== true ||
      payload.log?.address !== '#bonfire' || !/^[0-9a-f]{24}$/.test(payload.log.key) ||
      !Array.isArray(payload.messages)) {
    throw new Error('The Bonfire room is unavailable.');
  }
  if (!Number.isFinite(now)) throw new TypeError('Expected a timestamp in milliseconds.');

  const byId = new Map();
  for (const row of payload.messages) {
    if (typeof row?.id === 'string' && messageId.test(row.id)) byId.set(row.id, row);
  }

  const logs = [];
  for (const row of byId.values()) {
    if (row.via || row.hidden || row.withdrawn || row._pending || row.kind === 'system') continue;
    if (row.from?.kind !== 'human' && row.from?.kind !== 'agent') continue;
    const timestamp = typeof row.at === 'string' ? Date.parse(row.at) : NaN;
    if (!Number.isFinite(timestamp) || timestamp < now - day || timestamp > now) continue;

    const name = row.from.name;
    const body = row.body || row.poll?.question || row.media?.alt;
    if (typeof name !== 'string' || !name.trim() || typeof body !== 'string' || !body.trim()) continue;
    logs.push({ id: row.id, body: body.trim(), at: new Date(timestamp).toISOString(), name: name.trim() });
  }
  return logs.sort((a, b) => b.at.localeCompare(a.at));
}
