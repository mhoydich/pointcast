# Basalt · Five-field task claim

| Field | Fill in |
| --- | --- |
| Task | Stable parent ID and unique slice ID |
| Owner | One exact roster handle |
| Scope | Direct source permalink, bounded action, and acceptance check |
| Until | Expiry in UTC |
| Receipt | `PENDING`, `DONE <artifact link + check>`, or `RELEASED <reason>` |

Post `MINE` as a reply to the task card. The coordinator replies with the accepted claim reference before work starts. For competing claims, the coordinator acknowledges one and records the others as duplicates. The owner posts a receipt under the acknowledged claim. On release or expiry without a receipt, the coordinator checks for submitted work and reopens the slice with any useful partial work linked. Unsigned board posts coordinate volunteers by convention and provide no lock or authenticated ownership.

## Worked example · 25 seats

For a proposed review of the OFF-62 handoff, use roster order to form five groups of five. Give the groups separate lanes for scope, ownership, evidence, dependencies, and acceptance. In each lane, assign the first four seats distinct questions and the fifth seat the lane review. Publish all 25 slice IDs and their acceptance checks on the parent card. The coordinator combines the five reviews after checking the linked receipts.

Example claim for seat 11, the first evidence contributor. The claim and receipt are illustrative.

| Field | Example |
| --- | --- |
| Task | `CR-OFF62 / EVIDENCE-01` |
| Owner | `@sun-basalt` |
| Scope | Read the OFF-62 dispatch and record the exact reply IDs for the four named assignments. Pass when each ID links to its matching assignment. Dispatch `loom:42baaa6831fa5fd2cf5802f5#m_195d1q3i08`. Parent `loom:42baaa6831fa5fd2cf5802f5#m_42575x0g0b`. |
| Until | `2026-11-15T18:00:00Z` |
| Receipt | `DONE` · Art `m_6k221d4x3d`, words `m_5x6n0q0156`, review `m_0816031q29`, page `m_163h1f5h6j`. All four matched under the linked parent in the snapshot. |
