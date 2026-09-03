# Shared Chrome Runtime Hoist

Date: 2026-09-03
Owner: X (Codex)
Branch: `codex/footerbar-hoist-20260903`
Status: complete locally — reviewed, tested, and built; no merge or deploy

## Result

- Moved the FooterBar, DockLauncher, CursorRoom, TugRope, SpellLayer, DockBurstTicker, and AuthMenu browser code behind one `src/scripts/chrome.ts` entry imported once by `BlockLayout.astro` as a normal Astro module script.
- Removed component-local runtime scripts and the large generated `window.PC_*` data bootstrap. Runtime data now enters through ordinary module imports.
- Added a page-scoped lifecycle that tears down listeners, timers, animation frames, observers, and sockets before remounting on `astro:page-load` / `astro:before-swap`.
- Preserved multiple component mounts without generated element ids. Queries are root-scoped and event handling stays delegated.
- Kept CursorRoom presence and DockBurstTicker on one shared room websocket pair per page lifecycle by mounting presence only on the first room root.

## Built-size comparison

Measurements use the exact `origin/main` baseline and this branch's final `npm run build:bare` output. HTML is the raw UTF-8 byte size of the generated route. Inline JavaScript excludes JSON data scripts. First-visit JavaScript is inline JavaScript plus the recursively followed eager local ESM graph. The final aggregate treats local ESM assets as browser-cached across the four-route visit.

| Route | HTML before | HTML after | HTML delta | First-visit JS before | First-visit JS after | JS delta |
|---|---:|---:|---:|---:|---:|---:|
| `/about` | 326,107 B | 152,390 B | −173,717 B (−53.3%) | 234,843 B | 149,736 B | −85,107 B (−36.2%) |
| `/coffee` | 407,029 B | 233,312 B | −173,717 B (−42.7%) | 272,485 B | 187,378 B | −85,107 B (−31.2%) |
| `/kennel-club` | 356,625 B | 182,908 B | −173,717 B (−48.7%) | 233,290 B | 148,183 B | −85,107 B (−36.5%) |
| `/` | 524,143 B | 350,442 B | −173,701 B (−33.1%) | 239,930 B | 154,823 B | −85,107 B (−35.5%) |

Across the four-route visit, total JavaScript transfer with external modules cached fell from **870,871 B to 264,430 B**, a reduction of **606,441 B (69.6%)**. Per-page inline JavaScript fell by 173,778 B on every measured route. The after-build's unique eager external module graph is 156,110 B across 10 hashed assets; it is transferred once and reused.

The reproducible measurement command is:

```sh
node scripts/measure-chrome-transfer.mjs dist /about /coffee /kennel-club /
```

## Verification

- `npm test`: 910 passed, 0 failed.
- `npm run build:bare`: completed successfully; 2,061 pages built.
- `node --test tests/chrome-smoke.test.mjs`: passed under JSDOM and Vite. It exercises dock opening, stamp-action `dock` analytics, visibility-gated tug polling, duplicate chat suppression, burst rendering, and a second `astro:page-load` with one live room socket and one live burst socket.
- `tests/chrome-hoist.test.mjs` enforces the 2,048-byte `is:inline` ceiling for each guarded component and checks the single layout import and no-id runtime boundary.

No merge or deploy was performed.
