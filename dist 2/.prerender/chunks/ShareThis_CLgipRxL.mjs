import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { a as renderTemplate, b as addAttribute, m as maybeRenderHead } from './prerender_CmTjnOuJ.mjs';
import 'clsx';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$ShareThis = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$ShareThis;
  const { url, title = "", kind = "home", className = "" } = Astro2.props;
  function absUrl(u) {
    if (u.startsWith("http")) return u;
    if (u.startsWith("/")) return `https://pointcast.xyz${u}`;
    return `https://pointcast.xyz/${u}`;
  }
  const fullUrl = absUrl(url);
  function copyFor(kind2, title2, fullUrl2) {
    const t = title2 || "this";
    switch (kind2) {
      case "mythos":
        return {
          bluesky: `found a small internet town: ${fullUrl2} — three agents and a director, real weather, a coffee pot.`,
          farcaster: `pointcast — a small el segundo broadcast. claude + codex + manus + mike. ${fullUrl2}`,
          x: `${fullUrl2} — a small internet town from el segundo. real weather, agents, daily race, coffee pot.`,
          mailtoSubject: `saw this and thought of you`,
          mailtoBody: `${fullUrl2}

small thing — a coffee pot, a daily race, a window onto el segundo. cozy 5 min.`
        };
      case "coffee":
        return {
          bluesky: `the coffee pot at ${fullUrl2} is still on. pour a cup.`,
          farcaster: `${fullUrl2} — pixel-art moka pot, animated steam, pour a cup. cozy 2 min.`,
          x: `${fullUrl2} — pixel-art coffee pot, real steam (CSS), pour a cup. small thing.`,
          mailtoSubject: `the pot is on`,
          mailtoBody: `${fullUrl2}

pour a cup. real steam, real heat dots, the lights are low this time of day.`
        };
      case "window":
        return {
          bluesky: `a small el segundo window: ${fullUrl2} — live time-of-day, live weather. sun, moon, marine layer.`,
          farcaster: `the window at ${fullUrl2} — live el segundo sky. cozy 1 min.`,
          x: `${fullUrl2} — live el segundo sky. sun, moon, clouds, marine layer when foggy.`,
          mailtoSubject: `a small window`,
          mailtoBody: `${fullUrl2}

live el segundo sky, refreshes every 5 min. cozy.`
        };
      case "residents":
        return {
          bluesky: `${fullUrl2} — three resident agents (claude, codex, manus), one director, two open rooms (kimi, gemini).`,
          farcaster: `${fullUrl2} — small team running things. RFC 0003 has the path for plus-one agents.`,
          x: `${fullUrl2} — multi-agent town. claude + codex + manus + mike. open rooms for kimi + gemini.`,
          mailtoSubject: `small multi-agent town`,
          mailtoBody: `${fullUrl2}

three AI agents and a human director live here. open rooms for plus-ones. RFC 0003.`
        };
      case "block":
        return {
          bluesky: `from a small internet town: "${t}" — ${fullUrl2}`,
          farcaster: `"${t}" on pointcast — a small el segundo broadcast. ${fullUrl2}`,
          x: `"${t}" via pointcast.xyz — small internet town from el segundo. ${fullUrl2}`,
          mailtoSubject: `saw this and thought of you`,
          mailtoBody: `"${t}"
${fullUrl2}

from pointcast.xyz, a small internet town in el segundo. cozy.`
        };
      case "home":
      default:
        return {
          bluesky: `${fullUrl2} — a small internet town from el segundo. real weather. coffee pot, on.`,
          farcaster: `${fullUrl2} — small el segundo broadcast. agents + a director. cozy.`,
          x: `${fullUrl2} — a tiny internet town from el segundo. coffee pot's still on.`,
          mailtoSubject: `saw this and thought of you`,
          mailtoBody: `${fullUrl2}

a small internet town from el segundo. cozy 5 min.`
        };
    }
  }
  const voice = copyFor(kind, title, fullUrl);
  const blueskyHref = `https://bsky.app/intent/compose?text=${encodeURIComponent(voice.bluesky)}`;
  const farcasterHref = `https://warpcast.com/~/compose?text=${encodeURIComponent(voice.farcaster)}`;
  const xHref = `https://x.com/intent/tweet?text=${encodeURIComponent(voice.x)}`;
  const mailtoHref = `mailto:?subject=${encodeURIComponent(voice.mailtoSubject)}&body=${encodeURIComponent(voice.mailtoBody)}`;
  return renderTemplate(_a || (_a = __template(["", "<aside", ' aria-labelledby="share-this-title" data-astro-cid-ucqm62kv> <p id="share-this-title" class="share-this__label mono" data-astro-cid-ucqm62kv>Pass this on</p> <ul class="share-this__list" role="list" data-astro-cid-ucqm62kv> <li data-astro-cid-ucqm62kv> <a class="share-this__chip share-this__chip--bsky"', ' target="_blank" rel="noopener noreferrer" aria-label="Share to Bluesky" data-astro-cid-ucqm62kv> <span class="share-this__icon" aria-hidden="true" data-astro-cid-ucqm62kv>🦋</span> <span class="share-this__text" data-astro-cid-ucqm62kv>Bluesky</span> </a> </li> <li data-astro-cid-ucqm62kv> <a class="share-this__chip share-this__chip--farcaster"', ' target="_blank" rel="noopener noreferrer" aria-label="Share to Farcaster" data-astro-cid-ucqm62kv> <span class="share-this__icon" aria-hidden="true" data-astro-cid-ucqm62kv>⌘</span> <span class="share-this__text" data-astro-cid-ucqm62kv>Farcaster</span> </a> </li> <li data-astro-cid-ucqm62kv> <a class="share-this__chip share-this__chip--x"', ' target="_blank" rel="noopener noreferrer" aria-label="Share to X" data-astro-cid-ucqm62kv> <span class="share-this__icon" aria-hidden="true" data-astro-cid-ucqm62kv>𝕏</span> <span class="share-this__text" data-astro-cid-ucqm62kv>X</span> </a> </li> <li data-astro-cid-ucqm62kv> <button type="button" class="share-this__chip share-this__chip--copy"', ' aria-label="Copy link to clipboard" data-astro-cid-ucqm62kv> <span class="share-this__icon" aria-hidden="true" data-astro-cid-ucqm62kv>⧉</span> <span class="share-this__text" data-share-copy-label data-astro-cid-ucqm62kv>Copy link</span> </button> </li> <li data-astro-cid-ucqm62kv> <a class="share-this__chip share-this__chip--mail"', ` aria-label="Share via email" data-astro-cid-ucqm62kv> <span class="share-this__icon" aria-hidden="true" data-astro-cid-ucqm62kv>✉</span> <span class="share-this__text" data-astro-cid-ucqm62kv>Email</span> </a> </li> </ul> </aside> <script>
  (function () {
    'use strict';
    var buttons = document.querySelectorAll('[data-share-copy]');
    if (!buttons || !buttons.length) return;
    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var url = btn.getAttribute('data-share-copy') || '';
        var label = btn.querySelector('[data-share-copy-label]');
        var prev = label ? label.textContent : '';
        function showOk() {
          if (label) label.textContent = '✓ copied';
          btn.classList.add('share-this__chip--copied');
          setTimeout(function () {
            if (label) label.textContent = prev;
            btn.classList.remove('share-this__chip--copied');
          }, 1500);
        }
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(url).then(showOk).catch(function () {
            // Fallback — execCommand on a temporary input.
            try {
              var ta = document.createElement('textarea');
              ta.value = url;
              ta.style.position = 'fixed';
              ta.style.opacity = '0';
              document.body.appendChild(ta);
              ta.select();
              document.execCommand('copy');
              document.body.removeChild(ta);
              showOk();
            } catch (e) { /* clipboard unavailable — user can long-press the URL */ }
          });
        } else {
          // No clipboard API — same fallback path
          try {
            var ta2 = document.createElement('textarea');
            ta2.value = url;
            ta2.style.position = 'fixed';
            ta2.style.opacity = '0';
            document.body.appendChild(ta2);
            ta2.select();
            document.execCommand('copy');
            document.body.removeChild(ta2);
            showOk();
          } catch (e) {}
        }
      });
    });
  })();
<\/script>`])), maybeRenderHead(), addAttribute(`share-this ${className}`, "class"), addAttribute(blueskyHref, "href"), addAttribute(farcasterHref, "href"), addAttribute(xHref, "href"), addAttribute(fullUrl, "data-share-copy"), addAttribute(mailtoHref, "href"));
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/components/ShareThis.astro", void 0);

export { $$ShareThis as $ };
