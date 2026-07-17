interface Env {
  PC_STUDIO_KV?: KVNamespace;
}

type Composition = {
  kind: 'postcard' | 'stamp';
  workId: string;
  owner: string;
  title: string;
  message: string;
  credit: string;
  accent: string;
  crop: number;
  shape: 'rectangle' | 'rounded' | 'circle';
};

const WORK_ID = /^\d{3}-[0-9a-f]{12}$/;
const TEZOS_ADDRESS = /^tz[1-4][1-9A-HJ-NP-Za-km-z]{33}$/;
const ACCENTS = new Set(['acid', 'blue', 'red', 'paper', 'black']);
const SHAPES = new Set(['rectangle', 'rounded', 'circle']);

function clean(value: unknown, max: number) {
  return typeof value === 'string'
    ? value.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max)
    : '';
}

function json(value: unknown, status = 200) {
  return new Response(JSON.stringify(value), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
    },
  });
}

function canonical(value: Composition) {
  return JSON.stringify({
    accent: value.accent,
    credit: value.credit,
    crop: value.crop,
    kind: value.kind,
    message: value.message,
    owner: value.owner,
    shape: value.shape,
    title: value.title,
    workId: value.workId,
  });
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const length = Number(request.headers.get('content-length') || 0);
  if (length > 8_192) return json({ error: 'request-too-large' }, 413);

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'invalid-json' }, 400);
  }

  const kind = body.kind === 'stamp' ? 'stamp' : body.kind === 'postcard' ? 'postcard' : null;
  const workId = clean(body.workId, 32);
  const owner = clean(body.owner, 40);
  if (!kind || !WORK_ID.test(workId) || !TEZOS_ADDRESS.test(owner)) {
    return json({ error: 'invalid-composition' }, 400);
  }

  const composition: Composition = {
    kind,
    workId,
    owner,
    title: clean(body.title, 72) || (kind === 'stamp' ? 'STAMPZ / EL SEGUNDO' : 'POSTCARD / EL SEGUNDO'),
    message: clean(body.message, 180),
    credit: clean(body.credit, 72) || 'MICHAEL HOYDICH · THE EL SEGUNDO SCHOOL',
    accent: ACCENTS.has(clean(body.accent, 12)) ? clean(body.accent, 12) : 'acid',
    crop: Math.max(0, Math.min(100, Math.round(Number(body.crop) || 50))),
    shape: SHAPES.has(clean(body.shape, 12)) ? clean(body.shape, 12) as Composition['shape'] : 'rectangle',
  };

  const bytes = new TextEncoder().encode(canonical(composition));
  const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), (byte) =>
    byte.toString(16).padStart(2, '0')
  ).join('');
  const id = hash.slice(0, 24);
  const stored = Boolean(env.PC_STUDIO_KV);
  if (env.PC_STUDIO_KV) {
    await env.PC_STUDIO_KV.put(`ess:composition:${id}`, JSON.stringify({
      ...composition,
      id,
      schema: 'pointcast.el-segundo-school.composition.v1',
      createdAt: new Date().toISOString(),
    }));
  }

  const origin = new URL(request.url).origin;
  return json({
    id,
    stored,
    artifactUri: `${origin}/api/el-segundo-school/render/${id}.svg`,
    metadataUri: `${origin}/api/el-segundo-school/metadata/${id}.json`,
  }, stored ? 201 : 503);
};
