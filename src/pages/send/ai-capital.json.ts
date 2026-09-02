/** /send/ai-capital.json — machine twin of the AI capital one-sheet. */
import type { APIRoute } from 'astro';
import { SEND_SHEETS, jsonResponse } from '../../lib/send-sheets';

export const GET: APIRoute = () => jsonResponse(SEND_SHEETS['ai-capital']);
