# PointCast Internships · Cohort 1 policies (draft for redline)

**Filed:** 2026-04-27 by cc, follow-up to `docs/gtm/2026-04-27-internships-gtm.md`. The intern page promises terms in writing before anyone starts — these are the defaults to redline before launch week.

---

## 1. Pay model

**Default: per-task bounty + optional token recognition.**

Fits the existing `/rewards/` infrastructure, scales with output, bounded budget, doesn't require a salary line item.

| Item                         | Amount (USD)         | Notes                                           |
|------------------------------|----------------------|-------------------------------------------------|
| Standard weekly task         | $50–$100             | Tier set per track at intake; based on scope.   |
| Capstone bonus (on ship)     | $250                 | Paid after reviewed publication.                |
| Total per intern, 4 cycles   | ~$450–$650           |                                                 |
| Cohort budget (6 interns)    | ~$2,700–$3,900       | Hard cap. Review weekly.                        |
| Optional token recognition   | 1 Visit Noun / cycle | Free-to-mint on Tezos. Not promised as income.  |
| Capstone NFT (on ship)       | 1 collectible        | Documents the work, not a financial instrument. |

Paid via Wise / Stripe / PayPal — international interns paid at the same flat rate (no PPP adjustment; the amounts are small enough to be flat). Token recognition is opt-in and explicitly framed as participation documentation, not compensation.

**Why not hourly stipend:** unbounded burn, harder to communicate ("how many hours?"), encourages presenteeism over output.
**Why not pure token:** "vapor pay" optics, doesn't convert to rent in Lagos or Lima.
**Why not unpaid:** bad optics in 2026; the public-receipts pitch only works if the program isn't extracting free labor.

→ **Mike to confirm:** budget approval (~$4k for cohort 1 worst case), payment processor preference.

---

## 2. Capstone URL shape

**Default: `pointcast.xyz/by/{slug}` for all contributor portfolios.**

Generalizes beyond the internship program to guests, collaborators, and recurring contributors. Avoids "interns" being a permanent URL label that ages weirdly. Doesn't squat the top-level namespace (`pointcast.xyz/{name}` would collide with future routes).

```
pointcast.xyz/by/sarah-chen           → Sarah's contributor portfolio
pointcast.xyz/by/sarah-chen/capstone  → her cohort-1 capstone artifact
pointcast.xyz/by/sarah-chen/blocks    → her individual published blocks
```

Existing `/collabs/` space already shows the pattern (`/collabs/arena`, `/collabs/relay`) but is project-shaped, not person-shaped. `/by/` is the person namespace.

**Slug rules:** lowercase ASCII, dashes, no underscores, max 32 chars. Reserved: `mike`, `cc`, `wanda`, `team`, `staff`. Intern picks at intake; can change once before capstone, never after.

→ **Mike to confirm:** `/by/` namespace OK, or prefer `/collabs/people/` to keep within existing chrome.

---

## 3. Reference letter signer

**Default: Mike + cc co-signed, on PointCast letterhead, PDF + permanent URL.**

Intern leaves with both a downloadable PDF and `pointcast.xyz/by/{slug}/reference` that loads the same content.

Letter structure:
1. Program overview (2 sentences, fixed boilerplate).
2. Cycle count completed, track(s) worked.
3. Specific artifacts shipped, each linked.
4. Skills demonstrated (pulled from the per-track skills list on the page — the same language).
5. Two-paragraph evaluative narrative: scope of work, judgment under deadline, growth observed.
6. Signed: "Michael Hoydich, founder, PointCast" + "Claude Code, work reviewer, PointCast" with date.

The co-signature is a feature, not an apology. The intern's story becomes: *"the founder co-signed with the AI agent that reviewed every weekly receipt — here's the chain-of-custody on my work."* That's a stronger story in 2026 than a single human signature.

→ **Mike to confirm:** willing to co-sign with cc as named reviewer; OK to make the AI-reviewer chain-of-custody an explicit feature in the letter format.

---

## 4. Age policy for cohort 1

**Default: 18+ only for cohort 1. Revisit for cohort 2.**

Reasoning:
- The page already lists "age requirements" as TBD in writing-before-start terms. We don't have to commit yet.
- US DOL labor rules around minors interacting with paid international work are a compliance hairball we shouldn't fight in launch week.
- Guardian + school + scope-adapted-task triple-coordination is a real lift Wanda would have absorbed; without her, it lands on Mike + cc.
- 18+ keeps the rubric clean: weekly bounty, public artifact, signed reference, no chaperone.

**Path to 16+ for cohort 2** (after we've run cohort 1 once and know the actual review load):
- Guardian consent form (template, e-signed).
- School-of-record sign-off if they want academic credit.
- Scoped tasks: no public-facing wallet/token work, no published interviews with adults outside the program, capstone reviewed by both Mike + cc before publication.
- Hours capped at 8/week (vs. 25/week for 18+).
- No payment outside parent-approved channel.

→ **Mike to confirm:** 18+ for cohort 1, revisit at cohort-1 retrospective.

---

## What this unblocks

- Intern page can keep "spelled out in writing before you start" with a real document to send.
- Show HN draft can include one concrete pay number ("$50–$100 per weekly task + $250 capstone bonus") instead of hand-waving — that single line shifts the post from "feels like free labor" to "actually compensated."
- Career-office one-pager has the exact answer to the first question every career counselor asks ("is it paid?").
- Cohort budget is bounded and reviewable.

## Open questions still on Mike

- Tax form policy for US interns (1099-NEC threshold = $600/year; cohort total likely under). Confirm: skip 1099, or issue defensively?
- Does Mike want a one-page "what cc reviews vs. what Mike reviews" doc to include with the reference letter format, or keep the chain implicit?

— filed by cc, 2026-04-27
