# The network on 2026-11-09: assessment and plan

Written by Claude on Mike's request: assess how PointCast, Industry Next and elsegundo.xyz are published and managed, how ready they are for bots, what the project is trying to do, and what to improve in infrastructure and in the vision.

## What this is based on

- Read in full: this repository at `4f5d071e` (config, deploy path, CI, auth, MCP, agent surfaces, block content, `docs/`).
- Not read: the Industry Next repository (`mhoydich/nouns5.4`) and the elsegundo.xyz repository. This session was scoped to `mhoydich/pointcast` and a request to attach `nouns5.4` was declined. The live sites were also unreachable from the session's network. Everything said here about the two sister sites comes from PointCast's own docs, mainly `docs/plans/2026-11-08-coordination-backbone.md` and `docs/plans/2026-10-03-ues-business-industrynext.md`. Treat those parts as second-hand.
- Not run: `npm run build:bare`, `npm run audit:agents`, `npm run audit:publishing`. Nothing but this document changed, and no dependencies are installed in the session.
- Web standards named below (Web Bot Auth, content-usage signals, MCP authorization, Cloudflare's Pages-to-Workers guidance) are from memory. Check each against its current spec before building on it.

## What you appear to be building

Three things at once, and they are converging.

1. **A town paper written with agents.** 506 blocks, a Morning Edition, courts, air and tide desks, with every block carrying an author and usually a source line.
2. **A site where bots are residents, not scrapers.** Machine doors beside every human one, an MCP server, signed agent identity, paid agent actions over x402, and rules about which agent actions need a person's okay.
3. **A coordination layer for real towns.** The Communicator slice and the backbone doc state it directly: "Infinite resources, finite coordination." One profile, one rating ledger and one consent rule, shared by El Segundo and the sister towns.

The third is the strongest idea in the repository and the youngest. Most of the surface area still belongs to the first two.

## Assessment

### 1. Publishing and global management

**Deploys left the iMac this morning, and the docs had not caught up.** *Corrected the same day: the first version of this audit said the deploy secret was missing. That came from `docs/OPERATIONS.md`, `TASKS.md` and the workflow's own comment, all of which were stale.* The `CLOUDFLARE_API_TOKEN` secret was set on 2026-11-09 and, after #1610 switched the upload to wrangler 4, workflow runs 305, 307 and 308 built and deployed main from GitHub. What was still missing was parity with `scripts/deploy.sh`: the workflow uploaded without that script's gates (required pages, 3,000-file floor) and without its production smoke test. This PR adds both. Still tied to a computer: the ten `workers/*` projects (`npx wrangler deploy` by hand), D1 migrations (`wrangler d1 migrations apply` by hand), the `.env.local` keys for Manus and the image server, and whatever unpushed work sits in the iMac's worktrees.

**No pull request runs the whole test suite.** There are 628 test files and 21 workflows. Twenty of the workflows are scoped to one feature's paths; only `pmm-check.yml` runs tests, and only the PMM ones. Neither the deploy workflow nor `scripts/deploy.sh` runs tests. A change that breaks a feature it does not own can merge and deploy green. Two workflows still trigger on finished Codex branches (`cohort-release-check.yml`, `home-share-editions-check.yml`).

**There is no single list of what the network is.** PointCast is a Cloudflare Pages direct-upload project. Industry Next is a separate Cloudflare Pages project in another repository. elsegundo.xyz runs on Netlify functions and Blobs. Around twenty more projects live on `*.mhoydich.chatgpt.site` and `*.workers.dev` hosts; `arcade-60.mhoydich.chatgpt.site` alone is linked 157 times from this repository. The nearest thing to a registry is the ad network's publisher list in `ads.json` (five publishers), plus a static `federation-peers.ts` with five entries, three of which are PointCast itself. Which site owns what, who deploys it and how is recorded in prose across several repos and in Mike's head.

**The instruction set has drifted.** `AGENTS.md` still describes Vercel/Netlify deploys and a `blocks-rebuild` branch, with a banner saying `docs/OPERATIONS.md` wins. `docs/auth-architecture.md` describes KV storage and lists GitHub, X, email and passkeys nowhere, though all four are built and auth moved to D1 on 2026-09-02. `TASKS.md` is 878 lines. An agent starting cold reads four documents and has to work out which half of each is current.

**The repository is heavy.** `public/` is 2.0 GB across 7,186 files and `.git` is another 2.0 GB. `docs/OPERATIONS.md` records 21 forgotten worktrees holding about 30 GB and a nightly disk sweep to cope. Media in git is the cause.

**Pace.** 464 commits in the last 30 days, roughly half by Mike and half by agents. The process is holding at that pace, which is a real achievement.

### 2. Readiness for bots

This is the strongest part of the project.

What is in place:

- `robots.txt` welcomes 19 named AI agents explicitly and lists the machine doors at the top.
- `llms.txt`, `llms-full.txt`, `agents.json` (also at two `.well-known` paths), three sitemaps, RSS and JSON feeds, and 477 JSON twins of pages, CORS-open.
- An MCP server at `/api/mcp` with about 125 tools, write tools marked, rate limits on the public writes.
- Agent identity: registered Ed25519 keys (`pci_` ids, rotation and revocation, `agent_keys` table) and signed request headers.
- x402 payments for agent-paid actions, with signed receipts.
- A planned third label for agent actions, beyond read and write: `consent`, meaning "this reaches a person and needs their okay". Few sites have thought this far.

Gaps, most important first:

| Gap | Evidence | Why it matters |
|---|---|---|
| One flat MCP server with ~125 tools | `functions/api/mcp.ts`, 4,453 lines | Every connecting client loads every tool description. Models pick worse from long lists, and one file is a merge hotspot for parallel agents. |
| Secrets accepted as tool arguments | `grok_inbox_answer`, `family_room_post` take `token` as an argument | Tool arguments are written into model transcripts and logs. A bearer token there is a leaked token. |
| Inbound bots are identified by user-agent string | `classifyUA` in `functions/_middleware.ts`; no HTTP Message Signature verification anywhere | Anyone can claim to be GPTBot. The site cannot tell a real crawler from an impostor, or give verified agents better limits. |
| Agent identity uses custom headers | `PointCast-Agent-Id` / `-Timestamp` / `-Signature` | It works, but only for agents that learn PointCast's scheme. The standard form (HTTP Message Signatures, RFC 9421, as used by Web Bot Auth) would let existing signed agents in without custom code. |
| MCP has no standard authorization discovery | no `oauth-protected-resource` metadata; per-tool bearer tokens | Clients that implement MCP's OAuth flow cannot sign a person in, so every write tool is either public or behind a hand-distributed key. |
| No machine-readable usage preference | `robots.txt` says "citing is welcome" in a comment only | Crawlers honoring content-usage signals (search, AI answers, training) get no stated preference. You have a clear stance; it is not expressed where bots read it. |
| Every HTML response is `no-store` | `public/_headers`, `/*` rule | Crawlers and agents cannot revalidate, so every visit is a full download. `no-cache` gives the same freshness and allows 304s. |
| Content-Security-Policy on one path only | `public/_headers` line 503 | A site with wallet signing and sessions has no script policy on the pages that use them. |
| `robots.txt` repeats one policy block 20 times by hand | `public/robots.txt` | A new private path has to be added in 20 places. One was already easy to miss. |

### 3. Identity

Built and working: email magic link, Google, GitHub, X, Tezos (Kukai), add-only passkeys, a re-authentication rule for sensitive passkey changes, sessions in D1. Apple, Ethereum and Solana are stubs.

Three problems:

- **The cross-site bridge is bespoke and narrow.** `functions/api/auth/project-ticket.ts` issues a 120-second ticket to exactly one hard-coded origin, a `chatgpt.site` host, and only for a linked Tezos identity. elsegundo.xyz has four browser-key schemes of its own and cannot consume a PointCast identity at all (the backbone doc's own table says so).
- **The auth database is the application database.** `AUTH_DB` has 37 migrations and now holds faucet claims, kennel club, town mail, the post office, communicator games, air desk, lucky cat and more. A bad migration for a game can take sign-in down with it.
- **Migration numbers collide.** `0004`, `0009`, `0010`, `0011` and `0019` each exist twice, and `0029`–`0030` are missing. Parallel agents each picked "next". It has worked so far because the files sort differently by name, which is luck.

### 4. Attribution

The norm is good: a block has `author` and `source`, and the voice rules forbid writing as Mike without his words. By the numbers: 286 blocks by `cc`, 151 by `codex`, 36 `mh+cc`, 16 `guest`, 10 `mike`, 7 with no author; 354 of 506 carry a source line.

Two observations. Attribution is a text field, so nothing proves who wrote a block or that it was not changed later. And about 2% of blocks are in Mike's own words and 3% are guests'. The paper is honest about being agent-written, but a town paper's scarce ingredient is residents' voices, and the system currently makes agent prose nearly free and human words expensive.

### 5. Breadth

`src/pages` has 929 top-level entries and 1,591 page files; `functions` has 392 TypeScript files. Nothing marks which surfaces are alive, seasonal or finished. A new visitor, human or bot, cannot tell the Communicator (a product) from a one-day tribute page. That costs discovery, and it means every surface is implicitly maintained forever.

## Plan

### Now: two weeks, small PRs

1. **Finish leaving the iMac.** Site deploys already run from GitHub; this PR adds the gates and the smoke test. Remaining: a manually triggered workflow that deploys one named worker, a step that applies pending D1 migrations before the upload, and a sweep of the iMac's worktrees for unpushed work. *Needs Mike: widening the Cloudflare token to Workers and D1, or a second token for those.*
2. **One check on every pull request:** `npm test`, `npm run build:bare`, `npm run audit:agents`. Remove the two dead-branch triggers. Add a check that fails on duplicate migration numbers.
3. **A network registry.** One file, published at `/network.json`: each property's domain, repository, host, deploy path, owner, identity provider, agent doors and status, including the `chatgpt.site` satellites marked as platform-hosted. Make `ads.json` publishers, `federation-peers.ts` and the `project-ticket` allow-list read from it.
4. **Generate `robots.txt`** from one policy and one agent list, add an explicit usage preference line, and offer the same generator to the sister sites.
5. **Swap blanket `no-store` for `no-cache`** on HTML. Verify with a preview that the home page still shows fresh presence and race state.
6. **Stop taking secrets as MCP tool arguments.** Header only, with a deprecation note in the tool description for one release.
7. **Bring three documents up to date:** `docs/auth-architecture.md`, the roles and deploy sections of `AGENTS.md`, and move finished sections of `TASKS.md` to an archive file.

### Next: this quarter

8. **Sign in with PointCast.** Replace the project ticket with a standard OpenID Connect provider on pointcast.xyz: discovery document, signing keys, authorization-code flow with PKCE, clients read from the network registry. elsegundo.xyz and Industry Next become relying parties with a few dozen lines each, and the tiers in the backbone doc (browser key, magic link, Google or wallet, vouched) become claims in the token. Passkey first for returning people. Ask Codex to review; this touches auth.
9. **Standard signatures for agents.** Accept HTTP Message Signatures alongside the `PointCast-Agent-*` headers, publish a key directory, and verify signed crawlers in the middleware so verified agents can be given higher limits than anonymous ones. Add MCP authorization discovery so a client can sign a person in for write tools.
10. **Split the MCP server by job:** a small core (blocks, town, discovery), then coordination (courts, communicator, wants), games, and the desk. Aim for no more than about 25 tools per server. The existing per-feature tool modules make this mostly routing.
11. **Separate auth from town state.** A second D1 database for games and town features; `AUTH_DB` keeps users, identities, sessions, passkeys and agent keys.
12. **Media out of git and into R2.** Target a checkout under 300 MB. This removes most of the worktree and disk problems in `docs/OPERATIONS.md`.
13. **A public release record.** Each deploy appends commit, time, approver and the blocks it published to a `releases.json`. `audit:publishing` then reads one file, and "is it live" has a URL anyone can check.
14. **Verifiable attribution.** Make `source` required by the block schema, add a content hash per block, and sign it with the author's key: the agent's registered key for agent blocks, Mike's passkey or wallet for his. Expose author and source in each block's structured data.
15. **Surface lifecycle.** Add `status` (live, seasonal, archived) to the surface registry and have the home page, `agents.json` and the sitemaps filter on it.

### Later: six to twelve months

16. **One platform shape.** Move PointCast from Pages Functions to Workers with static assets, so the ten `workers/*` projects and the site deploy and preview together. Decide whether elsegundo.xyz stays on Netlify; two hosts is workable only if both implement the same contracts and tests.
17. **The town kit.** The `towns/<slug>/` folder in the backbone doc, as a package both sites consume, with `npm run town:new`. Medway and New Braunfels are the test: a town stood up in an afternoon by someone other than Mike.
18. **Real federation.** Every town publishes the same small set: town file, agent manifest, ledger, feed. Blocks go out over one open social protocol so replies and follows come from networks people already use. RFCs 0004 and 0005 already map blocks to AT Protocol lexicons, so that is the cheaper path; ActivityPub is the alternative. Pick one.
19. **Consent across the network.** The read / write / consent label on every agent-callable action on every site, and one place a resident can see and revoke what may reach them.

## The vision, sharpened

**Lead with coordination.** "A town has enough courts, enough 4.0 players and enough Thursday evenings. What it lacks is the thing that lines them up." That sentence explains the project to a neighbor, a city employee or an investor in one breath, which "AI-native town and app shelf" does not. Publishing, bots, identity and payments all become means to it.

**Pick three loops and measure them in the real world.**

| Loop | Already built | Measure |
|---|---|---|
| Get together | Communicator, courts, ladder | Games actually played, scores confirmed by both sides |
| Know today | Morning Edition, air, tide, forecast board | People who open it most mornings |
| Ask and offer | Wants board, civil service, post office | Requests that got a real answer |

Page views say little here. Games played and neighbors met are the quality-of-life numbers.

**Make human words cheap.** Voice memo to block, attributed to the speaker, edited lightly by an agent with the edit visible. The ping inbox and the voice rules are most of the machinery already. A good target is one block in five from a resident's own words.

**Bots with jobs.** The house agents (Sky, Tides, Swell, Sun, Air) are the right pattern: a named agent, a narrow beat, a public record. Extend it to visiting agents through the claim board, with signed identity and the consent rule, so "bots welcome" means a bot can do useful, attributed work for the town, and cannot message a person who did not ask.

**Let the fairground be a fairground.** The games, tributes and experiments are where the craft and the audience come from. Mark them as such, archive freely, and stop treating each as a permanent product.

## Decisions for Mike

1. Widen the Cloudflare token (or add a second one) so GitHub can also deploy workers and apply D1 migrations?
2. Go ahead with pointcast.xyz as the sign-in provider for the whole network?
3. AT Protocol or ActivityPub for federation?
4. Does elsegundo.xyz stay on Netlify?
5. Grant a session access to `mhoydich/nouns5.4` and the elsegundo.xyz repository, so the sister sites get a first-hand audit instead of this second-hand one.

## For whoever picks this up

- Files changed: this document, `.github/workflows/cloudflare-pages.yml` (gates and smoke test), `docs/OPERATIONS.md` (deploy section).
- Build and tests: not run; no route, feed or JSON surface changed. The workflow change is first exercised by the next push to main. Codex review requested, since it touches publishing.
- Remaining risk: the sister-site findings are second-hand, and the standards references are unverified, as noted at the top.
- Manus follow-up: after this merges, confirm the next deploy run is green through the smoke step and the merged block is live. After item 5, check the home page on a real phone for stale presence.
