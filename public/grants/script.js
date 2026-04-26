/**
 * PointCast.xyz - Grant Strategy Desk
 */

(function () {
    "use strict";

    const targets = [
        {
            name: "OpenAI Grants",
            priority: "P1",
            tags: ["ai", "credits", "public-goods"],
            ask: "API credits or targeted grant support.",
            fit: "Pitch PointCast as an AI-native media workflow that turns model usage into inspectable public artifacts, demos, and documentation.",
            next: "Prepare a Codex/OpenAI workflow demo and a credits budget.",
            url: "https://grants.openai.com/"
        },
        {
            name: "OpenAI Codex Open Source Fund",
            priority: "P1",
            tags: ["ai", "open-source", "tooling"],
            ask: "Up to $25k API credits when the work qualifies.",
            fit: "Best angle: open-source PointCast channel tooling, templates, and docs that show Codex-assisted building in the wild.",
            next: "Publish a repo map, issues, and a three-milestone open-source plan.",
            url: "https://openai.com/form/codex-open-source-fund/"
        },
        {
            name: "Anthropic Startup Program",
            priority: "P1",
            tags: ["ai", "startup", "credits"],
            ask: "Claude API credits, rate limits, or startup resources.",
            fit: "Frame Claude as a research, writing, and coding collaborator inside a repeatable creator/media production system.",
            next: "Show Claude usage, traction, and why higher limits unlock measurable output.",
            url: "https://www.anthropic.com/startup-program-official-terms"
        },
        {
            name: "Tezos Ecosystem Grants",
            priority: "P1",
            tags: ["crypto", "creator", "art"],
            ask: "Milestone grant for Tezos-native media objects or creator tooling.",
            fit: "Tezos has a strong art and experimental culture story. PointCast can make Tezos broadcasts, tokenized episodes, and educational launch pages.",
            next: "Submit a quarterly proposal with technical plan, roadmap, team note, and ecosystem value.",
            url: "https://tezos.foundation/ecosystem-grants-program/"
        },
        {
            name: "Ethereum Ecosystem Support",
            priority: "P2",
            tags: ["crypto", "public-goods", "tooling"],
            ask: "Public-good grant for open-source tooling, education, or community resources.",
            fit: "Position PointCast as a lightweight public-good broadcast layer for Ethereum explainers, grant transparency, and local community channels.",
            next: "Scope the request around open-source outputs and measurable community reuse.",
            url: "https://ethereum.org/community/grants/"
        },
        {
            name: "Solana Foundation Funding",
            priority: "P2",
            tags: ["crypto", "creator", "public-goods"],
            ask: "Grant or ecosystem funding for fast consumer crypto experiments.",
            fit: "Pitch quick public demos around creator distribution, mobile-friendly channels, and open-source components that help the Solana ecosystem learn.",
            next: "Adapt the same pilot to Solana speed, consumer UX, and public-good criteria.",
            url: "https://solana.org/grants-funding"
        },
        {
            name: "Zora Ecosystem",
            priority: "P2",
            tags: ["creator", "crypto", "media"],
            ask: "Partnership, ecosystem support, or creator economy collaboration.",
            fit: "Zora is less of a classic grants page and more of a creator network fit: PointCast can create coinable broadcast identities and media drops.",
            next: "Build a Zora-native sample channel and use it as outreach material.",
            url: "https://zora.co/about"
        },
        {
            name: "Y Combinator",
            priority: "P3",
            tags: ["startup", "ai", "company"],
            ask: "Accelerator investment, not a grant.",
            fit: "Convert the strategy into a startup application: who wants AI-native broadcast channels, why now, and what grows into a company.",
            next: "Draft answers using YC's current RFS as validation, not as the whole thesis.",
            url: "https://www.ycombinator.com/rfs/"
        },
        {
            name: "Local and Cultural Funds",
            priority: "P3",
            tags: ["creator", "public-goods", "media"],
            ask: "Microgrants for community media, art, education, and digital culture.",
            fit: "PointCast can produce public local channels, digital posters, explainers, and workshops with clear community benefit.",
            next: "Make a reusable city/culture version of the packet after the AI and protocol pass.",
            url: "https://pointcast.xyz/"
        }
    ];

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function updateDateTime() {
        const now = new Date();
        const timeEl = document.getElementById("currentTime");
        const dateEl = document.getElementById("currentDate");
        const lastUpdate = document.getElementById("lastUpdate");

        if (timeEl) {
            timeEl.textContent = now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
        }

        if (dateEl) {
            dateEl.textContent = now.toLocaleDateString([], {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric"
            });
        }

        if (lastUpdate) {
            lastUpdate.textContent = now.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
        }
    }

    function initTicker() {
        const ticker = document.getElementById("tickerContent");
        if (!ticker) return;
        ticker.innerHTML += ticker.innerHTML;
    }

    function renderTargets(filter = "all", query = "") {
        const grid = document.getElementById("targetGrid");
        const count = document.getElementById("targetCount");
        if (!grid) return;

        const normalizedQuery = query.trim().toLowerCase();
        const filtered = targets.filter((target) => {
            const matchesFilter = filter === "all" || target.tags.includes(filter);
            const searchable = [
                target.name,
                target.priority,
                target.ask,
                target.fit,
                target.next,
                target.tags.join(" ")
            ].join(" ").toLowerCase();
            return matchesFilter && (!normalizedQuery || searchable.includes(normalizedQuery));
        });

        grid.innerHTML = filtered.map((target) => `
            <article class="target-card">
                <header>
                    <h3>${escapeHtml(target.name)}</h3>
                    <span class="priority">${escapeHtml(target.priority)}</span>
                </header>
                <div class="target-meta">
                    ${target.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}
                </div>
                <p><strong>Ask:</strong> ${escapeHtml(target.ask)}</p>
                <p class="fit"><strong>Fit:</strong> ${escapeHtml(target.fit)}</p>
                <p><strong>Next:</strong> ${escapeHtml(target.next)}</p>
                <a href="${escapeHtml(target.url)}" target="_blank" rel="noreferrer">Open program link</a>
            </article>
        `).join("");

        if (count) {
            count.textContent = filtered.length === 1 ? "1 target" : filtered.length + " targets";
        }
    }

    function initFilters() {
        const chips = Array.from(document.querySelectorAll(".chip"));
        const search = document.getElementById("targetSearch");
        let activeFilter = "all";

        chips.forEach((chip) => {
            chip.addEventListener("click", () => {
                chips.forEach((item) => item.classList.remove("active"));
                chip.classList.add("active");
                activeFilter = chip.dataset.filter || "all";
                renderTargets(activeFilter, search ? search.value : "");
            });
        });

        if (search) {
            search.addEventListener("input", () => {
                renderTargets(activeFilter, search.value);
            });
        }
    }

    function initCommands() {
        document.querySelectorAll("[data-scroll]").forEach((button) => {
            button.addEventListener("click", () => {
                const target = document.getElementById(button.dataset.scroll);
                if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
            });
        });

        document.querySelectorAll("[data-command]").forEach((button) => {
            button.addEventListener("click", () => {
                if (button.dataset.command === "print") {
                    window.print();
                }

                if (button.dataset.command === "screensaver") {
                    const saver = document.getElementById("screensaver");
                    if (saver) saver.classList.add("active");
                }
            });
        });

        const saver = document.getElementById("screensaver");
        if (saver) {
            saver.addEventListener("click", () => saver.classList.remove("active"));
        }
    }

    function initKeyboardShortcuts() {
        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape") {
                const saver = document.getElementById("screensaver");
                if (saver) saver.classList.remove("active");
            }

            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "f") {
                const search = document.getElementById("targetSearch");
                if (search) {
                    event.preventDefault();
                    search.focus();
                }
            }
        });
    }

    document.addEventListener("DOMContentLoaded", () => {
        updateDateTime();
        setInterval(updateDateTime, 60000);
        initTicker();
        renderTargets();
        initFilters();
        initCommands();
        initKeyboardShortcuts();
    });
})();
