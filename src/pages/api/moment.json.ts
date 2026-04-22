/**
 * /api/moment.json — today's composed moment as structured JSON.
 *
 * Emits the same composition the /moment page builds: date + moon + season
 * + zodiac + featured zone + featured zeitgeist poll + featured pairing
 * + the AI image prompt. Agents ingest this to answer "what is today's
 * PointCast moment" or to generate their own images from the same seed.
 *
 * Static. Prompt text baked at build. For live zone-of-viewer matching,
 * the agent should compute it themselves from zones[] + its own tz.
 */
import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';
import { moonPhase, season, zodiacOfDate, nextEquinoxOrSolstice } from '../../lib/sky';

export const GET: APIRoute = async () => {
  const now = new Date();
  const moon = moonPhase(now);
  const zodiac = zodiacOfDate(now);
  const nextMarker = nextEquinoxOrSolstice(now);
  const se = season(now, 33.919);

  const zeitgeistPolls = (await getCollection('polls', ({ data }) => !data.draft && data.zeitgeist))
    .sort((a, b) => b.data.openedAt.getTime() - a.data.openedAt.getTime());
  const featuredPoll = zeitgeistPolls[0] ?? null;

  const clockBlock = (await getCollection('blocks', ({ data }) => data.id === '0324' && !data.draft))[0];
  const clockZones = clockBlock?.data.clock?.zones ?? [];
  const featuredZone = clockZones.find((z) => z.label === 'El Segundo') ?? clockZones[0];

  const [allProducts, allBlocks] = await Promise.all([
    getCollection('products', ({ data }) => !data.draft),
    getCollection('blocks', ({ data }) => !data.draft),
  ]);

  const productMoods = new Set<string>();
  allProducts.forEach((p) => (p.data.pairsWithMood ?? []).forEach((m) => productMoods.add(m)));
  const blockMoodCounts = new Map<string, number>();
  allBlocks.forEach((b) => {
    if (b.data.mood && productMoods.has(b.data.mood)) {
      blockMoodCounts.set(b.data.mood, (blockMoodCounts.get(b.data.mood) ?? 0) + 1);
    }
  });
  const sharedMoods = Array.from(blockMoodCounts.entries()).sort((a, b) => b[1] - a[1]);
  const featuredMood = sharedMoods[0]?.[0] ?? 'good-feels';
  const featuredProduct = allProducts.find((p) => (p.data.pairsWithMood ?? []).includes(featuredMood)) ?? allProducts[0];

  const dateLong = new Intl.DateTimeFormat('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
  }).format(now);
  const dateShort = new Intl.DateTimeFormat('en-US', {
    month: 'short', day: '2-digit'
  }).format(now).toUpperCase();

  const zoneLabel = featuredZone?.label ?? 'El Segundo';
  const zoneRegion = featuredZone?.region ?? 'Pacific edge · marine-layer coast';
  const zoneSeasonal = featuredZone?.seasonal ?? '';
  const pollQ = featuredPoll?.data.question ?? '';
  const productHint = featuredProduct ? `, nod to ${featuredProduct.data.name}` : '';

  const prompt = [
    `A Rothko-inspired horizontal color-field composition capturing "${dateLong}" — a single moment from PointCast, the living broadcast from El Segundo.`,
    ``,
    `FRAME: cinematic 16:9. Three horizontal bands of color, each a mood: top band the dawn sky as ${moon.glyph} ${moon.name} light (${Math.round(moon.illumination * 100)}% illuminated), middle band the midday light of ${se.name} (day ${se.dayOfSeason} of ${se.lengthDays}), bottom band the Pacific at ${zoneLabel} — ${zoneRegion}.`,
    ``,
    `SEASON: ${zoneSeasonal}`,
    ``,
    `OVERLAY (very subtle, at edges only): a CC0 pixel-art noun avatar silhouette bottom-left at small scale; a ${zodiac.glyph} ${zodiac.name} sigil top-right at small scale; mid-century-modern sans-serif date stamp "${dateShort} 2026" in a single corner.`,
    ``,
    `MOOD: "${featuredMood}"${productHint}.`,
    featuredPoll ? `ZEITGEIST ECHO: the question "${pollQ}" is nowhere written, but the image feels like a hesitation before picking.` : '',
    ``,
    `VISUAL REGISTER: painterly color fields (Rothko, Agnes Martin), with only a tiny pixel-art signature at the edge. No people, no literal objects, no words unless I specified them above. Depth comes from color temperature, not from detail.`,
    `PALETTE: if ${moon.illumination > 0.7 ? 'bright moon' : 'dim moon'} → cooler top band; if ${se.name === 'spring' ? 'spring' : se.name} → greens + soft ochres in the middle band; if coastal → pale blue-gray-amber lower band.`,
    ``,
    `STYLE: cinematic, meditative, tactile paint texture. Feels like an editorial postcard from a slow day in Southern California that somehow captures the current planetary mood.`,
  ].filter(Boolean).join('\n');

  const payload = {
    $schema: 'https://pointcast.xyz/MOMENT.md',
    url: 'https://pointcast.xyz/moment',
    renderedAt: now.toISOString(),
    date: {
      iso: now.toISOString().slice(0, 10),
      long: dateLong,
      short: dateShort,
    },
    sky: {
      moon: { name: moon.label, illumination: moon.illumination, glyph: moon.glyph },
      zodiac: { name: zodiac.name, glyph: zodiac.glyph, dayInSign: zodiac.dayInSign },
      season: { name: se.name, glyph: se.glyph, dayOfSeason: se.dayOfSeason, lengthDays: se.lengthDays },
      next: { label: nextMarker.label, daysUntil: nextMarker.daysUntil },
    },
    featuredZone: featuredZone ? {
      label: featuredZone.label,
      tz: featuredZone.tz,
      region: featuredZone.region ?? null,
      seasonal: featuredZone.seasonal ?? null,
    } : null,
    featuredPoll: featuredPoll ? {
      slug: featuredPoll.data.slug,
      question: featuredPoll.data.question,
      dek: featuredPoll.data.dek ?? null,
      url: `https://pointcast.xyz/poll/${featuredPoll.data.slug}`,
    } : null,
    featuredPairing: featuredProduct ? {
      mood: featuredMood,
      productSlug: featuredProduct.data.slug,
      productName: featuredProduct.data.name,
      shopUrl: featuredProduct.data.url,
      pairingUrl: `https://pointcast.xyz/pairings/${featuredMood}`,
    } : null,
    aiImage: {
      provider: 'chatgpt.com/images',
      providerUrl: 'https://chatgpt.com/images/',
      prompt,
      promptChars: prompt.length,
      aspectHint: '16:9',
    },
    notes: {
      staticBase: 'Prompt and composition are baked at publish. For viewer-matched zone, compute client-side from the zones array.',
      handoff: 'The canonical flow is: copy prompt → paste into chatgpt.com/images → save image URL back to localStorage on /moment.',
    },
  };

  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  });
};
