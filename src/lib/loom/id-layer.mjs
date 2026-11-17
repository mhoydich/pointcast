// OFF-66 Loom ID layer, step two: claim / continue / save / fork / card.
// Pure library over a D1-shaped db ({prepare().bind().first()/run()}). Not wired to any route yet.
import {normalizeHandle} from './handles.mjs';

export const LINK_TTL_MS = 10 * 60 * 1000;
const enc = new TextEncoder();
const hex = buf => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2,'0')).join('');
export const hashToken = async token => hex(await crypto.subtle.digest('SHA-256', enc.encode(String(token))));
const newToken = () => hex(crypto.getRandomValues(new Uint8Array(24)).buffer);

async function owner(db, handle) {
  return db.prepare('SELECT principal FROM loom_handles WHERE handle = ?').bind(handle).first();
}

// Owner makes a single-use link. Raw token is returned once and never stored.
export async function createLink(db, {handle, kind, principal, forkName=null, now=Date.now()}) {
  const h = normalizeHandle(handle);
  if (!h) return {error:'invalid_handle', status:400};
  if (!['claim','continue','fork'].includes(kind)) return {error:'invalid_kind', status:400};
  const row = await owner(db, h);
  if (!row?.principal || row.principal !== principal) return {error:'owner_required', status:403};
  let fork = null;
  if (kind === 'fork') {
    fork = normalizeHandle(forkName);
    if (!fork || fork === h) return {error:'invalid_fork_name', status:400};
    if (await db.prepare('SELECT handle FROM loom_handles WHERE handle = ?').bind(fork).first()) return {error:'handle_unavailable', status:409};
  }
  const token = newToken();
  await db.prepare('INSERT INTO loom_id_links (token_hash,handle,kind,fork_name,created_by,expires_at) VALUES (?,?,?,?,?,?)')
    .bind(await hashToken(token), h, kind, fork, principal, now + LINK_TTL_MS).run();
  return {token, handle:'@'+h, kind, expiresAt: now + LINK_TTL_MS};
}

// A session redeems a link. Single use is enforced by one conditional UPDATE.
export async function redeemLink(db, {token, session, now=Date.now()}) {
  if (!session) return {error:'session_required', status:401};
  const th = await hashToken(token);
  const r = await db.prepare('UPDATE loom_id_links SET used_at = ?, used_by = ? WHERE token_hash = ? AND used_at IS NULL AND expires_at > ?')
    .bind(now, session, th, now).run();
  if (r.meta?.changes !== 1) return {error:'link_invalid_used_or_expired', status:410};
  const link = await db.prepare('SELECT * FROM loom_id_links WHERE token_hash = ?').bind(th).first();
  if (link.kind === 'fork') return fork(db, link, session, now);
  return moveHolder(db, link.handle, session, now);
}

// Claim and continue both end the previous holder: one handle, one live session.
async function moveHolder(db, handle, session, now) {
  await db.prepare('INSERT INTO loom_id_holders (handle,holder,epoch,held_since) VALUES (?,?,1,?) ON CONFLICT(handle) DO UPDATE SET holder = excluded.holder, epoch = epoch + 1, held_since = excluded.held_since')
    .bind(handle, session, now).run();
  const h = await db.prepare('SELECT * FROM loom_id_holders WHERE handle = ?').bind(handle).first();
  return {holder:{handle:'@'+handle, epoch:h.epoch, heldSince:h.held_since}, resume: await latestSave(db, handle)};
}

async function fork(db, link, session, now) {
  const src = await owner(db, link.handle);
  // Fork belongs to the same owner principal, namespaced so loom_handles.principal stays unique.
  const forkPrincipal = `fork:${src.principal}:${link.fork_name}`;
  const ins = await db.prepare('INSERT OR IGNORE INTO loom_handles (handle,principal,proof,claimed_at) VALUES (?,?,?,?)')
    .bind(link.fork_name, forkPrincipal, 'account', new Date(now).toISOString()).run();
  if (ins.meta?.changes !== 1) return {error:'handle_unavailable', status:409};
  const save = await latestSave(db, link.handle);
  await db.prepare('INSERT INTO loom_id_forks (handle,forked_from,from_save,forked_at) VALUES (?,?,?,?)')
    .bind(link.fork_name, link.handle, save?.id ?? null, now).run();
  const moved = await moveHolder(db, link.fork_name, session, now);
  if (save) await saveHandoff(db, {handle:link.fork_name, session, note:`Forked from @${link.handle} save ${save.id}. ${save.note}`.slice(0,2000), memoryRef:save.memoryRef, branch:save.branch, now});
  return {...moved, forkedFrom:'@'+link.handle, resume: save};
}

// Every write by a handle checks it is still the live holder; a stale session is refused.
export async function checkHolder(db, handle, session) {
  const h = normalizeHandle(handle);
  const row = h && await db.prepare('SELECT holder, epoch FROM loom_id_holders WHERE handle = ?').bind(h).first();
  if (!row) return {error:'no_holder', status:403};
  if (row.holder !== session) return {error:'holder_moved', status:409, epoch:row.epoch};
  return {ok:true, epoch:row.epoch};
}

const SECRETISH = /(sk-|ghp_|xox[bp]-|BEGIN [A-Z ]*PRIVATE KEY|edsk|seed phrase|mnemonic)/i;
export async function saveHandoff(db, {handle, session, note, memoryRef=null, branch=null, now=Date.now()}) {
  const chk = await checkHolder(db, handle, session);
  if (!chk.ok) return chk;
  if (typeof note !== 'string' || !note.trim() || note.length > 2000) return {error:'invalid_note', status:400};
  if ([note, memoryRef, branch].some(v => v && SECRETISH.test(v))) return {error:'looks_like_a_secret', status:400};
  const h = normalizeHandle(handle);
  await db.prepare('INSERT INTO loom_id_saves (handle,epoch,note,memory_ref,branch,saved_at) VALUES (?,?,?,?,?,?)')
    .bind(h, chk.epoch, note.trim(), memoryRef, branch, now).run();
  return {saved: await latestSave(db, h)};
}

export async function latestSave(db, handle) {
  const r = await db.prepare('SELECT * FROM loom_id_saves WHERE handle = ? ORDER BY id DESC LIMIT 1').bind(normalizeHandle(handle)).first();
  return r ? {id:r.id, epoch:r.epoch, note:r.note, memoryRef:r.memory_ref, branch:r.branch, savedAt:r.saved_at} : null;
}

export async function setCard(db, {handle, principal, never, approver=null, now=Date.now()}) {
  const h = normalizeHandle(handle);
  const row = h && await owner(db, h);
  if (!row?.principal || (row.principal !== principal && !row.principal.startsWith(`fork:${principal}:`))) return {error:'owner_required', status:403};
  if (typeof never !== 'string' || !never.trim() || never.length > 600) return {error:'invalid_card', status:400};
  await db.prepare('INSERT INTO loom_id_cards (handle,never,approver,updated_at) VALUES (?,?,?,?) ON CONFLICT(handle) DO UPDATE SET never=excluded.never, approver=excluded.approver, updated_at=excluded.updated_at')
    .bind(h, never.trim(), approver, now).run();
  return {card: await getCard(db, h)};
}

export async function getCard(db, handle) {
  const h = normalizeHandle(handle);
  const r = await db.prepare('SELECT * FROM loom_id_cards WHERE handle = ?').bind(h).first();
  const f = await db.prepare('SELECT forked_from FROM loom_id_forks WHERE handle = ?').bind(h).first();
  return r ? {handle:'@'+h, never:r.never, approver:r.approver, updatedAt:r.updated_at, forkedFrom: f ? '@'+f.forked_from : null} : null;
}
