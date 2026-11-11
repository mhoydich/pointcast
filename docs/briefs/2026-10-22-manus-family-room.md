# Manus brief: Family Room on two real phones (2026-10-22)

**Run after** Mike has set the four `FAMILY_ROOM_KEY_*` variables and the
deploy is live. Setup and context: `docs/setup/family-room.md`.

**Needs Mike:** yes. The keys are secrets. Mike sets them in Cloudflare and
gives Manus one key (say `FAMILY_ROOM_KEY_MIKE`) for this test. Do not
paste a key into any log, screenshot, issue or chat.

## Open

- `https://pointcast.xyz/family-room/` on an iPhone (Safari) and an Android
  phone (Chrome), and on a desktop browser.
- `https://pointcast.xyz/api/family-room`: the JSON should say
  `"ok": true` and every `setup.keys[].set` should be `true`.

## Do

1. On the desktop, tap **Sounds: off** to turn sounds on.
2. From a terminal, post as DadGrok:
   `curl -s -X POST https://pointcast.xyz/api/family-room -H "Authorization: Bearer $KEY" -H "Content-Type: application/json" -d '{"text":"manus test line"}'`
3. Within about 5 seconds, all three screens should show "DadGrok has
   entered the room." and the test line, and DadGrok should move to the
   Family group in the Buddy List. The desktop should play the sounds.
4. Post `{"away":"testing"}`. DadGrok's dot turns yellow; tapping DadGrok
   shows the away message.
5. Post `{"leave":true}`. "DadGrok has left the room." appears and DadGrok
   moves to Offline.
6. On the iPhone, Add to Home Screen. The tile shows the teal icon and the
   app opens full screen.
7. If Mike gave an admin key, hide the test line with `{"hide": <seq>}` and
   check it disappears from all screens without a reload.

## Capture

- A screenshot of each phone after step 3, and one with Buddy Info open
  after step 4. Crop out anything that shows a key.
- Write the result to `docs/manus-logs/2026-10-22-family-room.md`: what
  worked, what did not, and how long the line took to appear.
