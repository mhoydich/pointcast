// playground.js: the logic behind /chain/playground, the try-it page for the
// PointCast devnet's MCP tools and REST reads.
//
// An ES module for browsers and Node 18+. No DOM, no imports, no network at
// import time: the page (src/pages/chain/playground.astro) owns the DOM, and
// tests/chain-app-playground.test.mjs and scripts/e2e-chain-app-playground.mjs
// import this file directly.
//
// What is in here
//   - which devnet to read (resolveDevnet: the ?devnet= override is honored for
//     localhost and 127.0.0.1 only)
//   - tools/list parsing, and a conservative read-only / writes / unknown
//     classification (classifyTool): only a read-only tool is ever run
//   - inputSchema -> form fields -> tool arguments (fieldsFromSchema,
//     buildArguments, validateJson), for every JSON Schema shape the devnet
//     serves, and a plain JSON box for any shape it does not understand
//   - the copy-paste snippets (curl, a ten-line Node fetch)
//   - the REST GET routes and the REST twin of each read-only tool
//   - a small client that tries MCP first and falls back to the REST twin when
//     a browser page cannot read /mcp
//
// Why a REST fallback exists: the devnet Worker sends no CORS headers on
// POST /mcp (keyless writes are fenced from web pages on purpose), so a page
// on pointcast.xyz cannot read an /mcp reply. GET reads allow any origin. The
// client therefore tries tools/list once; if the browser blocks it, it says
// so, shows the pinned list and runs read-only tools through their matching
// GET routes, labelling every result with the route it came from.
//
// Nothing here posts to the chain. The only POST this module can send is
// tools/list, tools/call for a read-only tool, and POST /tx/digest (a digest
// of a tx you describe: the router allows it from browsers, it changes no
// state).

export const TIMEOUT_MS = 8_000;
export const MAX_BODY_CHARS = 512 * 1024;
export const DISPLAY_CHARS = 60_000;
export const MAX_TOOLS = 200;
export const TOOL_NAME_RE = /^[a-z][a-z0-9_]{0,63}$/;

/** Read-only tools this page will run (by name; the description and annotations must agree too). */
export const READ_TOOLS = Object.freeze([
  'chain_status',
  'chain_feed',
  'chain_read_block',
  'chain_read_account',
  'chain_tx_digest',
  'editions_list',
  'station_get',
  'capsules_due',
  'chain_daily_lot',
  'nm_ledger',
  'nm_note',
  'chain_duties',
]);

/** Tools known to post. Shown with schema and snippets; never run here. */
export const WRITE_TOOLS = Object.freeze([
  'chain_post',
  'chain_submit_signed',
  'chain_checkin',
  'chain_observe',
  'chain_crosscheck',
  'chain_review',
  'chain_digest',
  'chain_signal',
  'chain_bid',
]);

/**
 * Wording that says a tool posts, submits or spends something. A tool whose
 * name is on READ_TOOLS but whose description matches is downgraded to
 * "unknown" (no Run). Checked against every tool the devnet serves today: no
 * read-only tool matches it, every writing tool does.
 */
export const POSTS_PATTERN =
  /\b(?:publish(?:es)? an? (?:post|block)|post(?:s|ed)? (?:as|to|on|a|an) (?:a |an |your |the )?(?:bot|channel|post|block)|submit(?:s)? an?\b|writes? the post|lands? in channel|spends? (?:one of )?(?:your|a|an)\b|counts? toward today|is a transfer of)/i;

const hex4 = (n) => n.toString(16).padStart(4, '0');
const rangeClass = (ranges) => new RegExp(`[${ranges.map(([a, b]) => `\\u${hex4(a)}${b > a ? `-\\u${hex4(b)}` : ''}`).join('')}]`, 'g');
/** Control, bidi and zero-width characters, built from code points so this source holds none of them. */
// U+200C and U+200D are kept (emoji sequences, Persian and Indic text), as in chain-kit.js and verify.js: the three cleanText copies agree (tests/chain-app-observatory.test.mjs holds them to it).
const INVISIBLE_RE = rangeClass([[0x00, 0x1f], [0x7f, 0x9f], [0xad, 0xad], [0x61c, 0x61c], [0x200b, 0x200b], [0x200e, 0x200f], [0x2028, 0x202e], [0x2060, 0x206f], [0xfeff, 0xfeff]]);
/** The same, but newline, tab and carriage return stay. */
const BLOCK_INVISIBLE_RE = rangeClass([[0x00, 0x08], [0x0b, 0x0c], [0x0e, 0x1f], [0x7f, 0x9f], [0xad, 0xad], [0x61c, 0x61c], [0x200b, 0x200b], [0x200e, 0x200f], [0x2028, 0x202e], [0x2060, 0x206f], [0xfeff, 0xfeff]]);

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : undefined);
const nat = (v) => (Number.isSafeInteger(v) && v >= 0 ? v : undefined);

/** Hostile string -> one safe line of at most `max` code points. Non-strings -> ''. */
export function cleanText(value, max = 240) {
  if (typeof value !== 'string') return '';
  const flat = value.slice(0, 20_000).replace(INVISIBLE_RE, ' ').replace(/\s+/g, ' ').trim();
  const chars = Array.from(flat);
  return chars.length <= max ? flat : `${chars.slice(0, Math.max(1, max - 1)).join('').trimEnd()}…`;
}

/** Strip control and bidi characters but keep newlines and spacing (for code-like values). */
export function cleanBlock(value, max = 20_000) {
  if (typeof value !== 'string') return '';
  return value.slice(0, max).replace(BLOCK_INVISIBLE_RE, '');
}

export class PgError extends Error {
  constructor(kind, message, extra = {}) {
    super(message);
    this.name = 'PgError';
    this.kind = kind;
    Object.assign(this, extra);
  }
}

const asPgError = (e) => (e instanceof PgError ? e : new PgError('network', e && e.message ? String(e.message) : 'request failed'));

// ---------------------------------------------------------------- which devnet

/** http(s)://localhost or 127.0.0.1 (any port), origin only. Anything else -> null. */
export function parseLocalOrigin(raw) {
  let u;
  try {
    u = new URL(String(raw));
  } catch {
    return null;
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
  if (u.username || u.password) return null;
  if (u.hostname !== 'localhost' && u.hostname !== '127.0.0.1') return null;
  return u.origin;
}

/**
 * The devnet this page reads. `defaultBase` is the public devnet's origin;
 * `?devnet=` replaces it only when its origin is localhost or 127.0.0.1 (for a
 * local end-to-end run). Any other value is ignored and reported.
 */
export function resolveDevnet(defaultBase, search = '') {
  const def = String(defaultBase).replace(/\/+$/, '');
  let raw = null;
  try {
    raw = new URLSearchParams(String(search)).get('devnet');
  } catch {
    raw = null;
  }
  if (raw === null || raw === '') return { base: def, mcp: `${def}/mcp`, override: false, ignored: '' };
  const local = parseLocalOrigin(raw);
  if (!local) return { base: def, mcp: `${def}/mcp`, override: false, ignored: cleanText(raw, 80) };
  return { base: local, mcp: `${local}/mcp`, override: true, ignored: '' };
}

// ---------------------------------------------------------------- tools/list

const SCHEMA_KEYS = new Set([
  'type', 'properties', 'required', 'items', 'enum', 'const', 'default', 'minimum', 'maximum', 'exclusiveMinimum', 'exclusiveMaximum',
  'minLength', 'maxLength', 'pattern', 'minItems', 'maxItems', 'additionalProperties', 'description', 'title', 'format', 'examples', 'nullable',
]);
const COMPLEX_KEYS = ['oneOf', 'anyOf', 'allOf', 'not', '$ref', 'if', 'then', 'else', 'patternProperties', 'prefixItems', 'dependentSchemas'];

/** A plain, bounded copy of a JSON Schema: known keys only, strings cleaned, depth and size capped. Unsupported structure sets `complex`. */
export function cloneSchema(schema, depth = 0, budget = { n: 600 }) {
  if (!isObj(schema)) return {};
  const out = {};
  if (depth > 8 || budget.n-- <= 0) return { complex: true };
  for (const k of COMPLEX_KEYS) if (own(schema, k)) out.complex = true;
  for (const k of Object.keys(schema)) {
    if (!SCHEMA_KEYS.has(k)) continue;
    const v = schema[k];
    switch (k) {
      case 'properties': {
        if (!isObj(v)) break;
        out.properties = {};
        for (const [pk, pv] of Object.entries(v).slice(0, 60)) {
          if (pk.length > 64 || pk === '__proto__' || pk === 'constructor' || pk === 'prototype') continue;
          out.properties[pk] = cloneSchema(pv, depth + 1, budget);
        }
        break;
      }
      case 'items':
        if (isObj(v)) out.items = cloneSchema(v, depth + 1, budget);
        else out.complex = true;
        break;
      case 'required':
        if (Array.isArray(v)) out.required = v.filter((x) => typeof x === 'string').slice(0, 60);
        break;
      case 'enum':
        if (Array.isArray(v)) out.enum = v.filter((x) => ['string', 'number', 'boolean'].includes(typeof x) || x === null).slice(0, 100);
        break;
      case 'type':
        if (typeof v === 'string') out.type = v;
        else if (Array.isArray(v)) out.type = v.filter((x) => typeof x === 'string').slice(0, 8);
        break;
      case 'additionalProperties':
        if (typeof v === 'boolean') out.additionalProperties = v;
        else if (isObj(v)) out.additionalProperties = cloneSchema(v, depth + 1, budget);
        break;
      case 'description':
        out.description = cleanText(v, 400);
        break;
      case 'title':
      case 'format':
        out[k] = cleanText(v, 80);
        break;
      case 'pattern':
        if (typeof v === 'string' && v.length <= 400) out.pattern = cleanBlock(v, 400);
        break;
      case 'default':
      case 'const':
        if (['string', 'number', 'boolean'].includes(typeof v) || v === null || Array.isArray(v) || isObj(v)) out[k] = v;
        break;
      case 'examples':
        if (Array.isArray(v)) out.examples = v.slice(0, 3);
        break;
      case 'nullable':
        out.nullable = v === true;
        break;
      default:
        if (num(v) !== undefined) out[k] = v;
    }
  }
  return out;
}

/** One entry of tools/list -> a clean tool, or null when it has no usable name. */
export function normalizeTool(raw) {
  if (!isObj(raw) || typeof raw.name !== 'string' || !TOOL_NAME_RE.test(raw.name)) return null;
  const schemaOdd = !isObj(raw.inputSchema);
  const inputSchema = schemaOdd ? { type: 'object', properties: {} } : cloneSchema(raw.inputSchema);
  const a = isObj(raw.annotations) ? raw.annotations : {};
  const annotations = {};
  for (const k of ['readOnlyHint', 'destructiveHint', 'idempotentHint', 'openWorldHint']) if (typeof a[k] === 'boolean') annotations[k] = a[k];
  return {
    name: raw.name,
    title: cleanText(raw.title, 80) || raw.name,
    description: cleanText(raw.description, 1500),
    inputSchema,
    annotations,
    schemaOdd,
  };
}

/** A JSON-RPC tools/list reply -> { tools, dropped }. Throws PgError('rpc' | 'parse'). */
export function parseToolsList(json) {
  if (!isObj(json)) throw new PgError('parse', 'tools/list: the reply was not a JSON-RPC object');
  if (isObj(json.error)) throw new PgError('rpc', `tools/list: ${cleanText(json.error.message, 160) || 'the server returned an error'}`, { code: json.error.code });
  const list = isObj(json.result) ? json.result.tools : undefined;
  if (!Array.isArray(list)) throw new PgError('parse', 'tools/list: the reply had no tools array');
  const seen = new Set();
  const tools = [];
  let dropped = 0;
  for (const raw of list.slice(0, MAX_TOOLS)) {
    const t = normalizeTool(raw);
    if (!t || seen.has(t.name)) {
      dropped += 1;
      continue;
    }
    seen.add(t.name);
    tools.push(t);
  }
  dropped += Math.max(0, list.length - MAX_TOOLS);
  return { tools, dropped };
}

/**
 * Can this page run the tool? Conservative: a tool is "read" only when its
 * name is on READ_TOOLS, its description does not say it posts, and the
 * devnet does not mark it as not read-only. A known writer is "write"; a tool
 * this page has never heard of is "unknown". Only "read" gets a Run button.
 */
export function classifyTool(tool) {
  const name = isObj(tool) ? tool.name : '';
  if (typeof name !== 'string' || !name) return { kind: 'unknown', run: false, why: 'no usable name' };
  if (WRITE_TOOLS.includes(name)) return { kind: 'write', run: false, why: 'a tool that posts to the chain' };
  if (!READ_TOOLS.includes(name)) return { kind: 'unknown', run: false, why: 'not on this page’s read-only list, so it is treated as a writing tool' };
  const ann = isObj(tool.annotations) ? tool.annotations : {};
  if (ann.readOnlyHint === false || ann.destructiveHint === true) return { kind: 'unknown', run: false, why: 'the devnet does not mark it read-only' };
  if (POSTS_PATTERN.test(String(tool.description || ''))) return { kind: 'unknown', run: false, why: 'its description says it posts' };
  return { kind: 'read', run: true, why: 'on the read-only list, and its description and annotations agree' };
}

const stable = (v) => JSON.stringify(v, (_k, x) => (isObj(x) ? Object.fromEntries(Object.keys(x).sort().map((k) => [k, x[k]])) : x));

/** The live list against the pinned one: names added, removed, and changed (description or schema). */
export function diffTools(pinned, live) {
  const a = new Map((pinned || []).map((t) => [t.name, t]));
  const b = new Map((live || []).map((t) => [t.name, t]));
  const added = [...b.keys()].filter((n) => !a.has(n));
  const removed = [...a.keys()].filter((n) => !b.has(n));
  const changed = [...b.keys()].filter((n) => a.has(n) && (a.get(n).description !== b.get(n).description || stable(a.get(n).inputSchema) !== stable(b.get(n).inputSchema)));
  return { added, removed, changed, same: !added.length && !removed.length && !changed.length };
}

// ---------------------------------------------------------------- schema -> form fields

const primaryType = (schema) => {
  const t = schema.type;
  if (typeof t === 'string') return t;
  if (Array.isArray(t)) return t.find((x) => x !== 'null') || 'null';
  if (isObj(schema.properties)) return 'object';
  return '';
};

function regexOf(pattern) {
  if (typeof pattern !== 'string') return null;
  try {
    return new RegExp(pattern, 'u');
  } catch {
    try {
      return new RegExp(pattern);
    } catch {
      return null;
    }
  }
}

/** A short example for a schema, shown as a placeholder or used to fill a snippet. Never a real value. */
export function exampleFor(schema, name = 'value', depth = 0) {
  if (!isObj(schema) || depth > 5) return `<${name}>`;
  if (Array.isArray(schema.examples) && schema.examples.length) return schema.examples[0];
  if (own(schema, 'const')) return schema.const;
  if (Array.isArray(schema.enum) && schema.enum.length) return schema.enum[0];
  if (own(schema, 'default')) return schema.default;
  switch (primaryType(schema)) {
    case 'integer':
    case 'number':
      return num(schema.minimum) ?? 1;
    case 'boolean':
      return true;
    case 'array':
      return [exampleFor(schema.items, `${name}_item`, depth + 1)];
    case 'object': {
      const props = isObj(schema.properties) ? schema.properties : {};
      const keys = Array.isArray(schema.required) && schema.required.length ? schema.required.filter((k) => own(props, k)) : Object.keys(props).slice(0, 4);
      return Object.fromEntries(keys.slice(0, 8).map((k) => [k, exampleFor(props[k], k, depth + 1)]));
    }
    default: {
      const p = typeof schema.pattern === 'string' ? schema.pattern : '';
      if (/\{64\}/.test(p) && /0-9a-f/i.test(p)) return '<64 hex>';
      if (/\{12,64\}/.test(p) && /0-9a-f/i.test(p)) return '<12 to 64 hex>';
      if (/^\^https:\/\//.test(p)) return '<https URL>';
      if (p === '^[a-z0-9-]{2,24}$') return 'my-bot';
      return `<${name}>`;
    }
  }
}

/**
 * inputSchema -> { fields, root }. Each field: { name, kind, required, label,
 * description, ...constraints, example }. kind is one of text, textarea,
 * integer, number, boolean, select, list or json. A schema this module does
 * not understand (not an object, oneOf/anyOf/$ref, or a free-form object)
 * becomes one JSON box for the whole arguments object (root: true), so a
 * tool whose schema changes is still callable.
 */
export function fieldsFromSchema(schema) {
  const s = isObj(schema) ? schema : {};
  const props = isObj(s.properties) ? s.properties : null;
  const freeForm = !props || (Object.keys(props).length === 0 && s.additionalProperties !== false);
  if ((primaryType(s) && primaryType(s) !== 'object') || s.complex || freeForm) {
    if (props && Object.keys(props).length === 0 && s.additionalProperties === false) return { fields: [], root: false };
    return {
      root: true,
      fields: [{ name: 'arguments', label: 'arguments', kind: 'json', required: false, description: 'This tool’s input schema is not one the form understands. Enter the arguments as a JSON object.', schema: s, example: exampleFor({ ...s, type: 'object' }, 'arguments') }],
    };
  }
  const required = new Set(Array.isArray(s.required) ? s.required : []);
  const fields = Object.entries(props).map(([name, p]) => fieldFor(name, isObj(p) ? p : {}, required.has(name)));
  return { fields, root: false };
}

function fieldFor(name, p, required) {
  const base = {
    name,
    label: name,
    required,
    description: typeof p.description === 'string' ? p.description : '',
    nullable: p.nullable === true || (Array.isArray(p.type) && p.type.includes('null')),
    default: own(p, 'default') ? p.default : undefined,
    example: exampleFor(p, name),
    schema: p,
  };
  const t = primaryType(p);
  if (p.complex) return { ...base, kind: 'json' };
  if (own(p, 'const') && !Array.isArray(p.enum)) return { ...base, kind: 'select', enum: [p.const] };
  if (Array.isArray(p.enum) && p.enum.length) return { ...base, kind: 'select', enum: p.enum };
  switch (t) {
    case 'string': {
      const long = (nat(p.maxLength) ?? 0) > 160 || /^(body|text|content|message)$/.test(name);
      return { ...base, kind: long ? 'textarea' : 'text', minLength: nat(p.minLength), maxLength: nat(p.maxLength), pattern: typeof p.pattern === 'string' ? p.pattern : undefined };
    }
    case 'integer':
      return { ...base, kind: 'integer', min: num(p.minimum), max: num(p.maximum) };
    case 'number':
      return { ...base, kind: 'number', min: num(p.minimum), max: num(p.maximum) };
    case 'boolean':
      return { ...base, kind: 'boolean' };
    case 'array': {
      const it = isObj(p.items) ? p.items : null;
      const itType = it ? primaryType(it) : '';
      const primitive = it && !it.complex && ['string', 'integer', 'number'].includes(itType) && !Array.isArray(it.enum);
      if (!primitive) return { ...base, kind: 'json' };
      return {
        ...base,
        kind: 'list',
        itemType: itType,
        minItems: nat(p.minItems),
        maxItems: nat(p.maxItems),
        itemPattern: typeof it.pattern === 'string' ? it.pattern : undefined,
        itemMaxLength: nat(it.maxLength),
        itemMin: num(it.minimum),
        itemMax: num(it.maximum),
        example: exampleFor(it, `${name}_item`),
      };
    }
    default:
      return { ...base, kind: 'json' };
  }
}

/** The text a form starts with for a field (its default, or empty). */
export function initialValue(field) {
  if (field.default === undefined || field.default === null) return '';
  if (field.kind === 'list' && Array.isArray(field.default)) return field.default.join('\n');
  if (field.kind === 'json') return JSON.stringify(field.default, null, 2);
  return String(field.default);
}

/** The accepted constraint, in words, for a field's hint line. */
export function constraintText(field) {
  const bits = [];
  if (field.kind === 'integer' || field.kind === 'number') {
    if (field.min !== undefined && field.max !== undefined) bits.push(`${field.min} to ${field.max}`);
    else if (field.min !== undefined) bits.push(`${field.min} or more`);
    else if (field.max !== undefined) bits.push(`${field.max} or less`);
    bits.push(field.kind === 'integer' ? 'whole number' : 'number');
  }
  if (field.kind === 'text' || field.kind === 'textarea') {
    if (field.minLength !== undefined) bits.push(`at least ${field.minLength} characters`);
    if (field.maxLength !== undefined) bits.push(`up to ${field.maxLength} characters`);
    if (field.pattern) bits.push(`pattern ${field.pattern}`);
  }
  if (field.kind === 'list') {
    bits.push('one per line');
    if (field.minItems !== undefined || field.maxItems !== undefined) bits.push(`${field.minItems ?? 0} to ${field.maxItems ?? 'any'} items`);
    if (field.itemPattern) bits.push(`each matching ${field.itemPattern}`);
  }
  if (field.kind === 'select') bits.push(`one of ${field.enum.map(String).join(', ')}`);
  if (field.kind === 'json') bits.push('JSON');
  return bits.join(' · ');
}

// ---------------------------------------------------------------- values -> arguments

const INT_RE = /^[+-]?\d+$/;
const NUM_RE = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i;
const MAX_DEPTH = 8;

function matches(re, s) {
  return !re || re.test(s);
}

function checkString(s, c) {
  const len = Array.from(s).length;
  if (c.minLength !== undefined && len < c.minLength) return `at least ${c.minLength} characters`;
  if (c.maxLength !== undefined && len > c.maxLength) return `up to ${c.maxLength} characters (this is ${len})`;
  if (c.pattern && !matches(regexOf(c.pattern), s)) return `must match ${c.pattern}`;
  return '';
}

function checkNumber(n, c, whole) {
  if (whole && !Number.isSafeInteger(n)) return 'a whole number';
  if (c.min !== undefined && n < c.min) return `${c.min} or more`;
  if (c.max !== undefined && n > c.max) return `${c.max} or less`;
  return '';
}

/**
 * A small JSON Schema check for values typed into JSON boxes: type, enum,
 * const, min/max, length, pattern, items, properties, required and
 * additionalProperties: false. Keywords it does not know are left to the
 * server. Returns a list of messages (empty = fine as far as it can tell).
 */
export function validateJson(value, schema, path = 'value', depth = 0) {
  if (!isObj(schema) || schema.complex || depth > MAX_DEPTH) return [];
  const errs = [];
  const types = Array.isArray(schema.type) ? schema.type : schema.type ? [schema.type] : [];
  const is = (t) => {
    if (t === 'null') return value === null;
    if (t === 'array') return Array.isArray(value);
    if (t === 'object') return isObj(value);
    if (t === 'integer') return Number.isSafeInteger(value);
    if (t === 'number') return typeof value === 'number' && Number.isFinite(value);
    return typeof value === t;
  };
  if (types.length && !types.some(is)) return [`${path}: must be ${types.join(' or ')}`];
  if (Array.isArray(schema.enum) && !schema.enum.some((e) => e === value)) errs.push(`${path}: must be one of ${schema.enum.map(String).join(', ')}`);
  if (own(schema, 'const') && schema.const !== value) errs.push(`${path}: must be ${String(schema.const)}`);
  if (typeof value === 'string') {
    const m = checkString(value, { minLength: nat(schema.minLength), maxLength: nat(schema.maxLength), pattern: schema.pattern });
    if (m) errs.push(`${path}: ${m}`);
  }
  if (typeof value === 'number') {
    const m = checkNumber(value, { min: num(schema.minimum), max: num(schema.maximum) }, false);
    if (m) errs.push(`${path}: ${m}`);
  }
  if (Array.isArray(value)) {
    if (nat(schema.minItems) !== undefined && value.length < schema.minItems) errs.push(`${path}: at least ${schema.minItems} items`);
    if (nat(schema.maxItems) !== undefined && value.length > schema.maxItems) errs.push(`${path}: at most ${schema.maxItems} items`);
    if (isObj(schema.items)) value.slice(0, 100).forEach((v, i) => errs.push(...validateJson(v, schema.items, `${path}[${i}]`, depth + 1)));
  }
  if (isObj(value)) {
    const props = isObj(schema.properties) ? schema.properties : {};
    for (const r of Array.isArray(schema.required) ? schema.required : []) if (!own(value, r)) errs.push(`${path}.${r}: required`);
    for (const [k, v] of Object.entries(value)) {
      if (own(props, k)) errs.push(...validateJson(v, props[k], `${path}.${k}`, depth + 1));
      else if (schema.additionalProperties === false) errs.push(`${path}.${k}: not a known field`);
    }
  }
  return errs.slice(0, 6);
}

function parseField(f, raw) {
  const text = typeof raw === 'string' ? raw : raw === undefined || raw === null ? '' : String(raw);
  switch (f.kind) {
    case 'text':
    case 'textarea': {
      if (text.trim() === '') return { empty: true };
      const m = checkString(text, f);
      return m ? { error: m } : { value: text };
    }
    case 'integer':
    case 'number': {
      const t = text.trim();
      if (t === '') return { empty: true };
      const whole = f.kind === 'integer';
      if (!(whole ? INT_RE : NUM_RE).test(t)) return { error: whole ? 'a whole number' : 'a number' };
      const n = Number(t);
      const m = checkNumber(n, f, whole);
      return m ? { error: m } : { value: n };
    }
    case 'boolean': {
      const t = text.trim().toLowerCase();
      if (t === '') return { empty: true };
      if (t === 'true') return { value: true };
      if (t === 'false') return { value: false };
      return { error: 'true or false' };
    }
    case 'select': {
      if (text === '') return { empty: true };
      const hit = f.enum.find((e) => String(e) === text);
      return hit === undefined ? { error: `one of ${f.enum.map(String).join(', ')}` } : { value: hit };
    }
    case 'list': {
      const items = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      if (!items.length) return { empty: true };
      if (f.maxItems !== undefined && items.length > f.maxItems) return { error: `at most ${f.maxItems} items (this is ${items.length})` };
      if (f.minItems !== undefined && items.length < f.minItems) return { error: `at least ${f.minItems} items` };
      const out = [];
      const re = regexOf(f.itemPattern);
      for (const [i, it] of items.entries()) {
        if (f.itemType === 'integer' || f.itemType === 'number') {
          if (!(f.itemType === 'integer' ? INT_RE : NUM_RE).test(it)) return { error: `line ${i + 1}: ${f.itemType === 'integer' ? 'a whole number' : 'a number'}` };
          const n = Number(it);
          const m = checkNumber(n, { min: f.itemMin, max: f.itemMax }, f.itemType === 'integer');
          if (m) return { error: `line ${i + 1}: ${m}` };
          out.push(n);
        } else {
          if (f.itemMaxLength !== undefined && Array.from(it).length > f.itemMaxLength) return { error: `line ${i + 1}: up to ${f.itemMaxLength} characters` };
          if (!matches(re, it)) return { error: `line ${i + 1}: must match ${f.itemPattern}` };
          out.push(it);
        }
      }
      return { value: out };
    }
    default: {
      if (text.trim() === '') return { empty: true };
      let v;
      try {
        v = JSON.parse(text);
      } catch (e) {
        return { error: `not valid JSON (${cleanText(e && e.message, 80)})` };
      }
      const errs = validateJson(v, f.schema, f.name);
      return errs.length ? { error: errs.join('; ') } : { value: v };
    }
  }
}

/**
 * Form values -> { args, errors, ok }. `values` maps field name to the text
 * in its box. Empty optional fields are left out; a required one is an
 * error. `errors` maps a field name to one short message.
 */
export function buildArguments(fields, values = {}, root = false) {
  const errors = {};
  if (root) {
    const f = fields[0];
    const r = parseField(f, values[f.name]);
    if (r.error) errors[f.name] = r.error;
    else if (!r.empty && !isObj(r.value)) errors[f.name] = 'must be a JSON object';
    return { args: r.empty || r.error || !isObj(r.value) ? {} : r.value, errors, ok: !Object.keys(errors).length };
  }
  const args = {};
  for (const f of fields) {
    const r = parseField(f, values[f.name]);
    if (r.error) errors[f.name] = r.error;
    else if (r.empty) {
      if (f.required) errors[f.name] = 'required';
    } else args[f.name] = r.value;
  }
  return { args, errors, ok: !Object.keys(errors).length };
}

/** Arguments for a snippet: what the form holds, with an example standing in for anything required that is empty or wrong. */
export function snippetArgs(fields, values = {}, root = false) {
  if (root) return buildArguments(fields, values, true).args;
  const args = {};
  for (const f of fields) {
    const r = parseField(f, values[f.name]);
    if (!r.error && !r.empty) args[f.name] = r.value;
    else if (f.required) args[f.name] = f.kind === 'list' ? [f.example] : f.example;
  }
  return args;
}

// ---------------------------------------------------------------- snippets

/** Single-quote a string for a POSIX shell. */
export function shq(s) {
  return `'${String(s).replace(/'/g, `'\\''`)}'`;
}

export function rpcBody(name, args = {}, id = 1) {
  return JSON.stringify({ jsonrpc: '2.0', id, method: 'tools/call', params: { name, arguments: args } });
}

export function curlSnippet(mcpUrl, name, args = {}) {
  return [
    `curl -s ${shq(mcpUrl)} \\`,
    `  -H 'content-type: application/json' -H 'accept: application/json, text/event-stream' \\`,
    `  -d ${shq(rpcBody(name, args))}`,
  ].join('\n');
}

/** Ten lines of Node (18 or newer, an .mjs file): one tools/call and its JSON. */
export function nodeSnippet(mcpUrl, name, args = {}) {
  return [
    `const url = ${JSON.stringify(mcpUrl)};`,
    `const call = { name: ${JSON.stringify(name)}, arguments: ${JSON.stringify(args)} };`,
    'const res = await fetch(url, {',
    '  method: "POST",',
    '  headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },',
    '  body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/call", params: call }),',
    '});',
    'const out = await res.json();',
    'if (out.error) throw new Error(out.error.message);',
    'console.log(JSON.stringify(out.result.structuredContent ?? out.result, null, 2));',
  ].join('\n');
}

export function restCurl(base, path, query = {}) {
  return `curl -s ${shq(`${base}${path}${queryString(query)}`)}`;
}

function queryString(query) {
  const parts = Object.entries(query || {})
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  return parts.length ? `?${parts.join('&')}` : '';
}

// ---------------------------------------------------------------- REST routes

const ADDRESS_RE = '^(?:tz1|tz2|pca1|pcp1)[1-9A-HJ-NP-Za-km-z]{20,60}$';

/**
 * The GET routes to know. `params` are path parameters (an input each);
 * `query` are the optional query keys the route takes; `tryQuery` is what the
 * Try button sends when the route has no path parameter, kept small so a Try
 * never pulls a large reply.
 */
export const REST_ROUTES = Object.freeze([
  { id: 'status', path: '/status', blurb: 'Chain id, genesis hash, height, tip, supply, limits, the house keys.', params: [], tryQuery: {} },
  { id: 'params', path: '/params', blurb: 'The chain parameters the genesis hash commits to.', params: [], tryQuery: {} },
  { id: 'raw-blocks', path: '/raw/blocks', blurb: 'Sealed blocks as the verifier reads them. Try sends from=1 and limit=3.', params: [], query: ['from', 'limit'], tryQuery: { from: 1, limit: 3 } },
  { id: 'raw-block', path: '/raw/block/{height}', blurb: 'One sealed block by height.', params: [{ name: 'height', label: 'height', kind: 'integer', min: 1, placeholder: '1', example: '1' }] },
  { id: 'net', path: '/net', blurb: 'Today’s Daily Net: the roll, witness keys, strikes and the last net reports.', params: [], tryQuery: {} },
  { id: 'witnesses', path: '/witnesses', blurb: 'Every witness key, by address. Try sends limit=10.', params: [], query: ['limit', 'after'], tryQuery: { limit: 10 } },
  { id: 'checkpoints', path: '/checkpoints', blurb: 'Checkpoints keys have signed, in spans of up to 1,000 heights.', params: [], query: ['from', 'to'], tryQuery: {} },
  { id: 'daily', path: '/daily', blurb: 'The Daily Mint’s open lot: a play auction in devnet play ATTN.', params: [], tryQuery: {} },
  { id: 'nm-state', path: '/nm/state', blurb: 'Nouns Money 27: open or closed, copies left, the gate.', params: [], tryQuery: {} },
  { id: 'editions', path: '/editions', blurb: 'Every edition on the devnet: terms, minted and remaining.', params: [], tryQuery: {} },
  { id: 'station', path: '/station/{code}', blurb: 'One station by channel code: owner, mode, crew.', params: [{ name: 'code', label: 'code', kind: 'text', pattern: '^[A-Za-z0-9]{1,16}$', placeholder: 'GDN', example: 'GDN' }] },
  { id: 'capsules', path: '/capsules', blurb: 'Time capsules. Add due=1 for those that can open now.', params: [], query: ['due', 'limit'], tryQuery: {} },
  { id: 'account', path: '/account/{address}', blurb: 'Balance, nonce and counters for one account.', params: [{ name: 'address', label: 'address', kind: 'text', pattern: ADDRESS_RE, placeholder: 'tz1… or pca1…', example: '' }] },
]);

/** A route + the path-parameter values typed -> { path, query, errors }. */
export function buildRoute(route, values = {}) {
  const errors = {};
  let path = route.path;
  for (const p of route.params || []) {
    const raw = String(values[p.name] ?? '').trim();
    if (!raw) {
      errors[p.name] = 'required';
      continue;
    }
    if (p.kind === 'integer') {
      if (!INT_RE.test(raw) || !Number.isSafeInteger(Number(raw)) || Number(raw) < (p.min ?? 0)) {
        errors[p.name] = `a whole number, ${p.min ?? 0} or more`;
        continue;
      }
    } else if (!matches(regexOf(p.pattern), raw)) {
      errors[p.name] = p.name === 'address' ? 'an address: tz1…, tz2…, pca1… or pcp1…' : `must match ${p.pattern}`;
      continue;
    }
    path = path.replace(`{${p.name}}`, encodeURIComponent(raw));
  }
  return { path, query: (route.params || []).length ? {} : { ...(route.tryQuery || {}) }, errors, ok: !Object.keys(errors).length };
}

/**
 * The GET (or POST /tx/digest) route that answers the same question as a
 * read-only tool, for browsers that cannot read /mcp. `dropped` names the
 * arguments the route cannot take; `note` says how its reply differs.
 */
export function twinFor(name, args = {}) {
  const a = isObj(args) ? args : {};
  const has = (k) => a[k] !== undefined && a[k] !== null && a[k] !== '';
  switch (name) {
    case 'chain_status':
      return { method: 'GET', path: '/status', query: {}, dropped: [], note: '' };
    case 'chain_feed':
      return { method: 'GET', path: '/feed', query: { limit: has('limit') ? a.limit : 10, before: a.before }, dropped: has('channel') ? ['channel'] : [], note: 'GET /feed has no channel filter, and its reply is not wrapped as an MCP result.' };
    case 'chain_read_block':
      return { method: 'GET', path: has('height') ? `/block/${encodeURIComponent(String(a.height))}` : '/block/latest', query: {}, dropped: [], note: '' };
    case 'chain_read_account':
      return has('address') ? { method: 'GET', path: `/account/${encodeURIComponent(String(a.address))}`, query: {}, dropped: [], note: '' } : null;
    case 'chain_tx_digest':
      return has('tx') ? { method: 'POST', path: '/tx/digest', query: {}, body: a.tx, dropped: [], note: 'POST /tx/digest only computes a digest from the tx you describe; it posts nothing.' } : null;
    case 'editions_list':
      return { method: 'GET', path: '/editions', query: {}, dropped: [], note: '' };
    case 'station_get':
      return { method: 'GET', path: has('code') ? `/station/${encodeURIComponent(String(a.code))}` : '/stations', query: {}, dropped: [], note: '' };
    case 'capsules_due':
      return { method: 'GET', path: '/capsules', query: { due: 1, limit: a.limit }, dropped: [], note: '' };
    case 'chain_duties':
      return { method: 'GET', path: '/duties', query: { bot: a.bot, address: a.address }, dropped: [], note: '' };
    case 'chain_daily_lot':
      return { method: 'GET', path: has('lot') ? `/daily/${encodeURIComponent(String(a.lot))}` : '/daily', query: {}, dropped: [], note: '' };
    case 'nm_ledger':
      return { method: 'GET', path: '/nm/ledger', query: { after: a.after, limit: a.limit }, dropped: [], note: 'The MCP tool also adds status and copies_left to the first page; GET /nm/ledger does not.' };
    case 'nm_note':
      return has('serial') ? { method: 'GET', path: `/nm/note/${encodeURIComponent(String(a.serial))}`, query: {}, dropped: [], note: 'GET /nm/note does not include glyph_svg; the MCP tool does unless svg is false.' } : null;
    default:
      return null;
  }
}

export const twinLabel = (twin) => `${twin.method} ${twin.path}${queryString(twin.query)}`;

// ---------------------------------------------------------------- results

/** A tools/call result -> { isError, json, text }. */
export function describeCall(result) {
  if (!isObj(result)) throw new PgError('parse', 'tools/call: the reply had no result');
  const text = Array.isArray(result.content)
    ? result.content.filter((c) => isObj(c) && c.type === 'text' && typeof c.text === 'string').map((c) => c.text).join('\n')
    : '';
  let json;
  if (isObj(result.structuredContent)) json = result.structuredContent;
  else if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = undefined;
    }
  }
  return { isError: result.isError === true, json, text };
}

/** A value -> { text, shown, total, truncated } for a result box. */
export function formatResult(value, max = DISPLAY_CHARS) {
  let text;
  if (typeof value === 'string') text = value;
  else {
    try {
      text = JSON.stringify(value, null, 2);
    } catch {
      text = String(value);
    }
  }
  text = cleanBlock(text === undefined ? '' : text, MAX_BODY_CHARS + 1024);
  return { text, shown: text.length > max ? text.slice(0, max) : text, total: text.length, truncated: text.length > max };
}

/** /status -> the few facts the page shows, and whether the genesis is the one it was built for. */
export function summarizeStatus(json, expectedGenesis = '') {
  if (!isObj(json)) return null;
  const genesis = typeof json.genesis_hash === 'string' && /^[0-9a-f]{64}$/.test(json.genesis_hash) ? json.genesis_hash : '';
  const house = typeof json.house === 'string' && /^(?:tz[1-4]|KT1|pc[ap]1)[1-9A-HJ-NP-Za-km-z]{20,60}$/.test(json.house) ? json.house : '';
  return {
    chainId: cleanText(json.chain_id, 40),
    height: nat(json.height) ?? null,
    genesis12: genesis.slice(0, 12),
    house,
    genesis: !genesis ? 'unknown' : !expectedGenesis ? 'unpinned' : genesis === expectedGenesis ? 'match' : 'changed',
    mayReset: json.may_reset === true,
  };
}

/** What the status line says after discovery. `d` is what client.discover returned. */
export function discoveryMessage(d, { pinnedAt = '' } = {}) {
  const n = d.tools.length;
  const at = pinnedAt ? `, captured ${pinnedAt}` : '';
  switch (d.reason) {
    case '': {
      const df = d.diff;
      if (!df || df.same) return `tools/list read from the devnet just now: ${n} tools, the same as the pinned list.`;
      const bits = [];
      if (df.added.length) bits.push(`${df.added.length} new (${df.added.join(', ')}): classified conservatively, so no Run unless the tool is a known reader`);
      if (df.removed.length) bits.push(`${df.removed.length} no longer served (${df.removed.join(', ')})`);
      if (df.changed.length) bits.push(`${df.changed.length} changed (${df.changed.join(', ')})`);
      return `tools/list read from the devnet just now: ${n} tools, and it differs from the pinned list: ${bits.join('; ')}.`;
    }
    case 'blocked':
      return `This browser cannot read /mcp: the devnet sends no CORS headers on /mcp, on purpose, so web pages cannot drive its keyless writes. Showing the ${n} tools pinned from a local run of the devnet Worker${at}. Read-only tools run through their matching GET routes, which do allow browsers; each result names its route.`;
    case 'unreachable':
      return `devnet unreachable. It may be restarting or paused. Showing the ${n} tools pinned from a local run of the devnet Worker${at}; Run will say so if it still cannot connect.`;
    case 'rate':
      return `The devnet said slow down (HTTP 429) before it listed its tools. Showing the ${n} tools pinned from a local run of the devnet Worker${at}. Try again in a minute.`;
    case 'rpc':
      return `The devnet answered tools/list with an error${d.error && d.error.message ? ` (${d.error.message})` : ''}. Showing the ${n} tools pinned from a local run of the devnet Worker${at}.`;
    default:
      return `The devnet did not return a usable tools/list${d.error && d.error.message ? ` (${d.error.message})` : ''}. Showing the ${n} tools pinned from a local run of the devnet Worker${at}.`;
  }
}

/** A PgError -> a plain sentence for the result box. */
export function friendlyError(e) {
  const err = asPgError(e);
  switch (err.kind) {
    case 'rate':
      return `The devnet said slow down (HTTP 429): reads are limited per IP.${err.retryAfter ? ` Try again in ${err.retryAfter} s.` : ' Try again in about a minute.'}`;
    case 'timeout':
      return `No answer within ${TIMEOUT_MS / 1000} s. The devnet may be restarting or paused.`;
    case 'network':
      return 'devnet unreachable. It may be restarting or paused, or this browser blocked the request.';
    case 'size':
      return 'The reply was larger than this page reads (512 KiB). Use curl for it.';
    case 'refused':
      return err.message;
    default:
      return err.message || 'The request failed.';
  }
}

// ---------------------------------------------------------------- client

/**
 * A client for one devnet. `fetch` and the timers are injectable for tests.
 * transport is 'mcp' until a read shows the browser cannot use /mcp, then 'rest'.
 */
export function createClient(opts = {}) {
  const base = String(opts.base || '').replace(/\/+$/, '');
  const mcpUrl = opts.mcp || `${base}/mcp`;
  const f = opts.fetch || ((...a) => globalThis.fetch(...a));
  const timeoutMs = opts.timeoutMs ?? TIMEOUT_MS;
  const maxChars = opts.maxChars ?? MAX_BODY_CHARS;
  const setT = opts.setTimeout || ((...a) => globalThis.setTimeout(...a));
  const clearT = opts.clearTimeout || ((...a) => globalThis.clearTimeout(...a));
  const now = opts.now || (() => Date.now());
  let transport = 'mcp';
  let nextId = 1;

  async function http(url, init) {
    const ctrl = typeof AbortController === 'function' ? new AbortController() : null;
    const timer = setT(() => ctrl && ctrl.abort(), timeoutMs);
    try {
      let res;
      try {
        res = await f(url, { ...init, signal: ctrl ? ctrl.signal : undefined, credentials: 'omit', cache: 'no-store', referrerPolicy: 'no-referrer' });
      } catch (e) {
        if (e && e.name === 'AbortError') throw new PgError('timeout', 'no answer in time');
        throw new PgError('network', 'the request did not complete');
      }
      if (!res) throw new PgError('network', 'no response');
      let text;
      try {
        text = await res.text();
      } catch (e) {
        if (e && e.name === 'AbortError') throw new PgError('timeout', 'no answer in time');
        throw new PgError('network', 'the reply was cut off');
      }
      if (text.length > maxChars) throw new PgError('size', 'the reply was too large');
      if (res.status === 429) {
        const ra = Number.parseInt(res.headers && typeof res.headers.get === 'function' ? res.headers.get('retry-after') || '' : '', 10);
        throw new PgError('rate', 'slow down', { status: 429, retryAfter: Number.isFinite(ra) && ra > 0 && ra < 3600 ? ra : 0 });
      }
      return { status: res.status, ok: res.ok, text };
    } finally {
      clearT(timer);
    }
  }

  const tryJson = (text) => {
    try {
      return JSON.parse(text);
    } catch {
      return undefined;
    }
  };

  async function rpc(method, params) {
    const body = { jsonrpc: '2.0', id: nextId++, method };
    if (params !== undefined) body.params = params;
    const r = await http(mcpUrl, { method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream' }, body: JSON.stringify(body) });
    const json = tryJson(r.text);
    if (json === undefined) throw new PgError(r.ok ? 'parse' : 'http', r.ok ? 'the reply was not JSON' : `HTTP ${r.status}`, { status: r.status });
    if (isObj(json) && isObj(json.error)) throw new PgError('rpc', cleanText(json.error.message, 160) || 'the server returned an error', { code: json.error.code, status: r.status });
    if (!r.ok) throw new PgError('http', `HTTP ${r.status}`, { status: r.status });
    return json;
  }

  async function get(path, query = {}) {
    const started = now();
    const r = await http(`${base}${path}${queryString(query)}`, { method: 'GET', headers: { accept: 'application/json' } });
    return { status: r.status, ok: r.ok, json: tryJson(r.text), text: r.text, ms: now() - started };
  }

  async function post(path, body) {
    const started = now();
    const r = await http(`${base}${path}`, { method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json' }, body: JSON.stringify(body) });
    return { status: r.status, ok: r.ok, json: tryJson(r.text), text: r.text, ms: now() - started };
  }

  async function probe() {
    try {
      const r = await get('/status');
      return { ok: r.ok, status: r.status, json: r.json };
    } catch (e) {
      return { ok: false, error: asPgError(e) };
    }
  }

  async function listTools() {
    return parseToolsList(await rpc('tools/list'));
  }

  async function callTool(name, args) {
    const started = now();
    const reply = await rpc('tools/call', { name, arguments: args });
    if (!isObj(reply) || !isObj(reply.result)) throw new PgError('parse', 'tools/call: the reply had no result');
    return { via: 'mcp', ...describeCall(reply.result), ms: now() - started };
  }

  /**
   * Try tools/list once. Live list on success; otherwise the pinned list and
   * the reason: 'blocked' (the browser cannot read /mcp but the devnet
   * answers GET), 'unreachable', 'rate', 'rpc', 'http' or 'parse'.
   */
  async function discover(pinned = []) {
    try {
      const { tools, dropped } = await listTools();
      transport = 'mcp';
      return { mode: 'live', transport, tools, dropped, diff: diffTools(pinned, tools), reason: '', error: null };
    } catch (e) {
      const err = asPgError(e);
      let reason = err.kind;
      if (err.kind === 'network' || err.kind === 'timeout' || err.kind === 'size') {
        const p = await probe();
        reason = p.ok ? 'blocked' : 'unreachable';
        transport = 'rest';
      } else if (err.kind === 'rate') {
        transport = 'mcp';
      } else {
        transport = 'rest';
      }
      return { mode: 'fixture', transport, tools: pinned, dropped: 0, diff: null, reason, error: err };
    }
  }

  /**
   * Run a read-only tool. Refuses anything classifyTool does not call "read",
   * before any request is made. Over MCP when it works, else the REST twin.
   */
  async function run(tool, args = {}) {
    const cls = classifyTool(tool);
    if (!cls.run) throw new PgError('refused', `${isObj(tool) && tool.name ? tool.name : 'this tool'} is not read-only here: this page never runs it`);
    if (transport === 'mcp') {
      try {
        return await callTool(tool.name, args);
      } catch (e) {
        const err = asPgError(e);
        if (err.kind !== 'network' && err.kind !== 'timeout') throw err;
        const p = await probe();
        if (!p.ok) throw err;
        transport = 'rest';
      }
    }
    const twin = twinFor(tool.name, args);
    if (!twin) throw new PgError('refused', `${tool.name} has no GET route to run through when /mcp is not readable here; use the curl snippet`);
    const r = twin.method === 'POST' ? await post(twin.path, twin.body) : await get(twin.path, twin.query);
    return { via: 'rest', twin, isError: !r.ok, status: r.status, json: r.json, text: r.text, ms: r.ms };
  }

  /** Try a REST route (a GET). */
  async function runRoute(route, values = {}) {
    const built = buildRoute(route, values);
    if (!built.ok) throw new PgError('refused', Object.values(built.errors).join('; '));
    const r = await get(built.path, built.query);
    return { built, ...r };
  }

  return {
    get transport() {
      return transport;
    },
    set transport(t) {
      transport = t === 'rest' ? 'rest' : 'mcp';
    },
    base,
    mcpUrl,
    listTools,
    callTool,
    discover,
    run,
    runRoute,
    get,
    post,
    probe,
  };
}
