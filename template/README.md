# pointcast-template

A minimal PointCast node — the smallest set of files that makes a website **a PointCast node** instead of a website.

## What you get

Out of the box, this template renders one room (`/r/welcome`) and exposes the four canonical JSON surfaces every PointCast node advertises:

- **`/node.json`** — federation advertisement: which rooms this node hosts
- **`/welcome.json`** — the room contract for your starter room
- **`/presence.json`** — stub presence (0/0/0 until you wire a KV provider)
- **`/signal-feed.json`** — empty by default; emits events when blocks ship
- **`/artifacts.json`** — empty seed; wire your own addable drops later

Plus the `<pointcast-room>` embed at `/embed.js` so visitors can pull your rooms onto their own pages.

## Quick start

```bash
# 1. Copy this directory into a new repo
cp -r template/ ../my-pointcast-node/
cd ../my-pointcast-node/

# 2. Install + dev
npm install
npm run dev

# 3. Edit src/data/rooms/welcome.ts — change the title, programs, verbs.
#    Add new rooms by copying that file + adding routes for /<id>.json
#    and /r/<id>.astro.

# 4. Edit src/pages/node.json.ts — set your node id, name, location,
#    operator handle. Add your new rooms to the rooms array.

# 5. Deploy. Anywhere that serves static + tiny API routes works
#    (Cloudflare Pages, Vercel, Netlify, Render, your own server).
```

## Anatomy

| File | Purpose |
|------|---------|
| `src/lib/room-contract.ts` | Types + validator for v1 RoomSpec |
| `src/lib/federation-contract.ts` | NodeSpec + PresenceSpec + federation client |
| `src/lib/artifact-contract.ts` | Artifact + ArtifactFeed types |
| `src/lib/signal-contract.ts` | SignalEvent + SignalFeed |
| `src/data/rooms/welcome.ts` | Your starter room as a function |
| `src/pages/node.json.ts` | Your node's advertisement |
| `src/pages/welcome.json.ts` | The room contract for `/welcome` |
| `src/pages/presence.json.ts` | Stub presence endpoint |
| `src/pages/signal-feed.json.ts` | Event stream (empty by default) |
| `src/pages/artifacts.json.ts` | Artifact feed (empty by default) |
| `src/pages/r/welcome.astro` | Rendered page for your room |
| `src/components/RoomRenderer.astro` | The generic room renderer |
| `public/embed.js` | The `<pointcast-room>` web component |

## Federation

To join the PointCast webring, add other nodes' \`/node.json\` URLs to your `federatedFrom` array in `src/pages/node.json.ts`:

```ts
federatedFrom: [
  { id: 'pointcast',  home: 'https://pointcast.xyz', nodeJsonUrl: 'https://pointcast.xyz/node.json' },
  // your friends' nodes go here
]
```

Their `/node.json` will then be readable by your subscribers; render their rooms with `fetchFederatedNode()` (see `src/lib/federation-contract.ts`).

## Contracts

All four contracts (v1) are versioned and live at:

- `https://pointcast.xyz/room-contract/v1.json`
- `https://pointcast.xyz/federation-contract/v1.json`
- `https://pointcast.xyz/artifact-contract/v1.json`
- `https://pointcast.xyz/signal-contract/v1.json`

The lib files in `src/lib/` are local copies of the validators that pointcast.xyz runs. You can replace them with a `pointcast-contracts` npm package later (planned).

## License

CC0 / Public Domain. Fork, modify, deploy — no attribution required, but a `federatedFrom` entry pointing back to pointcast.xyz is appreciated.
