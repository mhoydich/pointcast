import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

async function loadDataModule() {
  const source = await read('src/lib/railroad-history.ts');
  const dataUrl = `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
  return import(dataUrl);
}

function pngSize(buffer) {
  assert.equal(buffer.subarray(1, 4).toString('ascii'), 'PNG');
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

function uint24le(buffer, offset) {
  return buffer[offset] | (buffer[offset + 1] << 8) | (buffer[offset + 2] << 16);
}

function webpSize(buffer) {
  assert.equal(buffer.subarray(0, 4).toString('ascii'), 'RIFF');
  assert.equal(buffer.subarray(8, 12).toString('ascii'), 'WEBP');

  let offset = 12;
  while (offset + 8 <= buffer.length) {
    const type = buffer.subarray(offset, offset + 4).toString('ascii');
    const length = buffer.readUInt32LE(offset + 4);
    const payload = offset + 8;

    if (type === 'VP8 ') {
      assert.deepEqual([...buffer.subarray(payload + 3, payload + 6)], [0x9d, 0x01, 0x2a]);
      return {
        width: buffer.readUInt16LE(payload + 6) & 0x3fff,
        height: buffer.readUInt16LE(payload + 8) & 0x3fff,
      };
    }

    if (type === 'VP8X') {
      return {
        width: uint24le(buffer, payload + 4) + 1,
        height: uint24le(buffer, payload + 7) + 1,
      };
    }

    if (type === 'VP8L') {
      assert.equal(buffer[payload], 0x2f);
      const packed = buffer.readUInt32LE(payload + 1);
      return {
        width: (packed & 0x3fff) + 1,
        height: ((packed >>> 14) & 0x3fff) + 1,
      };
    }

    offset = payload + length + (length % 2);
  }

  assert.fail('No WebP dimension chunk found');
}

test('Railroad Time publishes four sourced, generated-image eras', async () => {
  const { RAILROAD_ERAS, RAILROAD_TIME } = await loadDataModule();

  assert.deepEqual(
    RAILROAD_ERAS.map((era) => era.id),
    ['1825', '1869', '1883', '1964'],
  );
  assert.equal(RAILROAD_TIME.eras, RAILROAD_ERAS);
  assert.equal(new Set(RAILROAD_ERAS.map((era) => era.source.url)).size, 4);
  assert.deepEqual(
    RAILROAD_ERAS.map((era) => new URL(era.source.url).hostname),
    [
      'historicengland.org.uk',
      'www.nps.gov',
      'americanhistory.si.edu',
      'museum.jr-central.co.jp',
    ],
  );

  for (const era of RAILROAD_ERAS) {
    assert.equal(era.year, Number(era.id));
    assert.equal(era.image, `/images/railroads/${{
      1825: '1825-locomotion.webp',
      1869: '1869-sierra-workers.webp',
      1883: '1883-railway-time.webp',
      1964: '1964-shinkansen.webp',
    }[era.id]}`);
    assert.match(era.imageDisclosure, /OpenAI-generated historical interpretation/);
    assert.match(era.imageDisclosure, /not a documentary photograph/);
    assert.match(era.source.url, /^https:\/\//);
    assert.ok(era.source.label.length > 20);
    assert.ok(era.answer.length > 150);
    assert.ok(era.gain.length > 20);
    assert.ok(era.cost.length > 20);
    assert.ok(era.keywords.includes(era.id));
    assert.ok(era.keywords.length >= 10);
  }
});

test('publication, interaction, and privacy boundaries are explicit', async () => {
  const { RAILROAD_TIME } = await loadDataModule();

  assert.equal(RAILROAD_TIME.status, 'published');
  assert.equal(RAILROAD_TIME.canonical, 'https://pointcast.xyz/railroads/');
  assert.equal(RAILROAD_TIME.machineEdition, 'https://pointcast.xyz/railroads.json');
  assert.equal(
    RAILROAD_TIME.social.image,
    'https://pointcast.xyz/images/railroads/railroad-time-v1.png',
  );
  assert.deepEqual(
    [RAILROAD_TIME.social.imageWidth, RAILROAD_TIME.social.imageHeight],
    [1200, 630],
  );
  assert.equal(RAILROAD_TIME.interaction.networkWrites, false);
  assert.equal(RAILROAD_TIME.interaction.liveAi, false);
  assert.equal(RAILROAD_TIME.privacy.microphoneRequiresExplicitTap, true);
  assert.equal(RAILROAD_TIME.privacy.pointCastReceivesMicrophoneAudio, false);
  assert.equal(RAILROAD_TIME.privacy.pointCastStoresAudioOrTranscript, false);
  assert.equal(RAILROAD_TIME.privacy.browserRecognitionMayUseVendorService, true);
  assert.match(RAILROAD_TIME.interaction.routing, /Deterministic keyword matching/);
  assert.doesNotMatch(JSON.stringify(RAILROAD_TIME), /local[- ]prototype/i);
});

test('question routing is deterministic and preserves the typed fallback', async () => {
  const { chooseRailroadEra, contextualRailroadAnswer, RAILROAD_ERAS } =
    await loadDataModule();

  assert.equal(chooseRailroadEra('Where did public steam begin?').id, '1825');
  assert.equal(chooseRailroadEra('Who were the Chinese workers?').id, '1869');
  assert.equal(chooseRailroadEra('Why did clocks need standard time?').id, '1883');
  assert.equal(chooseRailroadEra('How fast was the bullet train?').id, '1964');
  assert.equal(chooseRailroadEra('Who built the Shinkansen?').id, '1964');
  assert.equal(chooseRailroadEra('Who built the bullet train?').id, '1964');
  assert.equal(chooseRailroadEra('', '1869').id, '1869');
  assert.equal(chooseRailroadEra('surprise me', '1883').id, '1964');
  assert.equal(chooseRailroadEra('surprise me', '1964').id, '1825');
  assert.match(
    contextualRailroadAnswer(RAILROAD_ERAS[1], 'Who built it?'),
    /^Start with the people, not the machine\./,
  );
});

test('public JSON edition is cacheable, CORS-readable, and nosniff', async () => {
  const endpoint = await read('src/pages/railroads.json.ts');

  assert.match(endpoint, /RAILROAD_ERAS/);
  assert.match(endpoint, /RAILROAD_TIME/);
  assert.match(endpoint, /'Content-Type': 'application\/json; charset=utf-8'/);
  assert.match(endpoint, /'Access-Control-Allow-Origin': '\*'/);
  assert.match(endpoint, /'X-Content-Type-Options': 'nosniff'/);
  assert.match(endpoint, /public, max-age=300, s-maxage=86400/);
  assert.match(endpoint, /rel="canonical"/);
  assert.doesNotMatch(endpoint, /local[- ]prototype/i);
});

test('published room keeps voice optional, train motion accessible, and discovery connected', async () => {
  const [page, client, css, llms, apps, home, sitemap, blockSource, headers] = await Promise.all([
    read('src/pages/railroads.astro'),
    read('public/railroads/room.js'),
    read('public/railroads/room.css'),
    read('public/llms.txt'),
    read('src/lib/pointcast-apps.ts'),
    read('src/pages/index.astro'),
    read('src/pages/sitemap-discovery.xml.ts'),
    read('src/content/blocks/0601.json'),
    read('public/_headers'),
  ]);

  assert.match(page, /RAILROAD_ERAS/);
  assert.match(page, /isolated=\{true\}/);
  assert.match(page, /id="railroad-era-data"/);
  assert.match(page, /data-speak/);
  assert.match(page, /data-travel/);
  assert.match(page, /data-hear/);
  assert.match(page, /data-map-engine/);
  assert.match(page, /class="hero-train"/);
  assert.match(page, /Your browser or device may use its speech service/);
  assert.match(page, /OPENAI-GENERATED HISTORICAL INTERPRETATION/);
  assert.doesNotMatch(page, /LOCAL PROTOTYPE|prototype-note|image-prompts\.md|README\.md/);

  assert.match(client, /SpeechRecognition/);
  assert.match(client, /webkitSpeechRecognition/);
  assert.match(client, /speechSynthesis/);
  assert.match(client, /visibleAnswer/);
  assert.match(client, /visibilitychange/);
  assert.match(client, /pagehide/);
  assert.match(client, /prefers-reduced-motion: reduce/);
  assert.match(client, /sessionStorage/);
  assert.match(client, /root\.dataset\.era/);
  assert.doesNotMatch(client, /fetch\s*\(/);

  assert.match(css, /@keyframes train-pass/);
  assert.match(css, /\.map-engine[\s\S]*transition: transform/);
  assert.match(css, /@media \(max-width: 680px\)/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /\.railroad-room\[data-era="1964"\]/);
  assert.match(css, /body\.pc-block-shell \.railroad-room a/);
  assert.match(css, /\.stage__stamp \{[\s\S]*background: rgba\(17, 18, 15, 0\.78\)/);
  assert.doesNotMatch(css, /body\[data-era=/);

  assert.match(llms, /https:\/\/pointcast\.xyz\/railroads/);
  assert.match(apps, /slug: 'railroad-time'/);
  assert.match(home, /title: 'Railroad Time'/);
  assert.match(sitemap, /https:\/\/pointcast\.xyz\/railroads\//);
  assert.match(headers, /\/images\/railroads\/\*[\s\S]*! Cache-Control[\s\S]*max-age=31536000, immutable[\s\S]*Access-Control-Allow-Origin: \*/);
  assert.match(headers, /\/railroads\.json[\s\S]*application\/json; charset=utf-8[\s\S]*! Cache-Control[\s\S]*s-maxage=86400/);

  const block = JSON.parse(blockSource);
  assert.equal(block.id, '0601');
  assert.equal(block.author, 'codex');
  assert.match(block.source, /Mike asked Codex to publish/);
  assert.equal(block.meta.liveAI, false);
  assert.equal(block.meta.networkWrites, false);
});

test('era plates are 1536 by 1024 WebPs and the unfurl is 1200 by 630', async () => {
  const { RAILROAD_ERAS, RAILROAD_TIME } = await loadDataModule();

  for (const era of RAILROAD_ERAS) {
    const asset = new URL(`../public${era.image}`, import.meta.url);
    await access(asset);
    assert.deepEqual(webpSize(await readFile(asset)), { width: 1536, height: 1024 });
  }

  const socialPath = new URL(RAILROAD_TIME.social.image).pathname;
  const socialAsset = new URL(`../public${socialPath}`, import.meta.url);
  await access(socialAsset);
  assert.deepEqual(pngSize(await readFile(socialAsset)), { width: 1200, height: 630 });
});
