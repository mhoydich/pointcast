#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { cp, mkdtemp, mkdir, readFile, readdir, rm, utimes, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, dirname, join, relative, resolve, sep } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  NOUNS_DRUM_CLUB_BANDMATES,
  nounsDrumClubBandmateMetadata,
} from '../src/lib/nouns-drum-club-bandmates.ts';

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const campaignArchive = join(repo, 'public/ads/nouns-drum-club/campaign-kit.zip');
const bandmatesArchive = join(repo, 'public/images/nouns-drum-club/bandmates/bandmates-kit.zip');

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function run(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} failed: ${result.stderr || result.stdout}`);
  return result.stdout;
}

function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

async function dimensions(path) {
  const data = await readFile(path);
  if (path.endsWith('.png')) {
    invariant(data.subarray(1, 4).toString() === 'PNG', `Invalid PNG: ${path}`);
    return [data.readUInt32BE(16), data.readUInt32BE(20)];
  }
  if (path.endsWith('.webp')) {
    invariant(data.subarray(0, 4).toString() === 'RIFF' && data.subarray(8, 12).toString() === 'WEBP', `Invalid WebP: ${path}`);
    const kind = data.subarray(12, 16).toString();
    if (kind === 'VP8X') return [1 + data.readUIntLE(24, 3), 1 + data.readUIntLE(27, 3)];
    if (kind === 'VP8 ') {
      invariant(data.subarray(23, 26).equals(Buffer.from([0x9d, 0x01, 0x2a])), `Invalid VP8 WebP: ${path}`);
      return [data.readUInt16LE(26) & 0x3fff, data.readUInt16LE(28) & 0x3fff];
    }
    if (kind === 'VP8L') {
      invariant(data[20] === 0x2f, `Invalid VP8L WebP: ${path}`);
      const bits = data.readUInt32LE(21);
      return [1 + (bits & 0x3fff), 1 + ((bits >>> 14) & 0x3fff)];
    }
    throw new Error(`Unsupported WebP encoding in ${path}`);
  }
  if (path.endsWith('.svg')) {
    const svg = data.toString('utf8', 0, 1024);
    const width = svg.match(/<svg\b[^>]*\bwidth=["'](\d+(?:\.\d+)?)["']/i)?.[1];
    const height = svg.match(/<svg\b[^>]*\bheight=["'](\d+(?:\.\d+)?)["']/i)?.[1];
    invariant(width && height, `SVG has no numeric dimensions: ${path}`);
    return [Number(width), Number(height)];
  }
  throw new Error(`Cannot read dimensions for ${path}`);
}

async function copyFileInto(root, source, destination) {
  invariant(!source.endsWith('.zip'), `Archives cannot contain archives: ${source}`);
  const target = join(root, destination);
  await mkdir(dirname(target), { recursive: true });
  await cp(source, target);
  invariant(sha256(await readFile(source)) === sha256(await readFile(target)), `Copy hash mismatch: ${destination}`);
  return destination;
}

async function filesBelow(root) {
  const output = [];
  async function visit(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) await visit(path);
      else output.push(relative(root, path).split(sep).join('/'));
    }
  }
  await visit(root);
  return output.sort();
}

async function addChecksums(packageRoot) {
  const files = (await filesBelow(packageRoot)).filter((path) => path !== 'SHA256SUMS.txt');
  const lines = [];
  for (const path of files) lines.push(`${sha256(await readFile(join(packageRoot, path)))}  ${path}`);
  await writeFile(join(packageRoot, 'SHA256SUMS.txt'), `${lines.join('\n')}\n`);
}

async function setFixedTimes(path) {
  for (const entry of await readdir(path, { withFileTypes: true })) {
    const child = join(path, entry.name);
    if (entry.isDirectory()) await setFixedTimes(child);
    await utimes(child, new Date('2026-09-22T00:00:00Z'), new Date('2026-09-22T00:00:00Z'));
  }
  await utimes(path, new Date('2026-09-22T00:00:00Z'), new Date('2026-09-22T00:00:00Z'));
}

async function zipAndVerify(stage, packageName, archive, expectedFiles) {
  await rm(archive, { force: true });
  await setFixedTimes(join(stage, packageName));
  run('zip', ['-X', '-q', '-r', archive, packageName], stage);
  const entries = run('unzip', ['-Z1', archive], stage).trim().split('\n').filter((path) => !path.endsWith('/'));
  invariant(!entries.some((path) => path.endsWith('.zip')), `${basename(archive)} contains a nested ZIP`);
  invariant(!entries.some((path) => path.startsWith('/') || path.split('/').includes('..')), `${basename(archive)} contains an unsafe path`);
  invariant(entries.length === expectedFiles, `${basename(archive)} has ${entries.length} files; expected ${expectedFiles}`);
  const verify = join(stage, `verify-${packageName}`);
  await mkdir(verify);
  run('unzip', ['-q', archive, '-d', verify], stage);
  const originalRoot = join(stage, packageName);
  const extractedRoot = join(verify, packageName);
  for (const path of await filesBelow(originalRoot)) {
    invariant(sha256(await readFile(join(originalRoot, path))) === sha256(await readFile(join(extractedRoot, path))), `ZIP hash mismatch: ${path}`);
  }
  return { archive, files: entries.length, bytes: (await readFile(archive)).byteLength, sha256: sha256(await readFile(archive)) };
}

async function buildCampaign(stage) {
  const packageName = 'nouns-drum-club-campaign';
  const root = join(stage, packageName);
  const manifestPath = join(repo, 'public/ads/nouns-drum-club/campaign.json');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  invariant(manifest.assets?.length === 30, `Campaign manifest has ${manifest.assets?.length ?? 0} ads; expected 30`);
  invariant(manifest.concepts?.length === 3, 'Campaign manifest must have three concepts');

  const copied = [];
  for (const asset of manifest.assets) {
    for (const format of ['png', 'svg', 'html']) {
      const source = join(repo, 'public', asset[format].replace(/^\//, ''));
      const destination = asset[format].replace(/^\//, '');
      copied.push(await copyFileInto(root, source, destination));
    }
    const png = join(repo, 'public', asset.png.replace(/^\//, ''));
    const svg = join(repo, 'public', asset.svg.replace(/^\//, ''));
    const html = await readFile(join(repo, 'public', asset.html.replace(/^\//, '')), 'utf8');
    invariant((await dimensions(png)).join('x') === `${asset.width}x${asset.height}`, `PNG dimensions disagree: ${asset.id}`);
    invariant((await dimensions(svg)).join('x') === `${asset.width}x${asset.height}`, `SVG dimensions disagree: ${asset.id}`);
    invariant(sha256(await readFile(png)) === asset.sha256, `Manifest hash disagrees: ${asset.id}`);
    invariant(html.includes(`src="${basename(asset.png)}"`), `HTML does not use its sibling PNG: ${asset.id}`);
    const svgText = await readFile(svg, 'utf8');
    const imageReference = svgText.match(/<image\b[^>]*\bhref=["']([^"']+)["']/i)?.[1];
    if (imageReference) invariant(imageReference.startsWith('../../images/nouns-drum-club/campaign/'), `SVG master reference is not package-relative: ${asset.id}`);
    invariant(!/data:image\//i.test(svgText), `SVG embeds base64 artwork: ${asset.id}`);
  }
  invariant(copied.filter((path) => path.endsWith('.png')).length === 30, 'Campaign requires 30 ad PNGs');
  invariant(copied.filter((path) => path.endsWith('.svg')).length === 30, 'Campaign requires 30 ad SVGs');
  invariant(copied.filter((path) => path.endsWith('.html')).length === 30, 'Campaign requires 30 ad HTML files');

  for (const concept of manifest.concepts) {
    for (const format of ['png', 'webp']) {
      const source = join(repo, `public/images/nouns-drum-club/campaign/${concept.id}.${format}`.replace('everybody.', 'everybody-band.'));
      const destination = `images/nouns-drum-club/campaign/${basename(source)}`;
      await copyFileInto(root, source, destination);
      invariant((await dimensions(source)).join('x') === '1536x1024', `Master dimensions disagree: ${basename(source)}`);
    }
  }
  await copyFileInto(root, manifestPath, 'campaign.json');
  await copyFileInto(root, join(repo, 'docs/campaigns/nouns-drum-club/series.json'), 'docs/series.json');
  const readme = `# Nouns Drum Club campaign kit\n\nPreview campaign package for PointCast’s Nouns Drum Club.\n\n## Contents\n\n- 30 placements in PNG, SVG, and HTML: 90 ad files total.\n- 3 source compositions in PNG and WebP at 1536 × 1024.\n- \`campaign.json\` placement manifest and \`docs/series.json\` creative prompt record.\n- \`SHA256SUMS.txt\` for delivery verification.\n\nPlacements cover 160 × 600, 300 × 250, 300 × 600, 320 × 50, 320 × 100, 336 × 280, 728 × 90, 970 × 250, 1080 × 1080, and 1080 × 1920 for each of three concepts. HTML placements use the sibling PNG; SVG placements use package-relative source art. Keep the included folder structure intact.\n\nDeliver by unzipping the whole package and hosting its contents together. These are static, silent placements: no audio, animation, tracking script, wallet action, mint action, or autoplay is included. Links open the free Nouns Drum Club player, where sound starts only after a person interacts.\n`;
  await writeFile(join(root, 'README.md'), readme);
  await addChecksums(root);
  return zipAndVerify(stage, packageName, campaignArchive, 100);
}

async function buildBandmates(stage) {
  const packageName = 'nouns-drum-club-bandmates';
  const root = join(stage, packageName);
  invariant(NOUNS_DRUM_CLUB_BANDMATES.length === 12, 'Bandmates package requires 12 entries');
  for (const bandmate of NOUNS_DRUM_CLUB_BANDMATES) {
    for (const format of ['png', 'webp', 'svg']) {
      const source = join(repo, 'public', bandmate.artwork[format].replace(/^\//, ''));
      await copyFileInto(root, source, bandmate.artwork[format].replace(/^\//, ''));
      const expected = format === 'webp' ? '800x800' : '1600x1600';
      invariant((await dimensions(source)).join('x') === expected, `${format.toUpperCase()} dimensions disagree: ${bandmate.slug}`);
      if (format === 'svg') invariant(!/data:image\//i.test(await readFile(source, 'utf8')), `SVG embeds base64 artwork: ${bandmate.slug}`);
    }
    const metadata = nounsDrumClubBandmateMetadata(bandmate);
    invariant(metadata.status === 'not-minted' && metadata.minted === false && metadata.contract === null && metadata.token === null, `Metadata status is unsafe: ${bandmate.slug}`);
    await mkdir(join(root, 'metadata'), { recursive: true });
    await writeFile(join(root, `metadata/${bandmate.id}.json`), `${JSON.stringify(metadata, null, 2)}\n`);
  }
  await copyFileInto(root, join(repo, 'src/data/nouns-drum-club-bandmates.json'), 'data/nouns-drum-club-bandmates.json');
  await copyFileInto(root, join(repo, 'public/images/nouns-drum-club/bandmates/provenance.json'), 'images/nouns-drum-club/bandmates/provenance.json');
  const readme = `# Nouns Drum Club Bandmates kit\n\nTwelve playable collectible previews for PointCast’s Nouns Drum Club. This collection is **not minted**. There is no contract, token, price, edition cap, creator wallet, signing request, or financial claim in this package.\n\n## Contents\n\n- 12 PNG cards at 1600 × 1600.\n- 12 WebP previews at 800 × 800.\n- 12 SVG companion sources at 1600 × 1600.\n- 12 preview metadata files generated from the same adapter used by the website.\n- Canonical 16-step scores in \`data/nouns-drum-club-bandmates.json\`.\n- Artwork and score provenance plus \`SHA256SUMS.txt\`.\n\nEach metadata file links to the exact score in the free Drum Club player. Opening a link does not autoplay audio; a person must enable sound. The underlying Noun artwork is CC0. PointCast publishes these cards and scores as remix-friendly project sources; no additional formal license has been selected.\n`;
  await writeFile(join(root, 'README.md'), readme);
  await addChecksums(root);
  return zipAndVerify(stage, packageName, bandmatesArchive, 52);
}

const stage = await mkdtemp(join(tmpdir(), 'nouns-drum-club-package-'));
try {
  const campaign = await buildCampaign(stage);
  const bandmates = await buildBandmates(stage);
  console.log(JSON.stringify({ campaign, bandmates }, null, 2));
} finally {
  await rm(stage, { recursive: true, force: true });
}
