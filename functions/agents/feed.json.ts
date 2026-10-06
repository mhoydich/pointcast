import { noticeResponse } from '../../src/lib/agent-notices.mjs';
export const onRequest: PagesFunction = ({ request }) => noticeResponse(request, 'feed');
