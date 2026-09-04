const verification = 'google-site-verification: googlef8cd34fe0ae765d9.html\n';

export const onRequestGet: PagesFunction = async () => new Response(verification, {
  headers: { 'Content-Type': 'text/html; charset=utf-8' },
});
