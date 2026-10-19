/** Package compiled public games after Astro build; no network requests or npm dependencies. */
import * as fs from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { createDeflateRaw } from 'node:zlib';
import { Readable, Transform, Writable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { pathToFileURL } from 'node:url';
import { builtinModules } from 'node:module';

export const ORIGIN = 'https://pointcast.xyz';
export const DEFAULT_LIMITS = Object.freeze({ maxFiles: 2500, maxBytes: 200 * 1024 * 1024, maxFileBytes: 64 * 1024 * 1024, maxArchiveBytes: 25 * 1024 * 1024 });
const STATIC = /\.(?:html?|css|m?js|json|svg|png|jpe?g|webp|avif|gif|ico|woff2?|ttf|otf|mp3|m4a|aac|flac|opus|ogg|wav|mp4|webm|wasm|glb|gltf|bin|txt)(?:[?#]|$)/i;
const FORBIDDEN = /^(?:api|_worker\.js|_server|server|functions|auth|account|accounts|session|sessions|wallet|wallets|me|my-ai)(?:\/|$)/i;
const encoder = new TextEncoder();
const nodeModules = new Set(builtinModules.flatMap(name => [name.replace(/^node:/, ''), 'node:' + name.replace(/^node:/, '')]));
const sort = values => [...values].sort((a, b) => a < b ? -1 : a > b ? 1 : 0);
const xml = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;');
const entities = value => value.replace(/&(?:amp|quot|apos|lt|gt|#\d+|#x[\da-f]+);/gi, token => {
  const named = { '&amp;': '&', '&quot;': '"', '&apos;': "'", '&lt;': '<', '&gt;': '>' };
  if (named[token.toLowerCase()]) return named[token.toLowerCase()];
  const number = token[2].toLowerCase() === 'x' ? parseInt(token.slice(3, -1), 16) : parseInt(token.slice(2, -1), 10);
  return number <= 0x10ffff ? String.fromCodePoint(number) : token;
});

export function safeRelativePath(value) {
  if (typeof value !== 'string' || !value || value.includes('\\') || /[\u0000-\u001f]/.test(value)
      || /^[A-Za-z]:/.test(value) || value.startsWith('//')) throw new Error('Unsafe public path: ' + value);
  let decoded;
  try { decoded = decodeURIComponent(value); } catch { throw new Error('Invalid URL encoding: ' + value); }
  const relative = decoded.replace(/^\//, '').replace(/\/$/, '');
  if (!relative || relative.includes('\\') || /[\u0000-\u001f]/.test(relative)
      || relative.split('/').some(part => !part || part === '..' || part === '.' || part.startsWith('.'))
      || /^[A-Za-z]:/.test(relative)) throw new Error('Unsafe public path: ' + value);
  if (FORBIDDEN.test(relative)) throw new Error('Private/API/runtime paths cannot be packaged: ' + relative);
  return relative;
}

function relativeURL(reference, base) {
  reference = entities(reference.trim());
  if (!reference || reference.startsWith('#') || /^(?:data|blob|mailto|tel|javascript):/i.test(reference)) return { ignored: true };
  // Check before URL normalization so encoded traversal cannot silently escape the public root.
  let decoded;
  try { decoded = decodeURIComponent(reference.split(/[?#]/)[0]); } catch { throw new Error('Invalid dependency URL: ' + reference); }
  if (decoded.includes('\\') || /[\u0000-\u001f]/.test(decoded)) throw new Error('Unsafe dependency URL: ' + reference);
  if (!/^[a-z][a-z\d+.-]*:/i.test(decoded) && !decoded.startsWith('//')) {
    const segments = decoded.startsWith('/') ? [] : base.replace(/^\//, '').split('/').slice(0, -1);
    for (const segment of decoded.split('/')) {
      if (segment === '..') { if (!segments.length) throw new Error('Dependency escapes public root: ' + reference); segments.pop(); }
      else if (segment && segment !== '.') segments.push(segment);
    }
  }
  const url = new URL(reference, ORIGIN + base);
  if (!['https:', 'http:'].includes(url.protocol)) return { ignored: true };
  if (url.origin !== ORIGIN) return { external: url.href };
  const relative = safeRelativePath(url.pathname);
  return { relative };
}

function attributes(tag) {
  const result = {};
  for (const m of tag.matchAll(/([^\s=<>/]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)) result[m[1].toLowerCase()] = entities(m[2] ?? m[3] ?? m[4]);
  return result;
}
function cssReferences(text) {
  text = text.replace(/\/\*[\s\S]*?\*\//g, '');
  return [...text.matchAll(/\burl\(\s*(?:"([^"]*)"|'([^']*)'|([^)]*?))\s*\)/gi)].map(m => m[1] ?? m[2] ?? m[3])
    .concat([...text.matchAll(/@import\s+["']([^"']+)["']/gi)].map(m => m[1]));
}
function srcsetReferences(value) {
  const values = []; let position = 0;
  while (position < value.length) {
    while (position < value.length && /[\s,]/.test(value[position])) position++;
    const start = position;
    while (position < value.length && !/\s/.test(value[position])) position++;
    let url = value.slice(start, position);
    if (!url) break;
    if (url.endsWith(',')) { values.push(url.replace(/,+$/, '')); continue; }
    values.push(url);
    while (position < value.length && value[position++] !== ',') { /* descriptor */ }
  }
  return values;
}
function jsReferences(text) {
  // Keep strings/templates intact while ignoring example URLs in comments.
  text = text.replace(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|\/\*[\s\S]*?\*\/|\/\/[^\r\n]*/g, match => /^\/[/\*]/.test(match) ? ' ' : match);
  const refs = [];
  for (const m of text.matchAll(/(?:\bimport\s*(?:\([^)]*?|[^;\n]*?\bfrom\s*)|\bexport\s+[^;\n]*?\bfrom\s*|\bimport\s*)["']([^"']+)["']/g)) refs.push({ value: m[1], required: true, module: true });
  // Literal resource URLs cover bundled constructors/fetches; explicit include covers computed names.
  for (const m of text.matchAll(/["'`]((?:\/|\.\.?\/)[^"'`\n<>]+)["'`]/g)) {
    if (!m[1].includes('${') && STATIC.test(m[1])) {
      const prefix = text.slice(Math.max(0, m.index - 80), m.index);
      // Emitted contract _notes retain signerKeyFile deployment metadata. A
      // host filesystem label in that property is not a browser resource load.
      const metadataOnly = /(?:["']?signerKeyFile["']?)\s*:\s*$/.test(prefix);
      refs.push({ value: m[1], required: true, metadataOnly });
    }
  }
  return refs;
}
function nodeOnlyModule(text) { return jsReferences(text).some(ref => ref.module && nodeModules.has(ref.value)); }

export function extractReferences(text, extension = '.html') {
  const refs = [];
  if (/^\.html?$/.test(extension)) {
    const markup = text.replace(/<!--[\s\S]*?-->/g, '').replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, match => match.slice(0, match.indexOf('>') + 1));
    for (const m of markup.matchAll(/<([a-z][\w:-]*)\b[^>]*>/gi)) {
      const tag = m[1].toLowerCase(), a = attributes(m[0]);
      if (a.src && ['script', 'img', 'source', 'video', 'audio', 'track', 'iframe', 'embed', 'input'].includes(tag)) refs.push({ value: a.src, required: true });
      if (a.poster) refs.push({ value: a.poster, required: true });
      if (a.data && tag === 'object') refs.push({ value: a.data, required: true });
      if ((a.href || a['xlink:href']) && (tag === 'use' || tag === 'image' || (tag === 'link' && /\b(?:stylesheet|preload|modulepreload|icon)\b/i.test(a.rel ?? '')))) refs.push({ value: a.href || a['xlink:href'], required: true });
      if (a.srcset) for (const value of srcsetReferences(a.srcset)) refs.push({ value, required: true });
      if (a.style) for (const value of cssReferences(a.style)) refs.push({ value, required: true });
    }
    for (const m of text.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style\s*>/gi)) for (const value of cssReferences(m[1])) refs.push({ value, required: true });
    for (const m of text.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script\s*>/gi)) refs.push(...jsReferences(m[1]));
  } else if (extension === '.css') for (const value of cssReferences(text)) refs.push({ value, required: true });
  else if (/^\.m?js$/.test(extension)) refs.push(...jsReferences(text));
  return refs;
}

export function rewriteNavigation(html, entry) {
  // Inline scripts contain JS template anchors; changing those would break runtime interpolation.
  return html.replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>|<style\b[^>]*>[\s\S]*?<\/style\s*>|<!--[\s\S]*?-->|<a\b[^>]*>/gi, tag => !/^<a\b/i.test(tag) ? tag : tag.replace(/\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i, (match, one, two, three) => {
    const href = entities(one ?? two ?? three);
    if (!href || href.startsWith('#') || /^(?:mailto|tel|javascript|data):/i.test(href)) return match;
    return 'href="' + xml(new URL(href, ORIGIN + entry).href) + '"';
  }));
}

export async function collectLocalFiles({ dist, entry, include = [], limits = DEFAULT_LIMITS }) {
  dist = await fs.realpath(path.resolve(dist));
  if (typeof entry !== 'string' || !entry.startsWith('/') || entry.startsWith('//') || entry.includes('?') || entry.includes('#')) throw new Error('Local game entry must be a canonical root-relative route.');
  const files = new Map(), queue = [], external = new Set(), online = new Set(), excludedBuildFiles = new Set(), excludedMetadataReferences = new Set(); let bytes = 0;
  async function physical(relative, required = true) {
    relative = safeRelativePath(relative);
    const absolute = path.join(dist, relative);
    let real;
    try { real = await fs.realpath(absolute); } catch (error) { if (!required && error.code === 'ENOENT') return null; throw new Error('Missing compiled dependency ' + relative + ': ' + error.message); }
    if (!real.startsWith(dist + path.sep)) throw new Error('Symlink escapes compiled output: ' + relative);
    safeRelativePath(path.relative(dist, real).split(path.sep).join('/'));
    return { real, stat: await fs.stat(real) };
  }
  async function add(relative) {
    relative = safeRelativePath(relative);
    if (files.has(relative)) return relative;
    let p = await physical(relative, false);
    if (p?.stat.isDirectory()) { relative += '/index.html'; p = await physical(relative); }
    if (!p && !path.posix.extname(relative)) {
      for (const candidate of [relative + '/index.html', relative + '.html']) { p = await physical(candidate, false); if (p) { relative = candidate; break; } }
    }
    if (!p) throw new Error('Missing compiled dependency: ' + relative);
    if (!p.stat.isFile()) throw new Error('Compiled dependency is not a file: ' + relative);
    if (files.has(relative)) return relative;
    if (p.stat.size > limits.maxFileBytes || files.size + 1 > limits.maxFiles || bytes + p.stat.size > limits.maxBytes) throw new Error('Game download exceeds its file/byte budget at ' + relative);
    bytes += p.stat.size; files.set(relative, { path: relative, source: p.real, bytes: p.stat.size, mode: 0o644 }); queue.push(relative);
    return relative;
  }
  const route = safeRelativePath(entry);
  const entryFile = await add(route);
  if (!/\.html?$/i.test(entryFile)) throw new Error('Local game entry must resolve to compiled HTML.');
  async function includeTree(value) {
    value = safeRelativePath(value.replace(/^public\//, ''));
    const p = await physical(value);
    if (p.stat.isDirectory()) {
      for (const name of sort(await fs.readdir(p.real))) await includeTree(value + '/' + name);
    } else {
      // Some public game folders retain Node asset generators. They are not linked
      // browser runtimes and their development-only package paths are not deploy assets.
      if (/\.m?js$/i.test(value) && nodeOnlyModule(await fs.readFile(p.real, 'utf8'))) { excludedBuildFiles.add(value); return; }
      await add(value);
    }
  }
  for (const value of include) await includeTree(value);
  for (let i = 0; i < queue.length; i++) {
    const relative = queue[i], record = files.get(relative), extension = path.posix.extname(relative).toLowerCase();
    if (!/\.(?:html?|css|m?js)$/.test(extension)) continue;
    const text = await fs.readFile(record.source, 'utf8');
    if (/^\.m?js$/.test(extension) && nodeOnlyModule(text)) throw new Error('A playable page references a Node-only module: ' + relative);
    let base = '/' + relative;
    if (/^\.html?$/.test(extension)) {
      const baseTag = text.match(/<base\b[^>]*>/i);
      const baseHref = baseTag && attributes(baseTag[0]).href;
      if (baseHref) { const resolved = new URL(baseHref, ORIGIN + base); if (resolved.origin !== ORIGIN) throw new Error('A local game has an external HTML base URL: ' + relative); base = resolved.pathname; }
      record.data = Buffer.from(rewriteNavigation(text, base)); record.bytes = record.data.length;
    }
    for (const ref of extractReferences(text, extension)) {
      if (ref.metadataOnly) { excludedMetadataReferences.add(relative + ': ' + ref.value); continue; }
      if (ref.module && !/^(?:\.?\.?\/|https?:\/\/|\/\/)/.test(ref.value)) { online.add('Unresolved browser module: ' + ref.value); continue; }
      let resolved;
      try { resolved = relativeURL(ref.value, base); }
      catch (error) {
        if (/Private\/API\/runtime/.test(error.message)) { online.add(ref.value); continue; }
        throw error;
      }
      if (resolved.external) external.add(resolved.external);
      else if (resolved.relative) await add(resolved.relative);
    }
    for (const m of text.matchAll(/(?:https?:\/\/[^\s"'<>`]+|\/api\/[A-Za-z0-9_/-]+)/g)) {
      if (m[0].startsWith('/api/')) online.add(m[0]);
    }
  }
  return { entryFile, files: sort(files.keys()).map(key => files.get(key)), bytes, externalReferences: sort(external), onlineFeatures: sort(online), excludedBuildFiles: sort(excludedBuildFiles), excludedMetadataReferences: sort(excludedMetadataReferences) };
}

const crcTable = Uint32Array.from({ length: 256 }, (_, n) => { let c = n; for (let i = 0; i < 8; i++) c = c & 1 ? 0xedb88320 ^ c >>> 1 : c >>> 1; return c >>> 0; });
function updateCRC(crc, bytes) { for (const byte of bytes) crc = crcTable[(crc ^ byte) & 255] ^ crc >>> 8; return crc >>> 0; }

export async function writeZip(entries, target, limits = DEFAULT_LIMITS) {
  if (entries.length > limits.maxFiles) throw new Error('ZIP file-count budget exceeded.');
  const temporary = target + '.partial'; await fs.mkdir(path.dirname(target), { recursive: true });
  const handle = await fs.open(temporary, 'w'); let offset = 0, total = 0; const central = [], seen = new Set();
  async function write(bytes) { let cursor = 0; while (cursor < bytes.length) { const result = await handle.write(bytes, cursor, bytes.length - cursor, offset); if (!result.bytesWritten) throw new Error('ZIP write made no progress.'); cursor += result.bytesWritten; offset += result.bytesWritten; } }
  try {
    for (const entry of [...entries].sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0)) {
      const normalized = safeRelativePath(entry.path), name = Buffer.from(normalized);
      if (seen.has(normalized)) throw new Error('Duplicate ZIP path: ' + normalized); seen.add(normalized);
      if (name.length > 65535) throw new Error('ZIP filename is too long.');
      const start = offset, header = Buffer.alloc(30); header.writeUInt32LE(0x04034b50); header.writeUInt16LE(20, 4); header.writeUInt16LE(0x808, 6); header.writeUInt16LE(8, 8); header.writeUInt16LE(33, 12); header.writeUInt16LE(name.length, 26);
      await write(header); await write(name);
      let crc = 0xffffffff, size = 0; const dataStart = offset;
      const input = entry.data !== undefined ? Readable.from([Buffer.isBuffer(entry.data) ? entry.data : Buffer.from(entry.data)]) : createReadStream(entry.source);
      const meter = new Transform({ transform(chunk, _encoding, callback) {
        size += chunk.length; total += chunk.length;
        if (size > limits.maxFileBytes || total > limits.maxBytes) { callback(new Error('ZIP byte budget exceeded at ' + entry.path)); return; }
        crc = updateCRC(crc, chunk); callback(null, chunk);
      } });
      await pipeline(input, meter, createDeflateRaw({ level: 6 }), new Writable({ write(chunk, _encoding, callback) { write(chunk).then(() => callback(), callback); } }));
      if (entry.data === undefined && entry.bytes !== undefined && size !== entry.bytes) throw new Error('Compiled file changed while packaging: ' + entry.path);
      crc = (crc ^ 0xffffffff) >>> 0; const compressed = offset - dataStart;
      if (offset > 0xffffffff) throw new Error('ZIP32 size exceeded.');
      const descriptor = Buffer.alloc(16); descriptor.writeUInt32LE(0x08074b50); descriptor.writeUInt32LE(crc, 4); descriptor.writeUInt32LE(compressed, 8); descriptor.writeUInt32LE(size, 12); await write(descriptor);
      const row = Buffer.alloc(46); row.writeUInt32LE(0x02014b50); row.writeUInt16LE(0x314, 4); row.writeUInt16LE(20, 6); row.writeUInt16LE(0x808, 8); row.writeUInt16LE(8, 10); row.writeUInt16LE(33, 14); row.writeUInt32LE(crc, 16); row.writeUInt32LE(compressed, 20); row.writeUInt32LE(size, 24); row.writeUInt16LE(name.length, 28); row.writeUInt32LE(((0o100000 | (entry.mode ?? 0o644)) << 16) >>> 0, 38); row.writeUInt32LE(start, 42);
      central.push(Buffer.concat([row, name]));
    }
    const centralOffset = offset; for (const row of central) await write(row);
    const end = Buffer.alloc(22); end.writeUInt32LE(0x06054b50); end.writeUInt16LE(entries.length, 8); end.writeUInt16LE(entries.length, 10); end.writeUInt32LE(offset - centralOffset, 12); end.writeUInt32LE(centralOffset, 16); await write(end);
    if (offset > (limits.maxArchiveBytes ?? DEFAULT_LIMITS.maxArchiveBytes)) throw new Error('Game ZIP exceeds the 25 MiB single-asset deployment limit: ' + target);
    await handle.close(); await fs.rename(temporary, target);
  } catch (error) { await handle.close().catch(() => {}); await fs.rm(temporary, { force: true }); throw error; }
  return { files: entries.length, uncompressedBytes: total, bytes: (await fs.stat(target)).size, sha256: await hashFile(target) };
}
async function hashFile(file) { const hash = createHash('sha256'); for await (const chunk of createReadStream(file)) hash.update(chunk); return hash.digest('hex'); }

function localLauncher(slug, entry) {
  const port = 41000 + parseInt(createHash('sha256').update(slug).digest('hex').slice(0, 4), 16) % 10000;
  return `#!/usr/bin/env python3\n"""Serve local game files only. No remote API proxy or authentication."""\nfrom http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler\nfrom pathlib import Path\nimport os, webbrowser\nos.chdir(Path(__file__).resolve().parent / 'site')\nENTRY = ${JSON.stringify(entry)}\nclass Handler(SimpleHTTPRequestHandler):\n    def do_GET(self):\n        if self.path == '/' and ENTRY != '/':\n            self.send_response(302)\n            self.send_header('Location', ENTRY)\n            self.end_headers()\n            return\n        if self.path.split('?')[0].startswith('/api/'):\n            self.send_error(404, 'Online services are available on pointcast.xyz only')\n            return\n        super().do_GET()\n    def list_directory(self, path):\n        self.send_error(404)\n    def log_message(self, *_):\n        pass\ntry:\n    server = ThreadingHTTPServer(('127.0.0.1', ${port}), Handler)\nexcept OSError:\n    print('This local port is occupied. Stop the earlier game Terminal server with Control-C, then retry.')\n    raise SystemExit(1)\nurl = 'http://127.0.0.1:${port}' + ENTRY\nprint('Open ' + url + '; keep this Terminal open. Control-C stops the local server.')\nwebbrowser.open(url)\ntry:\n    server.serve_forever()\nexcept KeyboardInterrupt:\n    server.server_close()\n`;
}
function localReadme(game, closure) {
  const pages = closure.files.filter(file => /\.html?$/i.test(file.path)).map(file => '/' + file.path.replace(/index\.html$/, '')).join(', ');
  return `# ${game.name} — local game files\n\nPlay this game from local files with a small localhost launcher. Online features may need the live PointCast page.\n\n## Play\n\nUnzip the whole folder. With Python 3 installed, double-click Start-Game.command on Mac, or run python3 serve.py in this folder. The launcher serves only these files at 127.0.0.1 and opens ${game.download.entry}. Keep the Terminal open; Control-C stops it. Root paths are preserved under site/. Opening the HTML directly can break root-relative assets and browser modules.\n\n## Online features\n\n${game.download.note || 'Local practice may be available; online features need the live page.'}\n\nAPI calls, shared rooms, account/session features, wallets, payments, external media and external dependencies may require the live page and Internet. The launcher never proxies APIs or credentials and never signs or sends transactions. Navigation links open PointCast online. Other included local pages (open these paths on the same localhost server): ${pages}. Use the live version: ${new URL(game.route || game.download.entry, ORIGIN).href}\n\nExternal resource URLs found: ${closure.externalReferences.length}. Online/runtime references found: ${closure.onlineFeatures.length}. See PACK-MANIFEST.json. A dependency scanner cannot resolve every runtime-generated URL; catalog asset includes cover known game assets.\n\nBrowser-local saves belong to this browser and localhost address; they do not import your live PointCast account or save. Keep any existing game backup before changing origins.\n`;
}
function onlineEntries(game) {
  const url = new URL(game.download.entry, ORIGIN);
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) throw new Error('Online game entry must be an HTTP(S) URL without credentials.');
  const prefix = game.slug + '/';
  return [
    { path: prefix + 'Open-Game.webloc', data: `<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n<plist version="1.0"><dict><key>URL</key><string>${xml(url.href)}</string></dict></plist>\n` },
    { path: prefix + 'Open-Game.url', data: `[InternetShortcut]\r\nURL=${url.href}\r\n` },
    { path: prefix + 'Launch.html', data: `<!doctype html><html lang="en"><meta charset="utf-8"><title>${xml(game.name)} — online launch</title><meta http-equiv="refresh" content="0;url=${xml(url.href)}"><h1>${xml(game.name)}</h1><p>This is an online launch kit. Internet is required; no local game is bundled.</p><a href="${xml(url.href)}">Open the live game</a></html>\n` },
    { path: prefix + 'README.md', data: `# ${game.name} — online launch kit\n\nInternet required. This download contains shortcuts to ${url.href}; it does not contain an offline or local copy of the game. Open Launch.html, Open-Game.webloc (Mac), or Open-Game.url (Windows).\n\n${game.download.note || ''}\n\nSessions, APIs, accounts, rooms or wallet actions remain on the live website under its normal controls.\n` },
  ];
}

export async function prepareGameDownloads({ root = process.cwd(), dist = path.join(root, 'dist'), catalog = path.join(root, 'src/data/game-catalog.json'), limits = DEFAULT_LIMITS } = {}) {
  dist = await fs.realpath(path.resolve(dist));
  const parsed = typeof catalog === 'string' ? JSON.parse(await fs.readFile(catalog, 'utf8')) : catalog;
  const games = Array.isArray(parsed) ? parsed : parsed.games;
  if (!Array.isArray(games) || !games.length) throw new Error('The game catalog must contain games.');
  const output = path.join(dist, 'downloads/games'); await fs.mkdir(output, { recursive: true });
  const manifest = { version: 1, origin: ORIGIN, scope: 'Local compiled game files, prepared releases, and explicit online launch kits. No generic offline claim.', games: [] }, slugs = new Set();
  for (const game of [...games].sort((a, b) => String(a.slug).localeCompare(String(b.slug), 'en'))) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(game.slug) || slugs.has(game.slug) || typeof game.name !== 'string' || game.name.length > 160 || !game.name.trim()) throw new Error('Invalid or duplicate game catalog entry.');
    slugs.add(game.slug);
    if (!game.download || !['local', 'online', 'prepared'].includes(game.download.kind) || typeof game.download.entry !== 'string' || (game.download.include !== undefined && !Array.isArray(game.download.include))) throw new Error('Invalid download declaration for ' + game.slug);
    const target = path.join(output, game.slug + '.zip'); let result, closure;
    if (game.download.kind === 'prepared') {
      const relative = safeRelativePath(game.download.entry.replace(/^public\//, ''));
      const source = await fs.realpath(path.join(dist, relative));
      if (!source.startsWith(dist + path.sep) || !relative.endsWith('.zip')) throw new Error('Prepared release must be a ZIP inside compiled public output.');
      const stat = await fs.stat(source);
      if (!stat.isFile() || stat.size > limits.maxBytes || stat.size > (limits.maxArchiveBytes ?? DEFAULT_LIMITS.maxArchiveBytes)) throw new Error('Prepared release exceeds byte budget or single-asset deployment limit.');
      const handle = await fs.open(source, 'r'); const signature = Buffer.alloc(4); try { await handle.read(signature, 0, 4, 0); } finally { await handle.close(); }
      if (signature.readUInt32LE() !== 0x04034b50) throw new Error('Prepared release is not a ZIP.');
      if (source !== target) await fs.copyFile(source, target);
      result = { bytes: stat.size, sha256: await hashFile(target), files: null, prepared: true };
    } else if (game.download.kind === 'online') result = await writeZip(onlineEntries(game), target, limits);
    else {
      closure = await collectLocalFiles({ dist, entry: game.download.entry, include: game.download.include ?? [], limits });
      const prefix = game.slug + '/';
      const entries = closure.files.map(file => ({ ...file, path: prefix + 'site/' + file.path }));
      entries.push(
        { path: prefix + 'serve.py', data: localLauncher(game.slug, game.download.entry) },
        { path: prefix + 'Start-Game.command', mode: 0o755, data: '#!/bin/zsh\ncd -- "${0:A:h}"\nexec python3 serve.py\n' },
        { path: prefix + 'README.md', data: localReadme(game, closure) },
        { path: prefix + 'PACK-MANIFEST.json', data: JSON.stringify({ slug: game.slug, entry: game.download.entry, files: closure.files.map(file => ({ path: file.path, bytes: file.bytes })), externalReferences: closure.externalReferences, onlineFeatures: closure.onlineFeatures, excludedBuildFiles: closure.excludedBuildFiles.map(file => ({ path: file, reason: 'Node-only development/agent tool; not a browser runtime.' })), excludedMetadataReferences: closure.excludedMetadataReferences.map(reference => ({ reference, reason: 'signerKeyFile deployment metadata, not a browser resource load.' })), note: game.download.note ?? '', scope: 'Local files; online features may need the live page.' }, null, 2) + '\n' },
      );
      result = await writeZip(entries, target, limits);
    }
    manifest.games.push({ slug: game.slug, name: game.name, kind: game.download.kind, entry: game.download.entry, url: '/downloads/games/' + game.slug + '.zip', ...result, note: game.download.note ?? '', externalReferences: closure?.externalReferences ?? [], onlineFeatures: closure?.onlineFeatures ?? [], excludedBuildFiles: closure?.excludedBuildFiles ?? [], excludedMetadataReferences: closure?.excludedMetadataReferences ?? [] });
  }
  const manifestPath = path.join(output, 'manifest.json'); await fs.writeFile(manifestPath + '.partial', JSON.stringify(manifest, null, 2) + '\n'); await fs.rename(manifestPath + '.partial', manifestPath);
  return manifest;
}

async function main() {
  const args = process.argv.slice(2), options = {};
  for (let i = 0; i < args.length; i += 2) {
    if (!['--root', '--dist', '--catalog'].includes(args[i]) || !args[i + 1]) throw new Error('Usage: node scripts/prepare-game-downloads.mjs [--root PATH] [--dist PATH] [--catalog PATH]');
    options[args[i].slice(2)] = args[i + 1];
  }
  const manifest = await prepareGameDownloads(options);
  console.log(`Prepared ${manifest.games.length} game downloads (${manifest.games.reduce((sum, game) => sum + game.bytes, 0)} ZIP bytes).`);
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) await main();
