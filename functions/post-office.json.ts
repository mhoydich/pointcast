import { registryResponse } from './_lib/post-office-registry.ts';

export const onRequestGet: PagesFunction<{ AUTH_DB?: D1Database }> = async ({ env }) => registryResponse(env);
