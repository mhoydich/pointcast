#!/usr/bin/env node

const args = process.argv.slice(2);
const valueAfter = (flag) => {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
};
const base = new URL(valueAfter('--base') || process.env.POINTCAST_BASE_URL || 'https://pointcast.xyz');
const allowUnavailable = args.includes('--allow-unavailable');
const controller = new AbortController();
const timer = setTimeout(() => controller.abort(), 30_000);

try {
  const indexUrl = new URL('/api/capabilities?refresh=1', base);
  const response = await fetch(indexUrl, {
    headers: { Accept: 'application/json', 'User-Agent': 'PointCast-Conformance/1.0' },
    signal: controller.signal,
  });
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (!response.ok) throw new Error(`capability index returned ${response.status}`);
  if (bytes.byteLength > 20 * 1024) throw new Error(`capability index is ${bytes.byteLength} bytes; maximum is 20480`);
  const index = JSON.parse(new TextDecoder().decode(bytes));
  if (index.schema !== 'pointcast.agent-capabilities/v1' || !Array.isArray(index.capabilities)) {
    throw new Error('capability index schema is invalid');
  }

  let failures = 0;
  for (const capability of index.capabilities) {
    const readiness = capability.readiness || {};
    const ageMs = Date.now() - Date.parse(readiness.observedAt || '');
    const stateOk = ['live', 'degraded', 'unavailable'].includes(readiness.state);
    const fresh = Number.isFinite(ageMs) && ageMs >= -5_000 && ageMs <= 120_000;
    const schemaUrl = new URL(capability.schema);
    if (schemaUrl.hostname === 'pointcast.xyz') {
      schemaUrl.protocol = base.protocol;
      schemaUrl.host = base.host;
    }
    let schemaOk = false;
    try {
      const schemaResponse = await fetch(schemaUrl, { headers: { Accept: 'application/schema+json, application/json' }, signal: controller.signal });
      const schema = await schemaResponse.json();
      schemaOk = schemaResponse.ok && schema.$schema === 'https://json-schema.org/draft/2020-12/schema';
    } catch {}
    const unavailable = readiness.state === 'unavailable';
    const ok = stateOk && fresh && schemaOk && (allowUnavailable || !unavailable);
    if (!ok) failures += 1;
    process.stdout.write(`${ok ? 'ok' : 'FAIL'} ${capability.id} ${readiness.state || 'missing'} HTTP ${readiness.status ?? '-'} schema=${schemaOk ? 'ok' : 'bad'}\n`);
  }
  process.stdout.write(`\n${index.capabilities.length} capabilities · ${bytes.byteLength} bytes · observed ${index.generatedAt}\n`);
  if (failures) process.exitCode = 1;
} catch (error) {
  process.stderr.write(`agent conformance failed: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
} finally {
  clearTimeout(timer);
}
