# Kennel Club launch block — wire copy

**Status:** wire copy only. This file does not claim a Block ID or add a file under `src/content/blocks/`.

## Title options

1. The September Sitting is open
2. Thirty days at the Kennel Club
3. One dog for every September day

## Suggested Block shape

- **Channel:** `ESC` — El Segundo
- **Type:** `MINT`
- **Size:** `2x2`

`src/lib/channels.ts` describes El Segundo as the channel for “ESCU fiction, local, community.” The series is anchored in El Segundo settings and is a local, calendar-shaped cultural release. `FCT` is intentionally not suggested: its stated purpose is free daily claims and giveaways, while the edition mode and price remain unresolved. The `MINT` type keeps the collectible surface truthful once those decisions land.

## Wire fields

```text
id: UNASSIGNED
channel: ESC
type: MINT
title: The September Sitting is open
timestamp: SET AT PUBLICATION
size: 2x2
media: /images/kennel-club/september-sitting/02-hartley.png
edition: SET AFTER MIKE CONFIRMS EDITION MODE, PRICE, AND SIGNER
```

## Plain-text body

Thirty portraits. Thirty September dates. One dog keeps the chair every day.

Kennel Club begins with the first two sittings already on the calendar, then continues one plate at a time through the end of the month. Each portrait has its own name, breed, room, and place in the sequence. The calendar is the edition list. The room is open now; mint details follow only after the edition, price, and signer are set.

Start with today’s sitting, then take the whole month in order. Nothing is hidden behind a feed: every dog has a date, a plate, and a permanent place in the record.

## Companions

- `https://pointcast.xyz/kennel-club` — Kennel Club room and September calendar
- `https://pointcast.xyz/kennel-club.json` — machine-readable calendar
- `https://pointcast.xyz/kennel-club/02-hartley` — today’s sitting (update to the current sitting at publication)
- `https://pointcast.xyz/send/kennel-club` — plain-language send sheet

## Publication notes

- Keep the body plain text as written: no inline links.
- Update the today companion and the media plate at publication time.
- Do not add edition facts, price, contract address, or marketplace claims until they are confirmed.
