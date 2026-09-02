import contracts from '../../../src/data/contracts.json';
import { readProfileHandle } from '../../../src/lib/profile-object.mjs';

interface RouteParams { handle?: string }
const escapeXml = (value: string) => value.replace(/[<>&'"]/g, (character) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[character] || character));

export const onRequestGet: PagesFunction<Cloudflare.Env> = async ({ params }) => {
  const handle = String((params as RouteParams).handle || '').replace(/\.svg$/, '').replace(/^@/, '').toLowerCase();
  if (!/^[a-z0-9-]{3,24}$/.test(handle)) return new Response('Not found', { status: 404 });
  try {
    const profile = await readProfileHandle(contracts.profile_objects.mainnet, handle);
    if (!profile) return new Response('Not found', { status: 404 });
    return new Response(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><rect width="1200" height="630" fill="#f3efe6"/><path d="M0 0H630V630H0Z" fill="#185fa5"/><image href="https://noun.pics/${profile.page.nounSeed}.svg" x="55" y="55" width="520" height="520"/><text x="690" y="94" fill="#185fa5" font-family="monospace" font-size="22">POINTCAST PROFILE OBJECT</text><text x="690" y="310" fill="#181b1e" font-family="Arial" font-size="72">${escapeXml(profile.page.name || `@${handle}`)}</text><text x="690" y="390" fill="#185fa5" font-family="monospace" font-size="38">@${escapeXml(handle)}</text><text x="690" y="548" fill="#181b1e" font-family="monospace" font-size="18">TEZOS · OWNED · NOUN ${profile.page.nounSeed}</text></svg>`, { headers: { 'Content-Type': 'image/svg+xml; charset=utf-8', 'Cache-Control': 'public, max-age=30, s-maxage=60' } });
  } catch {
    return new Response('TzKT unavailable', { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
};
