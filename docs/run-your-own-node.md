# Run your own PointCast node

You don't need permission to join the PointCast webring. A node is just a website that exposes a handful of JSON endpoints in the v1 contract shape. This walkthrough gets you from `git init` to a federated node in about 10 minutes.

## What a node actually is

At minimum, a PointCast node serves four JSON endpoints:

| Endpoint | Purpose | Required? |
|----------|---------|-----------|
| `/node.json` | Federation advertisement: which rooms this node hosts | **Yes** |
| `/<room-id>.json` (one per room) | Room contract for each room | **Yes** — at least one |
| `/presence.json` | Who's here right now (stub OK) | Optional |
| `/signal-feed.json` | Event stream | Optional |
| `/artifacts.json` | Addable artifacts pinned to rooms | Optional |

Plus optionally:
- A rendered HTML page per room (so humans see the room, not raw JSON)
- `embed.js` so other sites can pull your rooms inline

That's it. **The protocol is the contracts**, not any particular framework.

## Quickest path: fork the template

The `template/` directory in [pointcast](https://github.com/mhoydich/pointcast) is a self-contained starter. Copy it, run `init-node.mjs` to pull the lib files, edit a few names, deploy.

```bash
# 1. Clone the template
git clone https://github.com/mhoydich/pointcast.git
cp -r pointcast/template my-pointcast-node
cd my-pointcast-node

# 2. Fetch the canonical lib + renderer + embed
node scripts/init-node.mjs

# 3. Install deps + dev
npm install
npm run dev
# → http://localhost:4321/r/welcome
```

Edit:

1. **`src/data/rooms/welcome.ts`** — change `id`, `title`, `description`, swap in your own programs, point verbs at your endpoints.
2. **`src/pages/node.json.ts`** — set your node `id`, `name`, `location`, `operator.handle`. List all your rooms.
3. **`src/pages/r/welcome.astro`** — duplicate to add more rooms.
4. **`astro.config.mjs`** — set `site` to your deployed URL.

Deploy anywhere that serves static + small API routes: Cloudflare Pages, Vercel, Netlify, Render, your own server.

## Slowest path: build from scratch

If you don't want to fork the template, build the four endpoints yourself in any framework. The contracts are at:

- **Room:** [pointcast.xyz/room-contract/v1.json](https://pointcast.xyz/room-contract/v1.json)
- **Federation:** [pointcast.xyz/federation-contract/v1.json](https://pointcast.xyz/federation-contract/v1.json)
- **Presence:** [pointcast.xyz/presence-contract/v1.json](https://pointcast.xyz/presence-contract/v1.json)
- **Signal:** [pointcast.xyz/signal-contract/v1.json](https://pointcast.xyz/signal-contract/v1.json)
- **Artifact:** [pointcast.xyz/artifact-contract/v1.json](https://pointcast.xyz/artifact-contract/v1.json)

A node in Go, Rust, Python, Elixir, raw nginx serving static JSON — they all work. The shape is the contract; the language is your choice.

## Joining the webring

Add a `federatedFrom` entry to your `/node.json` pointing at any node you want to subscribe to:

```ts
federatedFrom: [
  { id: 'pointcast', home: 'https://pointcast.xyz', nodeJsonUrl: 'https://pointcast.xyz/node.json' },
  { id: 'your-friend', home: 'https://friend.example', nodeJsonUrl: 'https://friend.example/node.json' },
]
```

When you do, your rendered pages can fetch those nodes' room contracts and display them with a "via friend.example" attribution. See `/r/federation/demo` on pointcast.xyz for the reference implementation.

To register your node in the canonical [pointcast.xyz/rooms](https://pointcast.xyz/rooms) directory (Sprint 10), open a PR adding your node to `src/data/nodes.json` in the [pointcast repo](https://github.com/mhoydich/pointcast).

## Versioning

All contracts are at `v1`. Breaking changes will bump to `v2` and live alongside `v1` during a deprecation window. Each payload's `$schema` field tells consumers which validator to run. Pin to a contract version if you want stability; pull the latest libs if you want the freshest features.

## Live presence + KV-backed addables

The stub `/presence.json` returns zeros because static sites can't count visitors. To get real counts:

- **Cloudflare Pages + Workers KV** — easiest. A Worker increments a counter on every page hit, the endpoint reads it.
- **Vercel Edge Config / Edge Functions** — similar shape.
- **Your own server with Redis / SQLite / anything** — same idea: every visit ticks a counter; the endpoint reads it.

Same pattern for live addable drops: `POST /artifacts/<roomId>` writes an Artifact to KV; `GET /artifacts.json` reads them. The renderers don't change — same shape, dynamic source.

## License

CC0 / Public Domain. Fork, modify, deploy. A `federatedFrom` entry pointing back to pointcast.xyz is appreciated but not required.
