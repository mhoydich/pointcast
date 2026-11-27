/**
 * /api/loom-rush-mcp — Loom Rush Agent Play (JSON-RPC 2.0).
 * Standalone from /api/mcp. The handler lives in the shared module so
 * tests and this Pages function call the same code.
 */
import {
  onRequestGet as getLoomRush,
  onRequestOptions as optionsLoomRush,
  onRequestPost as postLoomRush,
} from '../../src/lib/mcp/loom-rush-mcp.mjs';

export const onRequestGet: PagesFunction = (context) => getLoomRush(context);
export const onRequestOptions: PagesFunction = (context) => optionsLoomRush(context);
export const onRequestPost: PagesFunction = (context) => postLoomRush(context);
