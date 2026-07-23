import { authJson, readSessionFromRequest, type AuthEnv } from './session';

const TICKET_PREFIX = 'project-ticket:';
const TICKET_TTL_SECONDS = 120;
const PROJECTS: Record<string, string> = {
  'network-el-segundo': 'https://network-el-segundo.mhoydich.chatgpt.site',
};

type Ticket = {
  target: string;
  address: string;
  issuedAt: string;
};

function validReturnTo(target: string, returnTo: string): string | null {
  const allowedOrigin = PROJECTS[target];
  if (!allowedOrigin) return null;
  try {
    const url = new URL(returnTo);
    if (url.origin !== allowedOrigin || url.pathname !== '/') return null;
    return url.toString();
  } catch {
    return null;
  }
}

export const onRequestPost: PagesFunction<AuthEnv> = async ({ request, env }) => {
  if (!env.USERS) return authJson({ ok: false, reason: 'kv-not-bound' }, { status: 500 });
  const current = await readSessionFromRequest(request, env);
  if (!current) return authJson({ ok: false, reason: 'unauthorized' }, { status: 401 });

  let body: { target?: unknown; returnTo?: unknown; address?: unknown };
  try {
    body = await request.json() as typeof body;
  } catch {
    return authJson({ ok: false, reason: 'bad-body' }, { status: 400 });
  }
  const target = typeof body.target === 'string' ? body.target : '';
  const returnTo = typeof body.returnTo === 'string' ? validReturnTo(target, body.returnTo) : null;
  if (!returnTo) return authJson({ ok: false, reason: 'target-not-allowed' }, { status: 400 });

  const tezosIdentities = current.user.identities.filter((item) => item.provider === 'kukai');
  const requestedAddress = typeof body.address === 'string' ? body.address.trim() : '';
  if (requestedAddress && !tezosIdentities.some((item) => item.id === requestedAddress)) {
    return authJson({ ok: false, reason: 'tezos-identity-not-linked' }, { status: 403 });
  }
  const identity = requestedAddress
    ? tezosIdentities.find((item) => item.id === requestedAddress)
    : tezosIdentities.at(-1);
  if (!identity) return authJson({ ok: false, reason: 'tezos-identity-required' }, { status: 403 });

  const code = `pct_${crypto.randomUUID().replaceAll('-', '')}${crypto.randomUUID().replaceAll('-', '')}`;
  const ticket: Ticket = { target, address: identity.id, issuedAt: new Date().toISOString() };
  await env.USERS.put(`${TICKET_PREFIX}${code}`, JSON.stringify(ticket), { expirationTtl: TICKET_TTL_SECONDS });
  const destination = new URL(returnTo);
  destination.searchParams.set('pointcast_code', code);
  return authJson({ ok: true, destination: destination.toString() });
};

export const onRequestDelete: PagesFunction<AuthEnv> = async ({ request, env }) => {
  if (!env.USERS) return authJson({ ok: false, reason: 'kv-not-bound' }, { status: 500 });
  let body: { code?: unknown; target?: unknown };
  try {
    body = await request.json() as typeof body;
  } catch {
    return authJson({ ok: false, reason: 'bad-body' }, { status: 400 });
  }
  const code = typeof body.code === 'string' ? body.code : '';
  const target = typeof body.target === 'string' ? body.target : '';
  if (!/^pct_[a-f0-9]{64}$/.test(code) || !PROJECTS[target]) {
    return authJson({ ok: false, reason: 'bad-ticket' }, { status: 400 });
  }
  const key = `${TICKET_PREFIX}${code}`;
  const raw = await env.USERS.get(key);
  if (!raw) return authJson({ ok: false, reason: 'ticket-expired-or-used' }, { status: 401 });
  await env.USERS.delete(key);
  let ticket: Ticket;
  try {
    ticket = JSON.parse(raw) as Ticket;
  } catch {
    return authJson({ ok: false, reason: 'bad-ticket' }, { status: 400 });
  }
  if (ticket.target !== target || Date.now() - Date.parse(ticket.issuedAt) > TICKET_TTL_SECONDS * 1000) {
    return authJson({ ok: false, reason: 'ticket-expired-or-used' }, { status: 401 });
  }
  return authJson({ ok: true, address: ticket.address, target: ticket.target });
};
