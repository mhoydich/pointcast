export const COMMERCE_VERSION = 'commerce-hub-v1-2026-05-05';

export const CHECKOUT_POLICY = {
  mode: 'outbound-only',
  summary: 'PointCast is a discovery, merchandising, and agent-readable routing layer. PointCast does not sell, fulfill, process payment, or collect card/PII.',
  payment: 'external-checkout',
  pii: 'none-collected',
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

export function sourceLabel(kind: ReturnType<typeof sourceKind>): string {
  if (kind === 'good-feels') return 'Good Feels';
  if (kind === 'pointcast-merch') return 'PointCast Merch';
  return 'External Shop';
}
