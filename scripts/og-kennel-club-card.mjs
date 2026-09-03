#!/usr/bin/env node
/**
 * Kennel Club social cards.
 *
 * Generates 1200×630 PNGs for /kennel-club and every September sitting.
 * The collection card places the current plate beside the complete 30-day
 * strip; per-sitting cards retain the same register grammar with one plate.
 *
 * Output:
 *   public/images/kennel-club/og/kennel-club.png
 *   public/images/kennel-club/og/{NN}-{slug}.png
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import {
  buildKennelClubCollectionCard,
  buildKennelClubSittingCard,
} from '../src/lib/og-kennel-card.mjs';

const ROOT = process.cwd();
const DATA_PATH = path.join(ROOT, 'src/data/kennel-club-september-sitting.json');
const OUT_DIR = path.join(ROOT, 'public/images/kennel-club/og');

function imagePath(sitting) {
  return path.join(ROOT, 'public', sitting.image.png.replace(/^\//, ''));
}

async function dataUri(file, width, height) {
  const buffer = await sharp(file).resize(width, height, { fit: 'cover', position: 'centre' }).png().toBuffer();
  return `data:image/png;base64,${buffer.toString('base64')}`;
}

export async function generateKennelClubCards({ date = '2026-09-02' } = {}) {
  const series = JSON.parse(await fs.readFile(DATA_PATH, 'utf8'));
  const today = series.sittings.find((sitting) => sitting.mintDate === date) ?? series.sittings[0];
  await fs.mkdir(OUT_DIR, { recursive: true });
  await sharp(Buffer.from(buildKennelClubCollectionCard({
    sittings: series.sittings,
    today,
    plateHref: await dataUri(imagePath(today), 510, 510),
  }))).png().toFile(path.join(OUT_DIR, 'kennel-club.png'));
  await Promise.all(series.sittings.map(async (sitting) => {
    const name = `${String(sitting.day).padStart(2, '0')}-${sitting.slug.replace(/^\d+-/, '')}.png`;
    await sharp(Buffer.from(buildKennelClubSittingCard({
      sitting,
      plateHref: await dataUri(imagePath(sitting), 520, 630),
    }))).png().toFile(path.join(OUT_DIR, name));
  }));
  return { outputDir: OUT_DIR, collection: 'kennel-club.png', sittings: series.sittings.length, today: today.slug };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = await generateKennelClubCards({ date: process.env.KENNEL_CLUB_OG_DATE || '2026-09-02' });
  console.log(`Generated ${result.sittings + 1} Kennel Club OG cards in ${result.outputDir} (today: ${result.today}).`);
}
