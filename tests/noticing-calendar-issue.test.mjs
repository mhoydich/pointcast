import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

function pngSize(buffer) {
  assert.equal(buffer.subarray(1, 4).toString('ascii'), 'PNG');
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

test('Issue 04 is a complete time-use field guide with two instruments', async () => {
  const [page, data] = await Promise.all([
    read('src/pages/noticing/how-to-calendar-a-life.astro'),
    read('src/lib/noticing-calendar.ts'),
  ]);

  assert.match(page, /data-calendar-issue/);
  assert.match(page, /data-cost-lab/);
  assert.match(page, /data-duration/);
  assert.match(page, /data-shadow-kind/);
  assert.match(page, /data-weather-lab/);
  assert.match(page, /data-weather-day/);
  assert.match(page, /data-print-field-sheet/);
  assert.match(page, /data-copy-issue/);
  assert.match(page, /@media print/);
  assert.match(page, /prefers-reduced-motion/);

  assert.match(data, /A calendar invitation has a clean edge\. Life does not\./);
  assert.match(data, /The goal is not a perfectly defended week/);
  for (const term of ['anchors', 'shadows', 'tides', 'weather', 'commons']) {
    assert.match(data, new RegExp(`id: '${term}'`));
  }
});

test('evidence, telemetry, synthesis, and practical limits stay separated', async () => {
  const [data, endpoint] = await Promise.all([
    read('src/lib/noticing-calendar.ts'),
    read('src/pages/noticing/how-to-calendar-a-life.json.ts'),
  ]);

  for (const label of [
    'Technical substrate',
    'Current product behavior',
    'Workplace telemetry',
    'Published research',
    'PointCast synthesis',
  ]) {
    assert.match(data, new RegExp(label));
  }
  assert.match(data, /not medical, therapeutic, or employment advice/);
  assert.match(data, /should not be generalized to every kind of work/);
  assert.match(endpoint, /not medical, therapeutic, or employment advice/);
  assert.match(endpoint, /Access-Control-Allow-Origin/);
  assert.equal((data.match(/id: 'S\d\d'/g) ?? []).length, 10);
});

test('Appendix 04.A carries the issue into listening, looking, print, and circulation', async () => {
  const [page, appendix, endpoint, pdf] = await Promise.all([
    read('src/pages/noticing/how-to-calendar-a-life.astro'),
    read('src/lib/noticing-calendar-appendix.ts'),
    read('src/pages/noticing/how-to-calendar-a-life.appendix.json.ts'),
    readFile(new URL('../public/downloads/a-calendar-is-a-treaty-field-edition.pdf', import.meta.url)),
  ]);

  assert.match(page, /data-calendar-appendix/);
  assert.match(page, /Let the week have weather\./);
  assert.match(page, /Two visual fields · 100 pins/);
  assert.match(page, /Download the free PDF/);
  assert.match(appendix, /open\.spotify\.com\/embed\/playlist/);
  assert.match(appendix, /38YzecNFRdDVnDAxZcHV9d/);
  assert.match(appendix, /02VSkAD9uXGZYi1aUVKV5B/);
  assert.equal((appendix.match(/tracks: 18/g) ?? []).length, 2);
  assert.equal((appendix.match(/pins: 50/g) ?? []).length, 2);
  assert.match(appendix, /supply: 100/);
  assert.match(appendix, /free: 60/);
  assert.match(appendix, /retained: 40/);
  assert.match(appendix, /status: 'live'/);
  assert.match(appendix, /objkt\.com\/tokens\/open_objkt\/41360/);
  assert.match(appendix, /ooUkysuqT5uPyMK5Qt64qYvhR8o1k6TmEkucKLdqKe4mKYGGFUQ/);
  assert.match(appendix, /ooTMAhrAyhp7U2am6gDy3wi64CrtSw7Z1rkwGNkEpf6yhEpN6Ti/);
  assert.match(endpoint, /CALENDAR_APPENDIX/);
  assert.equal(pdf.subarray(0, 4).toString('ascii'), '%PDF');
  assert.ok(pdf.byteLength > 1_000_000);
  assert.equal((pdf.toString('latin1').match(/\/Type \/Page\b/g) ?? []).length, 12);
});

test('Issue 04 has a permanent Block and complete discovery companions', async () => {
  const [blockText, home, sitemap, agents, forAgents, llms, llmsFull, calendar, priorIssue] =
    await Promise.all([
      read('src/content/blocks/0539.json'),
      read('src/components/HomeNewEdition.astro'),
      read('src/pages/sitemap-discovery.xml.ts'),
      read('src/pages/agents.json.ts'),
      read('src/pages/for-agents.astro'),
      read('public/llms.txt'),
      read('public/llms-full.txt'),
      read('src/lib/noticing.ts'),
      read('src/lib/noticing-crossing.ts'),
    ]);
  const block = JSON.parse(blockText);

  assert.equal(block.id, '0539');
  assert.equal(block.type, 'READ');
  assert.equal(block.author, 'codex');
  assert.ok(block.source);
  assert.equal(block.meta.publicationStatus, 'published');
  assert.equal(block.meta.visualPlates, 3);
  assert.equal(block.meta.researchSources, 10);
  assert.equal(block.meta.interactiveInstruments, 2);
  assert.equal(block.meta.medicalOrEmploymentAdvice, false);
  assert.equal(block.meta.spotifyPlaylists, 2);
  assert.equal(block.meta.spotifyTracks, 36);
  assert.equal(block.meta.pinterestBoards, 2);
  assert.equal(block.meta.pinterestPins, 100);
  assert.equal(block.meta.pdfPages, 12);
  assert.equal(block.meta.objktSupply, 100);
  assert.equal(block.meta.objktFree, 60);
  assert.equal(block.meta.objktRetained, 40);
  assert.equal(block.meta.objktTokenId, '41360');
  assert.equal(block.meta.objktListingPriceTez, 0);
  assert.match(
    block.companions.map((companion) => companion.id).join('\n'),
    /objkt\.com\/tokens\/open_objkt\/41360/,
  );
  assert.match(home, /href: '\/noticing\/how-to-calendar-a-life'/);
  assert.match(sitemap, /pointcast\.xyz\/noticing\/how-to-calendar-a-life'/);
  assert.match(sitemap, /pointcast\.xyz\/noticing\/how-to-calendar-a-life\.json'/);
  assert.match(sitemap, /pointcast\.xyz\/noticing\/how-to-calendar-a-life\.appendix\.json'/);
  assert.match(sitemap, /pointcast\.xyz\/downloads\/a-calendar-is-a-treaty-field-edition\.pdf'/);
  assert.match(
    agents,
    /noticingCalendar: 'https:\/\/pointcast\.xyz\/noticing\/how-to-calendar-a-life'/,
  );
  assert.match(
    agents,
    /noticingCalendar: 'https:\/\/pointcast\.xyz\/noticing\/how-to-calendar-a-life\.json'/,
  );
  assert.match(agents, /noticingCalendarAppendix/);
  assert.match(agents, /noticingCalendarFieldEdition/);
  assert.match(forAgents, /Block <code>0539<\/code>/);
  assert.match(llms, /Block 0539/);
  assert.match(llmsFull, /What I Keep Noticing — Issue 04/);
  assert.match(calendar, /relatedUrl: '\/noticing\/how-to-calendar-a-life'/);
  assert.match(priorIssue, /url: '\/noticing\/how-to-calendar-a-life'/);
});

test('three original plates and the issue social card have production dimensions', async () => {
  const plates = [
    'week-has-weather.webp',
    'every-yes-casts-a-shadow.webp',
    'leave-a-square-for-arrival.webp',
  ];

  for (const filename of plates) {
    const file = new URL(
      `../public/images/noticing/calendar-issue-04/${filename}`,
      import.meta.url,
    );
    await access(file);
    const metadata = await sharp(fileURLToPath(file)).metadata();
    assert.deepEqual(
      { width: metadata.width, height: metadata.height, format: metadata.format },
      { width: 1536, height: 1024, format: 'webp' },
    );
  }

  const socialCard = new URL(
    '../public/images/noticing/calendar-issue-04-og.png',
    import.meta.url,
  );
  await access(socialCard);
  assert.deepEqual(pngSize(await readFile(socialCard)), { width: 1200, height: 630 });
});
