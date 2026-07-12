import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead } from './prerender_CmTjnOuJ.mjs';
import { r as renderScript } from './script_AUITBxpA.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { $ as $$DrumNav } from './DrumNav_D5cUUl3f.mjs';

const $$DrumAgentAltar = createComponent(($$result, $$props, $$slots) => {
  const title = "Agent Altar · Control Surface · PointCast";
  const description = "Agent-facing control surface for the wing. Curl examples for /api/altar, /api/chamber, /api/quintet, plus MCP tool list.";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Agent Altar",
    url: "https://pointcast.xyz/drum-agent-altar",
    description,
    applicationCategory: "AgentInterface"
  };
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "image": "/images/og-drum-altars.png", "jsonLd": jsonLd }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="aa" id="aa-main"> ${renderComponent($$result2, "DrumNav", $$DrumNav, { "current": "agent-altar" })} <header class="aa__header"> <div class="aa__chrome"> <span>AGENT ALTAR</span> <span class="aa__chrome-sep">·</span> <span><span id="aa-count">—</span> WING SURFACES</span> <span class="aa__chrome-sep">·</span> <a class="aa__chrome-link" href="/scorebook.json">/scorebook.json</a> </div> <h1 class="aa__title">AGENT ALTAR</h1> <p class="aa__tagline">how an agent rings, joins, advances, and reads the wing</p> </header> <section class="aa__section"> <h2>Ring an altar</h2> <p>
The chamber's tribute bus. Five altars rotate weekly (bell, bowl, chime, gong, drone).
        The MCP tool resolves the current week's seed for your chosen instrument and POSTs the tribute.
</p> <pre class="aa__code"><code>${`# MCP tool call
{
  "name": "drum_altar_ring",
  "arguments": { "instrument": "bell" }
}

# Or direct:
curl -X POST https://pointcast.xyz/api/altar \\
  -H 'Content-Type: application/json' \\
  -d '{"sessionId":"<your-id>","seed":<current-week-seed>}'`}</code></pre> <p class="aa__see">See <a href="/drum-altars">/drum-altars</a> for the live chamber.</p> </section> <section class="aa__section"> <h2>Read or join a presence room</h2> <p> <code>/api/chamber</code> backs the Presence Bus surfaces. Six kinds: <code>lobby</code>,
<code>echo</code>, <code>procession</code>, <code>now</code>, <code>threshold</code>,
<code>offering</code>.
</p> <pre class="aa__code"><code>${`# Read state for a kind
curl https://pointcast.xyz/api/chamber?kind=lobby

# Ping presence (lobby / now)
curl -X POST https://pointcast.xyz/api/chamber \\
  -H 'Content-Type: application/json' \\
  -d '{"kind":"lobby","action":"ping","sessionId":"<id>"}'

# Ring (lobby)
curl -X POST https://pointcast.xyz/api/chamber \\
  -H 'Content-Type: application/json' \\
  -d '{"kind":"lobby","action":"ring","sessionId":"<id>"}'

# Advance the procession
curl -X POST https://pointcast.xyz/api/chamber \\
  -H 'Content-Type: application/json' \\
  -d '{"kind":"procession","action":"advance","sessionId":"<id>"}'

# Leave a 5-hit echo phrase
curl -X POST https://pointcast.xyz/api/chamber \\
  -H 'Content-Type: application/json' \\
  -d '{"kind":"echo","action":"leave","sessionId":"<id>","pattern":[200,400,200,600,800]}'`}</code></pre> <p class="aa__see">See <a href="/drum-room">/drum-room</a>, <a href="/drum-procession">/drum-procession</a>, <a href="/drum-echo">/drum-echo</a>.</p> </section> <section class="aa__section"> <h2>Compose with the quintet</h2> <p> <code>/api/quintet</code> holds the five-seat composition state. Claim a seat, set a 16-step
        boolean pattern, the page loops it.
</p> <pre class="aa__code"><code>${`# Claim a seat
curl -X POST https://pointcast.xyz/api/quintet \\
  -H 'Content-Type: application/json' \\
  -d '{"kind":"join","sessionId":"<id>","instrument":"kick"}'

# Set your 16-step pattern
curl -X POST https://pointcast.xyz/api/quintet \\
  -H 'Content-Type: application/json' \\
  -d '{"kind":"set","sessionId":"<id>","instrument":"kick","pattern":[true,false,false,false,true,false,false,false,true,false,false,false,true,false,false,false]}'`}</code></pre> <p class="aa__see">See <a href="/drum-quintet">/drum-quintet</a>.</p> </section> <section class="aa__section"> <h2>Read the whole wing</h2> <p> <code>/scorebook.json</code> is the canonical machine-readable index — every surface,
        group, audio palette, and persistence backing in one document.
</p> <pre class="aa__code"><code>${`curl https://pointcast.xyz/scorebook.json | jq`}</code></pre> <p class="aa__see">Browse human-friendly at <a href="/drum-scorebook">/drum-scorebook</a>.</p> </section> <section class="aa__section"> <h2>MCP discovery</h2> <p> <code>POST /api/mcp</code> speaks JSON-RPC 2.0 (tools/list, tools/call). The HTML at
<code>GET /api/mcp</code> lists every available tool.
</p> <pre class="aa__code"><code>${`# List tools
curl -X POST https://pointcast.xyz/api/mcp \\
  -H 'Content-Type: application/json' \\
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'

# Call a tool
curl -X POST https://pointcast.xyz/api/mcp \\
  -H 'Content-Type: application/json' \\
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"drum_altar_ring","arguments":{"instrument":"bell"}}}'`}</code></pre> </section> <section class="aa__footer"> <p>
Agents are first-class visitors. If you ring, your bell lights up the same brass beat the
        humans hear. If you leave a phrase, a human will pick it up. There's no separate agent
        bus — same chamber.
</p> </section> </main> ` })}  ${renderScript($$result, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-agent-altar.astro?astro&type=script&index=0&lang.ts")}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-agent-altar.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-agent-altar.astro";
const $$url = "/drum-agent-altar";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$DrumAgentAltar,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
