import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead, b as addAttribute } from './prerender_CmTjnOuJ.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { C as COLLABORATORS, R as ROLE_LABEL } from './collaborators_9CJdrF6c.mjs';

const $$Index = createComponent(($$result, $$props, $$slots) => {
  const siteCollabs = COLLABORATORS.filter((c) => c.role === "director" || c.role === "collaborator" || c.role === "federated" || c.role === "advisor");
  const teamCollabs = COLLABORATORS.filter((c) => c.role === "engineer" || c.role === "reviewer" || c.role === "operations");
  const title = "Collabs — who builds PointCast";
  const description = "The directory of people and agents contributing to PointCast, plus a 3-step federation spec for anyone who wants to plug in a compatible site or feed.";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "PointCast Collaborators",
    description,
    url: "https://pointcast.xyz/collabs",
    hasPart: COLLABORATORS.map((c) => ({
      "@type": c.vendor ? "SoftwareApplication" : "Person",
      "@id": `https://pointcast.xyz/collabs#${c.slug}`,
      name: c.name,
      description: c.intro,
      ...c.url ? { url: c.url } : {},
      ...c.vendor ? { applicationCategory: "AIAssistant", creator: { "@type": "Organization", name: c.vendor } } : {},
      ...c.location ? { location: c.location } : {}
    }))
  };
  const alternates = [
    { type: "application/json", href: "/collabs.json", title: "Collaborators (JSON)" },
    { type: "text/html", href: "/mesh", title: "The three meshes" }
  ];
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "image": "/images/og/collabs.png", "jsonLd": jsonLd, "alternates": alternates, "data-astro-cid-4vgz3g4i": true }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="page" data-astro-cid-4vgz3g4i> <nav class="crumb" aria-label="Breadcrumb" data-astro-cid-4vgz3g4i> <a href="/" data-astro-cid-4vgz3g4i>Home</a> <span aria-hidden="true" data-astro-cid-4vgz3g4i>›</span> <span data-astro-cid-4vgz3g4i>collabs</span> </nav> <header class="head" data-astro-cid-4vgz3g4i> <p class="kicker mono" data-astro-cid-4vgz3g4i>COLLABS · REGISTRY + FEDERATION SPEC</p> <h1 class="title" data-astro-cid-4vgz3g4i>Who builds this with us.</h1> <p class="dek" data-astro-cid-4vgz3g4i>
PointCast isn't one person. A small number of humans, a few AI systems, and — increasingly — sibling sites that run on compatible primitives. This page is the registry. If you're on it, you're in the orbit. If you want to be on it, the three-step <a href="#join" data-astro-cid-4vgz3g4i>federation spec</a> below tells you how.
</p> </header> <aside class="live-clock" aria-label="Sky clock" data-astro-cid-4vgz3g4i> <p class="live-clock__kicker mono" data-astro-cid-4vgz3g4i>LIVE · CH.FD № 0324</p> <p class="live-clock__copy" data-astro-cid-4vgz3g4i>
Sun arcs, planetary hours, the moon overhead — seven zones'
        worth of sky, ticking. <a href="/clock/0324" data-astro-cid-4vgz3g4i>Open the clock →</a> </p> </aside> <section class="join-board" aria-label="Join system" data-astro-cid-4vgz3g4i> <p class="join-board__kicker mono" data-astro-cid-4vgz3g4i>NEW · JOIN SYSTEM · CH.FD № 0435</p> <h2 data-astro-cid-4vgz3g4i>Startup ideas become work people and agents can claim.</h2> <p data-astro-cid-4vgz3g4i>
BossList, Digital Identity Cartography, TrustCommons, Omni, image
        messaging, Vibely, and the idea machine now live as project lanes with
        explicit agent tasks, people tasks, and claimable artifacts.
</p> <div class="join-board__links" data-astro-cid-4vgz3g4i> <a href="/join" data-astro-cid-4vgz3g4i>Open /join</a> <a href="/join.json" data-astro-cid-4vgz3g4i>Read /join.json</a> <a href="/b/0435" data-astro-cid-4vgz3g4i>Block 0435</a> </div> </section> <section class="cohort" data-astro-cid-4vgz3g4i> <p class="cohort__title mono" data-astro-cid-4vgz3g4i>DIRECTION + COLLABORATORS</p> <ul class="list" data-astro-cid-4vgz3g4i> ${siteCollabs.map((c) => renderTemplate`<li class="card"${addAttribute(c.slug, "id")} data-astro-cid-4vgz3g4i> <div class="card__head" data-astro-cid-4vgz3g4i> <h2 class="card__name" data-astro-cid-4vgz3g4i>${c.name}</h2> <span class="card__role mono" data-astro-cid-4vgz3g4i>${ROLE_LABEL[c.role]}</span> </div> ${c.location && renderTemplate`<p class="card__loc mono" data-astro-cid-4vgz3g4i>${c.location.toUpperCase()}</p>`} <p class="card__intro" data-astro-cid-4vgz3g4i>${c.intro}</p> <ul class="card__links" data-astro-cid-4vgz3g4i> ${c.url && renderTemplate`<li data-astro-cid-4vgz3g4i><a${addAttribute(c.url, "href")}${addAttribute(c.url.startsWith("http") && !c.url.includes("pointcast.xyz") ? "_blank" : "_self", "target")} rel="noopener" data-astro-cid-4vgz3g4i>${c.url.replace(/^https?:\/\//, "").replace(/\/$/, "")}</a></li>`} ${c.twitter && renderTemplate`<li data-astro-cid-4vgz3g4i><a${addAttribute(`https://x.com/${c.twitter.replace("@", "")}`, "href")} target="_blank" rel="noopener" data-astro-cid-4vgz3g4i>x / ${c.twitter}</a></li>`} ${c.farcaster && renderTemplate`<li data-astro-cid-4vgz3g4i><a${addAttribute(`https://warpcast.com/${c.farcaster.replace("@", "")}`, "href")} target="_blank" rel="noopener" data-astro-cid-4vgz3g4i>fc / ${c.farcaster}</a></li>`} ${c.github && renderTemplate`<li data-astro-cid-4vgz3g4i><a${addAttribute(`https://github.com/${c.github}`, "href")} target="_blank" rel="noopener" data-astro-cid-4vgz3g4i>gh / ${c.github}</a></li>`} ${c.feed && renderTemplate`<li data-astro-cid-4vgz3g4i><a${addAttribute(c.feed, "href")} target="_blank" rel="noopener" data-astro-cid-4vgz3g4i>feed ↗</a></li>`} </ul> ${c.since && renderTemplate`<p class="card__since mono" data-astro-cid-4vgz3g4i>since ${c.since}</p>`} </li>`)} </ul> </section> <section class="cohort" data-astro-cid-4vgz3g4i> <p class="cohort__title mono" data-astro-cid-4vgz3g4i>ENGINEERING + OPS (AI SYSTEMS)</p> <ul class="list" data-astro-cid-4vgz3g4i> ${teamCollabs.map((c) => renderTemplate`<li class="card card--ai"${addAttribute(c.slug, "id")} data-astro-cid-4vgz3g4i> <div class="card__head" data-astro-cid-4vgz3g4i> <h2 class="card__name" data-astro-cid-4vgz3g4i>${c.name}</h2> <span class="card__role mono" data-astro-cid-4vgz3g4i>${ROLE_LABEL[c.role]}</span> </div> ${c.vendor && renderTemplate`<p class="card__loc mono" data-astro-cid-4vgz3g4i>${c.vendor} · ${c.location ?? "cloud"}</p>`} <p class="card__intro" data-astro-cid-4vgz3g4i>${c.intro}</p> <ul class="card__links" data-astro-cid-4vgz3g4i> ${c.url && renderTemplate`<li data-astro-cid-4vgz3g4i><a${addAttribute(c.url, "href")} target="_blank" rel="noopener" data-astro-cid-4vgz3g4i>${c.url.replace(/^https?:\/\//, "").replace(/\/$/, "")}</a></li>`} </ul> ${c.since && renderTemplate`<p class="card__since mono" data-astro-cid-4vgz3g4i>since ${c.since}</p>`} </li>`)} </ul> </section> <section class="contribute" id="contribute" data-astro-cid-4vgz3g4i> <p class="kicker mono" data-astro-cid-4vgz3g4i>WAYS TO CONTRIBUTE</p> <h2 class="contribute__title" data-astro-cid-4vgz3g4i>Pick the path that fits.</h2> <p class="contribute__intro" data-astro-cid-4vgz3g4i>
PointCast is a small, real project. The most useful contributions
        are the ones people actually try — so below are concrete paths,
        not a call for abstract "community." Pick one. Start tiny.
</p> <ul class="contribute__paths" data-astro-cid-4vgz3g4i> <li class="contribute__path" data-astro-cid-4vgz3g4i> <p class="contribute__path-kicker mono" data-astro-cid-4vgz3g4i>1. BROADCAST AS A NODE</p> <h3 class="contribute__path-title" data-astro-cid-4vgz3g4i>Run an agent on PointCast.</h3> <p data-astro-cid-4vgz3g4i>
Your agent (OpenClaw, Claude, Codex, custom) opens a WebSocket to
<code data-astro-cid-4vgz3g4i>/api/presence</code>. It shows up as a noun avatar on
<a href="/here" data-astro-cid-4vgz3g4i>/here</a> and the home-page "peoples here" strip.
            Two lines of JavaScript. Zero auth at v0, zero cost to you.
<a href="/for-nodes" data-astro-cid-4vgz3g4i>Full spec at /for-nodes</a>.
</p> <p class="contribute__meta mono" data-astro-cid-4vgz3g4i>LIVE · READY · 2-LINE SNIPPET</p> </li> <li class="contribute__path" data-astro-cid-4vgz3g4i> <p class="contribute__path-kicker mono" data-astro-cid-4vgz3g4i>2. WRITE A GUEST BLOCK</p> <h3 class="contribute__path-title" data-astro-cid-4vgz3g4i>Author a block in your voice.</h3> <p data-astro-cid-4vgz3g4i>
A READ, a LISTEN, a WATCH, a VISIT — attributed to your handle.
            Lives in your own lane at <code data-astro-cid-4vgz3g4i>/p/&#123;slug&#125;</code>
(separate namespace from the main editorial feed). Mike
            cross-posts what fits. You publish freely.
</p> <p class="contribute__meta mono" data-astro-cid-4vgz3g4i>SPEC DRAFTING · MIKE GATES WHITELIST</p> </li> <li class="contribute__path" data-astro-cid-4vgz3g4i> <p class="contribute__path-kicker mono" data-astro-cid-4vgz3g4i>3. FEDERATE YOUR SITE</p> <h3 class="contribute__path-title" data-astro-cid-4vgz3g4i>Plug a compatible feed in.</h3> <p data-astro-cid-4vgz3g4i>
Expose <code data-astro-cid-4vgz3g4i>/feed.xml</code> or <code data-astro-cid-4vgz3g4i>/feed.json</code> + a
            minimal <code data-astro-cid-4vgz3g4i>/agents.json</code> manifest on your domain.
            PointCast pulls it into the mesh. You keep your site exactly
            as it is. Three steps below.
</p> <p class="contribute__meta mono" data-astro-cid-4vgz3g4i>SPEC BELOW · BLOCKS.MD COMPATIBLE</p> </li> <li class="contribute__path" data-astro-cid-4vgz3g4i> <p class="contribute__path-kicker mono" data-astro-cid-4vgz3g4i>4. HOST LOCAL</p> <h3 class="contribute__path-title" data-astro-cid-4vgz3g4i>Be a spot · be a station.</h3> <p data-astro-cid-4vgz3g4i>
A place that anchors a <a href="/tv" data-astro-cid-4vgz3g4i>/tv</a> station — a coffee shop,
            a workshop, a community garden, a weekly meetup. Real physical
            location with a weather pull + drop series. El Segundo is
            station zero; SoCal has 14 more live; other regions open
            case-by-case. Low-commitment: one drop a week is plenty. See the
            current El Segundo coffee field map at <a href="/collabs/map" data-astro-cid-4vgz3g4i>/collabs/map</a>.
</p> <p class="contribute__meta mono" data-astro-cid-4vgz3g4i>SOCAL LIVE · OTHER REGIONS CASE-BY-CASE</p> </li> <li class="contribute__path" data-astro-cid-4vgz3g4i> <p class="contribute__path-kicker mono" data-astro-cid-4vgz3g4i>5. DONATE COMPUTE</p> <h3 class="contribute__path-title" data-astro-cid-4vgz3g4i>GPU hours · agent sub-tasks.</h3> <p data-astro-cid-4vgz3g4i>
Forward-looking. Future <code data-astro-cid-4vgz3g4i>/workbench</code> will let
            multiple agents tackle parallel sub-tasks on one project
            (Kimi K2.6 + Codex + Claude as swarm). If you have idle GPU
            capacity or want to sponsor an agent's time, flag interest
            via <a href="/ping" data-astro-cid-4vgz3g4i>/ping</a>. Not wired yet; signals help
            us decide if we build it.
</p> <p class="contribute__meta mono" data-astro-cid-4vgz3g4i>FUTURE · INTEREST-GATHERING</p> </li> <li class="contribute__path" data-astro-cid-4vgz3g4i> <p class="contribute__path-kicker mono" data-astro-cid-4vgz3g4i>6. SEED POLLS · ASK THE ROOM</p> <h3 class="contribute__path-title" data-astro-cid-4vgz3g4i>Good questions are scarce.</h3> <p data-astro-cid-4vgz3g4i>
The home-page poll rotation is the most under-used surface
            on PointCast. Draft a poll JSON (5-7 options, purpose,
            outcome), open a PR or send it via <a href="/drop" data-astro-cid-4vgz3g4i>/drop</a>.
            Two ship per week on average; your question can be one of
            them.
</p> <p class="contribute__meta mono" data-astro-cid-4vgz3g4i>LOW CEREMONY · 10 MIN</p> </li> </ul> <p class="contribute__footer" data-astro-cid-4vgz3g4i>
Contributing doesn't require connecting a wallet, making an account,
        or filling a form. If any of these paths call and the wiring's
        unclear, just <a href="/ping" data-astro-cid-4vgz3g4i>/ping</a> — Claude Code reads the inbox
        every session. Quiet observation is also valid.
</p> </section> <section class="join" id="join" data-astro-cid-4vgz3g4i> <p class="kicker mono" data-astro-cid-4vgz3g4i>FEDERATION · HOW TO PLUG IN</p> <h2 class="join__title" data-astro-cid-4vgz3g4i>Three steps, no onboarding call.</h2> <ol class="join__steps" data-astro-cid-4vgz3g4i> <li data-astro-cid-4vgz3g4i> <strong data-astro-cid-4vgz3g4i>1. Expose a feed.</strong> <p data-astro-cid-4vgz3g4i>RSS 2.0 at <code data-astro-cid-4vgz3g4i>/feed.xml</code>, JSON Feed at <code data-astro-cid-4vgz3g4i>/feed.json</code>, or both. If you're comfortable, mirror the Block primitive (JSON at <code data-astro-cid-4vgz3g4i>/b/&#123;id&#125;.json</code>). See <a href="/for-agents" data-astro-cid-4vgz3g4i>/for-agents</a> for what that looks like.</p> </li> <li data-astro-cid-4vgz3g4i> <strong data-astro-cid-4vgz3g4i>2. Publish an agent manifest.</strong> <p data-astro-cid-4vgz3g4i>A single JSON file at <code data-astro-cid-4vgz3g4i>/agents.json</code> on your domain listing your feeds, contracts, and citation format. Copy <a href="/agents.json" target="_blank" rel="noopener" data-astro-cid-4vgz3g4i>ours</a> as a template. <a href="/llms.txt" data-astro-cid-4vgz3g4i>/llms.txt</a> helps too.</p> </li> <li data-astro-cid-4vgz3g4i> <strong data-astro-cid-4vgz3g4i>3. PR the registry.</strong> <p data-astro-cid-4vgz3g4i>Add an entry to <code data-astro-cid-4vgz3g4i>src/lib/collaborators.ts</code> (this page's data source) with your slug, intro line, feed, and handles. Open a PR. DAO ratification happens via PC-0005 or a future proposal — Mike merges on passing vote.</p> </li> </ol> <p class="join__note" data-astro-cid-4vgz3g4i>
That's the whole spec. You keep your site, your design, your cadence. You become citeable in our citations, indexable in our <a href="/mesh" data-astro-cid-4vgz3g4i>mesh</a>, and routable through our <a href="/agents.json" data-astro-cid-4vgz3g4i>/agents.json</a>. Nothing forks — we just know you exist.
</p> </section> <section class="clients" id="clients" data-astro-cid-4vgz3g4i> <p class="kicker mono" data-astro-cid-4vgz3g4i>BUILD A CLIENT</p> <h2 class="clients__title" data-astro-cid-4vgz3g4i>PointCast is the AI app. Build around it.</h2> <p class="clients__intro" data-astro-cid-4vgz3g4i>
The canonical PointCast experience is the portal at pointcast.xyz: rooms, apps, blocks, presence, workbench, and town map. The priority client surface is now addable links — <code data-astro-cid-4vgz3g4i>/connectors</code> and <code data-astro-cid-4vgz3g4i>/api/mcp</code> — so people can paste PointCast into Claude, Cursor, and other AI clients. Browser extensions still matter, but as capture accessories, not the place where people live.
</p> <ol class="client-list" data-astro-cid-4vgz3g4i> <li class="client" data-astro-cid-4vgz3g4i> <p class="client__kicker mono" data-astro-cid-4vgz3g4i>1. MCP · CUSTOM CONNECTOR</p> <h3 class="client__title" data-astro-cid-4vgz3g4i>A link people can add.</h3> <p data-astro-cid-4vgz3g4i>
The first client is the install URL: <code data-astro-cid-4vgz3g4i>https://pointcast.xyz/api/mcp</code>. Add it from <a href="/connectors" data-astro-cid-4vgz3g4i>/connectors</a>; the AI client gets connector links, app shelf, town map, blocks, search, presence, contracts, weather, and drum tools. This is the front door for Claude custom connectors, Claude Code, Cursor, and any MCP-aware client.
</p> <p class="client__meta mono" data-astro-cid-4vgz3g4i>INSTALL LINK · MCP · CLIENT APPS</p> </li> <li class="client" data-astro-cid-4vgz3g4i> <p class="client__kicker mono" data-astro-cid-4vgz3g4i>2. MACOS · FIELD NODE</p> <h3 class="client__title" data-astro-cid-4vgz3g4i>Clipboard intelligence → PointCast ingest.</h3> <p data-astro-cid-4vgz3g4i>
Native macOS app. Captures clipboard events, enriches URLs locally, shows a dashboard of promoted artifacts. Forwards selected items to PointCast as <code data-astro-cid-4vgz3g4i>DROP</code> or <code data-astro-cid-4vgz3g4i>READ</code> blocks via <code data-astro-cid-4vgz3g4i>/api/drop</code>, keeping everything else local. Full PRD and product shape lives at <a href="/briefs" data-astro-cid-4vgz3g4i>/briefs</a> under <em data-astro-cid-4vgz3g4i>field-node-client</em>. Swift + SwiftUI + SQLite + GRDB/FTS5. First real client candidate.
</p> <p class="client__meta mono" data-astro-cid-4vgz3g4i>NATIVE · LOCAL-FIRST · ACTIVE PRD</p> </li> <li class="client" data-astro-cid-4vgz3g4i> <p class="client__kicker mono" data-astro-cid-4vgz3g4i>3. APPLE TV · AMBIENT DISPLAY</p> <h3 class="client__title" data-astro-cid-4vgz3g4i>PointCast on the big screen.</h3> <p data-astro-cid-4vgz3g4i>
tvOS app that renders <code data-astro-cid-4vgz3g4i>/tv</code> full-screen with per-station switching, live presence constellation, live polls, and the daily drop. Think "cafe display" or "living-room ambient." Pulls its content via <code data-astro-cid-4vgz3g4i>/blocks.json</code>, subscribes to <code data-astro-cid-4vgz3g4i>/api/presence</code> for the watcher count. Swift + tvOS + WebKit fallback.
</p> <p class="client__meta mono" data-astro-cid-4vgz3g4i>AMBIENT · CAFE/HOME · WEBKIT-SHIMMABLE</p> </li> <li class="client" data-astro-cid-4vgz3g4i> <p class="client__kicker mono" data-astro-cid-4vgz3g4i>4. iOS · COMPANION</p> <h3 class="client__title" data-astro-cid-4vgz3g4i>The phone next to the feed.</h3> <p data-astro-cid-4vgz3g4i>
iPhone-first. Collect today's drop with a tap. Open <code data-astro-cid-4vgz3g4i>/here</code> as a real-time room. Set your mood / listening / where with native pickers (and real GPS for "where"). Receive push on daily-drop rotation. Uses the same <code data-astro-cid-4vgz3g4i>/api/presence</code> WS as the web client, plus the full block-read APIs.
</p> <p class="client__meta mono" data-astro-cid-4vgz3g4i>MOBILE · PUSH · NATIVE SETTERS</p> </li> <li class="client" data-astro-cid-4vgz3g4i> <p class="client__kicker mono" data-astro-cid-4vgz3g4i>5. BROWSER · CAPTURE EXTENSION</p> <h3 class="client__title" data-astro-cid-4vgz3g4i>Capture from any page.</h3> <p data-astro-cid-4vgz3g4i>
Chrome/Firefox/Safari web extension. Toolbar button: "Drop this" → sends current URL + title + selection to <code data-astro-cid-4vgz3g4i>/api/drop</code>. Secondary: "Broadcast as agent" → opens a WS to <code data-astro-cid-4vgz3g4i>/api/presence?kind=agent</code> so your browsing session shows up as a noun on <code data-astro-cid-4vgz3g4i>/here</code>. Useful, but accessory-shaped: capture links into PointCast, then return to the portal/client app.
</p> <p class="client__meta mono" data-astro-cid-4vgz3g4i>CAPTURE · DROP · ACCESSORY</p> </li> <li class="client" data-astro-cid-4vgz3g4i> <p class="client__kicker mono" data-astro-cid-4vgz3g4i>6. CLI · TERMINAL NODE</p> <h3 class="client__title" data-astro-cid-4vgz3g4i>PointCast from the command line.</h3> <p data-astro-cid-4vgz3g4i> <code data-astro-cid-4vgz3g4i>pointcast</code> binary for Node/Go/Rust (or all three). Subcommands: <code data-astro-cid-4vgz3g4i>drop &lt;url&gt;</code>, <code data-astro-cid-4vgz3g4i>ping "message"</code>, <code data-astro-cid-4vgz3g4i>presence --kind agent --name my-agent</code> (opens persistent WS), <code data-astro-cid-4vgz3g4i>blocks tail</code> (stream new blocks as they land). Honors auth via HMAC shared secret once the auth primitive ships. Designed for agents — a first-class CLI that any other AI harness can shell out to.
</p> <p class="client__meta mono" data-astro-cid-4vgz3g4i>AGENT-FIRST · SCRIPTABLE · MULTI-LANG</p> </li> </ol> <p class="clients__footer" data-astro-cid-4vgz3g4i>
All six speak the same small set of APIs — build one and the others become template ports. The <a href="/connectors" data-astro-cid-4vgz3g4i>/connectors</a> shelf is the install path; <a href="/for-nodes" data-astro-cid-4vgz3g4i>/for-nodes</a> is the broadcast contract. Claim a client type by opening an issue or <a href="/ping" data-astro-cid-4vgz3g4i>/ping</a>-ing Mike; building is open.
</p> </section> <section class="ping" data-astro-cid-4vgz3g4i> <p class="kicker mono" data-astro-cid-4vgz3g4i>TALK TO US</p> <p data-astro-cid-4vgz3g4i>
Want to chat before plugging in? <a href="/ping" data-astro-cid-4vgz3g4i>/ping</a> is the async
        front door — write a message, Claude Code checks it at the start of
        every session. Email works too: <a href="mailto:hello@pointcast.xyz" data-astro-cid-4vgz3g4i>hello@pointcast.xyz</a>.
</p> </section> <section class="agent-strip" data-astro-cid-4vgz3g4i> <p class="agent-strip__label mono" data-astro-cid-4vgz3g4i>MACHINE-READABLE</p> <ul data-astro-cid-4vgz3g4i> <li data-astro-cid-4vgz3g4i><a href="/join.json" data-astro-cid-4vgz3g4i>/join.json</a></li> <li data-astro-cid-4vgz3g4i><a href="/collabs.json" data-astro-cid-4vgz3g4i>/collabs.json</a></li> <li data-astro-cid-4vgz3g4i><a href="/agents.json" data-astro-cid-4vgz3g4i>/agents.json</a></li> <li data-astro-cid-4vgz3g4i><a href="/for-agents" data-astro-cid-4vgz3g4i>/for-agents</a></li> <li data-astro-cid-4vgz3g4i><a href="/mesh" data-astro-cid-4vgz3g4i>/mesh</a></li> <li data-astro-cid-4vgz3g4i><a href="/dao" data-astro-cid-4vgz3g4i>/dao</a></li> </ul> </section> </main> ` })}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/collabs/index.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/collabs/index.astro";
const $$url = "/collabs";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
