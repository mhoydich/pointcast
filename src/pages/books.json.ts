import type { APIRoute } from 'astro';
import { readingShelf, literaryDoors, shelfThemes } from '../data/reading-shelf';
export const prerender = true;
export const GET: APIRoute = () => new Response(JSON.stringify({
  title: 'The PointCast reading shelf', url: 'https://pointcast.xyz/books/',
  description: 'Twenty reading doors (nineteen books and an interview/essay room) with original artwork, edition comparisons, sources and external purchase or borrowing routes.',
  readingMap: { url: 'https://pointcast.xyz/books/map/', metadata: 'https://pointcast.xyz/books/map.json', records: 87, source: 'Manually reviewed user-supplied Goodreads RSS snapshot. Title and author metadata only; not ratings, reading activity or a complete account scan.' },
  books: readingShelf, literaryDoors, themes: shelfThemes,
  commerce: { inventory: false, checkout: false, prices: false, affiliateLinks: false },
  copyright: 'Original editorial copy and generated atmosphere artwork. Full texts are linked only through authorized or jurisdiction-qualified public-domain sources. Modern introductions, notes, translations and illustrations retain separate rights.',
  checkedAt: '2026-10-03',
}, null, 2), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
