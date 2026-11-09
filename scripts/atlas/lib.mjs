// Atlas framework: helpers, a dependency-free validator and the merge/count code shared by
// every site that publishes an atlas.json. Kept byte-for-byte identical in
// mhoydich/pointcast (scripts/atlas/lib.mjs) and mhoydich/hello-token-reserve (scripts/atlas/lib.mjs).
// Spec: docs/cartography/ATLAS.md (PointCast) / docs/ATLAS.md (elsegundo.xyz). Schema: /atlas/schema.json.

export const SCHEMA_VERSION = '1.0.0';
export const SCHEMA_URL = 'https://pointcast.xyz/atlas/schema.json';
export const SITE_PREFIXES = { 'pointcast.xyz': 'pc', 'elsegundo.xyz': 'es', 'industrynext.xyz': 'in', 'ues': 'ues' };
export const TYPES = ['place', 'court', 'player', 'gear', 'event', 'league', 'business', 'quiet-place', 'shrine', 'ping', 'page', 'bot', 'agent', 'route', 'area', 'dataset', 'feed', 'tool'];
export const RELS = ['near', 'in', 'part-of', 'has-part', 'same-as', 'about', 'plays-at', 'hosted-at', 'made-by', 'sells', 'reads', 'answers', 'see-also'];
export const LICENSES = ['CC0-1.0', 'CC-BY-4.0', 'CC-BY-SA-4.0', 'ODbL-1.0', 'PDDL-1.0', 'MIT', 'public-domain-us-government'];
export const LABELS = ['fact', 'listing', 'reported', 'estimate', 'derived'];
export const PRECISIONS = ['point', 'address', 'block', 'neighborhood', 'city', 'region'];
export const STATUSES = ['live', 'planned', 'historical', 'draft'];
export const ID_RE = new RegExp(`^(${Object.values(SITE_PREFIXES).join('|')}):(${TYPES.join('|')}):[a-z0-9][a-z0-9._-]*$`);
export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
export const SLUG_RE = /^[a-z0-9][a-z0-9-]*$/;
export const TAG_RE = /^[a-z0-9][a-z0-9:._-]*$/;
export const HOST_RE = /^[a-z0-9.-]+\.[a-z]{2,}$/;
/**
 * Hosts whose terms bar extracting or republishing their data (the pickleball directory's
 * blocked_source_hosts, content/pickleball/players/config.json on elsegundo.xyz). Nothing in the
 * Atlas is taken from them: they may appear only as a reference link in source[], never as a
 * record's url, data door or coordinate source (ATLAS.md §5.2).
 */
export const BANNED_HOSTS = ['pickleball.com', 'pickleballtournaments.com', 'pickleballbrackets.com', 'ppatour.com', 'usapickleball.org', 'dupr.com', 'pickleballden.com', 'utrsports.net', 'mydupr.com', 'pickleheads.com'];
export const bannedHost = (url) => { try { const h = new URL(url).hostname.toLowerCase(); return BANNED_HOSTS.some((b) => h === b || h.endsWith(`.${b}`)); } catch { return false; } };

const EARTH_MILES = 3958.7613;
const rad = (d) => (d * Math.PI) / 180;

/** Great-circle distance in miles between two {lat, lon} points (mean-radius sphere). */
export function haversineMiles(a, b) {
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_MILES * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Initial bearing from a to b in degrees, 0 = north, clockwise. */
export function bearingDegrees(a, b) {
  const y = Math.sin(rad(b.lon - a.lon)) * Math.cos(rad(b.lat));
  const x = Math.cos(rad(a.lat)) * Math.sin(rad(b.lat)) - Math.sin(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.cos(rad(b.lon - a.lon));
  return (((Math.atan2(y, x) * 180) / Math.PI) + 360) % 360;
}

export const round6 = (n) => Math.round(Number(n) * 1e6) / 1e6;

/** A lowercase a-z0-9 slug with single hyphens. Accents are stripped. */
export function slug(text) {
  return String(text ?? '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

/** Build an atlas id: rid('pointcast.xyz', 'court', 'rec park') -> 'pc:court:rec-park'. */
export function rid(site, type, text) {
  const prefix = SITE_PREFIXES[site] || site;
  const s = SLUG_RE.test(String(text)) || /^[a-z0-9][a-z0-9._-]*$/.test(String(text)) ? String(text) : slug(text);
  return `${prefix}:${type}:${s}`;
}

/** A source entry. `checked` must be YYYY-MM-DD; `label` one of LABELS (default fact). */
export function src(url, checked, label = 'fact', title, quote) {
  const s = { url: String(url), checked: String(checked).slice(0, 10), label };
  if (title) s.title = String(title);
  if (quote) s.quote = String(quote).slice(0, 300);
  return s;
}

/** A location. Omit rather than guess. */
export function loc(lat, lon, precision, extra = {}) {
  if (!Number.isFinite(Number(lat)) || !Number.isFinite(Number(lon))) return undefined;
  const l = { lat: round6(lat), lon: round6(lon), precision };
  for (const k of ['address', 'area', 'method', 'source', 'license']) if (extra[k] != null && extra[k] !== '') l[k] = extra[k];
  return l;
}

/** Trim a summary to the schema limit without cutting a word. */
export function summary(text, max = 280) {
  const t = String(text ?? '').replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t || undefined;
  const cut = t.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(' ') > 40 ? cut.lastIndexOf(' ') : cut.length).trim()}…`;
}

/** Drop undefined / null / empty-array fields so output is tidy and stable. */
export function compact(record) {
  const out = {};
  for (const [k, v] of Object.entries(record)) {
    if (v === undefined || v === null) continue;
    if (Array.isArray(v) && v.length === 0) continue;
    out[k] = v;
  }
  return out;
}

const PHONE_RE = /(?:\+?1[\s.-]?)?\(?\b\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}\b/;
const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;
const SSN_RE = /\b\d{3}-\d{2}-\d{4}\b/;

/**
 * Personal-data screen. Phones and emails are allowed only for records whose type is
 * `business`, `place` or `court` (a venue's public desk line) and only in `summary`.
 * Everything else that looks like a phone, email or SSN fails the build.
 */
export function personalDataProblems(record) {
  const problems = [];
  const allowPhone = ['business', 'place', 'court'].includes(record.type);
  const walk = (value, path) => {
    if (typeof value === 'string') {
      if (SSN_RE.test(value)) problems.push(`${path}: looks like an SSN`);
      if (EMAIL_RE.test(value) && !(allowPhone && path === 'summary')) problems.push(`${path}: contains an email address`);
      if (PHONE_RE.test(value) && !(allowPhone && path === 'summary')) problems.push(`${path}: contains a phone number`);
    } else if (Array.isArray(value)) value.forEach((v, i) => walk(v, `${path}[${i}]`));
    else if (value && typeof value === 'object') for (const [k, v] of Object.entries(value)) if (k !== 'url' && k !== 'data' && k !== 'image') walk(v, path ? `${path}.${k}` : k);
  };
  walk(record, '');
  return problems;
}

const isHttps = (u) => typeof u === 'string' && /^https:\/\/[^\s]+$/.test(u);
const isDate = (d) => typeof d === 'string' && DATE_RE.test(d) && !Number.isNaN(Date.parse(`${d}T00:00:00Z`)) && new Date(`${d}T00:00:00Z`).toISOString().slice(0, 10) === d;

/** Validate one record. Returns an array of problem strings (empty when valid). */
export function recordProblems(r) {
  const p = [];
  if (!r || typeof r !== 'object') return ['record is not an object'];
  const allowed = new Set(['id', 'type', 'name', 'summary', 'site', 'url', 'data', 'location', 'source', 'updated', 'links', 'license', 'attribution', 'tags', 'layer', 'status', 'sensitive', 'when', 'image']);
  for (const k of Object.keys(r)) if (!allowed.has(k)) p.push(`unknown field ${k}`);
  if (!ID_RE.test(r.id || '')) p.push(`id ${JSON.stringify(r.id)} must match ${ID_RE}`);
  if (!TYPES.includes(r.type)) p.push(`type ${JSON.stringify(r.type)} not in vocabulary`);
  if (r.id && r.type && String(r.id).split(':')[1] !== r.type) p.push(`id type segment does not match type ${r.type}`);
  if (typeof r.name !== 'string' || !r.name.trim() || r.name.length > 200) p.push('name missing or too long');
  if (r.summary != null && (typeof r.summary !== 'string' || r.summary.length > 280)) p.push('summary must be a string of at most 280 chars');
  if (!HOST_RE.test(r.site || '')) p.push('site must be a hostname');
  if (r.id && r.site && SITE_PREFIXES[r.site] && !String(r.id).startsWith(`${SITE_PREFIXES[r.site]}:`) && !String(r.id).startsWith('ues:')) p.push(`id prefix does not match site ${r.site}`);
  if (!isHttps(r.url)) p.push('url must be an https URL');
  for (const [k, v] of [['url', r.url], ['data', r.data], ['location.source', r.location && r.location.source]]) if (v && bannedHost(v)) p.push(`${k} points at ${new URL(v).hostname}, a host whose terms bar republishing; banned hosts may only be cited in source[]`);
  if (r.data != null && !isHttps(r.data)) p.push('data must be an https URL');
  if (r.image != null && !isHttps(r.image)) p.push('image must be an https URL');
  if (r.location != null) {
    const l = r.location;
    if (typeof l !== 'object') p.push('location must be an object');
    else {
      if (!(Number.isFinite(l.lat) && l.lat >= -90 && l.lat <= 90)) p.push('location.lat out of range');
      if (!(Number.isFinite(l.lon) && l.lon >= -180 && l.lon <= 180)) p.push('location.lon out of range');
      if (!PRECISIONS.includes(l.precision)) p.push('location.precision not in vocabulary');
      if (l.area != null && !SLUG_RE.test(l.area)) p.push('location.area must be a slug');
      if (l.source != null && !isHttps(l.source)) p.push('location.source must be https');
      if (l.license != null && !LICENSES.includes(l.license)) p.push('location.license not in vocabulary');
      for (const k of Object.keys(l)) if (!['lat', 'lon', 'precision', 'address', 'area', 'method', 'source', 'license'].includes(k)) p.push(`location has unknown field ${k}`);
    }
  }
  if (!Array.isArray(r.source) || r.source.length === 0) p.push('source must be a non-empty array');
  else r.source.forEach((s, i) => {
    if (!s || typeof s !== 'object') return p.push(`source[${i}] is not an object`);
    if (!isHttps(s.url)) p.push(`source[${i}].url must be https`);
    if (!isDate(s.checked)) p.push(`source[${i}].checked must be YYYY-MM-DD`);
    if (!LABELS.includes(s.label)) p.push(`source[${i}].label not in vocabulary`);
    if (s.quote != null && String(s.quote).length > 300) p.push(`source[${i}].quote over 300 chars`);
  });
  if (!isDate(r.updated)) p.push('updated must be YYYY-MM-DD');
  if (r.links != null) {
    if (!Array.isArray(r.links)) p.push('links must be an array');
    else r.links.forEach((l, i) => {
      if (!l || !RELS.includes(l.rel)) p.push(`links[${i}].rel not in vocabulary`);
      if (!l || !ID_RE.test(l.id || '')) p.push(`links[${i}].id is not an atlas id`);
      if (l && l.id === r.id) p.push(`links[${i}] points at itself`);
      if (l && l.note != null && String(l.note).length > 200) p.push(`links[${i}].note over 200 chars`);
    });
  }
  if (!LICENSES.includes(r.license)) p.push('license not in vocabulary');
  if (r.license !== 'CC0-1.0' && !r.attribution) p.push('attribution is required when license is not CC0-1.0');
  if (r.tags != null && (!Array.isArray(r.tags) || r.tags.some((t) => !TAG_RE.test(t)))) p.push('tags must be lowercase facets');
  if (!SLUG_RE.test(r.layer || '')) p.push('layer must be a slug');
  if (r.status != null && !STATUSES.includes(r.status)) p.push('status not in vocabulary');
  if (r.sensitive != null && (!Array.isArray(r.sensitive) || r.sensitive.some((t) => typeof t !== 'string'))) p.push('sensitive must be an array of strings');
  if (r.when != null && (typeof r.when !== 'object' || typeof r.when.start !== 'string')) p.push('when.start is required when when is present');
  p.push(...personalDataProblems(r));
  return p;
}

/** Validate a whole atlas document (site atlas or merged index). Returns problems; [] when valid. */
export function atlasProblems(atlas, { requireSameSiteLinks = true } = {}) {
  const p = [];
  if (!atlas || typeof atlas !== 'object') return ['atlas is not an object'];
  if (atlas.schemaVersion !== SCHEMA_VERSION) p.push(`schemaVersion must be ${SCHEMA_VERSION}`);
  if (!['site-atlas', 'merged-index'].includes(atlas.kind)) p.push('kind must be site-atlas or merged-index');
  if (!HOST_RE.test(atlas.site || '')) p.push('site must be a hostname');
  if (!atlas.name) p.push('name is required');
  if (typeof atlas.generated !== 'string' || Number.isNaN(Date.parse(atlas.generated))) p.push('generated must be an ISO date-time');
  if (!LICENSES.includes(atlas.license)) p.push('license not in vocabulary');
  if (!atlas.notOfficial) p.push('notOfficial line is required');
  const c = atlas.center;
  if (!c || !Number.isFinite(c.lat) || !Number.isFinite(c.lon) || !c.name || !isHttps(c.source)) p.push('center needs lat, lon, name and an https source');
  if (!(Number.isFinite(atlas.radiusMiles) && atlas.radiusMiles >= 1)) p.push('radiusMiles must be a positive number');
  if (!Array.isArray(atlas.layers)) p.push('layers must be an array');
  else {
    const seen = new Set();
    atlas.layers.forEach((l, i) => {
      if (!l || !SLUG_RE.test(l.id || '')) p.push(`layers[${i}].id must be a slug`);
      if (l && seen.has(l.id)) p.push(`layers[${i}].id ${l.id} is repeated`);
      if (l) seen.add(l.id);
      if (!l || !l.name) p.push(`layers[${i}].name is required`);
      if (!l || !Array.isArray(l.types) || !l.types.length || l.types.some((t) => !TYPES.includes(t))) p.push(`layers[${i}].types must list vocabulary types`);
      if (!l || !Number.isInteger(l.count) || l.count < 0) p.push(`layers[${i}].count must be a non-negative integer`);
      if (!l || typeof l.inline !== 'boolean') p.push(`layers[${i}].inline must be a boolean`);
      if (!l || !LICENSES.includes(l.license)) p.push(`layers[${i}].license not in vocabulary`);
      if (!l || !isDate(l.updated)) p.push(`layers[${i}].updated must be YYYY-MM-DD`);
      if (l && l.data != null && !isHttps(l.data)) p.push(`layers[${i}].data must be https`);
      if (l && l.page != null && !isHttps(l.page)) p.push(`layers[${i}].page must be https`);
      if (l && l.source != null && (!isHttps(l.source.url) || !isDate(l.source.checked) || !LABELS.includes(l.source.label))) p.push(`layers[${i}].source needs url, checked and label`);
    });
  }
  if (!Array.isArray(atlas.records)) { p.push('records must be an array'); return p; }
  const ids = new Set();
  const layerIds = new Set((atlas.layers || []).map((l) => l && l.id));
  const prefix = SITE_PREFIXES[atlas.site];
  atlas.records.forEach((r, i) => {
    const rp = recordProblems(r);
    rp.forEach((m) => p.push(`records[${i}] (${r && r.id}): ${m}`));
    if (r && ids.has(r.id)) p.push(`records[${i}]: duplicate id ${r.id}`);
    if (r) ids.add(r.id);
    if (r && !layerIds.has(r.layer)) p.push(`records[${i}] (${r.id}): layer ${r.layer} is not declared in layers[]`);
    if (atlas.kind === 'site-atlas' && r && prefix && r.site !== atlas.site && !String(r.id).startsWith('ues:')) p.push(`records[${i}] (${r.id}): site ${r.site} differs from atlas site`);
  });
  if (requireSameSiteLinks) {
    atlas.records.forEach((r, i) => {
      for (const l of r.links || []) {
        const own = prefix && String(l.id).startsWith(`${prefix}:`);
        if (atlas.kind === 'site-atlas' && own && !ids.has(l.id)) p.push(`records[${i}] (${r.id}): link ${l.rel} -> ${l.id} points at an id this atlas does not have`);
        if (atlas.kind === 'merged-index' && !ids.has(l.id) && !String(l.id).startsWith('in:')) p.push(`records[${i}] (${r.id}): link ${l.rel} -> ${l.id} unresolved in the merged index`);
      }
    });
  }
  if (!atlas.counts || atlas.counts.total !== atlas.records.length) p.push('counts.total does not match records.length');
  const located = atlas.records.filter((r) => r && r.location).length;
  if (atlas.counts && atlas.counts.located !== located) p.push(`counts.located should be ${located}`);
  for (const l of atlas.layers || []) if (l && l.inline) {
    const n = atlas.records.filter((r) => r && r.layer === l.id).length;
    if (atlas.counts && atlas.counts.byLayer && atlas.counts.byLayer[l.id] !== n) p.push(`counts.byLayer.${l.id} should be ${n}`);
  }
  if (atlas.kind === 'merged-index') {
    if (!Array.isArray(atlas.sites) || !atlas.sites.length) p.push('merged-index needs sites[]');
    if (!Array.isArray(atlas.crossLinks)) p.push('merged-index needs crossLinks[]');
  }
  return p;
}

/** Stable sort for records: by type, then id. */
export function sortRecords(records) {
  return [...records].sort((a, b) => (a.type === b.type ? a.id.localeCompare(b.id) : TYPES.indexOf(a.type) - TYPES.indexOf(b.type)));
}

export function counts(records, layers) {
  const byType = {};
  const byLayer = {};
  for (const r of records) {
    byType[r.type] = (byType[r.type] || 0) + 1;
    byLayer[r.layer] = (byLayer[r.layer] || 0) + 1;
  }
  for (const l of layers) if (!l.inline) byLayer[l.id] = byLayer[l.id] || 0;
  const sortKeys = (o) => Object.fromEntries(Object.entries(o).sort(([a], [b]) => a.localeCompare(b)));
  return { total: records.length, located: records.filter((r) => r.location).length, byType: sortKeys(byType), byLayer: sortKeys(byLayer) };
}

/** Assemble a site atlas document from site config, layer metadata and records. */
export function assembleAtlas(site, layers, records, generated) {
  const sorted = sortRecords(records.map(compact));
  const layerMeta = layers.map((l) => compact({
    id: l.id, name: l.name, description: l.description, types: l.types, count: l.count ?? sorted.filter((r) => r.layer === l.id).length,
    inline: l.inline !== false, data: l.data, page: l.page, license: l.license || 'CC0-1.0', attribution: l.attribution, updated: l.updated, source: l.source, notes: l.notes, sensitive: l.sensitive,
  }));
  return {
    $schema: SCHEMA_URL,
    schemaVersion: SCHEMA_VERSION,
    kind: 'site-atlas',
    site: site.host,
    name: site.name,
    description: site.description,
    generated,
    license: 'CC0-1.0',
    licenseNote: 'Records carry their own license when it differs; OpenStreetMap-derived records are ODbL-1.0 with attribution.',
    attribution: site.attribution,
    notOfficial: site.notOfficial,
    spec: site.spec,
    map: site.map,
    center: site.center,
    radiusMiles: site.radiusMiles,
    layers: layerMeta,
    records: sorted,
    counts: counts(sorted, layerMeta),
  };
}

/** Merge several site atlases into one index. Later atlases never overwrite an earlier id. */
export function mergeAtlases(indexSite, atlases, generated) {
  const records = [];
  const ids = new Set();
  const layers = [];
  const sites = [];
  for (const { atlas, url, snapshot, ok, note, live } of atlases) {
    if (!atlas) { sites.push({ site: url.replace(/^https:\/\/([^/]+).*$/, '$1'), atlas: url, generated: null, snapshot: snapshot || null, records: 0, ok: false, live: false, note: note || 'atlas unavailable' }); continue; }
    // ok = the snapshot validated; live = this build read the atlas from its published URL (false for a committed snapshot).
    sites.push(compact({ site: atlas.site, atlas: url, generated: atlas.generated, snapshot: snapshot || null, records: atlas.records.length, ok: ok !== false, live: live === true, note }));
    for (const l of atlas.layers) { const renamed = layers.some((x) => x.id === l.id); layers.push({ ...l, id: renamed ? `${SITE_PREFIXES[atlas.site] || 'x'}-${l.id}` : l.id, site: atlas.site, ...(renamed ? { sourceLayer: l.id } : {}) }); }
    for (const r of atlas.records) {
      if (ids.has(r.id)) continue;
      ids.add(r.id);
      const layerId = layers.find((l) => l.site === atlas.site && (l.id === r.layer || l.id === `${SITE_PREFIXES[atlas.site] || 'x'}-${r.layer}`));
      records.push(layerId && layerId.id !== r.layer ? { ...r, layer: layerId.id } : r);
    }
  }
  const sorted = sortRecords(records);
  const crossLinks = [];
  for (const r of sorted) for (const l of r.links || []) if (String(l.id).split(':')[0] !== String(r.id).split(':')[0]) crossLinks.push({ from: r.id, rel: l.rel, to: l.id });
  const layerMeta = layers; // merged layers keep `site`, and `sourceLayer` when their id was prefixed to avoid a collision
  return {
    $schema: SCHEMA_URL,
    schemaVersion: SCHEMA_VERSION,
    kind: 'merged-index',
    site: indexSite.host,
    name: indexSite.indexName,
    description: indexSite.indexDescription,
    generated,
    license: 'CC0-1.0',
    licenseNote: 'Records carry their own license when it differs; OpenStreetMap-derived records are ODbL-1.0 with attribution.',
    notOfficial: indexSite.notOfficial,
    spec: indexSite.spec,
    map: indexSite.indexMap,
    center: indexSite.center,
    radiusMiles: indexSite.radiusMiles,
    sites,
    crossLinks,
    layers: layerMeta,
    records: sorted,
    counts: counts(sorted, layerMeta),
  };
}

/** Compare two atlas documents ignoring `generated` and `sites[].snapshot`/`generated` timestamps. */
export function sameAtlas(a, b) {
  const strip = (x) => JSON.stringify({ ...x, generated: undefined, sites: (x.sites || []).map((s) => ({ ...s, generated: undefined })) });
  return strip(a) === strip(b);
}
