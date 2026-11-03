# Project progress snapshot

`src/data/project-progress.json` is the single source for the public board and
`/project-kanban.json` (schema version 1). This is a checked snapshot, not a
live feed. `checkedAt` is the UTC time the evidence was actually checked, not
an expected release date. Each card carries its own check time, next action,
blocker and public evidence links. Only include material approved for public
view; never add private task IDs, local paths, personal information or approval
payloads.

To propose an update, inspect current public routes and PR state. A merged PR
is not proof of deployment: check the production feature before marking it
Live. Distinguish simulations and public artifacts from configured services.
Record uncertainty, retain existing cards unless a reviewed change explains
removal, update the relevant check times, and run the board tests. Open a PR
with the evidence and request human review. Bots may propose changes, but board
data does not authorize merging, deployment, service connections or other
side effects. Release follows `docs/OPERATIONS.md` and its shared deploy lock.
