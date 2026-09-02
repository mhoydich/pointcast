import { meHoldingsResponse } from './api/me/_holdings';
import type { AuthEnv } from './api/auth/session';

export const onRequestGet: PagesFunction<AuthEnv> = async ({ request, env }) => (
  meHoldingsResponse(request, env)
);
