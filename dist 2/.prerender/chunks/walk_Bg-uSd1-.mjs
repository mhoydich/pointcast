import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate } from './prerender_CmTjnOuJ.mjs';
import { $ as $$PlayLayerSurface } from './PlayLayerSurface_DWV7rmUo.mjs';

const $$Walk = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "PlayLayerSurface", $$PlayLayerSurface, { "focus": "walk" })}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/walk.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/walk.astro";
const $$url = "/walk";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	default: $$Walk,
	file: $$file,
	url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
