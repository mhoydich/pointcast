/**
 * Fold a Loom op log into messages. Shared by the server (to answer reads) and
 * the /loom room (to scrub playback to any seq). The log is the truth; this is
 * a pure function of it, so "what did this thread look like at 4pm" is just
 * fold(ops, { until: seq }).
 *
 * Op kinds:
 *   append  a new message (optionally with parent → threaded reply)
 *   edit    the author rewrote a message; the history is kept for playback
 *   plus    +1 from someone
 *   vote    a choice on a poll gadget
 *   hide    moderation; the message stays in the log but is folded away
 */
export function fold(ops, { until = Infinity } = {}) {
  const byId = new Map();
  const order = [];
  const participants = new Map();
  for (const op of ops ?? []) {
    if (!op || op.seq > until) continue;
    if (op.op === 'append') {
      if (byId.has(op.id)) continue;
      const message = {
        id: op.id, seq: op.seq, at: op.at, from: op.from, kind: op.kind, body: op.body,
        media: op.media ?? null, cites: op.cites ?? [], parent: op.parent ?? null,
        confidence: op.confidence ?? null, via: op.via ?? null, links: op.links ?? null,
        poll: op.poll ? { question: op.poll.question, options: op.poll.options.map((label) => ({ label, votes: 0 })) } : null,
        tags: op.tags ?? [], mentions: op.mentions ?? [],
        edits: 0, editedAt: null, plus: 0, plusBy: [], hidden: false, depth: 0, replies: 0,
      };
      if (message.parent && byId.has(message.parent)) {
        const parent = byId.get(message.parent);
        parent.replies += 1;
        message.depth = Math.min(parent.depth + 1, 6);
      } else {
        message.parent = null;
      }
      byId.set(op.id, message);
      order.push(message);
      const who = op.from?.address || op.from?.name;
      if (who) {
        const p = participants.get(who) ?? { name: op.from.name, kind: op.from.kind, address: op.from.address ?? null, verified: !!op.from.verified, count: 0, lastAt: op.at };
        p.count += 1; p.lastAt = op.at; participants.set(who, p);
      }
      continue;
    }
    const message = byId.get(op.id);
    if (!message) continue;
    if (op.op === 'edit') { message.body = op.body; message.edits += 1; message.editedAt = op.at; }
    else if (op.op === 'plus') { if (!message.plusBy.includes(op.by)) { message.plusBy.push(op.by); message.plus += 1; } }
    else if (op.op === 'vote' && message.poll) {
      message.poll.voters ??= {};
      const previous = message.poll.voters[op.by];
      if (previous !== undefined) message.poll.options[previous].votes -= 1;
      if (message.poll.options[op.choice]) { message.poll.options[op.choice].votes += 1; message.poll.voters[op.by] = op.choice; }
    } else if (op.op === 'hide') { message.hidden = true; }
  }
  // Thread order: each root followed depth-first by its replies, oldest first.
  const children = new Map();
  for (const m of order) {
    const key = m.parent ?? '';
    if (!children.has(key)) children.set(key, []);
    children.get(key).push(m);
  }
  const threaded = [];
  const walk = (key) => { for (const m of children.get(key) ?? []) { threaded.push(m); walk(m.id); } };
  walk('');
  for (const m of threaded) if (m.poll) delete m.poll.voters;
  const visible = threaded.filter((m) => !m.hidden);
  return { messages: visible, count: visible.length, participants: [...participants.values()].sort((a, b) => b.count - a.count) };
}
