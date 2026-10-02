import book from '../../data/bookshops/playing-for-pizza.json';
export const prerender = true;
export function GET() {
  return new Response(JSON.stringify({ ...book, canonical: 'https://pointcast.xyz/books/playing-for-pizza/', artworkProvenance: '/images/bookshop/provenance.json', commerce: 'External discovery links only. No PointCast stock, checkout, payment, fulfilment, or guaranteed availability.', quotationsUsed: 0, reproducedBookText: false, artworkIsOfficialCover: false }, null, 2), { headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } });
}
