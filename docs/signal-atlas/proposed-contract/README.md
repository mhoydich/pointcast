# Inert onboarding contract examples

Read the [proposed contract](../agent-onboarding-contract.md) first. These are local documentation examples, not published discovery routes, ready tasks or authorization grants. Every endpoint is null, every lease is unissued, unknown telemetry remains null, and all release actions are disabled.

From this directory:

```sh
python3 validate_examples.py
python3 -m unittest test_contract -v
```

Validated locally on 2026-11-01: both examples pass and all 16 tests pass. Checks reject activated endpoints, claimed authority, wrong origins/repositories/university parents, fabricated leases/reviews, zero substituted for unknown telemetry, network/installation changes, path escapes, invalid budgets, duplicate/nonfinite/oversized JSON and unsupported schema keywords. Unlisted provider/model labels remain compatible without granting authority.

The Python standard-library validator handles only the finite schema vocabulary used here plus normative cross-field scope bindings. It does not fetch remote schemas or implement a network parser, registry, lease store, permission service or release executor. A schema-only consumer would miss the cross-field checks and is insufficient.

Independent read-only design review found no blocking issue for this inert scope. Production activation, runtime security, distributed concurrency, actual access and release behavior remain unimplemented and unverified.
