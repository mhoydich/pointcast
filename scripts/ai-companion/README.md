# PointCast native companion pilot

This small local runner pairs one computer with a PointCast profile and claims private text or native sign-in jobs over outbound HTTPS. The computer and runner must remain awake. No public port, daemon installation, provider API key, or hosted compute is required.

The pilot uses an existing **ChatGPT subscription in Codex** or **Claude subscription in Claude Code**. It refuses API-key accounts. Provider credentials remain in their native stores; PointCast receives sanitized availability, sign-in mode, model choices, native login progress, and the requested task's text/model result.

## Requirements

- Node.js 22.12 or later.
- A native Codex CLI supporting the current App Server protocol, including environment-free threads and device-code sign-in. Verified with Codex 0.144.6.
- For Claude, an unmodified Claude Code CLI with `--safe-mode`, `--tools`, strict MCP configuration, and JSON result metadata. Verified with Claude Code 2.1.267.
- A PointCast deployment with the owner runtime feature enabled and its D1 migration applied.

From the repository root:

```sh
node scripts/ai-companion/runner.mjs --status
```

This prints sanitized native status. Codex choices come from `model/list`. Claude Code does not expose a native model catalog here: pass a model your subscription supports with `--claude-model`. The UI labels these as configured choices. A requested model is never presented as proof of the model that answered.

```sh
node scripts/ai-companion/runner.mjs --status --claude-model claude-fable-5-1
```

Use `--codex-bin /path/to/codex` or `--claude-bin /path/to/claude` when the desired native version is not first on PATH.

## Pair and run

In the PointCast profile's private AI settings, create a computer pairing code. Codes are one-use and expire after ten minutes. The runner checks its token file path before consuming the code. Omit `--label` to keep the computer name chosen in PointCast, or supply it to override that name. Paste the code into stdin, then press Enter and Ctrl-D:

```sh
node scripts/ai-companion/runner.mjs --pair-stdin --label 'My computer' --claude-model claude-fable-5-1
```

The runner stores only its PointCast scoped pairing credential, mode `0600`, at:

```text
~/Library/Application Support/PointCast AI Companion/runtime.json
```

Provider credentials are neither moved nor copied there. `--state-file /absolute/path/runtime.json` changes this location; it must be outside the repository. Pairing files cannot be symlinks. Pairing credentials expire after 30 days or can be revoked from PointCast; pair again when needed.

Restart later using the same configured Claude model choices:

```sh
node scripts/ai-companion/runner.mjs --claude-model claude-fable-5-1
```

For a single queued job, add `--once`. It checks status, claims at most one job, exits if the queue is empty, and closes its native processes. It does not wait for a future job.

## Native sign-in

If a subscription is already signed in, login confirms that account without replacing it. Otherwise, queue a provider login from PointCast or run locally:

```sh
node scripts/ai-companion/runner.mjs --login codex
node scripts/ai-companion/runner.mjs --login claude
```

Codex uses its native ChatGPT device-code flow; Claude uses native browser sign-in. Complete sign-in with the provider. The runner never asks for a provider password, session cookie, OAuth token, or API key. If the CLI is signed in with an API account, use the native CLI to switch accounts yourself; the runner will not log it out.

## Text-only boundary

Each job is bounded to 6,000 input characters, 16,000 result characters, and two minutes for inference. Native login has a five-minute limit. PointCast applies its own shorter user-input limit. The pilot exposes no incoming tools, shell, filesystem access, browsing, or external actions.

Codex runs an ephemeral thread with no environments, no dynamic tools, read-only sandbox, no network, and no approvals. Shell, web, apps, plugins, hooks, memories, delegation, code mode, and related integrations are disabled. Since empty configuration maps merge with native settings, the runner discovers only MCP server names and restarts its dedicated App Server with each server explicitly disabled before starting a thread. It verifies those effective disabled booleans and requires an empty tool map for every catalog entry before inference. Native MCP status can retain disabled server names; a retained name is not an enabled tool. Unexpected server requests are denied and fail the job.

Claude runs in an empty temporary directory with safe mode, no builtin tools, strict empty MCP configuration, no inherited setting sources, no browser integration, and no session persistence. `--bare` is intentionally unused because it bypasses the native OAuth mechanism needed for subscription access.

Both adapters remove API billing/gateway environment overrides from their child process and recheck native subscription status immediately before inference. Native provider rate limits and subscription terms still apply. Actual model IDs come from the native response: Codex's resolved/rerouted model and Claude's `modelUsage` keys. Claude may report auxiliary models as well as the requested model.

The runner heartbeats while work runs, honors cancellation/expiry, and awaits an in-flight heartbeat before sending completion. It never automatically repeats an inference or retries a claim/completion after ambiguous delivery. Cancelled, expired, or revoked leases cannot become successful cloud results.

## Local QA

HTTPS is required for remote origins. Explicit loopback HTTP is allowed for local development:

```sh
node scripts/ai-companion/runner.mjs --pair-stdin --origin http://127.0.0.1:8788 --state-file /private/tmp/pointcast-runtime-qa.json --once
node --test tests/ai-companion-native*.test.mjs
```

A saved credential is bound to its original origin; a conflicting `--origin` is rejected. Do not commit pairing files or put pairing credentials in shared logs. `--pair CODE` exists for controlled automation, but stdin avoids recording the short-lived pairing code in shell history.

Reference protocols: [Codex App Server](https://developers.openai.com/codex/app-server), [Codex configuration](https://developers.openai.com/codex/config-reference), and [Claude Code CLI](https://code.claude.com/docs/en/cli-reference).
