import { handleLuckyCatProfile, LUCKY_CAT_OPTIONS, type LuckyCatEnv } from '../../_lib/lucky-cat.ts';
export const onRequestOptions = LUCKY_CAT_OPTIONS;
export const onRequestGet: PagesFunction<LuckyCatEnv> = ({ request, env }) => handleLuckyCatProfile(request, env);
