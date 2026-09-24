import type { OracleSpec } from '../oracle-kit.ts';
import {
  answerOracle,
  ORACLE_LIMIT_MAX,
  ORACLE_Q_CAP,
  ORACLE_ROOM,
  oracleBodyFromParams,
  parseOracleQuery,
  previewOracle,
  type OracleQuery,
} from '../../../src/lib/paddle-oracle.ts';

/** The Paddle Oracle: the Paddle Register, one sourced answer per cent. */
export const PADDLE_ORACLE: OracleSpec<OracleQuery> = {
  id: 'paddles',
  action: 'oracle',
  name: 'Paddle Oracle',
  room: ORACLE_ROOM,
  description: 'The Paddle Oracle: ask the PointCast Paddle Register (92 pickleball paddles, 2025-2026) one question and get up to 5 sourced records: specs, USAP/UPA-A legality, core, launch timeline, lab links, changes. Deterministic search, no LLM. Every fact carries its source URL.',
  tags: ['pickleball', 'oracle', 'reference-data', 'sourced', 'sports'],
  contributor: {
    name: 'paddle-register',
    address: null,
    terms: 'Network half accrues to the Paddle Register commons until field-report contributors have payout addresses.',
  },
  parse: parseOracleQuery,
  fromParams: oracleBodyFromParams,
  answer: async (query) => answerOracle(query),
  preview: (query) => previewOracle(query),
  discovery: {
    input: { q: 'control paddle for a 4.0 player', maxPrice: '200', usap: 'true' },
    inputSchema: {
      type: 'object',
      properties: {
        q: { type: 'string', maxLength: ORACLE_Q_CAP, description: 'Free-text question: a paddle name, a pro, or words like control, power, spin, foam, elongated.' },
        maxPrice: { type: 'string', pattern: '^\\d+(\\.\\d+)?$', description: 'Highest list price in USD (1-2000).' },
        build: { type: 'string', enum: ['foam', 'hybrid', 'poly', 'rib'], description: 'Core build.' },
        thicknessMm: { type: 'string', pattern: '^\\d+(\\.\\d+)?$', description: 'Core thickness in mm (8-25), e.g. 16.' },
        usap: { type: 'string', enum: ['true', 'false'], description: 'true = only paddles on the USA Pickleball approved list.' },
        year: { type: 'string', pattern: '^20\\d\\d$', description: 'Launch year.' },
        limit: { type: 'string', pattern: '^[1-5]$', description: `Records to return (1-${ORACLE_LIMIT_MAX}, default 3).` },
      },
      additionalProperties: false,
    },
    output: {
      example: { ok: true, oracle: 'paddles', result: { answer: { answer: '23 paddles in the register match. Best 3: …', matched: 23, paddles: [{ id: 'franklin-c45-aurelius', listPriceUsd: 229.99, sources: ['https://…'] }] }, attestation: { signed: true } } },
      schema: {
        type: 'object',
        properties: {
          ok: { type: 'boolean' },
          oracle: { type: 'string' },
          result: {
            type: 'object',
            properties: {
              answer: { type: 'object', properties: { answer: { type: 'string' }, matched: { type: 'integer' }, paddles: { type: 'array', items: { type: 'object' } } }, required: ['answer', 'matched', 'paddles'] },
              attestation: { type: 'object' },
            },
            required: ['answer', 'attestation'],
          },
        },
        required: ['ok', 'result'],
      },
    },
  },
};
