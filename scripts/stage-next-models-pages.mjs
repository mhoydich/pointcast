#!/usr/bin/env node
import { cp, mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
const dist = join(root, 'dist');
const staged = join(root, '.pages-dist');
const base = '/pointcast';

await rm(staged, { recursive: true, force: true });
await mkdir(staged, { recursive: true });

for (const relativePath of [
  '_astro',
  'images/next-models',
  'next-models',
]) {
  await cp(join(dist, relativePath), join(staged, relativePath), { recursive: true });
}

for (const relativePath of ['favicon.svg', 'manifest.webmanifest', 'next-models.json']) {
  await cp(join(dist, relativePath), join(staged, relativePath));
}

const deskPath = join(staged, 'next-models', 'index.html');
let deskHtml = await readFile(deskPath, 'utf8');

deskHtml = deskHtml.replace(/\b(href|src)="\/([^"#]*)"/g, (match, attribute, path) => {
  if (path === 'pointcast' || path.startsWith('pointcast/')) return match;

  const local = [
    '_astro/',
    'favicon.svg',
    'images/next-models/',
    'manifest.webmanifest',
    'next-models',
  ].some((prefix) => path === prefix || path.startsWith(prefix));

  return local
    ? `${attribute}="${base}/${path}"`
    : `${attribute}="https://pointcast.xyz/${path}"`;
});

await writeFile(deskPath, deskHtml);

const target = `${base}/next-models/`;
const redirect = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta http-equiv="refresh" content="0; url=${target}" />
    <link rel="canonical" href="https://pointcast.xyz/next-models" />
    <title>Next Models — PointCast</title>
  </head>
  <body><p><a href="${target}">Open Next Models</a></p></body>
</html>
`;

await writeFile(join(staged, 'index.html'), redirect);
await writeFile(join(staged, '404.html'), redirect);
await writeFile(join(staged, '.nojekyll'), '');

await rm(dist, { recursive: true, force: true });
await rename(staged, dist);

console.log('Staged focused GitHub Pages artifact at dist/');
