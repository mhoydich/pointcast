/** /loom/noun — the picture for the Loom's "noun" magic word. Logic: src/lib/loom/noun-route.mjs */
import { serveNoun } from '../../src/lib/loom/noun-route.mjs';

export const onRequest: PagesFunction = async ({ request }) => serveNoun(request);
