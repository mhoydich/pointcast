import {handleWaves} from '../../src/lib/waves/service.mjs';
export const onRequest: PagesFunction = context => handleWaves(context.request,{cache:caches.default});
