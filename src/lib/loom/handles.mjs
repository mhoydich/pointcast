import {addressKey} from './address.mjs';
const RESERVED = new Set(['collator','admin','administrator','support','pointcast','mike','ada','astra','sid','tess','lou','loom','loomdesk','loomcheck','shwa']);
export const normalizeHandle = value => typeof value === 'string' && /^@?[a-z0-9][a-z0-9_.-]{0,31}$/i.test(value)
  ? value.replace(/^@/,'').toLowerCase() : null;
export const publicClaim = row => row?.principal ? {handle:'@'+row.handle,proof:row.proof,claimedAt:row.claimed_at} : null;
// All authority reads begin on the primary, not a potentially stale D1 replica.
export const primary = db => db.withSession ? db.withSession('first-primary') : db;
export async function ownClaim(db, principal) {
  return publicClaim(await db.prepare('SELECT * FROM loom_handles WHERE principal = ?').bind(principal).first());
}
export async function claimHandle(db, kv, input, principal, proof, now=new Date().toISOString()) {
  const handle=normalizeHandle(input);
  if(!handle)return {error:'invalid_handle',status:400};
  const policy=await db.prepare('SELECT legacy_ready FROM loom_handle_policy WHERE id = 1').first();
  if(policy?.legacy_ready!==1)return {error:'legacy_reservation_review_required',status:503};
  const existing=await db.prepare('SELECT * FROM loom_handles WHERE handle = ?').bind(handle).first();
  if(existing)return existing.principal===principal ? {claim:publicClaim(existing)} : {error:'handle_unavailable',status:409};
  if(RESERVED.has(handle))return {error:'handle_reserved',status:409};
  if(!kv)return {error:'history_unavailable',status:503};
  // No adoption of historical unsigned names, even when their messages were trimmed.
  const key=await addressKey('@'+handle);
  if(await db.prepare('SELECT address_key FROM loom_handle_legacy_keys WHERE address_key = ?').bind(key).first())return {error:'existing_handle_needs_recovery',status:409};
  const [log,out]=await Promise.all([kv.get('loom:log:'+key),kv.get('loom:out:'+key)]);
  if(log || out)return {error:'existing_handle_needs_recovery',status:409};
  await db.prepare('INSERT OR IGNORE INTO loom_handles (handle,principal,proof,claimed_at) VALUES (?,?,?,?)').bind(handle,principal,proof,now).run();
  const row=await db.prepare('SELECT * FROM loom_handles WHERE handle = ?').bind(handle).first();
  return row?.principal===principal ? {claim:publicClaim(row)} : {error:'handle_or_principal_unavailable',status:409};
}
export async function authorizeHandle(db, from, rawAddress, principal, fingerprint=null, now=Date.now()) {
  const effective = typeof rawAddress==='string' && rawAddress.trim().startsWith('@') ? rawAddress.trim() :
    from.address || '@'+(from.name.toLowerCase().replace(/[^a-z0-9_.-]+/g,'-').replace(/^-+|-+$/g,'').slice(0,32)||'anon');
  if(!effective.startsWith('@'))return {from};
  const handle=normalizeHandle(effective);
  if(!handle)return {error:'invalid_handle',status:400};
  // Guest first use and authenticated claims contend on the same UNIQUE key.
  await db.prepare('INSERT OR IGNORE INTO loom_handles (handle,principal,proof,claimed_at) VALUES (?,NULL,NULL,NULL)').bind(handle).run();
  const row=await db.prepare('SELECT * FROM loom_handles WHERE handle = ?').bind(handle).first();
  if(!row)return {error:'claim_store_unavailable',status:503};
  if(!row.principal)return {from};
  if(row.principal!==principal)return {error:'claimed_handle_requires_owner',status:403};
  if(row.proof==='agent_key') {
    if(!fingerprint)return {error:'agent_proof_required',status:401};
    await db.prepare('DELETE FROM loom_handle_requests WHERE expires_at < ?').bind(now).run();
    const used=await db.prepare('INSERT OR IGNORE INTO loom_handle_requests (fingerprint,expires_at) VALUES (?,?)').bind(fingerprint,now+11*60*1000).run();
    if(used.meta?.changes!==1)return {error:'claimed_request_replayed',status:409};
  }
  return {from:{...from,address:'@'+handle,claimed:publicClaim(row)}};
}

export async function reserveDestinations(db, addresses) {
  for(const address of addresses) {
    if(!address.startsWith('@'))continue;
    const handle=normalizeHandle(address);if(!handle)continue;
    await db.prepare('INSERT OR IGNORE INTO loom_handles (handle,principal,proof,claimed_at) VALUES (?,NULL,NULL,NULL)').bind(handle).run();
  }
}
