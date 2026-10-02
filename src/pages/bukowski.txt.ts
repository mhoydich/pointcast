import type { APIRoute } from 'astro';
import { chapters, sources, authorship, copyright, verifiedDate } from '../data/bukowski';

export const GET: APIRoute = () => new Response([
  'CHARLES BUKOWSKI / THE ORDINARY STAYS',
  'An independent PointCast tribute — https://pointcast.xyz/bukowski/',
  authorship,
  ...chapters.map(c => `\n${c.number}. ${c.name.toUpperCase()}\n${c.introduction}\n\n${c.poemTitle}\n${c.lines.join('\n')}\n\n${c.afterword}`),
  '\nCONTEXT',
  'Charles Bukowski (1920–1994) was born in Andernach, Germany, grew up in Los Angeles, and died in San Pedro. Postal work was part of his livelihood. With support from John Martin of Black Sparrow Press, he turned to full-time writing at 49; his first novel, Post Office, appeared in 1971. Henry Chinaski is a roughly autobiographical fictional character, not a documentary record.',
  'His conversational writing attends to labor, outsiders, loneliness, relationships, drinking, and gambling. Readers can notice its humor and tenderness while questioning the misogyny and racism discussed by critics. Addiction is not a requirement for creativity.',
  '\nSOURCES AND READING',
  ...sources.map(s => `${s.title}\n${s.url}\n${s.note}\n`),
  `Sources checked: ${verifiedDate}. Poetry Foundation direct access returned 403; the indexed essay was inspected.`,
  copyright,
].join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
