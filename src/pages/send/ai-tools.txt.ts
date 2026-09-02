/** /send/ai-tools.txt — plain-text twin of the AI tools one-sheet, ready to paste. */
import type { APIRoute } from 'astro';
import { SEND_SHEETS, textResponse } from '../../lib/send-sheets';

export const GET: APIRoute = () => textResponse(SEND_SHEETS['ai-tools']);
