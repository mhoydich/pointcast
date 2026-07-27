interface Env {
  BEACH_COMMONS_V6_CHECKOUT_URL?: string;
}

const ALLOWED_HOSTS = new Set([
  'buy.stripe.com',
  'checkout.stripe.com',
  'pay.stripe.com',
]);

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const checkout = String(env.BEACH_COMMONS_V6_CHECKOUT_URL || '').trim();

  if (!checkout) {
    return Response.json(
      {
        ok: false,
        code: 'checkout-not-configured',
        message: 'The $100 Fire-Ring Commons contribution checkout is not open yet.',
        canonical: 'https://pointcast.xyz/beach-commons/v6',
      },
      {
        status: 503,
        headers: {
          'Cache-Control': 'no-store',
        },
      },
    );
  }

  try {
    const target = new URL(checkout);
    if (target.protocol !== 'https:' || !ALLOWED_HOSTS.has(target.hostname.toLowerCase())) {
      throw new Error('unsupported checkout host');
    }

    return Response.redirect(target.toString(), 302);
  } catch {
    return Response.json(
      {
        ok: false,
        code: 'checkout-misconfigured',
        message: 'The hosted contribution checkout could not be opened.',
        canonical: 'https://pointcast.xyz/beach-commons/v6',
      },
      {
        status: 503,
        headers: {
          'Cache-Control': 'no-store',
        },
      },
    );
  }
};
