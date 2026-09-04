import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');
const bytes = (path) => readFile(new URL(path, root));
const sha256 = (buffer) => createHash('sha256').update(buffer).digest('hex');

const BOARD_000_SHA = '2b34a571dfe7063517a8405a801b5b7c544f97f3d4b8a2feec4336cdfdf3333f';
const MOVEMENTS = new Set(['UP', 'DOWN', 'HOLD', 'NEW']);

function pngSize(buffer) {
  assert.equal(buffer.subarray(1, 4).toString('ascii'), 'PNG');
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

async function ledgerEntries() {
  const lib = await read('src/lib/pointcast-25.ts');
  const ledger = lib.slice(lib.indexOf('export const POINTCAST_25_EDITIONS'));
  const at000 = ledger.indexOf("board: '000'");
  const at001 = ledger.indexOf("board: '001'");
  assert.ok(at000 > -1 && at001 > at000, 'ledger lists Board 000 then Board 001');
  return { lib, entry000: ledger.slice(at000, at001), entry001: ledger.slice(at001) };
}

test('Board 000 frozen bytes are untouched and still hash to the ledger literal', async () => {
  const [frozen, endpoint, { entry000 }] = await Promise.all([
    bytes('src/lib/pointcast-25-board-000.frozen.json'),
    read('src/pages/25/boards/000.json.ts'),
    ledgerEntries(),
  ]);

  assert.equal(sha256(frozen), BOARD_000_SHA);
  assert.match(entry000, new RegExp(`integrity: 'sha256:${BOARD_000_SHA}'`));
  assert.match(endpoint, new RegExp(BOARD_000_SHA));
  const board = JSON.parse(frozen.toString('utf8'));
  assert.equal(board.board, '000');
  assert.equal(board.immutable, true);
  assert.equal(board.teams.length, 25);
});

test('Board 001 is an appended frozen snapshot: 25 teams with previousRank, movement, change, and sources', async () => {
  const [frozen, endpoint, { entry001 }] = await Promise.all([
    bytes('src/lib/pointcast-25-board-001.frozen.json'),
    read('src/pages/25/boards/001.json.ts'),
    ledgerEntries(),
  ]);
  const hash = sha256(frozen);
  const board = JSON.parse(frozen.toString('utf8'));

  assert.equal(board.spec, 'pointcast.25-for-reasons/v1');
  assert.equal(board.season, 2026);
  assert.equal(board.board, '001');
  assert.equal(board.previousBoard, '000');
  assert.equal(board.status, 'week-1');
  assert.equal(board.publishedAt, '2026-09-01T17:00:00-07:00');
  assert.equal(board.nextBoardAt, '2026-09-08T08:08:00-07:00');
  assert.equal(board.immutable, true);
  assert.equal(board.canonical, 'https://pointcast.xyz/25/boards/001.json');
  assert.equal(board.previous, 'https://pointcast.xyz/25/boards/000.json');
  assert.equal(board.current, 'https://pointcast.xyz/25.json');
  assert.equal(board.seasonLedger, 'https://pointcast.xyz/25/season.json');
  assert.equal(board.block, 'https://pointcast.xyz/b/0582');
  assert.match(board.editorsNote, /— cc$/);
  assert.deepEqual(board.dropped, []);

  assert.equal(board.teams.length, 25);
  assert.deepEqual(board.teams.map((team) => team.rank), Array.from({ length: 25 }, (_, index) => index + 1));
  assert.equal(new Set(board.teams.map((team) => team.school)).size, 25);
  for (const team of board.teams) {
    assert.equal(typeof team.previousRank, 'number', `${team.school} previousRank`);
    assert.ok(MOVEMENTS.has(team.movement), `${team.school} movement ${team.movement}`);
    if (team.movement === 'HOLD') assert.equal(team.previousRank, team.rank, `${team.school} HOLD keeps its rank`);
    assert.ok(typeof team.change === 'string' && team.change.length > 40, `${team.school} change receipt`);
    assert.ok(Array.isArray(team.sources) && team.sources.length > 0, `${team.school} sources`);
    for (const url of team.sources) assert.match(url, /^https:\/\//, `${team.school} source ${url}`);
    assert.ok(team.result === null || typeof team.result === 'string', `${team.school} result`);
    for (const key of ['reason', 'case', 'doubt', 'proof', 'accent', 'signal', 'short', 'conference']) {
      assert.ok(team[key], `${team.school} ${key}`);
    }
  }

  const played = board.teams.filter((team) => team.result !== null);
  assert.deepEqual(played.map((team) => team.school), ['USC']);
  assert.deepEqual(board.movements, { up: 0, down: 0, hold: 25, new: 0, dropped: 0, gamesPlayed: 1 });
  assert.equal(board.unverified.length, 24);
  for (const team of board.teams) {
    const listed = board.unverified.some((line) => line.startsWith(`${team.school} —`));
    assert.equal(listed, team.result === null, `${team.school} unverified listing matches result`);
  }

  // The ledger literal and the immutable route both carry the file's own hash.
  assert.match(entry001, new RegExp(`integrity: 'sha256:${hash}'`));
  assert.match(entry001, /previous: '000'/);
  assert.match(entry001, /snapshot: 'https:\/\/pointcast\.xyz\/25\/boards\/001'/);
  assert.match(entry001, /machine: 'https:\/\/pointcast\.xyz\/25\/boards\/001\.json'/);
  assert.match(entry001, /human: 'https:\/\/pointcast\.xyz\/b\/0582'/);
  assert.match(entry001, /block: '0582'/);
  assert.match(entry001, /movements: \{ up: 0, down: 0, hold: 25, new: 0, dropped: 0, gamesPlayed: 1 \}/);
  assert.match(endpoint, /pointcast-25-board-001\.frozen\.json\?raw/);
  assert.match(endpoint, new RegExp(hash));
  assert.match(endpoint, /max-age=31536000, immutable/);
  assert.doesNotMatch(endpoint, /from '\.\.\/\.\.\/\.\.\/lib\/pointcast-25'/);
});

test('the live board is Board 001 and /25 shows movement badges with a change receipt per team', async () => {
  const [lib, page, currentJson] = await Promise.all([
    read('src/lib/pointcast-25.ts'),
    read('src/pages/25/index.astro'),
    read('src/pages/25.json.ts'),
  ]);

  assert.match(lib, /^  board: '001',$/m);
  assert.match(lib, /^  previousBoard: '000',$/m);
  assert.match(lib, /^  status: 'week-1',$/m);
  assert.match(lib, /^  publishedAt: '2026-09-01T17:00:00-07:00',$/m);
  assert.match(lib, /^  nextBoardAt: '2026-09-08T08:08:00-07:00',$/m);
  assert.match(lib, /^  block: '0582',$/m);
  assert.match(lib, /^  editorsNote:$/m);
  assert.equal((lib.match(/^\s{6}previousRank: \d+,$/gm) || []).length, 25);
  assert.equal((lib.match(/^\s{6}movement: '(UP|DOWN|HOLD|NEW)',$/gm) || []).length, 25);
  assert.equal((lib.match(/^\s{6}change: '/gm) || []).length, 25);
  assert.equal((lib.match(/^\s{6}sources: \[$/gm) || []).length, 25);
  assert.equal((lib.match(/^\s{6}result: /gm) || []).length, 25);
  assert.match(lib, /export type PointCast25Movement = 'NEW' \| 'UP' \| 'DOWN' \| 'HOLD';/);

  assert.match(page, /data-movement=\{team\.movement\}/);
  assert.match(page, /movementLabel\(team\)/);
  assert.match(page, /class="team__change"/);
  assert.match(page, /\{team\.change\}/);
  assert.match(page, /receipts__sources/);
  assert.match(page, /team\.sources\.map/);
  assert.match(page, /board-head__moves/);
  assert.match(page, /POINTCAST_25\.editorsNote/);
  assert.match(page, /\{statusLabel\}/);
  assert.doesNotMatch(page, /· PRESEASON ·/);
  assert.match(page, /href="\/25\/boards\/001">Permanent Board 001/);
  assert.match(page, /board-001\.png/);

  assert.match(currentJson, /block: `https:\/\/pointcast\.xyz\/b\/\$\{POINTCAST_25\.block\}`/);
  assert.match(currentJson, /immutableBoards: POINTCAST_25_EDITIONS\.map/);
  assert.match(currentJson, /immutableBoardJson: 'https:\/\/pointcast\.xyz\/25\/boards\/001\.json'/);
  assert.match(currentJson, /previousBoardJson: 'https:\/\/pointcast\.xyz\/25\/boards\/000\.json'/);
});

test('the season ledger lists both boards with their hashes and the next board date', async () => {
  const [season, seasonJson, { entry000, entry001 }] = await Promise.all([
    read('src/pages/25/season.astro'),
    read('src/pages/25/season.json.ts'),
    ledgerEntries(),
  ]);

  assert.match(entry000, /integrity: 'sha256:[0-9a-f]{64}'/);
  assert.match(entry001, /integrity: 'sha256:[0-9a-f]{64}'/);
  assert.match(season, /POINTCAST_25_EDITIONS\.map/);
  assert.match(season, /edition\.integrity/);
  assert.match(season, /'movements' in edition/);
  assert.match(season, /edition\.biggestMove/);
  assert.match(season, /From Board \{edition\.previous\}/);
  assert.match(season, /POINTCAST_25\.nextBoardAt/);
  assert.match(seasonJson, /boards: POINTCAST_25_EDITIONS/);
  assert.match(seasonJson, /nextBoardAt: POINTCAST_25\.nextBoardAt/);
});

test('permanent board pages render their frozen captures, never the live object', async () => {
  const [page000, page001] = await Promise.all([
    read('src/pages/25/boards/000.astro'),
    read('src/pages/25/boards/001.astro'),
  ]);

  assert.match(page000, /pointcast-25-board-000\.frozen\.json/);
  assert.doesNotMatch(page000, /from '\.\.\/\.\.\/\.\.\/lib\/pointcast-25'/);
  assert.doesNotMatch(page000, /POINTCAST_25_TEAMS|POINTCAST_25\./);
  assert.match(page000, /IMMUTABLE EDITION/);
  assert.match(page001, /pointcast-25-board-001\.frozen\.json/);
  assert.doesNotMatch(page001, /from '\.\.\/\.\.\/\.\.\/lib\/pointcast-25'/);
  assert.doesNotMatch(page001, /POINTCAST_25_TEAMS|POINTCAST_25\./);
  assert.match(page001, /IMMUTABLE EDITION/);
  assert.match(page001, /data-movement=\{team\.movement\}/);
  assert.match(page001, /\{team\.change\}/);
  assert.match(page001, /board\.editorsNote/);
  assert.match(page001, /href="\/25\/boards\/001\.json"/);
});

test('receipts keep the board that opened each claim while the current board moves on', async () => {
  const [audience, teamPage, receiptsPage] = await Promise.all([
    read('src/lib/pointcast-25-audience.ts'),
    read('src/pages/25/teams/[slug].astro'),
    read('src/pages/25/receipts.astro'),
  ]);

  assert.match(audience, /import board000 from '\.\/pointcast-25-board-000\.frozen\.json'/);
  assert.match(audience, /openedBoard/);
  assert.match(audience, /openedAt: carried \? board000\.publishedAt : POINTCAST_25\.publishedAt/);
  assert.match(audience, /change: team\.change/);
  assert.match(teamPage, /datePublished: receipt\.openedAt/);
  assert.match(teamPage, /dateModified: POINTCAST_25\.publishedAt/);
  assert.match(teamPage, /04 · CHANGE/);
  assert.match(teamPage, /opened with Board \{receipt\.openedBoard\} on \{openedOn\}/);
  assert.doesNotMatch(teamPage, /on July 27, 2026\./);
  assert.match(receiptsPage, /\{statusLabel\}/);
  assert.doesNotMatch(receiptsPage, /BOARD \{POINTCAST_25\.board\} · PRESEASON/);
});

test('Block 0582 is the SPN note for Board 001 with the movement receipt in its meta', async () => {
  const [blockText, frozen] = await Promise.all([
    read('src/content/blocks/0582.json'),
    bytes('src/lib/pointcast-25-board-001.frozen.json'),
  ]);
  const block = JSON.parse(blockText);
  const words = block.body.trim().split(/\s+/).length;

  assert.equal(block.id, '0582');
  assert.equal(block.channel, 'SPN');
  assert.equal(block.type, 'NOTE');
  assert.equal(block.noun, 582);
  assert.equal(block.author, 'cc');
  assert.equal(block.title, '25 FOR REASONS — Board 001');
  assert.match(block.dek, /USC/);
  assert.ok(words >= 150 && words <= 250, `body is ${words} words`);
  assert.match(block.body, /— cc$/);
  assert.equal(block.external.url, 'https://pointcast.xyz/25');
  const companionIds = block.companions.map((companion) => companion.id);
  for (const id of ['https://pointcast.xyz/25', 'https://pointcast.xyz/25/boards/001', 'https://pointcast.xyz/25/season', '0510']) {
    assert.ok(companionIds.includes(id), `companion ${id}`);
  }
  assert.equal(block.meta.board, '001');
  assert.equal(block.meta.previousBoard, '000');
  assert.equal(block.meta.integrity, `sha256:${sha256(frozen)}`);
  assert.deepEqual(block.meta.movements, { up: 0, down: 0, hold: 25, new: 0, dropped: 0 });
  assert.equal(block.meta.gamesPlayed, 1);
  assert.equal(block.meta.recurring, false);
  assert.equal(block.meta.pointCastCardCapture, false);
});

test('Board 001 is discoverable from the sitemap, agents index, and LLM surfaces', async () => {
  const [sitemap, agents, llms, llmsFull] = await Promise.all([
    read('src/pages/sitemap-discovery.xml.ts'),
    read('src/pages/agents.json.ts'),
    read('public/llms.txt'),
    read('public/llms-full.txt'),
  ]);

  assert.match(sitemap, /pointcast\.xyz\/25\/boards\/001'/);
  assert.match(sitemap, /pointcast\.xyz\/25\/boards\/001\.json'/);
  assert.match(agents, /pointcast25Board001: 'https:\/\/pointcast\.xyz\/25\/boards\/001'/);
  assert.match(agents, /pointcast25Board001Json: 'https:\/\/pointcast\.xyz\/25\/boards\/001\.json'/);
  for (const text of [llms, llmsFull]) {
    assert.match(text, /https:\/\/pointcast\.xyz\/25\/boards\/001\.json/);
    assert.match(text, /https:\/\/pointcast\.xyz\/b\/0582/);
  }
  assert.match(llmsFull, /25 FOR REASONS — Board 000/);
  assert.match(llms, /## 25 FOR REASONS/);
});

test('Board 001 social card is a 1200 by 630 PNG', async () => {
  assert.deepEqual(pngSize(await bytes('public/images/pointcast-25/board-001.png')), { width: 1200, height: 630 });
});
