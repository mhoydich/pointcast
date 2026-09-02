import { meHoldingsResponse } from './_holdings';
import type { AuthEnv } from '../auth/session';

export const onRequestGet: PagesFunction<AuthEnv> = async ({ request, env }) => (
  meHoldingsResponse(request, env)
);
