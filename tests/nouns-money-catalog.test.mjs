import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { SOURCE_CATALOG } from '../src/lib/nouns-money/catalog.ts';

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const publicBytes = assetPath => readFileSync(new URL('../public' + assetPath, import.meta.url));

test('catalog and provenance match all 100 canonical SVG, PNG and WebP assets', async () => {
  const manifest = JSON.parse(readFileSync(new URL('../src/data/nouns-money-hundred.json', import.meta.url), 'utf8'));
  const provenance = JSON.parse(readFileSync(new URL('../public/images/nouns-money/source-100/provenance.json', import.meta.url), 'utf8'));
  assert.equal(SOURCE_CATALOG.count, 100);
  assert.equal(new Set(SOURCE_CATALOG.notes.map(note => note.id)).size, 100);
  assert.equal(provenance.notes.length, 100);

  for (const note of SOURCE_CATALOG.notes) {
    const source = manifest.catalog.find(item => item.nounId === note.nounId);
    const proof = provenance.notes.find(item => item.id === note.id);
    assert.ok(source, note.id);
    assert.ok(proof, note.id);
    const base = '/images/nouns-money/nordic-100/' + source.file;
    assert.equal(note.specimenId, source.serial);
    assert.equal(note.svg, base + '.svg');
    assert.equal(note.image, base + '.webp');
    assert.equal(proof.svg, note.svg);
    assert.equal(proof.preview, note.image);
    assert.equal(proof.png, base + '.png');

    const svg = publicBytes(note.svg);
    const png = publicBytes(proof.png);
    const preview = publicBytes(note.image);
    assert.equal(sha256(svg), source.svgSha256, note.id + ' canonical SVG');
    assert.equal(proof.svg_sha256, source.svgSha256, note.id + ' SVG provenance');
    assert.equal(sha256(png), source.pngSha256, note.id + ' canonical PNG');
    assert.equal(proof.png_sha256, source.pngSha256, note.id + ' PNG provenance');
    assert.equal(sha256(preview), proof.preview_sha256, note.id + ' WebP provenance');
    assert.equal(preview.length, proof.preview_bytes, note.id + ' WebP bytes');
    const metadata = await sharp(preview).metadata();
    assert.equal(metadata.format, 'webp');
    assert.equal(proof.preview_width, metadata.width, note.id + ' WebP width');
    assert.equal(proof.preview_height, metadata.height, note.id + ' WebP height');
    assert.deepEqual([metadata.width, metadata.height], [1000, 500], note.id + ' canonical dimensions');
  }
});
