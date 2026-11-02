# Local integration validation — 2026-11-01

The unchanged source comparator from Library kit version 1 passed all 25 tests before integration. The integrated comparator then passed the same 25 tests against the sibling `signal-atlas-protocol` dependencies.

Run from the repository root:

```sh
cd tools/signal-atlas-model-upgrades
python3 -m unittest discover -s tests -v
python3 evaluate.py --simulate-rollback
```

The evaluation command exits 0 for the saved improved fixture: eligibility for human review only. The example output is [example-comparison.json](example-comparison.json). Regression and privacy-leak fixtures exit 2; tests check that the synthetic private marker is not echoed. Cost, latency, token usage and actual model quality remain null. Rollback is an in-memory label simulation and changes no external state.

Source inspection found only local Python standard-library reads, deterministic comparison and stdout output. Tests create isolated temporary files and invoke the same local CLI. No provider SDK, network client, model run, credential load, deployment action or real-data integration was added.

Integration changed dependency locations and the test's temporary copy locations, then regenerated the local manifest hashes for those changes. Golden fixtures and judging semantics are unchanged. [INTEGRATION.json](INTEGRATION.json) retains the original manifest and judge hashes. The source Library bundle was preserved.

These tests do not establish real model performance, arbitrary-PII detection, operational rollback, production security, or human enjoyment. Local hashes detect drift against the saved manifest; they do not authenticate authors or prove prior execution.
