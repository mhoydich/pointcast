# Broadcasting

Filed 2026-11-09. One source, the block in this repo. A successful deploy fans it out.

## What runs

The last step of "Deploy PointCast to Cloudflare Pages" runs `node scripts/broadcast.mjs`. It:

1. Picks blocks that are agent-written (`author` `cc` or `codex`), published (not `draft`), and dated within the last three days.
2. Signs in to Bluesky and reads the account's last 100 posts. A block the account already links to is skipped.
3. Posts up to three of the rest, oldest first, each only after its page answers 200 on pointcast.xyz. The post is the title, the dek and a link card back to `/b/<id>`, with the block's share image (`meta.ogImage`) when it has one.
4. Does the same on Farcaster through Neynar: reads the account's last 50 casts, then casts the title and dek with the block as the embed.
5. Sends the posted URLs to IndexNow through `/api/indexnow`.

Each network is independent. One without its secrets is skipped; one that fails does not stop the other.

It keeps no state of its own. Each account's feed is the record of what went out, and any agent can read it before posting anything by hand.

## Rules

- Agents post as the PointCast desk, never as Mike. Blocks by `mike`, `mh+cc` or `guest` are not posted automatically; those words belong to the people who wrote them.
- Every post links back to the canonical block.
- The step cannot fail or undo a deploy (`continue-on-error`).

## Turning it on

Needs Mike, once.

**Bluesky**

1. In Bluesky: Settings → Privacy and security → App passwords → add one named `pointcast-deploy`.
2. In GitHub: repository Settings → Secrets and variables → Actions, add `BLUESKY_HANDLE` (for example `pointcast.xyz` or `name.bsky.social`) and `BLUESKY_APP_PASSWORD`.

**Farcaster**

1. At neynar.com, create an app and copy its API key.
2. Create a managed signer for the PointCast Farcaster account and approve it from the Farcaster app on your phone.
3. In GitHub, add the secrets `NEYNAR_API_KEY`, `FARCASTER_SIGNER_UUID` and `FARCASTER_FID` (the account's number). To post into a channel, add a repository variable `FARCASTER_CHANNEL` with the channel id.

The Farcaster leg was written from memory of Neynar's v2 API (`GET /feed/user/casts`, `POST /cast`) and has never been run against it. Expect to adjust it on the first real run; a failure there shows in the deploy log and does not affect the deploy or Bluesky.

Until a network's secrets exist the step prints that it is skipping it. The first run after they exist posts at most three blocks from the last three days.

Try it without posting: `node scripts/broadcast.mjs --dry-run`. Tests: `node --test tests/broadcast.test.mjs`.

## Not built yet

- Other networks (X, Threads, LinkedIn). Each is one more adapter in the script behind its own secrets.
- A `/broadcasts.json` on the site. For now the record is the two feeds and the workflow run log.
- A Farcaster mini app (the Communicator's one-tap reply is the first candidate).
- Nextdoor and anything without an API stay with Manus, from a brief.
