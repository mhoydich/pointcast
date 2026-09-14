# Co-games: Noun battles

Human route: `/co-games`. Machine rules and move contract: `/co-games.json`.

The free browser game uses a shared deterministic rules engine for both modes:

- **Practice partner:** a local search over the visible remaining cards. No account or inference.
- **Your AI:** the profile's existing paired Codex or Claude subscription runtime. Each click on **Play with AI** authorizes one text job and automatically resolves that one turn after validating the returned support. No second cast confirmation is needed. Each following round requires another explicit click. The paired computer must remain awake and its companion must run.

The browser starts with Garden gang and keeps the battle state, battle number, and win count in memory. Reloading starts over. A loss retries the same encounter; a win advances through Garden, Snack attack, Shell club, and Moon crew. **New battle** starts the next different encounter with fresh health/cards and a new game ID. No restart submits an AI task. There are no prizes, purchases, server scores, automatic inference retries, or public room messages. The existing Unity arena project remains a separate private prototype.

## Encounters and combos

The engine exports the encounter definitions used by the board and the AI observation:

| Encounter | Rival health | Incoming attacks | Armor |
| --- | --- | --- | --- |
| Garden gang | 18 | 3, 4, 5, 6 | None |
| Snack attack | 18 | 6, 2, 6, 3 | None |
| Shell club | 20 | 3, 4, 5, 6 | 2 on turns 1 and 2 |
| Moon crew | 22 | 2, 5, 2, 7 | None |

These encounters enable three combos: Ember + Echo adds 2 damage after Focus; Root + Ward adds 2 healing; Focus + Mend adds 2 healing to Mend's usual 3. Healing remains capped at 14. Armor reduces combined outgoing damage once per turn after combo bonuses, with a minimum of zero damage. The legacy `classic` engine encounter keeps its original 18 health, 4/6/5/7 attacks, and no combos.

The session win count records only battles won in this tab; it is neither stored nor submitted as a leaderboard score. Starting a different battle first attempts cancellation of any uncertain AI request owned by the page. Unconfirmed cancellation remains visible in native mode; it is not reported as a stopped provider task.

## Integration

`co-games-engine.mjs` owns damage, block, healing, inventory, terminal conditions, and legal support validation. `co-games-runtime.ts` sends a bounded game observation through the existing `/api/me/ai-runtimes` owner API. It requires a successful exact job, reported `actualModels`, and a valid structured reply. The game computes effects from its own definitions; returned stats or unrecognized fields cannot change the rules.

Every response must echo the per-run `gameId`, zero-based `revision`, and `selectedHuman`, and name a remaining legal `support`. Validate against the current observation before resolving a native turn. Replays get a new game ID. Changing the selected spell invalidates a pending request identity. The last native explanation and actual model stay visible after a resolved turn until the next request, replay, provider change, or sign-in change. Late replies after auth changes or page unmount cannot restore the move.

An uncertain transport retry reuses the same request ID and body. Confirmed terminal failures allow an explicit fresh request. Cancellation is limited to this page's submitted job. Acknowledgement means cancellation was requested, not proof that inference stopped; an unconfirmed request is reported as such. A failed native move never silently becomes a practice move.

## HUD controls and turn events

Choose one of the three spells, then use **Play turn** in practice or **Play with AI** for the paired runtime. The optional **Help me choose** button selects the best legal human spell using the same deterministic engine search as the practice partner; it does not request inference or change the rules. Buttons are disabled during a native request. Native failure or cancellation leaves the round untouched.

The page may expose `[data-current-threat]`, `[data-partner-choice]`, `[data-quick-tip]`, and `[data-outcome]` for compact HUD text. Encounter hooks are `[data-encounter-name]`, `[data-encounter-tip]`, `[data-battle-intent]`, `[data-current-armor]`, `[data-enemy-max]`, and `[data-combo-preview]`; session counters are `[data-wins]` and `[data-match-number]`. Numeric `[data-threat]` spans use zero-based turn indexes and update to the encounter's attacks. `[data-new-battle]` starts the next different encounter and is disabled while a native request runs. `[data-hint]` is the optional recommendation button. All are safe to omit. The existing detailed controls remain available to the page layout.

Every successfully resolved turn dispatches a bubbling `co-games:turn` event from the game root with a frozen, plain-data detail: `{human, support, damage, taken, healing, hp, enemy, round, status, model, reason, combo, armor}`. Human/support values are engine card IDs; `round` is the one-based round just resolved; `model` is the actual model names joined as text, or `null` for practice. `combo` is `{name, description}` or `null`; `armor` is the damage actually absorbed on this turn. This event supports animation only; the deterministic engine remains authoritative. Event detail contains no request IDs, credentials, or profile data. Render `reason` as text, never HTML.

Each restart dispatches a bubbling `co-games:match` event with frozen detail `{encounter, matchNumber, retry}`. This lets presentation/audio refresh the cast and reset turn tracking. No initial event is emitted; the presentation initializes its first cast itself.

## Verification

Run `node --test tests/co-games-*.test.mjs` for rules, transport, and UI lifecycle coverage. Then build the site, run the agent-surface audit, and verify `/co-games`, `/co-games.json`, homepage and Spellframe links on the canonical release. Provider participation requires a separate live game response with actual model evidence; mocked transport is not that proof.
