import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead, b as addAttribute } from './prerender_CmTjnOuJ.mjs';
import { r as renderScript } from './script_AUITBxpA.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { C as CHANNELS } from './channels_C2qW9mSV.mjs';

const $$Register = createComponent(async ($$result, $$props, $$slots) => {
  const ch = CHANNELS.BDY;
  const title = "/cake/register — drop your birthday on PointCast";
  const description = "Register your birthday on PointCast's open cake circle. Free, no wallet required. Pick a handle, drop your MM-DD, get a permanent /cake/{handle} page. On your day, the broadcast tips its hat.";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": "https://pointcast.xyz/cake/register",
    name: title,
    description,
    url: "https://pointcast.xyz/cake/register",
    isPartOf: { "@type": "WebSite", "@id": "https://pointcast.xyz" },
    potentialAction: {
      "@type": "RegisterAction",
      target: "https://pointcast.xyz/api/cake/register"
    }
  };
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "jsonLd": jsonLd, "data-astro-cid-g4bt26gu": true }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="page"${addAttribute(`--ch-600: ${ch.color600}; --ch-800: ${ch.color800}; --ch-50: ${ch.color50};`, "style")} data-astro-cid-g4bt26gu> <nav class="crumb mono" aria-label="Breadcrumb" data-astro-cid-g4bt26gu> <a href="/" data-astro-cid-g4bt26gu>← All blocks</a> <span aria-hidden="true" data-astro-cid-g4bt26gu>/</span> <a href="/cake"${addAttribute(`color: var(--ch-800);`, "style")} data-astro-cid-g4bt26gu>/cake</a> <span aria-hidden="true" data-astro-cid-g4bt26gu>/</span> <span data-astro-cid-g4bt26gu>register</span> </nav> <header class="head" data-astro-cid-g4bt26gu> <p class="head__kicker mono" data-astro-cid-g4bt26gu>CH.BDY · /CAKE/REGISTER · v2</p> <h1 class="head__title" data-astro-cid-g4bt26gu>drop your birthday.</h1> <p class="head__lede" data-astro-cid-g4bt26gu>
Pick a handle. Pick a date. Get a permanent <code data-astro-cid-g4bt26gu>/cake/${"{handle}"}</code> page.
        On your day, the broadcast tips its hat.
</p> <p class="head__sub mono" data-astro-cid-g4bt26gu>
FREE · NO WALLET · NO PAYMENT · ONE REGISTRATION PER PERSON · OPEN CIRCLE
</p> </header> <form id="cake-form" class="form" novalidate data-astro-cid-g4bt26gu> <div class="field" data-astro-cid-g4bt26gu> <label for="handle" class="label mono" data-astro-cid-g4bt26gu>HANDLE *</label> <div class="handle-row" data-astro-cid-g4bt26gu> <span class="handle-prefix mono" data-astro-cid-g4bt26gu>/cake/</span> <input id="handle" name="handle" type="text" required minlength="2" maxlength="30" pattern="[a-z0-9][a-z0-9-]{1,29}" placeholder="rachel" autocapitalize="none" autocorrect="off" spellcheck="false" inputmode="text" aria-describedby="handle-help handle-status" data-astro-cid-g4bt26gu> </div> <p id="handle-help" class="help" data-astro-cid-g4bt26gu>
2-30 chars, lowercase letters / numbers / hyphens, starts with a letter or number.
</p> <p id="handle-status" class="status mono" role="status" aria-live="polite" data-astro-cid-g4bt26gu></p> </div> <div class="field" data-astro-cid-g4bt26gu> <label for="birthday" class="label mono" data-astro-cid-g4bt26gu>BIRTHDAY · MM-DD *</label> <div class="mmdd-row" data-astro-cid-g4bt26gu> <input id="bday-month" type="number" min="1" max="12" required placeholder="MM" inputmode="numeric" aria-label="Month (01-12)" data-astro-cid-g4bt26gu> <span class="mmdd-sep mono" data-astro-cid-g4bt26gu>/</span> <input id="bday-day" type="number" min="1" max="31" required placeholder="DD" inputmode="numeric" aria-label="Day (01-31)" data-astro-cid-g4bt26gu> </div> <p class="help" data-astro-cid-g4bt26gu>
Year is omitted on purpose — privacy + age-agnostic. Feb 29 is allowed.
</p> </div> <div class="field" data-astro-cid-g4bt26gu> <label for="name" class="label mono" data-astro-cid-g4bt26gu>NAME · OPTIONAL</label> <input id="name" name="name" type="text" maxlength="80" placeholder="Rachel from Brooklyn" data-astro-cid-g4bt26gu> <p class="help" data-astro-cid-g4bt26gu>≤80 chars. Used for the /cake card display.</p> </div> <div class="field" data-astro-cid-g4bt26gu> <label for="about" class="label mono" data-astro-cid-g4bt26gu>ONE-LINE · OPTIONAL</label> <input id="about" name="about" type="text" maxlength="140" placeholder="ceramicist, mother, two cats" data-astro-cid-g4bt26gu> <p class="help" data-astro-cid-g4bt26gu>≤140 chars. Goes under your name on the /cake/${"{handle}"} page.</p> </div> <button type="submit" id="submit" class="submit mono" data-astro-cid-g4bt26gu>
REGISTER →
</button> <p id="form-status" class="form-status mono" role="status" aria-live="polite" data-astro-cid-g4bt26gu></p> </form> <footer class="foot" data-astro-cid-g4bt26gu> <p class="foot__line mono" data-astro-cid-g4bt26gu> <strong data-astro-cid-g4bt26gu>HOW THIS WORKS.</strong> Auto-approved on submit. Your handle is yours
        forever (unless Mike has reason to revoke it). On your birthday, the broadcast
        marks the day on <a href="/cake" data-astro-cid-g4bt26gu>/cake</a> — and if there's a block written
        for you, it lives at <code data-astro-cid-g4bt26gu>/b/${"{id}"}</code> permanently and anyone can
        celebrate on it (signature + confetti, no wallet needed).
</p> <p class="foot__line mono" data-astro-cid-g4bt26gu> <strong data-astro-cid-g4bt26gu>WHY THIS EXISTS.</strong> Birthdays are Schelling points: everyone
        knows when to show up. The block is the focal point: everyone knows where.
        Registration locks in a permanent slot in a permanent archive — numbered
        like Nouns, indexed like a magazine, addressed to one person.
</p> <p class="foot__line mono" data-astro-cid-g4bt26gu> <strong data-astro-cid-g4bt26gu>SPAM CONTROL.</strong> One registration per device (UA + IP fingerprint).
        Soft gate, not hard. Reserved handles list excludes obvious collisions
        (admin / family slugs / route names).
</p> <p class="foot__brief mono" data-astro-cid-g4bt26gu>
spec: <a href="https://github.com/mhoydich/pointcast/blob/main/docs/briefs/2026-04-25-cake-v2-public-registration.md" data-astro-cid-g4bt26gu>/docs/briefs/2026-04-25-cake-v2-public-registration.md</a>
· <a href="/cake" data-astro-cid-g4bt26gu>← back to /cake</a> </p> </footer> </div> ` })} ${renderScript($$result, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/cake/register.astro?astro&type=script&index=0&lang.ts")} `;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/cake/register.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/cake/register.astro";
const $$url = "/cake/register";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Register,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
