# Manus brief — Radio Network plan QA (2026-10-20)

Real-browser check of the new PointCast Radio Network plan after deploy.

## Open

- https://pointcast.xyz/radio-network
- https://pointcast.xyz/radio-network.json
- https://pointcast.xyz/b/0717

## Tools / accounts

None. Public pages, no login.

## Check

1. Page loads in desktop and phone widths (390px) with no horizontal page scroll; wide tables scroll inside their own box.
2. The dial strip shows all seven town names, El Segundo in red; the needle sweeps (and stops if the OS has reduced motion on).
3. Nav anchors (Stations, Hour clock, Schedule, Signal, Phases, Take part) jump to their sections.
4. Dark mode is legible.
5. `/radio-network.json` returns JSON with `stations` (7), `phases` (4) and `distributionPaths` (4).
6. Block 0717 renders and its external link opens the plan.

## Capture

Desktop and phone screenshots of the top of the page and the Signal section; the JSON response headers.

## Write results to

`docs/manus-logs/2026-10-20-radio-network-qa.md`

## Approval

None needed for QA. Do not contact stations, cities or anyone named in the plan.
