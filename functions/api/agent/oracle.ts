/**
 * /api/agent/oracle — The Paddle Oracle on the Etherlink rail. One cent, one sourced answer.
 * All logic lives in functions/_lib/oracle-kit.ts; the spec is functions/_lib/oracles/paddles.ts.
 * The same answers on Base (Bazaar-listed): GET /api/oracle/paddles.
 */
import { handleEtherlinkGet, handleEtherlinkOracle, PAID_ACTION_HEADERS, type OracleEnv, type OracleOptions } from '../../_lib/oracle-kit.ts';
import { PADDLE_ORACLE } from '../../_lib/oracles/paddles.ts';

export const handleAgentOracle = (request: Request, env: OracleEnv, options: OracleOptions = {}) =>
  handleEtherlinkOracle(PADDLE_ORACLE, request, env, options);

export const handleOracleGet = (request: Request, env: OracleEnv, options: OracleOptions = {}) =>
  handleEtherlinkGet(PADDLE_ORACLE, request, env, options);

export const onRequestOptions = async () => new Response(null, { status: 204, headers: PAID_ACTION_HEADERS });
export const onRequestPost: PagesFunction<OracleEnv> = async ({ request, env }) => handleAgentOracle(request, env);
export const onRequestGet: PagesFunction<OracleEnv> = async ({ request, env }) => handleOracleGet(request, env);
