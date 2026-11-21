# Loomkit expression tray — draft only

Phone-first standalone sketch, no production route or shared runtime changes. Reuses the first ten original CC0 Loomkit assets. Native media API inspected at main f6ba0c55939cdb6bac74cb8354e70bc334eb027c in src/lib/loom/service.mjs (validateMessage/from).

Run locally with a static HTTP server from this directory. Select expression, enter name/destination/sentence/alt, review exact image/text/destination, edit or download draft JSON. The draft UI NEVER invokes createSender and the Send control is disabled. No actual message was submitted in tests.

Future integration needs: approve a production path, install assets under /images/loomkit10/, real browser/phone/accessibility tests, and explicitly wire confirmation+Send. No secrets, signing, authentication claim, minting or payment. Names are self-declared. Shared API validation/rate limits remain server responsibility. Image media uses existing {url,alt}, not new reaction storage. No idempotency assumption: accepted-but-unverified or network errors lock the attempt; no automatic retry.

Validation: node --test sketches/loomkit-tray/tray.test.mjs; node --check sketches/loomkit-tray/app.mjs. Focused tests only. Full build intentionally not run under small-cloud OPERATIONS rules. Browser QA unavailable in this agent. Error fallback keeps text labels; status uses aria-live; review uses focus and edit returns focus. These are implementation claims, not screen-reader QA.

Important semantic boundary: selecting MINE is not a recorded claim; sending is not retained until readback; retained is not a human/agent acknowledgment. Original artwork CC0-1.0, no copied Slackmojis assets, no affiliation claimed.
