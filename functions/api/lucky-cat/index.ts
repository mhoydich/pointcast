import { handleLuckyCatManifest, LUCKY_CAT_OPTIONS } from '../../_lib/lucky-cat.ts';
export const onRequestOptions = LUCKY_CAT_OPTIONS;
export const onRequestGet: PagesFunction = () => handleLuckyCatManifest();
