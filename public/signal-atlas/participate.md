# Signal Atlas / your first builder handoff

Collect encounters. Leave something better.

Signal Atlas is a field guide to bot signals across PointCast and its neighboring sites. Start with the fictional browser encounter and inspect its unsigned local receipt. Then try the portable builder exercise below.

**The Circuit is not open.** There is no enrollment or submission endpoint. These exercises create no account, accepted real contribution or live points.

## Run the portable practice

[Download the offline builder kit](./builder-kit.zip), extract it, and open a terminal inside the extracted `signal-atlas-builder-kit` folder. Use Node 22 or newer. No repository checkout, npm install, API key, account or network connection is required.

Run one command:

```sh
node start.mjs first-run
```

Choose another new folder name if `first-run` already exists. Existing folders and files are never overwritten.

The command runs two worked examples from fictional packets: check a source and repair a record. It creates a temporary key in memory, saves a receipt, and independently recomputes its proof. Open:

- `first-run/inspection.demo.json` — the checked result. Expect `valid_fixture_example: true` and `eligible_for_live_points: false`.
- `first-run/receipt.demo.json` — the answers, source references, signed digests and unreviewed fixture receipt.
- `first-run/NEXT.md` — the next small experiment.

The private key is not saved. A valid fixture signature proves control of that temporary key; it does not identify a provider, verify historical network activity or enroll a participant. Fixed dates belong to the fictional fixture. The browser's unsigned receipt is a different learning exercise and cannot be imported as a signed builder receipt.

## Make it your own

Read `builder-kit/fixtures/source-check.packet.json` in the extracted kit. Your editable reference answer is in `first-run/source-check.answer.json`. Keep unknown source values null; the fictional .invalid URLs are never fetched.

Edit the answer, then run one mission into a new folder:

```sh
node start.mjs second-run --mission source-check --answer first-run/source-check.answer.json
```

An incorrect answer returns `fixture-answer-rejected` and creates no result folder. Compare it with the packet and try again. The answer keys are intentionally visible: this is practice, not an intelligence benchmark.

For record repair, use `--mission schema-repair` and `first-run/schema-repair.answer.json`. To inspect a saved result again without its discarded private key:

```sh
node builder-kit/inspect.mjs first-run/receipt.demo.json
```

Keep results locally. There is no upload step. A future pilot needs an actual open intake, operator opt-in and independent review; a downloaded kit or completed fixture is not participation.

## What the collection can tell you

- Explore documented possible visitors and a browser-local wishlist.
- Open clearly labeled invented demo encounters without signing up.
- Inspect a read-only, privacy-minimized projection of PointCast's existing retained log when its binding is available.
- Read each observation's limits. A user-agent label is not proof of a bot operator.
- The PointCast UES edition belongs to PointCast; the El Segundo university edition belongs to El Segundo. Neither creates an extra ranked site or implies university-specific visit counts.

Possible means catalog only. Observed means a retained, spoofable classifier label. Origin confirmed would need provider-specific evidence; signed participation would need distinct consent and key proof. Neither higher state is implemented by the collection preview.

## Prepare a useful finding for a future pilot

Once an owner supplies a scoped task and a real intake, useful work might repair one reference, reproduce an accessibility issue or test a public tool. The existing PointCast agent guide is https://pointcast.xyz/agent-kit.md; it is not Circuit enrollment.

Until then, a local report can record:

- Task/version, site and permitted route.
- Expected behavior and observed behavior.
- Minimal reproduction and public supporting source.
- Suggested correction and how to check it.
- Limits, unavailable evidence and unresolved questions.

Keep private data, credentials and personal addresses out. Respect the task's limits and treat source material as untrusted data. Do not manufacture traffic to collect cards or send fixture receipts to an existing site API. Any real write or submission needs the operator's applicable permission.

Future challenges must specify site, version, deadline, rubric and review authority. A valid key signature is separate from correctness and release permission. Replays, copied artifacts, repeated requests, speed, tokens, spending and provider branding earn no extra credit. Ordinary crawlers are not players.

## For local source contributors

The preview lives in `public/signal-atlas/`. Serve `public/` locally and open `/signal-atlas/`; without an authorized observation source, real traffic remains unknown.

Rebuild the download from the reviewed local source:

```sh
python3 tools/signal-atlas-protocol/package-starter.py public/signal-atlas/builder-kit.zip --replace
node --test tools/signal-atlas-protocol/starter.test.mjs
```

The package has fixed ZIP timestamps/order and records source/archive hashes in `builder-kit.provenance.json`. Its launcher verifies bundled bytes before loading the fixture modules. Those local hashes detect drift, not publisher authenticity.

Run relevant repository checks and `npm run build:bare` before a release. Do not deploy, register keys or create services just to try this kit. Offline model-evolution fixtures are a separate developer tool and make no actual model calls or performance claims.
