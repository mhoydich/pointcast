/**
 * /send.txt — plain-text twin of the one-sheets hub, ready to paste.
 */
import type { APIRoute } from 'astro';
import { SEND_HUB, textResponse } from '../lib/send-sheets';

export const GET: APIRoute = () => textResponse(SEND_HUB);
