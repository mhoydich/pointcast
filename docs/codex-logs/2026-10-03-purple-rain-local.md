# Purple Rain — local editorial exhibition

Requested by Mike through parent task 01a0fe67-b861-75d8-959e-bc73743e003a. Prepared by Codex in a fresh HOME worktree, based on origin/main aa286992. No public push, PR, merge or deployment is authorized for this new feature. The existing release publisher 01a10309-d270-708a-ab02-fa8301c0c016 owns deployment.

## Deliverable

Isolated routes `/purple-rain/` and `/purple-rain.json`. No shared homepage, hub, discovery, block schema, auth, deployment or other feature edits. Page carries `noindex, nofollow`; JSON carries X-Robots-Tag. Publication requires the parent to include this feature explicitly and the publisher to decide draft metadata/discovery integration at that time.

A four-lens editorial exhibition: Fashion (materials, silhouette, gender expression, exact film costume credits), Energy (stagecraft, collaboration, performance dynamics), Results (dated/territorial measures and critical judgment), Time (15-event creation/release/legacy chronology). The atlas has 18 genuine reusable photographs/context scans, 3 original AI-generated illustrations, and 6 outbound-only archive references. Later-era performance photos keep their own dates and do not impersonate Purple Rain-era archive images.

Controls: lens filtering across prose/gallery/timeline, image-kind and text search, reset/empty states, native dialog with zoom/keyboard panning/Escape/focus return, original interpretive stage-reading exercise. All substantive text, images and chronology are server rendered. NoJS has anchor navigation and all records visible; reduced-motion styles suppress transitions. Official media links are outbound/user initiated; no media playback, embeds, thumbnails or audio/video files are hosted.

## Sources and rights

The native JSON twin is the full source/rights inventory with creator, caption, alt, source page, exact license URL, date, source qualifications and hosted-photo hashes. Original-art records include prompts, tool/date/non-archival labels; PNG originals are preserved under `public/images/purple-rain/originals/`, with smaller WebP delivery copies (1.15 MB combined). No third-party image was supplied to generation. This is PointCast editorial, not estate/museum/photographer endorsement.

Primary facts include estate discography, AFI onscreen credits, MNHS costume-object archive, First Avenue venue history, Academy/GRAMMY award records, RIAA program history, LOC registry material and label edition announcements. Results distinguish 13× U.S. multi-Platinum in 1996 (RIAA retrospective), a reported 25m+ worldwide copies in a 6 March 2025 NPG/Paisley Park/Warner statement without an audited sales cutoff, and Apple Music's dated editorial No.4 (not a sales/streams rank).

Independent fact and rights reports and research memos are in `sketches/codex/purple-rain/`. Reviews corrected RIAA date/category interpretation, exact costume credited names, Paris video-still creator/source-crop credit, two Flickr source URLs, a modern ticket scan's object date, and an overnight Coachella photo date. A vest display containing an uncleared separate portrait and a U.S.-only PD press-photo claim stay outbound-only. Commons source licenses are recorded declarations, not an audit of every photographer warranty. Paris CC license was independently reviewed by Commons against its original YouTube source in November 2025; the still only is reused.

PointCast's `agent-kit.md` and live native JSON were read first. Existing SPN WATCH block0264 is acknowledged as a prior field note; related destinations use verified `nouns-drum-club.json` and `object-library.json`. The Object Library link retains its concept/browser-only rehearsal status.

## Validation

Seven focused Node tests cover source-ID integrity, lens completeness, a prohibition on embedding restricted references, explicit licenses/unchanged photo hashes, original-art provenance and preserved originals, portable inventory/no host paths/no media files, and isolated draft metadata. Scoped Astro compilation reported zero diagnostics, and standalone client TypeScript passed strict checking. Independent static UI/accessibility review found no remaining critical/major findings after fixes for zoom keyboard panning, reference-card clipping and two contrast values.

Full all-routes `build:bare` has NOT been run. Parent requested the shared Mac publication build lane remain exclusive to the publisher. Only scoped feature compilation, focused tests and local dev previews are used here. The scoped browser pass is complete and passed.


## Browser proof and handoff

Preview: `http://127.0.0.1:4495/purple-rain/` (owned scoped Astro dev session; two feature routes only). Re-run from the HOME worktree with `node node_modules/astro/bin/astro.mjs dev --config tmp/purple-rain-preview/scoped.config.mjs --host 127.0.0.1 --port 4495`. The temporary preview source lives inside the worktree to avoid Astro cached-compile-metadata failures; it is a copy of the reviewed feature files and is excluded from the handoff bundle. Keep dependencies and this owned preview until the parent has reviewed the draft, then stop the preview and clean the temporary preview copy. Do not remove the draft worktree before its work is preserved.

Browser report passes nine groups: combined lens/type/search/reset counts; keyboard lens and stage controls; native dialog/zoom/Escape/focus return; 1440/768/390/320 layouts without overflow or broken loaded images; no external hotlinks/embeds/audiovisual playback; complete native JSON; all four articles, 27 atlas entries and 15 timeline events with JavaScript disabled; reduced-motion styles; no runtime errors.

Seven successful screenshots show the desktop hero, each of the four lens views, and 390/320px mobile views. A very tall full-page capture timed out on the busy shared Mac, and a later redundant screenshot attempt also timed out; functional checks were then run without capture and passed. The saved seven screenshots were visually inspected. No full-page screenshot is claimed.

Final post-repair independent fact and rights dispositions pass with no residual major issue. Evidence, reports, screenshots and a portable draft archive are preserved in the delegated task workspace `/Users/michaelhoydich/Documents/Codex/2026-10-03/task-23/`. The feature remains an uncommitted local draft on `codex/purple-rain-local-20261003`, base `aa2869924f9a1dac0067c42be3938ca1080fc04d`, in `/Users/michaelhoydich/pc-purple-rain`. No push, PR, merge, deployment, homepage edit or publishing-lane modification happened.
