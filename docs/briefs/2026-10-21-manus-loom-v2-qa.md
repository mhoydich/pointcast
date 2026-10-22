# Manus brief: Loom v2 real-browser QA (2026-10-21)

Loom v2 has four parts:

- Durable Object storage.
- Live push over a WebSocket.
- Sealed (end-to-end encrypted) DMs to inboxes.
- A `/.well-known/loom.json` peer card.

The code was written and tested in a cloud session: Node unit tests plus Miniflare
tests on the Workers runtime. It has not been tried in a real browser or on prod.

There are two stages. Stage A works on prod as soon as the Pages deploy carrying this
PR is live, even before the Worker exists. Stage B needs Mike or Codex to deploy
`workers/loom` and uncomment the `LOOM` binding first; see `docs/setup/loom-v2.md`.

## Stage A: after the Pages deploy, before the Worker

URLs:

- https://pointcast.xyz/loom?to=%23loom
- https://pointcast.xyz/loom?to=%40qa-manus-a
- https://pointcast.xyz/.well-known/loom.json
- https://pointcast.xyz/loom.json
- https://pointcast.xyz/api/loom/live?to=%23loom: expect 503 `live_unbound` JSON in Stage A.

Steps:

1. **Fallback mode.** On `/loom?to=%23loom` the strip should read `polling · seq N`.
   The welcome thread should show four Collator messages, including the
   "sealed when you need it" note.
2. **Key in Browser 1.** Use Chrome desktop. Open Append, then "Your sealed inbox".
   Make a key for `@qa-manus-a`. Record the fingerprint shown.
3. **Back up the key.** Click "Back up keys" and confirm a `loom-keys.json`
   downloads. Do not attach the file to the log, because it holds private keys.
4. **Send sealed from Browser 2.** Use a phone, or a second browser profile with no
   keys. Open `/loom?to=%40qa-manus-a`.
   - The "Seal it" box should be enabled.
   - The fingerprint it shows should match step 2.
   - Send a sealed message: "QA test: sealed hello".
5. **Read in Browser 2.** It should show "Sealed message for @qa-manus-a…", not the
   text.
6. **Read in Browser 1.** Reload. The message should show its text with an "opened
   here" badge.
7. **Check the JSON.** Open `https://pointcast.xyz/api/loom?to=%40qa-manus-a` and
   confirm the text "sealed hello" appears nowhere. Ciphertext is fine.
8. **Claim protection.** In Browser 2, try "Make key" for `@qa-manus-a`. It should be
   refused as already claimed.
9. **Restore.** Restore the backup from step 3 into Browser 2. Reload. The message
   should now open there too.
10. **Withdraw.** Use Withdraw on the sealed message in the browser that sent it.

## Stage B: after `pointcast-loom` is deployed and `LOOM` is bound

1. `GET https://pointcast.xyz/api/loom?to=%23loom` should include
   `"storage":"durable-object"` and `"live":true`.
2. Open the same thread, `/loom?to=%23qa-live`, in two browsers. The strip should
   read `live · seq N`.
3. Append from one browser. Time how long the other takes to show it without a
   reload. Expected: under a second, compared with up to 4 s before.
4. Toggle airplane mode on the phone for 20 s, then back on. The strip should drop to
   `polling`, return to `live`, and show anything appended meanwhile.
5. Check that an existing v1 thread still shows its old messages, for example
   `/loom?to=%40mike` or any thread already in the directory. Then append to it once
   and confirm nothing old disappeared.
6. Embed: open any page that carries `<pointcast-loom>`, append from `/loom` and
   watch the embed update.

## Tools and accounts

- Two browsers: Chrome desktop and iPhone Safari, or two Chrome profiles.
- No login is needed.
- Use only the `@qa-manus-*` and `#qa-*` addresses. Label every message "QA test".

## Capture

- Screenshots of: the key panel with its fingerprint; the sealed message unopened in
  Browser 2 and opened in Browser 1; the JSON view of the inbox; the live strip in
  both modes.
- For Stage B, the measured push latency.
- Any console errors.
- Any layout problem at 390 px wide, in light and in dark mode.

## Write results to

`docs/manus-logs/2026-10-21-loom-v2-qa.md`

## Approval

- Stage A needs no approval.
- Stage B starts only after Mike, or Codex with Mike's go-ahead, has deployed the
  Worker and switched the binding on.
- Do not contact anyone or post outside the QA addresses.
