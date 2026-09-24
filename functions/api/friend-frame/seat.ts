import { handleSeat, type FrameEnv } from './_store.ts';
export const onRequestPost: PagesFunction<FrameEnv> = ({ request, env }) => handleSeat(request, env);
