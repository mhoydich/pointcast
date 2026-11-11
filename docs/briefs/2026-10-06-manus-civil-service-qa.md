# Manus brief — El Segundo Civil Service real-device QA (2026-10-06)

Surface: `/civil-service` (Notice ESCS-001, CH.ESC). Run this after the PR merges and `scripts/deploy.sh` has shipped it.

## URLs to open

1. https://pointcast.xyz/civil-service (phone, light and dark system theme)
2. https://pointcast.xyz/civil-service#ESC-101 and https://pointcast.xyz/civil-service#ESC-212 (QR deep links)
3. https://pointcast.xyz/api/civil-service?action=board (roster JSON)
4. https://pointcast.xyz/civil-service.json
5. https://pointcast.xyz/passport, https://pointcast.xyz/quests, https://pointcast.xyz/walk, https://pointcast.xyz/civic, https://pointcast.xyz/c/el-segundo

## Accounts / tools

- A real iPhone (Safari) and an Android phone (Chrome). No login, wallet, or email needed.
- Use the handle `manus-qa-1006` so the entry is easy to spot. Do not use a real name or email.

## Steps and acceptance criteria

1. Sign up in the hero form with "Match me" as a Neighbor. Expect a green "Matched: ESC-… " line and a receipt card with an offer-by date 15 days out.
2. Print or render a QR for `/civil-service#ESC-101`, scan it with the phone camera. Expect the page to land on the sign-up form with "ESC-101 Pier Watch is selected" and the handle field focused.
3. File one receipt for the matched post. Expect "Sworn in…" and, on `/passport`, the Sworn In stamp marked stamped.
4. Confirm the roster section and `?action=board` show `manus-qa-1006` under the right post with a receipt count of 1. Confirm no email appears anywhere.
5. Toggle the Theme button (Auto → Light → Dark). No unreadable text in either theme. No horizontal scroll at phone width.
6. On `/quests`, agent posts (ESC-210, 212, 305, 320, 401) show a "Take post" link that lands on the preselected sign-up.
7. Footer shows the independence disclaimer (not affiliated with the City of El Segundo; no real public employment).

## Capture

- Screenshots of steps 1, 2, 3, 4 and 5 (both themes) on each phone.
- Any console errors (Safari Web Inspector / Chrome remote debugging).

## Write results to

`docs/manus-logs/2026-10-06-civil-service-qa.md`

## Mike approval

None needed for QA. Removing the `manus-qa-1006` test rows afterwards needs a KV delete on PC_QUEUE_KV (`escs:holder:*:manus-qa-1006`, its `escs:receipt:*` key, and `escs:sworn:manus-qa-1006`); ask Mike before deleting anything in production KV.
