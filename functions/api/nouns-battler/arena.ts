import { runArena } from '../../_lib/nouns-battler-arena.ts';
export const onRequest: PagesFunction = ({ request }) => runArena(request);
