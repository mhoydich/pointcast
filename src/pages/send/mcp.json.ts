/** /send/mcp.json — machine twin of the MCP one-sheet. */
import type { APIRoute } from 'astro';
import { SEND_SHEETS, jsonResponse } from '../../lib/send-sheets';

export const GET: APIRoute = () => jsonResponse(SEND_SHEETS.mcp);
