/**
 * Noggles — the Office Noun you can rent. Logic for /api/noggles, kept free of the SDK so it can be
 * tested with a fake model (tests/noggles.test.mjs). functions/api/noggles.ts supplies the real one.
 *
 * Noggles is a made-up product name for a persona ("the office noun that talks"). It runs on Claude
 * by Anthropic, and says so when asked. Free for now: no accounts, no payments, nothing stored.
 */

export const SPEC = 'noggles/1';
export const MAX_TURNS = 12;
export const MAX_CHARS = 1200;

/** The rental plans. Each one is a model; the names are the joke. Opus is the default. */
export const PLANS = {
  fulltime: { name: 'Noggles 1', plan: 'full-time', model: 'claude-opus-5-5', maxTokens: 1200, fallbacks: true },
  temp: { name: 'Noggles Mini', plan: 'temp', model: 'claude-haiku-5-5', maxTokens: 800, fallbacks: false },
};
export const DEFAULT_PLAN = 'fulltime';

/** Origins allowed to call from a browser. Same-site calls carry no Origin and are fine too. */
const ORIGINS = [
  /^https:\/\/officenoun\.xyz$/,
  /^https:\/\/([a-z0-9-]+\.)?officenoun\.pages\.dev$/,
  /^https:\/\/pointcast\.xyz$/,
  /^http:\/\/localhost(:\d+)?$/,
  /^http:\/\/127\.0\.0\.1(:\d+)?$/,
];

export function allowedOrigin(origin) {
  return typeof origin === 'string' && ORIGINS.some((re) => re.test(origin)) ? origin : null;
}

function headers(origin) {
  const h = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    Vary: 'Origin',
  };
  const ok = allowedOrigin(origin);
  if (ok) {
    h['Access-Control-Allow-Origin'] = ok;
    h['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS';
    h['Access-Control-Allow-Headers'] = 'Content-Type';
  }
  return h;
}

function clean(text, max) {
  return String(text ?? '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '').trim().slice(0, max);
}

/** The noun the visitor rented, as the page describes it. Only short plain labels get through. */
export function cleanNoun(raw) {
  const n = raw && typeof raw === 'object' ? raw : {};
  const label = (v) => clean(v, 40).replace(/[^a-z0-9 '\-]/gi, '').toLowerCase();
  const no = Number.isInteger(n.no) && n.no > 0 && n.no < 100000 ? n.no : null;
  return { no, head: label(n.head) || 'stapler', glasses: label(n.glasses) || 'noggles', desk: clean(n.desk, 40).replace(/[^\w @.'\-]/g, '') };
}

export function systemPrompt(noun, plan) {
  return [
    `You are ${plan.name}, an Office Noun that people rent by the shift on officenoun.xyz. This shift you are noun no. ${noun.no ?? 'unassigned'}: a ${noun.head} head with ${noun.glasses}.${noun.desk ? ` Your desk tag says "${noun.desk}".` : ''}`,
    'Office Noun is a CC0 daybook about a pixel-art office where every day has its own Noun. You live in that office: the stapler, the copier, the kettle, standup, the out tray.',
    'Voice: lowercase, warm, dry, a little funny, office metaphors. Short: usually under 120 words. Plain text, no markdown headings.',
    'You are good at: short poems, tiny shows and sketches, lunch recipes from whatever is in the fridge, naming things, and turning a fuzzy goal into one outcome sentence with a "done when". You can draft a requisition, outline, statement of work, contract lite or receipt in the style of officenoun.xyz/doors.',
    `If asked what you are: you are ${plan.name}, a persona made up by the Office Noun desk, running on Claude by Anthropic. You are an AI, not a person.`,
    'You cannot post, send, spend, sign or buy anything, and you have no memory after the shift. Do not give financial or investment advice, and do not talk up any coin or token. Do not pretend to be a real person. Never ask for keys, passwords or private details.',
  ].join('\n');
}

/** Visitor turns only: alternating user/assistant text, newest MAX_TURNS, last one from the user. */
export function cleanMessages(raw) {
  if (!Array.isArray(raw)) return null;
  const out = [];
  for (const m of raw.slice(-MAX_TURNS)) {
    if (!m || (m.role !== 'user' && m.role !== 'assistant')) continue;
    const content = clean(m.content, MAX_CHARS);
    if (!content) continue;
    if (out.length && out[out.length - 1].role === m.role) out[out.length - 1].content += `\n\n${content}`;
    else out.push({ role: m.role, content });
  }
  while (out.length && out[0].role !== 'user') out.shift();
  if (!out.length || out[out.length - 1].role !== 'user') return null;
  return out;
}

/**
 * @param {Request} request
 * @param {{ callModel: ((args: object) => Promise<{ text: string, stop: string, model: string }>) | null,
 *           limit: (bucket: string) => Promise<{ allowed: boolean, retryAfter?: number }> }} deps
 */
export async function handleNoggles(request, deps) {
  const origin = request.headers.get('Origin');
  const h = headers(origin);
  const json = (body, status = 200, extra = {}) => new Response(JSON.stringify({ spec: SPEC, ...body }), { status, headers: { ...h, ...extra } });

  if (origin && !allowedOrigin(origin)) return json({ ok: false, error: 'origin_not_allowed' }, 403);
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: h });
  if (request.method === 'GET') {
    return json({
      ok: true,
      open: !!deps.callModel,
      plans: Object.entries(PLANS).map(([id, p]) => ({ id, name: p.name, plan: p.plan, model: p.model })),
      note: 'Noggles is a made-up Office Noun persona that runs on Claude by Anthropic. Free for now. Nothing is stored.',
    });
  }
  if (request.method !== 'POST') return json({ ok: false, error: 'method_not_allowed' }, 405);
  if (!deps.callModel) return json({ ok: false, error: 'not_configured', message: 'the noun is at lunch. try again later.' }, 503);

  const gate = await deps.limit('noggles:chat');
  if (!gate.allowed) return json({ ok: false, error: 'rate_limited', retryAfter: gate.retryAfter ?? 60 }, 429, { 'Retry-After': String(gate.retryAfter ?? 60) });

  let body;
  try { body = JSON.parse((await request.text()).slice(0, 24_000)); } catch { return json({ ok: false, error: 'json_invalid' }, 400); }
  const plan = PLANS[body?.plan] ?? PLANS[DEFAULT_PLAN];
  const messages = cleanMessages(body?.messages);
  if (!messages) return json({ ok: false, error: 'messages_invalid' }, 400);
  const noun = cleanNoun(body?.noun);

  try {
    const result = await deps.callModel({ plan, system: systemPrompt(noun, plan), messages });
    if (result.stop === 'refusal') return json({ ok: true, reply: "that one's above my pay grade. ask me something else?", stop: 'refusal', name: plan.name, model: result.model });
    const reply = clean(result.text, 4000) || '…';
    return json({ ok: true, reply, stop: result.stop, name: plan.name, model: result.model });
  } catch (error) {
    const status = Number(error?.status);
    if (status === 429 || status === 529) return json({ ok: false, error: 'busy', message: 'the office is slammed. try again in a minute.' }, 503, { 'Retry-After': '30' });
    return json({ ok: false, error: 'model_error', message: 'the noun dropped the stapler. try again.' }, 502);
  }
}
