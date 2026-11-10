// Layer: paddles — the Paddle Register (one gear record per paddle line).
import { loadTs } from '../_ts.mjs';

export const layer = {
  id: 'paddles',
  name: 'Paddle Register',
  description: 'Pickleball paddle lines with launch dates, builds, list prices, approval status and public source links.',
  types: ['gear'],
  inline: true,
  data: 'https://pointcast.xyz/paddles.json',
  page: 'https://pointcast.xyz/paddles',
  license: 'CC0-1.0',
  updated: '2026-09-21',
  source: { url: 'https://pointcast.xyz/paddles.json', checked: '2026-09-21', label: 'derived', title: 'Paddle Register' },
  notes: 'One gear record per paddle in the register (92 paddles at build time; the exact count is in counts.byLayer.paddles). Launch dates are on-sale or store-listing dates, not review dates. Gear has no location. "approved" means the register lists the paddle as USA Pickleball approved; "delisted" means the register logged a delisting with no later approval.',
};

const isHttps = (u) => typeof u === 'string' && /^https:\/\//.test(u);
const host = (u) => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return ''; } };
const money = (n) => (Number.isInteger(n) ? `$${n}` : `$${n.toFixed(2)}`);

export async function records(ctx) {
  const { site, helpers } = ctx;
  const { rid, slug, src, summary } = helpers;
  const mod = await loadTs('src/lib/paddle-register.ts');
  const register = ctx.readJson(ctx.resolve('src/data/paddle-register.json'));
  const asOf = register.meta?.asOf;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(asOf || '')) throw new Error('paddle-register.json meta.asOf missing');

  const lastChange = {};
  for (const c of [...mod.CHANGES].sort((a, b) => a.date.localeCompare(b.date))) {
    if (c.paddle && (c.kind === 'approved' || c.kind === 'delisted')) lastChange[c.paddle] = c.kind;
  }

  return mod.PADDLES.map((p) => {
    const checked = p.checked || p.asOf || asOf;
    const own = new Set([host(p.productUrl)].filter(Boolean));
    const urls = [];
    const push = (u) => { if (isHttps(u) && !urls.includes(u)) urls.push(u); };
    push(p.productUrl);
    (p.sources || []).forEach(push);
    push(p.reg?.usapSource); push(p.reg?.upaaSource); push(p.core?.source);
    p.variants.forEach((v) => push(v.specSource));
    p.timeline.forEach((t) => push(t.source));
    const brandHost = slug(p.brand).replace(/-/g, '');
    const label = (u) => {
      const h = host(u);
      if (h.endsWith('usapickleball.org')) return 'fact';
      if (own.has(h) || h.replace(/[^a-z0-9]/g, '').includes(brandHost)) return 'listing';
      return 'reported';
    };
    const source = urls.map((u) => src(u, checked, label(u)));

    const bits = [`${p.brand} ${p.model}, a ${p.build} build paddle${p.thickness ? ` at ${p.thickness}` : ''}`];
    if (p.msrp != null) bits.push(`list price ${money(p.msrp)}`);
    if (p.reg?.lifecycle) bits.push(`lifecycle: ${p.reg.lifecycle}`);
    if (p.dateLabel) bits.push(`on sale: ${p.dateLabel}`);
    const tags = ['pickleball', 'paddle', slug(p.brand)];
    for (const s of String(p.shapes || '').split(/[\/,]/).map((x) => slug(x)).filter((x) => x && x.length < 20)) tags.push(s);
    if (p.reg?.usap === 'yes') tags.push('approved');
    if (lastChange[p.id] === 'delisted') tags.push('delisted');

    return {
      id: rid(site.host, 'gear', p.id),
      type: 'gear',
      name: `${p.brand} ${p.model}`,
      summary: summary(`${bits.join('; ')}.`),
      site: site.host,
      url: `https://pointcast.xyz/paddles/${p.id}`,
      data: `https://pointcast.xyz/paddles/${p.id}.json`,
      source,
      updated: checked,
      license: 'CC0-1.0',
      tags: [...new Set(tags)],
      layer: 'paddles',
    };
  });
}
