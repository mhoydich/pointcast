# Offline model-upgrade rehearsal

Python 3.9+ standard library only. No installation, provider calls, API keys, spending, training or real user data. All outputs are **hand-authored fixtures, not actual model runs**. No external state changes or automatic upgrades.

```sh
cd tools/signal-atlas-model-upgrades
python3 evaluate.py
python3 evaluate.py --candidate fixtures/candidate-regressed.json
python3 evaluate.py --candidate fixtures/candidate-privacy-leak.json
python3 evaluate.py --simulate-rollback
python3 -m unittest discover -s tests -v
```

Exit 0 means **eligible for human review only**, never deployed. Exit 2 means blocked/invalid. Baseline intentionally misses one ordinary quality task, so the improved fixture demonstrates a genuine deterministic answer change, not fabricated model performance. Baseline critical/trust failure blocks comparisons from promotion eligibility. Any baseline-passing task regression blocks eligibility. Equal results are not improvement. All critical candidate tasks and privacy checks must pass.

## Contracts and integrity

- `contracts.json` records exact v1 task/output/evaluation-receipt versions. `evaluate.py` is the strict output adapter and separate deterministic judge; unknown envelope fields/versions are rejected. Answer equality is JSON-type-sensitive, not a general schema validator.
- `fixtures/tasks.json` saves two reviewed builder tasks/answers plus synthetic privacy, trust, unknown and injection regressions. Exact golden answers are intentionally public and can be memorized. This is scaffolding, not an unbiased benchmark.
- `prompt-v1.txt` is an archived suggested prompt, **not an executed model prompt**.
- `integrity-manifest.json` pins fixture inputs/outputs, contracts, prompt, judge, tests and reviewed dependency files. CLI records baseline/candidate and manifest SHA256. Changed pinned files fail closed. The manifest must contain exactly the required pins and supported version values; the task adapter checks the exact v1 envelope, unique task roster, boolean critical flags and mandatory trust/privacy policy. Hashes do not authenticate authors or prove historical execution. Coordinated file+manifest tampering is outside this local check; a real release needs independent trusted signing/review.
- Input files are capped at 64 KiB; duplicate keys and nonfinite JSON constants and exponent overflow are rejected; reads are bounded before parsing. Reports expose task decisions, not raw answers/private canaries. Canary tests detect known synthetic markers, **not arbitrary PII or a complete privacy defense**.
- Output receipt is `signal-atlas.upgrade-evaluation-receipt/v1`, not a signed `pointcast.league-submission/v1` receipt. It cannot be submitted for live points. Existing protocol and builder files remain unchanged.
- Cost, latency, tokens and real-model quality are null because nothing was measured. No aggregate intelligence or delight score is produced.

## Promotion and rollback boundaries

This supports **offline shadow comparison of saved fixture outputs only**. An actual model-run adapter is intentionally absent. Before real use, authorize and record provider/model snapshot, prompt, sampling/tool configuration, datasets/consent, run timestamps, measured costs/latency, repeat-run variance and independent holdout tasks. Preserve task/schema/judge versions with receipts. Never compare across changed judges as if it were the same result.

A fixture pass only opens human review: broader safety/adversarial testing, separately authorized creative playtests, independent review, rollout authorization, live health thresholds, access controls and an operational rollback plan remain required. `--simulate-rollback` only returns an in-memory label transition; it changes no active model, files or services. Historical achievements retain their original evidence and rule versions; future rules require explicit new versions, not retroactive inflation.

See the [build philosophy](../../docs/signal-atlas/build-philosophy.md) and [creative evolution brief](../../docs/signal-atlas/creative-evolution.md) for building toward new experiences. [Integration provenance](INTEGRATION.json) records the local path changes; source fixtures remain unchanged.
