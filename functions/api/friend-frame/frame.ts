import { handleFrameGet, handleFrameCreate, type FrameEnv } from './_store.ts';
export const onRequestGet: PagesFunction<FrameEnv> = ({ request, env }) => handleFrameGet(request, env);
export const onRequestPost: PagesFunction<FrameEnv> = ({ request, env }) => handleFrameCreate(request, env);
