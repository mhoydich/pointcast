import { handleImageGet, handleImagePost, type FrameEnv } from './_store.ts';
export const onRequestGet: PagesFunction<FrameEnv> = ({ request, env }) => handleImageGet(request, env);
export const onRequestPost: PagesFunction<FrameEnv> = ({ request, env }) => handleImagePost(request, env);
