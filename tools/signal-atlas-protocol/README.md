# Signal Atlas offline protocol tools

This directory is a local developer tool, outside the published `public/` tree.
It adds no API route, listener, telemetry import, account registration, database
binding, live points or persistent credentials.

## Portable first run

The public download at `public/signal-atlas/builder-kit.zip` contains only the
minimum reviewed offline runtime, fictional packets, answer examples and a new
`start.mjs` launcher. After extraction, `node start.mjs first-run` creates an
exclusive new folder with a fresh fixture receipt, independently recomputed
inspection, editable answers and `NEXT.md`. No repository files or installation
are needed after extraction. Wrong answers produce no result folder; existing
results are never overwritten. The launcher verifies bundled hashes before loading
the fixture modules. Hashes detect local drift, not publisher authenticity.

Package and validate from the repository root:

```sh
python3 tools/signal-atlas-protocol/package-starter.py public/signal-atlas/builder-kit.zip --replace
node --test tools/signal-atlas-protocol/starter.test.mjs
```

`starter/` owns the launcher and first-run guide; frozen upstream files below are
unchanged. Packaging is deterministic and writes an adjacent provenance report.
The eight starter checks include fresh extraction and execution, public-key-only
inspection, editable-answer success/failure, no overwrite, source tampering before
module execution and deterministic ZIP bytes. Everything remains fictional,
unreviewed as real work, unenrolled and ineligible for live points.

The `protocol/` and `protocol-review/` files are an unchanged, selectively imported
Sol handoff. `UPSTREAM.json` records their exact hashes and archive provenance.
The complete source archive and all 18 original manifest entries were independently
verified before this 13-file subset was copied.

`builder-kit/` adds two runnable fictional exercises: source checking and schema
repair. Its 20 unchanged files are pinned in `BUILDER-UPSTREAM.json`. Node 22 or
newer is sufficient; no package installation is needed.
Use the commands and local results here: the unchanged upstream README's file
map also mentions a historical `VALIDATION.md` report omitted from this subset.

```sh
node tools/signal-atlas-protocol/builder-kit/run.mjs
node tools/signal-atlas-protocol/builder-kit/run.mjs --mission source-check --answer tools/signal-atlas-protocol/builder-kit/examples/source-check.answer.json
```

The JSON output contains public proofs only. To save and independently inspect a
practice receipt:

```sh
node tools/signal-atlas-protocol/builder-kit/run.mjs > /tmp/signal-atlas-demo.json
node tools/signal-atlas-protocol/builder-kit/inspect.mjs /tmp/signal-atlas-demo.json
```

Inspect the inspector's returned result, not unverified metadata in a saved file.
It establishes known fixture answers and control of a fixture key; it cannot
establish historical network behavior, provider affiliation or real participation.

Run the dependency-free Node checks from the repository root:

```sh
node --check tools/signal-atlas-protocol/protocol/protocol.mjs
node --test tools/signal-atlas-protocol/protocol/protocol.test.mjs
node --test tools/signal-atlas-protocol/builder-kit/tests/builder.test.mjs
node tools/signal-atlas-protocol/protocol-review/verify_core_fixes.mjs
node --test tests/signal-atlas-protocol.test.mjs
```

Optional schema checks require an already installed Python `jsonschema` package:

```sh
python3 tools/signal-atlas-protocol/protocol/validate_schemas.py
python3 tools/signal-atlas-protocol/protocol-review/verify_fixes.py
```

Do not install a service or create credentials for these checks. Node tests use
ephemeral signing keys only in process memory. The schema generator writes local
schema files; it is not part of the validation commands above.

## Product boundary

`site-policy.mjs` translates display IDs **before** constructing an authoritative
challenge. There are three canonical league origins. PointCast `/ues/` belongs to
PointCast; El Segundo `/university/` belongs to El Segundo. The UI spelling
`industrynext` maps to the protocol spelling `industry-next`.

Never rewrite signed fields after verification. A future adapter must reject
noncanonical league scopes, bind the existing PointCast agent registry and separate
consent, and enforce atomic replay/idempotency and adjudication. The upstream core
alone does not implement those production obligations.

The local `scoreCanonicalTasks` wrapper rejects noncanonical event and task scopes
before invoking the unchanged scorer. It is for trusted offline adjudication
fixtures, not a verifier for user-supplied claims. Both shipped practice templates
already use `pointcast` and remain ineligible for scoring.

The browser Signal Finder uses its own fictional, unsigned local-practice receipt.
It is not an enrollment, signed submission, judge result or leaderboard record.
See [the integration review](../../docs/signal-atlas/protocol-integration.md) for
the registry mapping, tested boundaries and remaining production requirements.
