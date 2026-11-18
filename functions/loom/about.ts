// Until the cover is published, send visitors to the existing Loom guide.
// An About asset that ships later takes precedence over this fallback.
const handle: PagesFunction = async ({ next }) => {
  const response = await next();
  if (response.status !== 404) return response;
  return new Response(null, {
    status: 302,
    headers: { Location: '/loom/hello', 'Cache-Control': 'no-store' },
  });
};

export const onRequestGet = handle;
export const onRequestHead = handle;
