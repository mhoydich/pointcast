/** /send/ai-tools.json — machine twin of the AI tools one-sheet. */
import type { APIRoute } from 'astro';
import { SEND_SHEETS, jsonResponse } from '../../lib/send-sheets';

export const GET: APIRoute = () => jsonResponse(SEND_SHEETS['ai-tools']);
