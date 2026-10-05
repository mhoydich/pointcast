const page = {
  schema: 'pointcast.review-method/v1',
  url: 'https://pointcast.xyz/reviews/method',
  title: 'How we review',
  asOf: '2026-10-05',
  affiliateLinks: false,
  handsOnPolicy:
    'A desk review ranks products PointCast has not handled. It cites published tests and maker pages, dates every price, and carries no star rating. A hands-on review says so and separates what was used from what was only read.',
  pricePolicy:
    'Prices are US list snapshots from the maker’s page on the date printed on the guide. They exclude tax, shipping, and installation. The maker’s page is the current price. PointCast does not invent a price when a page could not be checked.',
  linkPolicy:
    'Shopping links are direct and non-affiliate. PointCast earns no commission. No maker paid for placement. If a paid link is ever used, it will be labeled beside the link. Commission does not change a ranking.',
  evidencePolicy:
    'Performance numbers are paraphrased from named testers and linked. Unpublished lab results are not stated. A number we could not find in a public source is left out, including any claimed 98°F PointCast log for October 5, 2026.',
};

export const GET = () =>
  new Response(JSON.stringify(page, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
    },
  });
