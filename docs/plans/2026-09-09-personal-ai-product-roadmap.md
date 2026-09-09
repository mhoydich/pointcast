# Personal PointCast: product roadmap and gameplan

Date: 2026-09-09
Status: proposed product sequence. Current implementation remains local and un-deployed; this roadmap creates no external connections, message-sending permissions, or background schedules.

## Product thesis

**My own AI, with information I choose, communicating where I choose.**

PointCast should give someone a personal place to explore and act with the AI they already use. Start inside that AI's supported subscription experience. Let the person choose useful inputs, experience the result, and add deeper permissions only when a concrete behavior needs them.

The Zo screenshots contribute the direction of informational inputs alongside one's own AI. They are not proof of a PointCast integration or authorization to connect an account. This proposal includes no personal contact details from them.

The private profile becomes the control center for three distinct things:

| Area | The person's choice | PointCast's responsibility |
| --- | --- | --- |
| My AI | Existing AI app, provider, or agent runtime; optional interaction preferences | Explain where it runs and how to connect, distinguish self-reported setup from verified activity, and respect the provider's supported access route |
| My inputs | Selected PointCast spaces, public links, personal notes, and later explicitly connected private sources | Show exactly what is available to the AI, how fresh it is, what is retained, and how to pause or remove it |
| My channels | Onsite conversation and later X, email, or messaging | Separate account identity, reading access, sending authority, and evidence of delivery and replies |

## What the current branch actually contains

Implemented and tested locally: subscription-oriented connector guidance; anonymous public PointCast MCP tools; an optional one-time private AI visit receipt; and X sign-in, deliberate linking, and private profile connection UI. The receipt proves that a one-time code was used. It does not verify the chosen AI provider, subscription, or continued agent activity.

The X flow verifies an identity and handle. It does not retain an X token or authorize ongoing reading, posting, or direct messages. App configuration, auth migrations, deployment, and real external consent tests remain necessary. Local tests do not demonstrate a live integration.

Persistent profile OAuth scopes and client grants, embedded or hosted inference, input ingestion, private-source connectors, onsite AI conversation, external sending, and proactive execution are **not built** by this branch. A pasted setup prompt is not a connection; a visit receipt is not ongoing authorization.

## First experience to build

A person signs in, chooses the AI they already use, and sees the shortest supported setup for that client. They choose one PointCast space, one public link, and a short note such as “I want something quiet and interesting for this evening.” PointCast previews the information that will be shared.

They ask their AI: “Use these to choose one thing for us to explore. Tell me why, cite what you used, and ask me one good question.” The result leads to a real PointCast page. The person can adjust their choices and try again.

For the initial version, the person can deliberately copy a previewed context packet into their existing AI conversation. That manual action is explicit sharing for this interaction; it does not require pretending the AI has persistent profile access. A later automatic retrieval path needs actual scoped grants and revocation.

An optional gentler experience is visible wording beside the AI choice: curious, concise, attentive, and comfortable with quiet. It is a removable preference for the interaction, not a claim that PointCast permanently changes an assistant.

Success is a useful, personal visit with an understandable source trail. The person should be able to explain which AI helped, which information it used, and what it was allowed to do.

## Sequence and exit tests

| Stage | Product work | Exit test |
| --- | --- | --- |
| 1. One private profile | Make identity, connected methods, and recovery understandable; finish X configuration and genuine consent testing; give the AI, input, and channel areas a coherent home | Sign in with an existing method, deliberately link X to that same profile, show the verified handle, return successfully, and disconnect without losing the last sign-in method. A different account cannot acquire the identity |
| 2. Bring an existing AI | Lead with supported subscription-client setup and public exploration; introduce the first personal context packet and optional preferences; keep API and owned-agent routes available as advanced choices | A real supported client successfully calls a PointCast tool, uses the previewed personal context, cites a working page, and leaves a private visit receipt when requested. Copying instructions alone never appears as a completed visit |
| 3. Choose the inputs | Build a small library of curated public links and PointCast spaces, then saved notes; add one useful private source only after public-input value is demonstrated | The AI uses only selected content, shows source and retrieval time, reports stale or unavailable data honestly, and stops future retrieval when the input is paused or removed. Private-source access is isolated to its authorized owner |
| 4. Talk and reply | Establish onsite conversation continuity and user control first; then add one external channel, with X and email treated as independent integrations | Receive a message, compose an authorized response, send through the chosen channel, verify delivery, and attach the incoming reply to the same conversation. Retries do not produce duplicate sends |
| 5. Return proactively | Add a user-selected schedule and runtime that can execute while the computer sleeps; reuse an owned runtime where supported and keep its inference/account boundary explicit | With the local computer asleep, the chosen host runs the task once, uses only permitted inputs, delivers an authorized meaningful update, accepts the reply, and honors pause/revocation. An ordinary desktop MCP installation does not satisfy this test |

Stages are ordered by dependency and demonstrated value, without speculative dates or prices. A later stage should remain visibly unavailable until its actual behavior is proven.

## Parallel work for the next release

Run three bounded tracks together:

1. **Profile and identity:** finish X configuration and consent checks, recovery, and clear private-profile controls.
2. **AI setup:** prove the actual Claude and ChatGPT client routes, keep an API/owned-agent option, and make the optional visit receipt understandable.
3. **First useful experience:** design and build the public-content selector, one link, one note, shared-context preview, and a result with sources.

These tracks converge on the same acceptance demo: a person brings an existing AI to their PointCast profile, deliberately shares a few inputs, receives one useful recommendation, and can see what happened. X posting and proactive messaging follow after this demo works.

## Implementation decisions that keep the product understandable

**AI access:** keep inference inside the provider client or owned runtime unless a separate, supported hosted-inference product is deliberately selected. A subscription setup route does not imply transferable credits, API entitlement, third-party token collection, or a cloud runtime. Never ask someone to paste a provider session token into their profile.

**Profile access:** use the one-visit context packet first. Before enabling persistent AI retrieval, define the exact profile/input scopes, register compatible client grants, enforce authorization on every request, and test expiry and revocation. The current visit code cannot become an account-access token.

**Input controls:** every saved input needs a stable source record, a preview of shared content, enabled/paused status, refresh policy, last successful retrieval or failure, and a retention rule. Begin with manual refresh. Removing a source stops future retrieval; deletion of retained copies must also be clear. Decide how private notes and imported material are retained before collecting them.

**Channels:** “Sign in with X” means identity. Reading selected X material and sending through X require separate scopes and controls. The same separation applies to email and messaging: a contact address alone supplies neither inbox access nor sending authority. Show each permission independently; never label the entire channel connected because only authentication works.

**Communication proof:** record sender, permitted recipient or conversation, provider receipt, delivery result, and reply identity. Support deduplication and a stop control. Before automatic sending, make its permitted purpose, audience, schedule, and quiet hours understandable. No external-send authorization is created by this roadmap.

**Onsite conversation:** decide whether PointCast stores the conversation, retains only a short user-approved summary, or passes it through. State which runtime answers and what is retained. Public MCP tools and a profile receipt do not supply an embedded chat backend.

**Proactivity:** the selected runtime must own execution, scheduling, and inference access. Show the last run, next planned run, meaningful outcomes, and failures. Quiet operation is a product feature; unchanged or non-actionable results should not produce repeated notifications.

## Recommended next build and remaining choices

Finish and demonstrate stage 1, then build the small stage-2 experience with selected public PointCast content, one public link, and a note. Use that experience to determine whether saved inputs improve the next visit before expanding the connector list.

For stage 3, start with links and notes instead of choosing a private account integration prematurely. For stage 4, prove onsite continuity, then pick whichever single external channel has the clearest user need and supported delivery/reply path. For stage 5, evaluate the person's existing owned runtime before proposing new hosting.

The decisions still needed are the first recurring personal use case, the first private source worth connecting, which external channel should come first, how much conversation/input history to retain, and which runtime should handle future background work. Each can be resolved when its preceding experience produces evidence.

## Related implementation notes

- [Bring your AI setup and provider routes](../setup/bring-your-ai.md)
- [X identity setup and consent boundary](../setup/x-auth.md)
