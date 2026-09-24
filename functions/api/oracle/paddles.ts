/**
 * GET /api/oracle/paddles — The Paddle Oracle on Base (x402 v2, Coinbase CDP facilitator,
 * listed in the x402 Bazaar after its first settled payment). Logic: functions/_lib/oracle-kit.ts.
 */
import { BASE_HEADERS, baseRoute, handleBaseOracle, type OracleEnv, type OracleOptions } from '../../_lib/oracle-kit.ts';
import { PADDLE_ORACLE } from '../../_lib/oracles/paddles.ts';

export const ORACLE_BASE_ROUTE = baseRoute(PADDLE_ORACLE);

export const handleOracleBase = (request: Request, env: OracleEnv, options: OracleOptions = {}) =>
  handleBaseOracle(PADDLE_ORACLE, request, env, options);

export const onRequestOptions = async () => new Response(null, { status: 204, headers: BASE_HEADERS });
export const onRequestGet: PagesFunction<OracleEnv> = async ({ request, env }) => handleOracleBase(request, env);
