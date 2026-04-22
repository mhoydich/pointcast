/**
 * Redirect the missing-h typo from the screenshot:
 *   /ouseplants -> /houseplants
 *
 * Kept as a Pages Function instead of touching public/_redirects because that
 * file already has unrelated local edits in this working tree.
 */
export const onRequest: PagesFunction = async ({ request }) => {
  const url = new URL(request.url);
  url.pathname = '/houseplants';
  return Response.redirect(url.toString(), 301);
};
