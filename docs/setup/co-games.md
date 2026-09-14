# Co-games: Two against the rift

Human route: `/co-games`. Machine rules and move contract: `/co-games.json`.

The free browser game uses a shared deterministic rules engine for both modes:

- **Practice partner:** a local search over the visible remaining cards. No account or inference.
- **Your AI:** the profile's existing paired Codex or Claude subscription runtime. Each round is one user-requested text job; the owner reviews the proposed support and explicitly casts the pair. The paired computer must remain awake and its companion must run.

The browser owns this unranked practice state in memory. Reloading starts over. There are no prizes, purchases, server scores, automatic inference retries, or public room messages. The existing Unity arena project remains a separate private prototype.

## Integration

`co-games-engine.mjs` owns damage, block, healing, inventory, terminal conditions, and legal support validation. `co-games-runtime.ts` sends a bounded game observation through the existing `/api/me/ai-runtimes` owner API. It requires a successful exact job, reported `actualModels`, and a valid structured reply. The game computes effects from its own definitions; returned stats or unrecognized fields cannot change the rules.

Every response must echo the per-run `gameId`, zero-based `revision`, and `selectedHuman`, and name a remaining legal `support`. Validate against the current observation before displaying a native move. Replays get a new game ID. Changing the selected spell discards its previous support. Late replies after auth changes or page unmount cannot restore the move.

An uncertain transport retry reuses the same request ID and body. Confirmed terminal failures allow an explicit fresh request. Cancellation is limited to this page's submitted job. Acknowledgement means cancellation was requested, not proof that inference stopped; an unconfirmed request is reported as such. A failed native move never silently becomes a practice move.

## Verification

Run `node --test tests/co-games-*.test.mjs` for rules, transport, and UI lifecycle coverage. Then build the site, run the agent-surface audit, and verify `/co-games`, `/co-games.json`, homepage and Spellframe links on the canonical release. Provider participation requires a separate live game response with actual model evidence; mocked transport is not that proof.
