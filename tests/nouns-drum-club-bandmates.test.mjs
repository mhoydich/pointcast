import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { decodeScore, encodeScore, normalizeScore } from '../src/lib/nouns-drum-club-score.ts';
import {
  NOUNS_DRUM_CLUB_BANDMATES,
  NOUNS_DRUM_CLUB_BANDMATES_STATUS,
  getNounsDrumClubBandmate,
  nounsDrumClubBandmateMetadata,
  nounsDrumClubBandmatePlayUrl,
} from '../src/lib/nouns-drum-club-bandmates.ts';
import { GET, getStaticPaths } from '../src/pages/nouns/drum-club/bandmates/metadata/[id].json.ts';

test('canonical JSON is a complete, balanced 12-bandmate set', async () => {
  const source = JSON.parse(await readFile(new URL('../src/data/nouns-drum-club-bandmates.json', import.meta.url), 'utf8'));
  assert.ok(Array.isArray(source));
  assert.equal(source.length, 12);
  assert.deepEqual(source.map(({ id }) => id), Array.from({ length: 12 }, (_, index) => index));
  assert.deepEqual(source.map(({ number }) => number), Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, '0')));
  assert.equal(new Set(source.map(({ slug }) => slug)).size, 12);
  assert.equal(new Set(source.map(({ name }) => name)).size, 12);
  assert.deepEqual(Object.fromEntries(['drum', 'bass', 'mallet', 'chord'].map((role) => [role, source.filter((item) => item.role === role).length])), {
    drum: 3, bass: 3, mallet: 3, chord: 3,
  });
  assert.equal(source[6].name, 'Soft Signal');
  assert.equal(source[6].slug, 'soft-signal');
});

test('every score is losslessly compatible with the deployed v1 codec and has a distinct play link', () => {
  const links = new Set();
  const encodings = new Set();
  for (const bandmate of NOUNS_DRUM_CLUB_BANDMATES) {
    assert.deepEqual(normalizeScore(bandmate.score), bandmate.score);
    const encoded = encodeScore(bandmate.score);
    assert.deepEqual(decodeScore(encoded), bandmate.score);
    assert.ok(encoded.length < 12_000);
    encodings.add(encoded);
    const playUrl = nounsDrumClubBandmatePlayUrl(bandmate);
    const url = new URL(playUrl);
    assert.equal(url.origin, 'https://pointcast.xyz');
    assert.equal(url.pathname, '/nouns/drum-club/');
    assert.deepEqual(decodeScore(url.searchParams.get('beat')), bandmate.score);
    links.add(playUrl);
    for (const lane of bandmate.score.lanes) {
      assert.equal(lane.steps.length, 16);
      assert.ok(lane.steps.some((velocity) => velocity > 0));
    }
  }
  assert.equal(encodings.size, 12);
  assert.equal(links.size, 12);
});

test('lookup accepts catalog id or slug without confusing catalog ids with token claims', () => {
  assert.equal(getNounsDrumClubBandmate(0)?.slug, 'pocket-captain');
  assert.equal(getNounsDrumClubBandmate('0')?.slug, 'pocket-captain');
  assert.equal(getNounsDrumClubBandmate('last-spark')?.id, 11);
  assert.equal(getNounsDrumClubBandmate('12'), undefined);
});

test('preview metadata exposes artwork and playable score while clearly separating mint state', () => {
  assert.equal(NOUNS_DRUM_CLUB_BANDMATES_STATUS, 'not-minted');
  for (const bandmate of NOUNS_DRUM_CLUB_BANDMATES) {
    const metadata = nounsDrumClubBandmateMetadata(bandmate);
    assert.equal(metadata.status, 'not-minted');
    assert.equal(metadata.minted, false);
    assert.equal(metadata.contract, null);
    assert.equal(metadata.token, null);
    assert.equal(metadata.artifactUri, `https://pointcast.xyz${bandmate.artwork.png}`);
    assert.equal(metadata.thumbnailUri, `https://pointcast.xyz${bandmate.artwork.webp}`);
    assert.equal(metadata.externalUri, metadata.playUri);
    assert.deepEqual(decodeScore(new URL(metadata.playUri).searchParams.get('beat')), bandmate.score);
    assert.match(metadata.rights, /Underlying Noun artwork is CC0/);
    assert.match(metadata.rights, /no additional formal license has been selected/);
    assert.equal(metadata.sourceArtworkUri, `https://noun.pics/${bandmate.nounId}.svg`);
    assert.equal('royalties' in metadata, false);
    assert.equal('price' in metadata, false);
    assert.equal('editionCap' in metadata, false);
    assert.ok(metadata.boundaries.some((line) => /No contract, token, mint, price, edition cap, wallet action, or financial claim/.test(line)));
  }
});

test('static preview metadata route emits all 12 ids with explicit not-minted headers', async () => {
  const paths = await getStaticPaths();
  assert.deepEqual(paths.map(({ params }) => params.id), Array.from({ length: 12 }, (_, index) => String(index)));
  for (const path of paths) {
    const response = await GET({ props: path.props });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('X-PointCast-Collectible-Status'), 'not-minted');
    assert.match(response.headers.get('Content-Type') ?? '', /^application\/json/);
    const body = await response.json();
    assert.equal(body.status, 'not-minted');
    assert.equal(body.minted, false);
    assert.equal(body.contract, null);
  }
});
