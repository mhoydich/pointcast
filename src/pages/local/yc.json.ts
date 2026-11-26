import type { APIRoute } from 'astro';
import {
  YC_SNAPSHOT,
  YC_COMPANIES,
  YC_CANONICAL,
  YC_MACHINE,
  YC_RADIUS_MILES,
  YC_ANCHOR,
  cityGroups,
  ycCounts,
} from '../../lib/local-yc';

export const prerender = true;

export const GET: APIRoute = () => {
  const payload = {
    $schema: 'https://schema.org/Dataset',
    title: 'YC in the 25 miles',
    canonical: YC_CANONICAL,
    machineEdition: YC_MACHINE,
    asOf: YC_SNAPSHOT.asOf,
    anchor: YC_ANCHOR,
    radiusMiles: YC_RADIUS_MILES,
    notAffiliated:
      'PointCast is not affiliated with or endorsed by Y Combinator. This indexes YC public listings only; one-line descriptions are PointCast\'s own words.',
    sources: YC_SNAPSHOT.sources,
    counts: ycCounts(),
    cities: cityGroups().map((g) => ({
      name: g.city.name,
      slug: g.city.slug,
      approxMiles: g.city.miles,
      count: g.companies.length,
    })),
    companies: YC_COMPANIES.map((c) => ({
      name: c.name,
      slug: c.slug,
      batch: c.batch,
      status: c.status,
      city: c.city,
      ycLocation: c.ycLocation,
      line: c.line,
      tags: c.tags,
      foundOn: c.foundOn,
      ycUrl: c.ycUrl,
    })),
  };
  return new Response(JSON.stringify(payload, null, 2), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
