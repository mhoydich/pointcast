import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

const LYRIC_DUMPS = [
  /some people call me/i,
  /pompatus of love/i,
  /midnight toker/i,
  /time keeps on slippin/i,
  /big ol' jet airliner/i,
  /big old jet airliner/i,
];

test('the desk is one document for the page and the JSON twin', async () => {
  const desk = JSON.parse(await read('src/data/steve-miller-band.json'));
  assert.equal(desk.schema, 'pointcast.steve-miller-band/v1');
  assert.equal(desk.block, '0696');
  assert.equal(desk.channel, 'SPN');
  assert.equal(desk.lyrics === undefined || desk.honesty.includes('No lyric'), true);
  assert.equal(desk.eras.length, 4);
  assert.deepEqual(desk.songs.map((song) => song.id), [
    'the-joker',
    'fly-like-an-eagle',
    'jet-airliner',
    'take-the-money-and-run',
    'rockn-me',
    'abracadabra',
    'space-cowboy',
    'jungle-love',
    'swingtown',
  ]);
  assert.deepEqual(desk.personas.map((persona) => persona.id), [
    'space-cowboy',
    'maurice',
    'gangster-of-love',
  ]);
  assert.equal(desk.receipt.storageKey, 'pc:smb-companion:v1');
  assert.equal(desk.receipt.scope, 'browser-local');
  for (const song of desk.songs) {
    assert.ok(song.note.split(/[.!?]/).filter((part) => part.trim()).length >= 2, song.id);
    assert.ok(song.why.length > 40, song.id);
    assert.ok(song.listen.youtube.startsWith('https://'));
    assert.ok(song.listen.spotify.startsWith('https://open.spotify.com/'));
    assert.equal(song.listen.youtube.includes('lyrics'), false);
  }
  const page = await read('src/pages/steve-miller-band.astro');
  const twin = await read('src/pages/steve-miller-band.json.ts');
  assert.match(page, /data-smb/);
  assert.match(page, /pc:smb-companion:v1/);
  assert.match(page, /browser-local/i);
  assert.match(twin, /steve-miller-band\.json/);
  const prose = `${JSON.stringify(desk)}\n${page}`;
  for (const pattern of LYRIC_DUMPS) assert.doesNotMatch(prose, pattern);
});

test('discovery, the Spinning block, and the front door agree', async () => {
  const [blockText, sitemap, llms, llmsFull, today, apps, surfaces, agents] = await Promise.all([
    read('src/content/blocks/0696.json'),
    read('src/pages/sitemap-discovery.xml.ts'),
    read('public/llms.txt'),
    read('public/llms-full.txt'),
    read('src/data/new-today.json'),
    read('src/lib/pointcast-apps.ts'),
    read('src/data/agent-surfaces.ts'),
    read('src/pages/agents.json.ts'),
  ]);
  const block = JSON.parse(blockText);
  assert.equal(block.id, '0696');
  assert.equal(block.channel, 'SPN');
  assert.equal(block.type, 'LINK');
  assert.equal(block.author, 'guest');
  assert.ok(block.source.includes('Grok Bot'));
  assert.equal(block.external.url, 'https://pointcast.xyz/steve-miller-band/');
  assert.match(sitemap, /pointcast\.xyz\/steve-miller-band\/'/);
  assert.match(sitemap, /pointcast\.xyz\/steve-miller-band\.json'/);
  for (const file of [llms, llmsFull]) {
    assert.match(file, /https:\/\/pointcast\.xyz\/steve-miller-band\//);
    assert.match(file, /https:\/\/pointcast\.xyz\/steve-miller-band\.json/);
    assert.match(file, /No lyric transcription/);
  }
  const strip = JSON.parse(today);
  assert.equal(strip[0].link, '/steve-miller-band/');
  assert.equal(strip[0].block, '0696');
  assert.ok(strip[0].title.length <= 28);
  assert.ok(strip[0].kicker.length <= 21);
  assert.match(apps, /slug: 'steve-miller-band'/);
  assert.match(surfaces, /steveMillerBand: 'https:\/\/pointcast\.xyz\/steve-miller-band\/'/);
  assert.match(surfaces, /steveMillerBand: 'https:\/\/pointcast\.xyz\/steve-miller-band\.json'/);
  assert.match(agents, /steveMillerBand: AGENT_SURFACES\.human\.steveMillerBand/);
  assert.match(agents, /steveMillerBand: AGENT_SURFACES\.json\.steveMillerBand/);
});
