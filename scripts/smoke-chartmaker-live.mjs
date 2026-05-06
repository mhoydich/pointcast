const ORIGIN = process.env.POINTCAST_ORIGIN || 'https://pointcast.xyz';

async function fetchText(pathname) {
  const url = new URL(pathname, ORIGIN);
  const response = await fetch(url, {
    headers: { 'user-agent': 'pointcast-chartmaker-smoke/1.0' },
  });

  if (!response.ok) {
    throw new Error(`${url.href} returned ${response.status}`);
  }

  return response.text();
}

async function fetchJson(pathname) {
  const text = await fetchText(pathname);
  return JSON.parse(text);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function latestBlockId(blocks) {
  const records = Array.isArray(blocks) ? blocks : blocks.blocks;
  assert(Array.isArray(records), 'blocks.json did not expose a blocks array');

  const ids = records
    .map((block) => Number(block.id))
    .filter((id) => Number.isInteger(id));

  assert(ids.length > 0, 'blocks.json did not expose numeric block ids');

  return String(Math.max(...ids)).padStart(4, '0');
}

const checks = [];

async function check(label, task) {
  try {
    const result = await task();
    checks.push({ label, ok: true, result });
  } catch (error) {
    checks.push({ label, ok: false, result: error.message });
    process.exitCode = 1;
  }
}

await check('chartmaker.json exposes v3', async () => {
  const chartmaker = await fetchJson('/chartmaker.json');
  assert(chartmaker.today?.v3?.name === 'Chartmaker v3', 'today.v3.name is not Chartmaker v3');
  assert(chartmaker.today?.date === '2026-05-05', 'today.date is not 2026-05-05');
  assert(chartmaker.today?.charts?.length === 10, 'today.charts length is not 10');
  assert(chartmaker.today?.remixes?.length === 5, 'today.remixes length is not 5');
  return `${chartmaker.today.charts.length} charts, ${chartmaker.today.remixes.length} remixes`;
});

await check('apps.json lists Chartmaker', async () => {
  const apps = await fetchJson('/apps.json');
  const records = Array.isArray(apps) ? apps : apps.apps;
  assert(records?.some((app) => app.slug === 'pointcast-chartmaker'), 'pointcast-chartmaker missing');
  return 'pointcast-chartmaker present';
});

await check('now.json returns 200', async () => {
  await fetchJson('/now.json');
  return 'ok';
});

await check('app exposes Chartmaker', async () => {
  const appHtml = await fetchText('/app/');
  assert(appHtml.includes('/chartmaker'), '/app/ does not link /chartmaker');
  assert(appHtml.includes('/chartmaker.json'), '/app/ does not link /chartmaker.json');
  return 'links present';
});

await check('latest receipt route returns 200', async () => {
  const blocks = await fetchJson('/blocks.json');
  const id = process.argv[2] || latestBlockId(blocks);
  await fetchText(`/b/${id}/`);
  await fetchJson(`/b/${id}.json`);
  return `/b/${id}/`;
});

for (const item of checks) {
  const mark = item.ok ? 'ok' : 'fail';
  console.log(`${mark} ${item.label}: ${item.result}`);
}
