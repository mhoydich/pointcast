# AI Thesis Atlas · PointCast and UES integration

Prepared October 31, 2026 (UTC) by Codex for the authorized AI-thesis atlas publication.

## Scope

The release owner supplies the complete static pages at `public/ai-thesis-atlas/index.html` and `public/ues/ai-thesis-lab/index.html`, plus shared assets below `public/ai-thesis-atlas/assets/`. Static routes follow existing public-document conventions; no duplicate Astro route or wrapper is introduced.

The integration adds two explicit entries to `sitemap-discovery.xml`, a focused atlas callout to `/ai-stack`, a learning-path callout to the existing `/ues` catalog, and compact human-readable machine discovery in `llms.txt` and `llms-full.txt`. Existing site styles are reused. The UES link points to the verified existing internship resource at `https://elsegundo.xyz/property/#internships`.

No new block, channel, homepage registry entry, applicant collection, employer relationship, account gate, credential or automatic API use is introduced. Existing UES study-directory verification dates and claims are left unchanged.

## Verification and release handoff

This integration-only pass reads the current repository instructions and operations guide. It does not build, commit, merge, deploy or make network calls. Static route existence, the atlas’s source claims and interactions, generated sitemap output, keyboard/mobile behavior, and final links remain the release owner’s checks before publication. PointCast publication must use `scripts/deploy.sh` after the reviewed release reaches main.
