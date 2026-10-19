import { handleSunsetDownsActions, SUNSET_DOWNS_OPTIONS, type SunsetDownsEnv } from '../../_lib/sunset-downs.ts';
export const onRequestOptions = SUNSET_DOWNS_OPTIONS;
export const onRequestPost: PagesFunction<SunsetDownsEnv> = ({ request, env }) => handleSunsetDownsActions(request, env);
