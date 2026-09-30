import { handleLuckyCatActions, LUCKY_CAT_OPTIONS, type LuckyCatEnv } from '../../_lib/lucky-cat.ts';
export const onRequestOptions = LUCKY_CAT_OPTIONS;
export const onRequestPost: PagesFunction<LuckyCatEnv> = ({ request, env }) => handleLuckyCatActions(request, env);
