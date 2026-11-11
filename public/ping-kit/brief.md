# Town ping brief

Hand this whole file to an AI agent (Claude, ChatGPT, or another that can search the web and write files) along with the name of a town. It builds a Local Census page for the town and a ping file that joins the ping network.

Working examples: https://pointcast.xyz/local-census/el-segundo/ and its ping at https://pointcast.xyz/local-census/el-segundo/ping.json

A draft built from this brief with no one local involved, to show what the first pass looks like: https://pointcast.xyz/local-census/medway/

## What you are building

Three things for one town:

1. A town data file (`towns/<slug>.json`) with official figures, live job counts, a short reading of what the town needs, and a list of what is not known yet.
2. A town page that draws that file. Use the template as it is: `census.js`, `census.css` and a copy of any town's `index.html` with the town slug changed.
3. A ping (`ping.json`): a small summary of the town that other towns and other agents can read.

Template files to copy, unchanged:

- https://pointcast.xyz/local-census/census.js
- https://pointcast.xyz/local-census/census.css
- https://pointcast.xyz/local-census/el-segundo/index.html
- https://pointcast.xyz/local-census/towns/el-segundo.json (the shape to follow)

## The rules that matter

- **Every figure gets a grade and a source link.** A: official and current. B: official survey, a few years old. C: counted by us, or stated by a source with no method. D: our estimate. If you cannot find a source, leave the figure out.
- **Every reading states its confidence** (low, medium or high) and says why it is not higher.
- **Say what is not known.** The list of gaps is part of the product, not an apology.
- **Do not invent.** No made-up employers, quotes, figures or dates. If a search returns nothing, write that it returned nothing.
- **Plain words.** Write for a resident, not a planner. One idea per sentence.
- **It is not a government census.** The page says so, and so should anything you write about it.

## Steps

1. **Official figures.** Open the town's Census QuickFacts page (census.gov/quickfacts). Record residents, population change since 2020, households, median household income, median gross rent, mean commute, share of homes owned by the people in them, and share of adults with a bachelor's degree. Note the date printed beside each figure. Outside the United States, use the national statistics office and record the same things where they exist.
2. **Job counts.** For the last 30 days, count open postings in the town, then count again for each of the ten job families below by the words in the job title. Record the date you counted. Any jobs feed works if you name it; the examples use a LinkedIn-based feed.
   - Engineering: Engineer
   - Software and data: Software, Developer, Data
   - Technicians and trades: Technician, Machinist, Mechanic, Electrician, Welder
   - Nursing and care: Nurse, Caregiver, Medical Assistant
   - Sales: Sales, Account Executive
   - Food and hospitality: Cook, Server, Barista, Bartender, Host
   - Teaching and childcare: Teacher, Tutor, Instructor
   - Drivers and logistics: Driver, Warehouse, Logistics
   - Office and admin: Administrative, Assistant, Coordinator, Receptionist
   - Finance and accounting: Accountant, Financial, Controller, Bookkeeper
3. **Six sample postings.** Title and employer only, taken from the results you actually saw.
4. **Two or three readings.** For each: the need in a short headline, the numbers behind it, what it means for living in the town, one next step someone could take, the confidence, and why it is not higher. Give each a short `id` in lowercase words and hyphens (`long-commute`); it names the next step when people back it. Compare with a neighboring town where that sharpens the point.
5. **Three or four gaps.** What you looked for and could not find, or what the feed cannot see (small shops, restaurants, schools, union halls).
6. **Status.** Set `"review": { "state": "unread" }` in the town file. Only a person who lives in the town can change it to `read`. If nobody local asked for the page, also set `"status": "draft"`.
7. **The ping.** Fill in the shape below from the town file. List the three nearest towns in the same region that already have a ping as neighbors. If there are none, leave the list empty.
8. **Check.** Every figure on the page traces to a link. Postings per 100 households equals postings divided by households, times 100. The page loads on a phone with no sideways scrolling.

## The ping

```json
{
  "ping": "0.1",
  "town": "Medway",
  "slug": "medway",
  "region": "Norfolk County, Massachusetts",
  "status": "draft",
  "review": "unread",
  "lat": 42.142,
  "lon": -71.397,
  "updated": "2026-11-11",
  "home": "https://example.org/medway/",
  "data": "https://example.org/medway/town.json",
  "signals": [
    { "kind": "residents", "label": "Residents", "value": 0, "grade": "A" },
    { "kind": "jobs_posted_30d", "label": "Jobs posted in 30 days", "value": 0, "grade": "C" },
    { "kind": "jobs_per_100_households", "label": "Postings per 100 households", "value": 0, "grade": "C" },
    { "kind": "top_job_family", "label": "Largest job family", "value": "", "count": 0, "grade": "C" }
  ],
  "needs": [ { "id": "short-name", "need": "", "next_step": "", "confidence": "low" } ],
  "asks": [ "What this town wants to know and does not" ],
  "neighbors": [ "slug-of-a-nearby-town" ],
  "maintainer": "Who keeps this up to date",
  "contact": "An address a person reads"
}
```

The zeros and empty strings are placeholders to replace. Leave `status` out once the town has someone local behind it. A ping may also carry `backing`: an address that returns a live count of taps for each next step, keyed by the need's `id`. `signals` can carry more kinds than these four; a reader skips the ones it does not know. `needs` and `asks` are the point of the file: a ping that only reports numbers is a dashboard, and a ping that says what the town needs can be answered.

## What needs a person

An agent can do everything above except these:

- **A place to publish.** Any static host works. The files are plain HTML, CSS, JavaScript and JSON.
- **A name.** A domain for the town, or a folder on a site you already have.
- **A jobs feed.** A paid data account if you want live counts; the South Bay towns took about 30 lookups each. Without one, the agent can still build the page from official figures and leave the job section out.
- **A read-through.** Someone who lives in the town should read the two or three readings before it goes up. They will know in a minute if one is wrong. Until then the page says at the top that no resident has read it.
- **A small server, if you want the two boxes.** "Back this step" and "Ping back" call `/api/poll` and `/api/feedback` on the same host. If your host has neither, the page leaves the boxes out and nothing else changes.

## Joining the network

Send the address of your `ping.json` to mh@pointcast.xyz. Towns in the network are listed at https://pointcast.xyz/ping-kit/network.json.
