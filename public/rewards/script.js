/**
 * PointCast.xyz - Tasks And Rewards
 */

(function () {
    "use strict";

    const tasks = [
        {
            name: "Collect one live block",
            band: "Small",
            tags: ["collect"],
            reward: "5 POINT",
            proof: "Wallet or collection URL.",
            path: "/collect/"
        },
        {
            name: "Collect a full mini-set",
            band: "Medium",
            tags: ["collect"],
            reward: "50 POINT",
            proof: "Three or more related collection receipts.",
            path: "/collect/"
        },
        {
            name: "Enter /here and leave a useful trace",
            band: "Small",
            tags: ["rooms"],
            reward: "10 POINT",
            proof: "Presence screenshot, ping, or room note.",
            path: "/here/"
        },
        {
            name: "Run a Gandalf quest",
            band: "Medium",
            tags: ["rooms", "testing"],
            reward: "75 POINT",
            proof: "Prompt, output, and one paragraph result report.",
            path: "/gandalf/"
        },
        {
            name: "Play Drum v7 and report latency",
            band: "Small",
            tags: ["rooms", "testing"],
            reward: "10 POINT",
            proof: "Screenshot plus device/browser note.",
            path: "/drum-v7/"
        },
        {
            name: "Find a real bug",
            band: "Medium",
            tags: ["testing"],
            reward: "100 POINT",
            proof: "Reproduction steps, expected behavior, actual behavior.",
            path: "/ping/"
        },
        {
            name: "Submit a grant target",
            band: "Medium",
            tags: ["grants"],
            reward: "75 POINT",
            proof: "Program URL, fit summary, deadline, ask angle.",
            path: "/grants/"
        },
        {
            name: "Draft a grant packet section",
            band: "Large",
            tags: ["grants"],
            reward: "350 POINT",
            proof: "Reusable paragraph, budget, milestone, or evidence appendix.",
            path: "/grants/"
        },
        {
            name: "Remix a PointCast block",
            band: "Medium",
            tags: ["collect", "rooms"],
            reward: "100 POINT",
            proof: "Link to remix, screenshot, or published derivative.",
            path: "/blocks.json"
        },
        {
            name: "Write a room guide",
            band: "Large",
            tags: ["rooms", "grants"],
            reward: "500 POINT",
            proof: "Public guide that helps another person complete a task.",
            path: "/room/"
        },
        {
            name: "Test token claim flow",
            band: "Large",
            tags: ["testing", "collect"],
            reward: "750 POINT",
            proof: "Wallet, transaction, failure notes, and UX report.",
            path: "/marketplace/"
        },
        {
            name: "Ship an accepted PR",
            band: "Large",
            tags: ["testing", "grants"],
            reward: "1,000 POINT",
            proof: "Merged GitHub PR with short changelog note.",
            path: "https://github.com/MikeHoydich/pointcast"
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
        if (ticker) ticker.innerHTML += ticker.innerHTML;
    }

    function renderTasks(filter = "all", query = "") {
        const grid = document.getElementById("taskGrid");
        const count = document.getElementById("taskCount");
        if (!grid) return;

        const normalizedQuery = query.trim().toLowerCase();
        const filtered = tasks.filter((task) => {
            const matchesFilter = filter === "all" || task.tags.includes(filter);
            const searchable = [task.name, task.band, task.reward, task.proof, task.tags.join(" ")].join(" ").toLowerCase();
            return matchesFilter && (!normalizedQuery || searchable.includes(normalizedQuery));
        });

        grid.innerHTML = filtered.map((task) => `
            <article class="target-card">
                <header>
                    <h3>${escapeHtml(task.name)}</h3>
                    <span class="priority">${escapeHtml(task.band)}</span>
                </header>
                <div class="target-meta">
                    ${task.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}
                </div>
                <p><strong>Reward:</strong> ${escapeHtml(task.reward)}</p>
                <p class="fit"><strong>Proof:</strong> ${escapeHtml(task.proof)}</p>
                <a href="${escapeHtml(task.path)}"${task.path.startsWith("http") ? ' target="_blank" rel="noreferrer"' : ""}>Open task path</a>
            </article>
        `).join("");

        if (count) {
            count.textContent = filtered.length === 1 ? "1 task" : filtered.length + " tasks";
        }
    }

    function initFilters() {
        const chips = Array.from(document.querySelectorAll(".chip"));
        const search = document.getElementById("taskSearch");
        let activeFilter = "all";

        chips.forEach((chip) => {
            chip.addEventListener("click", () => {
                chips.forEach((item) => item.classList.remove("active"));
                chip.classList.add("active");
                activeFilter = chip.dataset.filter || "all";
                renderTasks(activeFilter, search ? search.value : "");
            });
        });

        if (search) {
            search.addEventListener("input", () => renderTasks(activeFilter, search.value));
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
                if (button.dataset.command === "print") window.print();
                if (button.dataset.command === "screensaver") {
                    const saver = document.getElementById("screensaver");
                    if (saver) saver.classList.add("active");
                }
            });
        });

        const saver = document.getElementById("screensaver");
        if (saver) saver.addEventListener("click", () => saver.classList.remove("active"));
    }

    document.addEventListener("DOMContentLoaded", () => {
        updateDateTime();
        setInterval(updateDateTime, 60000);
        initTicker();
        renderTasks();
        initFilters();
        initCommands();
    });
})();
