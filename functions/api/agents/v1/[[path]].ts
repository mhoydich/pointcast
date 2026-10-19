import { noticeResponse, publishNotice } from '../../../../src/lib/agent-notices.mjs';
export const onRequest: PagesFunction = ({ request, params }) => {
  const path = Array.isArray(params.path) ? params.path.join('/') : params.path;
  if (path === 'events') return noticeResponse(request);
  if (!['GET', 'HEAD'].includes(request.method)) return new Response(JSON.stringify(publishNotice(null, 'rest-import')), { status: 503, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'Retry-After': '3600' } });
  return new Response('Not Found', { status: 404 });
};
