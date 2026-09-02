/**
 * /send.json — machine twin of the one-sheets hub.
 * Lists the three sheets with their HTML, JSON and plain-text addresses.
 */
import type { APIRoute } from 'astro';
import { SEND_HUB, SEND_SHEET_LIST, jsonResponse, sheetPayload, sheetUrl } from '../lib/send-sheets';

export const GET: APIRoute = () => {
  const payload = {
    ...sheetPayload(SEND_HUB),
    sheets: SEND_SHEET_LIST.map((sheet) => ({
      slug: sheet.slug,
      title: sheet.title,
      kicker: sheet.kicker,
      dek: sheet.dek,
      html: sheetUrl(sheet),
      json: `${sheetUrl(sheet)}.json`,
      txt: `${sheetUrl(sheet)}.txt`,
      sources: sheet.sources,
    })),
  };
  const base = jsonResponse(SEND_HUB);
  return new Response(JSON.stringify(payload, null, 2), { headers: base.headers });
};
