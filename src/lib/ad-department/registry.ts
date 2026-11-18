import type { AstroComponentFactory } from 'astro/runtime/server/index.js';

type PosterModule = {
  default: AstroComponentFactory;
  ad: { slug: string; title: string; description: string; art: string };
};

const posters = import.meta.glob<PosterModule>('../../components/ad-department/posters/*.astro', { eager: true });

export const ads = Object.keys(posters).sort().map(path => {
  const { default: Poster, ad } = posters[path];
  return { ...ad, Poster };
});

export const rackPath = '/ads/department/';
export const sourceUrl = 'https://github.com/mhoydich/brutalist-motor-art/tree/12f7d54';
export const deckUrl = 'https://objkt.com/collections/KT19uYnRbBA7jnepfcqEr3rZHUoVeLHz2RkF';
