import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead } from './prerender_CmTjnOuJ.mjs';
import { r as renderScript } from './script_AUITBxpA.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';

const $$Card = createComponent(async ($$result, $$props, $$slots) => {
  const title = "/card — send a birthday card via URL";
  const description = "Type a name, get a shareable URL. The URL IS the card — no server, no signup, no app. The recipient visits the URL and sees their card with confetti. They can send one back. Pure URL-based birthday messaging.";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "@id": "https://pointcast.xyz/card",
    name: "/card",
    alternateName: "send a birthday card via URL",
    description,
    url: "https://pointcast.xyz/card",
    applicationCategory: "CommunicationApplication",
    operatingSystem: "Any (browser)"
  };
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "jsonLd": jsonLd, "data-astro-cid-jd7s6tzj": true }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="card-page" data-astro-cid-jd7s6tzj> <nav class="crumb mono" aria-label="Breadcrumb" data-astro-cid-jd7s6tzj> <a href="/" data-astro-cid-jd7s6tzj>← All blocks</a> <span aria-hidden="true" data-astro-cid-jd7s6tzj>/</span> <span data-astro-cid-jd7s6tzj>card</span> </nav> <header class="head" data-astro-cid-jd7s6tzj> <p class="head__kicker mono" data-astro-cid-jd7s6tzj>★ CARD · A SHAREABLE BIRTHDAY CARD</p> <h1 class="head__title" data-astro-cid-jd7s6tzj>Type a name. Send the URL.</h1> <p class="head__lede" data-astro-cid-jd7s6tzj>
The URL <em data-astro-cid-jd7s6tzj>is</em> the card. No server, no signup, no app. Type
        someone's name below — the URL updates with their card baked in.
        Send the URL anywhere. They visit, see confetti, see their card,
        and can send one back. <strong data-astro-cid-jd7s6tzj>Pure URL-based birthday
        messaging.</strong> </p> </header> <!-- Form view (shown when no recipient param) --> <section class="form" id="form-view" aria-label="Compose a card" data-astro-cid-jd7s6tzj> <h2 class="form__title mono" data-astro-cid-jd7s6tzj>+ COMPOSE</h2> <div class="form__row" data-astro-cid-jd7s6tzj> <label for="to-input" class="form__label mono" data-astro-cid-jd7s6tzj>TO *</label> <input id="to-input" type="text" maxlength="40" placeholder="Sarah" aria-describedby="to-help" data-astro-cid-jd7s6tzj> <p id="to-help" class="form__help" data-astro-cid-jd7s6tzj>Required. Their first name or whatever they go by.</p> </div> <div class="form__row" data-astro-cid-jd7s6tzj> <label for="from-input" class="form__label mono" data-astro-cid-jd7s6tzj>FROM · OPTIONAL</label> <input id="from-input" type="text" maxlength="40" placeholder="Mike" data-astro-cid-jd7s6tzj> </div> <div class="form__row" data-astro-cid-jd7s6tzj> <label for="age-input" class="form__label mono" data-astro-cid-jd7s6tzj>AGE · OPTIONAL</label> <input id="age-input" type="number" min="1" max="120" placeholder="30" inputmode="numeric" data-astro-cid-jd7s6tzj> </div> <div class="form__row" data-astro-cid-jd7s6tzj> <label for="note-input" class="form__label mono" data-astro-cid-jd7s6tzj>NOTE · OPTIONAL · ≤120 CHARS</label> <input id="note-input" type="text" maxlength="120" placeholder="have a real Tuesday" data-astro-cid-jd7s6tzj> </div> <button type="button" id="make-btn" class="form__btn mono" data-astro-cid-jd7s6tzj>MAKE THE CARD →</button> </section> <!-- Card view (shown when ?to= is present, or after submit) --> <section class="card-view" id="card-view" hidden aria-label="The card" data-astro-cid-jd7s6tzj> <article class="card" id="card" data-astro-cid-jd7s6tzj> <div class="card__noun-wrap" data-astro-cid-jd7s6tzj> <img class="card__noun" id="card-noun" src="" alt="" width="120" height="120" loading="lazy" data-astro-cid-jd7s6tzj> <div class="card__hat" data-astro-cid-jd7s6tzj></div> </div> <p class="card__greeting mono" id="card-greeting" data-astro-cid-jd7s6tzj>HAPPY BIRTHDAY</p> <h2 class="card__name" id="card-name" data-astro-cid-jd7s6tzj>—</h2> <p class="card__age mono" id="card-age" hidden data-astro-cid-jd7s6tzj>—</p> <p class="card__note" id="card-note" hidden data-astro-cid-jd7s6tzj>—</p> <p class="card__from mono" id="card-from" hidden data-astro-cid-jd7s6tzj>—</p> </article> <div class="actions" data-astro-cid-jd7s6tzj> <button type="button" id="copy-btn" class="action mono" data-astro-cid-jd7s6tzj>📋 COPY LINK</button> <button type="button" id="reply-btn" class="action mono action--accent" hidden data-astro-cid-jd7s6tzj>SEND ONE BACK →</button> <button type="button" id="edit-btn" class="action mono" data-astro-cid-jd7s6tzj>✎ EDIT</button> </div> <p class="card-status mono" id="card-status" data-astro-cid-jd7s6tzj>·</p> </section> <footer class="foot" data-astro-cid-jd7s6tzj> <p class="foot__line mono" data-astro-cid-jd7s6tzj> <strong data-astro-cid-jd7s6tzj>HOW IT WORKS.</strong> Submit the form → page rewrites the
        URL to <code data-astro-cid-jd7s6tzj>/card?to=Sarah&from=Mike&age=30&note=…</code>. The
        URL is the card. Send it via text, Slack, email, anywhere.
        Recipient opens it → confetti fires, card fills in, "send one
        back" button generates the reverse URL with their name in FROM.
</p> <p class="foot__line mono" data-astro-cid-jd7s6tzj> <strong data-astro-cid-jd7s6tzj>WHY URL-ONLY.</strong> No server means no privacy
        question — the page never sees the message. The URL goes straight
        from sender to recipient via whatever channel they picked. No
        moderation, no logs, no "your message was sent at 3:42pm." Just
        a card.
</p> <p class="foot__brief mono" data-astro-cid-jd7s6tzj>
related: <a href="/sing" data-astro-cid-jd7s6tzj>/sing</a> <span class="foot__sep" data-astro-cid-jd7s6tzj>·</span> <a href="/blow" data-astro-cid-jd7s6tzj>/blow</a> <span class="foot__sep" data-astro-cid-jd7s6tzj>·</span> <a href="/cheers" data-astro-cid-jd7s6tzj>/cheers</a> <span class="foot__sep" data-astro-cid-jd7s6tzj>·</span> <a href="/wrapped" data-astro-cid-jd7s6tzj>/wrapped</a> <span class="foot__sep" data-astro-cid-jd7s6tzj>·</span> <a href="/cake" data-astro-cid-jd7s6tzj>/cake</a> </p> </footer> </div> ` })} ${renderScript($$result, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/card.astro?astro&type=script&index=0&lang.ts")} `;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/card.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/card.astro";
const $$url = "/card";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Card,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
