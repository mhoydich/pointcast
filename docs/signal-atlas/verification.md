# Signal Atlas — verification and release handoff

Date: 2026-11-01. Scope: isolated local PointCast draft, offline tooling and generated review editions. This report establishes local checks, not production availability or real traffic.

## Outcome

The full repository `npm run build:bare` completed with exit 0. Astro built 3,792 pages; the following download preparation completed for 145 games. The log records build completion and successful download preparation. The local evidence files are:

- `/tmp/signal-atlas-build-complete.log`
- `/tmp/signal-atlas-build-complete.exit` — `0`
- `/tmp/signal-atlas-built-integrity.json`

Earlier build attempts were interrupted by execution-host disconnects or failed on sandbox DNS. They are superseded by this confirmed complete run, not counted as successful builds.

## Automated verification

| Scope | Result | Interpretation |
| --- | --- | --- |
| Repository Signal Atlas Node checks | 51 passed | Adapter privacy/fail-closed behavior, preview boundary, practice, observatory, editions and local protocol policy |
| Frozen offline protocol Node suite | 65 passed | Fixture protocol and replay/idempotency behavior within the offline harness |
| Frozen builder-kit Node suite | 60 passed | Fictional source-check/schema-repair exercises and local inspection |
| Total Node checks | 176 passed | The preceding three groups; observatory tests are included, not added again |
| Integrated model-evolution comparator | 25 passed | Hand-authored fixture comparison only; no model execution |
| Observatory regression subset | 14 passed | Included in repository tests; keyboard/pointer, 2D and reduced-motion boundaries |

The API and middleware also bundled successfully with the repository's esbuild. The independent protocol regression script passed. Original protocol and builder source hashes were verified before selective integration; model-comparator integration records its path-only source adjustments and unchanged fixture semantics.

The original model scaffold's 25 tests passed before integration as well. Those are not counted as an additional independent product suite.

Python protocol/schema validation could not be rerun locally because `jsonschema` is absent. No package was installed to remove that limitation. The upstream bundle's reported schema results are not presented as local verification.

## Browser and experience verification

Local Chromium checks used controlled traffic fixtures, the installed browser and loopback-only servers. No real visit data, enrollment or production submission was used.

- Core interface: 37 passed.
- Guided encounter and UI-state handling: 26 passed, including a controlled delayed-response gate proving that new user activity wins over pending focus restoration.
- Actual main-page/observatory roundtrip: 22 passed at 1440, 390 and 320px with reduced motion.
- Total main-browser checks: 85 passed.

Evidence: `/tmp/signal-atlas-qa/{results,ux-results,integrated-results}.json`. The 26-check state harness uses the agreed observatory return contract; the separate 22-check integrated run exercises the actual room. Final screenshots are `{1440,390,320}-final-main.png` and `{1440,390,320}-final-observatory.png` in that directory.

Checks cover keyboard focus, site/filter/search restoration, local wishlist persistence and storage failure, sample/real separation, inspectable local practice receipts, malformed responses, outages and recovery, interrupted requests, and no horizontal overflow. Requests to the observation endpoint were controlled local fixtures and never establish actual crawler participation.

Standalone observatory Chromium QA also passed at 320, 360, 390, 768 and 1440px under the preview CSP. Geometry, camera controls, keyboard selection, reversible 2D, unsupported-CSS fallback, initial/live reduced-motion behavior, pointer interruption and at-least-44px primary controls were checked. The inspected screenshots show readable labels and visible characters; the decorative floor extends beyond the scene edge at narrow widths. No external requests, script errors or CSP console errors were observed.

Standalone evidence: `/tmp/signal-atlas-observatory-qa-20261101/result.json` and `observatory-{320,360,390,768,1440}.png`, plus `observatory-fallback-390.png`.

Edition-specific rendered QA resolved all 60 checks: 59 passed in the complete run; one scroll/click timeout passed on a targeted rerun. A separate wrong-origin/query-override browser check passed. Evidence is in /tmp/signal-atlas-editions-qa/{results,targeted-results,wrong-host}.json. Five final packages in /tmp/signal-atlas-editions-20261101-delivery contain 95 hash-verified files. Their only change from the rendered package is the clarified participation prose; runtime hashes are identical. Export integrity and local rendering do not certify destination-host injection rules, headers or deployment behavior.

## Built-output integrity

A read-only comparison after the successful build found 18 of 19 Atlas public files byte-identical to `dist/signal-atlas/`. The only difference is `participate.md`: the source received a later prose correction explicitly describing both university parent identities. No built output was altered to conceal that difference. A production build must use the final reviewed source.

Both built HTML pages match their source exactly:

| Built page | SHA256 |
| --- | --- |
| `signal-atlas/index.html` | `1358cb7da151bb1f49534640620bce1a15508e97e7945b072460c8ff7eb0eb17` |
| `signal-atlas/observatory/index.html` | `3bbec7e564a36ed7e63441aac9096beb49e1a74cf5cb62475af948f6821ecdb6` |

Neither page contains an inline script, style tag, style attribute, SEO JSON-LD injection, session-bridge marker or ad-network marker. Both retain `noindex,nofollow`. This confirms that the successful SEO build preserved the authored preview HTML.

CSP is supplied by the Pages middleware, not the HTML files. Boundary tests and local browser tests under that policy passed; this static comparison does not verify a production response header. Known no-slash preview directories now redirect narrowly to slash URLs with query parameters preserved.

## Independent review and source scope

Independent reviews covered the retained-log projection, request and receipt trust states, browser focus/state handling, observatory input controls, export overwrite/path behavior, canonical parent identities and offline tooling.

The concrete no-slash routing finding was corrected and the 12 adapter/boundary tests passed after that correction. The generic participation text was clarified for both university editions. No remaining blocking finding was reported in those reviewed local scopes.

The intended change includes:
- `public/signal-atlas/`, the read-only `functions/api/signal-atlas.ts`, and narrow middleware/SEO boundary changes.
- Atlas regression tests, `scripts/signal-atlas-export.mjs`, local protocol/builder/model-evolution tools, and `docs/signal-atlas/`.
- Five local review presentations sharing three parent identities. Exported editions are not destination-repository integrations or live routes.

## Limitations and release hold

- Safari, Firefox, physical touch hardware, screen readers and dedicated native 200% zoom were not verified.
- Actual traffic, provider origins, live key registration, consent, transactional replay protection and production work adjudication were not verified or activated.
- The existing collector remains partial, spoofable and non-atomic. Unknown source state never means zero traffic.
- Fictional browser receipts, signed fixture exercises and model-comparator outputs are distinct offline artifacts, ineligible for live standings.
- No actual model was run or upgraded. Cost/latency/token and real-model metrics remain null; rollback is simulated.
- Exported host namespaces still need their own analytics/ad/session exclusions, route/header verification and release coordination.
- Source upload and production publication remain held pending exact repository authorization. No alternative upload route is authorized by these test results.
- A successful local build, merge or test report is not proof of deployment. After authorized release, verify the actual served assets, route redirects, headers and evidence states before announcing availability.

Preserve the isolated reviewed source and evidence until the release owner completes handoff. Build/dependency cleanup must not delete the only source copy while publication is held.
