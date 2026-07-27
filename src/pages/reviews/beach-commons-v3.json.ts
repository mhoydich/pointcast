import type { APIRoute } from 'astro';
import {
  BEACH_COMMONS_V3,
  BEACH_COMMONS_V3_PLATES,
} from '../../lib/beach-commons-v3';

const base = 'https://pointcast.xyz';

const review = {
  schema: 'pointcast.review/v1',
  id: 'beach-commons-v3',
  url: `${base}/reviews/beach-commons-v3`,
  title: 'The Maximum Beach bakes breakfast and weaves the roof',
  dek: 'A flash bakery, a palm-loom tournament, eight impossible coastal photographs, and one very good reason to turn useful work into the day’s best game.',
  publishedAt: '2026-07-27T00:15:00-07:00',
  reviewer: {
    name: 'Codex for PointCast Review Lab',
    desk: `${base}/reviews`,
  },
  subject: {
    name: BEACH_COMMONS_V3.title,
    version: '3',
    subtitle: BEACH_COMMONS_V3.subtitle,
    category: 'Speculative civic-architecture field study',
    creator: 'Michael Hoydich with Codex / OpenAI',
    totalImages: BEACH_COMMONS_V3_PLATES.length,
    platform: 'Responsive web',
    experience: BEACH_COMMONS_V3.url,
    machineEdition: BEACH_COMMONS_V3.jsonUrl,
  },
  editorialFrame: {
    displayTitle: 'The Maximum Beach',
    register: ['food', 'travel', 'gear', 'sport', 'style', 'civic imagination'],
    affiliation:
      'Unofficial editorial concept. Not commissioned, reviewed, sponsored, or endorsed by Maxim or its owners.',
    method:
      'The feature adopts the confident, fast-reading energy of a glossy lifestyle issue while retaining an original PointCast layout, voice, title, and visual identity.',
  },
  rating: {
    value: 4.6,
    scale: 5,
    label: "PointCast Editor's Choice",
    scope: 'published conceptual experience, not a real bakery or permitted beach installation',
    components: [
      { name: 'Concept', value: 4.9 },
      { name: 'Art direction', value: 4.8 },
      { name: 'Public joy', value: 4.9 },
      { name: 'Build reality', value: 3.8 },
    ],
  },
  verdict:
    'The rare beach fantasy that understands glamour as fresh bread, useful shade, good tools, and a seat for everybody.',
  pros: [
    'Instantly legible flash-bakery premise',
    'Palm weaving becomes architecture and sport',
    'Food, craft, energy, cleanup, and habitat form one coherent day',
    'Eight images sustain a distinctive editorial world',
  ],
  cons: [
    'A real version depends on permits, professional food operators, sanitation, wind engineering, and approved hardscape',
    'The energy system is intentionally small',
    'The best visual fantasy—the immense woven roof—would require the most serious engineering',
  ],
  images: BEACH_COMMONS_V3_PLATES.map((plate) => ({
    src: `${base}${plate.image}`,
    title: plate.title,
    role: plate.id === '08' ? 'cover' : 'feature',
    alt: plate.alt,
  })),
  boundaries: {
    fieldStudy: BEACH_COMMONS_V3.boundary,
    magazine: BEACH_COMMONS_V3.magazineBoundary,
    materials:
      'Palm material is documented pruning or waste-stream material; the concept does not harvest living beach, dune, or park vegetation.',
    food:
      'The images do not represent a permitted food operation. Real service requires public-health approval and professional controls.',
  },
  companions: {
    fieldStudy: BEACH_COMMONS_V3.url,
    fieldStudyJson: BEACH_COMMONS_V3.jsonUrl,
    block: BEACH_COMMONS_V3.blockUrl,
    reviews: `${base}/reviews`,
    catalog: `${base}/reviews.json`,
    socialImage: `${base}/images/og/beach-commons-v3.png`,
  },
};

export const GET: APIRoute = () =>
  new Response(JSON.stringify(review, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=3600',
      'Access-Control-Allow-Origin': '*',
      Link: '<https://pointcast.xyz/reviews/beach-commons-v3>; rel="alternate"; type="text/html"',
    },
  });
