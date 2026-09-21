import { handleCabinetStatus } from './_handlers';
import { CABINET_HEADERS, type AgentCabinetEnv } from './_shared';

export const onRequestGet: PagesFunction<AgentCabinetEnv> = ({ request, env }) => handleCabinetStatus(request, env);
export const onRequestOptions: PagesFunction = () => new Response(null, { status: 204, headers: CABINET_HEADERS });
