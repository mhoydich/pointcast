# Manus brief — Bloom Party real-device QA

**Date:** 2026-08-08
**From:** CC (Claude Code)
**To:** M (Manus)
**Surface:** `/bloom-party` — a party game for 4-15 co-located phones
**Write results to:** `docs/manus-logs/2026-08-08-bloom-party.md`

---

## What shipped

A new PointCast route. One person opens `/bloom-party`, gets a six-letter room
code; everyone else types it on their own phone. A prompt card appears, each
person builds a short bloom (voice + pace + three knobs), all blooms play back
anonymously, the room votes. Five rounds, then a scoreboard.

Nothing about this can be verified headlessly. The design decisions that matter
— whether a 3.2-second bloom is legible, whether fifteen people can hear the
stage phone, whether the timers feel right — are physical questions.

## Blocking prerequisite

The `pointcast-bloom` Worker must be deployed **before** the Pages deploy, or
the `script_name = "pointcast-bloom"` binding in the root `wrangler.toml` will
not resolve and every room will 503. Same ordering constraint that PRESENCE and
DRUM carry.

```
cd workers/pointcast-bloom
npm install
npx wrangler deploy
```

Confirm with:

```
curl 'https://pointcast.xyz/api/bloom/room?room=KTP4XR&stats=1'
```

A 200 with `"ok": true` means the binding resolved. A 503 mentioning
`BLOOM_ROOM ... not configured` means it did not — stop and report that before
doing anything else.

## URLs to open

| What | URL |
|---|---|
| Make a room | `https://pointcast.xyz/bloom-party` |
| Join a room | `https://pointcast.xyz/bloom-party?room={CODE}` |
| Stage view | `https://pointcast.xyz/bloom-party?room={CODE}&view=stage` |
| Solo mode (no server) | `https://pointcast.xyz/bloom-party?solo=1` |
| Machine twin | `https://pointcast.xyz/bloom-party.json` |
| Live room stats | `https://pointcast.xyz/api/bloom/room?room={CODE}&stats=1` |

## What to test, in priority order

1. **A four-phone game, start to finish.** Five full rounds. Record how long
   each phase actually takes and whether any phase felt like dead air.
2. **A fifteen-phone game, start to finish.** This is the real test. Above
   seven players the game switches to a "that one" heat pass during playback
   and only the top five reach the ballot. Confirm that actually happens, that
   the ballot shows five options and not fifteen, and that fifteen consecutive
   3.2-second blooms is bearable rather than a slog.
3. **iOS Safari audio.** Does sound start on the first tap? Lock the screen
   mid-round and unlock — does audio resume, does the phone rejoin with its
   score intact, does the phase catch up? Check the silent/ring switch too.
4. **WebSocket through the Pages edge.** Local `wrangler dev` does not
   reproduce the Pages Function proxy. If the socket fails only in production,
   that is the most important thing you can find.
5. **Clock skew.** Put four phones side by side and photograph the countdown.
   They should agree within a second. They derive a local offset from a
   `serverAt` stamp; only real devices prove it works.
6. **Speaker mode — a judgement call I want yours on.** Right now every phone
   plays the audio, so fifteen slightly-offset devices make a chorus. The
   alternative is muting everyone except the stage phone. Play a round each way
   and tell me which is better in a real room. I will ship a host toggle either
   way; I want your read on the default.
7. **QR / link path.** Copy the link from the lobby, send it over text, open it
   from the iOS and Android camera and from Messages.
8. **Host handoff.** Have the host close their browser mid-game. The badge
   should pass to the longest-present connected player and the game should keep
   moving. Confirm it does not freeze.
9. **390×844.** The whole page is built phone-first; flag anything that
   overflows, and check the stage view on a propped-up phone from four feet
   away.

## Accounts and tools

None. No login, no account, no install anywhere in this flow. You need
phones — ideally fifteen, minimum four, mixed iOS and Android — and a
Cloudflare-authenticated shell for the Worker deploy in the prerequisite.

## Capture

- A screenshot of the lobby with the room code visible
- A screenshot of the ballot in a 15-player game (proving it shows five, not fifteen)
- The final scoreboard from both the 4-phone and 15-phone games
- Per-phase timing notes — the actual seconds, not impressions
- `wrangler tail` output from `pointcast-bloom` across one full game
- Any console errors from a phone, especially iOS

## Needs Mike approval

Nothing here needs approval to test. Do **not** deploy to production Pages
without MH sign-off — the Worker deploy in the prerequisite is additive and
safe, but the Pages release is the usual gate.

## Known open questions I would like answered

- Is five rounds right, or does the room want more or fewer?
- Are the prompt cards good? Which ones fell flat, which got a reaction?
- Does the "first to submit" bonus actually speed the build phase up, or does
  it just make people rush and submit something bad?
