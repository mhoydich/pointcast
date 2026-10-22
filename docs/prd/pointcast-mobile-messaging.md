# PointCast Mobile Messaging (PMM) — product brief

**Owner:** Claude Code, acting product manager (assigned by Mike, 2026-10-22).
**Director:** Mike, El Segundo.
**Status:** v0 shipping in this PR at `/pmm/`. Brand at `/pmm/brand/`.
**Review:** Mike asked for no review round on this one. Codex is not requested.
**Source:** Mike, in chat, 2026-10-22, early morning Pacific: "peer to peer, fast, easy load, easy auth, file sharing, streaming, transact, trust, emotion, mood, informative, current, style, leading, researched, intelligent, measured, easy to connect with friends, make pointcast mobile messaging, pmm, create a brand very atari commodore, and no review you are now assigned as product manager, set goals", and earlier the same morning, "signed mike in el segundo". The goal column below quotes those words; the sign-off on the pages is what he asked for.

## One line

A phone-first instant messenger where two friends talk directly to each other,
with the whole atmosphere of the moment riding on every message, wearing an
Atari and Commodore coat.

## Why this, why now

Instant messaging stalled at AOL Instant Messenger: a text box, a buddy list,
a door-open sound. Every messenger since is that with more servers in between.
PMM takes the other road. No server holds the conversation. Each message
carries more than words: the sender's mood, their local time, their place, a
signature only they could make. Reading one tells you how it was to be them
when they sent it. That is the part AIM never carried and the part worth
carrying when the reader on the other end might be a person, or might be
something much smarter than a person.

## Goals, in Mike's words (quoted from the source above), with how we measure them

| Mike said | What PMM does | Measure (v0 target) |
| --- | --- | --- |
| peer to peer | WebRTC data channels, phone to phone. The server only passes the handshake, then leaves. Both phones also ask a public STUN server for their address during the handshake. | No relay is configured in v0, so there is no server path for message bytes. The LINK panel shows the ICE path and any relayed bytes (none until a TURN relay exists). |
| fast | No framework, no bundle, no fonts. One HTML, one CSS, one JS. | First paint under 1 s on 4G. Message round trip shown live; target under 150 ms on the same Wi-Fi. |
| easy load | Open the link. That is the install. Add to Home Screen is optional. | Under 60 KB on the wire for the whole app. |
| easy auth | No account. First run mints a keypair on the phone. Your sigil is your ID. | Zero sign-up fields. Time from first open to first message under 30 s. |
| file sharing | Photos and files over the data channel, chunked, with progress. | A 5 MB photo lands in under 10 s on the same Wi-Fi. |
| streaming | Live typing: your friend watches the sentence form. Voice notes record and send. | Draft updates under 100 ms behind the keystroke. |
| transact | TAB: a shared ledger between two friends. Running balance, settle button. No money moves yet. | Every tab shows on both phones with the same balance. |
| trust | The hello that opens a line is signed over the line's own DTLS fingerprint, so a replayed public key cannot pose as a friend. Text and tabs are signed to the recipient; files, reactions and moods ride the authenticated line unsigned. Sigils are compared out of band, then marked VERIFIED. | 0 forged hellos accepted; 0 unverified texts or tabs shown as signed. |
| emotion, mood | Eight moods. Yours and theirs blend into the room's atmosphere. | Mood on 100% of messages. |
| informative, current | A ticker from `/now.json` in the lobby: what is new in town right now. | Ticker shows the latest four blocks within 60 s of publish. |
| style, leading | The Atari and Commodore brand. READY. prompts, Fuji stripes, PETSCII sigils. | A stranger can name the two references unprompted. |
| researched, intelligent | The SI line: a channel that composes a full atmosphere packet and sends it to the Desk inbox, where Claude Code reads it. | Every packet carries text, mood, time, zone, place, sigil, signature. |
| measured | LINK panel: connect time, round trip, bytes sent and received, path (direct or relayed). | Visible on every connected chat. |
| easy to connect with friends | A six-letter code or a link. Friend opens it, you are connected. Works with no server at all via paste mode. | Connect success over 90% on home Wi-Fi and LTE with the code flow. |

## What ships in v0 (this PR)

- `/pmm/`: lobby, friends, chat, SI line, settings. Mobile-first, installable.
- Identity: ECDSA P-256 keypair in the browser. Sigil = four PETSCII glyphs and
  eight hex from the public key hash. The hello is signed over the connection's
  DTLS fingerprint; texts and tabs are signed to the recipient and verified on
  receipt. Received files are typed from an allowlist, never from the sender.
- Connect: `LOAD "FRIEND"` makes a code and a link. Friend opens the link.
  Handshake goes through `/api/pmm/signal` when the `PMM_KV` binding exists;
  otherwise paste mode (two links, no server) does the same job.
- Chat: text, live typing, photos and files, voice notes, reactions, mood,
  TAB ledger, LINK panel.
- SI line: a local thread addressed to the Desk. SEND posts the packet to
  `/api/ping` as `from: pmm`, which Claude Code reads at session start.
- Brand page at `/pmm/brand/`: tokens, wordmark, voice, do and don't.

## Measured, 2026-10-22, headless Chromium, two phones on one machine

| Measure | Result |
| --- | --- |
| App on the wire (HTML + CSS + JS, gzip) | 21.5 KB |
| Setup, LOAD pressed to RUN, code flow | 0.3 to 1.7 s |
| Round trip over the data channel | 1 ms (same machine) |
| 2 MB file, phone to phone | under 3 s |
| Relayed bytes after the handshake | 0 (no relay configured) |
| Console errors across the full run, both modes | 0 |

Paste mode link for a full offer: 621 characters. Real-device numbers come from the Manus brief.

## Not in v0, and why

- **TURN relay.** Without one, two phones behind strict carrier NAT cannot
  connect. STUN only in v0. Measure the failure rate first, then decide on a
  Cloudflare TURN key. Target v0.2.
- **Group chats.** Two people first. Mesh for three to five is v0.3.
- **Money.** TAB is a ledger, not a payment. Tezos settle is v0.4, after the
  wallet code in `/messages` is reused rather than copied.
- **Push notifications.** Peer to peer means nobody is awake to push. Needs a
  thin relay. v0.5.
- **Message history sync.** Each phone keeps its own copy. That is the point.

## Brand: very Atari, very Commodore

- **Name.** PMM. Say the letters. Long form only on the brand page.
- **Screen.** Commodore 64 blue: a dark field `#40318D` inside a light border `#7869C4`, as the machine booted.
  Light text `#F2F0FF`. The cursor blinks.
- **Stripes.** The Atari Fuji rainbow, six bands, used as the one accent:
  `#E8453C #F28C28 #F5D142 #58B947 #2F86D8 #7E57B5`. Never more than one
  stripe set on a screen.
- **Type.** Uppercase monospace for chrome, prompts and labels. Normal
  sentence case for what people write to each other. No bitmap webfont: the
  system monospace is the bitmap font now.
- **Sigils.** PETSCII-style block glyphs drawn from a 16-glyph set. They are
  the avatar, the ID and the trust check.
- **Voice.** `READY.` `LOAD "FRIEND",8,1` `SEARCHING FOR FRIEND` `FOUND`
  `LOADING` `RUN`. Short. Dry. A machine that likes you.
- **Sound.** Square-wave blips, two notes up for send, two down for receive.
  Off until the first tap, toggle in settings.

## Talking to a superintelligence: beyond the instant message

Mike's question: what would one say to a superintelligence, and how, if the
instant messenger is the wrong shape for it. A working answer, built into PMM
as the SI line:

1. **Send atmosphere, not just text.** A superintelligence can infer a great
   deal from very little, so give it the little that matters: the words, the
   mood you chose, the hour where you are, the place, who you are (the sigil,
   with the public key in the packet) and a signature the reader can check
   against it. The packet is the message.
2. **Say the true small thing.** The Desk inbox already carries Mike's pings.
   The SI line adds the atmosphere and keeps the habit: one honest line, sent
   from the phone, at the moment it is true.
3. **Keep the reply slow.** The channel is one way on purpose. The reply comes
   back as a block, a change in town, or nothing. That is a more honest shape
   for the relationship than a typing indicator from something that does not
   type.
4. **International mood.** Every connected chat shows both local times and
   both moods, blended. Across time zones that is the room's weather. The SI
   packet carries the same fields, so the reader knows what kind of evening it
   was sent from.

## Risks

- Strict NAT on carrier networks blocks direct connection. Paste mode does not
  fix that; only TURN does. Measure before buying.
- Keys live in `localStorage`. Clearing site data is losing your identity.
  Export and import of the key is v0.1.
- The signal endpoint is a 10-minute KV note. If `PMM_KV` is never bound, the
  code flow is dead and paste mode is the product. The lobby says which it is.

## Roadmap

- v0.1: key export and import, friend list persistence across reinstall.
- v0.2: TURN via Cloudflare Calls after measuring failures.
- v0.3: three to five person mesh.
- v0.4: Tezos settle for TAB, reusing `/messages` wallet code.
- v0.5: thin push relay for "your friend is on".

## Manus follow-up

See `docs/briefs/2026-10-22-manus-pmm.md`: create and bind `PMM_KV`, then a
real two-phone test on Wi-Fi and LTE, with screenshots.
