import { createHash } from 'node:crypto';

export function strongEtag(body: string): string {
  const digest = createHash('sha256').update(body).digest('base64url');
  return `"sha256-${digest}"`;
}

function parseIfNoneMatch(headerValue: string | null): string[] {
  if (!headerValue) return [];
  if (headerValue.trim() === '*') return ['*'];
  return headerValue
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}

function parseHttpDate(headerValue: string | null): number | null {
  if (!headerValue) return null;
  const ms = Date.parse(headerValue);
  return Number.isFinite(ms) ? ms : null;
}

type ConditionalResponseArgs = {
  request: Request;
  body: string;
  contentType: string;
  cacheControl: string;
  headers?: HeadersInit;
  lastModified: Date;
};

export function respondWithConditionalCache(args: ConditionalResponseArgs): Response {
  const etag = strongEtag(args.body);
  const lastModifiedValue = args.lastModified.toUTCString();

  const responseHeaders = new Headers(args.headers);
  responseHeaders.set('Content-Type', args.contentType);
  responseHeaders.set('Cache-Control', args.cacheControl);
  responseHeaders.set('ETag', etag);
  responseHeaders.set('Last-Modified', lastModifiedValue);

  const ifNoneMatch = parseIfNoneMatch(args.request.headers.get('If-None-Match'));
  if (ifNoneMatch.includes('*') || ifNoneMatch.includes(etag)) {
    return new Response(null, { status: 304, headers: responseHeaders });
  }

  const ifModifiedSince = parseHttpDate(args.request.headers.get('If-Modified-Since'));
  if (ifModifiedSince !== null && args.lastModified.getTime() <= ifModifiedSince) {
    return new Response(null, { status: 304, headers: responseHeaders });
  }

  return new Response(args.body, { status: 200, headers: responseHeaders });
}

