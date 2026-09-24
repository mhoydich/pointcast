import { handleOwner, type FrameEnv } from './_store.ts';
export const onRequestPost: PagesFunction<FrameEnv> = ({ request, env }) => handleOwner(request, env);
