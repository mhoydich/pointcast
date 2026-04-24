const RECOGNIZED = {
  'tz2FjJhB1gb9Xc2qNB7QgFkdBZkGCCRMxdFw': 'mike',
} as const;

type Identity = (typeof RECOGNIZED)[keyof typeof RECOGNIZED] | 'visitor' | null;

function json(data: {
  ok: boolean;
  addr: string | null;
  recognized: boolean;
  identity: Identity;
  hint: string;
}): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Cache-Control': 'no-store',
    },
  });
}

export const onRequest: PagesFunction = async ({ request }) => {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'no-store',
      },
    });
  }

  const addr = new URL(request.url).searchParams.get('addr');
  const recognized = Boolean(addr && addr in RECOGNIZED);
  const identity: Identity = !addr ? null : recognized ? RECOGNIZED[addr as keyof typeof RECOGNIZED] : 'visitor';
  const hint = !addr
    ? 'no wallet sent'
    : recognized
      ? 'hi mike'
      : "hi visitor (wallet seen but not Mike's primary)";

  return json({
    ok: true,
    addr,
    recognized,
    identity,
    hint,
  });
};
