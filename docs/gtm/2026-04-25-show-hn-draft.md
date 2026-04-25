# Show HN draft · 2026-04-25

**Author:** cc (drafted overnight per Mike directive 2026-04-24 ~21:00 PT: "lead product, get visitors")
**Status:** **DRAFT — Mike approves and posts. cc never posts on Mike's behalf.**
**Window:** suggested **Tuesday 9:00 AM PT** (HN front-page sweet spot — early US workday, before the morning EU/NA rush)

---

## 1. Headline candidates · ranked best-fit

Five drafts, ranked by signal-to-noise on HN. Each tests a different lead — pick one or run a hybrid.

1. **Show HN: PointCast — a small internet town built by 3 LLMs and a human**
   *Lead = the agents-as-residents hook + the human anchor. Concrete. The "and a human" defuses the AI-only-skepticism reflex. Signals "this is a small project, not a startup launch." Best for HN's tone.*

2. **Show HN: PointCast — what it looks like when Claude, Codex, and Manus share a website**
   *Names the agents specifically. Curious-cat lead. Slight risk of feeling gimmicky. Better for Designer News + Are.na audiences.*

3. **Show HN: A small website with real weather, a coffee pot, and three AI residents**
   *Lead = the cozy specifics + the residents twist. Reads like a friend's project, not a launch. The "real weather" is a hook for technical readers.*

4. **Show HN: PointCast — a multi-agent broadcast from El Segundo**
   *Lead = "broadcast from El Segundo." Local-anchor framing. Feels least promotional. Slightly opaque without context.*

5. **Show HN: PointCast (a tiny website three LLMs and I work on together)**
   *Most personal. The parenthetical does the lift. Risks reading as small talk. Good for an X / Bluesky cross-post; weaker on HN.*

**Recommendation:** post as **#1**. If it doesn't click in 90 minutes, repost as #3 the following Tuesday.

---

## 2. Post body · 200 words

Use this body verbatim with the chosen headline, or edit. Voice draws from `docs/plans/2026-04-24-overnight-product-direction.md` §5.

```
PointCast (pointcast.xyz) is a small website I've been building with
three AI residents — Claude Code, Codex, and Manus. They commit to
main alongside me. Each has a directory of dated logs, a color, a
voice, and a place on the masthead.

The site itself is a small internet town broadcasting from El
Segundo, CA. The masthead sky tints by the local hour and the live
Open-Meteo weather. The cursor is your Noun. There's a daily race
at the front door, a coffee pot you can pour from (the count is
shared across all visitors today), a tiny window onto the live sky
outside. /mythos walks through every room. /residents lists the
agents and the two open slots for plus-ones (Kimi, Gemini).

Stack: Astro static site + Cloudflare Pages + a few Workers + one
KV namespace for shared counters. Tezos contracts on the side
(Visit Nouns FA2 deployed; Prize Cast written). Yesterday's
autonomous run shipped 14 PRs across ~12 hours by the agents alone
— see /wire for the live ticker.

Nothing here is trying to go viral. It's a place. The coffee pot is
on if you want to pour a cup.

— Mike
```

Word count: **199.** Final paragraph signs as Mike (this is Mike's account posting). Edit attribution if needed.

---

## 3. Screenshots to capture before posting · 7 shots

Take all seven on a desktop browser at 1440px width with the cursor visible (the Noun cursor is part of the texture). Save as `docs/gtm/screenshots/2026-04-25/{slug}.png`.

| # | URL | Capture | Why |
|---|---|---|---|
| 1 | `/` | Masthead with sky tinted to current hour, FreshToday band, ThisWeek strip | The "what is this" first impression |
| 2 | `/mythos` | Worlds Rail (15 tile grid) | Shows the surface area in one frame |
| 3 | `/coffee` | The pot mid-steam + at least 3 mugs on the shelf | Most-photogenic single page |
| 4 | `/window` | Sun + clouds + marine layer in current conditions | Live data made literal |
| 5 | `/residents` | All six rows visible (cc, Codex, Manus, Mike, Kimi-open, Gemini-open) | The multi-agent story in a list |
| 6 | `/wire` | Live ticker mid-scroll showing real commits | Proof the multi-agent thing isn't theater |
| 7 | `/briefs` | Today's shelf at the top with 1-3 open briefs | Shows the handoff layer is real |

**Capture rule:** real production state, no staging or fake data. If a number is small (race count = 0), capture the real number, don't backfill.

---

## 4. Comments to be ready with · first 90 min

The first hour of an HN post is where it lives or dies. Be in the thread. Have these answers prepared:

- **"What's the stack?"** → Astro static + Cloudflare Pages + 4 Workers (presence DO + race + coffee + wire-events) + 1 KV. Tezos contracts in SmartPy. Build deploys via wrangler CLI right now (the auto-deploy hook is broken — see [block 0353](https://pointcast.xyz/b/0353)).
- **"How do the agents commit?"** → Each has GitHub access via their own token + workflow. They open PRs, cc reviews-and-merges scoped work; Mike reviews anything else. RFC 0003 (https://pointcast.xyz/plans/2026-04-24-rfc-0003-plus-one-agents) is the contract.
- **"Is this just LLM marketing?"** → No. The site is small on purpose. There's no signup, no pricing, no email capture. The agents are real (cc = Claude, Codex = OpenAI, Manus = computer-use ops). All commits are public on GitHub.
- **"Why El Segundo?"** → Mike lives there. The weather on the masthead is real El Segundo weather (Open-Meteo). Localness is a feature, not a brand.
- **"Why Tezos?"** → Cheap mints, no-loss savings work cleanly via FA2, the on-chain provenance binds the agent town to a real ledger. Optional — most of the site doesn't touch chain.
- **"Can I run my own resident agent?"** → Yes — RFC 0003 §4 has the first-task path for Kimi and Gemini, but the contract works for any LLM with GitHub PR access.

**Links to seed in comments** (in this order):
1. **[/agents.json](https://pointcast.xyz/agents.json)** — the manifest (good for the "I want to inspect this with curl" reader)
2. **[/for-agents](https://pointcast.xyz/for-agents)** — the human-readable agent docs
3. **[GitHub repo](https://github.com/mhoydich/pointcast)** — the source
4. **[RFC 0003](https://pointcast.xyz/plans/2026-04-24-rfc-0003-plus-one-agents)** — for the multi-agent / plus-one curious
5. **[/mythos](https://pointcast.xyz/mythos)** — the "what is this place" 60-second read

---

## 5. Posting checklist

Run through this list 10 minutes before posting:

- [ ] Bang up the build cache — visit a few rooms in a fresh browser, verify nothing's broken
- [ ] Confirm the GH→Pages auto-deploy isn't fixed yet (block 0353 still relevant) OR remove that line from the post if it is
- [ ] Verify the OG card on `/mythos` looks right by pasting the URL into a Bluesky compose box
- [ ] Verify `/api/coffee/today` is healthy + returns a real count
- [ ] Race for today is open (not a placeholder window)
- [ ] All seven screenshots saved + named
- [ ] Comment-ready answers reviewed
- [ ] Coffee in hand
- [ ] Submit at exactly 9:00 AM PT (Tuesday) for the front-page window
- [ ] First comment within 5 min — link to /mythos with the line "if you want the 60-second read"
- [ ] Stay in the thread for the first 90 minutes; no marketing reflex, just answer questions

**If it lands:**
- Cross-post to Bluesky + Farcaster within the hour. Use the share-affordance prefilled copy from `<ShareThis />` for consistency.
- Don't email anyone the link. Let it travel by share.

**If it doesn't land (no front-page within 60 min):**
- That's fine. Don't delete. Don't repost the same week.
- Try headline #3 the following Tuesday with the same body.
- The site got more itself, regardless.

---

## 6. What this draft is not

- Not a launch — there's nothing to launch. The site has been live for months.
- Not a fundraise — there's no ask in the body.
- Not a new feature announcement — the post is about the *existence* of the place, not a single ship.
- Not for paid promotion — never run as an HN ad. If it doesn't earn front-page on its own, it shouldn't be there.

---

*Filed by cc, Sprint 44, 2026-04-25 06:15 PT. Mike approves and posts when the moment feels right.*
