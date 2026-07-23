import releases from '../data/press-releases.json';

export type PressKind = 'product' | 'data' | 'archive' | 'game' | 'engineering';

export interface PressProof {
  label: string;
  url: string;
}

export interface PressRelease {
  id: string;
  slug: string;
  kind: PressKind;
  product: string;
  kicker: string;
  headline: string;
  subhead: string;
  publishedAt: string;
  dateline: string;
  issuer: string;
  status: 'published';
  disclosure: string;
  productUrl: string;
  productLabel: string;
  actionUrl?: string;
  actionLabel?: string;
  summary: string;
  body: string[];
  proofs: PressProof[];
  topics: string[];
  palette: {
    paper: string;
    ink: string;
    accent: string;
  };
}

export const PRESS_RELEASES = (releases as PressRelease[])
  .slice()
  .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));

export const PRESS_KIND_LABELS: Record<PressKind, string> = {
  product: 'Product',
  data: 'Data',
  archive: 'Archive',
  game: 'Game',
  engineering: 'Engineering',
};

export function getPressRelease(slug: string): PressRelease | undefined {
  return PRESS_RELEASES.find((release) => release.slug === slug);
}

export function pressReleaseUrl(release: Pick<PressRelease, 'slug'>): string {
  return `https://pointcast.xyz/press/${release.slug}`;
}

export function pressReleaseJsonUrl(release: Pick<PressRelease, 'slug'>): string {
  return `${pressReleaseUrl(release)}.json`;
}

export function formatPressDate(value: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/Los_Angeles',
    timeZoneName: 'short',
  }).format(new Date(value));
}

export function releasePayload(release: PressRelease) {
  return {
    $schema: 'https://schema.org/NewsArticle',
    ...release,
    canonicalUrl: pressReleaseUrl(release),
    jsonUrl: pressReleaseJsonUrl(release),
    pressWire: 'https://pointcast.xyz/press',
    pressWireJson: 'https://pointcast.xyz/press.json',
    pressWireRss: 'https://pointcast.xyz/press.xml',
    contact: {
      name: 'Michael Hoydich',
      organization: 'PointCast Signal Office',
      email: 'hello@pointcast.xyz',
    },
  };
}
