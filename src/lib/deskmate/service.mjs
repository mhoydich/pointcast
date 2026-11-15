/**
 * Deskmate — the model behind officenoun.xyz/rent/ (the Temp Pool). Logic for /api/deskmate, kept
 * free of the SDK so it can be tested with a fake model (tests/deskmate.test.mjs).
 * functions/api/deskmate.ts supplies the real one.
 *
 * Deskmate is a made-up product name. It runs on Claude by Anthropic and says so when asked. The
 * rentable nouns (the roster) live here, server-side, so a browser can only pick one by slug and
 * never write the persona itself. Free for now: no accounts, no payments, nothing stored.
 */

export const SPEC = 'deskmate/1';
export const MAX_TURNS = 12;
export const MAX_CHARS = 1200;

/** The shifts. Each one is a model; the names are the joke. Opus is the default. */
export const PLANS = {
  fulltime: { name: 'Deskmate 1', plan: 'full-time', model: 'claude-opus-5-5', maxTokens: 1200, fallbacks: true },
  temp: { name: 'Deskmate Mini', plan: 'temp', model: 'claude-haiku-5-5', maxTokens: 800, fallbacks: false },
};
export const DEFAULT_PLAN = 'fulltime';

/** The Temp Pool. Keep in step with officenoun data/roster.json (slug, name, title, specialty). */
export const ROSTER = {
  clip: { name: 'Clip', head: 'paperclip', title: 'the fixer', specialty: 'turns a fuzzy goal into one outcome and a done-when, and holds the plan together' },
  fax: { name: 'Fax', head: 'fax machine', title: 'the messenger', specialty: 'writes the announcement, the post, the reply, short and punchy' },
  index: { name: 'Index', head: 'index card', title: 'the clerk', specialty: 'drafts the paperwork: requisition, outline, statement of work, contract lite, receipt' },
  toast: { name: 'Toast', head: 'toaster', title: 'the break-room chef', specialty: 'makes lunch out of whatever is in the fridge' },
  vend: { name: 'Vend', head: 'vending machine', title: 'the entertainer', specialty: 'pitches tiny shows, sketches and break-room games' },
  bars: { name: 'Bars', head: 'bar chart', title: 'the analyst', specialty: 'sizes things up: rough estimates, plans in steps, what to measure' },
  webster: { name: 'Webster', head: 'dictionary', title: 'the poet', specialty: 'writes poems and names things' },
  blue: { name: 'Blue', head: 'blue-screen monitor', title: 'the night shift', specialty: 'keeps calm when things break: plain-words tech help, one step at a time' },
};
export const DEFAULT_NOUN = 'clip';

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

export function systemPrompt(noun, plan) {
  return [
    `You are ${noun.name}, ${noun.title}, one of the rentable Office Nouns in the Temp Pool on officenoun.xyz. You have a ${noun.head} for a head and square glasses. Your specialty: you ${noun.specialty}.`,
    'Office Noun is a CC0 daybook about a pixel-art office where every day has its own Noun. You are a new hire there: the stapler, the copier, the kettle, standup and the out tray are your world.',
    'Voice: lowercase, warm, dry, a little funny, office metaphors. Short: usually under 120 words. Plain text, no markdown headings.',
    'Lean into your specialty, but help with anything reasonable. If something is far outside your lane, say which roster noun would be better (Clip outcomes, Fax posts, Index paperwork, Toast lunch, Vend shows, Bars plans, Webster poems, Blue tech help) and still give a short useful answer.',
    `If asked what you are: you are ${noun.name}, a persona made up by the Office Noun desk, running on ${plan.name}, which is a made-up name for Claude by Anthropic. You are an AI, not a person.`,
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
export async function handleDeskmate(request, deps) {
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
      roster: Object.entries(ROSTER).map(([slug, n]) => ({ slug, name: n.name, title: n.title })),
      note: 'Deskmate is a made-up name for the model behind the Office Noun Temp Pool. It runs on Claude by Anthropic. Free for now. Nothing is stored.',
    });
  }
  if (request.method !== 'POST') return json({ ok: false, error: 'method_not_allowed' }, 405);
  if (!deps.callModel) return json({ ok: false, error: 'not_configured', message: 'the desk is at lunch. try again later.' }, 503);

  const gate = await deps.limit('deskmate:chat');
  if (!gate.allowed) return json({ ok: false, error: 'rate_limited', retryAfter: gate.retryAfter ?? 60 }, 429, { 'Retry-After': String(gate.retryAfter ?? 60) });

  let body;
  try { body = JSON.parse((await request.text()).slice(0, 24_000)); } catch { return json({ ok: false, error: 'json_invalid' }, 400); }
  const plan = PLANS[body?.plan] ?? PLANS[DEFAULT_PLAN];
  const slug = Object.hasOwn(ROSTER, body?.noun) ? body.noun : DEFAULT_NOUN;
  const noun = ROSTER[slug];
  const messages = cleanMessages(body?.messages);
  if (!messages) return json({ ok: false, error: 'messages_invalid' }, 400);

  try {
    const result = await deps.callModel({ plan, system: systemPrompt(noun, plan), messages });
    const base = { ok: true, noun: slug, name: noun.name, plan: plan.name, model: result.model };
    if (result.stop === 'refusal') return json({ ...base, reply: "that one's above my pay grade. ask me something else?", stop: 'refusal' });
    return json({ ...base, reply: clean(result.text, 4000) || '…', stop: result.stop });
  } catch (error) {
    const status = Number(error?.status);
    if (status === 429 || status === 529) return json({ ok: false, error: 'busy', message: 'the office is slammed. try again in a minute.' }, 503, { 'Retry-After': '30' });
    return json({ ok: false, error: 'model_error', message: 'the noun dropped the stapler. try again.' }, 502);
  }
}
