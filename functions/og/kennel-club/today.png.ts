/**
 * /og/kennel-club/today.png — a fresh social card without a daily deploy.
 *
 * The calendar page itself remains prerendered, but crawler clients request
 * this stable URL independently. Resolve the Los Angeles day at the edge,
 * embed that plate in the shared SVG, then rasterize it to the PNG expected by
 * the broadest set of unfurl clients.
 */
import { Resvg, initWasm } from '@resvg/resvg-wasm';
import wasm from '@resvg/resvg-wasm/index_bg.wasm?module';
import interFont from './inter-latin.bin';
import jetBrainsMonoFont from './jetbrains-mono-latin.bin';
import { sittingOfTheDay, losAngelesDate } from '../../../src/lib/kennel-club';
import { buildKennelClubCollectionCard } from '../../../src/lib/og-kennel-card.mjs';
import { requestedKennelOgDate } from '../../../src/lib/og-kennel-today.mjs';
import series from '../../../src/data/kennel-club-september-sitting.json';

const CACHE_CONTROL = 'public, max-age=300';
let wasmReady: Promise<void> | undefined;

function prepareWasm(): Promise<void> {
  // Pages keeps one module instance warm per isolate. Resvg itself rejects a
  // second initialization, so all requests share this promise.
  wasmReady ??= initWasm(wasm);
  return wasmReady;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  }
  return btoa(binary);
}

async function plateDataUri(request: Request, image: string): Promise<string> {
  const response = await fetch(new URL(image, request.url));
  if (!response.ok) throw new Error(`plate returned ${response.status}`);
  const contentType = response.headers.get('content-type')?.split(';', 1)[0] || 'image/png';
  return `data:${contentType};base64,${bytesToBase64(new Uint8Array(await response.arrayBuffer()))}`;
}

export async function renderKennelTodayOg(
  request: Request,
  fallbackPath = '/images/kennel-club/og/kennel-club.png',
): Promise<Response> {
  try {
    const today = sittingOfTheDay(requestedKennelOgDate(request, losAngelesDate));
    const svg = buildKennelClubCollectionCard({
      sittings: series.sittings,
      today,
      plateHref: await plateDataUri(request, today.image.png),
    });
    await prepareWasm();
    const renderer = new Resvg(svg, {
      fitTo: { mode: 'width', value: 1200 },
      font: {
        loadSystemFonts: false,
        fontBuffers: [new Uint8Array(interFont), new Uint8Array(jetBrainsMonoFont)],
        defaultFontFamily: 'Inter',
        sansSerifFamily: 'Inter',
        monospaceFamily: 'JetBrains Mono Variable',
      },
    });
    const png = renderer.render().asPng();
    renderer.free();
    return new Response(png, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': CACHE_CONTROL,
      },
    });
  } catch {
    // The static card is intentionally kept as a graceful failure path for an
    // unavailable plate or a transient Wasm initialization problem.
    return Response.redirect(new URL(fallbackPath, request.url).toString(), 302);
  }
}

export const onRequestGet: PagesFunction = ({ request }) => renderKennelTodayOg(request);
