export const POINTCAST_PUBLIC_ORIGIN = 'https://pointcast.xyz';

const PRIVATE_TEXT = /(?:^|[\s"'`(=\[])\/(?:Users|home|tmp|private|var\/folders)\/|(?:^|[\s"'`(=\[])[A-Za-z]:[\\/]|(?:file|sediment|library):\/\/|(?:^|[\s"'`(=\[])~\/|https?:\/\/(?:www\.)?chatgpt\.com\/(?:library|c)\//i;
const text = (value) => typeof value === 'string' && value.trim().length > 0 && !/[\u0000-\u001f\u007f]/.test(value) && !PRIVATE_TEXT.test(value);
const PRIVATE_PATH = /^\/(?:api|auth|account|me|profile|private|internal|admin|desk)(?:\/|$)/i;
const PRIVATE_SEGMENT = /(?:^|\/)(?:\.git|\.aws|\.codex|\.agents|\.env(?:\.[^/]*)?|credentials?|secrets?)(?:\/|$)/i;
const PRIVATE_PARAMETER = /^(?:.*token.*|.*secret.*|.*password.*|.*credential.*|.*signature.*|.*auth.*|.*session.*|api[-_]?key|key|code|utm_.+|gclid|fbclid)$/i;

export function isUtcProjectTimestamp(value) {
  if (!text(value) || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|\+00:00)$/.test(value)) return false;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 19) === value.slice(0, 19);
}

const timestampKey = (value) => value.slice(0, 19) + '.' + (value.slice(19).match(/^\.(\d+)/)?.[1] ?? '').padEnd(9, '0');

function publicUrl(value) {
  if (!text(value) || /[\s\\\u0000-\u001f\u007f]/.test(value)) return null;
  try {
    const url = new URL(value);
    const host = url.hostname;
    if (url.protocol !== 'https:' || url.username || url.password || url.port || !host.includes('.') || host.endsWith('.') || /^[\d.]+$/.test(host) || host.includes(':') || /(?:^|\.)(?:localhost|local|internal|test|invalid)$/i.test(host)) return null;
    const path = decodeURIComponent(url.pathname);
    if (url.origin === POINTCAST_PUBLIC_ORIGIN && (PRIVATE_PATH.test(path) || PRIVATE_SEGMENT.test(path)) || path.includes('%') || host === 'chatgpt.com' && /\/(?:library|c)(?:\/|$)/i.test(path)) return null;
    decodeURIComponent(url.search);
    decodeURIComponent(url.hash);
    const parameters = [...url.searchParams.keys(), ...new URLSearchParams(url.hash.slice(1)).keys()];
    return parameters.some((key) => PRIVATE_PARAMETER.test(key)) ? null : url;
  } catch { return null; }
}

/** Syntax and privacy checks; remote publication proof is collected separately. */
export const isPublicProjectSource = (value) => !!publicUrl(value);

/** A public route, optionally with a section anchor; never a redirect or query. */
export function isSafeProjectHref(href) {
  if (!text(href) || !href.startsWith('/') || href.startsWith('//') || /[\s\\?\u0000-\u001f\u007f]/.test(href)) return false;
  try {
    const parts = href.split('#');
    if (parts.length > 2 || parts.length === 2 && !parts[1]) return false;
    const path = parts[0];
    const decoded = decodeURIComponent(path);
    if (path.includes('//') || /%(?:2f|5c)/i.test(path) || /[\s\\%?#\u0000-\u001f\u007f]/.test(decoded) || decoded.split('/').some((segment) => segment === '.' || segment === '..') || PRIVATE_PATH.test(decoded) || PRIVATE_SEGMENT.test(decoded)) return false;
    if (parts.length === 2 && /[\\/%\u0000-\u001f\u007f]/.test(decodeURIComponent(parts[1]))) return false;
    const url = new URL(href, POINTCAST_PUBLIC_ORIGIN);
    return url.origin === POINTCAST_PUBLIC_ORIGIN && !url.search && url.pathname === path && url.href === POINTCAST_PUBLIC_ORIGIN + href;
  } catch { return false; }
}

function publicReceipt(value) {
  // A release ID, repo-relative proof path, or public HTTPS proof URL.
  // Absolute paths and free-form receipt text never reach the public feed.
  if (!text(value)) return false;
  if (/^https:\/\//i.test(value)) return !!publicUrl(value);
  if (!value.split('/').every((segment) => /^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(segment) && segment !== '.' && segment !== '..')) return false;
  return !/^(?:Users|home|private|tmp|var)\//i.test(value) && !PRIVATE_PATH.test('/' + value) && !PRIVATE_SEGMENT.test(value);
}

function hasImageRights(project) {
  const rights = project.imageRights;
  if (!rights || typeof rights !== 'object') return false;
  if (rights.status === 'not-used') return project.image === null && rights.source === null && rights.license === null && rights.checkedAt === null;
  if (!['original', 'existing-published-asset', 'licensed', 'public-domain', 'permission-granted'].includes(rights.status)) return false;
  const licenseKnown = text(rights.license);
  const licenseAllowed = licenseKnown || rights.status === 'existing-published-asset' && rights.license === null;
  return isSafeProjectHref(project.image) && /\.(?:png|jpe?g|webp|avif|gif|svg)$/i.test(project.image) && !!publicUrl(rights.source) && licenseAllowed && isUtcProjectTimestamp(rights.checkedAt);
}

/** Admission uses authored publication evidence, never the presence of a route. */
export function isVerifiedPublishedProject(project) {
  if (!project || typeof project !== 'object' || typeof project.id !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(project.id) || !['title', 'group', 'dek'].every((key) => text(project[key])) || !isSafeProjectHref(project.href) || !(project.publishedAt === null || isUtcProjectTimestamp(project.publishedAt)) || !hasImageRights(project)) return false;
  const proof = project.publication;
  if (!proof || proof.state !== 'verified-live' || typeof proof.commit !== 'string' || !/^[a-f0-9]{40}$/.test(proof.commit) || proof.canonical !== POINTCAST_PUBLIC_ORIGIN + project.href || !isUtcProjectTimestamp(proof.verifiedAt) || project.publishedAt !== null && timestampKey(proof.verifiedAt) < timestampKey(project.publishedAt) || !publicReceipt(proof.receipt)) return false;
  const immutable = publicUrl(proof.immutable);
  if (!immutable || !/^[a-f0-9]{8}\.pointcast\.pages\.dev$/.test(immutable.hostname) || immutable.pathname !== '/' || immutable.search || immutable.hash) return false;
  if (project.imageRights.checkedAt !== null && timestampKey(project.imageRights.checkedAt) > timestampKey(proof.verifiedAt)) return false;
  return Array.isArray(project.sources) && project.sources.length > 0 && project.sources.every((source) => source && !!publicUrl(source.url) && text(source.title) && isUtcProjectTimestamp(source.checkedAt) && timestampKey(source.checkedAt) <= timestampKey(proof.verifiedAt));
}

/** A whitelist also keeps optional private intake fields out of public JSON. */
function publicRecord(project) {
  return Object.freeze({
    id: project.id, title: project.title, href: project.href, group: project.group,
    dek: project.dek, image: project.image, publishedAt: project.publishedAt,
    publication: Object.freeze(Object.fromEntries(['state', 'commit', 'canonical', 'immutable', 'verifiedAt', 'receipt'].map((key) => [key, project.publication[key]]))),
    sources: Object.freeze(project.sources.map(({ url, title, checkedAt }) => Object.freeze({ url, title, checkedAt }))),
    imageRights: Object.freeze(Object.fromEntries(['status', 'source', 'license', 'checkedAt'].map((key) => [key, project.imageRights[key]]))),
  });
}

/** Known publication dates first, newest first; unknown dates keep authored order. */
export function getPublishedProjects(catalog) {
  if (!Array.isArray(catalog)) return [];
  const ids = new Set();
  const hrefs = new Set();
  return catalog.filter((project) => {
    if (!isVerifiedPublishedProject(project) || ids.has(project.id) || hrefs.has(project.href)) return false;
    ids.add(project.id);
    hrefs.add(project.href);
    return true;
  }).map(publicRecord).sort((a, b) => {
    if (a.publishedAt === null) return b.publishedAt === null ? 0 : 1;
    if (b.publishedAt === null) return -1;
    const aTime = timestampKey(a.publishedAt), bTime = timestampKey(b.publishedAt);
    return aTime === bTime ? 0 : aTime < bTime ? 1 : -1;
  });
}

/** Topic round robin preserves order within each topic and covers the catalog. */
export function makeProjectPanels(projects, panelSize = 3) {
  if (!Array.isArray(projects) || projects.length === 0) return [];
  const requestedSize = Number.isInteger(panelSize) && panelSize > 0 ? panelSize : 3;
  const size = Math.min(requestedSize, projects.length);
  const groups = groupPublishedProjects(projects);
  const sequence = [];
  for (let row = 0; sequence.length < projects.length; row++) {
    for (const group of groups) if (row < group.entries.length) sequence.push(group.entries[row]);
  }
  return Array.from({ length: Math.ceil(projects.length / size) }, (_, panel) =>
    Array.from({ length: size }, (_, slot) => sequence[(panel * size + slot) % sequence.length]));
}

export function publishedCatalog(catalog) {
  const projects = getPublishedProjects(catalog);
  return { version: 1, title: 'Published PointCast catalog', url: POINTCAST_PUBLIC_ORIGIN + '/latest/', total: projects.length, projects };
}

export function groupPublishedProjects(projects) {
  const groups = new Map();
  for (const project of projects) {
    if (!groups.has(project.group)) groups.set(project.group, []);
    groups.get(project.group).push(project);
  }
  return [...groups].map(([name, entries]) => ({ name, entries }));
}
