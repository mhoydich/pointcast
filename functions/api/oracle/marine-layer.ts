/**
 * GET /api/oracle/marine-layer?date=YYYY-MM-DD — The Marine Layer Oracle on Base
 * (x402 v2, Coinbase CDP, Bazaar-listed after the first settled call).
 * Logic: functions/_lib/oracle-kit.ts · spec: functions/_lib/oracles/marine-layer.ts.
 */
import { BASE_HEADERS, handleBaseOracle, type OracleEnv, type OracleOptions } from '../../_lib/oracle-kit.ts';
import { MARINE_ORACLE } from '../../_lib/oracles/marine-layer.ts';

export const handleMarineBase = (request: Request, env: OracleEnv, options: OracleOptions = {}) =>
  handleBaseOracle(MARINE_ORACLE, request, env, options);

export const onRequestOptions = async () => new Response(null, { status: 204, headers: BASE_HEADERS });
export const onRequestGet: PagesFunction<OracleEnv> = async ({ request, env }) => handleMarineBase(request, env);
