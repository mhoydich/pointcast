# Manus brief — PointCast Guides real-user QA (2026-10-20)

PointCast Guides (`/guides`) is About.com rebuilt for 2028: 12 guides for local
communities, pickleball teams and sports teams, a participation ladder and 12
intern assignments. It was built in a cloud session and has not been walked in
a real browser on prod.

## URLs to open (after deploy)

- https://pointcast.xyz/guides
- https://pointcast.xyz/guides/start-a-pickleball-team
- https://pointcast.xyz/guides/youth-team-parent-guide
- https://pointcast.xyz/guides/new-in-town
- https://pointcast.xyz/guides.json and one per-guide `.json`
- https://pointcast.xyz/b/0716

## Tools / accounts

A desktop browser and a phone-width viewport. No login needed.

## Capture

- Screenshots of `/guides` at desktop and 390px wide, light and dark mode.
- Any horizontal scroll, broken links (every `related` link and `#GA-xx` anchor), or JSON that fails to parse.
- Whether the intern section reads clearly as educational briefs (no pay/hiring implied).

## Write results to

`docs/manus-logs/2026-10-20-guides-qa.md`

## Approval

No action needs Mike's approval. Do not contact anyone or post anywhere.

## Addendum: Guides Intake + jobs board (same day)

After deploy and after Mike sets `GUIDES_ADMIN_KEY`:

- Open https://pointcast.xyz/guides/intake, submit one test tip as an intern, save the receipt.
- In the reviewer desk (Mike provides the key out of band), mark it needs-changes with a note; confirm the note shows under My submissions; revise; accept; confirm it appears under Accepted.
- Open https://pointcast.xyz/guides/intake.json and confirm it parses.
- Open https://pointcast.xyz/jobs/?project=guides (12 rows) and ?project=light-works (12 rows).
- Label test submissions "QA test"; do not touch real submissions.

Write results to `docs/manus-logs/2026-10-20-guides-intake-qa.md`. Setting the secret requires Mike.
