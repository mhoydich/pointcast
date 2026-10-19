import { handle } from '../../../src/lib/observatory/service.mjs';
export const onRequest: PagesFunction = (context) => handle(context.request, typeof context.params.topic === 'string' ? context.params.topic : '');
