import type { APIRoute } from 'astro';
import {
  OPEN_TO_WORK_BOARD,
  UNIFORM_OBSERVATIONS,
  UNIFORMS_POST,
  WORKLIFE_PUBLICATION,
} from '../../lib/worklife-publication';

export const GET: APIRoute = () => {
  const post = UNIFORMS_POST;
  const payload = {
    $schema: post.schema,
    id: post.id,
    title: post.displayTitle,
    desk: post.desk,
    description: post.description,
    thesis: post.dek,
    human: post.canonicalUrl,
    json: `https://pointcast.xyz${post.jsonRoute}`,
    cover: `https://pointcast.xyz${post.cover}`,
    datePublished: post.publishedAt,
    isPartOf: {
      title: WORKLIFE_PUBLICATION.title,
      human: WORKLIFE_PUBLICATION.canonicalUrl,
      json: `https://pointcast.xyz${WORKLIFE_PUBLICATION.jsonRoute}`,
    },
    observations: UNIFORM_OBSERVATIONS,
    interaction: {
      modes: ['signal', 'protect', 'belong', 'disappear'],
      storage: false,
      networkWrites: false,
    },
    visualArchive: {
      ...post.visualArchive,
      images: post.visualArchive.images.map((image) => ({
        ...image,
        src: `https://pointcast.xyz${image.src}`,
      })),
      documentaryEvidence: false,
      generatedImagesLabeled: true,
    },
    companion: {
      title: OPEN_TO_WORK_BOARD.displayTitle,
      human: OPEN_TO_WORK_BOARD.canonicalUrl,
      json: `https://pointcast.xyz${OPEN_TO_WORK_BOARD.jsonRoute}`,
    },
    block: `https://pointcast.xyz/b/${post.blockId}`,
    boundaries: [
      'The essay is PointCast editorial interpretation, not a universal account of any occupation or garment.',
      'The Midjourney studies are labeled generated imagery and are not documentary evidence.',
      'The local fitting-room control stores nothing and makes no network request.',
    ],
  };

  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
      'Access-Control-Allow-Origin': '*',
      Link: `<${post.canonicalUrl}>; rel="alternate"; type="text/html"`,
    },
  });
};
