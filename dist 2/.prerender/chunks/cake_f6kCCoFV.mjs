import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead, b as addAttribute } from './prerender_CmTjnOuJ.mjs';
import { r as renderScript } from './script_AUITBxpA.mjs';
import { g as getCollection } from './_astro_content_kC0GrL8i.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { C as CHANNELS } from './channels_C2qW9mSV.mjs';

const $$Cake = createComponent(async ($$result, $$props, $$slots) => {
  const ch = CHANNELS.BDY;
  const allBlocks = await getCollection("blocks", ({ data }) => !data.draft);
  const birthdayBlocks = allBlocks.filter((b) => b.data.channel === "BDY" || b.data.type === "BIRTHDAY").sort((a, b) => +new Date(b.data.timestamp) - +new Date(a.data.timestamp));
  const family = await getCollection("family", ({ data }) => data.listed);
  function todayPT() {
    const now = /* @__PURE__ */ new Date();
    const ptStr = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Los_Angeles",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).format(now);
    return /* @__PURE__ */ new Date(ptStr + "T00:00:00");
  }
  function nextOccurrence(mmdd, from) {
    const [mm, dd] = mmdd.split("-").map(Number);
    const yr = from.getFullYear();
    let candidate = new Date(yr, mm - 1, dd);
    if (candidate < from) candidate = new Date(yr + 1, mm - 1, dd);
    return candidate;
  }
  const today = todayPT();
  const horizon = new Date(today);
  horizon.setDate(horizon.getDate() + 60);
  const upcoming = family.filter((f) => f.data.birthday).map((f) => {
    const next = nextOccurrence(f.data.birthday, today);
    const isToday = +next === +today;
    return {
      slug: f.data.slug,
      name: f.data.name,
      relationship: f.data.relationship,
      birthday: f.data.birthday,
      noun: f.data.permanentNoun,
      next,
      isToday,
      daysAway: Math.round((+next - +today) / 864e5)
    };
  }).filter((u) => u.next <= horizon).sort((a, b) => +a.next - +b.next);
  const recipientMap = /* @__PURE__ */ new Map();
  for (const b of birthdayBlocks) {
    const slug = b.data.meta?.for || "unknown";
    if (!recipientMap.has(slug)) recipientMap.set(slug, []);
    recipientMap.get(slug).push(b);
  }
  const recipients = Array.from(recipientMap.entries()).map(([slug, blocks]) => {
    const fam = family.find((f) => f.data.slug === slug);
    return {
      slug,
      name: fam?.data.name ?? slug,
      noun: fam?.data.permanentNoun ?? blocks[0]?.data.noun,
      count: blocks.length,
      latest: blocks[0]
    };
  }).sort((a, b) => b.count - a.count);
  const totalBirthdays = birthdayBlocks.length;
  const totalRecipients = recipients.length;
  const longDate = (d) => new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "America/Los_Angeles"
  }).format(d);
  const blockYear = (b) => new Date(b.data.timestamp).getUTCFullYear();
  const title = "/cake — the place where birthdays are celebrated online";
  const description = `Every birthday celebrated on PointCast. ${totalBirthdays} birthday block${totalBirthdays === 1 ? "" : "s"} across ${totalRecipients} recipient${totalRecipients === 1 ? "" : "s"}. One block per person per year. One Noun per person, forever. Free open-edition mints on Tezos when the birthdays_fa2 contract ships.`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": "https://pointcast.xyz/cake",
    name: "/cake",
    alternateName: "the place where birthdays are celebrated online",
    description,
    url: "https://pointcast.xyz/cake",
    isPartOf: { "@type": "WebSite", "@id": "https://pointcast.xyz" },
    numberOfItems: totalBirthdays,
    hasPart: birthdayBlocks.map((b) => ({
      "@type": "CreativeWork",
      "@id": `https://pointcast.xyz/b/${b.data.id}`,
      name: b.data.title,
      url: `https://pointcast.xyz/b/${b.data.id}`,
      dateCreated: b.data.timestamp
    }))
  };
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "image": "/images/og/cake.png", "jsonLd": jsonLd, "data-astro-cid-euz3yyor": true }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="cake"${addAttribute(`--ch-600: ${ch.color600}; --ch-800: ${ch.color800}; --ch-50: ${ch.color50};`, "style")} data-astro-cid-euz3yyor> <nav class="crumb mono" aria-label="Breadcrumb" data-astro-cid-euz3yyor> <a href="/" data-astro-cid-euz3yyor>← All blocks</a> <span aria-hidden="true" data-astro-cid-euz3yyor>/</span> <a${addAttribute(`/c/${ch.slug}`, "href")}${addAttribute(`color: var(--ch-800);`, "style")} data-astro-cid-euz3yyor>CH.${ch.code} · Birthday</a> <span aria-hidden="true" data-astro-cid-euz3yyor>/</span> <span data-astro-cid-euz3yyor>cake</span> </nav> <header class="head" data-astro-cid-euz3yyor> <p class="head__kicker mono" data-astro-cid-euz3yyor>CH.BDY · /CAKE · v0</p> <h1 class="head__title" data-astro-cid-euz3yyor>cake.</h1> <p class="head__lede" data-astro-cid-euz3yyor>
the place where birthdays are celebrated online.
</p> <p class="head__sub" data-astro-cid-euz3yyor>
One block per person per year. One Noun per person, forever. Numbered
        like Nouns, indexed like a magazine, mintable like an edition,
        addressed to one person.
</p> <div class="stats mono" data-astro-cid-euz3yyor> <span class="stats__cell" data-astro-cid-euz3yyor><strong data-astro-cid-euz3yyor>${totalBirthdays}</strong> celebrated</span> <span class="stats__sep" data-astro-cid-euz3yyor>·</span> <span class="stats__cell" data-astro-cid-euz3yyor><strong data-astro-cid-euz3yyor>${totalRecipients}</strong> ${totalRecipients === 1 ? "recipient" : "recipients"}</span> <span class="stats__sep" data-astro-cid-euz3yyor>·</span> <span class="stats__cell" data-astro-cid-euz3yyor>since 2026-04-25</span> <span class="stats__sep" data-astro-cid-euz3yyor>·</span> <a href="/cake.json" class="stats__cell" data-astro-cid-euz3yyor>/cake.json ↗</a> </div> <div class="head__cta-row" data-astro-cid-euz3yyor> <a class="head__cta mono" href="/cake/register" data-astro-cid-euz3yyor>+ register your birthday →</a> </div> </header> ${upcoming.length > 0 && renderTemplate`<section class="section section--upcoming" data-astro-cid-euz3yyor> <h2 class="section__title mono" data-astro-cid-euz3yyor>Upcoming · next 60 days</h2> <ul class="row-list" data-astro-cid-euz3yyor> ${upcoming.map((u) => renderTemplate`<li${addAttribute(`row${u.isToday ? " row--today" : ""}`, "class")} data-astro-cid-euz3yyor> <span class="row__date mono" data-astro-cid-euz3yyor> ${u.isToday ? "TODAY" : longDate(u.next).toUpperCase()} </span> ${u.noun != null && renderTemplate`<img class="row__noun"${addAttribute(`https://noun.pics/${u.noun}.svg`, "src")}${addAttribute(`Noun ${u.noun}`, "alt")} width="36" height="36" loading="lazy" data-astro-cid-euz3yyor>`} <span class="row__name" data-astro-cid-euz3yyor> <strong data-astro-cid-euz3yyor>${u.name}</strong> ${u.relationship && renderTemplate`<span class="row__rel" data-astro-cid-euz3yyor> · ${u.relationship}</span>`} </span> <span class="row__meta mono" data-astro-cid-euz3yyor> ${u.noun != null ? `NOUN ${u.noun}` : "NO NOUN YET"} <span class="row__sep" data-astro-cid-euz3yyor>·</span> ${u.isToday ? "TODAY" : u.daysAway === 1 ? "TOMORROW" : `IN ${u.daysAway} DAYS`} </span> <a class="row__link mono"${addAttribute(`/cake/${u.slug}`, "href")} data-astro-cid-euz3yyor>
/cake/${u.slug} →
</a> </li>`)} </ul> </section>`} <section class="section section--circle" id="cake-circle" data-astro-cid-euz3yyor> <div class="section__head" data-astro-cid-euz3yyor> <h2 class="section__title mono" data-astro-cid-euz3yyor>Cake Circle · public registry</h2> <a class="section__cta mono" href="/cake/register" data-astro-cid-euz3yyor>+ register your birthday →</a> </div> <p class="circle-lede" data-astro-cid-euz3yyor>
Anyone can drop their birthday on PointCast. Free, no wallet, no
        moderation queue. <strong data-astro-cid-euz3yyor>One per device.</strong> Your handle is
        yours; on your day, the broadcast tips its hat. People can celebrate
        on your block (signature + confetti) when one's written.
</p> <p class="circle-count mono" id="circle-count" data-astro-cid-euz3yyor>· loading the circle…</p> <ul class="circle-list" id="circle-list" data-astro-cid-euz3yyor></ul> </section> ${recipients.length > 0 && renderTemplate`<section class="section section--recipients" data-astro-cid-euz3yyor> <h2 class="section__title mono" data-astro-cid-euz3yyor>Recipients · permanent Nouns (curated)</h2> <div class="grid" data-astro-cid-euz3yyor> ${recipients.map((r) => renderTemplate`<a class="rcard"${addAttribute(`/cake/${r.slug}`, "href")} data-astro-cid-euz3yyor> ${r.noun != null && renderTemplate`<img class="rcard__noun"${addAttribute(`https://noun.pics/${r.noun}.svg`, "src")}${addAttribute(`Noun ${r.noun}`, "alt")} width="80" height="80" loading="lazy" data-astro-cid-euz3yyor>`} <div class="rcard__body" data-astro-cid-euz3yyor> <p class="rcard__name" data-astro-cid-euz3yyor>${r.name}</p> <p class="rcard__meta mono" data-astro-cid-euz3yyor> ${r.noun != null ? `NOUN ${r.noun}` : "NO NOUN"} <span class="rcard__sep" data-astro-cid-euz3yyor>·</span> ${r.count} ${r.count === 1 ? "block" : "blocks"} </p> </div> </a>`)} </div> </section>`} ${birthdayBlocks.length > 0 ? renderTemplate`<section class="section section--archive" data-astro-cid-euz3yyor> <h2 class="section__title mono" data-astro-cid-euz3yyor>Archive · most recent first</h2> <ul class="bday-list" data-astro-cid-euz3yyor> ${birthdayBlocks.map((b) => renderTemplate`<li class="bday" data-astro-cid-euz3yyor> <a class="bday__link"${addAttribute(`/b/${b.data.id}`, "href")} data-astro-cid-euz3yyor> ${b.data.noun != null && renderTemplate`<img class="bday__noun"${addAttribute(`https://noun.pics/${b.data.noun}.svg`, "src")}${addAttribute(`Noun ${b.data.noun}`, "alt")} width="56" height="56" loading="lazy" data-astro-cid-euz3yyor>`} <div class="bday__body" data-astro-cid-euz3yyor> <p class="bday__id mono" data-astro-cid-euz3yyor>№${b.data.id} · ${blockYear(b)}</p> <p class="bday__title" data-astro-cid-euz3yyor>${b.data.title}</p> ${b.data.dek && renderTemplate`<p class="bday__dek" data-astro-cid-euz3yyor>${b.data.dek}</p>`} <p class="bday__meta mono" data-astro-cid-euz3yyor> ${b.data.meta?.for?.toUpperCase() ?? "—"} <span class="bday__sep" data-astro-cid-euz3yyor>·</span> ${b.data.noun != null ? `NOUN ${b.data.noun}` : "NO NOUN"} <span class="bday__sep" data-astro-cid-euz3yyor>·</span>
CLAIMED ${b.data.edition?.minted ?? 0}/∞
</p> </div> </a> </li>`)} </ul> </section>` : renderTemplate`<section class="section section--empty" data-astro-cid-euz3yyor> <p class="empty mono" data-astro-cid-euz3yyor>no birthday blocks yet — №0001 ships 2026-04-25.</p> </section>`} <footer class="foot" data-astro-cid-euz3yyor> <p class="foot__line mono" data-astro-cid-euz3yyor> <strong data-astro-cid-euz3yyor>WHAT THIS IS.</strong> Birthday cards online are usually
        private and ephemeral — a text, an Instagram story, a phone call.
        PointCast is a public, permanent, agent-readable broadcast. A
        birthday block is the inverse: numbered, immutable, indexed forever,
        mintable as a record of presence. One block per person per year.
        One Noun per person, forever.
</p> <p class="foot__line mono" data-astro-cid-euz3yyor> <strong data-astro-cid-euz3yyor>HOW TO BE INCLUDED.</strong> The birthday list is opt-in
        per person, same consent rule as
<a href="/family" data-astro-cid-euz3yyor> /family</a> entries. Mike adds entries by
        editing <code data-astro-cid-euz3yyor>src/content/family/&#123;slug&#125;.json</code> and
        adding a <code data-astro-cid-euz3yyor>birthday: MM-DD</code> field — never on someone's
        behalf without their explicit ok.
</p> <p class="foot__line mono" data-astro-cid-euz3yyor> <strong data-astro-cid-euz3yyor>CONTRACT.</strong> The birthdays FA2 contract ships next
        sprint. Free open editions, gas-only mint, claim-once-per-wallet.
        Token IDs derive from PointCast block IDs (block 0366 → token #366).
        Until live, the URL itself is the gift.
</p> <p class="foot__brief mono" data-astro-cid-euz3yyor>
spec: <a href="https://github.com/mhoydich/pointcast/blob/main/docs/briefs/2026-04-25-cake-room-bdy-channel.md" data-astro-cid-euz3yyor>/docs/briefs/2026-04-25-cake-room-bdy-channel.md</a> </p> </footer> </div> ` })} ${renderScript($$result, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/cake.astro?astro&type=script&index=0&lang.ts")}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/cake.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/cake.astro";
const $$url = "/cake";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Cake,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
