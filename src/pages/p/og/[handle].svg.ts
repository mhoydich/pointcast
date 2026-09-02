import type { APIRoute } from 'astro';
import contracts from '../../../data/contracts.json';
import { listProfilePages } from '../../../lib/profile-object.mjs';

export async function getStaticPaths() {
  const profiles = await listProfilePages(contracts.profile_objects.mainnet);
  return profiles.map((profile) => ({ params: { handle: profile.handle }, props: { profile } }));
}

const escapeXml = (value: string) => value.replace(/[<>&'"]/g, (character) => ({
  '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;',
}[character] || character));

export const GET: APIRoute = ({ props }) => {
  const profile = props.profile as any;
  const handle = escapeXml(profile.handle);
  const name = escapeXml(profile.page.name || `@${profile.handle}`);
  return new Response(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
    <rect width="1200" height="630" fill="#f3efe6"/>
    <path d="M0 0H630V630H0Z" fill="#185fa5"/>
    <image href="https://noun.pics/${profile.page.nounSeed}.svg" x="55" y="55" width="520" height="520"/>
    <text x="690" y="94" fill="#185fa5" font-family="ui-monospace,monospace" font-size="22" letter-spacing="3">POINTCAST PROFILE OBJECT</text>
    <text x="690" y="310" fill="#181b1e" font-family="Arial,sans-serif" font-size="72" font-weight="600">${name}</text>
    <text x="690" y="390" fill="#185fa5" font-family="ui-monospace,monospace" font-size="38">@${handle}</text>
    <text x="690" y="548" fill="#181b1e" font-family="ui-monospace,monospace" font-size="18">TEZOS · OWNED · NOUN ${profile.page.nounSeed}</text>
  </svg>`, { headers: { 'Content-Type': 'image/svg+xml; charset=utf-8', 'Cache-Control': 'public, max-age=60, s-maxage=300' } });
};
