export const SITE_ORIGIN = 'https://pointcast.xyz';

export const SITE_DESCRIPTION =
  'PointCast is an agent-native broadcast from El Segundo, California: human-readable pages, machine-readable feeds, stable Blocks, and a transparent human-AI collaboration ledger.';

export const SITE_KEYWORDS = [
  'PointCast',
  'Mike Hoydich',
  'El Segundo',
  'agent-native publishing',
  'AI collaboration',
  'LLM-readable feeds',
  'Tezos',
  'Nouns',
  'Good Feels',
];

export const SITE_SAME_AS = [
  'https://x.com/mhoydich',
  'https://github.com/mhoydich',
  'https://www.linkedin.com/in/mhoydich/',
  'https://www.instagram.com/mhoydich/',
  'https://www.are.na/michael-hoydich/channels',
  'https://soundcloud.com/mikeisnice',
  'https://medium.com/@mhoydich',
];

export interface DiscoveryLink {
  rel: string;
  href: string;
  type?: string;
  title?: string;
}

export const DISCOVERY_LINKS: DiscoveryLink[] = [
  { rel: 'author', href: '/about' },
  { rel: 'help', href: '/for-agents' },
  { rel: 'alternate', type: 'application/json', href: '/agents.json', title: 'PointCast agent discovery manifest' },
  { rel: 'alternate', type: 'application/json', href: '/play.json', title: 'PointCast play layer manifest' },
  { rel: 'alternate', type: 'application/json', href: '/zen-cats.json', title: 'PointCast Zen Cat manifest' },
  { rel: 'alternate', type: 'text/plain', href: '/llms.txt', title: 'PointCast LLM summary' },
  { rel: 'alternate', type: 'text/plain', href: '/llms-full.txt', title: 'PointCast long-form LLM context' },
  { rel: 'alternate', type: 'application/feed+json', href: '/feed.json', title: 'PointCast JSON Feed' },
  { rel: 'alternate', type: 'application/rss+xml', href: '/feed.xml', title: 'PointCast RSS feed' },
];

export function buildIdentityJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${SITE_ORIGIN}/#website`,
        name: 'PointCast',
        alternateName: ['PointCast Network', 'pointcast.xyz'],
        url: SITE_ORIGIN,
        description: SITE_DESCRIPTION,
        inLanguage: 'en-US',
        publisher: { '@id': `${SITE_ORIGIN}/#org` },
        author: { '@id': `${SITE_ORIGIN}/#person` },
        potentialAction: {
          '@type': 'SearchAction',
          target: `${SITE_ORIGIN}/search?q={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
        sameAs: SITE_SAME_AS,
      },
      {
        '@type': 'Organization',
        '@id': `${SITE_ORIGIN}/#org`,
        name: 'PointCast',
        url: SITE_ORIGIN,
        logo: `${SITE_ORIGIN}/images/og-home-v3.png`,
        foundingLocation: {
          '@type': 'Place',
          name: 'El Segundo, California',
          geo: { '@type': 'GeoCoordinates', latitude: 33.9192, longitude: -118.4165 },
          address: {
            '@type': 'PostalAddress',
            addressLocality: 'El Segundo',
            addressRegion: 'CA',
            postalCode: '90245',
            addressCountry: 'US',
          },
        },
        founder: { '@id': `${SITE_ORIGIN}/#person` },
        sameAs: SITE_SAME_AS.slice(0, 3),
      },
      {
        '@type': 'Person',
        '@id': `${SITE_ORIGIN}/#person`,
        name: 'Mike Hoydich',
        alternateName: 'Michael Hoydich',
        url: `${SITE_ORIGIN}/about`,
        jobTitle: 'COO, Good Feels',
        worksFor: { '@type': 'Organization', name: 'Good Feels', url: 'https://shop.getgoodfeels.com' },
        homeLocation: { '@id': `${SITE_ORIGIN}/#el-segundo` },
        sameAs: SITE_SAME_AS,
      },
      {
        '@type': 'Place',
        '@id': `${SITE_ORIGIN}/#el-segundo`,
        name: 'El Segundo, California',
        geo: { '@type': 'GeoCoordinates', latitude: 33.9192, longitude: -118.4165 },
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'El Segundo',
          addressRegion: 'CA',
          postalCode: '90245',
          addressCountry: 'US',
        },
      },
    ],
  };
}
