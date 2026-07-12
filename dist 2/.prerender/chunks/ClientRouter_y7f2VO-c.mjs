import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { b as addAttribute, a as renderTemplate } from './prerender_CmTjnOuJ.mjs';
import 'clsx';
import { r as renderScript } from './script_AUITBxpA.mjs';

const $$ClientRouter = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$ClientRouter;
  const { fallback = "animate" } = Astro2.props;
  return renderTemplate`<meta name="astro-view-transitions-enabled" content="true"><meta name="astro-view-transitions-fallback"${addAttribute(fallback, "content")}>${renderScript($$result, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/node_modules/astro/components/ClientRouter.astro?astro&type=script&index=0&lang.ts")}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/node_modules/astro/components/ClientRouter.astro", void 0);

export { $$ClientRouter as $ };
