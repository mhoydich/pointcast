# Manus brief — broadcast-mode platform matrix

**Audience:** Manus as operations-and-research specialist.

**Context:** PointCast is opening a broadcast-mode arc (see block `/b/0282` and sibling brief `docs/briefs/2026-04-19-codex-broadcast-architecture.md`). Mike's explicit directive is to NOT lock to Apple TV — he wants other pathways explored in parallel. cc has shipped `/tv` v0 as a cross-platform web surface; the question is where this actually plays and what each platform costs to reach properly.

---

## Task PM-1 — Build the platform matrix

Deliverable: a table at `docs/manus/2026-04-19-broadcast-platforms.md` with columns for each row:

- **Platform**: Apple TV, Roku, Google TV, Android TV, Fire TV, Samsung Tizen, LG webOS, Chromecast, AirPlay (as a capability), game consoles (PS5, Xbox Series X browsers).
- **Reach in the US / globally**: best available numbers, cite source + date.
- **Reach in the LA/OC/SoCal demo specifically**: if you can get this. PointCast's home market.
- **Cross-platform app path**: native SDK (Swift/tvOS, BrightScript, Android, etc.) vs. web-browser-in-a-wrapper vs. works-via-casting-from-phone.
- **Web-browser quality on the platform**: does Chrome/Safari actually work at sufficient fidelity for `/tv`? Specific gaps (no WebGL? No Service Worker? No CSS Grid gap property?)
- **Dev lift for a native app**: ballpark days-of-work + required hardware/software/accounts + submission review window.
- **Cost**: dev account fees, publishing fees, recurring costs.
- **Monetization options on platform**: IAP, subscriptions, ads — relevant later for HELLO tokens and /collect claims.

Target: 9-12 rows, one per platform. Be honest about "works but poorly" — that's a valid cell.

---

## Task PM-2 — The casting path, specifically

Mike's hinted preference: cross-platform via casting (AirPlay + Chromecast + wired HDMI from laptop) might cover 80% of the use case without any native work. Validate or challenge this.

Answer:

- What fraction of US households with an Apple TV / Chromecast / Fire TV / etc. ALSO have a phone or laptop capable of casting?
- What's the UX cost of "cast this tab" compared to "open the PointCast app"? (Hint: it's large; most people don't cast tabs. But the ones who do are our audience.)
- Does AirPlay from iOS Safari pass `localStorage` / session continuity through? (I.e. can the phone's authenticated PointCast session "follow" to the TV, or does the TV show a fresh session?)
- Chromecast sender/receiver model: does it let the TV show a separate "receiver" page while the phone is the "sender" controller? If so, this is the answer to phone-as-controller without custom native code.

Deliverable: `docs/manus/2026-04-19-casting-path-analysis.md`, ~400-800 words.

---

## Task PM-3 — Vendor neutrality scan

One of the PointCast design principles (surfaces, /for-agents, stripped HTML mode, /agents.json) is vendor-neutral agent access. Check the same for TV:

- Are any of these platforms hostile to independent creators putting a PointCast app in their store without strings (exclusivity, revenue share, content guidelines that conflict with cannabis-adjacent content from Good Feels)?
- What's the content-policy surface on Apple TV (known strict), Roku, Samsung Tizen, etc.? PointCast carries /shop links to Good Feels (cannabis/hemp). Does that block store submission on any of them?
- Web-casting has no store-submission filter. Is that a meaningful strategic advantage?

Deliverable: `docs/manus/2026-04-19-tv-vendor-policies.md`, ~300-500 words. Flag any platform where Good Feels content IS a problem.

---

## Task PM-4 — The 100-mile-radius question

Mike wants local-first framing. 100 miles from El Segundo reaches SB → Palm Springs → North SD County.

- What geolocation APIs are realistic on each TV platform? (Apple TV does NOT expose user location to apps without permission; Roku/Fire TV similar.) Browser-based `/tv` on a laptop CAN, via the standard geolocation API, with a prompt.
- If TV platforms don't expose location, how would we derive "you're in range" without it? IP geolocation is the fallback — reliable to city/region level, not street.
- Is there a sensible default? Anchor-on-El-Segundo always, let the viewer override via a picker on phone? This might be the simplest honest UX.

Deliverable: fold this into `docs/manus/2026-04-19-broadcast-platforms.md` as a "location API" column on the matrix, plus one summary paragraph.

---

## Working style

- Research-heavy, not code-heavy. You're answering "what's real" so cc can focus on "what to build."
- Cite sources (dates, URLs) for reach numbers.
- Be honest about uncertainty — "I couldn't find reliable data for X" is an acceptable cell.
- When in doubt, bias toward web-cross-platform + phone-as-controller. That's the path cc can actually ship.
- Author your own blocks as `manus` per VOICE.md. Source field should cite the manus/ doc path.

— brief filed by cc, 2026-04-19 08:15 PT, sprint `tv-mode-v0`
