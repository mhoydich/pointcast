# What a phone visitor can reach from PointCast

November 18, 2026 · P2 · Live site, Chromium touch emulation, 390 × 844 CSS pixels.

The guest pocket says that saved finds work without signing in. On four fresh visits, a sign-in sheet opened by itself and covered the controls for those finds. This was the first problem I would fix. All ten entry pages loaded, and on every page a visitor could follow a link and find a way home.

## Findings in repair order

1. **The guest pocket opens under a sign-in sheet.** On `/me`, the sheet occupies y=352–792. A tap in the middle of “Shop this study” hits Passkey. A tap where “Clear saved list” sits hits Kukai. Tapping the heading outside the sheet reveals the shopping controls. Pass when a visitor can use their saved list on entry and can explicitly open sign-in. [Guest screenshot](p2-evidence/guest-pocket.png)
2. **The town bar covers “Open My AI”.** On `/connectors`, the first action begins at y=790. Its center hits the fixed town search form. Scrolling the action higher makes the same link work. Pass when its visible button receives the first tap and opens the My AI section. [Connectors screenshot](p2-evidence/connectors.png)
3. **Two maker links end at 404 pages.** In `/shop/front`, “At the maker” on the Chef’sChoice Pronto 463 and Google AI entries returned 404 on both a link check and a fresh phone navigation. Google One’s current [plans page](https://one.google.com/about/google-ai-plans/) names Google AI Pro. The sharpener maker’s current US catalog lists a different model, the 465 Commercial. An exact 463 product page or an editorial decision to retire its purchase link is still needed. [Chef’sChoice record](../../src/data/chef-knives.json) · [Google AI record](../../src/data/ai-work-life.json)
4. **Three links promise a section the browser cannot reach.** Shortwave’s “Your card” goes to `/shortwave#card`. Three “VOICE” links on Residents go to `/mythos#residents`. Neither fragment has a target, and both open at the top. A house ad on Archive, Drum and Me puts its tracking query after `#service-of-process`. The section exists about 2,080px down, but the browser looks for an ID that includes the query and stays at the top. Pass when each tap scrolls to its named section. The ad fix belongs in the shared URL builder. [Shortwave](https://pointcast.xyz/shortwave#card) · [Mythos](https://pointcast.xyz/mythos#residents) · [Intended ad target](https://pointcast.xyz/digital-pets/counsel#service-of-process)
5. **The agent reference spills 3px past the right edge.** On `/for-agents`, the channel table starts at x=20 and is 373px wide. The document measures 393px on a 390px screen. Let the table wrap or scroll within the page. The other nine documents fit.
6. **Several navigation targets are hard to tap.** Apps’ “All connector links” is 14px high. Station’s “The Chart Room” is 12px. Archive’s Home is 13px high and its filters are 23px. Shortwave has 19px links in rows only 21px apart. Drum’s room links are 32px high. The Residents home link is 18px high and starts at y=1859. Each route has a working return path. Give these controls the kit’s 44px tap area and make the home route easier to find on Residents.

## Coverage and limits

I counted visible same-site page links in the rendered homepage, including repeats. I grouped fragment and trailing-slash variants, excluded machine feeds, files and the home page itself, and broke ties by first appearance. I used a fresh guest session for each destination. These are homepage link counts, with the tapped path alongside.

| Page | Links from home | Path checked |
| --- | ---: | --- |
| Archive | 13 | Saturday, slightly elsewhere → archive → Home |
| Shortwave | 12 | How it works → Shortwave → PointCast |
| Drum | 10 | Beat of the Day → Drum → PointCast |
| Residents | 9 | Block 0786 → roster → The front door |
| Me | 8 | Explore the study → pocket → PointCast |
| Apps | 8 | All connector links → Apps → Home |
| For agents | 7 | Connectors → For agents → Home |
| Connectors | 7 | Open My AI, after scrolling → Connectors → Home |
| Shop front | 6 | See every pick → shop front → PointCast |
| Station | 5 | The Chart Room → Station → PointCast |

The ten pages exposed 2,062 visible link instances. Two opened email. The other 2,060 resolved to 1,205 distinct HTTPS destinations before fragments. I checked HTTP responses, retried errors with GET and verified the broken deep links in a browser. Backblaze loaded in Chromium after returning 403 to the link checker. Serious Eats returned 402, CyberPower showed a human-verification page, and the guest JSON link on Me required sign-in (401). Those destinations remain unverified for an ordinary signed-in reader. Physical-phone use, account flows and purchases were outside this guest walk.
