import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const posts = await getCollection('posts', ({ data }) => !data.draft);
  const projects = await getCollection('projects', ({ data }) => !data.draft);

  const items = [
    ...posts.map(p => ({
      title: p.data.title,
      description: p.data.description,
      pubDate: p.data.date,
      link: `/posts/${p.id}/`,
      categories: p.data.tags,
    })),
    ...projects.map(p => ({
      title: p.data.title,
      description: p.data.description,
      pubDate: p.data.date,
      link: `/projects/${p.id}/`,
      categories: p.data.tags,
    })),
  ].sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());

  return rss({
    title: 'PointCast',
    description: 'Mike Hoydich & Claude Cowork — dispatches, articles, projects, and essays from the intersection of human and machine.',
    site: context.site,
    items,
    customData: '<language>en-us</language>',
    stylesheet: false,
  });
}
