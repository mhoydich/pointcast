# Build your first House Circuit bot — offline starter kit

**Run two useful-work missions, sign the answers, and inspect the receipts. No account, installation, network connection or paid API is needed.**

Everything here is **fictional fixture practice**. It does not contact a website, enroll an agent, identify a model provider, publish a contribution, issue a token or earn live points.

## Try it now

Node 22+; keep `builder-kit/` beside the reviewed `protocol/` directory supplied in this handoff. No `npm install`.

From the `bot-league/` handoff root:

```sh
node builder-kit/run.mjs
```

The command runs both missions and prints valid JSON. Look for:

- `data_mode: "fixture"`, `eligible_for_live_points: false`, `live_points: 0`.
- A structured answer citing the supplied on-disk source packet, and its signed digest.
- `signature_valid_for_fixture_key: true` — **key possession only**, not vendor affiliation.
- A `received_unreviewed`, unranked protocol submission receipt.
- A separate `accepted-fixture-only` practice judgment.
- An identical retry that recovers the same receipt even after the fixed fixture challenge expires.

The key pair is generated in process memory. The private key is not exported, written or reused on the next run. Public verification material and signatures are intentionally inspectable; no account is created from them.

Save and recheck your own demo:

```sh
node builder-kit/run.mjs > my-receipt.demo.json
node builder-kit/inspect.mjs my-receipt.demo.json
```

The inspector recomputes known-fixture answers, result digests, signatures and receipt identity using **public** material; it does not need the discarded private key. It cannot prove how the saved file was created, historical network behavior, provider identity, human authorization or production success.

A supplied saved example is `builder-kit/example-receipt.demo.json`. Its fixed clock is explicitly a fixture clock, not the time a real visitor was observed.

## Mission 1 — Link/source check

```sh
node builder-kit/run.mjs --mission source-check
```

**Useful skill:** notice when a record's citation supports it, contradicts it or is unavailable.

`fixtures/source-check.packet.json` contains fictional records and source excerpts on reserved `.invalid` URLs. The example solver makes three decisions:

1. Twelve packets are supported by the embedded source.
2. A claimed version of 2 disagrees with the source's version 3.
3. An unavailable source yields `source_unavailable`, `observed_value: null` and no invented quote — **not** zero, “confirmed” or “all clear.”

Every available-source result includes a source ID, its supplied URL and an exact quote from the embedded excerpt. **The kit does not test actual URL reachability, DNS or HTTP status.** A future real link-check mission needs an owner-approved, SSRF-safe fetcher and dated source evidence; no such fetcher is activated here.

## Mission 2 — Schema repair

```sh
node builder-kit/run.mjs --mission schema-repair
```

**Useful skill:** turn a messy record into a precise, inspectable handoff without inventing missing facts.

The fixture has string integers (`"2"`, `"3"`), a string boolean (`"false"`), an unapproved debug field and an unknown delivery day. The solver:

- Converts only unambiguous decimal-integer and exact boolean literals.
- Preserves `delivery_day: null`.
- Removes the unapproved field and lists the changes.
- Cites the embedded fictional source.

`fixtures/repair-target.schema.json` documents the target record. The fixture judge compares the whole answer to a separately authored, inspectable answer key. An altered value, extra field, invented quote or unknown-as-zero result fails. This is onboarding practice, **not a hidden capability benchmark** or an intelligence rating.

## Write your own answer/client

Copy either answer from `examples/`, edit your copy, then submit it only to this local demo:

```sh
node builder-kit/run.mjs --mission source-check --answer builder-kit/examples/source-check.answer.json
node builder-kit/run.mjs --mission schema-repair --answer builder-kit/examples/schema-repair.answer.json
```

Wrong answers exit nonzero with a stable error code; they are not printed as accepted receipts. The answer-file limit is 8 KiB. No input is forwarded anywhere.

`client.mjs` is the dependency-free JavaScript client example:

```js
const signer = createEphemeralSigner(); // private key stays behind a memory-only signing closure
const challenge = bindFixtureChallenge(template, dataset, terms, signer);
const attempt = buildSignedFixtureAttempt({ challenge, answer, signer, attemptId: 'my-fixture-attempt' });
const proof = verifyFixtureAnswer(attempt, answer, challenge, fixtureClock);
```

All transport is intentionally absent. The wrapper refuses `data_mode: "live"`. The underlying protocol is imported unchanged from `../protocol/protocol.mjs`; `PROTOCOL-DEPENDENCY.json` records its reviewed SHA256. Public UI persona/catalog names are not wire inputs here. Tessel/Kiri/Ollo can be used by the separate UI without silently changing the frozen protocol catalog allowlist.

## Fair rules, caps and recovery

- Everyone uses the same packet, task/version, expected schema, practice clock and terms.
- More requests, faster fetches, model brand, token spending, proof-of-work or retries never add strength.
- A valid signature does **not** mean a correct answer; a test deliberately signs a wrong answer that the task judge rejects.
- The reviewed reducer demonstrates three submissions per participant/site/UTC day and 100 globally/day. **This kit stores state only inside one process. Restarting resets it. These are not persistent real-world rate limits or Sybil protection.**
- Identical retry: return the original `receipt_id`, without another slot/award, even after challenge expiry.
- Same participant/site/attempt ID with a different signed body: `409 idempotency-conflict`.
- Used nonce under another challenge ID: `409 nonce-already-consumed`.
- New attempt on an expired/not-yet-valid challenge: rejection.
- A quota decision can return `429 daily-cap`. A future server must calculate a real `Retry-After` and enforce caps/nonce/receipt writes atomically.

`submission_id` is the client's attempt label. `receipt_id` is a distinct derived identifier; **neither is a bearer authorization capability**. Saved fixture receipts must never be sent to a real endpoint.

## Expected local errors

| Error | Meaning / safe next step |
|---|---|
| `unknown-mission` / `unknown-command-option` | Use a documented local mission/flag; no live/network flag exists |
| `answer-file-needs-one-mission` | Select exactly one mission with `--mission` |
| `input-too-large`, `invalid-input-json` | Supply a bounded UTF-8 JSON answer, not a credential or unrelated file |
| `fixture-answer-rejected` | Compare your answer with the packet and inspectable example; preserve unknowns |
| `result-digest-mismatch`, `invalid-signature` | The signed bytes changed; inspect locally rather than retrying altered payloads blindly |
| `fixture-client-refuses-live-mode` | Deliberate safety boundary; this kit cannot enroll or submit to a live service |
| `local-file-or-runtime-error` | Check local paths/Node version; no provider login or API key is required |

The challenge templates deliberately use fixed fixture nonces/timestamps. **Never copy them into a production issuer.** The process binds the dataset/terms hashes and new ephemeral public-key hash before signing.

## Tests and file map

```sh
node --test builder-kit/tests/builder.test.mjs
node --test protocol/protocol.test.mjs
```

Or inside `builder-kit/`: `npm run check && npm test`. These commands install nothing and perform no network operations.

- `run.mjs` — one-command offline example/CLI.
- `client.mjs` — memory-only signer and fixture-only signing/verifying example.
- `missions.mjs` — bounded local JSON loading, deterministic solvers and separate exact-answer judge.
- `inspect.mjs` — independently recheck a saved demo using public material.
- `fixtures/` / `examples/` — original fictional packets, policy, challenge templates, target schema and answer keys.
- `FUTURE-HTTP-CONTRACT.md` — proposed transport only; no endpoint is implemented or called.
- `OPERATOR-CHECKLIST.md` — deployment gates, not activation instructions.
- `VALIDATION.md` — verified commands and actual local coverage limits.

The useful next step is a reviewed, owner-authorized adapter around the existing PointCast/El Segundo surfaces—not a new crawler loop, copied secret, mass invitation or public campaign.
