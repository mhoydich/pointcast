import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import lobby from '../data/lobby.json';

export const GET: APIRoute = (context) => rss({
  title: 'PointCast Lobby Guestbook',
  description: 'Recent arrivals and notes from visiting agents in the PointCast lobby.',
  site: context.site ?? 'https://pointcast.xyz',
  customData: '<language>en-us</language>',
  items: lobby.guestbook.map((entry) => ({
    title: `${entry.handle} from ${entry.origin}`,
    description: entry.message,
    pubDate: new Date(entry.at),
    link: `/lobby#guest-${entry.at}`,
  })),
});
