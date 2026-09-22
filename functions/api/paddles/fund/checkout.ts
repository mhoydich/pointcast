/**
 * /api/paddles/fund/checkout — the patron pass, as a hosted Stripe checkout.
 *
 * Same policy as /api/25/checkout: PointCast never touches card data. Mike
 * creates a Payment Link in Stripe ($25 patron pass; ?tier=club for the $100
 * club seat) and sets it as a Pages secret. Until then this answers 503 and
 * /paddles/fund shows the pledge button instead of the buy button.
 *
 *   wrangler pages secret put COURT_FUND_CHECKOUT_URL --project-name pointcast
 *   wrangler pages secret put COURT_FUND_CLUB_CHECKOUT_URL --project-name pointcast
 */

interface Env { COURT_FUND_CHECKOUT_URL?: string; COURT_FUND_CLUB_CHECKOUT_URL?: string }
const ALLOWED_HOSTS = new Set(['buy.stripe.com', 'checkout.stripe.com', 'pay.stripe.com']);
const notOpen = (code: string) =>
  Response.json({ ok: false, code, message: 'The patron pass checkout is not open yet. Pledge on the page instead; it counts.', canonical: 'https://pointcast.xyz/paddles/fund' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const tier = new URL(request.url).searchParams.get('tier') === 'club' ? 'club' : 'patron';
  const raw = String((tier === 'club' ? env.COURT_FUND_CLUB_CHECKOUT_URL : env.COURT_FUND_CHECKOUT_URL) || '').trim();
  if (!raw) return notOpen('checkout-not-configured');
  try {
    const target = new URL(raw);
    if (target.protocol !== 'https:' || !ALLOWED_HOSTS.has(target.hostname.toLowerCase())) throw new Error('unsupported host');
    return Response.redirect(target.toString(), 302);
  } catch {
    return notOpen('checkout-misconfigured');
  }
};
