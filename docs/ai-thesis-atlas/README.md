# AI thesis atlas — 2026-10-31

Curated 25-source educational atlas with source-specific interactive explainers, comparison, original intern projects and local-only brief downloads. No new server, data collection, account or paid API. Flatiron remains unresolved and is not in the 25.

Data lives in `public/ai-thesis-atlas/assets/atlas-data.json`. Facts retain source dates, units and evidence types; objections, tests and project ideas are editorial analysis. Short source quotations are included in the static HTML source archive. Independent source checker: GPT-6 Luna, 25 supported verdicts. Source-review history is retained here.

Regenerate the edition with `node scripts/ai-thesis-atlas/render.mjs EDITION public/ai-thesis-atlas` (EDITION is industrynext, elsegundo, or pointcast). UES: `node scripts/ai-thesis-atlas/render.mjs ues public/ues/ai-thesis-lab /ai-thesis-atlas/assets/`. Run the repository's normal production build afterward.

Publication was explicitly requested by Michael Hoydich in this task. Release owner is Codex; unrelated pending PRs are excluded. Browser and deterministic checks cover all 25 visuals, search, filters, compare, history, brief downloads, keyboard interaction and responsive layout. Exact release receipts are reported at closeout.

Validation: 623 focused interaction assertions across 25 views and 346 transitions; browser checks at 1280, 390 and 320px, keyboard activation, source jumps, history, search, compare, and an actual local brief download. Production build passed. Independent release review found two issues (WGA update-date label and El Segundo route analytics injection); both corrected and rechecked.
