#!/usr/bin/env node
/**
 * rasterize-favicon.mjs — generate favicon.ico + raster PNGs from favicon.svg.
 *
 * Mike pinged the favicon ask three times (4/19 08:17, 4/20 21:31) asking
 * for a broadcast-dish icon and complaining the old emoji-on-SVG fallback
 * occasionally rendered with red tones. Tonight (4/20 still) we replaced
 * favicon.svg with a geometric dish. This script rasterizes it so iOS /
 * older browsers / the Cloudflare Pages OG pipeline all have .ico and
 * sized PNGs to reach for.
 *
 * Outputs (all in public/):
 *   - favicon.ico   (PNG-in-ICO wrapping 32×32, standard modern format)
 *   - favicon-16.png, favicon-32.png, favicon-48.png
 *   - apple-touch-icon.png (180×180)
 *   - icon-192.png, icon-512.png (PWA manifest)
 *   - og-card-base.png (not touched — shipped separately)
 *
 * Usage: `node scripts/rasterize-favicon.mjs`
 * Deps:  sharp (already a transitive dep of astro).
 */
import sharp from 'sharp';
import { writeFile, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SVG = join(ROOT, 'public', 'favicon.svg');
const PUB = join(ROOT, 'public');

async function renderPng(svgBuf, size) {
  return sharp(svgBuf, { density: 384 })
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toBuffer();
}

/**
 * Build a PNG-in-ICO file from one or more PNG buffers.
 * ICO layout:
 *   header (6 bytes)
 *   N × directory entries (16 bytes each)
 *   N × PNG blobs (back-to-back)
 */
function buildIco(entries) {
  const N = entries.length;
  const headerSize = 6;
  const dirSize = 16 * N;
  let offset = headerSize + dirSize;

  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0);          // reserved
  header.writeUInt16LE(1, 2);          // type: ICO
  header.writeUInt16LE(N, 4);          // count

  const dirBufs = [];
  const imgBufs = [];

  for (const { size, buf } of entries) {
    const d = Buffer.alloc(16);
    d.writeUInt8(size >= 256 ? 0 : size, 0);   // width (0 = 256)
    d.writeUInt8(size >= 256 ? 0 : size, 1);   // height
    d.writeUInt8(0, 2);                        // palette count
    d.writeUInt8(0, 3);                        // reserved
    d.writeUInt16LE(1, 4);                     // color planes
    d.writeUInt16LE(32, 6);                    // bits per pixel
    d.writeUInt32LE(buf.length, 8);            // data size
    d.writeUInt32LE(offset, 12);               // data offset
    dirBufs.push(d);
    imgBufs.push(buf);
    offset += buf.length;
  }

  return Buffer.concat([header, ...dirBufs, ...imgBufs]);
}

async function main() {
  const svgBuf = await readFile(SVG);

  // Raster PNGs
  const sizes = {
    'favicon-16.png': 16,
    'favicon-32.png': 32,
    'favicon-48.png': 48,
    'apple-touch-icon.png': 180,
    'icon-192.png': 192,
    'icon-512.png': 512,
  };

  for (const [name, size] of Object.entries(sizes)) {
    const png = await renderPng(svgBuf, size);
    await writeFile(join(PUB, name), png);
    console.log(`wrote public/${name} (${png.length} bytes)`);
  }

  // ICO (multi-size PNG-in-ICO)
  const ico16 = await renderPng(svgBuf, 16);
  const ico32 = await renderPng(svgBuf, 32);
  const ico48 = await renderPng(svgBuf, 48);
  const ico = buildIco([
    { size: 16, buf: ico16 },
    { size: 32, buf: ico32 },
    { size: 48, buf: ico48 },
  ]);
  await writeFile(join(PUB, 'favicon.ico'), ico);
  console.log(`wrote public/favicon.ico (${ico.length} bytes, 3 sizes)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
