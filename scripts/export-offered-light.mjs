// Export the reviewed prototype as offline HTML. No browser or network needed.
import { readFile, mkdir, writeFile, copyFile, readdir } from 'node:fs/promises';
import { resolve, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const app = resolve(repo, 'public/offered-light-lab');
const out = resolve(process.argv[2] || '/tmp/pointcast-offered-light');
await mkdir(out, { recursive: true });
const mime = { '.webp': 'image/webp', '.woff2': 'font/woff2', '.ttf': 'font/ttf' };
async function asset(path) { return `data:${mime[extname(path)]};base64,${(await readFile(path)).toString('base64')}`; }
async function replaceAsync(source, expression, replace) {
  const matches = [...source.matchAll(expression)];
  const replacements = await Promise.all(matches.map(replace));
  for (let i = matches.length - 1; i >= 0; i--) source = source.slice(0, matches[i].index) + replacements[i] + source.slice(matches[i].index + matches[i][0].length);
  return source;
}
for (const [name, output] of [['index.html', 'offered-light.html'], ['effects-lab.html', 'effects-playground.html']]) {
  let html = await readFile(resolve(app, name), 'utf8');
  html = await replaceAsync(html, /<link rel="stylesheet" href="([^"]+)">/g, async match => {
    const cssFile = resolve(app, match[1]);
    let css = await readFile(cssFile, 'utf8');
    css = await replaceAsync(css, /url\(['"]?([^)'"\s]+)['"]?\)/g, async entry => `url(${await asset(resolve(dirname(cssFile), entry[1]))})`);
    return `<style>${css}</style>`;
  });
  html = await replaceAsync(html, /<script src="([^"]+)"><\/script>/g, async match => `<script>${(await readFile(resolve(app, match[1]), 'utf8')).replaceAll('</script', '<\\/script')}</script>`);
  html = await replaceAsync(html, /assets\/[a-z0-9-]+\.webp/g, async match => asset(resolve(app, match[0])));
  html = html.replaceAll('href="index.html"', 'href="offered-light.html"').replaceAll('href="effects-lab.html"', 'href="effects-playground.html"').replaceAll('href="../pointcast-effects/v0.1.0/README.md"', 'href="effects/README.md"');
  await writeFile(resolve(out, output), html);
  console.log(`${output}: ${Buffer.byteLength(html)} bytes`);
}
await writeFile(resolve(out, 'design-board.html'), (await readFile(resolve(app, 'design-board.html'), 'utf8')).replaceAll('href="index.html"', 'href="offered-light.html"'));
await copyFile(resolve(app, 'artwork-provenance.json'), resolve(out, 'artwork-provenance.json'));
await mkdir(resolve(out, 'effects'), { recursive: true });
const library = resolve(repo, 'public/pointcast-effects/v0.1.0');
for (const file of await readdir(library)) await copyFile(resolve(library, file), resolve(out, 'effects', file));
console.log(`Exported to ${out}. Open offered-light.html in a browser.`);
