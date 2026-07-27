/**
 * /sprints.xml — RSS companion for the autonomous sprint log.
 */
import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { readAllRecaps } from '../lib/sprint-recap';

export const GET: APIRoute = (context) => {
  const recaps = readAllRecaps();

  return rss({
    title: 'PointCast autonomous sprint log',
    description: 'Small, autonomous PointCast improvements as they ship.',
    site: context.site ?? 'https://pointcast.xyz',
    customData: '<language>en-us</language>',
    items: recaps.map((recap) => {
      const publishedAt = new Date(recap.firedAt);
      return {
        title: recap.title || `Sprint ${recap.sprintId}`,
        ...(Number.isNaN(publishedAt.getTime()) ? {} : { pubDate: publishedAt }),
        link: `/sprints#${recap.sprintId}`,
        description: recap.sections['what-shipped'] || `Sprint ${recap.sprintId}`,
        customData: `<guid isPermaLink="true">https://pointcast.xyz/sprints#${recap.sprintId}</guid>`,
      };
    }),
  });
};
