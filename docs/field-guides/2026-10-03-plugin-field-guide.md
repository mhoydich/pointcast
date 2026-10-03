# Small tools. Clear authority.

A field guide to plugins, extensions, discovery, events and hosting — with practical applications for PointCast, University of El Segundo and IndustryNext.

Educational draft · Codex · checked 2026-10-03

PointCast source baseline: 2a3e35326beffc23884b8fcca1c045623fe6565b

Start with one useful outcome. Package a repeatable method as a skill; add MCP when it needs live data or controlled actions; add an interface when seeing and choosing improves the work. Introduce ongoing monitoring only after the single-run workflow is reliable.

This is an educational draft by Codex, prompted by Mike’s three screenshots. Product claims were checked against official OpenAI documentation. Proposed prompts and outputs below are design examples, not connected services or completed work. The screenshots themselves are not reproduced.

First choice: keep the existing websites and test three read-only workflows. PointCast can produce a public evidence brief, UES can help a learner choose a course, and IndustryNext can turn supplied research into a bounded project brief.

## How to read the examples

- **Implemented and verified:** The named behavior was checked in source or through a public response. Each evidence note states the extent of verification; it does not imply a connected ChatGPT plugin.

- **Analogy:** An existing pattern helps explain the idea, but is a different implementation or surface.

- **Proposed:** A concrete future application. It has not been connected, installed, subscribed, submitted or published as a plugin.

## What is already here

### PointCast — Public data and a real MCP handler
**Implemented and verified**

Source at the recorded main commit and public read-only probes verify a real POST JSON-RPC server at /api/mcp-v2, an alias of /api/mcp. Live initialize returned pointcast-v2 2.7.0 and protocol 2025-06-18; tools/list returned 90 tools, resources/list returned 22 resources, and blocks_recent/apps_list read calls succeeded. GET serves HTML discovery. No UI metadata or ui:// resources were returned; server/discover and events/list returned method-not-found. Native extensions and MCP Events need additional implementation.

[MCP handler source](https://github.com/mhoydich/pointcast/blob/2a3e35326beffc23884b8fcca1c045623fe6565b/functions/api/mcp.ts) · [Public agent guide](https://pointcast.xyz/for-agents) · [Public connectors catalog](https://pointcast.xyz/connectors)

### University of El Segundo — Open courses, local private progress
**Implemented and verified**

The public /ues/classes.json responded HTTP 200 on the check date. Its participation contract says self-paced access, no account or wallet, local browser progress and private self-attested completion receipts. Source separates progress from identity and learner artifacts. A proposed ChatGPT companion must preserve the learner’s choice about sharing notes; local progress does not automatically become model context.

[Current UES classes](https://pointcast.xyz/ues) · [Public class catalog](https://pointcast.xyz/ues/classes.json) · [Participation contract source](https://github.com/mhoydich/pointcast/blob/2a3e35326beffc23884b8fcca1c045623fe6565b/src/pages/ues/classes.json.ts)

### IndustryNext — A public studio with proposed lab briefs
**Implemented and verified**

The public www.industrynext.xyz homepage responded HTTP 200 on the check date. It presents a magazine, laboratory and work table, an AI + MCP Atlas, and a Communications Lab marked proposed with applications closed. These are website surfaces, not evidence of an installed ChatGPT extension or event subscription. Its canonical repository is mhoydich/nouns5.4, with a separate release process from PointCast.

[IndustryNext public homepage](https://www.industrynext.xyz/) · [Separate canonical repository](https://github.com/mhoydich/nouns5.4)

## Three first pilots

- **PointCast — Public Evidence Brief:** Read a bounded public record and return its source URL, checked time and uncertainty. A pilot should allow only blocks_recent, block_read, blocks_search, apps_list and connector_links, with each handler reviewed; do not expose the full server catalog or rely on read-only annotations alone.

- **University of El Segundo — Course Companion:** Match a learner’s time and interests to public course IDs. Keep progress and notes local; only share an explicitly selected excerpt when the learner requests feedback.

- **IndustryNext — Brief Review Desk:** Use supplied research to draft an outcome, scope, assumptions and acceptance check. A human owns the release and any invitation to collaborators.

## 01 · Plugin Extensions
Does the task improve when people can see and choose?

Extensions connect an MCP App to ChatGPT surfaces such as sidebar apps, conversation panels, file viewers and rich forms. The official examples include Canva sidebar tabs, Figma composer mentions and Adobe file handlers. An ordinary webpage or embedded dashboard is an analogy until the MCP tool, registered UI resource and extension metadata work in the target host.

**Use:** Use for comparing records, selecting an object, reviewing a visual artifact or keeping a focused workspace beside a conversation.

**Avoid:** Skip custom UI for a simple answer or short list. Avoid a large dashboard that hides the actual decision, a viewer that claims unsupported formats, or a screen that depends on drag-only input.

### Architecture

1. Build and test a focused MCP read tool with stable record IDs and structured results.

2. Register an MCP App UI resource; attach the supported entrypoint metadata to the tool.

3. Render a minimal view. Share only the selected item/context the task needs, and keep a text response usable without the panel.

**Authority and privacy:** Keep tokens and private notes out of UI props and model context. Enforce account/resource access on the server. Set narrow CSP origins; a UI allowlist is not backend authorization. Preview an edit and require the intended confirmation before any consequential action.

**State and errors:** Use stable selection IDs and versioned UI resources. Distinguish loading, empty, permission denied, offline and stale data. Preserve a recoverable selection, show its checked time, and offer a source link.

**Acceptance test:** Check keyboard selection, visible focus, screen-reader labels and status announcements, 390px layout, zoom, reduced motion and text fallback. Test malicious record text as data. Verify the chosen item in both panel and tool response.

**Availability:** Composer mentions are desktop-only. The fetched docs say Free and Go web extensions are coming soon; do not assume every account or mobile surface supports every entrypoint. Verify the actual host and keep the web/text alternative.

### PointCast — Signal comparison panel
**Proposed**

Compare two public Blocks or field signals with source links and age. Existing website cards are the design analogy; a native conversation panel would be new.

**Example prompt:** Compare these two public PointCast records. Show evidence, checked time and what remains uncertain.

**Intended output:** Two source cards and a short comparison; no publishing or changes to a room.

**First step:** Prototype from two public fixtures, then validate a registered thread UI resource in a permitted test account.

### University of El Segundo — One lesson beside the conversation
**Proposed**

Show a public module, its access alternative and a selectable rubric. Feedback uses only the excerpt a learner deliberately supplies. Browser progress stays in the course website.

**Example prompt:** Open the public Living Archive lesson and help me check this excerpt against its rubric.

**Intended output:** Lesson links, a rubric and feedback on the supplied excerpt; no attendance or credential claim.

**First step:** Use the public catalog and a synthetic note. Verify that notes are not sent merely by opening the panel.

### IndustryNext — Brief review panel
**Proposed**

Present scope, evidence, missing inputs and acceptance checks next to a discussion. The Communications Lab’s website briefs are an analogy, not installed extensions.

**Example prompt:** Review this supplied project brief. Show what is evidenced, what is assumed and the smallest testable proof.

**Intended output:** A review card with traceable evidence and a human decision point.

**First step:** Use a fictional brief and text fallback before connecting any project system.

### Code illustration
Adapted metadata illustration only. server registration, imports and the UI resource still need implementation; this does not create an extension.

```ts
const metadata = {
  ui: { resourceUri: "ui://pointcast/evidence" },
  "openai/ui": {
    entrypoints: [{ type: "thread" }]
  }
};
// Attach as _meta to a registered MCP App tool.
// The tool must return useful structured/text data too.
```

Adapted from [Plugin Extensions](https://developers.openai.com/plugins/build/extensions).

Sources: [Plugin Extensions](https://developers.openai.com/plugins/build/extensions), [Build an MCP server](https://developers.openai.com/plugins/build/mcp-server), [Security and privacy](https://developers.openai.com/plugins/guides/security-privacy)

## 02 · Plugins, skills and MCP
Which parts of the method should travel together?

A plugin packages skills, MCP connections or both under a stable identity. A skill carries a repeatable method and supporting resources. An MCP server supplies actual tools and optional UI. Plugin Creator scaffolds a package; an empty configuration is not a running service.

**Use:** Use a skill for an evidence or review workflow that repeats. Add MCP when the work needs live data, authenticated records or a controlled action. Keep each first version focused on one recognizable outcome.

**Avoid:** Avoid bundling unrelated brands into one broad permission surface, undisclosed local dependencies, credentials in a ZIP, or write tools merely because a workflow might need them later.

### Architecture

1. Write the input/output contract and one worked fixture first; version the instructions and source ledger.

2. For a portable package, use root plugin.json, skills/ and optional mcp.json. OpenAI metadata goes under extensions.com.openai; .codex-plugin/plugin.json remains supported as a fallback.

3. Test locally/private first. A public release adds identity/domain verification, automated scans and human review; publication is a separate decision.

**Least privilege:** Start with supplied or public material. A plugin installation is separate from app authorization. Private access needs the relevant consent and OAuth implementation, with issuer, audience, expiry and scopes checked on every call. A model-supplied user ID never grants access.

**Contracts and failure:** Use narrow tool names, constrained input/output schemas and accurate read-only/destructive/open-world hints. Validate server-side. Return stable IDs, source URLs, checked times and explicit missing-data errors. Proposed writes need idempotency keys and conflict/version checks; retries must not duplicate changes.

**Reviewable release:** Test familiar, incomplete, adversarial and out-of-scope inputs and text fallback. The current MCP submission guide asks for five positive and three negative cases, a walkthrough and release notes; sign-in reviewers use a dedicated sample account. Approval precedes Publish. Recheck current submission rules before release.

**Availability:** Workspace Plugin Creator depends on permissions and availability. Its current scaffold uses the compatibility layout. Public submission currently connects one MCP server per plugin and does not support adding MCP later to an existing skills-only plugin; plan that architecture before submitting.

### PointCast — Package the visiting method
**Analogy**

The existing /for-agents handbook and scoped JSON/MCP surfaces already separate etiquette from capabilities. A Public Evidence Brief skill could package the reading method. It would still need a separately tested plugin connection.

**Example prompt:** Using only these public PointCast sources, draft an evidence brief with links, checked time and gaps.

**Intended output:** Evidence / observations / uncertainties / suggested next check.

**First step:** Write one skill against saved public fixtures; do not inherit the full existing MCP write catalog by default.

### University of El Segundo — Field Observation skill
**Proposed**

Turn one public lesson into a private practice plan with a seated or remote equivalent, source note and self-check. A skill can do this from supplied curriculum without a learner account.

**Example prompt:** Turn this UES lesson into a 20-minute practice with a remote alternative. Do not imply verified completion.

**Intended output:** Practice, materials, access alternative, evidence note and a private self-check.

**First step:** Use public course IDs and one synthetic example; keep the output independent of completion storage.

### IndustryNext — Research-to-Brief skill
**Proposed**

Package a method for naming the question, evidence, assumptions, owner role and acceptance criteria. Source accounts and any recruitment remain separate choices.

**Example prompt:** Make a bounded project brief from this supplied research. Mark missing facts and name the review role.

**Intended output:** Question / evidence / one-week proof / exclusions / acceptance / unresolved inputs.

**First step:** Test three fictional briefs, including one without enough evidence. Do not invent a collaborator or partnership.

### Code illustration
Illustrative portable package layout. It is a plan for files, not an installed plugin or MCP endpoint.

```text
public-evidence/
  plugin.json
  skills/
    evidence-brief/
      SKILL.md
      references/example.md
  mcp.json  # optional; references a separately built server
```

Adapted from [Package your plugin](https://developers.openai.com/plugins/build/plugins).

Sources: [Package your plugin](https://developers.openai.com/plugins/build/plugins), [Build plugins](https://learn.chatgpt.com/docs/build-plugins), [Upload and submit your plugin](https://developers.openai.com/plugins/deploy/submission), [Build an MCP server](https://developers.openai.com/plugins/build/mcp-server), [Authenticate users](https://developers.openai.com/plugins/build/auth)

## 03 · Discovery and helpful selection
Will the right tool activate for the right request?

Tool names, descriptions and schemas help ChatGPT choose an appropriate capability. Better metadata and measured task usefulness are concrete work. The fetched official guidance does not establish a ranking algorithm or guarantee directory placement, recommendations or traffic.

**Use:** Use explicit names and descriptions when people can express the same goal in several ways. Build a labeled prompt set before tuning metadata.

**Avoid:** Avoid claims that publishing guarantees recommendations, keyword stuffing, inflated capabilities, deceptive branding or broad descriptions that cause false activations.

### Architecture

1. Choose a domain/action name and state when the tool is useful and when it should not run.

2. Expose bounded arguments and accurate safety hints; return user-openable evidence links rather than promotional copy.

3. Run direct, indirect and negative prompts. Record selected tools, arguments and results; change one metadata field and repeat.

**Measure usefulness:** Track correct selection, false activation, grounded answers, task completion and fallback. Prioritize negative-prompt precision. Evaluate old prompts again after a schema, description, model or host change.

**Keep recommendations honest:** Explain why a tool fits and disclose material limitations or commercial ties. A recommendation is not permission to install, link an account or widen scope. Treat stale metadata and unavailable tools as states that need clear alternatives.

**Make the result accessible:** Use plain titles and text summaries that remain clear without artwork or a panel. Version the prompt set, date the source snapshot and keep logs free of private prompt text where it is unnecessary.

**Availability:** Directory eligibility, workspace controls, connection status and host capabilities affect actual use. A local website catalog does not establish OpenAI directory eligibility or ranking.

### PointCast — A legible public tool catalog
**Analogy**

PointCast already exposes app and connector catalogs. That is an analogy for discoverable capabilities. A future public-record tool should be specific about reading evidence and should reject requests to publish or change wallet state.

**Example prompt:** What public evidence supports this PointCast signal?

**Intended output:** Expected future tool: pointcast_get_public_record. Negative: “Publish a dispatch” must not call the read tool as a write substitute.

**First step:** Test direct “read Block…” and indirect “what changed?” prompts against negative wallet/publication prompts.

### University of El Segundo — Course selection with honest boundaries
**Proposed**

Describe a public-course search tool as finding lessons by topic and time. Do not market it as an enrollment, grading or accredited certification service.

**Example prompt:** I have 20 minutes and want to learn local observation. Which public UES lesson fits?

**Intended output:** A public course/module link and an access alternative; negative certification requests receive an explanation.

**First step:** Test “pick a class”, vague interests, no-match interests and “certify my degree”.

### IndustryNext — A brief tool with a clear job
**Proposed**

Name the capability as reviewing supplied briefs, and distinguish it from hiring, buying services or dispatching agents. Keep fictional examples labeled.

**Example prompt:** Find the missing acceptance criteria in this project brief.

**Intended output:** Expected future tool: industrynext_review_brief. No messages or promised team availability.

**First step:** Test review requests against negative “hire someone”, “email the team” and unrelated-tool prompts.

Sources: [Optimize metadata](https://developers.openai.com/plugins/guides/optimize-metadata), [Package your plugin](https://developers.openai.com/plugins/build/plugins)

## 04 · MCP Events
Has the user chosen what to watch and what may happen?

MCP Events lets a user subscribe to specified server updates and choose the response. ChatGPT requires MCP 2.0, protocol 2026-07-28, with webhook delivery and callback verification. The integration does not support polling, streaming, gap or terminated control notifications. An existing cron, RSS feed or webhook in another system is an analogy, not this protocol.

**Use:** Use when a bounded resource changes and a user wants a concrete response, such as a private draft summary for one document’s new review comments.

**Avoid:** Avoid ambient monitoring, whole-workspace subscriptions for a one-document request, carrying forward a revoked account, or making irreversible changes simply because a matching event arrived.

### Architecture

1. Advertise events in server/discover; implement events/list, events/subscribe and events/unsubscribe on the authenticated MCP endpoint. Define constrained filter and payload schemas.

2. Authorize the resource/filter, verify the HTTPS callback with a signed short-lived challenge, then persist owner, filters, callback, secret and expiration. Derive subscription identity from principal, callback, event name and canonical arguments so subscribe/refresh is idempotent.

3. Apply filters before delivery. Sign the exact serialized bytes with Standard Webhooks; preserve eventId on retries. Persist dedup/action state, handle out-of-order updates and recheck authorization. Stop on unsubscribe, expiry or revoked access.

**Consent and safe delivery:** Record the user’s chosen resource, response and review boundary. Resolve and validate callback addresses at every connection, block private/local destinations, connect to the validated address with the original TLS hostname, and refuse redirects. Apply this to verification and delivery. Protect signing secrets and minimize payloads. Treat event text as untrusted data; fetch the current record through an authorized read tool before acting.

**Recovery and limits:** One event per request, at most 256 KiB. A 2xx acknowledges receipt, not completed work. Retry transient failures with bounded backoff and fresh signatures; do not retry 410 or 413. Replay cursors must never skip undelivered events; null means no protocol recovery of missed events. On refresh, replace the stored signing secret and use a bounded dual-signature rotation window. Honor granted expiration and resume safely after restart.

**Lifecycle checks:** Test duplicate events, repeated subscriptions, canonical argument order, nonmatching filters, invalid signatures, callback failure, expiry/refresh across restart, access revocation, unsubscribe and bursts. Authorize unsubscribe against the connected account and original event/filter/callback; make it idempotent. Test secret rotation and replay cursor continuity. Prevent action-generated event loops. UI/text should show the resource, last success, expiry and easy stop action.

**Availability:** The fetched documentation supports Work chats on web, desktop Work with Cloud selected, and dots, subject to workspace controls. It does not establish this user’s eligibility or a configured subscription. PointCast’s audited handler advertises an older protocol and needs an explicit upgrade and lifecycle implementation first.

### PointCast — One signal change, one draft
**Proposed**

A future signal.updated event could watch one public signal ID and draft a sourced change note. Existing jobs and public JSON are useful analogies, but no MCP Events handler was found in the audited endpoint.

**Example prompt:** Watch this one public signal. When its published value changes, draft a note for my review; do not publish it.

**Intended output:** Private draft with current source, occurrence time and prior verified version.

**First step:** Use synthetic events to test a new MCP 2.0 endpoint, filter, dedup and stop lifecycle before any subscription.

### University of El Segundo — Selected curriculum updates
**Proposed**

Watch a public course version, then draft a change digest. Never turn local learner progress, notes or completion choices into events by default.

**Example prompt:** Watch updates to this public course and draft a digest of changes to its reading list.

**Intended output:** A dated curriculum digest with a course/version link; no learner tracking.

**First step:** Define course_id/version payloads and verify nonmatching courses never deliver.

### IndustryNext — One brief’s review comments
**Proposed**

For a future authorized project system, watch one chosen brief and prepare suggested edits. A comment cannot grant new authority to contact people or change the project.

**Example prompt:** Watch review comments on this brief and prepare proposed edits for my review.

**Intended output:** A proposed diff linked to the authorized current brief; no external message or automatic release.

**First step:** Test with a dedicated synthetic tenant, revoke access mid-subscription, and verify both delivery and future actions stop.

### Code illustration
Proposed events/list event definition, adapted from the official schema. This declares a contract; discovery, auth, subscription storage, signing and delivery are not implemented here.

```json
{
  "name": "signal.updated",
  "description": "A selected public signal changed.",
  "delivery": ["webhook"],
  "inputSchema": {
    "type": "object",
    "properties": {"signal_id": {"type": "string"}},
    "required": ["signal_id"],
    "additionalProperties": false
  },
  "payloadSchema": {
    "type": "object",
    "properties": {
      "signal_id": {"type": "string"},
      "version": {"type": "integer"},
      "source_url": {"type": "string"}
    },
    "required": ["signal_id", "version", "source_url"],
    "additionalProperties": false
  }
}
```

Adapted from [MCP Events](https://developers.openai.com/plugins/build/mcp-events).

Sources: [MCP Events](https://developers.openai.com/plugins/build/mcp-events), [Security and privacy](https://developers.openai.com/plugins/guides/security-privacy)

## 05 · Sites and hosting choices
Which host fits the actual runtime and access model?

Sites can host compatible websites and web apps. The verified documentation also describes workspace-private Sites with connected plugins, visitor-selected accounts and consent. The narrower screenshot claim that a Site can host an MCP server or extension was not established by the permitted documentation fetched for this guide; verify that capability and runtime in the actual account before planning around it.

**Use:** Consider Sites for a small new companion, private prototype or compatible project with an appropriate access model. Treat hosting the website, operating an MCP endpoint and registering a ChatGPT extension as separate implementation responsibilities.

**Avoid:** Avoid moving PointCast simply to match an announcement, assuming Cloudflare bindings transfer automatically, exposing owner credentials to visitors, or treating a Sites deployment URL as a private preview.

### Architecture

1. Inventory routes, Cloudflare Pages functions, Workers, KV/D1/R2, scheduled jobs, streaming behavior and secrets. Map each dependency and consent boundary before choosing a host.

2. Compare keeping the existing host, hosting a separate companion, or migrating a compatible subset. Validate auth, persistence, network behavior, source identity, logs and rollback in a saved version.

3. Review the concrete version before deployment. Sites deployment URLs are production; save without deploying for review. Retain the current PointCast main/deploy lane until a migration is separately approved.

**Visitor boundaries:** For connected data, verify workspace-private eligibility and enabled permissions. Each visitor selects their own connections and consents; never substitute the owner’s account. Private data and write actions need server authorization, clear action controls and the intended review/confirmation.

**Operations:** Define persistence, retention, secret rotation, timeout/rate limits, backups and rollback. Verify tool endpoints independently of website rendering. Preserve canonical links, source timestamps and text/mobile fallbacks across a host change.

**Decision test:** Demonstrate the needed runtime, auth and storage on synthetic data first. Check cold start, error recovery, account isolation, access removal and mobile use. Unknown compatibility is a reason to investigate a small companion before planning a migration.

**Availability:** Sites is documented as public beta for Plus, Pro, Business, Enterprise and Edu with plan limits and workspace controls. Connected-plugin features are workspace-private where enabled. Neither a product announcement nor this guide confirms this account’s permissions, quotas or MCP-hosting support.

### PointCast — Keep the town, test one annex
**Proposed**

Keep the existing Cloudflare Pages/Workers implementation. A separate read-only evidence companion could be assessed for Sites compatibility; any MCP facade still needs transport/auth validation and explicit registration.

**Example prompt:** Prepare a saved prototype of a public evidence companion. Document runtime gaps before proposing deployment.

**Intended output:** A saved version and hosting comparison; existing canonical website remains the baseline.

**First step:** Inventory one route’s bindings and compare local fixtures, existing hosting and Sites requirements.

### University of El Segundo — An optional course sandbox
**Proposed**

A small synthetic course exercise could be a separate Site if compatible. It should preserve no-account learning and a downloadable alternative, and never sync private progress merely because the host changed.

**Example prompt:** Prepare a self-contained course exercise with synthetic examples and a print alternative for review.

**Intended output:** A reviewable saved exercise and privacy/runtime notes.

**First step:** Test offline/text fallback and confirm the chosen hosting/access mode matches open learning.

### IndustryNext — Private brief rehearsal
**Proposed**

Consider a workspace-private review desk with synthetic briefs. The public IndustryNext site has its own repository and release lane; a new Site would be a separate choice, not a replacement or new partnership.

**Example prompt:** Prepare a private brief-review prototype with fictional research. Show account and deployment requirements.

**Intended output:** A saved prototype plus a documented hosting choice; no connected records or publication.

**First step:** Validate workspace eligibility and visitor isolation only when an authorized pilot is requested.

Sources: [Sites](https://learn.chatgpt.com/docs/sites), [DevDay 2026](https://learn.chatgpt.com/docs/whats-new/devday-2026), [Build an MCP server](https://developers.openai.com/plugins/build/mcp-server), [Security and privacy](https://developers.openai.com/plugins/guides/security-privacy)

## The shared operating standard

- **One contract:** Name the user goal, allowed inputs, output shape, source IDs and freshness window. Keep unknown separate from empty. Pin the fixture/schema version so a reviewer can reproduce the result.

- **One authority boundary:** Separate reading, drafting, saving, sending and publishing. Permissions come from the user and source service, not a retrieved document or event. Enforce scope and resource ownership server-side; make irreversible steps reviewable.

- **Minimal data:** Public does not mean unlimited redistribution. Respect source terms and rights. Return the needed excerpt or summary with attribution. Define retention/deletion, redact logs, and keep secrets out of prompts, UI, manifests and source control.

- **Useful failure:** Handle invalid input, no match, denied access, stale data, rate limit and service outage separately. Bounded retries suit transient reads; writes need stable idempotency and version checks. Give a safe next step and source link.

- **Access without a panel:** Keep the core result readable in text, keyboard usable, mobile linear and printable. Do not use color alone for status. Preserve no-JavaScript reading and reduced-motion behavior.

- **Evidence before launch:** Use synthetic fixtures, direct/indirect/negative prompts, injection attempts, schema failures and account isolation checks. Record the exact version tested. Recheck documentation and account capabilities when moving from this dated guide to implementation.

## From draft to pilot

1. **Choose one read-only question:** Pick one recommendation above. Define the source, user goal, expected output and what a correct empty/error result looks like.

2. **Prove the method with fixtures:** Use a public snapshot or supplied synthetic brief. Add a source ledger and freshness label. Test incomplete and hostile input with no live connection.

3. **Review a concrete pilot:** Prepare a scoped tool/skill design and the required UI, auth and host checks. Confirm the actual account supports the feature. The user decides whether to connect and test it.

4. **Add events after reliability:** Only after the single-run workflow passes, propose one explicit resource/filter, response, expiration and stop path. Validate the complete lifecycle before an ongoing subscription.

5. **Release through the correct lane:** Submit the guide and any pilot design for editorial review and human publication approval. Plugin installation, account connection, public directory publication and website deployment each need their own concrete review.

## Sources checked

- [Plugin Extensions](https://developers.openai.com/plugins/build/extensions) — Fetched 2026-10-03; entrypoints, metadata examples, partner examples and surface availability.

- [Package your plugin](https://developers.openai.com/plugins/build/plugins) — Fetched 2026-10-03; portable structure, compatibility scaffold and distribution boundaries.

- [Build plugins](https://learn.chatgpt.com/docs/build-plugins) — Fetched 2026-10-03; private workflow creation, testing and separate app access.

- [Upload and submit your plugin](https://developers.openai.com/plugins/deploy/submission) — Fetched 2026-10-03; scans, reviewer cases, current MCP limits and separate publication.

- [Optimize metadata](https://developers.openai.com/plugins/guides/optimize-metadata) — Fetched 2026-10-03; golden prompt sets, tool selection and measurement. No rank guarantee established.

- [MCP Events](https://developers.openai.com/plugins/build/mcp-events) — Fetched 2026-10-03; MCP 2.0 webhook lifecycle, signing, auth, replay and limitations. The protocol is a draft integration.

- [Sites](https://learn.chatgpt.com/docs/sites) — Fetched 2026-10-03; hosting, beta limits, saved versions, visitor data and access controls.

- [DevDay 2026](https://learn.chatgpt.com/docs/whats-new/devday-2026) — Fetched 2026-10-03; announcement context. Feature-specific documentation carries the implementation detail.

- [Build an MCP server](https://developers.openai.com/plugins/build/mcp-server) — Fetched 2026-10-03; focused tools, structured output, annotations, transport and test/deploy requirements.

- [Authenticate users](https://developers.openai.com/plugins/build/auth) — Fetched 2026-10-03; token validation, per-tool auth and account identity boundaries.

- [Security and privacy](https://developers.openai.com/plugins/guides/security-privacy) — Fetched 2026-10-03; consent, least privilege, prompt injection, CSP, retention and authorization.

## Limits of this edition

- No ChatGPT plugin installation, native extension, event subscription, new credential, connected private app or directory publication was performed or verified for these three brands.

- Live PointCast initialize, tool/resource discovery and two public read calls were verified on the check date. This is not a complete audit of all 90 tools, authentication paths, transport conformance or an installed ChatGPT plugin. An annotation/handler consistency correction is recorded in the draft review notes.

- UES and IndustryNext public GET checks establish the documented public content at the check time, not future availability, private integrations, participant engagement or partnerships.

- The Sites-hosted MCP/extension claim remains unverified within the three allowed official documentation domains. Review runtime/account support before implementing that proposal.

- Additional UES and IndustryNext studies have separate review and publication decisions. This guide links only verified public destinations.

- This page’s brand filter only changes which proposed examples are visible. It performs no tool calls, subscriptions, storage or external actions. Examples and code are educational illustrations.
