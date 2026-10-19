#!/usr/bin/env node
/** Offline intake only: the release coordinator reviews and collects HTTP proof. */
import { constants } from 'node:fs';
import { open, realpath, lstat, rename, unlink } from 'node:fs/promises';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { isIP } from 'node:net';
import { fileURLToPath } from 'node:url';
import { parse } from 'parse5';

const CANONICAL = 'https://pointcast.xyz';
const SHA = /^[a-f0-9]{40}$/;
const DIGEST = /^[a-f0-9]{64}$/;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const JSON_LIMIT = 4 * 1024 * 1024;
const BODY_LIMIT = 16 * 1024 * 1024;
const COUNT_LIMIT = 5000;
const RESPONSE_LIMIT = 20000;
const PRIVATE_PATH = /^\/(?:api|auth|account|me|profile|desk|private|internal|admin)(?:\/|$)/i;
const PRIVATE_SEGMENT = /(?:^|\/)(?:\.git|\.aws|\.codex|\.agents|\.env(?:\.[^/]*)?|credentials?|secrets?)(?:\/|$)/i;

function requireCondition(condition, message) {
  if (!condition) throw new Error(message);
}

function object(value, label) {
  requireCondition(value !== null && typeof value === 'object' && !Array.isArray(value), label + ' must be an object.');
}

function keys(value, permitted, label) {
  object(value, label);
  const unknown = Object.keys(value).find(key => !permitted.includes(key));
  requireCondition(!unknown, label + ' has an unknown field: ' + unknown + '.');
}

function text(value, label, limit = 1000) {
  requireCondition(typeof value === 'string' && value.trim().length > 0 && value.length <= limit
    && !/[\u0000-\u001f\u007f]/.test(value), label + ' must be nonempty public text.');
  requireCondition(!/(?:^|[\s"'`(=\[])\/(?:Users|home|tmp|private|var\/folders)\/|(?:^|[\s"'`(=\[])[A-Za-z]:[\\/]|(?:file|sediment|library):\/\/|(?:^|[\s"'`(=\[])~\/|https?:\/\/(?:www\.)?chatgpt\.com\/(?:library|c)\//i.test(value), label + ' must not expose private filesystem paths or Library tracking.');
  return value;
}

function slug(value, label, limit = 96) {
  requireCondition(typeof value === 'string' && value.length <= limit && SLUG.test(value), label + ' must be a public lowercase slug.');
  return value;
}

function utc(value, label) {
  requireCondition(typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|\+00:00)$/.test(value), label + ' must be an ISO UTC timestamp.');
  const date = new Date(value);
  requireCondition(Number.isFinite(date.getTime()) && date.toISOString().slice(0, 19) === value.slice(0, 19), label + ' is not a valid calendar timestamp.');
  return date.toISOString();
}

// Compare the original UTC precision before normalizing public dates to milliseconds.
function timeKey(value) {
  return value.slice(0, 19) + '.' + (value.slice(19).match(/^\.(\d+)/)?.[1] ?? '').padEnd(9, '0');
}

function internalHref(value, label) {
  requireCondition(typeof value === 'string' && value.length <= 1024 && value.startsWith('/')
    && !value.startsWith('//') && !/[\s\\?\u0000-\u001f\u007f]/u.test(value), label + ' must be a safe internal path without a query.');
  const parts = value.split('#');
  requireCondition(parts.length <= 2 && (parts.length === 1 || parts[1].length > 0), label + ' has an invalid fragment.');
  const rawPath = parts[0];
  requireCondition(!rawPath.includes('//') && !/%(?:2f|5c)/i.test(rawPath), label + ' has an encoded separator or an empty path segment.');
  let decodedPath;
  let anchor = null;
  try {
    decodedPath = decodeURIComponent(rawPath);
    if (parts.length === 2) anchor = decodeURIComponent(parts[1]);
  } catch {
    throw new Error(label + ' has malformed encoding.');
  }
  requireCondition(!/[\s\\%?#\u0000-\u001f\u007f]/u.test(decodedPath)
    && !decodedPath.split('/').some(segment => segment === '.' || segment === '..'), label + ' contains traversal or ambiguous encoding.');
  requireCondition(!PRIVATE_PATH.test(decodedPath) && !PRIVATE_SEGMENT.test(decodedPath), label + ' must not expose a private path.');
  if (anchor !== null) requireCondition(!/[\\/%\u0000-\u001f\u007f]/u.test(anchor), label + ' has an unsafe anchor.');
  const url = new URL(value, CANONICAL);
  requireCondition(url.origin === CANONICAL && url.pathname === rawPath, label + ' must not be normalized to a different path.');
  return { href: value, pathname: rawPath, anchor, key: decodedPath + (anchor === null ? '' : '#' + anchor) };
}

function publicSource(value, label) {
  text(value, label, 2048);
  requireCondition(!/[\s\\\u0000-\u001f\u007f]/u.test(value), label + ' is not a public URL.');
  let url;
  try { url = new URL(value); } catch { throw new Error(label + ' is not a public URL.'); }
  requireCondition(url.protocol === 'https:' && !url.username && !url.password && !url.port
    && !isIP(url.hostname) && url.hostname.includes('.') && !url.hostname.endsWith('.')
    && !/(?:^|\.)(?:localhost|local|internal|test|invalid)$/i.test(url.hostname), label + ' must be a public HTTPS URL without credentials.');
  let decoded;
  try { decoded = decodeURIComponent(url.pathname); } catch { throw new Error(label + ' has malformed encoding.'); }
  requireCondition(!(url.origin === CANONICAL && (PRIVATE_PATH.test(decoded) || PRIVATE_SEGMENT.test(decoded)))
    && !(url.hostname === 'chatgpt.com' && /\/(?:library|c)\//i.test(decoded)) && !decoded.includes('%'), label + ' must not expose private source tracking.');
  try { decodeURIComponent(url.search); decodeURIComponent(url.hash); } catch { throw new Error(label + ' has malformed encoding.'); }
  for (const key of [...url.searchParams.keys(), ...new URLSearchParams(url.hash.slice(1)).keys()]) {
    requireCondition(!/^(?:.*token.*|.*secret.*|.*password.*|.*credential.*|.*signature.*|.*auth.*|.*session.*|api[-_]?key|key|code|utm_.+|gclid|fbclid)$/i.test(key), label + ' must not contain credential or tracking parameters.');
  }
  return url.href;
}

/** JSON.parse alone silently accepts duplicate keys, including escaped aliases. */
export function parseStrictJson(bytes, label = 'JSON') {
  requireCondition(Buffer.isBuffer(bytes) && bytes.length > 0 && bytes.length <= JSON_LIMIT, label + ' is empty or oversized.');
  let source;
  try { source = new TextDecoder('utf-8', { fatal: true }).decode(bytes); } catch { throw new Error(label + ' is not UTF-8.'); }
  let parsed;
  try { parsed = JSON.parse(source); } catch { throw new Error(label + ' is not valid JSON.'); }
  let cursor = 0;
  const space = () => { while (/\s/.test(source[cursor] ?? '') && cursor < source.length) cursor++; };
  function string() {
    const start = cursor++;
    while (cursor < source.length) {
      if (source[cursor] === '\\') cursor += 2;
      else if (source[cursor++] === '"') return JSON.parse(source.slice(start, cursor));
    }
    throw new Error(label + ' has an unterminated string.');
  }
  function value(depth) {
    requireCondition(depth <= 64, label + ' is nested too deeply.');
    space();
    const char = source[cursor];
    if (char === '"') { string(); return; }
    if (char === '{') {
      cursor++; space();
      const seen = new Set();
      if (source[cursor] === '}') { cursor++; return; }
      while (true) {
        const key = string();
        requireCondition(!seen.has(key), label + ' has a duplicate object key: ' + key + '.');
        seen.add(key); space(); cursor++; value(depth + 1); space();
        if (source[cursor++] === '}') return;
        space();
      }
    }
    if (char === '[') {
      cursor++; space();
      if (source[cursor] === ']') { cursor++; return; }
      while (true) { value(depth + 1); space(); if (source[cursor++] === ']') return; }
    }
    const token = source.slice(cursor).match(/^(?:true|false|null|-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?)/)?.[0];
    requireCondition(Boolean(token), label + ' has an invalid value.');
    cursor += token.length;
  }
  value(0);
  return parsed;
}

async function jsonFile(filename, label) {
  const before = await lstat(filename);
  requireCondition(before.isFile() && before.size > 0 && before.size <= JSON_LIMIT, label + ' must be a bounded regular file without symlinks.');
  const handle = await open(filename, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
  try {
    const stat = await handle.stat();
    requireCondition(stat.isFile() && stat.size > 0 && stat.size <= JSON_LIMIT, label + ' must be a bounded regular file.');
    const bytes = await handle.readFile();
    return { bytes, data: parseStrictJson(bytes, label) };
  } finally { await handle.close(); }
}

function receiptData(receipt) {
  keys(receipt, ['releaseId', 'commit', 'canonicalOrigin', 'immutableOrigin', 'completedAt', 'proofSha256'], 'Receipt');
  slug(receipt.releaseId, 'Receipt releaseId', 128);
  requireCondition(SHA.test(receipt.commit), 'Receipt commit must be a full lowercase 40-character SHA.');
  requireCondition(receipt.canonicalOrigin === CANONICAL, 'Receipt must name the canonical origin.');
  requireCondition(typeof receipt.immutableOrigin === 'string'
    && /^https:\/\/[a-f0-9]{8}\.pointcast\.pages\.dev$/.test(receipt.immutableOrigin), 'Receipt immutableOrigin must be an eight-hex deployment-specific PointCast Pages origin.');
  requireCondition(DIGEST.test(receipt.proofSha256), 'Receipt proofSha256 must be an exact SHA-256.');
  return { ...receipt, completedAt: utc(receipt.completedAt, 'Receipt completedAt'), completedKey: timeKey(receipt.completedAt) };
}

async function proofBody(proofDir, relative, response) {
  requireCondition(typeof relative === 'string' && relative.length <= 512 && relative.length > 0 && !path.isAbsolute(relative)
    && !/[\\%\u0000-\u001f\u007f]/.test(relative)
    && relative.split('/').every(segment => /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(segment) && segment !== '.' && segment !== '..'), 'Proof bodyPath must stay inside the proof directory.');
  const realRoot = await realpath(proofDir);
  const filename = path.resolve(realRoot, relative);
  let prefix = realRoot;
  for (const segment of relative.split('/')) {
    prefix = path.join(prefix, segment);
    requireCondition(!(await lstat(prefix)).isSymbolicLink(), 'Proof bodies must not use symlinks.');
  }
  const before = await lstat(filename);
  requireCondition(before.isFile() && before.size > 0 && before.size <= BODY_LIMIT, 'Proof body must be a nonempty bounded regular file.');
  const actual = await realpath(filename);
  const contained = path.relative(realRoot, actual);
  requireCondition(contained && !contained.startsWith('..' + path.sep) && contained !== '..' && !path.isAbsolute(contained), 'Proof body escaped the proof directory.');
  const handle = await open(filename, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
  try {
    const stat = await handle.stat();
    requireCondition(stat.isFile() && stat.size > 0 && stat.size <= BODY_LIMIT, 'Proof body must be a nonempty bounded regular file.');
    const bytes = await handle.readFile();
    requireCondition(bytes.length === response.bytes && bytes.length > 0 && bytes.length <= BODY_LIMIT, 'Proof body byte count does not match.');
    requireCondition(createHash('sha256').update(bytes).digest('hex') === response.sha256, 'Proof body hash does not match.');
    return bytes;
  } finally { await handle.close(); }
}

function hasAnchor(bytes, anchor) {
  let html;
  try { html = new TextDecoder('utf-8', { fatal: true }).decode(bytes); } catch { throw new Error('Anchor proof body must be UTF-8 HTML.'); }
  const document = parse(html);
  function visit(node) {
    if (node.attrs?.some(attr => attr.name === 'id' && attr.value === anchor
      || node.tagName === 'a' && attr.name === 'name' && attr.value === anchor)) return true;
    // Template contents are separate inert documents; do not traverse node.content.
    return (node.childNodes ?? []).some(visit);
  }
  return visit(document);
}

function candidateData(candidate, checkedKey) {
  keys(candidate, ['id', 'title', 'href', 'group', 'dek', 'image', 'publishedAt', 'addedAt', 'sources', 'imageRights', 'publication'], 'Candidate');
  const id = slug(candidate.id, 'Candidate id');
  const target = internalHref(candidate.href, 'Candidate href');
  if (candidate.publication !== undefined) {
    keys(candidate.publication, ['state'], 'Candidate publication');
    requireCondition(candidate.publication.state === 'pending', 'Candidate publication must be pending; live state comes only from proof.');
  }
  const publishedAt = candidate.publishedAt === null ? null : utc(candidate.publishedAt, 'Candidate publishedAt');
  requireCondition(publishedAt === null || timeKey(candidate.publishedAt) <= checkedKey, 'Candidate publication date is later than its proof.');
  const addedAt = candidate.addedAt === undefined ? undefined : utc(candidate.addedAt, 'Candidate addedAt');
  requireCondition(addedAt === undefined || timeKey(candidate.addedAt) <= checkedKey, 'Candidate intake date is later than its proof.');
  requireCondition(Array.isArray(candidate.sources) && candidate.sources.length > 0 && candidate.sources.length <= 50, 'Candidate needs public sources.');
  const sources = candidate.sources.map(source => {
    keys(source, ['url', 'title', 'checkedAt'], 'Candidate source');
    const date = utc(source.checkedAt, 'Source checkedAt');
    requireCondition(timeKey(source.checkedAt) <= checkedKey, 'Source date is later than its proof.');
    return { url: publicSource(source.url, 'Source URL'), title: text(source.title, 'Source title', 300), checkedAt: date };
  });
  const image = candidate.image ?? null;
  keys(candidate.imageRights, ['status', 'source', 'license', 'checkedAt'], 'Candidate imageRights');
  let imageRights;
  if (image === null) {
    requireCondition(candidate.imageRights.status === 'not-used' && candidate.imageRights.source === null
      && candidate.imageRights.license === null && candidate.imageRights.checkedAt === null, 'Unused images must have not-used rights with null evidence.');
    imageRights = { status: 'not-used', source: null, license: null, checkedAt: null };
  } else {
    const asset = internalHref(image, 'Candidate image');
    requireCondition(asset.anchor === null && /\.(?:png|jpe?g|webp|avif|gif|svg)$/i.test(asset.pathname), 'Candidate image must be an internal image asset.');
    requireCondition(['original', 'existing-published-asset', 'licensed', 'public-domain', 'permission-granted'].includes(candidate.imageRights.status), 'Candidate image rights are unknown or unverified.');
    const date = utc(candidate.imageRights.checkedAt, 'Image rights checkedAt');
    requireCondition(timeKey(candidate.imageRights.checkedAt) <= checkedKey, 'Image rights date is later than its proof.');
    const license = candidate.imageRights.status === 'existing-published-asset' && candidate.imageRights.license === null
      ? null : text(candidate.imageRights.license, 'Image license', 300);
    imageRights = { status: candidate.imageRights.status, source: publicSource(candidate.imageRights.source, 'Image rights source'),
      license, checkedAt: date };
  }
  return { record: { id, title: text(candidate.title, 'Candidate title', 300), href: target.href,
    group: text(candidate.group, 'Candidate group', 200), dek: text(candidate.dek, 'Candidate qualified description', 2000),
    image, publishedAt, ...(addedAt === undefined ? {} : { addedAt }), sources, imageRights }, target };
}

function indexCatalog(catalog) {
  requireCondition(Array.isArray(catalog) && catalog.length <= COUNT_LIMIT, 'Catalog must be a bounded array.');
  const ids = new Map();
  const hrefs = new Map();
  catalog.forEach((record, index) => {
    object(record, 'Existing catalog record');
    const href = internalHref(record.href, 'Existing href');
    requireCondition(!hrefs.has(href.key), 'Existing catalog has a duplicate href.');
    hrefs.set(href.key, index);
    if (record.id !== undefined) {
      slug(record.id, 'Existing id');
      requireCondition(!ids.has(record.id), 'Existing catalog has a duplicate id.');
      ids.set(record.id, index);
    }
  });
  return { ids, hrefs };
}

/** Validate an intake completely; inputs are never mutated. No I/O except saved proof bodies. */
export async function buildHomePublishedCatalog({ catalog, candidates, receipt, proofBytes, proofDir, allowUpdates = false }) {
  const release = receiptData(receipt);
  requireCondition(Buffer.isBuffer(proofBytes) && createHash('sha256').update(proofBytes).digest('hex') === release.proofSha256, 'Proof JSON hash does not match the reviewed receipt.');
  const proof = parseStrictJson(proofBytes, 'HTTP proof');
  keys(proof, ['commit', 'checkedAt', 'responses'], 'HTTP proof');
  requireCondition(proof.commit === release.commit, 'Proof commit does not match the release receipt.');
  const checkedAt = utc(proof.checkedAt, 'Proof checkedAt');
  const checkedKey = timeKey(proof.checkedAt);
  requireCondition(checkedKey > release.completedKey, 'HTTP proof must be checked after deployment completed.');
  requireCondition(Array.isArray(proof.responses) && proof.responses.length > 0 && proof.responses.length <= RESPONSE_LIMIT, 'HTTP proof needs bounded responses.');
  const responses = new Map();
  for (const response of proof.responses) {
    keys(response, ['url', 'status', 'bodyPath', 'sha256', 'bytes', 'method'], 'Proof response');
    requireCondition(response.method === undefined || response.method === 'GET', 'Proof responses must represent actual GET requests.');
    requireCondition(response.status === 200, 'Every proof response must have HTTP status 200.');
    requireCondition(Number.isSafeInteger(response.bytes) && response.bytes > 0 && response.bytes <= BODY_LIMIT && DIGEST.test(response.sha256), 'Proof response requires exact bytes and SHA-256.');
    let url;
    try { url = new URL(response.url); } catch { throw new Error('Proof response URL is invalid.'); }
    requireCondition(typeof response.url === 'string' && [CANONICAL, release.immutableOrigin].includes(url.origin)
      && response.url === url.href && !url.username && !url.password && !url.search && !url.hash, 'Proof response URL must be exact, public and on a named origin.');
    internalHref(url.pathname, 'Proof response path');
    requireCondition(!responses.has(url.href), 'HTTP proof has a duplicate response URL.');
    await proofBody(proofDir, response.bodyPath, response);
    responses.set(url.href, response);
  }
  requireCondition(Array.isArray(candidates) && candidates.length > 0 && candidates.length <= COUNT_LIMIT, 'Candidates must be a nonempty bounded array.');
  const existing = indexCatalog(catalog);
  const candidateIds = new Set();
  const candidateHrefs = new Set();
  const prepared = [];
  for (const candidate of candidates) {
    const { record, target } = candidateData(candidate, checkedKey);
    requireCondition(!candidateIds.has(record.id) && !candidateHrefs.has(target.key), 'Candidates contain a duplicate id or href.');
    candidateIds.add(record.id); candidateHrefs.add(target.key);
    const idIndex = existing.ids.get(record.id);
    const hrefIndex = existing.hrefs.get(target.key);
    let updateIndex;
    if (idIndex !== undefined || hrefIndex !== undefined) {
      requireCondition(idIndex !== undefined && hrefIndex !== undefined && idIndex === hrefIndex
        && catalog[idIndex].href === record.href, 'Existing identity collision: updates need the same id and exact href; legacy entries need explicit migration.');
      requireCondition(allowUpdates === true, 'Existing record update requires --update-existing.');
      updateIndex = idIndex;
    }
    for (const origin of [CANONICAL, release.immutableOrigin]) {
      const response = responses.get(origin + target.pathname);
      requireCondition(Boolean(response), 'Missing canonical or immutable GET proof for ' + record.href + '.');
      if (target.anchor !== null) {
        const body = await proofBody(proofDir, response.bodyPath, response);
        requireCondition(hasAnchor(body, target.anchor), 'Missing target anchor on ' + origin + target.pathname + '.');
      }
    }
    prepared.push({ updateIndex, record: { ...record, publication: { state: 'verified-live', commit: release.commit,
      canonical: CANONICAL + target.href, immutable: release.immutableOrigin, verifiedAt: checkedAt, receipt: release.releaseId } } });
  }
  const output = structuredClone(catalog);
  for (const item of prepared) {
    if (item.updateIndex !== undefined) output[item.updateIndex] = item.record;
    else output.push(item.record);
  }
  indexCatalog(output);
  return output;
}

/** Write a separate review artifact atomically; never overwrite an input. */
export async function admitHomePublishedProjects({ catalogPath, candidatesPath, receiptPath, proofPath, proofDir = path.dirname(proofPath), outputPath, allowUpdates = false }) {
  const inputs = [catalogPath, candidatesPath, receiptPath, proofPath];
  requireCondition(inputs.every(filename => typeof filename === 'string' && filename.length > 0)
    && typeof outputPath === 'string' && outputPath.length > 0, 'All input paths and --out are required.');
  const output = path.resolve(outputPath);
  const parent = await realpath(path.dirname(output));
  const actualOutput = path.join(parent, path.basename(output));
  const realProofDir = await realpath(proofDir);
  const outputInProof = path.relative(realProofDir, actualOutput);
  requireCondition(outputInProof && (outputInProof === '..' || outputInProof.startsWith('..' + path.sep) || path.isAbsolute(outputInProof)), 'Output must be outside the proof directory to preserve every evidence input.');
  const realInputs = await Promise.all(inputs.map(filename => realpath(filename)));
  requireCondition(!realInputs.includes(actualOutput), 'Output must be separate from every input.');
  try {
    const stat = await lstat(actualOutput);
    requireCondition(!stat.isSymbolicLink() && stat.isFile(), 'Output must not be a symlink or nonregular file.');
    requireCondition(!realInputs.includes(await realpath(actualOutput)), 'Output must be separate from every input.');
  } catch (error) { if (error.code !== 'ENOENT') throw error; }
  const [catalog, candidates, receipt, proof] = await Promise.all([
    jsonFile(catalogPath, 'Catalog'), jsonFile(candidatesPath, 'Candidates'), jsonFile(receiptPath, 'Receipt'), jsonFile(proofPath, 'HTTP proof'),
  ]);
  const result = await buildHomePublishedCatalog({ catalog: catalog.data, candidates: candidates.data, receipt: receipt.data,
    proofBytes: proof.bytes, proofDir, allowUpdates });
  const temporary = path.join(parent, '.' + path.basename(output) + '.' + randomUUID() + '.tmp');
  let handle;
  try {
    handle = await open(temporary, 'wx', 0o644);
    await handle.writeFile(JSON.stringify(result, null, 2) + '\n');
    await handle.sync(); await handle.close(); handle = null;
    await rename(temporary, actualOutput);
  } finally {
    await handle?.close();
    await unlink(temporary).catch(error => { if (error.code !== 'ENOENT') throw error; });
  }
  return { total: result.length, admitted: candidates.data.length, outputPath: actualOutput };
}

async function cli() {
  const names = { '--catalog': 'catalogPath', '--candidates': 'candidatesPath', '--receipt': 'receiptPath', '--proof': 'proofPath', '--proof-dir': 'proofDir', '--out': 'outputPath' };
  const options = {};
  const args = process.argv.slice(2);
  if (args.includes('--help')) {
    console.log('Offline admission: node scripts/admit-home-published-projects.mjs --catalog FILE --candidates FILE --receipt FILE --proof FILE [--proof-dir DIR] --out NEW_FILE [--update-existing]');
    return;
  }
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === '--update-existing') { requireCondition(!options.allowUpdates, 'Duplicate --update-existing.'); options.allowUpdates = true; continue; }
    requireCondition(Object.hasOwn(names, arg) && options[names[arg]] === undefined && args[index + 1] && !args[index + 1].startsWith('--'), 'Unknown, duplicate or incomplete argument.');
    options[names[arg]] = args[++index];
  }
  const result = await admitHomePublishedProjects(options);
  console.log('Prepared ' + result.admitted + ' verified records in a ' + result.total + '-record review catalog. No network, Git or deployment action was performed.');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  cli().catch(error => { console.error('Admission refused: ' + error.message); process.exitCode = 1; });
}
