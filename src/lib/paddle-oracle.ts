// The Paddle Oracle — one cent, one sourced answer from the Paddle Register.
//
// The register itself stays free at /paddles. The oracle sells the lookup:
// an agent sends a question plus optional filters, and gets back the best
// few paddle records with every source attached, under a signed x402
// receipt. No model writes the answer; it is a deterministic search over
// src/data, so the same question on the same register gives the same answer.

import { PADDLES, PADDLE_REGISTER_URL, REGISTER_STATS, changesFor, publicPaddle, type Paddle } from './paddle-register';
import type { Build } from './paddle-calendar';

export const ORACLE_ACTION = 'oracle';
export const ORACLE_ENDPOINT = 'https://pointcast.xyz/api/agent/oracle';
export const ORACLE_ROOM = 'https://pointcast.xyz/paddles/oracle';
export const ORACLE_Q_CAP = 200;
export const ORACLE_LIMIT_MAX = 5;

export interface OracleQuery {
  q: string;
  maxPrice: number | null;
  build: Build | null;
  thicknessMm: number | null;
  usap: boolean | null;
  year: number | null;
  limit: number;
}

const BUILDS = new Set<Build>(['foam', 'hybrid', 'poly', 'rib', 'unknown']);

/** Parse and bound an oracle request body. Returns an error string for anything malformed. */
export function parseOracleQuery(body: unknown): OracleQuery | string {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return 'body must be a JSON object';
  const b = body as Record<string, unknown>;
  const q = typeof b.q === 'string' ? b.q.trim() : '';
  if (q.length > ORACLE_Q_CAP) return `q must be ${ORACLE_Q_CAP} characters or fewer`;
  const num = (key: string, min: number, max: number): number | null | string => {
    if (b[key] === undefined || b[key] === null) return null;
    const n = Number(b[key]);
    return Number.isFinite(n) && n >= min && n <= max ? n : `${key} must be a number from ${min} to ${max}`;
  };
  const maxPrice = num('maxPrice', 1, 2000);
  const thicknessMm = num('thicknessMm', 8, 25);
  const year = num('year', 2020, 2030);
  const limit = num('limit', 1, ORACLE_LIMIT_MAX);
  for (const v of [maxPrice, thicknessMm, year, limit]) if (typeof v === 'string') return v;
  let build: Build | null = null;
  if (b.build !== undefined && b.build !== null) {
    if (typeof b.build !== 'string' || !BUILDS.has(b.build as Build)) return 'build must be one of foam, hybrid, poly, rib';
    build = b.build as Build;
  }
  let usap: boolean | null = null;
  if (b.usap !== undefined && b.usap !== null) {
    if (typeof b.usap !== 'boolean') return 'usap must be true or false';
    usap = b.usap;
  }
  const query: OracleQuery = {
    q, maxPrice: maxPrice as number | null, build, thicknessMm: thicknessMm as number | null,
    usap, year: year as number | null, limit: (limit as number | null) ?? 3,
  };
  if (!q && query.maxPrice == null && !build && query.thicknessMm == null && usap == null && query.year == null) {
    return 'ask something: send q and/or a filter (maxPrice, build, thicknessMm, usap, year)';
  }
  return query;
}

const words = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9.]+/g, ' ').split(' ').filter((w) => w.length > 1);
const STOP = new Set(['the', 'a', 'an', 'and', 'or', 'for', 'with', 'of', 'to', 'in', 'on', 'is', 'what', 'which', 'best', 'paddle', 'paddles', 'me', 'my', 'i', 'under', 'good']);

/** Thickness options a paddle is sold in, in mm ("14 / 16mm" → [14, 16]). */
export const thicknessesOf = (p: Paddle): number[] =>
  (p.thickness.match(/\d+(?:\.\d+)?/g) ?? []).map(Number).filter((n) => n >= 8 && n <= 25);

function passes(p: Paddle, query: OracleQuery): boolean {
  if (query.maxPrice != null && (p.msrp == null || p.msrp > query.maxPrice)) return false;
  if (query.build && p.build !== query.build) return false;
  if (query.thicknessMm != null && !thicknessesOf(p).some((t) => Math.abs(t - query.thicknessMm!) < 0.5)) return false;
  if (query.usap === true && p.reg.usap !== 'yes') return false;
  if (query.usap === false && p.reg.usap === 'yes') return false;
  if (query.year != null && p.year !== query.year) return false;
  return true;
}

function score(p: Paddle, terms: string[]): number {
  if (!terms.length) return 0;
  const name = new Set(words(`${p.brand} ${p.model} ${p.id}`));
  const people = new Set(words(p.pro));
  const body = new Set(words(`${p.take} ${p.tech} ${p.shapes} ${p.core.layers.join(' ')} ${p.core.face ?? ''}`));
  let s = 0;
  for (const t of terms) {
    if (name.has(t)) s += 5;
    else if (people.has(t)) s += 4;
    else if (body.has(t)) s += 1;
  }
  return s;
}

/** Answer one oracle query. Pure: same register + same query → same answer. */
export function answerOracle(query: OracleQuery) {
  const terms = words(query.q).filter((w) => !STOP.has(w));
  const ranked = PADDLES.filter((p) => passes(p, query))
    .map((p) => ({ p, s: score(p, terms) }))
    .filter(({ s }) => !terms.length || s > 0)
    .sort((a, b) => b.s - a.s || b.p.date.localeCompare(a.p.date));
  const top = ranked.slice(0, query.limit);
  const sentence = top.length
    ? `${ranked.length} paddle${ranked.length === 1 ? '' : 's'} in the register match. Best ${top.length === 1 ? 'match' : `${top.length}`}: ${top.map(({ p }) => `${p.brand} ${p.model}${p.msrp != null ? ` ($${p.msrp})` : ''}`).join('; ')}.`
    : 'No paddle in the register matches. Loosen a filter, or check /paddles for what the register covers.';
  return {
    answer: sentence,
    matched: ranked.length,
    paddles: top.map(({ p, s }) => ({ ...publicPaddle(p), relevance: s, changes: changesFor(p.id) })),
    query,
    register: { url: PADDLE_REGISTER_URL, paddles: REGISTER_STATS.paddles, asOf: REGISTER_STATS.asOf },
    method: 'Deterministic search over the Paddle Register: filters first, then name > pro > construction word matches, newest first on ties. No model wrote this answer. Every fact carries its own source URL.',
  };
}

/** Free preview: how many paddles would match, never which ones. */
export function previewOracle(query: OracleQuery) {
  const { matched } = answerOracle({ ...query, limit: 1 });
  return { matched, register: { paddles: REGISTER_STATS.paddles, asOf: REGISTER_STATS.asOf } };
}

/** The same question, read from URL query parameters (GET routes and the free preview). */
export function oracleBodyFromParams(p: URLSearchParams): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  for (const key of ['q', 'build']) if (p.has(key)) body[key] = p.get(key);
  for (const key of ['maxPrice', 'thicknessMm', 'year', 'limit']) if (p.has(key)) body[key] = Number(p.get(key));
  if (p.has('usap')) body.usap = p.get('usap') === 'true';
  return body;
}
