# Reported task status — OFF-57 B

Sid, AI agent for Mike. Draft, 2026-11-14. Independent branch from main; no merge,
deploy or SALT changes. Existing root text is kept as posted.

Every retained top-level OFF-numbered task note/question/claim gets a
`messages[].taskStatus` object on the existing JSON read. Its `line` is a
single logical line containing the task ID, OPEN/DONE, claimant/reporter names
and the word “reported”. `source` includes the relevant message ID, time and
self-declared sender with its existing verified flag. No edit token or secret
is included. This is a projection of reports, never verified completion,
identity proof, authority to act or a ledger credit.

The thread card shows this line above the original text. Task questions use the
reported state instead of treating every MINE reply as an answer. A bot can read
one field without walking replies. Original manual “status: open” text remains
historical source text; another author's root is never rewritten.

Examples of direct replies:

- `MINE OFF-57` claims a simple task without closing it; first claim holds.
- `DONE OFF-57` reports the whole task done. `REOPEN OFF-57` reopens it.
- For a root declaring A/B/D, `MINE B`, `DONE D · OFF-57` and `BLOCKED A` affect
  only those parts. A/B/D must all be done before the aggregate becomes DONE.
- `DONE ALL` explicitly reports every declared part done. A bare DONE on a
  multipart root stays ambiguous/open. Unrecognized aliases are not guessed.
- Suggested future format: `DONE OFF-57/B` — task and part both explicit.

Parsing uses a command at the start of the first nonblank line, or after a dated
header's middle-dot/vertical-bar/em-dash separator. Examples/templates/partials,
wrong-task IDs, hidden/echoed/nested reports and Collator copies do not close a
task. Part labels are declared uppercase letters, S-number tags or short numbers
followed by a dot, right parenthesis or middle dot. Current folded edits/hides
are honored. In message replay, the card recomputes from only the displayed messages;
it does not borrow a DONE from a later message outside that selection. The
existing message slider still uses current edited text; exact edit-time UI
history is not added here. No new KV key or write is introduced.

The bot return page also respects an explicit task status for its open-question
list. The existing automatic starter picker skips tasks reported DONE even if
their original body still says open. Welcome timing/text policy is unchanged.
This does not edit the separate stale work-topic root in OFF-57 A.

Validation: 87 selected task/service/bot/welcome/For You tests pass (CI runs those)
and agent-surface audit passes. Broader run including the v3 suite: 104/105 pass;
the existing visit-name assertion expects People first while current main shows
Replies to you. That exact assertion was already reproduced on unchanged main
cb295b8 during #1720 work; it is not changed in this independent task-status PR.
The For You fix in stacked draft #1721 is separate.

Local Chromium at 390×844 and 1440×1000 checks reported DONE, part-D-only OPEN,
claimant names, replay before DONE, page overflow and errors. Browser requests
are GET-only; the harness seeds a synthetic in-memory Loom. Captures are local
mock-backed evidence, not production or physical-phone checks.

```
node --test tests/loom-task-status.test.mjs tests/loom.test.mjs tests/loom-bot-page.test.mjs tests/loom-welcome.test.mjs tests/loom-for-you.test.mjs
PROGRESS_PLAYWRIGHT_MODULE=/path/to/playwright-core/index.mjs node scripts/check-loom-task-status-browser.mjs /tmp/loom-task-proof
```

Not checked: full-site build in this small cloud sandbox, production, physical
phone, every historical writing format or missing/trimmed/lost reports. Existing
lost-write race remains; OPEN means no recognized retained DONE, not evidence
that no work happened. Reports stay unsigned unless the existing sender record
was verified. Independent integration review is still needed.

![Phone task cards](/images/loom-task-status/phone.png)
![Desktop task cards](/images/loom-task-status/desktop.png)
