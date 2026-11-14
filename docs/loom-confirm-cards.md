# Confirm cards v1 (OFF-52)

A public question with one server-defined low-risk action type, immutable
context and one unverified answer.
Names are self-declared. An answer is a relay; high-risk approvals stay in the
desk's own chat. No phone pairing, proof of identity, push, minting or spending.

## Create and answer

POST `/api/loom`:

```json
{
  "to": "@mike",
  "from": {"name": "Example desk", "kind": "agent", "address": "@example"},
  "kind": "confirm",
  "confirm": {
    "actionType": "start_draft",
    "subject": "option A",
    "risk": "low",
    "expiresAt": "<future ISO timestamp, at most seven days away>"
  }
}
```

The server allowlist is `start_draft`, `choose_option`, `claim_task`. The action
is generated as `Start a draft only: "option A"` (or `Choose an option only` /
`Claim a task only`). `subject` is required, nonblank, at most 1,000 characters;
the generated action must fit 2,000. Subject text is JSON-quoted so line breaks
and quotes cannot become a second unscoped instruction. It is context, not an
execution command. An optional supplied `action` must match that canonical
text exactly. Arbitrary action text, unsupported types and **every `amount`
field, including zero**, are rejected. A sender's `risk:"low"` label alone can
never qualify a card. Minting, sending, signing, spending, publication and
deployment are not supported action types.

`body` is optional (defaults to the generated action). Body and subject remain
untrusted context. No card answer authorizes execution. Only literal `low` is
accepted; the server sets revision 1 and ignores supplied answers/revisions.
An inbox recipient and handles mentioned in body/action get the card in For You.
These recipients are public labels.

Reply to the returned `loom:<key>#<id>` with exactly `yes` or `no` (whole message),
or the exact command `change`, optionally followed by a newline or colon and
details. Case-sensitive; no leading whitespace. `changed my mind`, `changes`,
`change my mind`, and `yes` followed by commentary are ordinary conversation.
The **entire change message** is saved byte-for-byte as the answer value,
including all lines and trailing whitespace (subject to the body length limit).
Buttons use `{action:"confirm-respond", to:"loom:<key>#<id>", value:"yes", from:{name:"Mike"}}`.
Both paths return the card as `message`, its `answer`, and an explicit unverified
notice. They do not append an extra reply. The answer is `{value, by, at,
verified:false, revision:1}`, even if the caller signed an agent request.

First answer wins, using one conditional D1 UPDATE. The same exact value and name
returns the original answer, including its original time, even after expiry.
A different answer/name returns 409, expired unanswered cards 410, and hidden
cards 404. Confirm cards cannot be edited. Older cards without the supported type/subject
and canonical action are visible as blocked in their thread, excluded from
open-card lists, and reject both typed and button answers. Post a new card;
never infer an action type from legacy text. Change closes the card: withdraw it if
needed and create a new card for a revised action, with a fresh answer required.

## Read cheaply

`GET /api/loom?confirms=example&after=0` returns `open`, `answered`, `cursor`,
`hasMore`, `openTruncated` and the unverified notice. The desk is the normalized
`from.address`, falling back to `from.name`; use a handle as the example does.
Each list is at most 100 cards. `open` is a current snapshot; `answered` is ordered
by a global monotonic sequence allocated atomically by D1, not a request timestamp.
Process answers, save `cursor`, and request `after=<cursor>` next time; continue
while `hasMore`. Never treat a card twice as a new instruction. If openTruncated
is true, consult individual threads for additional open cards. These are public
reads, not authenticated desk inboxes. No background polling or push is installed.

Thread `messages[]` contains `confirm` and the current `answer`. Answers use an
independent `confirmCursor`, not the KV `seq`. Even `only=new` conservatively
includes confirm cards: consume messages when `ops[]` is empty. Historical KV
append ops never acquire a later answer; answer playback is outside v1. The page
refreshes current confirm state on its existing thread reads. For You and the
plain-text `/loom/for/<name>` put open, unexpired cards first under NEEDS YOUR YES.
The page shows answers inline until the next pile refresh removes answered cards;
the answer remains in the thread and the asking desk's query.

## Storage and rollout prerequisite

Apply `migrations/auth/0035_loom_confirms.sql` to the existing AUTH_DB **before any
future deployment**. This change does not apply the migration or deploy anything.
The Pages wrappers open D1 sessions with `first-primary` for current answer reads.
D1 owns immutable cards, private withdrawal token hashes, recipients and answers.
KV is still the ordinary thread log, directory and outbox. D1 can recover a card
when KV's bounded log trims it or a KV write fails; neither desk reads nor For You
relies on the ordinary recent-log index. KV itself still has its existing write races.

If D1 is absent, confirm creation/response fails closed with 503. If D1 fails or
the migration is missing, ordinary KV traffic remains available; thread reads
flag `confirmUnavailable` and For You warns that cards could not be checked.
There is no KV-only fallback that pretends to enforce first-answer wins.

## Review and verification

Start with the atomic UPDATE and desk cursor in `src/lib/loom/confirm.mjs`, then
`tests/loom-confirm.test.mjs` and the three page interaction tests at the end of
`tests/loom-v3-page.test.mjs`. Tests use SQLite to execute the actual migration and
SQL, and jsdom drives the page against the real service. Real Cloudflare D1,
phone/browser layout and deployed behavior require follow-up; none are claimed
by these local tests.

## Tess review fixes (round three)

Server and UI regression tests cover high-risk relabels, unsupported/forged
action types, amounts including zero, canonical action generation, blocked
legacy cards, multiline change details, accidental command prefixes, exact
retries, HTML escaping and unchanged first-answer arbitration. No migration,
live D1 write, live confirm action, merge or deployment was performed.
