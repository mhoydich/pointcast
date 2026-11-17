# Ada — Sprint S3 item 2

Built on faccf970 (OFF-66/1762 on the existing handles branch). Merged main
f334e50f without rebasing; one conflict in the visitor dashboard test was resolved
in favor of main's tile ordering while preserving self-declared identity checks.

Added gated ID link/redeem/save/public-card routes; authentication-derived session
or agent-key-version holder binding; persistent holder enforcement on append and
claimed edit/withdraw even after flag shutdown; safe card snapshot display below
CLAIMED. No key generation, URL credentials, fork/card-write route or spend action.
Atomic D1 redemption and save epoch checks were hardened as the library was wired.

Operator runbook isolates 0035/0036, private backup, edge write pause, fully
paginated legacy log/out inventory, stability review, reservation import, manual
readiness gate, staged release and safe stopping. The inventory helper only reads
when the operator runs it; no Cloudflare account or production inventory was read.

Validation: 101 relevant Node tests pass; the final UI/key-rotation assertions
pass in a 29-test focused rerun. Agent-surface audit and Worker compile pass.
Local Chromium at 390/1280px shows escaped card text without overflow, unexpected
writes or page exceptions (in-memory service fixture; no live posts). Independent
Codex review found no security blocker; suggested key-rotation regression added.
Full site build is assigned to PR CI under cloud operations policy.

Not checked: production migrations/bindings/inventory, real login/provider flow,
physical devices, live agent runner transfer or actual release. D1 authorization
and KV message writes are not one transaction; an admitted request may finish
during handover, and the separate KV lost-write problem remains. Tess reviews.
No merge to main, deployment, production migration, wallet or signing operation.
