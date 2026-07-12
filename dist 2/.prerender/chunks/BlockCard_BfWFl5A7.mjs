import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { m as maybeRenderHead, b as addAttribute, a as renderTemplate } from './prerender_CmTjnOuJ.mjs';
import 'clsx';
import { C as CHANNELS } from './channels_C2qW9mSV.mjs';
import { a as BLOCK_TYPES } from './block-types_l5R3rOkI.mjs';

const $$BlockCard = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$BlockCard;
  function footerMeta(data2, hint) {
    const ed = data2.edition;
    const supplyStr = (s) => s === "open" ? "∞" : String(s ?? "—");
    const host = (url) => {
      if (!url) return "";
      try {
        const u = new URL(url, "https://pointcast.xyz");
        const h = u.host.replace(/^www\./, "");
        return h === "pointcast.xyz" && u.pathname !== "/" ? u.pathname : h;
      } catch {
        return "";
      }
    };
    switch (hint) {
      case "readingTime":
        if (!data2.readingTime) return null;
        return ed ? `${data2.readingTime} · ED ${ed.minted}/${supplyStr(ed.supply)}` : data2.readingTime;
      case "externalLink":
      case "destination":
        return data2.external ? `${host(data2.external.url)} ↗` : null;
      case "duration":
        return data2.external ? `${host(data2.external.url)} ↗` : null;
      case "edition":
        if (!ed) return null;
        const price = ed.price === "free" ? "FREE" : `${ed.price?.tez ?? "—"} ꜩ`;
        return `${price} · ED ${ed.minted}/${supplyStr(ed.supply)}`;
      case "claimStatus":
        if (!ed) return null;
        return `CLAIMED ${ed.minted}/${supplyStr(ed.supply)} TODAY`;
      case "location":
        return data2.meta?.location ?? null;
      case "agent":
        if (!data2.visitor) return null;
        return data2.visitor.vendor ?? data2.visitor.name ?? (data2.visitor.kind === "agent" ? "AGENT" : "HUMAN");
      case "birthday": {
        const recipient = data2.meta?.for?.toUpperCase();
        const nounStr = data2.noun != null ? `NOUN ${data2.noun}` : null;
        const claimStr = ed ? `CLAIMED ${ed.minted}/${supplyStr(ed.supply)}` : null;
        return [recipient, nounStr, claimStr].filter(Boolean).join(" · ") || null;
      }
    }
    return null;
  }
  const { block, detail = false } = Astro2.props;
  const data = block.data;
  const channel = CHANNELS[data.channel];
  const typeSpec = BLOCK_TYPES[data.type];
  function youtubeIdFromUrl(url) {
    if (!url) return null;
    const m = url.match(/(?:youtube\.com\/(?:embed\/|watch\?v=|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{6,})/);
    return m ? m[1] : null;
  }
  function vimeoIdFromUrl(url) {
    if (!url) return null;
    const m = url.match(/(?:vimeo\.com\/(?:video\/)?|player\.vimeo\.com\/video\/)(\d{5,})/);
    return m ? m[1] : null;
  }
  function resolveVideoThumbnail() {
    if (data.type !== "WATCH" || data.media?.kind !== "embed") return null;
    const explicit = data.media.thumbnail;
    if (explicit) return explicit;
    const ytId = youtubeIdFromUrl(data.media.src) ?? youtubeIdFromUrl(data.external?.url);
    if (ytId) return `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
    const vId = vimeoIdFromUrl(data.media.src) ?? vimeoIdFromUrl(data.external?.url);
    if (vId) return `https://vumbnail.com/${vId}.jpg`;
    return null;
  }
  const videoThumbnail = resolveVideoThumbnail();
  const ts = data.timestamp;
  const fmt = new Intl.DateTimeFormat("en-US", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "America/Los_Angeles"
  }).formatToParts(ts);
  const part = (t) => fmt.find((p) => p.type === t)?.value ?? "";
  const tsShort = `${part("month")}.${part("day")} · ${part("hour")}:${part("minute")} PT`;
  const sizeClassMap = {
    "1x1": "span-1x1",
    "2x1": "span-2x1",
    "1x2": "span-1x2",
    "2x2": "span-2x2",
    "3x2": "span-3x2"
  };
  const sizeClass = sizeClassMap[data.size ?? "1x1"] ?? "span-1x1";
  return renderTemplate`${maybeRenderHead()}<article${addAttribute([
    "block-card",
    `type-${data.type.toLowerCase()}`,
    `channel-${data.channel.toLowerCase()}`,
    sizeClass,
    { "block-card--detail": detail, "block-card--accent": data.type === "READ" }
  ], "class:list")}${addAttribute(data.id, "data-id")}${addAttribute(data.channel, "data-channel")}${addAttribute(data.type, "data-type")}${addAttribute({
    "--ch-600": channel.color600,
    "--ch-800": channel.color800,
    "--ch-50": channel.color50
  }, "style")} data-astro-cid-awftydb6>  <a${addAttribute(detail ? void 0 : `/b/${data.id}`, "href")}${addAttribute(["block-card__link", { "block-card__link--inert": detail }], "class:list")}${addAttribute(detail ? void 0 : `Block ${data.id}: ${data.title}`, "aria-label")} data-astro-cid-awftydb6> <header class="block-card__header" data-astro-cid-awftydb6> <span class="block-card__code" data-astro-cid-awftydb6>CH.${channel.code} · ${data.id}</span> <span class="block-card__type-tag" data-astro-cid-awftydb6>${typeSpec.label}</span> <time class="block-card__time"${addAttribute(ts.toISOString(), "datetime")} data-astro-cid-awftydb6>${tsShort}</time> </header> ${data.noun !== void 0 && !detail && renderTemplate`<span class="block-card__noun-frame" aria-hidden="true" data-astro-cid-awftydb6> <img${addAttribute(`https://noun.pics/${data.noun}.svg`, "src")} alt="" width="30" height="30" loading="lazy" class="block-card__noun" style="image-rendering: pixelated;" onerror="this.style.visibility='hidden'" data-astro-cid-awftydb6> </span>`}  ${data.type === "READ" && renderTemplate`<p class="block-card__kicker block-card__kicker--read" data-astro-cid-awftydb6>
DISPATCH · Nº ${data.id} ${data.meta?.series ? ` · ${data.meta.series.toUpperCase()}` : ""} </p>`} ${data.type === "LISTEN" && renderTemplate`<p class="block-card__kicker block-card__kicker--listen" data-astro-cid-awftydb6>
♪ NOW PLAYING${data.meta?.artist ? ` · ${data.meta.artist.toUpperCase()}` : ""} </p>`} ${data.type === "WATCH" && renderTemplate`<p class="block-card__kicker block-card__kicker--watch" data-astro-cid-awftydb6>▸ WATCH</p>`} ${data.type === "NOTE" && renderTemplate`<p class="block-card__kicker block-card__kicker--note" data-astro-cid-awftydb6>
✳ NOTE${data.meta?.location ? ` · ${data.meta.location.toUpperCase()}` : ""} </p>`} ${data.type === "VISIT" && renderTemplate`<p class="block-card__kicker block-card__kicker--visit" data-astro-cid-awftydb6>
◊ VISIT STAMP · ${tsShort.toUpperCase()} </p>`} ${data.type === "MINT" && renderTemplate`<p class="block-card__kicker block-card__kicker--mint" data-astro-cid-awftydb6>
◆ MINT · EDITION
</p>`} ${data.type === "BIRTHDAY" && renderTemplate`<p class="block-card__kicker block-card__kicker--birthday" data-astro-cid-awftydb6>
★ BIRTHDAY · OPEN EDITION
</p>`} ${data.type === "FAUCET" && renderTemplate`<p class="block-card__kicker block-card__kicker--faucet" data-astro-cid-awftydb6>
⚑ FAUCET · DAILY CLAIM
</p>`} ${data.type === "LINK" && data.meta?.price && renderTemplate`<p class="block-card__kicker block-card__kicker--link" data-astro-cid-awftydb6>
→ ${data.meta.price}${data.external?.label ? ` · ${data.external.label.toUpperCase()}` : ""} </p>`} <h3 class="block-card__title" data-astro-cid-awftydb6>${data.title}</h3> ${data.dek && renderTemplate`<p class="block-card__dek" data-astro-cid-awftydb6>${data.dek}</p>`}  ${data.media?.kind === "image" && renderTemplate`<div class="block-card__media" data-astro-cid-awftydb6> <img${addAttribute(data.media.src, "src")}${addAttribute(data.title, "alt")} loading="lazy"${addAttribute(data.media.ipfsFallback ?? "", "data-fallback")} onerror="if(this.dataset.fallback && this.src!==this.dataset.fallback){this.src=this.dataset.fallback;}else{this.parentElement.style.display='none';}" data-astro-cid-awftydb6> </div>`}  ${data.media?.kind === "embed" && data.type === "LISTEN" && (detail ? renderTemplate`<div class="block-card__embed block-card__embed--audio" data-astro-cid-awftydb6> <iframe${addAttribute(data.media.src, "src")} loading="lazy" frameborder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"${addAttribute(data.title, "title")} data-astro-cid-awftydb6></iframe> </div>` : renderTemplate`<div class="block-card__embed-facade" aria-hidden="true" data-astro-cid-awftydb6> <span class="block-card__embed-facade-play" data-astro-cid-awftydb6>▶</span> <span class="block-card__embed-facade-label" data-astro-cid-awftydb6> ${(() => {
    try {
      return new URL(data.media.src).host.replace(/^www\./, "");
    } catch {
      return "Open to play";
    }
  })()} </span> </div>`)}  ${data.media?.kind === "embed" && data.type === "WATCH" && (detail ? renderTemplate`<div class="block-card__embed block-card__embed--video" data-astro-cid-awftydb6> <iframe${addAttribute(data.media.src, "src")} loading="lazy" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; fullscreen; gyroscope; picture-in-picture" allowfullscreen${addAttribute(data.title, "title")} data-astro-cid-awftydb6></iframe> </div>` : renderTemplate`<div class="block-card__video-facade" aria-hidden="true" data-astro-cid-awftydb6> ${videoThumbnail ? renderTemplate`<img${addAttribute(videoThumbnail, "src")} alt="" loading="lazy" class="block-card__video-poster" onerror="this.style.display='none'; this.parentElement.classList.add('block-card__video-facade--poster-failed');" data-astro-cid-awftydb6>` : renderTemplate`<div class="block-card__video-poster block-card__video-poster--empty" data-astro-cid-awftydb6></div>`} <span class="block-card__video-play" data-astro-cid-awftydb6>▶</span> ${data.meta?.duration && renderTemplate`<span class="block-card__video-duration mono" data-astro-cid-awftydb6>${data.meta.duration}</span>`} </div>`)}  ${data.body && (data.type === "NOTE" || data.type === "VISIT" || data.type === "LINK" || detail && data.type === "READ") && (detail && data.type === "READ" ? renderTemplate`<div class="block-card__article" data-astro-cid-awftydb6> ${data.body.split(/\n\n+/).map((para) => renderTemplate`<p class="block-card__article-p" data-astro-cid-awftydb6>${para}</p>`)} </div>` : renderTemplate`<p class="block-card__body" data-astro-cid-awftydb6>${data.body}</p>`)}  ${!detail && data.type === "READ" && data.body && renderTemplate`<p class="block-card__preview" data-astro-cid-awftydb6> ${(() => {
    const first = data.body.split(/\n\n+/)[0].trim();
    return first.length > 220 ? first.slice(0, 217).trimEnd() + "…" : first;
  })()} </p>`}  ${(() => {
    const meta = footerMeta(data, typeSpec.footerHint);
    return renderTemplate`<footer class="block-card__footer" data-astro-cid-awftydb6> ${meta && renderTemplate`<span class="block-card__meta" data-astro-cid-awftydb6>${meta}</span>`} </footer>`;
  })()} </a> </article>`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/components/BlockCard.astro", void 0);

export { $$BlockCard as $ };
