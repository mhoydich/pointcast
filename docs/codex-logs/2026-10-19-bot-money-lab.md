# Bot Money Lab and Internship Lab — 2026-10-19

## Scope and authorization

Mike requested publication on PointCast about bots, design, ordinary people's internet money, and explicitly speculative 2027/2028 scenarios, with useful products and bot discovery. He subsequently requested internships, signup, onboarding, tasks, task management and deploys. Publication of this scoped feature is authorized; actual financial transactions, new payment setup, applicant collection without private intake, and employment/commercial commitments are excluded.

Started from freshly fetched `origin/main` at `4bb8c5d808dc077b19728950090b907f712c2a4d`. Existing divergent/dirty checkouts were preserved. The selected writable execution workspace contains an isolated clone and `codex/bot-money-lab` branch, rather than changing either existing checkout. No IndustryNext work is included.

## Published experience

- `/bot-money/`: original editorial and design, sourced 2026 capabilities, labeled 2027/2028 scenarios, an interactive Earn/Buy/Gift sandbox, the free kit, an inquiry-only Offer Page Sprint and assistant instructions.
- `/bot-money.json`: versioned PointCast catalog. Available/free and inquiry-only offers have explicit price status, license, delivery, limitations and human approval requirements. Existing agent-kit/MCP conventions remain unchanged; no shopping-network approval or protocol compliance claim.
- `/downloads/first-offer-kit-1.0.0.zip`: 19 editable offline files, MIT license, no account/payment. Offer worksheet, cost/time planner, three fictional worked examples, static HTML template, product/agent descriptions, three original SVG cards, permission/publishing checklists and a receipt template.
- `/internship-lab/` and `/internship-lab/program.json`: local educational workflow from interest draft through onboarding, three tasks, evidence, review and a release rehearsal; downloadable JSON/Markdown handoff. Applications remain closed. Nothing is sent to PointCast, authenticated, accepted or deployed.
- Block 0710, homepage, shop resources, sitemap, feeds, agent guide, agent kit and both LLM indexes provide discovery.

Kit ZIP: 29,620 bytes; SHA-256 `97aa5ed7e67e2d6a89b26a5794b2c59605e368d38d9d72a153e37d7234257826`.

## Sources and boundaries

Primary sources checked 2026-10-19: OpenAI's [March 24 product-discovery update](https://openai.com/index/powering-product-discovery-in-chatgpt/) and [commerce onboarding guide](https://developers.openai.com/commerce/guides/get-started); [Stripe shared payment tokens](https://docs.stripe.com/agentic-commerce/concepts/shared-payment-tokens?agent-seller=agent); [AP2 specification v0.2](https://ap2-protocol.org/ap2/specification/); [Shopify Digital Products](https://help.shopify.com/en/manual/products/digital-service-product/digital-downloads). Discovery is distinct from checkout; integrations and eligibility still apply. The future sections are design scenarios, not predictions or income claims.

The money demo uses valueless fictional credits, explicit approval, bounded permissions, readable receipts, invalidation and duplicate protection. It performs no work or transaction. The internship workflow uses current-page memory and local exports; browser restoration may retain page state. Editing work invalidates review and approval. Exports state that submission, reviewer authentication and deployment are false.

The existing ping endpoint exposes an unauthenticated list, so it is not used for private applicant intake. A real program requires separately configured private intake/privacy, eligibility, pay/hours, agreements, supervision, capacity and review ownership. A paid Offer Page Sprint requires agreed scope, price, turnaround, revision limit and terms before booking; none are committed here. No outreach, accounts, subscriptions, credentials or financial integrations were created.

## Review and validation

Independent content, code, demo, kit and integration reviews were performed. Review corrections included semantic landmarks, stale-proposal handling, review-note invalidation, a kit anchor and precise browser-state wording. All remaining release gates and live verification are recorded in the pull request and publication report.

The kit's deterministic ZIP, CRC, all manifest hashes, local links, JSON/SVG, CSV arithmetic and offline HTML were verified. The demo and internship controller/model suites pass 23 tests, including actual DOM interactions and local Blob exports. Final review also corrected browser-restored demo controls: mounting synchronizes defaults, and preparing/approving rechecks visible permissions and invalidates changed proposals. The agent surface audit passes.

Browser checks include desktop/mobile layouts, semantic landmarks, overflow, keyboard actions, permission boundaries, visible state changes and editable kit pages. This is functional accessibility review, not a screen-reader certification.

Deploy only after merge, using the existing shared `scripts/deploy.sh` process. The production smoke test and live marker, rather than GitHub's build status alone, establish publication.
