# Manus · manus-04 · Seed-pubkey curation for `/sparrow/federation.json`

**Priority:** can run in parallel. Low risk, moderate leverage — a good starter list makes the `/sparrow/friends` page useful to first-timers on sight.

## The ask

Research and propose 10-15 pubkeys to seed `src/pages/sparrow/federation.json.ts`. Each with an alias and a one-sentence note explaining why a new visitor would want to follow them.

## Current state

`src/pages/sparrow/federation.json.ts` ships two scaffold entries (jack + fiatjaf) from v0.32. Add yours on top.

The file is imported by `/sparrow/friends` which fetches `/sparrow/federation.json` on boot and renders each entry as a one-click-follow card. A user follows them; Sparrow immediately subscribes to their kind-30078 events; if they've opted to publish a public saved list, those saved blocks render in the feed + activity timeline + dashboard lane.

## What makes a good seed

- **Active poster** on any Nostr client in the last 60 days.
- **Clear topical voice** — you can write a one-sentence description without reaching. Not "general Nostr person."
- **Non-spam** — no bots, no "promotion" accounts, no projects. Real humans writing things.
- **Coverage across interests** — spread across tech, reading, visual art, music, writing, so a first-time visitor with any interest sees someone relevant.

## Categories to fill

Propose approximately:

- 3 in **Nostr protocol/client development** (fiatjaf-style people — protocol authors, relay operators).
- 2 in **writing/publishing on Nostr** (Longform-leaning accounts that post essays or reading notes).
- 2 in **visual art / photography** posting on Nostr.
- 2 in **music / audio**.
- 2 in **indie-web / small-web adjacent** people active on Nostr.
- 1-2 **wild cards** — anyone Mike personally follows + would vouch for.

## Shape per entry

```json
{
  "hex": "64-hex-pubkey",
  "alias": "≤ 40 char display label (editorial; NOT their nostr name if that would be misleading)",
  "note": "One sentence, ≤ 160 chars. Concrete, not hype. 'Photographer; daily walks in Mexico City; posts shots with short captions' beats 'amazing photographer with beautiful work.'"
}
```

## Research process

- **nostr.band** and **njump.me** are your friends for pubkey → post volume → recent activity stats.
- For each candidate: confirm pubkey ≠ dead account, confirm at least one post in the last 30 days, confirm their most-recent kind-0 has a human-readable `name` or `display_name`.
- Don't include Mike's pubkey. He's the curator, not a starter.
- Don't include any account that's obviously selling something (memecoins, NFT drops, paid newsletters as their entire feed).

## Deliverables

1. A proposed JSON block (12-15 entries) in `docs/outreach/2026-04-22-seed-pubkeys-proposal.md` — don't edit the live federation.json.ts directly; Claude / Mike will review + merge.
2. Per-entry rationale: why you picked them, what topic they cover, any risk notes (if any).
3. A rejected-candidates list at the bottom: 3-5 pubkeys you looked at and didn't pick, with the reason. This is the signal that the filter is working.

## Post-review path

After Mike + Claude review, the approved entries get added to `src/pages/sparrow/federation.json.ts` as a single commit. The `/sparrow/friends` page re-fetches on next visit. Starter card meta shows "12 of 12 suggested" instead of the current "2 of 2."

## Done when

- 12-15 proposals in file + rationales.
- 3-5 rejections documented.
- Claude or Mike approves or kicks back; merged entries go into `federation.json.ts`.
- Update `docs/plans/2026-04-22-10-assignments.md` row for manus-04.
