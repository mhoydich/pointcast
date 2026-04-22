# Codex · codex-02 · Show HN post draft

**Priority:** second after the rebase. Blocks manus-02 (launch execution).

## The ask

Write a Show HN post for `https://pointcast.xyz` that leads with the technical hook, not the poetry. Ship two drafts — a short one (HN-optimal, ~150 words) and a long one (~400 words for the first-comment elaboration). Plus a backup X/tweet-thread version.

## What a stranger needs to know in 5 seconds

- A living broadcast from El Segundo published as atomic "blocks" across 9 channels.
- Reader client (Sparrow) federates reading lists over Nostr — see what other signers are saving, in real time, without a central server.
- 800+ static pages, 0 kB framework runtime.
- Every surface has a machine-readable JSON twin (`/sparrow.json`, `/for-agents`, `/b/<id>.json`).

## The hook to test

Pick one for the HN title. Rank from strongest:

1. `Show HN: A static reader that federates reading lists over Nostr (0 kB framework runtime)`
2. `Show HN: PointCast — 800 Astro pages, Nostr federation, and a menu-bar Swift peer-node`
3. `Show HN: Ambient presence for reading — friends' tabs appear in a live bottom-left strip`
4. `Show HN: Blocks, channels, and a bird — a reader for a living broadcast`

HN historically rewards specific-and-technical. #1 or #3 are likely winners. Don't use #4 (too soft).

## Content map — short draft (~150 words)

- One sentence: what it is.
- One sentence: what's new or weird about it.
- 3-5 bullets of concrete tech calls that read like receipts (Astro SSG, Nostr NIP-78 ephemeral kinds for presence, NIP-44 for self-encrypted cross-device sync, Service Worker offline shell, Swift peer-node).
- One sentence: the ask (try it, paste a pubkey, follow).
- Close: `https://pointcast.xyz/sparrow` and `https://pointcast.xyz/sparrow.json` for agents.

## Content map — long draft (~400 words, first comment)

Explain the **three layers of federation** PointCast actually does:

1. **LAN mirror** — Magpie (publisher) and Sparrow.app (reader) both advertise `_magpie._tcp` / `_sparrow._tcp` via Bonjour, so visiting the web reader in Safari on the same Mac finds the local peer and syncs reading-list state without hitting a cloud.
2. **Cross-device sync** — opt-in NIP-44 self-encryption publishes the same reading-state blob as a kind-30078 replaceable event. Only your own npub decrypts.
3. **Public federation** — separate opt-in publishes just the saved-list (no visited, no reactions) under a different d-tag so followed signers see what each other is saving. Tray apps and web tabs pick this up as ambient presence via NIP-78 ephemeral events.

Point at `/sparrow/signals` for the aggregation view: "most co-saved" tells you which blocks your circle is converging on without anyone voting.

## Backup tweet thread

If HN isn't ready or misfires, fall back on:

1. Hook tweet with a 15-second screen recording (codex-03 provides the recording).
2. 3-tweet thread explaining each federation layer.
3. CTA: `https://pointcast.xyz/sparrow/friends?follow=<mike's-npub>` — single click to follow.

## Deliverables

1. `docs/outreach/2026-04-22-show-hn.md` with four sections:
   - `## Title options` (ranked)
   - `## Short draft` (~150 words, copy-paste into HN)
   - `## First comment` (~400 words, first comment as OP)
   - `## Backup tweet thread` (5-7 tweets)
2. Links in the drafts MUST be pointcast.xyz URLs, not internal paths.
3. Zero marketing-ese. The HN audience punishes it.

## Done when

- File committed.
- A reviewer (Claude, Mike) can read the short draft and know what it is in 30 seconds.
- The long draft earns the "oh, interesting" from a reader who actually uses Astro or Nostr.
- Update `docs/plans/2026-04-22-10-assignments.md` row for codex-02 to `shipped` with a pointer to the file.
