"""Builds the Local Census town files, all town pages and the region index.
Run from the repo root. The El Segundo and Torrance data files are kept by hand and only read here.
Towns outside the South Bay (FAR) get a data file and a page but stay out of the region totals."""
import json, os
ROOT = 'public/local-census'
FAM = ["Engineering","Software and data","Technicians and trades","Nursing and care","Sales","Food and hospitality","Teaching and childcare","Drivers and logistics","Office and admin","Finance and accounting"]
TITLES = {"Engineering":["Engineer"],"Software and data":["Software","Developer","Data"],"Technicians and trades":["Technician","Machinist","Mechanic","Electrician","Welder"],"Nursing and care":["Nurse","Caregiver","Medical Assistant"],"Sales":["Sales","Account Executive"],"Food and hospitality":["Cook","Server","Barista","Bartender","Host"],"Teaching and childcare":["Teacher","Tutor","Instructor"],"Drivers and logistics":["Driver","Warehouse","Logistics"],"Office and admin":["Administrative","Assistant","Coordinator","Receptionist"],"Finance and accounting":["Accountant","Financial","Controller","Bookkeeper"]}
QF = "https://www.census.gov/quickfacts/fact/table/%s/PST045224"
HOME = "South Bay, Los Angeles County, California"
SURVEY = "2020–2024 American Community Survey"

def town(slug, name, qf, pop, change, hh, income, rent, commute, owner, college, total, fams, reads, gaps, samples,
         region=HOME, status=None, note=None, postings_note=None):
    u = QF % qf; src = "U.S. Census Bureau, QuickFacts"
    t = {"slug": slug, "name": name, "region": region}
    if status: t["status"] = status
    t.update({"snapshot": "2026-11-11",
      "snapshot_note": note or "Town total counted Nov 10, 2026; job families counted Nov 11, 2026.",
      "review": {"state": "unread"},
      "official": [
        {"label":"Residents","value":pop,"fmt":"n","grade":"A","note":"July 1, 2025 estimate","source":src,"url":u},
        {"label":"Population change since 2020","value":change,"fmt":"+%","grade":"A","note":"April 1, 2020 base to July 1, 2025","source":src,"url":u},
        {"label":"Households","value":hh,"fmt":"n","grade":"B","note":SURVEY,"source":src,"url":u},
        {"label":"Median household income","value":income,"fmt":"$","grade":"B","note":SURVEY + ", in 2024 dollars","source":src,"url":u},
        {"label":"Median gross rent","value":rent,"fmt":"$","grade":"B","note":SURVEY + "; today's asking rents run higher","source":src,"url":u},
        {"label":"Mean commute","value":commute,"fmt":"min","grade":"B","note":SURVEY + ", residents who work","source":src,"url":u},
        {"label":"Homes owned by the people living in them","value":owner,"fmt":"%","grade":"B","note":SURVEY,"source":src,"url":u},
        {"label":"Adults with a bachelor's degree","value":college,"fmt":"%","grade":"B","note":SURVEY + ", age 25 and over","source":src,"url":u}],
      "postings": {"total": total, "window_days": 30, "grade": "C",
        "families": [{"name": f, "count": fams[i], "titles": TITLES[f]} for i, f in enumerate(FAM)]},
      "samples": [{"title": a, "company": c} for a, c in samples], "reads": reads, "gaps": gaps})
    if postings_note: t["postings"]["note"] = postings_note
    return t

# The id names a next step for the backing count. Change it and the count starts again.
def read(id, need, evidence, quality, move, confidence, why):
    return {"id": id, "need": need, "evidence": evidence, "quality": quality, "move": move, "confidence": confidence, "why": why}

BLUNT = "Title matching is blunt, and the feed undercounts small employers."
TOWNS = [
 town("culver-city","Culver City","culvercitycitycalifornia",39452,-3.3,17529,117389,2737,26.7,54.6,62.4,1290,
  [51,34,37,13,86,15,1,27,120,31],
  [read("office-work-leads","Office work leads, not engineering","120 office and admin postings and 86 in sales, against 51 for engineers. In El Segundo engineers are a third of all openings; here they are about 4%.",
        "The work on offer is studio, media and office support. It suits people with office skills more than a technical degree.",
        "List the entry-level office roles by employer and what each asks for, so residents can see which are reachable now.","medium",BLUNT),
   read("rent-ahead-of-neighbors","Rent runs well ahead of the towns next door","Median rent of $2,737, against $1,782 in Hawthorne and $1,787 in Inglewood.",
        "People who take support jobs here are likely to live somewhere cheaper and travel in.",
        "Check where Culver City's workers actually live, using the Census commuting files.","low","We have no wages for the postings and no commuting data yet, so this is a reasoned guess.")],
  ["What the posted jobs pay.","Where the people who work in Culver City live.","Studio and production hiring, much of which is freelance and never posted."],
  [("Sr Administrative Assistant, Screen Gems","Sony Pictures Entertainment"),("Senior Financial Analyst","Milani Cosmetics"),("AI Native Software Engineer Manager","Accenture"),("Licensed Vocational Nurse","Southern California Hospitals"),("Behavior Technician","FirstSteps for Kids"),("Live-stream Host","LiveLab US")]),
 town("hawthorne","Hawthorne","hawthornecitycalifornia",82741,-6.1,30030,75848,1782,28.3,27.2,26.0,745,
  [153,42,49,11,42,9,8,36,43,10],
  [read("space-jobs-renters","Space jobs in a town of renters","153 engineer postings and 49 for technicians, out of 745. About 27% of homes are owned by the people in them, and 26% of adults have a bachelor's degree.",
        "The best-known employers in town hire mostly for degrees that most residents do not hold. The technician roles are the ones within reach.",
        "Publish the technician openings at the space companies in one place, with the certificates each asks for and where nearby they are taught.","medium",BLUNT),
   read("town-shrinking","The town is shrinking","The Census has the population down 6.1% since 2020, with a mean commute of 28.3 minutes.",
        "Fewer residents in a town that is adding high-paid jobs suggests the people being hired are not the people living here.",
        "Find out who left: renters or owners, and from which neighborhoods.","low","The population figure is official. The reason for it is not in any data we hold.")],
  ["What the posted jobs pay.","How many space-company workers live in Hawthorne.","Who is moving out, and where to."],
  [("R&D Fabrication Technician","Astrolab"),("Sr. Harness Technician","Astrolab"),("Server Hardware Systems Engineer (Starlink)","SpaceX"),("Logistics Operations Coordinator","Expeditors"),("Medical Assistant","Optum"),("Early Intervention Teacher","ITS Integrated Therapy Solutions")]),
 town("inglewood","Inglewood","inglewoodcitycalifornia",101662,-5.7,37524,72750,1787,30.5,36.2,25.2,737,
  [43,6,37,48,35,14,1,22,80,7],
  [read("care-work","Care work is the largest skilled family","48 nursing and care postings, ahead of 43 for engineers. Office and admin leads overall at 80.",
        "These are jobs residents can train into close to home, and the town needs them filled.",
        "Map the nursing and medical-assistant training within a bus ride, and which employers hire from each program.","medium",BLUNT),
   read("longest-commute","The longest trip to work of the ten towns","A mean commute of 30.5 minutes, the highest here, with the lowest median household income at $72,750.",
        "The residents with the least to spend are spending the most time getting to work.",
        "Look at which job centers Inglewood residents travel to and whether the new rail stops shorten those trips.","medium","Survey averages. They say how long, not where to.")],
  ["What the posted jobs pay.","Hiring at the stadium and arena, much of which is event-day work and may not be posted here.","Where residents work."],
  [("Clinical Trial Nurse, Per Diem","IQVIA"),("Manufacturing Engineer II","The Marvin Group"),("Electrical Wiring Assembler III","Everest Consultants"),("Campus Operations Coordinator","Alpha School"),("Starbucks Barista","Target"),("Assistant Sales Manager","California Closets")]),
 town("redondo-beach","Redondo Beach","redondobeachcitycalifornia",67281,-6.1,28307,150245,2691,27.0,53.4,67.0,522,
  [170,37,33,9,8,14,1,6,28,7],
  [read("aerospace-dominates","Aerospace is most of what is posted","170 of the 522 postings are for engineers, a third of the total. Sales is 8 and drivers and logistics 6.",
        "Outside the aerospace campus, very little local work shows up. Most residents leave town for their jobs.",
        "Count the small-business openings the feed misses along the harbor and Artesia Boulevard by asking the businesses.","medium","Big employers post everything on LinkedIn. Small ones mostly do not, so the split is exaggerated."),
   read("fewer-people","Fewer people than five years ago","The population is down 6.1% since 2020 in a town with a median household income of $150,245.",
        "A well-off town losing residents usually points to housing: smaller households, or people priced out.",
        "Compare household size and the number of homes over the same years.","low","The drop is official. The cause is our guess.")],
  ["What the posted jobs pay.","Small-business hiring.","Whether households are getting smaller or homes are sitting empty."],
  [("Principal Aeronautical Engineer","Northrop Grumman"),("Software Integration and Test Engineer","Northrop Grumman"),("Composites Technician","Impulse Space"),("Server","The Rockefeller Redondo Beach"),("Licensed Vocational Nurse I","Optum"),("Project Accountant","Salisbury Moore")]),
 town("carson","Carson","carsoncitycalifornia",90808,-5.0,26974,108703,1956,27.5,74.0,29.3,459,
  [44,5,46,13,27,5,2,36,52,10],
  [read("making-and-moving","Making and moving things","46 technician and trades postings and 36 for drivers and logistics, level with 44 for engineers. Software and data is 5.",
        "Carson's openings are hands-on, and many do not ask for a four-year degree.",
        "List the technician and warehouse openings with their pay once wages can be collected, so the good ones stand out.","medium",BLUNT),
   read("town-of-owners","A town of owners","About 74% of homes are owned by the people living in them, the highest share of the ten towns.",
        "Residents are settled, so changes to work nearby matter more than in a town where people move often.",
        "Ask what would keep the next generation here: the homes are owned, but by whom, and for how long.","low","One survey figure. It says nothing about age or who inherits.")],
  ["What the posted jobs pay.","Port and refinery hiring that runs through union halls and contractors.","Air quality next to the freight corridors."],
  [("Additive Manufacturing Technician","Divergent"),("Mechanical Engineer, Rover","Starpath"),("Local CDL A Truck Driver","CRST"),("Assistant Controller","Storm Industries"),("In-Home Caregiver","WelbeHealth"),("Sales Specialist","The Home Depot")]),
 town("gardena","Gardena","gardenacitycalifornia",58460,-4.2,20822,84803,1809,29.3,48.8,28.9,439,
  [24,10,29,6,32,2,5,45,28,5],
  [read("driving-warehouse","Driving and warehouse work leads","45 postings for drivers and logistics, the largest family here, then 32 in sales and 29 for technicians.",
        "The work is steady and local, but it is the kind most exposed to automation over the next few years.",
        "Track these postings each month. A falling count is the earliest warning the town will get.","medium",BLUNT),
   read("long-commute","A long commute for a town with its own jobs","A mean commute of 29.3 minutes, second only to Inglewood.",
        "Residents are traveling out even though there is work in town, which suggests a mismatch between the jobs here and the people here.",
        "Compare where residents work with who fills Gardena's own jobs.","low","Survey averages, and no commuting data pulled yet.")],
  ["What the posted jobs pay.","Where residents work.","Casino and card-room hiring, which is mostly not in this feed."],
  [("Portable Storage Delivery Driver (CDL)","U-Haul"),("Senior Maintenance Technician","Positive Investments"),("Senior Test Engineer","Stealth Mode"),("Medical Assistant Instructor","UEI College"),("Executive Assistant","InnoForge"),("Sr. Accountant","686")]),
 town("manhattan-beach","Manhattan Beach","manhattanbeachcitycalifornia",33122,-6.6,13369,204306,3449,28.0,64.8,78.9,254,
  [21,7,3,5,19,11,8,3,19,10],
  [read("jobs-serve-residents","The jobs here serve the people who live here","254 postings in all. Sales, food and teaching together are 38, more than engineering and software combined at 28.",
        "The local work is shops, restaurants and childcare, in the town with the highest median rent of the ten at $3,449.",
        "Find out where the people who staff the town live and how they get in.","medium","No wages in the feed, so we cannot say how far the pay falls short of the rent."),
   read("steepest-drop","The steepest population drop of the ten","Down 6.6% since 2020, with a median household income of $204,306.",
        "The town is getting emptier and richer at once.",
        "Check how many homes are second homes or short-term rentals.","low","The drop is official. The cause is our guess.")],
  ["What the posted jobs pay.","Where service workers commute from.","How many homes are occupied year-round."],
  [("Retail Sales Associate","Aviator Nation"),("Child Care Teacher","Bright Horizons"),("Cook","Westmont Hospitality"),("Nurse Practitioner, Family Medicine","Provider Solutions & Development"),("Broadcast Technician","Pegasus Studios"),("Financial Advisor","Northwestern Mutual")]),
 town("hermosa-beach","Hermosa Beach","hermosabeachcitycalifornia",18513,-6.3,8934,166442,2887,28.5,50.6,76.0,76,
  [1,0,3,4,6,1,1,6,11,1],
  [read("no-work-posted","Almost no work is posted in town","76 postings in 30 days for 8,934 households: under one for every 100 households, the lowest rate of the ten.",
        "Nearly everyone who lives here works somewhere else. The town is a place to live, not a place to work.",
        "Count the restaurant, bar and shop jobs along Pier Avenue directly. They are the town's real employers and they are missing here.","medium","The feed misses small restaurants and shops, which are most of Hermosa's employers."),
   read("fewer-residents","Fewer residents than in 2020","Down 6.3%, with a mean commute of 28.5 minutes.",
        "A small beach town losing residents changes fast: fewer regulars for the businesses that are left.",
        "Check how many homes are occupied year-round.","low","The drop is official. The cause is our guess.")],
  ["What the posted jobs pay.","Bar, restaurant and shop hiring.","How many homes are occupied year-round."],
  [("Sales and Marketing Manager, North America","Hobonichi"),("Registered Nurse","SEV Laser"),("Special Education Teacher","Cross Country Education"),("Airbrush Technician","SUGARED + BRONZED"),("Delivery Driver","Domino's"),("Accounting Manager","Nolan Capital")]),
]

FAR = [
 town("medway","Medway","medwaytownnorfolkcountymassachusetts",13804,5.3,4744,173750,1575,30.4,85.9,62.4,65,
  [1,0,5,1,3,2,3,2,12,0],
  [read("schools-care-shops","The work posted in town is schools, care and shops","65 postings in 30 days. The largest family is office and admin at 12, and the one we opened was a teaching assistant at Medway Middle School. Engineering is 1 and software is 0, in a town where 62.4% of adults hold a bachelor's degree.",
        "The jobs posted in town are the ones that keep it running: classrooms, childcare, the pharmacy, the grocery store. Most residents with degrees look to be working somewhere else.",
        "Ask the schools and the childcare centers how long these roles stay open. If they sit unfilled, that is the first need to write down.","low","65 is a small count, the feed cannot tell Medway, Massachusetts from other towns called Medway, and no one in Medway has read this."),
   read("owners-long-commute","A town of owners with a long trip to work","85.9% of homes are owned by the people living in them and the mean commute is 30.4 minutes. Median household income is $173,750. The population is up 5.3% since 2020.",
        "People settle here and travel out to work. With so few homes to rent, the people who staff the schools, shops and care work may have to live somewhere else.",
        "Find out where the people who work in Medway live, using the Census commuting files.","low","Survey averages. We have no wages for the postings and no commuting data yet.")],
  ["How many of the 65 postings are in Medway, Massachusetts. The feed cannot filter by state.","What the posted jobs pay.","Where the people who work in Medway live.","Hiring by the town, the schools and small shops that never reaches a job feed."],
  [("Teaching Assistant at Medway Middle School","ACCEPT Education Collaborative"),("Child Care Certified Float Teacher","BrightPath Early Learning & Child Care"),("Pharmacy Technician / Pharm Tech Apprenticeship","Walgreens"),("Retail Sales and Store Support","Shaw's and Star Market"),("Nurse Practitioner","CVS Health"),("Delivery Driver","Domino's")],
  region="Norfolk County, Massachusetts", status="draft",
  note="Counted Nov 11, 2026. A draft built as a test of the Ping Kit, with no one in Medway involved.",
  postings_note="The feed has no filter for state. These are postings that list a United States city called Medway: 19 name Massachusetts or “Medway, MA” in their text, 2 name Maine, and the rest do not say."),
]

def rate(t):
    hh = [o["value"] for o in t["official"] if o["label"] == "Households"][0]
    return hh, round(t["postings"]["total"] / hh * 1000) / 10

ALL = []
for t in TOWNS + FAR:
    os.makedirs(f"{ROOT}/{t['slug']}", exist_ok=True)
    json.dump(t, open(f"{ROOT}/towns/{t['slug']}.json", "w"), indent=1, ensure_ascii=False)
for slug in ["el-segundo", "torrance"] + [t["slug"] for t in TOWNS]:
    t = json.load(open(f"{ROOT}/towns/{slug}.json"))
    hh, per = rate(t)
    ALL.append({"name": t["name"], "slug": slug, "postings": t["postings"]["total"], "households": hh, "per100": per, "page": True})
ALL.sort(key=lambda x: -x["postings"])
old = json.load(open(f"{ROOT}/region.json"))
region = {"snapshot": "2026-11-11", "snapshot_note": "Town totals and the regional job families were counted Nov 10, 2026.",
          "window_days": 30, "total": sum(t["postings"] for t in ALL), "towns": ALL, "families": old["families"],
          "elsewhere": [{"name": t["name"], "slug": t["slug"], "region": t["region"], "status": t.get("status"),
                         "postings": t["postings"]["total"], "households": rate(t)[0], "per100": rate(t)[1]} for t in FAR]}
json.dump(region, open(f"{ROOT}/region.json", "w"), indent=1)

NAV = " · ".join(f'<a href="/local-census/{t["slug"]}/">{t["name"]}</a>' for t in sorted(ALL, key=lambda x: x["name"]))
ELSE = " · ".join(f'<a href="/local-census/{t["slug"]}/">{t["name"]}, {t["region"].split(", ")[-1]}{" (draft)" if t.get("status") == "draft" else ""}</a>' for t in FAR)
def page(title, desc, path, cfg, nav, robots=""):
    return f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<meta name="description" content="{desc}">
{robots}<link rel="canonical" href="https://pointcast.xyz{path}">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:url" content="https://pointcast.xyz{path}">
<meta property="og:type" content="website">
<meta property="og:image" content="https://pointcast.xyz/local-census/card.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="https://pointcast.xyz/local-census/card.jpg">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600&family=IBM+Plex+Sans:wght@400;600&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/local-census/census.css">
</head>
<body>
<header class="lc-top"><a href="/local-census/">Local Census</a><span>{nav}</span></header>
<main id="lc-root">Loading the census…</main>
<footer class="lc-foot">
  <p>Towns: {NAV} · <a href="/local-census/">all ten</a> · Elsewhere: {ELSE} · <a href="/ping-kit/">Ping Kit</a></p>
  <p>An independent reading by PointCast, built with Claude for Mike Hoydich. Not a government census. The data files behind each page are public: <a href="/local-census/region.json">region.json</a> and one file per town under <a href="/local-census/towns/el-segundo.json">/local-census/towns/</a>.</p>
</footer>
<script>window.LOCAL_CENSUS = {cfg};</script>
<script src="/local-census/census.js"></script>
</body>
</html>
'''
open(f"{ROOT}/index.html", "w").write(page("Local Census: ten towns around El Segundo", "What ten South Bay towns are hiring for right now, set against who lives there, with a grade on every figure.", "/local-census/", "{ region: true }", "South Bay"))
for t in ALL:
    open(f"{ROOT}/{t['slug']}/index.html", "w").write(page(f"{t['name']} · Local Census", f"What {t['name']} is hiring for, who lives there, and what the gap means for living in town. Every figure is graded for how far to trust it.", f"/local-census/{t['slug']}/", '{ town: "%s" }' % t["slug"], t["name"]))
for t in FAR:
    place = f"{t['name']}, {t['region'].split(', ')[-1]}"
    open(f"{ROOT}/{t['slug']}/index.html", "w").write(page(f"{place} (draft) · Local Census", f"A draft Local Census page for {place}, built from the Ping Kit brief. No one who lives there has read it yet.", f"/local-census/{t['slug']}/", '{ town: "%s" }' % t["slug"], t["name"], '<meta name="robots" content="noindex">\n'))
for t in ALL: print(f"{t['name']:16} {t['postings']:5} {t['households']:6} {t['per100']}")
print(region["total"])
