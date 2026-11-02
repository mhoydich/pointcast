#!/usr/bin/env node
/** Read-only, loopback-only preview of a verified, frozen edition export. */
import { createHash } from 'node:crypto';
import { createServer } from 'node:http';
import { lstat, readFile, realpath } from 'node:fs/promises';
import { extname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

const CSP = "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'";
const headers = { 'Content-Security-Policy': CSP, 'X-Robots-Tag': 'noindex, nofollow', 'Referrer-Policy': 'no-referrer', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.md': 'text/plain; charset=utf-8', '.webp': 'image/webp', '.zip': 'application/zip' };

export async function startReviewServer(directory, { port = 57100 } = {}) {
  if (!isAbsolute(directory) || !Number.isInteger(port) || port < 0 || port > 65535) throw new Error('Use an absolute export path and a valid port');
  const root = await realpath(directory);
  if ((await lstat(join(root, 'manifest.json'))).size > 256_000) throw new Error('Unexpected review manifest size');
  const manifestBytes = await readFile(join(root, 'manifest.json'));
  const manifest = JSON.parse(manifestBytes);
  if (manifest.schema !== 'signal-atlas.local-edition-export/v1' || manifest.status !== 'local-only-not-deployed' || manifest.reviewEntrypoint !== 'index.html') throw new Error('Expected a Signal Atlas local review export');
  const files = new Map([['manifest.json', manifestBytes]]);
  const entries = Object.entries(manifest.fileHashes ?? {});
  if (entries.length < 5 || entries.length > 300) throw new Error('Unexpected review package size');
  let size = manifestBytes.length;
  for (const [path, hash] of entries) {
    if (isAbsolute(path) || path.split('/').includes('..') || !/^[a-f0-9]{64}$/.test(hash)) throw new Error('Unsafe manifest entry');
    const file = join(root, path);
    const rel = relative(root, await realpath(file));
    const stat = await lstat(file);
    if (rel === '..' || rel.startsWith('..' + sep) || isAbsolute(rel) || !stat.isFile()) throw new Error('Unsafe artifact path');
    if (size + stat.size > 15_000_000) throw new Error('Review package exceeds 15 MB');
    const bytes = await readFile(file);
    if ((size += bytes.length) > 15_000_000) throw new Error('Review package exceeds 15 MB');
    if (createHash('sha256').update(bytes).digest('hex') !== hash) throw new Error('Artifact hash mismatch: ' + path);
    files.set(path, bytes);
  }
  const server = createServer((request, response) => {
    if (!['GET', 'HEAD'].includes(request.method)) { response.writeHead(405, { ...headers, Allow: 'GET, HEAD' }); response.end('Read-only preview'); return; }
    try {
      const url = new URL(request.url, 'http://127.0.0.1');
      let path = decodeURIComponent(url.pathname).replace(/^\/+/, '');
      if (path === 'favicon.ico') { response.writeHead(204, headers); response.end(); return; }
      if (path && !path.endsWith('/') && files.has(path + '/index.html')) {
        response.writeHead(308, { ...headers, Location: url.pathname + '/' + url.search }); response.end(); return;
      }
      if (!path || path.endsWith('/')) path += 'index.html';
      const body = files.get(path);
      if (!body) { response.writeHead(404, headers); response.end('No such local preview file'); return; }
      response.writeHead(200, { ...headers, 'Content-Type': mime[extname(path)] ?? 'application/octet-stream', 'Content-Length': body.length });
      response.end(request.method === 'HEAD' ? undefined : body);
    } catch { response.writeHead(400, headers); response.end('Invalid local preview request'); }
  });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(port, '127.0.0.1', resolve); });
  return { server, origin: 'http://127.0.0.1:' + server.address().port, files: files.size, manifestSha256: createHash('sha256').update(manifestBytes).digest('hex') };
}

if (process.argv[1] && import.meta.url === pathToFileURL(await realpath(resolve(process.argv[1]))).href) {
  try {
    const args = process.argv.slice(2);
    if (args.length !== 1 && !(args.length === 3 && args[1] === '--port' && /^\d+$/.test(args[2]))) throw new Error('Usage: node scripts/signal-atlas-preview.mjs /absolute/export-directory [--port 57100]');
    const port = args.length === 3 ? Number(args[2]) : 57100;
    if (port < 1024 || port > 65535) throw new Error('CLI port must be between 1024 and 65535');
    const result = await startReviewServer(args[0], { port });
    console.log(JSON.stringify({ pid: process.pid, binding: '127.0.0.1 only', launcher: result.origin + '/', exportRoot: args[0], manifestSha256: result.manifestSha256, files: result.files, state: 'Local review; no live traffic or API endpoints' }));
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
