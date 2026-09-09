# Personal PointCast: product roadmap and gameplan

Date: 2026-09-09
Status: proposed product sequence, with an implementation draft in [PR #1084](https://github.com/mhoydich/pointcast/pull/1084). Nothing in that PR is deployed.

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

The draft adds public AI connector guidance, a private one-time AI visit receipt, optional gentler invitation wording, and X sign-in/linking with private profile controls. Local build and synthetic-account checks prove those limited behaviors. The receipt proves that a code was used; it does not verify a subscription or establish a persistent execution connection.

The local Claude/Codex bridge has also demonstrated a real Fable 5.1 review using the owner's existing Claude account. That proves the local runtime route on this Mac. It does not yet supply a multi-user PointCast service or execution while the Mac is asleep.

The guided provider sign-in, runtime pairing, embedded conversation, selected context packet, saved inputs, external sending, and proactive operation remain to be built. The current connector page is a useful fallback for people who want PointCast tools inside their existing AI app.

## Next release: three tracks in parallel

| Track | Work | Completion evidence |
| --- | --- | --- |
| Guided AI connection | Prototype native subscription sign-in against an owner-controlled runtime; bind it to the correct PointCast profile; list actual available models; handle cancellation, expiry, reconnect, and disconnect | Provider login completes, runtime reports its authenticated state, and one real task runs on the selected model. An accepted job or copied code never shows as connected |
| Profile and X | Finish X app configuration and real consent checks; make identity, recovery, and AI connection controls understandable; allow explicit profile visibility choices | Existing member links X to the same profile, returns successfully, sees the verified handle, and can disconnect while retaining a way to sign in |
| First personal result | Let someone choose one PointCast space, one public link, and a short note; preview exactly what will be shared | Their chosen AI recommends one useful thing, explains why, cites working sources, and asks one good question |

X setup can proceed independently and should not hold up the first useful AI experience.

The first acceptance demo is: **connect my existing AI, tell it “something quiet and interesting for this evening,” choose a few inputs, and receive a good suggestion I can actually open.** Optional gentle preferences should be visible, removable, and phrased as an invitation for this interaction.

## The runtime decision

For a quick owner pilot, reuse an existing Zo or local Claude/Codex installation. Avoid building a whole cloud-computer service before proving the behavior.

- **Codex:** its App Server documents a device-code login start that returns a provider URL, one-time code, and login ID, followed by completion/account events. Native Codex owns credential storage and refresh. App Server is documented as experimental, so prototype behind an authenticated private bridge and establish a supported production path before a public rollout. [App Server authentication](https://learn.chatgpt.com/docs/app-server#authentication-modes), [Codex authentication](https://learn.chatgpt.com/docs/auth).
- **Claude Code:** run Anthropic's unmodified binary in the owner's isolated runtime and present its native sign-in flow. Anthropic expressly permits that hosting arrangement under its documented conditions, with each user signing into their own account. This does not authorize a separate service to collect Claude.ai credentials and proxy inference itself. [Authentication](https://code.claude.com/docs/en/authentication), [hosting conditions](https://code.claude.com/docs/en/legal-and-compliance).
- **Existing Zo:** its API supports an explicit model, streaming, and conversation continuity, including subscription-backed coding agents. Query available models and use the actual returned identifier. Zo's access token gives full computer access, so keep it on the owner's runtime behind a limited PointCast bridge; do not put it in browser code or treat it as a narrow profile token. A published third-party Zo subscription-login API has not been verified. [Zo API](https://www.zo.computer/guide/api), [available models](https://www.zo.computer/reference/api-reference/models).

For a browser-only experience for visitors who have no runtime, PointCast would need isolated persistent execution per owner, authenticated job transport, native credential storage, tool/approval events, and lifecycle controls. Hosting is a separate cost from the AI subscription. The pilot should establish whether to reuse an existing host or provide that infrastructure.

API keys and separately billed inference remain an advanced parallel route. They should have distinct setup and usage disclosure.

## After the first useful visit

| Stage | Product | Exit test |
| --- | --- | --- |
| Selected inputs | Saved PointCast spaces, curated links, and notes; then one useful private source | Show selected content, source, retrieval time, retention, and pause/remove controls. Retrieval is isolated to its owner and stops when access is removed |
| Conversation continuity | Continue the same interaction onsite using the connected runtime | A follow-up has the right context and the person understands what history is retained |
| Programmatic X or email | Add one external channel with separate reading/sending authorization | Receive, send an authorized response, verify delivery, and associate the reply with the same conversation; retries do not duplicate messages |
| Proactive help | A user-selected purpose, schedule, quiet hours, and hosted runtime | It runs while the computer is asleep, sends only meaningful authorized updates, accepts replies, and honors pause/revocation |

Choose the first private source and first external channel from actual use of the initial experience. Do not expand the connector catalogue before we can demonstrate why the first inputs improve a visit.

## Product rules

The private profile has three understandable areas: **My AI, My inputs, My channels**. Each shows its own actual state and controls.

Provider login, PointCast runtime pairing, a one-time visit receipt, X identity, and permission to send are separate authorizations. Use “connected” only when the particular connection is verified, and say what it enables.

For the first context packet, preview the selected space, link, note, and preference before sharing. It can be passed through the connected runtime or, for the manual connector fallback, returned once through the existing visit tool after explicit consent. This needs no permanent private-profile grant. Persistent retrieval comes later with scoped access and revocation.

X identity setup currently requests the read scopes documented for profile lookup and discards the token afterward. It enables no ongoing reading, posting, or direct messages. Those require separate permissions and token lifecycle work.

Reuse existing subscription access through supported native clients and owner-controlled runtimes. Keep provider credentials in their native runtime storage. Keep API billing and compute costs clear.

## Related implementation notes

- [Current connector setup](../setup/bring-your-ai.md)
- [One-time AI visit confirmation](../setup/ai-visit-confirmation.md)
- [X setup and consent](../setup/x-auth.md)
