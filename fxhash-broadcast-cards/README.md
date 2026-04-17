# PointCast · Broadcast Cards

A self-contained generative artwork project for [fxhash](https://fxhash.xyz). Each mint generates a unique 1080×1350 "broadcast card" — a nounish pixel-art portrait framed by PointCast's masthead band, stamped with a randomly-generated radio callsign, frequency, slogan, and edition number. Deterministic from the fxhash seed.

## What each mint looks like

- **Top band** — `POINTCAST · BROADCAST CARDS` bar with live-dot, matches the site's masthead
- **Center** — a procedurally generated pixel noggles portrait with a random hue, headband accessory, and the signature ⌐◨-◨ glasses
- **Signal arcs** — broadcast transmission rays radiating from the head
- **Bottom band** — randomly picked callsign (`KPCST`, `WPCX`, `KELS`, …), an FM frequency (`87.x`–`108.x`), a one-line slogan, an edition number, and a hash fragment for identity
- **Grain overlay** — subtle film grain for warmth

**Exposed fxhash features** (minted as on-chain attributes):
- `Palette` — one of 7 palettes (Dusk, Mint, Cobalt, Ember, Bone, Nightcap, Smog)
- `Callsign` — one of 8 callsigns
- `Frequency` — the FM frequency
- `Edition` — a 1–999 integer

## Local preview

Just open `index.html` in a browser. The `fxhash-snippet` block at the top auto-shims `$fx` with a local random hash so you can iterate on the design without uploading.

```bash
# Quick local preview via any static server
cd fxhash-broadcast-cards
python3 -m http.server 8080
# → http://localhost:8080/
```

Reload to get a new random seed. Each reload = a preview of a different potential mint.

## Uploading to fxhash

fxhash accepts a zip with `index.html` at the root.

```bash
cd fxhash-broadcast-cards
zip -r ../broadcast-cards.zip index.html
```

Then:

1. Go to https://fxhash.xyz/sandbox to test the upload (sandbox validates that the project runs offline and `$fx.hash` / `$fx.rand` work).
2. When sandbox is happy, go to https://fxhash.xyz/mint-generative to publish.
3. Set edition count, price (in tez), royalties. fxhash takes a small cut.
4. Publish → the project mints on Tezos; each collector gets a unique output generated from their seed.

## Self-contained guarantee

This project uses no external network requests at render time:
- No `fetch()` to remote APIs
- No remote images or CDNs
- Fonts fall back to system monospace + serif (fxhash provides `JetBrains Mono` if referenced via Google Fonts, but we avoid the dependency)

That's why the nouns here are procedurally generated rather than pulled from `noun.pics`. Round 2 can bundle actual Noun trait SVG data (public-domain, CC0) inline for authentic Noun remixes — see "Next round" below.

## Next round ideas

- **Bundle real Noun traits.** Nouns' on-chain art is CC0 — pull the five-layer trait data (background, body, accessory, head, glasses) as embedded base64 or raw pixel arrays, then compose a real Noun deterministically from seed.
- **Audio.** fxhash supports audio; a low broadcast-static hum or a 1-second "tuning in" swoop on load.
- **Interactive knob.** `$fx.rand` doesn't change after the initial hash, but we could let the viewer rotate the frequency dial to re-tint the portrait — a view-only interaction.
- **Link back to PointCast.** Embed a small "pointcast.xyz" mark with a hash-verify anchor so collectors can verify their mint seeded a real entry in the log.

## Credit

- Nouns glasses (noggles) silhouette — inspired by CC0 Nouns DAO artwork. PointCast is not affiliated with Nouns DAO.
- All other elements original to PointCast.
- This project is CC0 itself — fork, remix, mint your own flavor.
