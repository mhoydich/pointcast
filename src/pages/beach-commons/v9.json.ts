import type { APIRoute } from 'astro';
import {
  BEACH_COMMONS_V9,
  SIGNAL_RACK_VOICES,
  SIGNAL_SHACK_BENCHES,
  SIGNAL_SHACK_CURRENT_TECH,
  SIGNAL_SHACK_CYCLE,
  SIGNAL_SHACK_LANES,
  SIGNAL_SHACK_REALITY_PATHS,
  SIGNAL_SHACK_ROLES,
  SIGNAL_SHACK_RULES,
} from '../../lib/beach-commons-v9';

export const GET: APIRoute = () =>
  new Response(
    JSON.stringify(
      {
        ...BEACH_COMMONS_V9,
        benches: SIGNAL_SHACK_BENCHES.map((bench) => ({
          ...bench,
          image: new URL(bench.image, BEACH_COMMONS_V9.url).href,
        })),
        lanes: SIGNAL_SHACK_LANES,
        roles: SIGNAL_SHACK_ROLES,
        operatingCycle: SIGNAL_SHACK_CYCLE,
        currentTechnology: SIGNAL_SHACK_CURRENT_TECH,
        realityPaths: SIGNAL_SHACK_REALITY_PATHS,
        operatingRules: SIGNAL_SHACK_RULES,
        interactiveAudio: {
          availability: 'human HTML edition only',
          engine: 'browser-native Web Audio oscillators and generated noise',
          autoPlay: false,
          samplesOrRecordings: false,
          voices: SIGNAL_RACK_VOICES,
        },
        rights: {
          visuals: 'Original images generated for this PointCast field study with OpenAI image generation.',
          audio: 'Original real-time browser synthesis; no samples, recordings, stems, lyrics, or third-party music.',
          retailerAffiliation: 'None. The concept is not affiliated with or endorsed by RadioShack or any electronics retailer.',
        },
        methodology: {
          researchCheckedAt: '2026-07-27T22:45:00-07:00',
          currentClaims:
            'Current-capability statements are linked to official Meshtastic, Raspberry Pi, Arduino, NOAA, FCC, and LA County sources.',
          visualStatus:
            'Eight speculative concept plates; images are not photographs of an existing venue, event, prototype, or installation.',
          eventStatus:
            'No gathering is announced, scheduled, permitted, ticketed, or open for contribution through this edition.',
        },
      },
      null,
      2,
    ),
    {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=300, s-maxage=3600',
        'Access-Control-Allow-Origin': '*',
        Link: '<https://pointcast.xyz/beach-commons/v9>; rel="alternate"; type="text/html"',
      },
    },
  );
