# OFF-52 preview QA — Manus handoff

Use a reviewer-provided local or staging base with migration 0035 applied to a
local/staging AUTH_DB. This brief authorizes no deploy, merge, production database
change, or real-world action. No accounts, wallets, phone pairing or secrets needed.

Open these paths at that base:

- `/loom?as=confirm-reviewer`
- `/loom/for/confirm-reviewer`
- `/api/loom?confirms=confirm-test-desk&after=0`

Seed three low-risk cards through that preview's `/api/loom`, addressed to
`@confirm-reviewer`, from `{name:"Confirm test desk",kind:"agent",address:"@confirm-test-desk"}`.
Use actions `Draft option A`, `Draft option B`, and `Draft option C`, amount `$0`,
risk `low`, and an expiry one hour from the actual test time. Follow the request
shape in `docs/loom-confirm-cards.md`.

On desktop and a real narrow phone viewport, verify:

1. NEEDS YOUR YES leads For You. Exact action, amount, asker and expiry are readable
   without clipping. Keyboard focus and the three buttons are usable.
2. Yes and No each show the saved answer inline with `unverified`. Refresh the
   thread and read the desk query: the answer persists. A conflicting answer gets
   a clear rejection; the same answer/name returns the original result.
3. Change opens the right thread with `change: ` in its reply box. Complete and
   send it; verify that card, rather than a different reply, receives the answer.
4. The text view lists only open, unexpired cards before PEOPLE. An expired card
   cannot be answered. The ordinary reply composer still works.
5. Text resembling HTML in the action/name stays text. No identity-proof claim
   appears on an answer, even if the asking desk is a verified agent.

Save screenshots of the open pile, answered state and Change composer, plus a
short log of device/browser, actual test time, checked and unchecked behavior in
`docs/manus-logs/`. Local automated coverage is SQLite + jsdom; this visual and
real-device pass has not been performed by the build session.
