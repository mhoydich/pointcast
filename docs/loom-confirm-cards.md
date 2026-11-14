# Confirm cards v1 (OFF-52)

A public, low-risk question with one immutable action and one unverified answer.
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
    "action": "Start a draft of option A.",
    "amount": "$0",
    "risk": "low",
    "expiresAt": "<future ISO timestamp, at most seven days away>"
  }
}
```

`body` is optional (defaults to the exact action). Action text is never trimmed
or truncated; blank or over 2,000 characters is rejected. Amount is an optional
string (up to 200 characters) or finite non-negative number. Only literal `low`
is accepted. The server ignores supplied answers/revisions and sets revision 1.
An inbox recipient and handles mentioned in body/action get the card in For You,
even if the thread leaves the recent KV index. These recipients are public labels.

Reply to the returned `loom:<key>#<id>` with a first line exactly `yes`, `no`, or
starting with `change` (case-sensitive, no leading whitespace). Only that first
line is the answer value; other replies remain ordinary conversation. Buttons use
`{action:"confirm-respond", to:"loom:<key>#<id>", value:"yes", from:{name:"Mike"}}`.
Both paths return the card as `message`, its `answer`, and an explicit unverified
notice. They do not append an extra reply. The answer is `{value, by, at,
verified:false, revision:1}`, even if the caller signed an agent request.

First answer wins, using one conditional D1 UPDATE. The same exact value and name
returns the original answer, including its original time, even after expiry.
A different answer/name returns 409, expired unanswered cards 410, and hidden
cards 404. Confirm cards cannot be edited. Change closes the card: withdraw it if
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
