import contracts from '../../src/data/contracts.json';
import { listOwnerKennelDogs, listOwnerSeals, readProfileHandle } from '../../src/lib/profile-object.mjs';

interface RouteParams { handle?: string }

const escapeHtml = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[character] || character));
import kennelSeries from '../../src/data/kennel-club-september-sitting.json';
// Pinata's gateway answers where the public ipfs.io gateway times out (2026-09-02).
const ipfs = (value: string) => value.startsWith('ipfs://') ? `https://gateway.pinata.cloud/ipfs/${value.slice(7).replace(/^ipfs\//, '')}` : value;
// Kennel Club dogs render from the site's own plates; the chain thumbnail is the fallback.
const kennelPlate = (tokenId: number, fallback: string) => {
  const sitting = (kennelSeries as any).sittings?.find((row: any) => row.tokenId === tokenId);
  return sitting?.slug ? `/images/kennel-club/september-sitting/${sitting.slug}.webp` : ipfs(fallback);
};

function unclaimed(handle: string): Response {
  const safe = escapeHtml(handle);
  return new Response(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>@${safe} is unclaimed | PointCast</title><meta name="robots" content="noindex"></head><body><main><p>PROFILE OBJECT · UNCLAIMED</p><h1>@${safe} is available.</h1><p>The live Tezos index has no claim for this handle.</p><a href="/me?handle=${encodeURIComponent(handle)}">Claim @${safe} →</a></main><style>body{margin:0;background:#f3efe6;color:#181b1e;font-family:Arial,sans-serif}main{width:min(720px,calc(100vw - 32px));margin:10vh auto;padding:32px;border:2px solid #185fa5;background:#fff}p,a{font-family:ui-monospace,monospace}p:first-child{font-size:11px;letter-spacing:.12em;color:#185fa5}h1{font-size:clamp(42px,9vw,86px);line-height:.94;letter-spacing:-.05em}a{display:inline-block;padding:12px 15px;background:#185fa5;color:#fff}</style></body></html>`, {
    status: 404,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=15, s-maxage=30' },
  });
}

function profileHtml(profile: any, dogs: any[], seals: any[]): string {
  const handle = escapeHtml(profile.handle);
  const name = escapeHtml(profile.page.name || `@${profile.handle}`);
  const description = escapeHtml(profile.page.bio || `Owned PointCast profile object @${profile.handle}.`);
  const links = profile.links.map((link: any) => link.url
    ? `<li><a href="${escapeHtml(link.url)}" rel="me noopener">${escapeHtml(link.label || link.url)}</a></li>`
    : `<li>${escapeHtml(link.label)}</li>`).join('');
  const dogRows = dogs.map((dog) => `<li><a href="${escapeHtml(dog.objktUrl)}" rel="noopener"><img src="${escapeHtml(kennelPlate(dog.tokenId, dog.image))}" loading="lazy" alt="${escapeHtml(dog.name)}"><span>${escapeHtml(dog.name)}</span></a></li>`).join('') || '<li>None held by this owner.</li>';
  const sealRows = seals.map((seal) => `<li class="${seal.revoked ? 'revoked' : ''}"><a href="${escapeHtml(seal.tzktUrl)}" rel="noopener"><strong>${escapeHtml(seal.kind)}</strong><span>${escapeHtml(seal.evidence || 'On-chain attestation')}</span><small>${seal.revoked ? 'revoked' : `issued ${escapeHtml(seal.issuedAt.slice(0, 10))}`}</small></a></li>`).join('') || '<li>None held by this owner.</li>';
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>@${handle} | PointCast</title><meta name="description" content="${description}"><link rel="canonical" href="https://pointcast.xyz/p/${handle}"><meta property="og:title" content="@${handle} | PointCast"><meta property="og:description" content="${description}"><meta property="og:image" content="https://pointcast.xyz/p/og/${handle}.svg"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="https://pointcast.xyz/p/og/${handle}.svg"></head><body><main><nav><a href="/">PointCast</a> / <a href="/p">Profiles</a> / @${handle}<a class="json" href="/p/${handle}.json">JSON</a></nav><article><header><p>PROFILE OBJECT · TOKEN ${profile.tokenId} · OWNED</p><h1>${name}</h1><span>@${handle}</span></header><figure><img src="${escapeHtml(profile.noun)}" alt="Noun ${profile.page.nounSeed} for @${handle}"><figcaption>NOUN SEED ${profile.page.nounSeed}</figcaption></figure><section><p class="bio">${description || 'This owner has not written a bio yet.'}</p><ul>${links}</ul></section></article><section class="shelf"><header><p>PUBLIC CHAIN SHELF</p><h2>Dogs + seals</h2></header><div><section><h3>Kennel Club dogs</h3><ul class="dogs">${dogRows}</ul></section><section><h3>Soulbound seals</h3><ul class="seals">${sealRows}</ul></section></div></section><footer><a href="https://tzkt.io/${escapeHtml(profile.owner)}" rel="noopener">Owner ${escapeHtml(profile.owner)}</a><a href="https://tzkt.io/${escapeHtml(profile.contract)}/tokens/${profile.tokenId}" rel="noopener">Profile object receipt</a><p>The profile object can move. Attested seals do not move with it.</p></footer></main><style>body{margin:0;background:#f3efe6;color:#181b1e;font-family:Arial,sans-serif}main{--blue:#185fa5;width:min(980px,calc(100vw - 24px));margin:auto;padding:18px 0 90px}nav,header p,figcaption,h3,small,footer{font-family:ui-monospace,monospace;text-transform:uppercase;letter-spacing:.08em}nav{padding:12px 0;border-bottom:2px solid var(--blue);font-size:10px}.json{float:right}a{color:var(--blue)}article{display:grid;grid-template-columns:minmax(250px,.8fr) minmax(0,1.2fr);border:1.5px solid var(--blue);background:#f7fbff}article>header{grid-column:1/-1;padding:18px;border-bottom:1.5px solid var(--blue)}header p,header span{margin:0;color:var(--blue);font-size:10px}h1{margin:8px 0 4px;font-size:clamp(44px,8vw,94px);line-height:.9;letter-spacing:-.06em}figure{margin:0;padding:16px;background:var(--blue)}figure img{width:100%;background:#fff}figcaption{margin-top:8px;color:#fff;font-size:9px}article>section{padding:clamp(22px,5vw,54px)}.bio{font-size:clamp(18px,2.4vw,27px);line-height:1.35}ul{padding:0;list-style:none}article li{margin-top:8px;padding:11px;border:1px solid var(--blue);background:#fff}.shelf{border:1.5px solid var(--blue);border-top:0}.shelf>header{padding:16px;border-bottom:1px solid var(--blue)}h2{margin:4px 0;font-size:34px}.shelf>div{display:grid;grid-template-columns:1fr 1fr}.shelf section{padding:16px}.shelf section+section{border-left:1px solid var(--blue)}h3{color:var(--blue);font-size:10px}.dogs{display:grid;grid-template-columns:repeat(auto-fill,minmax(100px,1fr));gap:8px}.dogs img{width:100%;aspect-ratio:4/5;object-fit:cover}.dogs a,.seals a{display:grid;gap:5px;font-size:11px}.seals li{margin-bottom:7px;padding:10px;border:1px solid #7152a4}.revoked{opacity:.55}footer{display:grid;gap:8px;padding:14px;border:1.5px solid var(--blue);border-top:0;font-size:9px;text-transform:none}@media(max-width:700px){article,.shelf>div{grid-template-columns:1fr}.shelf section+section{border-left:0;border-top:1px solid var(--blue)}}</style></body></html>`;
}

export const onRequestGet: PagesFunction<Cloudflare.Env> = async ({ params }) => {
  const raw = String((params as RouteParams).handle || '');
  const json = raw.endsWith('.json');
  const handle = raw.replace(/\.json$/, '').replace(/^@/, '').toLowerCase();
  if (!/^[a-z0-9-]{3,24}$/.test(handle)) return json ? Response.json({ ok: false, reason: 'invalid-handle' }, { status: 404 }) : unclaimed(handle || 'handle');
  try {
    const profile = await readProfileHandle(contracts.profile_objects.mainnet, handle);
    if (!profile) return json ? Response.json({ ok: false, reason: 'unclaimed', handle }, { status: 404 }) : unclaimed(handle);
    const [dogs, seals] = await Promise.all([
      listOwnerKennelDogs(profile.owner, contracts.kennel_club.mainnet).catch(() => []),
      listOwnerSeals(profile.owner, contracts.seal_soulbound.mainnet).catch(() => []),
    ]);
    if (json) return Response.json({ ...profile, dogs, seals }, { headers: { 'Cache-Control': 'public, max-age=30, s-maxage=60', 'Access-Control-Allow-Origin': '*' } });
    return new Response(profileHtml(profile, dogs, seals), { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=30, s-maxage=60' } });
  } catch (error) {
    return Response.json({ ok: false, reason: 'tzkt-unavailable', message: error instanceof Error ? error.message : 'Profile read stopped.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
};
