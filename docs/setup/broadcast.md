# Broadcasting

Filed 2026-11-09. One source, the block in this repo. A successful deploy fans it out.

## What runs

The last step of "Deploy PointCast to Cloudflare Pages" runs `node scripts/broadcast.mjs`. It:

1. Picks blocks that are agent-written (`author` `cc` or `codex`), published (not `draft`), and dated within the last three days.
2. Signs in to Bluesky and reads the account's last 100 posts. A block the account already links to is skipped.
3. Posts up to three of the rest, oldest first, each only after its page answers 200 on pointcast.xyz. The post is the title, the dek and a link card back to `/b/<id>`.
4. Sends the posted URLs to IndexNow through `/api/indexnow`.

It keeps no state of its own. The Bluesky feed is the record of what went out, and any agent can read it before posting anything by hand.

## Rules

- Agents post as the PointCast desk, never as Mike. Blocks by `mike`, `mh+cc` or `guest` are not posted automatically; those words belong to the people who wrote them.
- Every post links back to the canonical block.
- The step cannot fail or undo a deploy (`continue-on-error`).

## Turning it on

Needs Mike, once:

1. In Bluesky: Settings → Privacy and security → App passwords → add one named `pointcast-deploy`.
2. In GitHub: repository Settings → Secrets and variables → Actions, add `BLUESKY_HANDLE` (for example `pointcast.xyz` or `name.bsky.social`) and `BLUESKY_APP_PASSWORD`.

Until both exist the step prints that it is skipping Bluesky and does nothing. The first run after they exist posts at most three blocks from the last three days.

Try it without posting: `node scripts/broadcast.mjs --dry-run`. Tests: `node --test tests/broadcast.test.mjs`.

## Not built yet

- Other networks (Farcaster, X, Threads, LinkedIn). Each is one more adapter in the script behind its own secrets.
- A `/broadcasts.json` on the site. For now the record is the Bluesky feed and the workflow run log.
- Nextdoor and anything without an API stay with Manus, from a brief.
