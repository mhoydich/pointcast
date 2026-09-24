/** Every live PointCast oracle. Add a spec here and it appears on /oracles and /oracles.json. */
import type { OracleSpec } from '../oracle-kit.ts';
import { MARINE_ORACLE } from './marine-layer.ts';
import { PADDLE_ORACLE } from './paddles.ts';

export const LIVE_ORACLES = [MARINE_ORACLE, PADDLE_ORACLE] as unknown as OracleSpec<unknown>[];

export const oracleEndpoints = (spec: OracleSpec<unknown>) => ({
  etherlink: { method: 'POST', url: `https://pointcast.xyz/api/agent/${spec.id}`, network: 'eip155:42793', facilitator: 'TZ APAC (Permit2)', preview: spec.preview ? `https://pointcast.xyz/api/agent/${spec.id}?preview=1` : null },
  base: { method: 'GET', url: `https://pointcast.xyz/api/oracle/${spec.id}`, network: 'eip155:8453', facilitator: 'Coinbase CDP (x402 Bazaar)' },
});
