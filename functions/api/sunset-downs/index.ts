import { handleSunsetDownsManifest, SUNSET_DOWNS_OPTIONS, type SunsetDownsEnv } from '../../_lib/sunset-downs.ts';
export const onRequestOptions = SUNSET_DOWNS_OPTIONS;
export const onRequestGet: PagesFunction<SunsetDownsEnv> = ({ request, env }) => handleSunsetDownsManifest(request, env);
