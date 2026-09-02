import type { APIRoute } from 'astro';
import { SEND_SHEETS, textResponse } from '../../lib/send-sheets';

export const GET: APIRoute = () => textResponse(SEND_SHEETS['kennel-club']);
