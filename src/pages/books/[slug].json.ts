import type { APIRoute } from 'astro';
import expansionBooks from '../../data/bookshelf-expansion.json';
import type { ExpansionBook } from '../../lib/book-companion-types';

export const prerender = true;
export function getStaticPaths() {
  return (expansionBooks as unknown as ExpansionBook[]).map((book) => ({ params: { slug: book.id }, props: { book } }));
}
export const GET: APIRoute = ({ props }) => {
  const book = props.book as ExpansionBook;
  return new Response(JSON.stringify({ ...book, canonical: `https://pointcast.xyz/books/${book.id}/`, artworkProvenance: '/images/bookshelf/provenance.json', commerce: 'External discovery links. Providers determine availability, prices, condition, and library eligibility. No PointCast stock, checkout, payment, or fulfilment.', reproducedBookText: false, quotationsUsed: 0, artworkIsOfficialCover: false }, null, 2), { headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } });
};
