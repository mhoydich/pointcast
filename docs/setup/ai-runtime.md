# My AI: native companion owner pilot

This pilot lets a signed-in PointCast profile submit one text task to Codex or Claude Code running on the owner's computer, through an existing native subscription account. Pairing, provider sign-in, and a successful task are separate steps.

**The computer must stay awake and the companion must remain open.** This is a local source install, not cloud hosting. It does not work while the Mac is asleep. Agent payments, wallet actions, automatic API billing, private-source ingestion, and outbound messages are not enabled.

This guide describes the implementation in the `codex/bring-ai-x-profiles-20260909` branch. Use a PointCast origin where the pilot UI, authenticated APIs, and database migration `0017_ai_runtimes.sql` are enabled together. Local verification is not a claim that the public site has been deployed.

## Get the source and native clients

Use Node.js **22.12.0 or later**, matching this repository's supported engine, and Git. The companion itself uses Node built-ins and the source files under `scripts/ai-companion`; it does not require this site's `npm ci` or an Astro build to run. Building or serving PointCast is a separate setup.

If you already have this branch checked out, use that folder. Otherwise:

```sh
git clone --depth 1 --single-branch --branch codex/bring-ai-x-profiles-20260909 https://github.com/mhoydich/pointcast.git pointcast-ai-pilot
cd pointcast-ai-pilot
node --version
node scripts/ai-companion/runner.mjs --help
```

Install a compatible native Codex or Claude Code client separately. For Codex, follow the [official CLI installation and ChatGPT sign-in instructions](https://learn.chatgpt.com/docs/codex/cli). The pilot invokes each installed client directly and requires native subscription authentication. Having a browser subscription alone does not authenticate the local client.

The default executable names are `codex` and `claude` on your `PATH`. Use `--codex-bin /absolute/path/to/codex` or `--claude-bin /absolute/path/to/claude` when you have multiple versions or the command is elsewhere. Check what this particular companion can see:

```sh
node scripts/ai-companion/runner.mjs --status
```

`--status` inspects native account and model status; it does not submit a task or require PointCast pairing. Look for the provider's `available: true`, `authenticated: true`, and `authMode: "subscription"`. An unavailable client or an API/unknown account is not ready for this pilot.

Claude must support the safety flags this adapter checks, including `--safe-mode`, `--tools`, `--strict-mcp-config`, and `--no-session-persistence`. Codex must support the app-server APIs and effective configuration checks used by the adapter. An incompatible client fails closed; do not remove those checks to make it run.

## Pair the computer once

1. Open `/me#my-ai` on the enabled PointCast origin and sign in to PointCast.
2. Under **My AI → Pair a computer**, name the computer and create a pairing code. It can be used once and expires after ten minutes.
3. In the source folder, set the exact same origin, including any local port. Replace the placeholder below with the origin from your profile's address bar. HTTPS is required except for localhost/loopback development.

```sh
POINTCAST_ORIGIN='https://YOUR-ENABLED-POINTCAST-HOST'
node scripts/ai-companion/runner.mjs --pair-stdin --origin "$POINTCAST_ORIGIN"
```

The profile separates this into two steps: **Copy command**, run it in the source folder, then **Copy private code** and paste it into the waiting terminal. Press Enter, then press Control-D on the empty line to end standard input. Keep the terminal private while pasting; the code may be visible there.

The profile uses `--pair-stdin` so the code stays out of the command line and shell history, including codes beginning with `--`. The runner also accepts the advanced `--pair CODE` form, which exposes the code in process arguments and potentially shell history; use the standard-input flow above. Never share the private code in an issue, screenshot, or message.

On success the runner prints a pairing acknowledgment containing the runtime ID, stores its PointCast credential privately, and begins waiting for tasks. Leave this terminal open. **Companion online** confirms transport; it does not confirm provider authentication.

The computer name entered on your PointCast profile is preserved. Supply `--label 'My Mac'` during pairing only if you explicitly want to replace that name. To restart the same pairing later, run:

```sh
node scripts/ai-companion/runner.mjs
```

Keep any binary/model options you used on the first run. Those options are not stored in the pairing file. A different PointCast origin needs its own pairing; an origin override cannot redirect an existing stored credential elsewhere.

## Sign in through the native provider

In My AI, choose the paired computer and **ChatGPT · Codex** or **Claude · Claude Code**. If the installed client is already signed in through a supported subscription, the profile can show **Ready to try** immediately.

Otherwise choose **Sign in with ChatGPT** or **Sign in with Claude**. Finish the provider's native sign-in page and enter a device code if one is shown. For Claude, use a browser on the paired computer so its localhost callback can complete. The profile allows only the provider's recognized HTTPS sign-in destinations. **Check status** refreshes the result. A completed sign-in job alone does not verify a task.

You can also initiate the same native flow directly, without pairing:

```sh
node scripts/ai-companion/runner.mjs --login codex
node scripts/ai-companion/runner.mjs --login claude
```

Run only the command for the provider you want. If a native client is already authenticated with API or unrecognized access, this companion does not silently replace that account. Switch to a subscription account in the provider's own client, then restart the companion or check status.

If Claude returns a code that must be pasted into a terminal, or PointCast says the native terminal is required, cancel any still-pending sign-in request. On the paired computer, run the provider command directly:

```sh
claude auth login --claudeai
```

Use the same Claude executable selected by `--claude-bin`, if one was supplied. Finish sign-in and paste any provider code only into that native terminal. Then return to PointCast and choose **Check status**. This is the native command, not the companion's `--login claude` wrapper: the companion uses noninteractive pipes and cannot accept the paste-code fallback. It never asks you to send a provider login code through PointCast.

The native CLI can print its paste-code prompt while a normal browser callback is still pending. The companion allows that callback to complete; a timeout, unsuccessful exit, or unconfirmed sign-in after this prompt produces the terminal-recovery message. Fresh provider consent remains unverified in this pilot, as detailed below.

**Do not copy provider API keys, OAuth tokens, cookies, or native auth files into PointCast.** Provider credentials remain in the native client's own store. The companion reports authentication state, model choices, temporary sign-in links/codes, and reviewed task results. It strips supported API-key, gateway, and OAuth-token environment overrides before launching the native clients. A provider subscription remains subject to that provider's account access and usage limits; the pilot does not unlock models or capacity.

## Choose a model and try a task

Codex choices come from its native `model/list` response. Claude model choices are explicit companion configuration, not discovery. Without a configured Claude list, the profile offers the native client's default and labels discovery as unavailable.

For example, to expose a Fable choice using a specific Claude installation:

```sh
node scripts/ai-companion/runner.mjs --claude-bin /absolute/path/to/claude --claude-model claude-fable-5-1
```

Replace the executable path with your installed binary. `--claude-model` is repeatable. Use the same options with `--pair-stdin` when pairing for the first time. Adding a model name only makes it a configured choice; your native account must actually support it. The result displays the requested choice and actual model metadata. Auxiliary model usage may also appear.

In the profile:

1. Choose a listed model or the native default.
2. Keep or edit the suggested first task: “Help me choose a quiet PointCast experience for this evening. Explain your choice and ask me one good question.”
3. Optionally select a PointCast context description, paste a note, and opt into the displayed gentle preference.
4. Read **What your AI will receive**, then submit the task explicitly.

The preview combines your task, selected static context, and optional note. The gentle preference is shown separately and applies only to this task. PointCast adds a text-only instruction. URLs in the selected description are references; this slice does not fetch their contents, connect private accounts, inherit a browsing session, or authorize tools or external actions.

The native adapters run each task in a temporary directory with tools and inherited integrations disabled and no reusable conversation. This is a single text response, not an ongoing memory or autonomous agent. The prompt and result pass through PointCast's private job storage, and the chosen provider processes the submitted text.

The profile states mean:

| State | What has been established |
| --- | --- |
| Waiting for companion | A one-use pairing invitation exists. |
| Companion online | The paired runtime has reported recently. |
| Ready to try | The selected native provider reports subscription authentication. |
| Connected · task verified | A prompt actually succeeded with reported model metadata, and the companion is still online and authenticated. |
| Companion offline | No current heartbeat, or the pairing has expired. |

An optional **visit receipt** lower on the profile records a separate one-time visit through PointCast tools. It does not pair this runtime or authenticate a provider.

## Limits, stopping, and retries

- Up to five paired computers or active waiting invitations per profile; remove an old computer before adding another. Expired unpaired invitations are removed during runtime API activity. Paired computers are preserved until you disconnect them.
- One queued/running job per runtime and up to thirty jobs per profile per hour, including sign-in requests.
- Task, selected context, and note together: at most 4,000 characters before the server's text-only instruction and optional gentle preference. Results are limited to 16,000 characters.
- Pairing invitations and queued/running jobs expire after ten minutes. Native sign-in is bounded to five minutes; a native text task is bounded to two minutes or its remaining job lifetime, whichever is shorter.
- The companion is considered offline after 45 seconds without a heartbeat. While working, it checks in about every fifteen seconds. The profile polls every three seconds while visible and authenticated.

**Cancel** revokes the active job on PointCast immediately. The companion aborts the local work when its next heartbeat observes cancellation; network failures also stop its active work. A late completion cannot become a successful profile result. Cancellation does not reverse provider usage already incurred. Control-C stops the companion locally.

The runner never automatically repeats an inference, claim, or completion after an ambiguous delivery failure. A claimed job is not requeued. If the browser loses the submission response, **Retry same task** reuses the same request identifier for that unchanged submission, returning the original job instead of creating another. Polling can also recover it by identifier. Changing the request or submitting a new task after an accepted result creates a new request; review the existing status before starting again. Reloading the page clears the browser's pending retry state.

`--once` performs one heartbeat/claim cycle, runs one available job, and exits. It is useful for diagnosis but does not keep a computer online for later work.

## Private pairing credential and revocation

The one-use code is exchanged for a **30-day PointCast runtime token**, scoped to that computer's heartbeat and job claim/progress/completion API. It is not a PointCast browser session or a provider credential, and it cannot list the owner's other profiles or create new tasks. It can receive the text of tasks assigned to that runtime, so keep it private.

By default, the runner stores it at:

```text
~/Library/Application Support/PointCast AI Companion/runtime.json
```

The file is written with mode `0600` outside the repository. A different location can be supplied with `--state-file /absolute/private/path/runtime.json`; reuse that flag on subsequent runs. Repository paths and symlink files are rejected. Do not print, commit, sync publicly, or share the contents. The server stores a hash of the token, not its raw value.

To revoke access, use **Disconnect computer** in My AI. This removes that runtime and its private jobs/results, invalidates its token, and rejects in-flight or future completion. Stopping the process alone does not revoke it. Deleting only the local file also does not revoke it. After disconnecting and stopping the runner, you may remove that local file. Native provider sign-in stays managed by the provider's own client.

A token expires thirty days after pairing; it is not silently renewed. Disconnect the expired computer and create a new pairing. Jobs older than thirty days are pruned during runtime API activity; this slice does not include a separate scheduled deletion job.

## What has been verified

Local owner-pilot validation on **2026-09-09** confirmed real subscription-backed text inference using Codex CLI **0.144.6** with actual model **`gpt-5.6-luna`**, and Claude Code **2.1.267** with explicit **`claude-fable-5-1`**. Claude's actual usage metadata included Fable and an auxiliary Haiku model. The full local browser profile → queued job → native result path completed for both providers, and the real Codex client passed the inherited-MCP-disabled checks.

Those runs used existing signed-in native accounts. A fresh provider sign-in flow has **not** been completed locally for this pilot; its implementation and simulated tests are not proof of real new-account consent. This also does not establish public deployment, support for every subscription tier/client version, or execution while the computer sleeps.

Separately billed API access remains an advanced manual route outside this pilot. There is no automatic fallback to it, and agent spending or wallet payments remain unavailable.

Implementation references: [runner](../../scripts/ai-companion/runner.mjs), [Codex adapter](../../scripts/ai-companion/codex-native.mjs), [Claude adapter](../../scripts/ai-companion/claude-native.mjs), [profile API](../../functions/api/me/ai-runtimes.ts), and [native transport](../../functions/api/ai-runtime.ts).
