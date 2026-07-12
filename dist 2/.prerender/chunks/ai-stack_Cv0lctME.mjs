import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead, b as addAttribute } from './prerender_CmTjnOuJ.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';

const $$AiStack = createComponent(($$result, $$props, $$slots) => {
  const TOOLS = [
    // ══ LANGUAGE · CHAT ══
    {
      name: "Claude",
      maker: "Anthropic",
      url: "https://claude.ai",
      category: "Language · chat",
      goodAt: "Long-form reasoning, writing that reads like writing, coding with context. Best-in-class at staying inside the intent of a multi-turn conversation.",
      reachFor: "Dispatches, technical docs, architectural debates, anything where tone + structure matter. Claude Code (the CLI) for engineering work with 1M-context.",
      avoidFor: "Image gen, video, real-time search-augmented answers.",
      mikesTake: "The default. Claude Opus 4.7 (1M) carries most of the PointCast code + content work.",
      pointcastUses: "Primary engineer (Claude Code), content co-author, Mike's daily chat.",
      tier: "daily"
    },
    {
      name: "ChatGPT",
      maker: "OpenAI",
      url: "https://chatgpt.com",
      category: "Language · chat",
      goodAt: "Broad general knowledge, consistent formatting, image+text multimodal, voice mode. The baseline.",
      reachFor: "Quick answers, formatted lists, scripts, voice conversations while walking.",
      avoidFor: "Long-form with persistent tone, highly specialized coding over many files.",
      mikesTake: "Strong. Different mouthfeel than Claude — ChatGPT feels more like a product, Claude more like a colleague. Both earn their keep.",
      pointcastUses: "Cross-check, image-prompt refinement, occasional voice brainstorms.",
      tier: "weekly"
    },
    {
      name: "Gemini",
      maker: "Google",
      url: "https://gemini.google.com",
      category: "Language · chat",
      goodAt: "Massive context windows (1M+ native). Google-grounded facts. Integrated search.",
      reachFor: "Ingesting very large documents. Research with real-time grounding.",
      avoidFor: "Creative writing with a strong voice — tends toward generic.",
      mikesTake: "Underrated for raw reading-of-huge-docs tasks. Voice stays bland.",
      pointcastUses: "Occasional — when a brief PDF or transcript is too large for Claude.",
      tier: "occasional"
    },
    {
      name: "DeepSeek",
      maker: "DeepSeek",
      url: "https://chat.deepseek.com",
      category: "Language · chat",
      goodAt: "Math, reasoning chains, coding. Best open-weights-ish model in the wild for problem-solving.",
      reachFor: "Algorithm reasoning, optimization puzzles, any problem where a long chain-of-thought helps.",
      avoidFor: "Creative writing with style. Tone is utilitarian.",
      mikesTake: "The moment when a non-US lab proved state of the art was real. Tried a bunch; DeepSeek R1 surprised.",
      pointcastUses: "Second opinion on tricky code diffs. Occasional.",
      tier: "occasional"
    },
    {
      name: "Kimi",
      maker: "Moonshot AI",
      url: "https://kimi.com",
      category: "Language · chat",
      goodAt: "Very long context (up to 2M tokens). Strong Chinese-language work. Good at document Q&A.",
      reachFor: "When you need to stuff an entire book into a single chat + ask structured questions.",
      avoidFor: "English-first creative writing; not the strongest voice.",
      mikesTake: "The context window is genuinely useful. Tried it for feeding whole repos.",
      pointcastUses: "Experimentally.",
      tier: "watching"
    },
    // ══ CODE ══
    {
      name: "Claude Code",
      maker: "Anthropic",
      url: "https://claude.com/claude-code",
      category: "Code · engineering",
      goodAt: "Multi-hour autonomous sessions with file system + shell access. 1M context retains whole-repo understanding.",
      reachFor: "Shipping features end-to-end. Reading + editing dozens of files. Running build/test loops.",
      avoidFor: "Nothing for us — this is the engine.",
      mikesTake: `The agent that wrote 90% of the code you're looking at. Signed blocks as "Claude Code" in the VISIT channel.`,
      pointcastUses: "Primary engineer. All day.",
      tier: "daily"
    },
    {
      name: "Codex",
      maker: "OpenAI",
      url: "https://openai.com/codex",
      category: "Code · engineering",
      goodAt: "Independent code review. Alternative UI passes. Opinionated critiques.",
      reachFor: "Second-pair-of-eyes on a Claude Code diff. Reviewing PRs before merge.",
      avoidFor: "Long autonomous sessions — concurrent xhigh runs silently hang (observed on PointCast 2026-04-17). Medium reasoning, serial only.",
      mikesTake: "Complementary, not competitive. Use for review, not for shipping.",
      pointcastUses: "Reviewer role. Wrote battle.astro's Phase 2 pass.",
      tier: "weekly"
    },
    {
      name: "Cursor",
      maker: "Anysphere",
      url: "https://cursor.com",
      category: "Code · engineering",
      goodAt: "Editor-integrated AI completions + chat. Real-time multi-file context in a familiar IDE shape.",
      reachFor: "Traditional IDE-first workflows where you want AI assists inline.",
      avoidFor: "When you want the model to actually run commands + iterate.",
      mikesTake: "Great for devs who prefer not leaving VSCode. PointCast leans more CLI.",
      pointcastUses: "Occasional.",
      tier: "occasional"
    },
    // ══ IMAGE ══
    {
      name: "Midjourney",
      maker: "Midjourney",
      url: "https://midjourney.com",
      category: "Image · generation",
      goodAt: "Painterly quality. Strong aesthetic defaults. Reliable composition. Prompt weighting syntax is mature.",
      reachFor: "Hero imagery, dispatch cover art, anything where you want the output to feel like it was made on purpose.",
      avoidFor: "Text inside images (weak), precise logo work, photoreal portraits of specific people.",
      mikesTake: "The best image model for *aesthetic* intent. v7 got even better. Discord-only workflow is dated but tolerable.",
      pointcastUses: "Dispatch hero images (when we have them). Cover art experiments.",
      tier: "weekly"
    },
    {
      name: "Ideogram",
      maker: "Ideogram AI",
      url: "https://ideogram.ai",
      category: "Image · generation",
      goodAt: "Typography inside images. Nails text-in-graphics where Midjourney stumbles. Clean vector-feel output.",
      reachFor: "Anything with words on it — posters, social cards, logotype sketches, magazine-style covers.",
      avoidFor: "Painterly / stylized outputs — Midjourney wins there.",
      mikesTake: "The text model. Uses it anytime a composition needs legible words.",
      pointcastUses: "Typographic experiments, block cover drafts with words.",
      tier: "weekly"
    },
    {
      name: "Flux",
      maker: "Black Forest Labs",
      url: "https://blackforestlabs.ai",
      category: "Image · generation",
      goodAt: "Photoreal. Open weights variant available. Fast.",
      reachFor: "When you need a photo-ish rendering and want to run it locally or via an API.",
      avoidFor: "Strong aesthetic direction out of the box — feels more utility than art.",
      mikesTake: "Underrated. The Schnell variant is genuinely fast.",
      pointcastUses: "Occasional.",
      tier: "occasional"
    },
    {
      name: "DALL-E / gpt-image",
      maker: "OpenAI",
      url: "https://chatgpt.com",
      category: "Image · generation",
      goodAt: "Integrated with ChatGPT — iterate on an image via conversation. Good at following precise instructions.",
      reachFor: "Quick one-offs inside a ChatGPT session, iterative refinement.",
      avoidFor: "Aesthetic depth — Midjourney outclasses here.",
      mikesTake: "Convenient but not the go-to for hero art.",
      pointcastUses: "Quick mockups.",
      tier: "occasional"
    },
    // ══ VIDEO ══
    {
      name: "Runway",
      maker: "Runway",
      url: "https://runwayml.com",
      category: "Video · generation",
      goodAt: "Image-to-video, text-to-video, motion brush, green-screen extraction. The toolkit for creative video work.",
      reachFor: "Turn a Midjourney still into a 4-10 second video clip. Loopable atmospheric shots.",
      avoidFor: "Long-form coherent video. Multi-shot scenes. Lip-sync.",
      mikesTake: "Gen-4 is the current favorite. Price is the bottleneck for volume.",
      pointcastUses: "Experimental video content — not yet on PointCast, but will be for WATCH blocks.",
      tier: "occasional"
    },
    {
      name: "Sora",
      maker: "OpenAI",
      url: "https://sora.com",
      category: "Video · generation",
      goodAt: "Longer, more coherent shots. Strong physics simulation. Multi-subject composition.",
      reachFor: "Short narrative clips. Physics-heavy scenes (water, fabric, crowds).",
      avoidFor: "Fine control — Runway has better editing tools on top.",
      mikesTake: "The coherence bar moved with Sora. Tight rollout limits it for now.",
      pointcastUses: "Tried experimentally.",
      tier: "watching"
    },
    {
      name: "Kling",
      maker: "Kuaishou",
      url: "https://klingai.com",
      category: "Video · generation",
      goodAt: "Fast, cheap, decent quality. Competitive with Runway at a fraction of the price.",
      reachFor: "High-volume iteration before committing to a final Runway render.",
      avoidFor: "Peak quality for showcase work.",
      mikesTake: "Worth trying. The price-performance is real.",
      pointcastUses: "Occasional.",
      tier: "occasional"
    },
    {
      name: "Pika",
      maker: "Pika Labs",
      url: "https://pika.art",
      category: "Video · generation",
      goodAt: 'Playful, stylized video. Strong "modifier" features (lip-sync, pan, zoom).',
      reachFor: "Fun/stylized clips. Not attempting photoreal.",
      avoidFor: "Photoreal — that is Runway/Sora territory.",
      mikesTake: "The character-style generator in the video category.",
      pointcastUses: "Experimental.",
      tier: "occasional"
    },
    // ══ RESEARCH / SEARCH ══
    {
      name: "Perplexity",
      maker: "Perplexity",
      url: "https://perplexity.ai",
      category: "Research · search",
      goodAt: "Search-grounded answers with citations. Fast summarization of current events.",
      reachFor: "Any question where you need today's answer, not a 2024 answer.",
      avoidFor: "Deep reasoning — it prefers fast synthesis over depth.",
      mikesTake: 'The replacement for "I google this then open 5 tabs and read."',
      pointcastUses: "Daily for research, fact-checking, Tezos ecosystem updates.",
      tier: "daily"
    },
    {
      name: "Claude · web search",
      maker: "Anthropic",
      url: "https://claude.ai",
      category: "Research · search",
      goodAt: "Deeper-reasoning web search inside a long Claude session.",
      reachFor: "When you're mid-convo with Claude and need a fact added mid-stream.",
      avoidFor: "Speed-optimized search — Perplexity is faster.",
      mikesTake: "The search feels integrated rather than bolted on.",
      pointcastUses: "Inside Claude Code sessions for live API docs, etc.",
      tier: "weekly"
    },
    // ══ AGENTS / COMPUTER USE ══
    {
      name: "Manus",
      maker: "Manus",
      url: "https://manus.im",
      category: "Agent · computer use",
      goodAt: "Real browser sessions. Logged-in operations. End-to-end workflows a UI requires.",
      reachFor: "GSC registration, deploy settings, social posting, objkt admin, anything with authentication walls.",
      avoidFor: "Code engineering — different stack.",
      mikesTake: "The operations agent. Does the things Claude Code can't reach.",
      pointcastUses: "Ops lane — see docs/briefs/*-manus-*.md for current queue.",
      tier: "weekly"
    },
    {
      name: "Claude Agent (Anthropic)",
      maker: "Anthropic",
      url: "https://docs.claude.com/en/agents",
      category: "Agent · computer use",
      goodAt: "Sub-agent spawning from within Claude Code for parallel work. Structured tool-use patterns.",
      reachFor: "Delegating research or review inside a larger Claude Code session.",
      avoidFor: "Outside-application workflows.",
      mikesTake: "Underused so far. Probably the next area to explore for multi-agent ops inside the same session.",
      pointcastUses: "Experimentally within Claude Code.",
      tier: "occasional"
    },
    {
      name: "OpenAI Operator / Computer Use",
      maker: "OpenAI",
      url: "https://openai.com/operator",
      category: "Agent · computer use",
      goodAt: "GUI-driven web tasks with OpenAI models behind it.",
      reachFor: "If you're already in the OpenAI ecosystem.",
      avoidFor: "Complex flows — Manus is more production-ready in our experience.",
      mikesTake: "Worth trying; Manus is the lead so far.",
      pointcastUses: "Tested; not adopted.",
      tier: "watching"
    },
    // ══ AUDIO / VOICE ══
    {
      name: "ElevenLabs",
      maker: "ElevenLabs",
      url: "https://elevenlabs.io",
      category: "Audio · voice",
      goodAt: "Voice cloning. Text-to-speech that passes for human. Multilingual.",
      reachFor: "Audio dispatches. Narration.",
      avoidFor: "Music composition.",
      mikesTake: "The voice model. v3 is borderline indistinguishable.",
      pointcastUses: "Experimental — no PointCast voice dispatches yet.",
      tier: "occasional"
    },
    {
      name: "Suno",
      maker: "Suno",
      url: "https://suno.com",
      category: "Audio · music",
      goodAt: "Song generation — music + vocals from a prompt. Fast iteration.",
      reachFor: "Jingles, bed music, quick demo tracks.",
      avoidFor: "Professional studio production.",
      mikesTake: "The Violent Crimes Noun-voice tribute (Block 0219) was partially this.",
      pointcastUses: "Experimental.",
      tier: "occasional"
    },
    {
      name: "Hume AI",
      maker: "Hume",
      url: "https://hume.ai",
      category: "Audio · voice",
      goodAt: "Emotionally expressive voice with detected prosody. Conversational AI that matches your emotional tone.",
      reachFor: "When voice UX matters more than textual accuracy.",
      avoidFor: "Simple TTS — overkill.",
      mikesTake: "Watching. Use case is narrower than ElevenLabs but specific.",
      pointcastUses: "Watching.",
      tier: "watching"
    }
  ];
  const categories = Array.from(new Set(TOOLS.map((t) => t.category)));
  const tierOrder = ["daily", "weekly", "occasional", "watching"];
  function tierLabel(t) {
    const labels = {
      daily: "DAILY",
      weekly: "WEEKLY",
      occasional: "OCCASIONAL",
      watching: "WATCHING"
    };
    return labels[t] ?? t.toUpperCase();
  }
  const byCategory = {};
  for (const t of TOOLS) {
    byCategory[t.category] = byCategory[t.category] ?? [];
    byCategory[t.category].push(t);
  }
  for (const cat of Object.keys(byCategory)) {
    byCategory[cat].sort((a, b) => tierOrder.indexOf(a.tier) - tierOrder.indexOf(b.tier));
  }
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    "@id": "https://pointcast.xyz/ai-stack",
    name: "PointCast AI stack — best-practices guide",
    description: `What AI tools PointCast uses, what each is good at, when to reach for them. ${TOOLS.length} tools documented across ${categories.length} categories.`,
    url: "https://pointcast.xyz/ai-stack"
  };
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": "AI stack", "description": `Best-practices guide to the AI tools PointCast uses — what each is good at, when to reach for them. ${TOOLS.length} tools across ${categories.length} categories.`, "image": "/images/og/ai-stack.png", "jsonLd": jsonLd, "alternates": [{ type: "application/json", href: "/ai-stack.json", title: "AI stack (JSON)" }], "data-astro-cid-7g2ctger": true }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="page" data-astro-cid-7g2ctger> <nav class="crumb" data-astro-cid-7g2ctger> <a href="/" data-astro-cid-7g2ctger>Home</a> <span aria-hidden="true" data-astro-cid-7g2ctger>›</span> <span data-astro-cid-7g2ctger>ai-stack</span> </nav> <header class="hero" data-astro-cid-7g2ctger> <p class="kicker" data-astro-cid-7g2ctger>AI STACK · BEST PRACTICES · ${TOOLS.length} TOOLS</p> <h1 class="display" data-astro-cid-7g2ctger>What we reach for.</h1> <p class="dek" data-astro-cid-7g2ctger>
A hand-curated working list. Not a directory. What each AI tool
        is good at, when to reach for it, when not to. Opinionated —
        this is our stack, not your stack. Take what's useful.
</p> </header> <section class="legend" data-astro-cid-7g2ctger> <p class="legend__label mono" data-astro-cid-7g2ctger>USAGE TIER</p> <ul data-astro-cid-7g2ctger> <li data-astro-cid-7g2ctger><span class="tag tag--daily" data-astro-cid-7g2ctger>DAILY</span> — core tool, reached for constantly</li> <li data-astro-cid-7g2ctger><span class="tag tag--weekly" data-astro-cid-7g2ctger>WEEKLY</span> — routine use for specific tasks</li> <li data-astro-cid-7g2ctger><span class="tag tag--occasional" data-astro-cid-7g2ctger>OCCASIONAL</span> — when the job calls for it</li> <li data-astro-cid-7g2ctger><span class="tag tag--watching" data-astro-cid-7g2ctger>WATCHING</span> — tested, not yet adopted</li> </ul> </section> ${Object.keys(byCategory).map((cat) => renderTemplate`<section class="category" data-astro-cid-7g2ctger> <header class="category__head" data-astro-cid-7g2ctger> <h2 class="category__title" data-astro-cid-7g2ctger>${cat}</h2> <p class="category__count mono" data-astro-cid-7g2ctger>${byCategory[cat].length} tools</p> </header> <div class="tools" data-astro-cid-7g2ctger> ${byCategory[cat].map((t) => renderTemplate`<article${addAttribute(`tool tool--${t.tier}`, "class")} data-astro-cid-7g2ctger> <header class="tool__head" data-astro-cid-7g2ctger> <span${addAttribute(`tag tag--${t.tier}`, "class")} data-astro-cid-7g2ctger>${tierLabel(t.tier)}</span> ${t.url ? renderTemplate`<h3 class="tool__name" data-astro-cid-7g2ctger><a${addAttribute(t.url, "href")} target="_blank" rel="noopener" data-astro-cid-7g2ctger>${t.name} ↗</a></h3>` : renderTemplate`<h3 class="tool__name" data-astro-cid-7g2ctger>${t.name}</h3>`} <span class="tool__maker mono" data-astro-cid-7g2ctger>${t.maker}</span> </header> <dl class="tool__facts" data-astro-cid-7g2ctger> <div data-astro-cid-7g2ctger> <dt class="mono" data-astro-cid-7g2ctger>GOOD AT</dt> <dd data-astro-cid-7g2ctger>${t.goodAt}</dd> </div> <div data-astro-cid-7g2ctger> <dt class="mono" data-astro-cid-7g2ctger>REACH FOR</dt> <dd data-astro-cid-7g2ctger>${t.reachFor}</dd> </div> ${t.avoidFor && renderTemplate`<div data-astro-cid-7g2ctger> <dt class="mono" data-astro-cid-7g2ctger>AVOID FOR</dt> <dd data-astro-cid-7g2ctger>${t.avoidFor}</dd> </div>`} ${t.mikesTake && renderTemplate`<div data-astro-cid-7g2ctger> <dt class="mono" data-astro-cid-7g2ctger>MH TAKE</dt> <dd class="tool__take" data-astro-cid-7g2ctger>${t.mikesTake}</dd> </div>`} ${t.pointcastUses && renderTemplate`<div data-astro-cid-7g2ctger> <dt class="mono" data-astro-cid-7g2ctger>POINTCAST</dt> <dd data-astro-cid-7g2ctger>${t.pointcastUses}</dd> </div>`} </dl> </article>`)} </div> </section>`)} <section class="principles" data-astro-cid-7g2ctger> <p class="kicker" data-astro-cid-7g2ctger>PRINCIPLES · HOW WE PICK</p> <ol data-astro-cid-7g2ctger> <li data-astro-cid-7g2ctger><strong data-astro-cid-7g2ctger>Voice fit first.</strong> Claude reads like a colleague. ChatGPT reads like a product. Pick the one whose voice aligns with how you think.</li> <li data-astro-cid-7g2ctger><strong data-astro-cid-7g2ctger>Use the best model for the job, not the one in the subscription.</strong> Pay for two at once if that's what the work needs. A bad output on the wrong model costs more than the second sub.</li> <li data-astro-cid-7g2ctger><strong data-astro-cid-7g2ctger>Code needs tool-use, not just completion.</strong> Claude Code over Claude-the-chat for anything spanning files.</li> <li data-astro-cid-7g2ctger><strong data-astro-cid-7g2ctger>Image aesthetics ≠ image function.</strong> Midjourney for feel, Ideogram for text, Flux for photo.</li> <li data-astro-cid-7g2ctger><strong data-astro-cid-7g2ctger>Video is in its Sora-moment.</strong> Coherence is moving fast. Experiment quarterly — the leader shifts.</li> <li data-astro-cid-7g2ctger><strong data-astro-cid-7g2ctger>Agents are a layer, not a product.</strong> Manus for ops, Claude Code for engineering, Codex for review. Different stacks, same workflow.</li> </ol> </section> <aside class="surfaces" data-astro-cid-7g2ctger> <p class="kicker" data-astro-cid-7g2ctger>RELATED</p> <ul class="surfaces__list" data-astro-cid-7g2ctger> <li data-astro-cid-7g2ctger><a href="/stack" data-astro-cid-7g2ctger><span class="mono" data-astro-cid-7g2ctger>TECH</span> /stack</a></li> <li data-astro-cid-7g2ctger><a href="/manifesto" data-astro-cid-7g2ctger><span class="mono" data-astro-cid-7g2ctger>CANON</span> /manifesto</a></li> <li data-astro-cid-7g2ctger><a href="/for-agents" data-astro-cid-7g2ctger><span class="mono" data-astro-cid-7g2ctger>AGENTS</span> /for-agents</a></li> <li data-astro-cid-7g2ctger><a href="/ai-stack.json" data-astro-cid-7g2ctger><span class="mono" data-astro-cid-7g2ctger>JSON</span> /ai-stack.json</a></li> </ul> </aside> </div> ` })}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/ai-stack.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/ai-stack.astro";
const $$url = "/ai-stack";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$AiStack,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
