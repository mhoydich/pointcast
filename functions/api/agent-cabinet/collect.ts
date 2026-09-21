import { handleCabinetCollect } from './_handlers';
import { CABINET_HEADERS, type AgentCabinetEnv } from './_shared';

export const onRequestPost: PagesFunction<AgentCabinetEnv> = ({ request, env }) => handleCabinetCollect(request, env);
export const onRequestOptions: PagesFunction = () => new Response(null, { status: 204, headers: CABINET_HEADERS });
