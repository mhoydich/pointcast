# Personal AI publication and live verification corrections

Mike approved publication after reviewing PR #1084. Its merge revision `b4d335eabeed4096902d205233508737b4f8ff89` was built in a clean temporary checkout and deployed to Cloudflare Pages as `8de8bdd1-7b38-4660-a0a7-4735df9dd72d`. The canonical `/me` and connector assets matched the generated build. The static build produced 2,155 pages; the Pages Functions bundle compiled; 223 focused tests passed.

Auth migrations 0015–0018 were applied to the configured production `AUTH_DB`. All four tables, eight explicit indexes, and four migration journal records were verified against the tested schema. The older reward migration was intentionally excluded: its objects already exist through guarded runtime provisioning, and its unconditional DDL must not be replayed just because its journal entry is absent. No unrelated reward records or migration journal entries were changed.

Live verification found two corrections:

- `/login/` returned 404 while `/login` redirected. Both GET and HEAD aliases now redirect to the same-origin `/auth` before directory rewriting, preserving the query string. Existing profile aliases retain their destinations.
- Multiple PointCast tabs can cause the existing wallet bridge to repeatedly confirm the same signed-in owner. The new AI and purchase panels previously aborted and restarted their initial read on every confirmation, remaining at “Checking.” They now ignore duplicate bridge confirmations for the same nonempty owner ID. Changed owners, sign-out, ordinary auth actions, malformed notifications, and explicit refresh still clear private state and invalidate pending work.

The two repeated-event regressions failed before the UI fix. The corrected controller suites passed 55/55, the redirect/admin/sitemap cases passed 16/16, and the combined AI/auth/payment/routing suite passed 243/243. No real provider consent, new production pairing, wallet authorization, payment, or external message was performed. X credentials remain absent and new purchases remain disabled. Setup links and clone instructions use `main`.

The final deployment and canonical browser verification receipt is retained with the release handoff. Temporary dependencies, build output, and checkouts are removed after verified publication.
