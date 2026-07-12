import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead, b as addAttribute, c as renderSlot } from './prerender_CmTjnOuJ.mjs';
import { r as renderScript } from './script_AUITBxpA.mjs';
import { $ as $$BaseLayout } from './BaseLayout_DxT1W98p.mjs';

const $$PostLayout = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$PostLayout;
  const { title, description, date, type, image, tags = [] } = Astro2.props;
  const isDispatch = type === "newsletter";
  const proseClass = isDispatch ? "prose-dispatch" : "prose-editorial";
  const formattedDate = date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
  const typeLabel = {
    newsletter: "Dispatch",
    article: "Article",
    essay: "Essay",
    art: "Art"
  };
  return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": title, "description": description, "image": image }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<article class="article-root"${addAttribute(title, "aria-label")}> <div class="snap-container" id="snap-scroll"> <!-- Title card --> <section class="snap-card" aria-label="Article header"> <div class="max-w-[34rem] mx-auto w-full px-4"> <!-- Masthead --> <div class="flex items-center justify-between pb-3 border-b border-rule mb-4 font-mono text-[0.66rem] tracking-[0.18em] uppercase text-ink-soft"> <span>${title.length > 30 ? title.slice(0, 30) + "..." : title}</span> ${isDispatch && renderTemplate`<span class="pill"><span class="pill-dot"></span>Active</span>`} </div> <div class="kicker"> ${typeLabel[type] || "Post"} </div> <h1 class="font-serif text-[1.65rem] leading-[1.15] font-medium italic text-ink mb-3 tracking-tight"> ${title} </h1> <!-- Meta line --> <div class="meta-line mb-4"> <time${addAttribute(date.toISOString(), "datetime")}> ${formattedDate} </time> <span>MH ${isDispatch ? "× Opus 4.6" : "× Claude Cowork"}</span> </div> <p class="text-[0.95rem] text-ink-soft leading-relaxed mb-4"> ${description} </p> ${tags.length > 0 && renderTemplate`<div class="flex flex-wrap gap-2 mb-4" role="list" aria-label="Tags"> ${tags.map((tag) => renderTemplate`<span role="listitem" class="font-mono text-[0.6rem] tracking-[0.14em] uppercase text-ink-soft/50">
#${tag} </span>`)} </div>`} <!-- Mobile scroll hint --> <div class="mt-6 text-center md:hidden scroll-hint"> <span class="text-ink-soft/40 text-xs font-mono">swipe up</span> <div class="text-warm/30 text-lg mt-1">&darr;</div> </div> </div> </section> ${image && renderTemplate`<section class="snap-card" aria-label="Featured image"> <div class="max-w-[34rem] mx-auto w-full px-4"> <img${addAttribute(image, "src")}${addAttribute(title, "alt")} class="w-full rounded-lg border border-rule"> </div> </section>`} <!-- Content: split into snap cards by JS on mobile --> <div id="article-content"${addAttribute(`${proseClass} max-w-[34rem] mx-auto w-full px-4`, "class")}> ${renderSlot($$result2, $$slots["default"])} </div> <!-- Coda card --> <section class="snap-card" aria-label="Article footer"> <div class="max-w-[34rem] mx-auto w-full px-4 text-center"> <p class="editorial-close">
I offer no predictions. Only a careful description<br>
of today, so tomorrow feels less like a surprise.
</p> <div class="editorial-foot justify-center gap-6"> <span class="text-warm/40">&#x2310;&#x25A8;-&#x25A8;</span> <span>${formattedDate} &middot; PointCast</span> </div> <a href="/" class="inline-block mt-6 px-5 py-2 border border-rule text-ink-soft font-mono text-[0.66rem] tracking-[0.18em] uppercase rounded-md hover:border-warm hover:text-warm transition-colors">
&larr; Back to Feed
</a> </div> </section> </div> <!-- Progress dots (mobile only) --> <nav class="snap-progress" id="snap-dots" aria-label="Reading progress"></nav> </article> ` })} ${renderScript($$result, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/layouts/PostLayout.astro?astro&type=script&index=0&lang.ts")}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/layouts/PostLayout.astro", void 0);

export { $$PostLayout as $ };
