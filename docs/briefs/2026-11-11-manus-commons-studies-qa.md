# Manus brief: real-device QA of the two Coast Commons studies (2026-11-11)

Owner: Claude Code. Tracks TASKS.md "Coast Commons studies: SB Surf House and Fresh Milk, Local". Run after the pull request is merged and deployed; before that, the same paths work on a Pages preview.

## Open these URLs

1. https://pointcast.xyz/coast-commons/sb-surf-house/
2. https://pointcast.xyz/coast-commons/fresh-milk/
3. https://pointcast.xyz/coast-commons/ (the "Two longer studies" section)
4. https://pointcast.xyz/coast-commons.json (the `studies` key) and https://pointcast.xyz/b/0786

## Accounts and tools

None. Every page is public. Use a phone (iOS Safari and Android Chrome if both are at hand) and one desktop browser.

## What to check and capture

- Both pages, phone: the "Plainly" box is the first thing after the title and drawing, readable without zooming, with six lines. Nothing scrolls sideways except the tables and the plan drawing. Screenshot the first screen of each.
- Top navigation: Coast Commons, SB Surf House, Fresh Milk, Local and JSON are comfortable taps and go to the right place.
- Surf house, breaks: tap three break names and three dots on the coast strip; the card under it changes each time.
- Surf house, plans: tap Bungalow, House + ADU and Shared house. Each draws a different plan with the red "SCHEMATIC · NOT A BLUEPRINT · NOT FOR CONSTRUCTION" line. Screenshot all three.
- Surf house, calculator: load each of the three variants, then change price, members and rate. Check one result by hand (monthly mortgage on the loan, plus tax, insurance, upkeep and running costs, divided by members). Empty a field and confirm nothing shows NaN.
- Surf house, signals: tap the porch light, board rack and swell bell; each label flips.
- Milk, ladder: tap all six rungs; also move between them with the arrow keys on desktop. The panel under the ladder changes.
- Milk, calculator: switch between the two cow figures and the goat figure, change households and litres, and check one result by hand. Empty the households box and confirm the herd reads 0.
- Milk, town table: it scrolls sideways inside its own box on a phone; El Segundo, Manhattan Beach and Redondo Beach show "Not verified".
- Outbound links: open at least fifteen source links on each page, including every link in the surf house "Rules" section and the milk "California dairy law" section. List any that are dead, moved, or now say something different from the sentence beside them. Several city and county sites block automated requests, so use a normal browser.
- Reading check (most useful): for the four items the pages mark "not verified", say what you find in a normal browser. (a) The County of Santa Barbara short-term rental ordinance page. (b) Carpinteria's vacation rental caps on the City's own code. (c) The animal-keeping sections of the El Segundo, Manhattan Beach and Redondo Beach municipal codes. (d) Whether the Montebello dairy's own site shows it open in 2026. Report only what the page says, with the URL and the date you read it. Do not edit the studies.
- Console (desktop): note any errors. The pages should make no requests off pointcast.xyz.
- With JavaScript turned off, note what is missing (the break cards, plans, ladders, town table and source list on the milk page are drawn by script).

## Where to write the result

`docs/manus-logs/2026-11-11-commons-studies-qa.md`: one section per URL with what you saw, screenshots, device and browser names, dead or changed links, and console errors verbatim.

## Approvals

Read-only QA; nothing here needs Mike's approval. Do not contact any city, county or state office, any dairy, farm, club or company named or described on the pages, and do not post about the studies anywhere public. Do not enquire about any property or any animal.
