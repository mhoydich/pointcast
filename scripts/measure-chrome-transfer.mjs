#!/usr/bin/env node
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join, posix, resolve } from 'node:path';

const [distArg = 'dist', ...routeArgs] = process.argv.slice(2);
const routes = routeArgs.length ? routeArgs : ['/about', '/coffee', '/kennel-club', '/'];
const distRoot = resolve(distArg);

function routeFile(route) {
  return join(distRoot, route === '/' ? 'index.html' : route.slice(1), route === '/' ? '' : 'index.html');
}

function assetFile(asset) {
  return join(distRoot, asset.replace(/^\//, ''));
}

function directScripts(html) {
  return [...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)]
    .map((match) => match[1])
    .filter((src) => src.startsWith('/_astro/') && src.endsWith('.js'));
}

function inlineScriptBytes(html) {
  return [...html.matchAll(/<script\b(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/gi)]
    .filter(([, attributes]) => !/type=["']application\/(?:ld\+)?json/i.test(attributes))
    .reduce((bytes, match) => bytes + Buffer.byteLength(match[2]), 0);
}

function moduleGraph(entries) {
  const seen = new Set();
  const visit = (asset) => {
    if (seen.has(asset) || !existsSync(assetFile(asset))) return;
    seen.add(asset);
    const source = readFileSync(assetFile(asset), 'utf8');
    for (const match of source.matchAll(/(?:\bfrom\s*|\bimport\s*)["'](\.\/[^"']+\.js)["']/g)) {
      visit(posix.resolve(posix.dirname(asset), match[1]));
    }
  };
  entries.forEach(visit);
  return seen;
}

const rows = [];
const allAssets = new Set();
let totalInline = 0;

for (const route of routes) {
  const file = routeFile(route);
  if (!existsSync(file)) throw new Error(`missing built route: ${file}`);
  const html = readFileSync(file, 'utf8');
  const inline = inlineScriptBytes(html);
  const assets = moduleGraph(directScripts(html));
  const external = [...assets].reduce((bytes, asset) => bytes + statSync(assetFile(asset)).size, 0);
  assets.forEach((asset) => allAssets.add(asset));
  totalInline += inline;
  rows.push({ route, html: statSync(file).size, inline, external, firstVisitJs: inline + external });
}

const uniqueExternal = [...allAssets].reduce((bytes, asset) => bytes + statSync(assetFile(asset)).size, 0);
const totalTransfer = totalInline + uniqueExternal;

console.log('| Route | HTML bytes | Inline JS bytes | External JS graph bytes | First-visit JS bytes |');
console.log('|---|---:|---:|---:|---:|');
for (const row of rows) {
  console.log(`| ${row.route} | ${row.html} | ${row.inline} | ${row.external} | ${row.firstVisitJs} |`);
}
console.log('');
console.log(`Four-route JS transfer with external modules cached: ${totalTransfer} bytes`);
console.log(`Unique external module graph: ${uniqueExternal} bytes across ${allAssets.size} assets`);
