/**
 * Home.tsx — PointCast Share-Card Generator Demo
 *
 * Interactive demo showcasing all 5 share-card presets.
 * Design: paper/cream editorial, type-heavy, warm accent.
 */

import { ShareCardButton } from "@/components/ShareCardModal";
import type { ShareCardEvent } from "@/lib/share-card";

// ─── Demo Events ──────────────────────────────────────────────────────────────

const DEMO_EVENTS: Array<{
  label: string;
  description: string;
  event: ShareCardEvent;
}> = [
  {
    label: "User Milestone",
    description: "Fires when a user crosses a drum threshold (100 / 1k / 10k).",
    event: {
      type: "user_milestone",
      title: "You just hit 100 drums!",
      stat: "100",
      subtitle: "Keep the beat going — you're on a roll.",
      date: "Apr 17, 2026",
    },
  },
  {
    label: "Mint Receipt",
    description: "Shown on the collect success screen after a Noun is minted.",
    event: {
      type: "mint_receipt",
      title: "You minted Visit Noun",
      stat: "342",
      subtitle: "Collected on PointCast",
      nounId: 342,
      date: "Apr 17, 2026",
      meta: {
        "Noun": "#342",
        "Network": "Base",
        "Tx": "0xabc…def",
      },
    },
  },
  {
    label: "Leaderboard",
    description: "Daily top-drummer announcement card.",
    event: {
      type: "leaderboard",
      title: "Today's top drummer: kana",
      stat: "847",
      subtitle: "Crowned on PointCast daily leaderboard",
      date: "Apr 17, 2026",
    },
  },
  {
    label: "Platform Milestone",
    description: "Broadcast when the platform crosses a collective drum count.",
    event: {
      type: "platform_milestone",
      title: "PointCast reached 10,000 total drums",
      stat: "10,000",
      subtitle: "The community keeps drumming. Thank you.",
      date: "Apr 17, 2026",
    },
  },
  {
    label: "Weekly Recap",
    description: "End-of-week summary shared by the platform or individual users.",
    event: {
      type: "weekly_recap",
      title: "Week of April 13, 2026",
      stat: "1,247",
      subtitle: "Another strong week on PointCast.",
      date: "Apr 17 – Apr 23, 2026",
      meta: {
        "Drums": "1,247",
        "Visitors": "89",
        "Top Noun": "#127",
        "New Users": "14",
        "Mints": "6",
        "Streak": "7 days",
      },
    },
  },
];

// ─── Badge colours per type ───────────────────────────────────────────────────

const TYPE_COLOR: Record<string, string> = {
  user_milestone: "#c94d2c",
  mint_receipt: "#2c6ec9",
  leaderboard: "#2c9c5a",
  platform_milestone: "#7c4dc9",
  weekly_recap: "#c9952c",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function Home() {
  return (
    <div className="pc-page">
      {/* ── Nav ── */}
      <header className="pc-nav">
        <div className="pc-nav-inner">
          <span className="pc-wordmark">
            <span className="pc-wordmark-point">POINT</span>
            <span className="pc-wordmark-cast">CAST</span>
          </span>
          <span className="pc-nav-tag">Share-Card Generator</span>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="pc-hero">
        <div className="pc-hero-inner">
          <p className="pc-hero-eyebrow">Client-side · Canvas 2D · 1024 × 1024 PNG</p>
          <h1 className="pc-hero-title">
            Turn any moment<br />into a share card.
          </h1>
          <p className="pc-hero-sub">
            Five layout presets for milestones, mints, leaderboards, and weekly recaps.
            Pure browser rendering — no server, no external fonts, instant export.
          </p>
        </div>
      </section>

      {/* ── Preset Grid ── */}
      <section className="pc-presets">
        <div className="pc-presets-inner">
          <h2 className="pc-section-title">5 Layout Presets</h2>
          <p className="pc-section-sub">
            Click any card to generate and preview the 1024 × 1024 PNG, then save, copy, or share.
          </p>

          <div className="pc-grid">
            {DEMO_EVENTS.map(({ label, description, event }) => (
              <article key={event.type} className="pc-card">
                <div className="pc-card-header">
                  <span
                    className="pc-type-badge"
                    style={{ background: TYPE_COLOR[event.type] }}
                  >
                    {event.type.replace(/_/g, " ")}
                  </span>
                </div>
                <h3 className="pc-card-title">{label}</h3>
                <p className="pc-card-desc">{description}</p>

                <div className="pc-card-event">
                  <div className="pc-event-row">
                    <span className="pc-event-key">title</span>
                    <span className="pc-event-val">{event.title}</span>
                  </div>
                  <div className="pc-event-row">
                    <span className="pc-event-key">stat</span>
                    <span className="pc-event-val pc-event-stat">{event.stat}</span>
                  </div>
                  {event.nounId != null && (
                    <div className="pc-event-row">
                      <span className="pc-event-key">nounId</span>
                      <span className="pc-event-val">#{event.nounId}</span>
                    </div>
                  )}
                </div>

                <div className="pc-card-footer">
                  <ShareCardButton
                    event={event}
                    label="Generate & Share"
                    className="pc-generate-btn"
                  />
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── API Reference ── */}
      <section className="pc-api">
        <div className="pc-api-inner">
          <h2 className="pc-section-title">API Reference</h2>
          <p className="pc-section-sub">
            Drop <code>generateShareCard()</code> anywhere in your PointCast codebase.
          </p>

          <div className="pc-code-block">
            <div className="pc-code-label">share-card.ts — core call</div>
            <pre className="pc-pre">{`import { generateShareCard } from "@/lib/share-card";

const blob = await generateShareCard({
  type: "user_milestone",
  title: "You just hit 100 drums!",
  stat: "100",
  subtitle: "Keep the beat going.",
  date: "Apr 17, 2026",
});

// blob → PNG Blob, ready for download or Web Share API`}</pre>
          </div>

          <div className="pc-code-block">
            <div className="pc-code-label">React — drop-in button</div>
            <pre className="pc-pre">{`import { ShareCardButton } from "@/components/ShareCardModal";

<ShareCardButton
  event={{
    type: "mint_receipt",
    title: "You minted Visit Noun",
    stat: "342",
    nounId: 342,
    date: "Apr 17, 2026",
  }}
  label="Share Mint"
/>`}</pre>
          </div>

          <div className="pc-code-block">
            <div className="pc-code-label">Astro — data-* attribute pattern</div>
            <pre className="pc-pre">{`<!-- ShareCardButton.astro -->
---
import { ShareCardButton } from "@/components/ShareCardModal";
const { type, title, stat, nounId, date } = Astro.props;
---
<ShareCardButton
  client:load
  event={{ type, title, stat, nounId, date }}
/>`}</pre>
          </div>
        </div>
      </section>

      {/* ── Integration Guide ── */}
      <section className="pc-integration">
        <div className="pc-integration-inner">
          <h2 className="pc-section-title">Integration Examples</h2>

          <div className="pc-int-grid">
            <div className="pc-int-card">
              <h4 className="pc-int-title">DrumModule — Milestone Trigger</h4>
              <pre className="pc-pre pc-pre-sm">{`// In DrumModule.tsx
const MILESTONES = [100, 1000, 10000];

function onDrumSuccess(newCount: number) {
  if (MILESTONES.includes(newCount)) {
    setShareEvent({
      type: "user_milestone",
      title: \`You just hit \${newCount} drums!\`,
      stat: newCount.toLocaleString(),
      date: new Date().toLocaleDateString("en-US", {
        month: "short", day: "numeric", year: "numeric"
      }),
    });
    setShowShareCard(true);
  }
}

// Render
{showShareCard && shareEvent && (
  <ShareCardButton event={shareEvent} label="Share this!" />
)}`}</pre>
            </div>

            <div className="pc-int-card">
              <h4 className="pc-int-title">Collect Screen — Mint Receipt</h4>
              <pre className="pc-pre pc-pre-sm">{`// In CollectSuccessScreen.tsx
function CollectSuccessScreen({ noun, txHash }) {
  const event: ShareCardEvent = {
    type: "mint_receipt",
    title: \`You minted \${noun.name}\`,
    stat: String(noun.id),
    nounId: noun.id,
    date: new Date().toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric"
    }),
    meta: {
      "Noun": \`#\${noun.id}\`,
      "Network": "Base",
      "Tx": \`\${txHash.slice(0, 6)}…\${txHash.slice(-4)}\`,
    },
  };

  return (
    <div>
      <h2>Minted!</h2>
      <ShareCardButton event={event} label="Share Mint" />
    </div>
  );
}`}</pre>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="pc-footer">
        <div className="pc-footer-inner">
          <span className="pc-wordmark pc-wordmark-sm">
            <span className="pc-wordmark-point">POINT</span>
            <span className="pc-wordmark-cast">CAST</span>
          </span>
          <span className="pc-footer-url">pointcast.xyz</span>
        </div>
      </footer>
    </div>
  );
}
