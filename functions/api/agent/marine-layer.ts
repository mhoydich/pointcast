/**
 * /api/agent/marine-layer — The Marine Layer Oracle on the Etherlink rail.
 * POST {date?} → 0.01 USDC → signed burn-off verdict for El Segundo. GET ?preview=1 is free.
 * Logic: functions/_lib/oracle-kit.ts · spec: functions/_lib/oracles/marine-layer.ts.
 */
import { handleEtherlinkGet, handleEtherlinkOracle, PAID_ACTION_HEADERS, type OracleEnv, type OracleOptions } from '../../_lib/oracle-kit.ts';
import { MARINE_ORACLE } from '../../_lib/oracles/marine-layer.ts';

export const handleAgentMarine = (request: Request, env: OracleEnv, options: OracleOptions = {}) =>
  handleEtherlinkOracle(MARINE_ORACLE, request, env, options);
export const handleMarineGet = (request: Request, env: OracleEnv, options: OracleOptions = {}) =>
  handleEtherlinkGet(MARINE_ORACLE, request, env, options);

export const onRequestOptions = async () => new Response(null, { status: 204, headers: PAID_ACTION_HEADERS });
export const onRequestPost: PagesFunction<OracleEnv> = async ({ request, env }) => handleAgentMarine(request, env);
export const onRequestGet: PagesFunction<OracleEnv> = async ({ request, env }) => handleMarineGet(request, env);
