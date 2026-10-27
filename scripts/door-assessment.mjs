/** Interpret only explicitly documented API behavior. Do not treat failed probes as healthy. */
export function assessDoor({ url, status, error }, base, capabilities = []) {
  const path = new URL(url).pathname;
  const matches = capabilities.filter(c => c.path === path && c.probe && c.readiness);
  const entry = { url, status, ...(error ? { error } : {}) };
  // A successful informational GET does not make a prepared-only operation live.
  const prepared = matches.find(c => c.publicationAvailability === 'prepared-only');
  if (prepared && [200, 404, 503].includes(status)) {
    return { kind: 'unavailable', entry: { ...entry, reason: 'prepared only', capability: prepared.id } };
  }
  if (status === 200) return { kind: 'open', entry };
  // These private routes intentionally require authentication, per agents.json.
  if (status === 401 && ['/me.json', '/api/lucky-cat/profile'].includes(path)) {
    return { kind: 'expected', entry: { ...entry, reason: 'authentication required' } };
  }
  for (const c of matches) {
    const r = c.readiness;
    const passed = ['live', 'degraded'].includes(r.state) &&
      Array.isArray(c.probe.expected) && c.probe.expected.includes(r.status) && r.status !== 503;
    if (!passed || c.publicationAvailability === 'prepared-only') continue;
    // A GET is not a useful test of a POST-only endpoint: use the capability
    // service's safe, method-aware probe instead, preserving both observations.
    const postOnly = status === 404 && c.method === 'POST' && c.probe.path === path;
    const expectedGet = c.probe.method === 'GET' && c.probe.path === path && c.probe.expected.includes(status);
    if (postOnly || expectedGet) return { kind: 'expected', entry: {
      ...entry, reason: postOnly ? 'POST capability probe passed' : 'documented response',
      capability: c.id, probeStatus: r.status, probeObservedAt: r.observedAt,
    } };
  }
  return { kind: 'broken', entry };
}
