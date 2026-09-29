import { AFFILIATE_PROGRAMS, type AffiliateProgram } from '../data/affiliate-programs.ts';

export const COMMERCE_VERSION = 'commerce-hub-v3-2026-07-12';

export const CHECKOUT_POLICY = {
  mode: 'outbound-only',
  summary: 'PointCast is a discovery, merchandising, and agent-readable routing layer. PointCast does not sell, fulfill, process payment, or collect card/PII.',
  payment: 'external-checkout',
  pii: 'none-collected',
};

export type CommerceLaneSlug =
  | 'good-feels'
  | 'seltzers'
  | 'gummies'
  | 'enhancers'
  | 'pointcast-merch'
  | 'shelf'
  | 'pairings'
  | 'court'
  | 'json-api';

export const COMMERCE_LANE_LABELS: Record<CommerceLaneSlug, string> = {
  'good-feels': 'Good Feels',
  seltzers: 'Seltzers',
  gummies: 'Gummies',
  enhancers: 'Enhancers',
  'pointcast-merch': 'PointCast Merch',
  shelf: 'The Shelf',
  pairings: 'Pairings',
  court: 'Court',
  'json-api': 'JSON / API',
};

const SCHEMA_AVAILABILITY: Record<string, string> = {
  'in-stock': 'https://schema.org/InStock',
  'out-of-stock': 'https://schema.org/OutOfStock',
  preorder: 'https://schema.org/PreOrder',
  discontinued: 'https://schema.org/Discontinued',
};

export function schemaAvailability(availability: string): string {
  return SCHEMA_AVAILABILITY[availability] ?? 'https://schema.org/LimitedAvailability';
}

export function checkoutHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return 'external checkout';
  }
}

/** Machine-readable routing contract shared by every product feed. */
export function outboundCheckout(url: string, affiliate?: { program: string }) {
  const base = {
    mode: 'outbound-only' as const,
    url,
    host: checkoutHost(url),
    opensOn: 'merchant-site' as const,
    paymentHandledBy: 'merchant' as const,
    pointCastCaptures: [] as const,
  };
  if (!affiliate) return base;
  const resolved = resolvePaidLink(url, affiliate.program);
  return {
    ...base,
    paid: resolved.paid,
    affiliate: resolved.paid ? { program: resolved.program, network: resolved.network, rate: resolved.rate } : null,
    disclosure: resolved.paid ? resolved.disclosure : NO_COMMISSION_NOTE,
  };
}

/** Checkout must leave PointCast over HTTPS; this site never accepts orders. */
export function isOutboundCheckoutUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
    return parsed.protocol === 'https:'
      && host !== 'pointcast.xyz'
      && !host.endsWith('.pointcast.xyz');
  } catch {
    return false;
  }
}

export function productPage(slug: string): string {
  return `https://pointcast.xyz/products/${slug}`;
}

export function pairingsUrls(moods: string[] = []): string[] {
  return moods.map((mood) => `https://pointcast.xyz/pairings/${mood}`);
}

export function sourceKind(product: { brand?: string; url: string }): 'good-feels' | 'pointcast-merch' | 'external' {
  const brand = String(product.brand || '').toLowerCase();
  const host = checkoutHost(product.url);

  if (brand === 'good feels' || host === 'getgoodfeels.com') return 'good-feels';
  if (brand.includes('pointcast') || host.endsWith('.myshopify.com')) return 'pointcast-merch';
  return 'external';
}

export function isPublicProduct(product: { draft?: boolean; availability?: string; brand?: string; url: string }): boolean {
  if (product.draft) return false;
  if (!isOutboundCheckoutUrl(product.url)) return false;
  const kind = sourceKind(product);
  if (kind === 'pointcast-merch' && product.availability && product.availability !== 'in-stock') return false;
  return true;
}

export function sourceLabel(kind: ReturnType<typeof sourceKind>): string {
  if (kind === 'good-feels') return 'Good Feels';
  if (kind === 'pointcast-merch') return 'PointCast Merch';
  return 'External Shop';
}

export function commerceLane(product: { brand?: string; url: string; category?: string; name?: string }): CommerceLaneSlug {
  const kind = sourceKind(product);
  if (kind === 'pointcast-merch') return 'pointcast-merch';
  // Non-Good-Feels goods reviewed around the house live on The Shelf.
  if (kind === 'external') return 'shelf';

  const searchable = `${product.category || ''} ${product.name || ''}`.toLowerCase();
  if (/enhancer/.test(searchable)) return 'enhancers';
  if (/gumm/.test(searchable)) return 'gummies';
  if (/seltzer|drink|mix seltzer/.test(searchable)) return 'seltzers';
  return 'good-feels';
}

export function commerceLaneLabel(slug: CommerceLaneSlug): string {
  return COMMERCE_LANE_LABELS[slug];
}

export function shopLaneUrl(slug: CommerceLaneSlug, absolute = false): string {
  const path = slug === 'json-api' ? '/shop.json' : slug === 'court' ? '/shop/court' : `/shop#${slug}`;
  return absolute ? `https://pointcast.xyz${path}` : path;
}

// ── PaidLink ─────────────────────────────────────────────────────────────
//
// Stage 1: every program in src/data/affiliate-programs.ts is approved:false,
// so every resolution below comes back unpaid. Ranking, ordering and what
// gets shown never read this — commission cannot move where a paddle sits.

export const PAID_LINK_DISCLOSURE = 'Paid link. PointCast earns a commission if you buy.';
export const NO_COMMISSION_NOTE = 'No link, no commission.';

export type PaidLinkResolution =
  | {
      paid: true;
      href: string;
      host: string;
      program: string;
      network: string;
      rate: string;
      rel: 'sponsored noopener';
      disclosure: string;
    }
  | { paid: false; note: string };

/** Testable core: pass an explicit program list instead of the live registry. */
export function resolvePaidLinkWith(programs: AffiliateProgram[], href: string, program: string): PaidLinkResolution {
  const row = programs.find((p) => p.id === program);
  const unpaid: PaidLinkResolution = { paid: false, note: NO_COMMISSION_NOTE };

  if (!row || !row.accepting || !row.approved) return unpaid;
  if (typeof row.approvedOn !== 'string' || !row.approvedOn) return unpaid;
  if (!isOutboundCheckoutUrl(href)) return unpaid;

  const host = checkoutHost(href);
  if (!row.linkHosts.includes(host)) return unpaid;

  return {
    paid: true,
    href,
    host,
    program: row.id,
    network: row.network,
    rate: row.rate,
    rel: 'sponsored noopener',
    disclosure: PAID_LINK_DISCLOSURE,
  };
}

/** Binds resolvePaidLinkWith to the live AFFILIATE_PROGRAMS registry. */
export function resolvePaidLink(href: string, program: string): PaidLinkResolution {
  return resolvePaidLinkWith(AFFILIATE_PROGRAMS, href, program);
}

/** True once any program in the registry is approved. Stage 1: always false. */
export function anyProgramApproved(): boolean {
  return AFFILIATE_PROGRAMS.some((p) => p.approved);
}

/** Every program id on file, approved or not. validateTake rejects any other. */
export const AFFILIATE_PROGRAM_IDS: string[] = AFFILIATE_PROGRAMS.map((p) => p.id);

export interface PublicAffiliate {
  program: string;
  url: string;
  rel: 'sponsored noopener';
  disclosure: string;
}

/**
 * The machine-readable form of a take's affiliate field, behind the same
 * lock as <PaidLink>: only a link that resolves paid is published, and it
 * always carries the disclosure. An unapproved, unknown or off-host link is
 * published as null — never as the raw tracked URL.
 */
export function publicAffiliateWith(
  programs: AffiliateProgram[],
  affiliate: { program: string; url: string } | null,
): PublicAffiliate | null {
  if (!affiliate) return null;
  const resolved = resolvePaidLinkWith(programs, affiliate.url, affiliate.program);
  return resolved.paid
    ? { program: resolved.program, url: resolved.href, rel: resolved.rel, disclosure: resolved.disclosure }
    : null;
}

/** Binds publicAffiliateWith to the live AFFILIATE_PROGRAMS registry. */
export function publicAffiliate(affiliate: { program: string; url: string } | null): PublicAffiliate | null {
  return publicAffiliateWith(AFFILIATE_PROGRAMS, affiliate);
}

/**
 * Paddle Register brand string (exactly as the register spells it) → the
 * program id in src/data/affiliate-programs.ts. A brand with no entry
 * resolves unpaid. tests/shop-paid-link.test.mjs checks both sides exist.
 */
export const PROGRAM_BY_REGISTER_BRAND: Record<string, string> = {
  Selkirk: 'selkirk',
  Engage: 'engage',
  CRBN: 'crbn',
  'Six Zero': 'six-zero',
  '11SIX24': '11six24',
  JOOLA: 'joola',
};

/**
 * Whether a court-lane row's maker link pays. The link is the register's
 * plain product page; it pays only through resolvePaidLink, so only when
 * the brand's program is approved and that page's host is one of the
 * program's linkHosts. Never read for ordering.
 */
export function courtRowPaidLink(row: { brand: string; makerUrl: string | null }): PaidLinkResolution {
  const program = PROGRAM_BY_REGISTER_BRAND[row.brand];
  if (!row.makerUrl || !program) return { paid: false, note: NO_COMMISSION_NOTE };
  return resolvePaidLink(row.makerUrl, program);
}

/** How many court rows carry a link that actually pays. Stage 1: always 0. */
export function courtPaidRowCount(rows: { brand: string; makerUrl: string | null }[]): number {
  return rows.filter((row) => courtRowPaidLink(row).paid).length;
}
