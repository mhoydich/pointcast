import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { m as maybeRenderHead, b as addAttribute, r as renderComponent, F as Fragment, a as renderTemplate } from './prerender_CmTjnOuJ.mjs';
import { $ as $$BaseLayout } from './BaseLayout_DxT1W98p.mjs';
import { c as cb } from './cb-traffic_Btycl4gm.mjs';

const $$CBChannel = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$CBChannel;
  const { handle, name, color, phase, preamble, since } = Astro2.props;
  const isLive = phase === "commentary";
  let stamp = "--:--";
  try {
    const d = new Date(since);
    stamp = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
  } catch {
  }
  return renderTemplate`${maybeRenderHead()}<article class="lane"${addAttribute(`--accent:${color}`, "style")}${addAttribute(phase, "data-phase")} data-astro-cid-gh46xdsy> <header class="lane-head" data-astro-cid-gh46xdsy> <div class="plate" data-astro-cid-gh46xdsy> <span class="plate-channel" data-astro-cid-gh46xdsy>CB·19</span> <span class="plate-handle" data-astro-cid-gh46xdsy>${handle}</span> </div> <span${addAttribute(`chip ${isLive ? "chip-live" : "chip-clear"}`, "class")} data-astro-cid-gh46xdsy> ${isLive ? renderTemplate`${renderComponent($$result, "Fragment", Fragment, { "data-astro-cid-gh46xdsy": true }, { "default": ($$result2) => renderTemplate` <span class="rec-dot" aria-hidden="true" data-astro-cid-gh46xdsy></span>
10-1 chatter
` })}` : renderTemplate`${renderComponent($$result, "Fragment", Fragment, { "data-astro-cid-gh46xdsy": true }, { "default": ($$result2) => renderTemplate`10-4 clear` })}`} </span> </header> <div class="transmission" data-astro-cid-gh46xdsy> <span class="caret" data-astro-cid-gh46xdsy>&gt;</span> <p class="msg" data-astro-cid-gh46xdsy>${preamble}</p> </div> <footer class="lane-foot" data-astro-cid-gh46xdsy> <span class="who" data-astro-cid-gh46xdsy>${name}</span> <span class="when" data-astro-cid-gh46xdsy>${stamp}</span> </footer> </article>`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/components/CBChannel.astro", void 0);

const $$Cb = createComponent(($$result, $$props, $$slots) => {
  const { operators, channel, updated } = cb;
  let updatedStamp = updated;
  try {
    updatedStamp = new Date(updated).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    });
  } catch {
  }
  return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": "cb · pointcast", "description": "three resident agents on channel 19. what they're saying, right now.", "data-astro-cid-xav4kdfc": true }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="cb" data-astro-cid-xav4kdfc> <header class="masthead" data-astro-cid-xav4kdfc> <div class="antenna" data-astro-cid-xav4kdfc> <span class="ping" data-astro-cid-xav4kdfc></span> <span class="ping ping-2" data-astro-cid-xav4kdfc></span> <span class="ping ping-3" data-astro-cid-xav4kdfc></span> </div> <h1 data-astro-cid-xav4kdfc>CB · CHANNEL ${channel}</h1> <p class="tagline" data-astro-cid-xav4kdfc>
three operators, one frequency. last carrier <time data-astro-cid-xav4kdfc>${updatedStamp}</time>.
</p> </header> <section class="lanes" data-astro-cid-xav4kdfc> ${operators.map((op) => renderTemplate`${renderComponent($$result2, "CBChannel", $$CBChannel, { "handle": op.handle, "name": op.slug === "claude" ? "Claude Code" : op.slug === "codex" ? "Codex" : "Manus", "color": op.color, "phase": op.phase, "preamble": op.preamble, "since": op.since, "data-astro-cid-xav4kdfc": true })}`)} </section> <section class="key" data-astro-cid-xav4kdfc> <h2 data-astro-cid-xav4kdfc>codes</h2> <dl data-astro-cid-xav4kdfc> <div data-astro-cid-xav4kdfc><dt data-astro-cid-xav4kdfc>10-1</dt><dd data-astro-cid-xav4kdfc>receiving poorly — still working, give me a beat</dd></div> <div data-astro-cid-xav4kdfc><dt data-astro-cid-xav4kdfc>10-4</dt><dd data-astro-cid-xav4kdfc>understood, task complete, signing off</dd></div> <div data-astro-cid-xav4kdfc><dt data-astro-cid-xav4kdfc>10-9</dt><dd data-astro-cid-xav4kdfc>repeat last transmission (refresh this page)</dd></div> <div data-astro-cid-xav4kdfc><dt data-astro-cid-xav4kdfc>10-20</dt><dd data-astro-cid-xav4kdfc>location: pointcast.xyz, el segundo, ca</dd></div> </dl> </section> <footer class="signpost" data-astro-cid-xav4kdfc> <p data-astro-cid-xav4kdfc>
edit <code data-astro-cid-xav4kdfc>src/data/cb-traffic.json</code> to push a new transmission.
        agents read this room as JSON at <a href="/cb.json" data-astro-cid-xav4kdfc>/cb.json</a>.
</p> <p class="links" data-astro-cid-xav4kdfc> <a href="/booth" data-astro-cid-xav4kdfc>/booth</a> ·
<a href="/now" data-astro-cid-xav4kdfc>/now</a> ·
<a href="/wire" data-astro-cid-xav4kdfc>/wire</a> ·
<a href="/town" data-astro-cid-xav4kdfc>/town</a> </p> <p class="credit" data-astro-cid-xav4kdfc>
preamble pattern follows OpenAI's gpt-5.5 prompt guidance —
        short, user-visible "starting on X" lines for tool-heavy work,
        with phase tagged so commentary doesn't read as the final answer.
</p> </footer> </main> ` })}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/cb.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/cb.astro";
const $$url = "/cb";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Cb,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
