/**
 * /api/sensory-mcp — Sensory & Haptics MCP server.
 *
 * Spec: pointcast.sensory.mcp/v1
 * Transport matches /api/mcp: GET is a discovery page, POST is stateless
 * JSON-RPC 2.0, OPTIONS answers CORS. Protocol version 2025-06-18.
 *
 * Sound and haptics are off unless a tool argument is the boolean true.
 * The handler returns recipes. It does not play audio, vibrate a device,
 * or write storage.
 */
import { MCP_PROTOCOL_VERSION, handleSensoryRpc, renderDiscovery } from '../../src/lib/mcp/sensory-mcp.mjs';

const MAX_BODY = 16_384;

const JSON_HEADERS: Record<string, string> = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store',
  'MCP-Protocol-Version': MCP_PROTOCOL_VERSION,
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Accept, Authorization, Content-Type, Last-Event-ID, Mcp-Session-Id, MCP-Protocol-Version, X-Yard-Resident',
  'Access-Control-Expose-Headers': 'Mcp-Session-Id, MCP-Protocol-Version',
};

type RpcId = number | string | null;

function rpcResult(id: RpcId, result: unknown): Response {
  return new Response(JSON.stringify({ jsonrpc: '2.0', id, result }), {
    headers: JSON_HEADERS,
  });
}

function rpcError(id: RpcId, code: number, message: string): Response {
  return new Response(JSON.stringify({ jsonrpc: '2.0', id, error: { code, message } }), {
    headers: JSON_HEADERS,
  });
}

function idOf(message: unknown): RpcId {
  if (!message || typeof message !== 'object' || Array.isArray(message)) return null;
  const id = (message as { id?: unknown }).id;
  if (typeof id === 'string' || typeof id === 'number') return id;
  return null;
}

export const onRequestGet = async ({ request }: { request: Request }) => {
  return new Response(renderDiscovery(request.url), {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
      'MCP-Protocol-Version': MCP_PROTOCOL_VERSION,
    },
  });
};

export const onRequestOptions = () =>
  new Response(null, { status: 204, headers: { ...JSON_HEADERS, 'Access-Control-Max-Age': '86400' } });

export const onRequestPost = async ({ request }: { request: Request }) => {
  const declared = Number(request.headers.get('content-length') || 0);
  if (Number.isFinite(declared) && declared > MAX_BODY) return rpcError(null, -32600, 'invalid request');

  let raw = '';
  try {
    raw = await request.text();
  } catch {
    return rpcError(null, -32700, 'parse error');
  }
  if (raw.length > MAX_BODY) return rpcError(null, -32600, 'invalid request');

  let message: unknown;
  try {
    message = JSON.parse(raw);
  } catch {
    return rpcError(null, -32700, 'parse error');
  }

  try {
    const out = handleSensoryRpc(message);
    if (out.kind === 'empty') return new Response(null, { status: 204, headers: JSON_HEADERS });
    if (out.kind === 'error') return rpcError(out.id, out.code, out.message);
    return rpcResult(out.id, out.result);
  } catch {
    return rpcError(idOf(message), -32603, 'internal error');
  }
};
