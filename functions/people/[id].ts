import { handlePublic } from '../api/me/_public.ts';
import type { MeEnv } from '../api/me/_library.ts';
export const onRequest: PagesFunction<MeEnv> = ({ request, env, params }) =>
  handlePublic(request, env, 'profile', String(params.id || ''));
