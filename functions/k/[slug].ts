import { KENNEL_CLUB, losAngelesDate, sittingOfTheDay } from '../../src/lib/kennel-club';

interface RouteParams {
  slug?: string;
}

export const onRequestGet: PagesFunction<Cloudflare.Env> = async ({ request, params }) => {
  const route = (params as RouteParams).slug ?? '';
  const sitting = route === 'today'
    ? sittingOfTheDay(losAngelesDate())
    : /^\d{2}$/.test(route)
      ? KENNEL_CLUB.sittings[Number(route) - 1]
      : null;
  if (!sitting) return new Response('Kennel Club sitting not found.', { status: 404 });
  const status = route === 'today' ? 302 : 301;
  return Response.redirect(new URL(`/kennel-club/${sitting.slug}`, request.url).toString(), status);
};
