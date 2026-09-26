# Bloomline: making /keyboard/bloomline/ a live room

**Status:** the page is live as a solo instrument at `public/keyboard/bloomline/index.html` → `https://pointcast.xyz/keyboard/bloomline/`.
**Next step:** connect three hooks so the room is shared.
**Owner:** Shwa or the Claude Code loop. Needs Codex review (new write endpoint, new auth-gated surface).
**Prototype:** the working Claude-hosted version stays up at https://claude.ai/artifact/ASPP15bhNAuMFt2Y8J5xCC while this ships.

## What already works with no backend

- Typing in the message box plays notes. The scale, waveform, and decay follow one of six moods (Electric, Bright, Tender, Calm, Blue, Restless).
- The mood compass tracks energy (keys per second, ignoring pauses over 1.4s) against valence (a small word list, `!`, emoticons, and backspace hesitation).
- ▶ on any message replays it with its original keystroke timing, lighting each character as it plays.
- "Room weather" averages the last 10 messages, weighting recent ones more.
- An example thread shows until the first real message arrives.
- The sound preference is kept in `localStorage` (`bl_sound`). Nothing else is stored.

Messages sent in solo mode stay on that screen and are gone on reload.

## The hook contract

The page looks for `window.BloomlineHost` at boot and again on `load`. A host script can also call `window.Bloomline.connect(host)` at any point. All of it lives in the "Host hooks" block of `index.html`.

```js
window.BloomlineHost = {
  me:       async () => ({ id, name, color? }) | null,   // null = signed out, can listen only
  profiles: async (ids) => ({ [id]: { name, color? } }), // optional
  messages: {
    add:       async (msg) => {},                        // throw {code:'unauthorized'|'rate_limited'|'quota_exceeded'}
    subscribe: (onDocs, onError) => unsubscribe,         // onDocs(allMessages oldest→newest, each with .id)
  },
  presence: {
    set:       async ({ typing, mood }) => {},
    subscribe: (onPeers) => unsubscribe,                 // onPeers([{ id, name?, isMe?, typing?, mood? }])
  },
};
```

The message the page sends:

```js
{ text, by, t, n, e, v, mood }
// text  string ≤ 2000
// by    me().id            (the server must overwrite this from the session)
// t     ms epoch           (the server should overwrite this)
// n     [[charCode, dtMs], ...] ≤ 600 pairs. charCode 8 = backspace, 10 = newline. dt 0..9999
// e     energy 0..1, v valence -1..1, mood one of the six names
```

`onDocs` gets the full recent list (up to 150) every time it fires, not a diff. The page works out which messages are new, so it can auto-replay an incoming message when sound is on.

## Where each hook points in PointCast

| Hook | Use what's already there | New work |
|---|---|---|
| **Who's signed in** (`me`, `profiles`) | `GET /api/auth/session` (`functions/api/auth/session.ts`) returns `{ ok, user: { userId, preferredName } }` from the `pc_session` cookie, and 401 when signed out. Sign-in UI is `/auth`. | Map `userId → id` and `preferredName → name`. When signed out, return `null`: the page stays in listening mode and its toast points to sign-in. Add a "Sign in with PointCast" link near the composer that goes to `/auth?next=/keyboard/bloomline/`, after checking that `/auth` honors a return path. `profiles(ids)` needs a small public-name lookup, or it can be skipped and the server can put `name` on each message. |
| **Messages store + live feed** (`messages`) | Two existing patterns to copy: `workers/keyboard-studio` (a SQLite-backed DO bound as `KEYBOARD_STUDIO`, with invitation-only signed rooms) and `functions/durable/drum-room.ts` (WebSocket fan-out plus a ring buffer for late joiners). | Add a `BloomlineRoom` DO (a `/api/bloomline` entry for GET, POST, and WS upgrade) that keeps the last 150 messages and broadcasts on write. **POST requires a valid `pc_session`**, and the server sets `by`, `name`, and `t` itself. Validate everything listed in the message shape above and reject anything else. Rate-limit through `functions/_rate-limit.ts` (`PC_RATES_KV`). Don't reuse `/api/room` chat: it caps at 120 chars and has no field for keystroke timing. |
| **Presence** (`presence`) | The per-URL presence DO: `/api/room?url=/keyboard/bloomline` (`functions/api/room.ts` → `PresenceRoom` in `workers/presence`). It already accepts a `mood` patch (32 chars) and broadcasts `sessions` and `peers`. The drum rooms run on the same setup. | Send `mood` through the existing patch. `typing` isn't a field yet: either add a boolean to `applyVisitorPatch` in `workers/presence/src/index.ts`, or encode typing in `mood` (for example `Bright·typing`) and split it on the client. Map `sessions` to `onPeers` and mark your own session `isMe`. The page sends at most one update every 400ms and clears typing after 4s idle. |

The host adapter can be a small `public/keyboard/bloomline/host.js` loaded with `<script src="./host.js" defer>` just before the main script, or the page can move into an `.astro` route that inlines it. Either way, `index.html` itself doesn't need to change.

## Privacy rule (keep it true)

The page says: *"Bloomline only listens to the message box… Nothing else on your keyboard is recorded."* Keystroke timing is recorded only for messages that are actually sent. The server must not log anything from the typing presence stream beyond what it broadcasts.

## Acceptance

1. Signed out: the page loads, typing plays, messages from others show and replay, and sending shows the sign-in toast without posting.
2. Signed in with two browsers: a message sent in A appears in B within about 1s, B auto-replays it when sound is on, and the name shown is the PointCast `preferredName`.
3. The peer dot shows in the other browser, rings while typing, and takes on the typist's mood color.
4. A POST without a session gets 401. A forged `by`, an `n` longer than 600, or text over 2000 chars gets 400.
5. `npm run build:bare` passes. If `/keyboard/bloomline/` gets added to `/agents.json` or `llms*`, `npm run audit:agents` passes too.

## Manus QA (after the hooks ship)

- Open `https://pointcast.xyz/keyboard/bloomline/` on desktop Chrome and iOS Safari, once signed in and once in a private window.
- Capture: both-browser screenshots showing the same thread and a peer dot, a screen recording of a replay with sound, and the signed-out send toast.
- Write results to `docs/manus-logs/YYYY-MM-DD-bloomline-live-room.md`.
- None of this needs Mike's approval. Turning the room on in production (the DO deploy and new bindings) does.
