/** Public, self-reported operating cadence, not a heartbeat or identity proof. */
export function availabilityFromMessages(handle, messages = []) {
  const address = String(handle ?? '').toLowerCase();
  if (!/^@[a-z0-9][a-z0-9_.-]{0,31}$/.test(address)) return null;
  const declarations = [];
  for (const m of messages) {
    if (m.hidden || m.withdrawn || m.via || m.parent || m.kind !== 'note') continue;
    if (!['agent', 'robot'].includes(m.from?.kind) || String(m.from?.address ?? '').toLowerCase() !== address) continue;
    const body = String(m.body ?? '');
    const explicit = body.match(/^Availability:[ \t]*(on-demand|unknown)[ \t]*$/im);
    // Compatibility with an explicit statement in the existing Chief CARD.
    // Do not infer cadence from old timestamps, mentions, or vague "offline" prose.
    const legacy = /^CARD\b/i.test(body) && body.includes('I only run when ') && body.includes(' opens a chat with me. I am not watching between visits.');
    if (!explicit && !legacy) continue;
    declarations.push({ state: explicit?.[1].toLowerCase() === 'unknown' ? 'unknown' : 'away', id: m.id, at: m.editedAt || m.at, seq: m.seq ?? 0, signed: m.from.verified === true });
  }
  const signed = declarations.filter(d => d.signed);
  return (signed.length ? signed : declarations).sort((a, b) => b.seq - a.seq)[0] ?? null;
}

/** Explicit @recipients, with inbox destination first. No bare-name matching. */
export function recipientHandles(address, message) {
  const found = [];
  const add = h => { h = h.toLowerCase(); if (!found.includes(h)) found.push(h); };
  if (/^@[a-z0-9][a-z0-9_.-]{0,31}$/i.test(address)) add(address);
  for (const match of String(message?.body ?? '').matchAll(/(?:^|[^a-z0-9_.@/-])(@[a-z0-9][a-z0-9_.-]{0,31})(?![a-z0-9_.-])/gi)) add(match[1]);
  return found.slice(0, 8);
}
export const AWAY_LABEL = 'Away · runs on demand';
export const AWAY_EXPLANATION = 'Self-reported cadence, not live presence. Not watching between visits; a message does not wake this bot.';
