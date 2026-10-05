import { articles, publicArticle } from '../../../lib/pickleball-v2/articles.js';

export function getStaticPaths() {
  return articles.map((article) => ({ params: { slug: article.slug }, props: { article } }));
}

export const GET = ({ props }: { props: { article: (typeof articles)[number] } }) =>
  new Response(JSON.stringify(publicArticle(props.article), null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
    },
  });
