export const COMMERCE_VERSION = 'commerce-hub-v1-2026-05-06';

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
  | 'pairings'
  | 'json-api';

export const COMMERCE_LANE_LABELS: Record<CommerceLaneSlug, string> = {
  'good-feels': 'Good Feels',
  seltzers: 'Seltzers',
  gummies: 'Gummies',
  enhancers: 'Enhancers',
  'pointcast-merch': 'PointCast Merch',
  pairings: 'Pairings',
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
  const kind = sourceKind(product);
  if (kind === 'pointcast-merch' && product.availability && product.availability !== 'in-stock') return false;
  return true;
}

export function commerceCatalogMetadata(products: Array<{
  data: {
    addedAt: Date;
    draft?: boolean;
    availability?: string;
    brand?: string;
    url: string;
  };
}>, generatedAt = new Date()) {
  const catalogUpdatedAt = products.reduce<Date | null>((latest, product) => {
    const addedAt = product.data.addedAt;
    if (!latest || addedAt.getTime() > latest.getTime()) return addedAt;
    return latest;
  }, null);

  const sourceCounts = products.reduce<Record<ReturnType<typeof sourceKind>, number>>((counts, product) => {
    const kind = sourceKind(product.data);
    counts[kind] += 1;
    return counts;
  }, { 'good-feels': 0, 'pointcast-merch': 0, external: 0 });

  return {
    generatedAt: generatedAt.toISOString(),
    catalogUpdatedAt: (catalogUpdatedAt ?? new Date(0)).toISOString(),
    publicProductCount: products.length,
    sourceCounts,
    hiddenProductPolicy: {
      drafts: 'hidden',
      pointcastMerchOutOfStock: 'hidden',
      checkout: CHECKOUT_POLICY.mode,
      pii: CHECKOUT_POLICY.pii,
    },
  };
}

export function sourceLabel(kind: ReturnType<typeof sourceKind>): string {
  if (kind === 'good-feels') return 'Good Feels';
  if (kind === 'pointcast-merch') return 'PointCast Merch';
  return 'External Shop';
}

export function commerceLane(product: { brand?: string; url: string; category?: string; name?: string }): CommerceLaneSlug {
  const kind = sourceKind(product);
  if (kind === 'pointcast-merch') return 'pointcast-merch';

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
  const path = slug === 'json-api' ? '/shop.json' : `/shop#${slug}`;
  return absolute ? `https://pointcast.xyz${path}` : path;
}
