import { createReadStream } from 'node:fs';
import { realpath, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, resolve, sep } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { openStore, validAddress } from './store.js';
import { startSync } from './sync.js';

const TV = fileURLToPath(new URL('../tv', import.meta.url));
const TYPES = new Map(Object.entries({
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript',
  '.mjs': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.gif': 'image/gif', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.mp4': 'video/mp4',
}));

function json(response, status, data) {
  response.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  response.end(JSON.stringify(data));
}

async function readPost(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request.iterator({ destroyOnReturn: false })) {
    size += chunk.length;
    if (size > 64 * 1024) {
      request.resume();
      throw Object.assign(new Error('Request body too large'), { status: 413 });
    }
    chunks.push(chunk);
  }
  const input = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new TypeError('Expected a line object');
  return input;
}

async function serveStatic(request, response, root, pathname) {
  if (!root) return false;
  const path = resolve(root, '.' + decodeURIComponent(pathname));
  if (path !== root && !path.startsWith(root + sep)) return false;
  try {
    let file = await realpath(path);
    if ((await stat(file)).isDirectory()) file = await realpath(resolve(file, 'index.html'));
    if (!file.startsWith(root + sep)) return false;
    const info = await stat(file);
    if (!info.isFile()) return false;
    response.writeHead(200, {
      'Content-Type': TYPES.get(extname(file).toLowerCase()) ?? 'application/octet-stream',
      'Content-Length': info.size,
      'X-Content-Type-Options': 'nosniff',
    });
    if (request.method === 'HEAD') response.end();
    else await pipeline(createReadStream(file), response);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT' || error.code === 'ENOTDIR') return false;
    throw error;
  }
}

export async function startNode({
  directory = resolve('.noun-node'), host = '0.0.0.0', port = 8080, mdns = true,
  peers = [], bridge = [], interval = 5000, tvDirectory = TV, fetchJson = fetch,
  onError = error => console.error('noun-node:', error.message),
} = {}) {
  if (!bridge.every(validAddress)) throw new TypeError('Invalid bridge address');
  const staticRoot = await realpath(tvDirectory).catch(error => {
    if (error.code !== 'ENOENT') throw error;
    return null;
  });
  const store = openStore(directory);
  const server = createServer(async (request, response) => {
    try {
      const { pathname, searchParams } = new URL(request.url, 'http://localhost');
      if (request.method === 'GET' && pathname === '/have') return json(response, 200, store.have());
      if (request.method === 'GET' && pathname === '/lines') {
        const address = searchParams.get('to');
        const since = searchParams.get('since') ?? '0';
        if (!validAddress(address) || !/^\d+$/.test(since) || !Number.isSafeInteger(Number(since))) {
          return json(response, 400, { error: 'Expected to and a nonnegative integer since' });
        }
        return json(response, 200, store.lines(address, Number(since)));
      }
      if (request.method === 'POST' && pathname === '/lines') {
        const input = await readPost(request);
        const result = Object.hasOwn(input, 'sig') ? store.ingest(input) : store.originate(input);
        return json(response, result.added ? 201 : 200, result.line);
      }
      if (pathname === '/lines' || pathname === '/have') {
        response.setHeader('Allow', pathname === '/lines' ? 'GET, POST' : 'GET');
        return json(response, 405, { error: 'Method not allowed' });
      }
      if (['GET', 'HEAD'].includes(request.method) &&
          await serveStatic(request, response, staticRoot, pathname)) return;
      json(response, 404, { error: 'Not found' });
    } catch (error) {
      if (response.destroyed || response.headersSent) return;
      const status = error.status ?? (error instanceof TypeError || error instanceof SyntaxError ||
        error instanceof URIError ? 400 : 500);
      if (status === 500) onError(error);
      json(response, status, { error: status === 500 ? 'Internal server error' : error.message });
    }
  });
  await new Promise((accept, reject) => {
    server.once('error', reject);
    server.listen(port, host, () => {
      server.off('error', reject);
      accept();
    });
  });
  const boundPort = server.address().port;
  let stopSync;
  try {
    stopSync = startSync({ store, port: boundPort, mdns, peers, bridge, interval, fetchJson, onError });
  } catch (error) {
    server.close();
    throw error;
  }
  return {
    port: boundPort,
    async close() {
      await Promise.all([stopSync(), new Promise((accept, reject) => {
        server.close(error => error ? reject(error) : accept());
      })]);
    },
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const list = name => (process.env[name] ?? '').split(',').map(value => value.trim()).filter(Boolean);
  const node = await startNode({
    directory: process.env.NOUN_DATA_DIR,
    host: process.env.NOUN_HOST,
    port: Number(process.env.NOUN_PORT ?? 8080),
    mdns: process.env.NOUN_MDNS !== '0',
    peers: list('NOUN_PEERS'),
    bridge: process.env.NOUN_BRIDGE ? JSON.parse(process.env.NOUN_BRIDGE) : [],
  });
  console.log(`noun-node listening on port ${node.port}`);
  for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => void node.close());
}
