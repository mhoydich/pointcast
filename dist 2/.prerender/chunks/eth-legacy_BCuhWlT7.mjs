import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead, b as addAttribute } from './prerender_CmTjnOuJ.mjs';
import { g as getCollection } from './_astro_content_kC0GrL8i.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';

const $$EthLegacy = createComponent(async ($$result, $$props, $$slots) => {
  const tokens = (await getCollection("ethLegacy", ({ data }) => !data.draft)).sort((a, b) => {
    const aScore = (a.data.network === "mainnet" ? 0 : 10) + (a.data.contract ? 0 : 1);
    const bScore = (b.data.network === "mainnet" ? 0 : 10) + (b.data.contract ? 0 : 1);
    if (aScore !== bScore) return aScore - bScore;
    return (a.data.name || "").localeCompare(b.data.name || "");
  });
  function scanUrl(network, address) {
    if (!address) return null;
    if (network === "mainnet") return `https://etherscan.io/address/${address}`;
    if (network === "polygon") return `https://polygonscan.com/address/${address}`;
    if (network === "ropsten" || network === "goerli" || network === "sepolia") return null;
    return null;
  }
  const byNetwork = {};
  const withContract = tokens.filter((t) => t.data.contract).length;
  for (const t of tokens) byNetwork[t.data.network] = (byNetwork[t.data.network] || 0) + 1;
  const title = "ETH Legacy — the token-deployment retrospective";
  const description = "Mike deployed ~43 custom ERC-20 tokens on Ethereum, Ropsten, and Polygon between 2018 and 2021. This is the retrospective gallery. Public data only — private keys + mnemonics never stored here.";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "PointCast ETH Legacy",
    description,
    url: "https://pointcast.xyz/eth-legacy"
  };
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "jsonLd": jsonLd, "data-astro-cid-l33qsxch": true }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="page" data-astro-cid-l33qsxch> <nav class="crumb" aria-label="Breadcrumb" data-astro-cid-l33qsxch> <a href="/" data-astro-cid-l33qsxch>Home</a> <span aria-hidden="true" data-astro-cid-l33qsxch>›</span> <span data-astro-cid-l33qsxch>eth-legacy</span> </nav> <header class="head" data-astro-cid-l33qsxch> <p class="kicker mono" data-astro-cid-l33qsxch>ETH LEGACY · DEPLOYMENT RETROSPECTIVE</p> <h1 class="title" data-astro-cid-l33qsxch>Forty-five tokens. One hand.</h1> <p class="dek" data-astro-cid-l33qsxch>
Between 2018 and 2021 Mike deployed roughly forty-five custom ERC-20
        tokens on Ethereum, Ropsten, and Polygon. Some had live contracts
        and real holders. Most were zero-revenue experiments — tokens as
        poems, as jokes, as one-line bets on an idea that might mean
        something later. This is the retrospective.
</p> <p class="dek dek--sub" data-astro-cid-l33qsxch> <strong data-astro-cid-l33qsxch>Security note:</strong> the source file held private keys
        and recovery phrases. cc extracted <em data-astro-cid-l33qsxch>only</em> the public columns
        (name · ticker · deployer · contract · network · public notes) and
        explicitly skipped every row of the private-key and mnemonic columns.
        The source file is stored in Mike's password manager; nothing
        sensitive is in this repo. Public addresses are on-chain and
        already world-readable via Etherscan.
</p> <ul class="stats" data-astro-cid-l33qsxch> <li data-astro-cid-l33qsxch><span class="stats__num mono" data-astro-cid-l33qsxch>${tokens.length}</span><span class="stats__lbl mono" data-astro-cid-l33qsxch>TOKENS</span></li> <li data-astro-cid-l33qsxch><span class="stats__num mono" data-astro-cid-l33qsxch>${byNetwork.mainnet || 0}</span><span class="stats__lbl mono" data-astro-cid-l33qsxch>MAINNET</span></li> <li data-astro-cid-l33qsxch><span class="stats__num mono" data-astro-cid-l33qsxch>${(byNetwork.ropsten || 0) + (byNetwork.goerli || 0) + (byNetwork.sepolia || 0)}</span><span class="stats__lbl mono" data-astro-cid-l33qsxch>TESTNET</span></li> <li data-astro-cid-l33qsxch><span class="stats__num mono" data-astro-cid-l33qsxch>${byNetwork.polygon || 0}</span><span class="stats__lbl mono" data-astro-cid-l33qsxch>POLYGON</span></li> <li data-astro-cid-l33qsxch><span class="stats__num mono" data-astro-cid-l33qsxch>${withContract}</span><span class="stats__lbl mono" data-astro-cid-l33qsxch>WITH CONTRACT</span></li> </ul> </header> <section class="legend" data-astro-cid-l33qsxch> <p class="kicker mono" data-astro-cid-l33qsxch>HOW TO READ</p> <p data-astro-cid-l33qsxch>
Each card shows the token name, ticker, network, and a direct link
        to the contract on the appropriate block explorer when one exists.
        Testnet tokens (Ropsten, Goerli, Sepolia) mostly don't have live
        explorers anymore — they render as dormant markers. Mainnet cards
        are clickable → live state. Polygon → PolygonScan.
</p> </section> <ul class="tokens" data-astro-cid-l33qsxch> ${tokens.map((t) => {
    const url = t.data.contract ? scanUrl(t.data.network, t.data.contract) : null;
    const netColor = t.data.network === "mainnet" ? "#185FA5" : t.data.network === "polygon" ? "#5F3DC4" : t.data.network === "unknown" ? "#5F5E5A" : "#C95019";
    return renderTemplate`<li class="token"${addAttribute(t.data.network, "data-network")}${addAttribute(t.data.contract ? "1" : "0", "data-has-contract")} data-astro-cid-l33qsxch> <div class="token__head" data-astro-cid-l33qsxch> <span class="token__ticker mono" data-astro-cid-l33qsxch>${t.data.ticker || "—"}</span> <span class="token__net mono"${addAttribute(`background: ${netColor}`, "style")} data-astro-cid-l33qsxch>${t.data.network.toUpperCase()}</span> </div> <h2 class="token__name" data-astro-cid-l33qsxch>${t.data.name}</h2> ${t.data.notes && renderTemplate`<p class="token__notes" data-astro-cid-l33qsxch>${t.data.notes}</p>`} <dl class="token__facts mono" data-astro-cid-l33qsxch> ${t.data.deployer && renderTemplate`<div data-astro-cid-l33qsxch><dt data-astro-cid-l33qsxch>DEPLOYER</dt><dd data-astro-cid-l33qsxch>${t.data.deployer.slice(0, 6)}…${t.data.deployer.slice(-4)}</dd></div>`} ${t.data.contract && renderTemplate`<div data-astro-cid-l33qsxch><dt data-astro-cid-l33qsxch>CONTRACT</dt><dd data-astro-cid-l33qsxch>${t.data.contract.slice(0, 6)}…${t.data.contract.slice(-4)}</dd></div>`} </dl> ${url ? renderTemplate`<a class="token__cta mono"${addAttribute(url, "href")} target="_blank" rel="noopener" data-astro-cid-l33qsxch>→ view on ${t.data.network === "polygon" ? "polygonscan" : "etherscan"}</a>` : t.data.contract ? renderTemplate`<span class="token__cta token__cta--dormant mono" data-astro-cid-l33qsxch>dormant · ${t.data.network} scanner deprecated</span>` : renderTemplate`<span class="token__cta token__cta--dormant mono" data-astro-cid-l33qsxch>no contract address in archive</span>`} </li>`;
  })} </ul> <section class="future" data-astro-cid-l33qsxch> <p class="kicker mono" data-astro-cid-l33qsxch>WHAT HAPPENS NEXT</p> <p data-astro-cid-l33qsxch> <a href="/poll/eth-legacy-story-next" data-astro-cid-l33qsxch>/poll/eth-legacy-story-next</a>
asks which of these tokens should get a dedicated PointCast block
        with the story behind it. Leader wins a cc-written editorial
        (author: mh+cc, sourced to Mike's recollection + the archive entry).
        Voters literally route which bits of the retrospective get written
        out first.
</p> </section> <section class="agent-strip" data-astro-cid-l33qsxch> <p class="agent-strip__label mono" data-astro-cid-l33qsxch>MACHINE-READABLE</p> <ul data-astro-cid-l33qsxch> <li data-astro-cid-l33qsxch><a href="/eth-legacy.json" data-astro-cid-l33qsxch>/eth-legacy.json</a></li> <li data-astro-cid-l33qsxch><a href="/poll/eth-legacy-story-next" data-astro-cid-l33qsxch>/poll/eth-legacy-story-next</a></li> <li data-astro-cid-l33qsxch><a href="/b/0278" data-astro-cid-l33qsxch>/b/0278 · the announcement</a></li> <li data-astro-cid-l33qsxch><a href="/for-agents" data-astro-cid-l33qsxch>/for-agents</a></li> </ul> </section> </main> ` })}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/eth-legacy.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/eth-legacy.astro";
const $$url = "/eth-legacy";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$EthLegacy,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
