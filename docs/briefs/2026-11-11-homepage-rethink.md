# Homepage rethink: utility with style

Date: 2026-11-11 · Author: Claude Code (Opus) · Director: Mike · Prototype: `/home-next/`

Mike: *"also reconsider homepage redesign consider best practices research history and thoughts enjoy the assignment bell labs pixel utility with style design minimal smart readable fonts"*

## What the homepage is for

**Tell a newcomer what PointCast is in one sentence, prove it is alive right now, and get them to one good place in one tap.**

Who arrives: people following Mike's links, returning friends, agents. In five seconds they need: what is this, is anyone home, where do I tap.

## The three jobs, in order

1. **Say what it is, offer one way in.** One sentence, one button (`/archive`).
2. **Show it is alive.** A four-gauge panel (radio, people in town, drum hits, El Segundo weather) and the five newest posts.
3. **Route.** Fifteen places in three groups, then `/explore`, `/apps`, `/search`.

## What gets cut

Everything else. Today: **845 KB of HTML, about 23,000 words, 65 sections, 1,158 links, 38 script tags, 416 KB of CSS in 12 sheets, 7 web-font files.** The most common font sizes are 12, 11, 10 and 9 px. At 390 px the first screen holds three account chips, a carousel and a first-time popup; the page's only h1 sits below it. Carousels, counters, shelves, racks and the dock already live at `/explore`, `/archive`, `/register`, `/for-agents`. Nothing is deleted.

## Type

- Reading: `system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`.
- Data: `ui-monospace, "SF Mono", Menlo, Consolas, monospace`, for labels, gauges, dates, URLs.
- Body 17 px (18 px at 1100+), line height 1.5. Nothing under 14 px. The lede scales 24 to 38 px.
- Measure capped at 65ch for text, 30ch for the lede; 45 to 75 characters per line is the target.

## Grid, palette, pixels

- One column on phones, two at 768, a 7:5 split at 1100 (posts left, panel right). 72rem max, flush left.
- Palette: ink `#111`, paper `#f6f4ee`, one accent `#185fa5` (the existing PointCast blue). Dark: `#101010`, `#ecebe5`, `#8ab8ec`. Every text pair is at least 5.9:1.
- Pixels in three places only: the 12×12 mark (an original point with signal arcs, outer arc in the accent), the dotted 2 px section rule, and the gauge lamp (filled = live, hollow = off). Never in text.

## Performance budget

No web fonts, no framework JS; reads fully with JS off. Prototype: **HTML 6.4 KB + CSS 6.8 KB + JS 4.6 KB** against a 50 KB HTML+CSS budget. Targets: LCP < 2.5 s, INP < 200 ms, CLS < 0.1.

## Accessibility

Skip link, one h1, landmarks, labelled `nav` groups, visible focus, 48 px button, 24 px minimum targets, dark mode and reduced motion respected, no motion by default. A failed source says "unavailable", never a guess.

## What to measure after launch

- Click-through from the front door (needs the pageview beacon the September audit found unmounted).
- Use of each of the fifteen links; swap the bottom three each season.
- Lighthouse per deploy (too little traffic for field vitals).
- Five-second test, five people: "what is this site?" Pass at four of five.

## History

- **April 2026, BLOCKS.md:** "No sidebar. No top nav. The grid is the navigation."
- **2026-08-31:** Rosebud drum garden as the front door.
- **2026-09-01:** rebuilt "to carry the whole town."
- **2026-09-21 audit** (`docs/briefs/2026-09-21-front-door-and-chrome-design.md`): 18 sections, 67.7 KB inline JS, presence shown six ways; proposed three bands (Now, New, Town). The header was trimmed; the bands never landed.
- **2026-10-18:** Segundo Line and paper studios moved to the top.
- **Now:** 65 sections. Every refresh added; none removed. This is the September three-band idea plus a rule: a fixed number of slots.

## Lineage, and what each gives us

- **Bell Labs graphics** ([Knowlton](https://en.wikipedia.org/wiki/Ken_Knowlton), [first-hand account](https://ethw.org/First-Hand:Early_Digital_Art_At_Bell_Telephone_Laboratories%2C_Inc); [Lillian Schwartz](https://en.wikipedia.org/wiki/Lillian_Schwartz)): coarse cells carry a picture. Pixel as mark, not texture.
- **The Blit** ([Pike, Bell Labs](https://doc.cat-v.org/bell_labs/blit)): a bitmap screen that stayed a tool.
- **Unix manual pages** ([Ritchie's intro](https://www.nokia.com/bell-labs/about/dennis-m-ritchie/manintro.html), [lineage](https://twobithistory.org/2017/09/28/the-lineage-of-man.html)) and [troff-era memoranda](https://www.cs.princeton.edu/~bwk/202/202paper.pdf): fixed sections, fixed order, NAME first.
- **Susan Kare** ([Smithsonian](https://www.smithsonianmag.com/innovation/how-susan-kare-designed-user-friendly-icons-for-first-macintosh-180973286/)): small grids, friendly meaning.
- **Swiss grid** ([Müller-Brockmann](https://www.wikipedia.com/wiki/Josef_Muller-Brockmann)): asymmetric columns, flush left, hierarchy from size and space.
- **Utility with style today** ([GOV.UK principles](https://www.gov.uk/guidance/government-design-principles), [512KB Club](https://512kb.club/faq/)): "Do less." Weight is a design choice.

## Sources

- NN/g, [homepage design principles](https://nngroup.com/articles/homepage-design-principles/), [113 homepage guidelines](https://www.nngroup.com/articles/113-design-guidelines-homepage-usability/), [F-shaped reading](https://nngroup.com/articles/f-shaped-pattern-reading-web-content/): say what you are; front-load the words people scan.
- Baymard, [line length](https://baymard.com/blog/line-length-readability); Butterick, [line length](https://practicaltypography.com/line-length.html) and [point size](https://practicaltypography.com/point-size.html): 50 to 75 characters; bigger on screens.
- WCAG 2.2: [contrast minimum](https://www.w3.org/TR/2016/NOTE-UNDERSTANDING-WCAG20-20161007/visual-audio-contrast-contrast.html), [what's new in 2.2](https://tetralogical.com/blog/2023/10/05/whats-new-wcag-2.2): 4.5:1 text, 24 px targets.
- Core Web Vitals [thresholds](https://www.specification.website/spec/performance/core-web-vitals/): LCP 2.5 s, INP 200 ms, CLS 0.1.
- [Modern Font Stacks](https://modernfontstacks.com/): system fonts cost nothing.

## Open decisions for Mike

1. **The one button.** *Read the newest posts* or *Play the drum* (the most-used room). **Recommend reading:** it explains the site; the drum stays one tap away.
2. **The dock on the front door.** Keep the site-wide dock (about 237 KB of chrome script per the September audit) or drop it here. **Recommend dropping it** for a month, then measure.
3. **How to swap.** **Recommend** porting this into `src/pages/index.astro` with the newest posts rendered at build time (so JS-off visitors and agents get real titles), in one PR that updates the homepage tests. The old page stays in git.
