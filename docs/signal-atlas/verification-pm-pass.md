# Signal Atlas product pass — 2026-11-01

This iteration continues the local draft against PointCast base `a9e89d302ed32e8c978e6046126faff39c21a99a`. Nothing has been uploaded, merged, deployed or posted publicly. The original source archive and publishing supplement remain unchanged.

## Concrete changes

- The opening copy now names bots and explains the collection, evidence, wishlist and useful-work value. The first action remains one fictional encounter, followed by an inspectable local exercise.
- Fixed a misleading transition: the real-evidence action previously left the invented demo selected. It now resets demo/search/filter, cancels obsolete reads, and puts keyboard focus on the collection heading. Unknown sources remain unknown.
- A completed exercise now has a warm field-note panel and a real JSON download. The downloaded object is the exact evaluated unsigned local receipt; no account, submission, reviewed contribution or score is created. Editing/reset invalidates both the displayed result and download.
- Independent review found delayed evidence reads could detach a focused wishlist button or documentation/practice link. Stable control identities now restore the focused control and its open disclosure, with search as a fallback when a card disappears.
- The builder link now downloads a self-contained offline ZIP rather than only a document. After extraction, `node start.mjs first-run` creates a new, exclusive output folder containing a signed fixture receipt, independent inspection and editable answers. The signature proves fixture key control only; no private key is persisted, and no network or live enrollment is used.
- Five editions now have a local review launcher, distinct page titles and a guarded return bar. Their local home links stay in the preview. The review bar is excluded from ordinary standalone/production paths. Both university editions retain their own parent identity.
- The exporter and immutable preview server now handle absolute macOS `/tmp` aliases correctly. Previously their entrypoint guard could silently exit without executing. Regression tests verify actual CLI output, the complete export and refusal to overwrite an existing destination.

## Verification

| Check | Result and evidence |
| --- | --- |
| Combined focused Node suite | **190 passed**, zero failures/skips; `/tmp/signal-atlas-pm-node-tests-final.log` and `.json` record the exact test files and exit 0 |
| Full `npm run build:bare` | **Exit 0**, 3,792 pages and 145 game downloads; completed 2026-11-01 22:12:57 UTC; `/tmp/signal-atlas-pm-build.log` and `.exit.json` |
| Built asset integrity | All seven changed Atlas/kit assets exactly match their source bytes after the build; `/tmp/signal-atlas-pm-built-integrity.json` |
| Five-edition browser suite | **49 passed** at 1440, 390 and 320px; zero page errors, CSP violations, external requests or observation API calls; `/tmp/signal-atlas-review-v3-qa/results.json` |
| Final export transition | **8 targeted v4 checks passed**. All 117 exported file hashes and 19 source-input hashes are identical to the browser-tested v3; only the exporter generator hash changed. `/tmp/signal-atlas-review-v4-qa/integrity.json` and `targeted-results.json` |
| Independent code review | Initial focus-loss and `/tmp` CLI findings fixed and independently rechecked. No remaining finding in those scopes. Server checks included read-only methods, missing APIs, malformed paths/traversal and manifest validation. |
| Visible in-app browser | Actual local receipt downloaded; keyboard first-use and stale-result clearing checked at 320/390/1440px. Observatory 2D selection returned to the selected catalog disclosure with wishlist and focus preserved. No warning/error console entries in these checks. |

The dependency tree was copied locally from `~/pc-deploy`, whose package-lock SHA-256 exactly matches the selected source: `a7114e053a0623a7e68833361546095c93bf8e7cfa6ff1135d76fd5016eecf7d`. No package installation or new credential was needed. The full build still reports existing Vite warnings about unrelated imports/chunk size; it completes successfully.

The final frozen export is `/tmp/signal-atlas-editions-20261101-review-v4`. Manifest SHA-256: `a5ae48799a0f0c735ebb75be9afedb944ce6adbfe7574faac2e225bcfb8e635e`.

Builder ZIP: 56,617 bytes, SHA-256 `261ae7dbcce5a417faae346165088ae1ccae7ccf6756b4793990c290393ca5f4`. The browser-tested downloads from all editions match the packaged artifact.

## Review location and limits

Local launcher: `http://127.0.0.1:57100/`. It serves a hash-verified immutable snapshot with strict CSP and no observation endpoint. It works on the Mac, not as a public iPhone link, and requires the local server to remain running. Restart explicitly with:

```sh
node scripts/signal-atlas-preview.mjs /tmp/signal-atlas-editions-20261101-review-v4 --port 57100
```

Screenshots: `/tmp/signal-atlas-review-v3-qa/pointcast-390-receipt-panel.png`, `pointcast-1440-completed-practice.png`, and `launcher-390.png`. Their runtime bytes match v4.

These checks do not establish real visitor activity, a public deployment, actual participant enrollment or reviewed useful work. Physical-device, native screen-reader, Safari and Firefox validation remain unperformed. The release-safeguard patch has its own baseline, tests and review report; it is not applied to production by this product pass.
