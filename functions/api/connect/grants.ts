import { handleConnect } from '../../_lib/pointcast-connect-http.ts';
import type { ConnectEnv } from '../../_lib/pointcast-connect.ts';

export const onRequest: PagesFunction<ConnectEnv> = ({ request, env }) => handleConnect(request, env, 'grants');
