# Pickleball results sources: reuse survey

Surveyed 2026-11-08 (America/Los_Angeles) by Claude Fable 5.1 for the PointCast pickleball rankings (see TIER-PLAN.md). Draft for Michael Hoydich. Nothing here is live and nothing here is legal advice.

House rule being tested: PointCast reuses only results the organizer or venue publishes itself on a public page whose terms don't forbid reuse. Names, divisions, finishes, partners and dates only; no ratings copied from anyone.

## Verdict

**Current US national and pro results are not reusable by PointCast today, and nothing in this survey could be verified.** Every page fetch attempted this session (26 URLs on 22 hosts, including each candidate's terms page and robots.txt) was refused by the session's network proxy (HTTP 403 on CONNECT, "no rule allows host"). Per the brief, each is recorded as "blocked, not attempted further" and no bot check, sign-in or proxy setting was worked around. Web search still worked, so this file records where each organizer appears to publish results and which terms URL to read, but every such note comes from a search-result snippet, not from the page, and is marked **not verified**. The structural picture the snippets paint is consistent with the brief's assumption: USA Pickleball, the PPA Tour, Major League Pickleball, the US Open, the APP Tour and the collegiate tours appear to publish brackets on pickleball.com, pickleballtournaments.com, pickleballbrackets.com, Pickleball Den or DUPR, all of which are link-only for PointCast regardless of their terms. The organizer-hosted candidates (NPL, NCPA, Pickleball Canada, Pickleball England, Pickleball Australia, the Global Pickleball Alliance, CAPA) need a human to open each terms page before any row is ingested. Until then the national and global tiers stay "unavailable: no usable national source yet", as TIER-PLAN.md already says.

What has to happen before this survey can be finished: allow the hosts in the fetch log in the session's network settings (or have a person open them in a browser), re-read each terms page and robots.txt, and fill the quote columns. The "Unclear" table lists the exact ask per organizer.

## Usable (organizer-published, public, terms don't bar reuse)

**None verified as of 2026-11-08.** No terms page loaded, so no source meets the "terms don't bar reuse" test yet.

Candidates that *may* land here once a human reads the terms (all unverified; see "Unclear" for the asks):

| Source | Scale | Appears to publish (per search snippet, not verified) | Results URL to check | Terms URL to check | Caveats |
| --- | --- | --- | --- | --- | --- |
| Pickleball Canada | national (CA) | Snippet of its own 2026 National Championship page: "2026 Provincial Team Competition Final Results" (a team standings list, not individual draws). Individual draws may be on a tournament platform. | https://pickleballcanada.org/tournaments/pickleball-canada-national-championships/ and https://pickleballcanada.org/provincial-team-competition-results/ | footer terms link, not found this session | Team standings, not player finishes; individual bracket host unknown. |
| Pickleball Australia | national (AU) | Snippet of its SA Championships wrap-up: "315 pickleball enthusiasts competing over the three days, with a link to full results" (link target unknown). Also an "APC Past Champions" page at https://www.pickleballaus.org/apc-past-champions. | https://www.pickleballaus.org/apc-past-champions | https://www.pickleballaus.org/tos | Search-tool paraphrase says the ToS "bar automated systems such as robots and spiders from accessing its content" (not a quote; not verified). If true, manual read-and-type may be fine but scraping is not. |
| Pickleball England | national (UK) | Has a "tournament archive" page (https://www.pickleballengland.org/tournament-archive/). Snippet of its calendar: 2026 English Nationals "results sent to DUPR". | https://www.pickleballengland.org/tournament-archive/ | footer terms link, not found this session | If results live only in DUPR they are link-only. A login page exists on the site; check whether the archive is public. |
| National Pickleball League (US, 50+) | national pro | Own site has press-release and event pages (e.g. https://www.nplpickleball.com/pr/tags/championship). Whether match or standings tables are on the site itself is not known. | https://www.nplpickleball.com/events | footer terms link, not found this session | Team league, not individual finishes; may still give division/level rows if player-level results are posted. |
| NCPA (collegiate) | national collegiate | Championship page https://ncpaofficial.com/national-championship ; search summary says "The NCPA championship page I found did not list final results." | https://ncpaofficial.com/national-championship | footer terms link, not found this session | Team results; likely hosted elsewhere. |
| Global Pickleball Alliance (GPA / Global Pickleball Rankings) | global pro | Snippet: "GPAPickleball.org ... now hosts the Alliance's founding members, governance information, a unified 2026 schedule, and the newly released GPR"; "Standings are publicly accessible and sortable by country, continent and world." | https://gpapickleball.org/ (page not found by search; domain from snippets) | not found this session | A ranking, not organizer results. Under the house rule a third-party ranking is a lead, not a source. Listed here only because it is organizer-run (APP-led) and public. |
| CAPA, California Pickleball Association (playcapa.com) | regional | **In use upstream, not re-verified here.** The El Segundo ladder's own docs (hello-token-reserve `content/pickleball/players/README.md`) say: "each tournament page on playcapa.com links a public bracket sheet (a published Google Sheet, one tab per division) with full team names and a Place column", and its `events.json` lists the pages (for example https://www.playcapa.com/summeropen2026). This session's proxy blocked playcapa.com, so no page or terms clause was re-read today. Web search mostly surfaced an unrelated Capital Area Pickleball Association (Wisconsin); ignore it. | https://www.playcapa.com/summeropen2026 (and the other pages in the El Segundo `events.json`) | footer terms link, not read this session | PointCast takes these rows only through the El Segundo feed, which already applies the source rule. A terms re-check from an open network is still owed. |

Other US regional associations that publish results on their own site: none found. One search for state/regional bodies (Southern Pickleball, Minnesota, Oregon, Arizona) returned only pickleballtournaments.com event pages and pickleball.com player pages. Snippet of USA Pickleball's own results page: "Results for past tournaments can be found on either the PickleballTournaments.com or PickleballBrackets.com website." A targeted search per association, or asking USA Pickleball regional directors, is the next step.

## Link-only

Rule: PointCast never fetches results, player or ranking pages from these hosts and never copies names or numbers from them. Terms pages were the only pages permitted and every one was blocked this session, so no clause is quoted.

| Source / host | Why link-only | Terms URL (attempted, blocked 2026-11-08) | What PointCast shows instead |
| --- | --- | --- | --- |
| pickleball.com (PPA Tour, MLP results, World Pickleball Rankings, player pages) | On the brief's banned list. Search-tool paraphrase of its ToS ("Last updated: [June 3, 2025]"): prohibits "using automated systems or software to extract data or other Content from the Sites, including screen scraping, unless a separate written agreement authorizes it" (paraphrase, not verified). | https://www.pickleball.com/terms-of-use | Link to the event page; "results on pickleball.com". |
| pickleballtournaments.com | Banned list. Snippet: PPA Tour privacy policy "lists pickleballtournaments.com among the sites it covers"; PPA terms say amateur registration "runs on pickleballtournaments.com". Own ToS not read. | https://pickleballtournaments.com/terms | Link to the tournament page. |
| pickleballbrackets.com | Banned list. Own ToS not read. | https://www.pickleballbrackets.com/terms.aspx | Link to the tournament page. |
| ppatour.com (PPA Tour; Opendoor Pickleball World Championships, "Veolia Pickleball National Championships" per snippet) | Banned list. Search found a terms page and a "content policy" page. | https://www.ppatour.com/terms-of-use/ , https://ppatour.com/about/terms/ , https://ppatour.com/content-policy | Link to the event page; Worlds draw lives at a PPA event page (snippet: europe.ppatour.com/events/2026/pickleball-world-championships/). |
| usapickleball.org (USA Pickleball National Championships; Golden Ticket series) | Banned list. Snippet of its own results page: "Results for past tournaments can be found on either the PickleballTournaments.com or PickleballBrackets.com website." Terms page titled "WEBSITE AND MEDIA TERMS OF USE" per snippet. | https://usapickleball.org/pages/terms-of-use | Link to https://usapickleball.org/nationals/history and the Nationals event page. 2026 Nationals: Oct 31 to Nov 8, 2026, San Diego (snippet). |
| dupr.com / mydupr.com | Banned list. ToS not read. Snippet of a club partnership agreement restricts "reselling rating information" and "sharing rating or profile information with others" (binds partners, not the public). Pickleball England and the Global Pickleball Federation route results/ratings to DUPR per snippets. | https://dupr.com/terms-of-use | Link to the event or club page; never a DUPR rating. |
| pickleballden.com | Banned list. Search summary: APP Tour "Full tournament results are generally hosted on Pickleball Den." | https://www.pickleballden.com/terms | Link to the APP recap at theapp.global. |
| utrsports.net | Banned list. ToS not read. | https://www.utrsports.net/terms | Link only. |
| pickleheads.com | Banned list. ToS not read. | https://www.pickleheads.com/terms | Link only. |
| Major League Pickleball (majorleaguepickleball.co) | Not on the banned list, but its standings/results are team standings and the search-tool summary says event results also surface on pickleball.com. Own site has "All Team Standings" pages for past seasons. ToS not found. Host blocked this session. | not found | Link to https://majorleaguepickleball.co/ ; team standings are not player finishes, so no rows either way. |
| APP Tour (theapp.global) | Own site publishes recaps; results tables appear to sit on Pickleball Den (banned). Host blocked this session; terms URL guessed. | https://www.theapp.global/terms-of-use (guessed path) | Link to the recap page. |
| US Open Pickleball Championships (usopenpickleball.com) | Snippet (third-party blog): "the official US Open Pickleball Championships Results website (www.usopenpickleball.com)". Host blocked; results host unknown, likely a tournament platform. | not found | Link to usopenpickleball.com. |
| College Pickleball Tour / DUPR Nationals; APP Selkirk U.S. Collegiate Championships | Run by DUPR and the APP; results on DUPR / Pickleball Den per snippets. | see DUPR / APP rows | Link to the organizer's recap. |
| Wikipedia (e.g. "U.S. Open Pickleball Championships", "List of professional pickleball players") | License is CC BY-SA 4.0 (standard Wikipedia footer; **not verified this session**, host blocked). Not organizer-published, so under the house rule a Wikipedia champions list is a lead, not a source. | https://en.wikipedia.org/ (blocked) | Cite as a lead only; follow its footnotes to the organizer page before any row. |

## Unclear: needs a human to ask the organizer (or at least open the page)

| Source | What is unclear | Suggested ask |
| --- | --- | --- |
| Pickleball Canada | Whether individual event draws are on pickleballcanada.org or a platform; what its terms say about reuse. | "May PointCast republish finishes (name, division, place, partner, date) from your Nationals pages with a link back? Where are individual draws hosted?" |
| Pickleball Australia | Terms reportedly bar robots/spiders (paraphrase). Whether manual, attributed reuse of the past-champions page is allowed; where full results live. | "Your ToS restricts automated access. Is manual, attributed reuse of the APC Past Champions page allowed? Is there a public results page we may link and transcribe?" |
| Pickleball England | Whether the tournament archive is public without login; whether Nationals results exist anywhere but DUPR. | "Is the tournament archive public? May PointCast reuse finishes from it with attribution?" |
| National Pickleball League (US) | Whether player-level results exist on nplpickleball.com; terms. | "Do you publish player-level results? May they be reused with a link back?" |
| NCPA | Whether team/player results are posted on ncpaofficial.com; terms. | Same as NPL. |
| Global Pickleball Alliance / GPR | Whether GPR is a ranking only (lead) or also publishes event results; terms. Domain gpapickleball.org not confirmed by any fetch. | "Do you publish per-event results, or only rankings? May per-event finishes be reused with attribution?" |
| Global Pickleball Federation / World Pickleball Federation / UWPF / IFP (Bainbridge Cup) | Governance is split (snippets: GPF and UWPF announced a potential merger in Nov 2025; worldpickleballfederation.org is headed by the Unified World Pickleball Federation; the IFP ran the Bainbridge Cup, last item found is 2021). None of the four sites loaded. Whether any publishes results itself is unknown. GPF "Announces DUPR as Its Official Rating System" per a DUPR post title. | "Which body publishes world championship results, on what page, and under what terms?" |
| Pickleball World Cup (Da Nang, 2026) / Opendoor Pickleball World Championships (Dallas, 2026) | World Cup organizer and results host unknown. Worlds is PPA-run, so link-only. | For World Cup: identify the organizer and its results page before anything else. |
| CAPA (playcapa.com) | The source pages are named in the El Segundo ladder's `events.json`, but this session could not open them or the terms (proxy blocked). | Re-read playcapa.com's terms and one bracket sheet from an open network; record the quote in the El Segundo repo. |
| US regional associations (Southern Pickleball, state associations) | Results appear to live on pickleballtournaments.com (link-only). No association with its own results page found. | Ask 2 to 4 associations whether they post medal lists on their own site and whether reuse with attribution is okay. |
| robots.txt for every host above | Not read (all blocked). | Re-run once hosts are allowed. |

## Fetch log

All fetches on 2026-11-08 (America/Los_Angeles). "blocked" = session proxy answered 403 to CONNECT / host did not resolve through the proxy; not attempted further, nothing worked around. "search" = web search only, snippets not treated as fetched pages.

| URL | Status |
| --- | --- |
| https://pickleballtournaments.com/terms | blocked |
| https://www.pickleballbrackets.com/terms.aspx | blocked |
| https://www.pickleball.com/terms-of-use | blocked |
| https://www.ppatour.com/terms-of-use/ | blocked |
| https://usapickleball.org/terms-of-use/ | blocked |
| https://dupr.com/terms-of-use | blocked |
| https://www.pickleballden.com/terms | blocked |
| https://www.utrsports.net/terms | blocked |
| https://www.pickleheads.com/terms | blocked |
| https://www.majorleaguepickleball.co/ | blocked |
| https://www.theapp.global/ | blocked |
| https://www.theapp.global/terms-of-use | blocked |
| https://www.nplpickleball.com/ | blocked |
| https://www.usopenpickleball.com/ | blocked |
| https://ncpaofficial.com/national-championship | blocked |
| https://globalpickleballfederation.org/ | blocked |
| https://ifpickleball.org/ | blocked |
| https://pickleballcanada.org/ (WebFetch and curl) | blocked |
| https://www.pickleballengland.org/ | blocked |
| https://www.pickleballaustralia.org.au/ | blocked |
| https://playcapa.com/ | blocked |
| https://en.wikipedia.org/wiki/U.S._Open_Pickleball_Championships | blocked |
| https://en.wikipedia.org/robots.txt (curl) | blocked |
| robots.txt on every other host above | not attempted (hosts blocked) |
| mydupr.com, worldpickleballfederation.org, gpapickleball.org, pickleballaus.org, europe.ppatour.com | not attempted (same proxy policy; known from search only) |
| Web searches (18 queries: MLP, APP, NPL, US Open, USA Pickleball Nationals, collegiate, GPF, IFP/Bainbridge, CAPA x2, WPF/UWPF, GPA x2, regional associations x3, Wikipedia x2, ToS of pickleballtournaments/pickleballbrackets/DUPR) | ok (snippets only) |

Hosts that need allowing in the session's network settings before this survey can be completed: pickleballtournaments.com, www.pickleballbrackets.com, www.pickleball.com, www.ppatour.com, usapickleball.org, dupr.com, www.pickleballden.com, www.utrsports.net, www.pickleheads.com, www.majorleaguepickleball.co, www.theapp.global, www.nplpickleball.com, www.usopenpickleball.com, ncpaofficial.com, globalpickleballfederation.org, ifpickleball.org, pickleballcanada.org, www.pickleballengland.org, www.pickleballaustralia.org.au, www.pickleballaus.org, playcapa.com, en.wikipedia.org, gpapickleball.org, www.worldpickleballfederation.org.

## Provenance

Drafted and checked by Claude Fable 5.1 (claude-fable-5-1). Sources fetched: 0 of 26 attempted. Search queries: 18. Cut from this file: every player name, team name, score and medal count that appeared in search snippets, per the brief.
