export const MAX_PASSAGES = 200;
export const MAX_NAME_LENGTH = 32;
export const MAX_TEXT_LENGTH = 3000;
export const MAX_BODY_BYTES = 12_000;

export const ROOM_ID_PATTERN = /^[0-9a-f]{32}$/;
const CLIENT_ID_PATTERN = /^(?:[0-9a-f]{32}|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;

// Cloudflare may expose an origin ETag as weak (W/"1") even when the room
// returns it as strong ("1"). If-None-Match uses weak comparison for GET.
export function matchesIfNoneMatch(header: string | null, etag: string): boolean {
  if (!header) return false;
  return header.split(',').some(value => {
    const candidate = value.trim();
    return candidate === etag || candidate === `W/${etag}`;
  });
}

export interface PassageInput {
  name: string;
  text: string;
  clientId: string;
}

export function parsePassageInput(value: unknown): PassageInput | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const input = value as Record<string, unknown>;
  if (typeof input.name !== 'string' || typeof input.text !== 'string' || typeof input.clientId !== 'string') return null;
  const name = input.name.trim() || 'Guest';
  const text = input.text;
  const clientId = input.clientId;
  if (name.length > MAX_NAME_LENGTH || !text.trim() || text.length > MAX_TEXT_LENGTH || !CLIENT_ID_PATTERN.test(clientId)) return null;
  return { name, text, clientId: clientId.toLowerCase() };
}
