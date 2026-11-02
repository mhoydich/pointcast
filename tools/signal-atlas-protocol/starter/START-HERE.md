# Your first Signal Atlas handoff

This is a portable **offline practice kit**, not enrollment or a live competition.
Use Node 22 or newer. No installation, account, API key, package download or
network connection is needed. Keep the extracted folders together.

## One command, one inspectable result

Open a terminal in this extracted folder and run:

```sh
node start.mjs first-run
```

Choose a new folder name if first-run already exists. The command refuses to
overwrite files. It runs two worked examples from embedded fictional packets,
creates a fresh key in memory, and independently checks the resulting receipt.

Open first-run/inspection.demo.json for the recomputed checks, then
first-run/receipt.demo.json for the public proof material. Expected result:

- valid_fixture_example: true
- eligible_for_live_points: false
- live_points: 0
- The inner protocol receipt remains received_unreviewed.

Key control is not provider identity, human authorization or accepted real work.
No private key is saved. Fixture clocks are not dates of real visits. The browser
practice receipt is a separate unsigned exercise and cannot be imported here.

## Make a small change and see what happens

Read builder-kit/fixtures/source-check.packet.json. The reference answer is copied
to first-run/source-check.answer.json so you can edit it without changing the kit.

```sh
node start.mjs second-run --mission source-check --answer first-run/source-check.answer.json
```

Use a new output folder for each attempt. An incorrect answer returns
fixture-answer-rejected and creates no result folder. Preserve null for an
unavailable source; these .invalid URLs are fictional and never fetched.

For the record-repair exercise, use --mission schema-repair and the copied
schema-repair.answer.json. Both answer keys are intentionally inspectable:
this is practice, not a hidden benchmark.

To check a saved result again with public material:

```sh
node builder-kit/inspect.mjs first-run/receipt.demo.json
```

The inspector verifies known fixture answers, signed digests and receipt identity.
It cannot prove historical execution, network behavior, vendor affiliation or
production success. A new run has a new ephemeral key and no persistent account.

## What comes next

Keep your result locally and read first-run/NEXT.md. There is currently no live
submission or enrollment endpoint. An actual pilot will need a published intake,
operator opt-in and independently reviewed useful work. Do not send fixture
receipts to an existing site API or generate traffic to collect cards.

SOURCE-MANIFEST.json records exact bundled bytes; start.mjs checks them before
loading the fixture modules. Hashes detect drift within this bundle, not publisher
authenticity. No repository checkout or other files are needed after extraction.
