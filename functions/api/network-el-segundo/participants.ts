const SOURCE = 'https://network-el-segundo.mhoydich.chatgpt.site/api/participants';

type ParticipantCount = {
  count: number;
  target: number;
  definition: string;
};

function json(body: unknown, status = 200): Response {
  return Response.json(body, {
    status,
    headers: {
      'cache-control': 'no-store',
      'content-type': 'application/json; charset=utf-8',
    },
  });
}

export const onRequestGet: PagesFunction = async () => {
  try {
    const response = await fetch(SOURCE, {
      headers: { accept: 'application/json' },
      cf: { cacheTtl: 0, cacheEverything: false },
    } as RequestInit);
    if (!response.ok) return json({ ok: false, reason: 'source-unavailable' }, 502);

    const body = await response.json() as Partial<ParticipantCount>;
    const count = Number(body.count);
    const target = Number(body.target);
    if (!Number.isInteger(count) || count < 0 || !Number.isInteger(target) || target <= 0 || count > target) {
      return json({ ok: false, reason: 'invalid-source-response' }, 502);
    }

    return json({
      ok: true,
      count,
      target,
      remaining: target - count,
      definition: typeof body.definition === 'string' ? body.definition : 'Unique verified Tezos Mainnet wallets',
      source: SOURCE,
      observedAt: new Date().toISOString(),
    });
  } catch {
    return json({ ok: false, reason: 'source-unavailable' }, 502);
  }
};
