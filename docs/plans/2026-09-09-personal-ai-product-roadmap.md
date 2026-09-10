# Personal PointCast: product roadmap and gameplan

Date: 2026-09-09
Status: owner pilot published through [PR #1084](https://github.com/mhoydich/pointcast/pull/1084). Guided installation, fresh provider consent, X configuration, and live payment validation remain rollout work. New purchases stay disabled; later stages below remain proposed.

## The product

**My own AI, with information I choose, communicating where I choose.**

The primary connection experience should match what Mike used in Zo:

1. Choose **ChatGPT** or **Claude**.
2. Sign in with that provider, approve, and enter a confirmation code if requested.
3. Choose an available model and optional interaction preferences.
4. Complete one small PointCast task together.

The person should not need to understand MCP or find an API key for this path. Provider-native sign-in and a real agent runtime must sit behind the interface. A PointCast visit code is a different feature and cannot substitute for provider authentication.

Zo's current changelog confirms an in-app subscription sign-in dialog for Claude Code, Codex, and Gemini, and a subscription-first AI settings layout. Its older terminal-oriented guides describe the underlying native login. [Zo updates](https://www.zo.computer/updates), [Codex setup](https://www.zo.computer/guide/codex), [Claude Code setup](https://www.zo.computer/guide/claude-code).

## What we have now

The published owner pilot includes a real native AI runtime: pair this computer to the private PointCast profile, check its subscription sign-in, choose a model, preview selected text and an optional gentle preference, and run one text-only task. Both Codex (GPT-5.6 Luna) and Claude (Fable 5.1) returned real results through the owner's existing subscriptions. The profile-to-companion-to-model-to-profile path has been exercised locally with a synthetic PointCast account and real native clients; that proof is distinct from a new production pairing or fresh provider consent.

The companion starts native provider sign-in and relays approved provider URLs and confirmation codes when the provider uses them. Fresh-account consent has not yet been exercised: these native clients were already signed in. Initial setup currently requires the source companion on the owner's Mac. This proves the execution path; the installer and a browser-only hosted experience still need product work. The Mac must remain awake and the companion running.

PointCast stores an opaque, hashed, expiring companion credential and scoped job data. Provider credentials stay in their native stores. Tasks have no external tools, automatic inference retries, or API-billing fallback. Codex model choices come from its native catalogue; Claude choices are configured and the actual model usage is reported after execution. See the [pilot setup guide](../setup/ai-runtime.md).

The draft also includes manual AI connector guidance, optional one-time visit receipts, X sign-in/linking and recovery controls, and an optional x402 purchase pilot on the private profile. X consent is still unverified with a configured developer application. Autonomous service discovery, saved private inputs, ongoing conversations, external sending, and proactive operation remain proposed.

The payment pilot now reviews one public Bench question and a fixed 0.01 USDC contribution, asks the person to choose a wallet and approve that specific authorization, and records receipt, chain observation, and public delivery separately. Lost responses recover the same recorded attempt without another payment. Local tests use simulated wallets and settlement; the deployment flag remains off. This contribution does not buy an AI answer, and the free Bench form remains available. [Purchase setup and boundaries](../setup/ai-purchases.md).

## Next release: three tracks in parallel

| Track | Work | Completion evidence |
| --- | --- | --- |
| Guided AI connection | Pilot implemented locally; finish fresh native sign-in consent tests, package installation, and verify deployed transport with the intended owner | Provider login completes, runtime reports its authenticated state, and one real task runs on the selected model. An accepted job or copied code never shows as connected |
| Profile and X | Finish X app configuration and real consent checks; make identity, recovery, and AI connection controls understandable; allow explicit profile visibility choices | Existing member links X to the same profile, returns successfully, sees the verified handle, and can disconnect while retaining a way to sign in |
| First personal result | Local pilot shares one curated PointCast description plus a note and optional preference; add approved retrieval of a chosen public link next | Current proof: a real AI recommendation using the provided text, with a reference link and one question. Live retrieval and source verification remain next |

X setup can proceed independently and should not hold up the first useful AI experience.

Prepare the x402 purchase path alongside these tracks, then enable it after the AI connection has completed a real task. The first useful AI result stays free; a wallet is optional until someone chooses a paid action.

The first acceptance demo is: **connect my existing AI, tell it “something quiet and interesting for this evening,” choose a few inputs, and receive a good suggestion I can actually open.** Optional gentle preferences should be visible, removable, and phrased as an invitation for this interaction.

## The runtime decision

For a quick owner pilot, reuse an existing Zo or local Claude/Codex installation. Avoid building a whole cloud-computer service before proving the behavior.

- **Codex:** its App Server documents a device-code login start that returns a provider URL, one-time code, and login ID, followed by completion/account events. Native Codex owns credential storage and refresh. App Server is documented as experimental, so prototype behind an authenticated private bridge and establish a supported production path before a public rollout. [App Server authentication](https://learn.chatgpt.com/docs/app-server#authentication-modes), [Codex authentication](https://learn.chatgpt.com/docs/auth).
- **Claude Code:** run Anthropic's unmodified binary in the owner's isolated runtime and present its native sign-in flow. Anthropic expressly permits that hosting arrangement under its documented conditions, with each user signing into their own account. This does not authorize a separate service to collect Claude.ai credentials and proxy inference itself. [Authentication](https://code.claude.com/docs/en/authentication), [hosting conditions](https://code.claude.com/docs/en/legal-and-compliance).
- **Existing Zo:** its API supports an explicit model, streaming, and conversation continuity, including subscription-backed coding agents. Query available models and use the actual returned identifier. Zo's access token gives full computer access, so keep it on the owner's runtime behind a limited PointCast bridge; do not put it in browser code or treat it as a narrow profile token. A published third-party Zo subscription-login API has not been verified. [Zo API](https://www.zo.computer/guide/api), [available models](https://www.zo.computer/reference/api-reference/models).

For a browser-only experience for visitors who have no runtime, PointCast would need isolated persistent execution per owner, authenticated job transport, native credential storage, tool/approval events, and lifecycle controls. Hosting is a separate cost from the AI subscription. The pilot should establish whether to reuse an existing host or provide that infrastructure.

API keys and separately billed inference remain an advanced parallel route. They should have distinct setup and usage disclosure.

## First paid action: x402 after AI connection

The next step is **my connected AI can find a useful paid service, explain the purchase, and complete it with my approval**. Start with one reviewed service and one supported asset/network. Do not open an unrestricted paid-service catalogue before this loop works.

1. The connected AI discovers the service and obtains its current payment requirements.
2. PointCast presents the result being purchased, exact amount and asset, network, recipient, and expiry. The person can decline and continue using the free experience.
3. The person connects a wallet and approves that specific payment. Signing into PointCast, connecting an AI, linking X, or previously signing into a wallet grants no new spending authority. Provider credentials and payment credentials remain separate.
4. The payment client submits the authorization through the selected x402 service flow and reconciles settlement. The private activity record distinguishes requested, awaiting approval, submitted, settled, delivered, failed, and unresolved states.
5. The person receives both the purchased result and a verifiable receipt. A successful wallet prompt or HTTP response alone does not prove both payment and delivery.

The first release requires approval for each purchase. Later, explicitly enabled agent budgets can allow bounded spending with a per-purchase cap, cumulative cap, expiry, permitted services/assets/networks, and immediate revocation. Those controls must be enforced outside the model with atomic accounting for simultaneous jobs; the agent cannot approve or increase its own budget. No budget or funded wallet is assumed from this roadmap approval.

Retries must reconcile the original purchase before issuing another payment. Persist a purchase identifier before submission, bind the authorization to the exact request and terms, and verify the chosen seller's retry behavior. If settlement succeeded but delivery failed, recover the same result or show the unresolved purchase; never silently pay again. A quote change, expired authorization, or disconnected runtime must stop new spending.

**Exit test:** a connected AI requests one paid result; the user approves the displayed terms; settlement is independently verified; the result and receipt appear in the same interaction. Also prove decline, expiry, wrong network, budget rejection, and timeout-after-submission without duplicate payment. The current local pilot covers a person choosing the fixed Bench service after a successful AI task, explicit wallet selection/approval, and recorded receipt/delivery checks. Agent service discovery and budgets remain future work. Simulated integration tests pass; an explicitly approved live purchase is still required, and new purchases remain disabled unless the deployment flag is deliberately enabled.

The buyer pilot reuses the existing PointCast server intake: `src/lib/x402.ts` describes Etherlink USDC payment requirements; `functions/_lib/x402-gate.ts` performs settlement and signs receipts; `functions/_lib/paid-town-actions.ts` persists action state. `/api/me/ai-purchases` adds owner-scoped quotes, a reservation before submission, and read-only recovery. The first selected service is the Bench, which retains a public result. The person's browser wallet signs the transfer terms; PointCast separately binds the reviewed question and quote to the stored purchase and signed merchant receipt. Connecting the wallet creates no standing spending grant.

The draft now preserves unknown settlement outcomes across facilitator HTTP 5xx, 408/429, malformed success, missing or conflicting transaction evidence, and ambiguous broadcast responses. A held action cannot silently acquire a second authorization. It also returns and exposes the standard `Payment-Response` header alongside the legacy alias. Behavioral regressions exercise these paths without making payments. Reconciliation of an unknown outcome is still a release requirement: holding the purchase prevents an unsafe retry but does not itself resolve it.

Receipt signature verification and chain settlement verification remain distinct checks. The pilot independently checks the exact USDC transfer through Etherlink RPC; that observation is not rollup finality. Public delivery also requires the signed result to match the persisted Bench record and its day index. A failed action or unknown settlement remains held for investigation; recovery does not republish, refund, or resettle it. Current wallet support requires an EOA with an existing USDC-to-Permit2 allowance on Etherlink. Confirm live facilitator and wallet prerequisites before the real test. [Official x402 flow](https://docs.x402.org/core-concepts/client-server), [facilitator guidance](https://docs.x402.org/core-concepts/facilitator).

## After the first useful visit

| Stage | Product | Exit test |
| --- | --- | --- |
| x402 purchases | One useful paid service available to a connected AI, with per-purchase wallet approval | Verified settlement plus delivered result and receipt; rejected and retried requests cannot create an extra charge |
| Selected inputs | Saved PointCast spaces, curated links, and notes; then one useful private source | Show selected content, source, retrieval time, retention, and pause/remove controls. Retrieval is isolated to its owner and stops when access is removed |
| Conversation continuity | Continue the same interaction onsite using the connected runtime | A follow-up has the right context and the person understands what history is retained |
| Programmatic X or email | Add one external channel with separate reading/sending authorization | Receive, send an authorized response, verify delivery, and associate the reply with the same conversation; retries do not duplicate messages |
| Proactive help | A user-selected purpose, schedule, quiet hours, and hosted runtime | It runs while the computer is asleep, sends only meaningful authorized updates, accepts replies, and honors pause/revocation |

Choose the first private source and first external channel from actual use of the initial experience. Do not expand the connector catalogue before we can demonstrate why the first inputs improve a visit.

## Product rules

The private profile has four understandable areas: **My AI, My inputs, My channels, Payments**. Each shows its own actual state and controls. Payments shows the connected wallet, purchase approvals, receipts, and any explicitly enabled budget; it stays optional for free visits.

Provider login, PointCast runtime pairing, a one-time visit receipt, X identity, permission to send, and permission to spend are separate authorizations. Use “connected” only when the particular connection is verified, and say what it enables. Removing an AI runtime stops new purchases through that runtime while preserving the owner's receipts.

For the first context packet, preview the selected space, link, note, and preference before sharing. It can be passed through the connected runtime or, for the manual connector fallback, returned once through the existing visit tool after explicit consent. This needs no permanent private-profile grant. Persistent retrieval comes later with scoped access and revocation.

X identity setup currently requests the read scopes documented for profile lookup and discards the token afterward. It enables no ongoing reading, posting, or direct messages. Those require separate permissions and token lifecycle work.

Reuse existing subscription access through supported native clients and owner-controlled runtimes. Keep provider credentials in their native runtime storage. Keep API billing and compute costs clear.

## Related implementation notes

- [Native AI owner pilot](../setup/ai-runtime.md)

- [Current connector setup](../setup/bring-your-ai.md)
- [One-time AI visit confirmation](../setup/ai-visit-confirmation.md)
- [X setup and consent](../setup/x-auth.md)
