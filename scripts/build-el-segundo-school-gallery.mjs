import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const [sessionOne, sessionTwo] = process.argv.slice(2);
if (!sessionOne || !sessionTwo) {
  throw new Error('Usage: node scripts/build-el-segundo-school-gallery.mjs <session-1-dir> <session-2-dir>');
}

const root = process.cwd();
const publicRoot = path.join(root, 'public/images/el-segundo-school');
const displayRoot = path.join(publicRoot, 'display');
const thumbRoot = path.join(publicRoot, 'thumb');
const dataFile = path.join(root, 'src/data/el-segundo-school-gallery.json');

const sha256 = (value) => createHash('sha256').update(value).digest('hex');

function sourcePrompt(filename) {
  return filename
    .replace(/_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}_[0-3]\.png$/i, '')
    .replace(/\.png$/i, '')
    .replace(/_+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function variant(filename) {
  const match = filename.match(/_([0-3])\.png$/i);
  return match ? Number(match[1]) + 1 : 1;
}

function category(prompt) {
  const value = prompt.toLowerCase();
  if (/cannabis|flower commons|cultivar|genetic|trichome|terpene|grow|seed bank|botanical|herbarium|plant/.test(value)) return 'Botany + Flower Commons';
  if (/university|campus|student|alumni|faculty|curriculum|course|degree|commencement|journal|school/.test(value)) return 'University of El Segundo';
  if (/marine|ocean|dune|coast|field station|weather|sun|moon|el segundo/.test(value)) return 'El Segundo Fieldwork';
  if (/commons|collective|governance|proposal|membership|public service|organization|archive/.test(value)) return 'Commons + Systems';
  if (/type|typograph|minimal|poster|cover|sign|flyer|identity/.test(value)) return 'Type + Graphic Studies';
  return 'Open Studies';
}

function displayTitle(prompt, number) {
  const reading = prompt.match(/reading\s+(.{4,90})/i)?.[1];
  const basis = (reading || prompt)
    .replace(/\b(?:with|using|featuring|designed|rendered)\b.*$/i, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 72);
  if (!basis) return `Field Study ${number}`;
  return basis
    .toLowerCase()
    .replace(/(^|[\s—/+-])([a-z])/g, (_, lead, letter) => `${lead}${letter.toUpperCase()}`);
}

async function pngFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.png'))
    .map((entry) => path.join(directory, entry.name))
    .sort((left, right) => path.basename(left).localeCompare(path.basename(right), 'en'));
}

await rm(publicRoot, { recursive: true, force: true });
await mkdir(displayRoot, { recursive: true });
await mkdir(thumbRoot, { recursive: true });

const sessions = [await pngFiles(sessionOne), await pngFiles(sessionTwo)];
const sources = sessions.flat();
if (sources.length !== 652) throw new Error(`Expected 652 PNGs, found ${sources.length}`);

const works = [];
const originalHashes = new Set();

for (let index = 0; index < sources.length; index += 1) {
  const source = sources[index];
  const sourceBytes = await readFile(source);
  const originalSha256 = sha256(sourceBytes);
  if (originalHashes.has(originalSha256)) throw new Error(`Duplicate source image: ${source}`);
  originalHashes.add(originalSha256);

  const number = String(index + 1).padStart(3, '0');
  const baseName = `${number}-${originalSha256.slice(0, 12)}`;
  const displayPath = path.join(displayRoot, `${baseName}.webp`);
  const thumbPath = path.join(thumbRoot, `${baseName}.webp`);
  const metadata = await sharp(sourceBytes).metadata();

  const displayInfo = await sharp(sourceBytes)
    .rotate()
    .resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 82, effort: 5, smartSubsample: true })
    .toFile(displayPath);
  const thumbInfo = await sharp(sourceBytes)
    .rotate()
    .resize({ width: 420, height: 420, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 76, effort: 5, smartSubsample: true })
    .toFile(thumbPath);

  const displayBytes = await readFile(displayPath);
  const prompt = sourcePrompt(path.basename(source));
  const session = index < sessions[0].length ? 1 : 2;
  works.push({
    id: baseName,
    number,
    set: Math.floor(index / 4) + 1,
    variant: variant(path.basename(source)),
    session,
    title: displayTitle(prompt, number),
    category: category(prompt),
    prompt,
    src: `/images/el-segundo-school/display/${baseName}.webp`,
    thumb: `/images/el-segundo-school/thumb/${baseName}.webp`,
    width: displayInfo.width,
    height: displayInfo.height,
    sourceWidth: metadata.width,
    sourceHeight: metadata.height,
    displaySha256: sha256(displayBytes),
    originalSha256,
    originalFilename: path.basename(source),
  });

  if ((index + 1) % 25 === 0 || index + 1 === sources.length) {
    process.stdout.write(`processed ${index + 1}/${sources.length}\n`);
  }
}

const payload = {
  schema: 'pointcast.el-segundo-school.gallery.v1',
  generatedAt: new Date().toISOString(),
  artist: 'Michael Hoydich',
  location: 'El Segundo, California',
  source: 'Midjourney sessions 1 and 2',
  count: works.length,
  sets: Math.ceil(works.length / 4),
  works,
};

await writeFile(dataFile, `${JSON.stringify(payload, null, 2)}\n`);
await writeFile(path.join(publicRoot, '_headers'), `/*
  Access-Control-Allow-Origin: *
  Cache-Control: public, max-age=31536000, immutable
  X-Content-Type-Options: nosniff
`);
await writeFile(path.join(publicRoot, 'index.html'), `<!doctype html>
<html lang="en"><meta charset="utf-8"><title>The El Segundo School archive</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>body{margin:0;padding:8vw;background:#0826d6;color:#caff24;font:16px/1.5 monospace}h1{font:900 clamp(56px,12vw,160px)/.8 Arial,sans-serif;letter-spacing:-.07em;margin:.2em 0}a{color:inherit}</style>
<p>POINTCAST · MICHAEL HOYDICH · 2026</p><h1>THE EL SEGUNDO SCHOOL</h1>
<p>652 display works and thumbnails, preserved for the <a href="https://pointcast.xyz/el-segundo-school">PointCast gallery and makers</a>.</p>
`);
process.stdout.write(`wrote ${dataFile}\n`);
