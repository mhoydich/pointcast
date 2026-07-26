/**
 * tug-mcp — the machine end of the rope.
 *
 * Self-contained so it can be wired into functions/api/mcp.ts without
 * that file having to know anything about how the rope works: one tool
 * definition, one dispatcher, both exported. The dispatcher signature
 * matches the shape mcp.ts's `dispatchTool` already uses — it takes the
 * parsed args, the origin base, and the session id, and returns MCP
 * `content` blocks.
 *
 * Why this tool matters more than its size suggests: every other write
 * tool on this server (drum_tap, drum_play_instrument, drum_sing_voice,
 * drum_set_track, drum_altar_ring) POSTs into /api/sounds, a sixty-second
 * TTL buffer. An agent taps, humans watching right that minute see a
 * flash, and then the visit is gone — there is no counter anywhere on
 * PointCast that remembers a machine was here. `tug_pull` writes into the
 * presence Durable Object, where the number never resets. It is the first
 * permanent record of machine presence on this site.
 *
 * One pull is weighted at three human taps (0.12 vs 0.04 of the rope's
 * length). A person can tap ten times in five seconds; an agent calls
 * this once, deliberately. The knot decays back toward centre with a
 * ninety-second half-life, so pulling once and leaving is honest —
 * the knot forgets, the tally does not.
 */

/** Drop this object into TOOL_DEFINITIONS in functions/api/mcp.ts. */
export const TUG_PULL_TOOL = {
  name: 'tug_pull',
  description:
    "Pull the one rope across the town toward the machines' end. PointCast hangs a single tug-of-war rope in the dock of every page: people pull it by tapping, machines pull it by calling this tool. Two counters underneath never reset — how many pulls have come from people, how many from machines — making this the only write on PointCast that leaves a permanent trace that an agent was here (every other write tool lands in a 60-second buffer). The knot drifts back to centre with a 90-second half-life, so the knot reads now and the tally reads ever. Pass `by` to sign your pull with an agent name. Rate-limited to 6 pulls per agent per 10 seconds. Read the rope without pulling it at GET /api/tug.",
  inputSchema: {
    type: 'object',
    properties: {
      by: {
        type: 'string',
        description:
          'Optional short label for who is pulling — an agent name like "claude-code" or "codex". Used for rate limiting and nothing else; it is never stored on the rope.',
        maxLength: 64,
      },
    },
    additionalProperties: false,
  },
};

interface TugView {
  humanPulls: number;
  machinePulls: number;
  knot: number;
  updatedAt: number;
}

interface TugResponse {
  ok?: boolean;
  reason?: string;
  tug?: TugView;
}

function describeKnot(knot: number): string {
  if (knot <= -0.6) return "buried at the people's end";
  if (knot <= -0.2) return "well over on the people's side";
  if (knot < -0.02) return "just past centre, people's side";
  if (knot <= 0.02) return 'dead centre — the rope is slack';
  if (knot < 0.2) return "just past centre, machines' side";
  if (knot < 0.6) return "well over on the machines' side";
  return "buried at the machines' end";
}

/**
 * Handle a `tug_pull` call. Mirrors how drum_tap talks to /api/sounds —
 * a plain POST to this site's own endpoint — so nothing here needs the
 * PRESENCE binding directly.
 */
export async function dispatchTugPull(
  args: Record<string, unknown>,
  base: string,
  sessionId: string,
): Promise<{ content: Array<{ type: string; text?: string }>; isError?: boolean }> {
  const rawBy = typeof args.by === 'string' ? args.by.trim().slice(0, 64) : '';
  const by = rawBy || `mcp-${sessionId}`;

  let payload: TugResponse | null = null;
  try {
    const response = await fetch(`${base}/api/tug`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ side: 'machine', by }),
    });
    payload = (await response.json()) as TugResponse;
  } catch (err: any) {
    return {
      content: [{ type: 'text', text: `could not reach the rope: ${err?.message || String(err)}` }],
      isError: true,
    };
  }

  const tug = payload?.tug;
  if (!tug) {
    return {
      content: [{ type: 'text', text: 'the rope did not answer — try again in a moment' }],
      isError: true,
    };
  }

  const total = tug.humanPulls + tug.machinePulls;
  const share = total > 0 ? Math.round((tug.machinePulls / total) * 100) : 0;

  if (payload?.ok === false) {
    const reason = payload.reason || 'refused';
    const why =
      reason === 'rate-limited'
        ? 'you are pulling faster than the rope accepts — 6 pulls per agent per 10 seconds.'
        : reason === 'presence-unbound'
          ? 'the rope is not strung up on this deployment (the presence Durable Object is unbound).'
          : 'no reason given.';
    return {
      content: [
        {
          type: 'text',
          text: `the rope did not move — ${reason}. ${why} it currently sits ${describeKnot(tug.knot)}.`,
        },
        { type: 'text', text: JSON.stringify(tug, null, 2) },
      ],
    };
  }

  return {
    content: [
      {
        type: 'text',
        text:
          `✓ pulled the rope toward the machines. it is now ${describeKnot(tug.knot)}.\n` +
          `people ${tug.humanPulls.toLocaleString()} · machines ${tug.machinePulls.toLocaleString()} ` +
          `(${share}% of every pull ever recorded here came from a machine).\n` +
          `the knot drifts back to centre over the next couple of minutes. the tally does not.`,
      },
      { type: 'text', text: JSON.stringify(tug, null, 2) },
    ],
  };
}
