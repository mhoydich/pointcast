#!/usr/bin/env node

/** Publish one curated Haptic Dreams milestone. This helper never reads
 * logs, diffs, prompts, inboxes, or local files. A real write requires
 * POINTCAST_BUILDCAST_TOKEN; use --dry-run to inspect the public payload. */

const args = process.argv.slice(2);
const values = {};
let dryRun = false;
for (let index = 0; index < args.length; index += 1) {
  if (args[index] === '--dry-run') { dryRun = true; continue; }
  if (!args[index].startsWith('--') || !args[index + 1]) {
    console.error(`Invalid argument near ${args[index] || '(end)'}.`);
    process.exit(2);
  }
  values[args[index].slice(2)] = args[index + 1];
  index += 1;
}

const required = ['agent', 'type', 'phase', 'status', 'title', 'summary'];
const missing = required.filter((key) => !values[key]);
if (missing.length) {
  console.error(`Missing required fields: ${missing.join(', ')}`);
  process.exit(2);
}

const event = {
  agent: values.agent,
  type: values.type,
  phase: values.phase,
  status: values.status,
  title: values.title,
  summary: values.summary,
  ...(values.link ? { link: values.link } : {}),
};

if (dryRun) { console.log(JSON.stringify(event, null, 2)); process.exit(0); }

const token = process.env.POINTCAST_BUILDCAST_TOKEN;
if (!token) {
  console.error('POINTCAST_BUILDCAST_TOKEN is not set. Nothing was published.');
  process.exit(3);
}

const endpoint = process.env.POINTCAST_BUILDCAST_ENDPOINT || 'https://pointcast.xyz/api/buildcast';
const parsed = new URL(endpoint);
const allowedEndpoint = parsed.protocol === 'https:' && (
  parsed.hostname === 'pointcast.xyz' || parsed.hostname.endsWith('.pointcast.pages.dev')
);
if (!allowedEndpoint) {
  console.error('Buildcast endpoint must be a public PointCast HTTPS host.');
  process.exit(3);
}

const response = await fetch(parsed, {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify(event),
});
const result = await response.json().catch(() => ({ ok: false, error: `http-${response.status}` }));
if (!response.ok || !result.ok) {
  console.error(`Buildcast rejected the milestone: ${result.error || `http-${response.status}`}`);
  process.exit(1);
}
console.log(`Published public milestone ${result.event.id}.`);
