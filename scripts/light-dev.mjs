#!/usr/bin/env node
// Local server for Light Companion, no Cloudflare needed:
//
//   node scripts/light-dev.mjs [port]        default 8794, then open http://127.0.0.1:8794/light/
//
// Serves public/ as static files and mounts the real Pages Functions
// (functions/api/light.ts and functions/light/c/[[path]].ts) with no bindings,
// so circles live in the in-memory fallback store and vanish when this stops.
// The page shows "Practice mode" while it runs this way. Used by
// scripts/e2e-light-companion.mjs.
import { createReadStream, existsSync, statSync } from 'node:fs';
import http from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Readable } from 'node:stream';
import * as api from '../functions/api/light.ts';
import { onRequestGet as circlePage } from '../functions/light/c/[[path]].ts';

const root = resolve(fileURLToPath(new URL('../public/', import.meta.url)));
const port = Number(process.argv[2] || 8794);
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };

function staticFile(pathname) {
  let file = normalize(join(root, decodeURIComponent(pathname)));
  if (!file.startsWith(root)) return null;
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
  return existsSync(file) && statSync(file).isFile() ? file : null;
}
const ASSETS = {
  async fetch(input) {
    const file = staticFile(new URL(String(input.url || input)).pathname);
    return file
      ? new Response(Readable.toWeb(createReadStream(file)), { headers: { 'content-type': TYPES[extname(file)] || 'application/octet-stream' } })
      : new Response('not found', { status: 404 });
  },
};

async function route(request) {
  const url = new URL(request.url);
  if (url.pathname === '/api/light') {
    const handler = { GET: api.onRequestGet, POST: api.onRequestPost, OPTIONS: api.onRequestOptions }[request.method];
    return handler ? handler({ request, env: {} }) : new Response('method not allowed', { status: 405 });
  }
  if (url.pathname.startsWith('/light/c/')) {
    return circlePage({ request, env: { ASSETS }, params: { path: url.pathname.slice('/light/c/'.length).split('/').filter(Boolean) } });
  }
  return ASSETS.fetch(request);
}

http.createServer(async (req, res) => {
  try {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const request = new Request(`http://${req.headers.host}${req.url}`, {
      method: req.method,
      headers: req.headers,
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : Buffer.concat(chunks),
    });
    const response = await route(request);
    res.writeHead(response.status, Object.fromEntries(response.headers));
    if (response.body) Readable.fromWeb(response.body).pipe(res); else res.end();
  } catch (error) {
    res.writeHead(500, { 'content-type': 'text/plain' });
    res.end(String(error?.stack || error));
  }
}).listen(port, '127.0.0.1', () => console.log(`Light Companion (in-memory) on http://127.0.0.1:${port}/light/`));
