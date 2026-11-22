import { handleWalletDetail } from '../../../_lib/agent-wallet-ops';
import type { AgentWalletEnv } from '../../../_lib/agent-wallets';

export const onRequestGet: PagesFunction<AgentWalletEnv, 'id'> = ({ request, env, params }) =>
  handleWalletDetail(request, env, params.id);

export const onRequestOptions: PagesFunction = () =>
  new Response(null, { status: 204, headers: { 'access-control-allow-origin': '*' } });
