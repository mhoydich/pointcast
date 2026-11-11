"""Builds the eight remaining Local Census town files, all town pages and the region index.
Run from the repo root. El Segundo and Torrance data files are left as they are."""
import json, os
ROOT = 'public/local-census'
FAM = ["Engineering","Software and data","Technicians and trades","Nursing and care","Sales","Food and hospitality","Teaching and childcare","Drivers and logistics","Office and admin","Finance and accounting"]
TITLES = {"Engineering":["Engineer"],"Software and data":["Software","Developer","Data"],"Technicians and trades":["Technician","Machinist","Mechanic","Electrician","Welder"],"Nursing and care":["Nurse","Caregiver","Medical Assistant"],"Sales":["Sales","Account Executive"],"Food and hospitality":["Cook","Server","Barista","Bartender","Host"],"Teaching and childcare":["Teacher","Tutor","Instructor"],"Drivers and logistics":["Driver","Warehouse","Logistics"],"Office and admin":["Administrative","Assistant","Coordinator","Receptionist"],"Finance and accounting":["Accountant","Financial","Controller","Bookkeeper"]}
QF = "https://www.census.gov/quickfacts/fact/table/%s/PST045224"
SURVEY = "Latest five-year survey figure on QuickFacts, read Nov 11, 2026"

def town(slug, name, qf, pop, change, hh, income, rent, commute, owner, college, total, fams, reads, gaps, samples):
    u = QF % qf; src = "U.S. Census Bureau, QuickFacts"
    return {"slug": slug, "name": name, "snapshot": "2026-11-11",
      "snapshot_note": "Town total counted Nov 10, 2026; job families counted Nov 11, 2026.",
      "official": [
        {"label":"Residents","value":pop,"fmt":"n","grade":"A","note":"July 1, 2025 estimate","source":src,"url":u},
        {"label":"Population change since 2020","value":change,"fmt":"%","grade":"A","note":"April 1, 2020 base to the latest estimate","source":src,"url":u},
        {"label":"Households","value":hh,"fmt":"n","grade":"B","note":SURVEY,"source":src,"url":u},
        {"label":"Median household income","value":income,"fmt":"$","grade":"B","note":SURVEY,"source":src,"url":u},
        {"label":"Median gross rent","value":rent,"fmt":"$","grade":"B","note":SURVEY + "; today's asking rents run higher","source":src,"url":u},
        {"label":"Mean commute","value":commute,"fmt":"min","grade":"B","note":SURVEY + ", residents who work","source":src,"url":u},
        {"label":"Homes owned by the people living in them","value":owner,"fmt":"%","grade":"B","note":SURVEY,"source":src,"url":u},
        {"label":"Adults with a bachelor's degree","value":college,"fmt":"%","grade":"B","note":SURVEY + ", age 25 and over","source":src,"url":u}],
      "postings": {"total": total, "window_days": 30, "grade": "C",
        "families": [{"name": f, "count": fams[i], "titles": TITLES[f]} for i, f in enumerate(FAM)]},
      "samples": [{"title": t, "company": c} for t, c in samples], "reads": reads, "gaps": gaps}

def read(need, evidence, quality, move, confidence, why):
    return {"need": need, "evidence": evidence, "quality": quality, "move": move, "confidence": confidence, "why": why}

BLUNT = "Title matching is blunt, and the feed undercounts small employers."
TOWNS = [
 town("culver-city","Culver City","culvercitycitycalifornia",39452,-3.3,17529,117389,2737,26.7,54.6,62.4,1290,
  [51,34,37,13,86,15,1,27,120,31],
  [read("Office work leads, not engineering","120 office and admin postings and 86 in sales, against 51 for engineers. In El Segundo engineers are a third of all openings; here they are about 4%.",
        "The work on offer is studio, media and office support. It suits people with office skills more than a technical degree.",
        "List the entry-level office roles by employer and what each asks for, so residents can see which are reachable now.","medium",BLUNT),
   read("Rent runs well ahead of the towns next door","Median rent of $2,737, against $1,782 in Hawthorne and $1,787 in Inglewood.",
        "People who take support jobs here are likely to live somewhere cheaper and travel in.",
        "Check where Culver City's workers actually live, using the Census commuting files.","low","We have no wages for the postings and no commuting data yet, so this is a reasoned guess.")],
  ["What the posted jobs pay.","Where the people who work in Culver City live.","Studio and production hiring, much of which is freelance and never posted."],
  [("Sr Administrative Assistant, Screen Gems","Sony Pictures Entertainment"),("Senior Financial Analyst","Milani Cosmetics"),("AI Native Software Engineer Manager","Accenture"),("Licensed Vocational Nurse","Southern California Hospitals"),("Behavior Technician","FirstSteps for Kids"),("Live-stream Host","LiveLab US")]),
 town("hawthorne","Hawthorne","hawthornecitycalifornia",82741,-6.1,30030,75848,1782,28.3,27.2,26.0,745,
  [153,42,49,11,42,9,8,36,43,10],
  [read("Space jobs in a town of renters","153 engineer postings and 49 for technicians, out of 745. About 27% of homes are owned by the people in them, and 26% of adults have a bachelor's degree.",
        "The best-known employers in town hire mostly for degrees that most residents do not hold. The technician roles are the ones within reach.",
        "Publish the technician openings at the space companies in one place, with the certificates each asks for and where nearby they are taught.","medium",BLUNT),
   read("The town is shrinking","The Census has the population down 6.1% since 2020, with a mean commute of 28.3 minutes.",
        "Fewer residents in a town that is adding high-paid jobs suggests the people being hired are not the people living here.",
        "Find out who left: renters or owners, and from which neighborhoods.","low","The population figure is official. The reason for it is not in any data we hold.")],
  ["What the posted jobs pay.","How many space-company workers live in Hawthorne.","Who is moving out, and where to."],
  [("R&D Fabrication Technician","Astrolab"),("Sr. Harness Technician","Astrolab"),("Server Hardware Systems Engineer (Starlink)","SpaceX"),("Logistics Operations Coordinator","Expeditors"),("Medical Assistant","Optum"),("Early Intervention Teacher","ITS Integrated Therapy Solutions")]),
 town("inglewood","Inglewood","inglewoodcitycalifornia",101662,-5.7,37524,72750,1787,30.5,36.2,25.2,737,
  [43,6,37,48,35,14,1,22,80,7],
  [read("Care work is the largest skilled family","48 nursing and care postings, ahead of 43 for engineers. Office and admin leads overall at 80.",
        "These are jobs residents can train into close to home, and the town needs them filled.",
        "Map the nursing and medical-assistant training within a bus ride, and which employers hire from each program.","medium",BLUNT),
   read("The longest trip to work of the ten towns","A mean commute of 30.5 minutes, the highest here, with the lowest median household income at $72,750.",
        "The residents with the least to spend are spending the most time getting to work.",
        "Look at which job centers Inglewood residents travel to and whether the new rail stops shorten those trips.","medium","Survey averages. They say how long, not where to.")],
  ["What the posted jobs pay.","Hiring at the stadium and arena, much of which is event-day work and may not be posted here.","Where residents work."],
  [("Clinical Trial Nurse, Per Diem","IQVIA"),("Manufacturing Engineer II","The Marvin Group"),("Electrical Wiring Assembler III","Everest Consultants"),("Campus Operations Coordinator","Alpha School"),("Starbucks Barista","Target"),("Assistant Sales Manager","California Closets")]),
 town("redondo-beach","Redondo Beach","redondobeachcitycalifornia",67281,-6.1,28307,150245,2691,27.0,53.4,67.0,522,
  [170,37,33,9,8,14,1,6,28,7],
  [read("Aerospace is most of what is posted","170 of the 522 postings are for engineers, a third of the total. Sales is 8 and drivers and logistics 6.",
        "Outside the aerospace campus, very little local work shows up. Most residents leave town for their jobs.",
        "Count the small-business openings the feed misses along the harbor and Artesia Boulevard by asking the businesses.","medium","Big employers post everything on LinkedIn. Small ones mostly do not, so the split is exaggerated."),
   read("Fewer people than five years ago","The population is down 6.1% since 2020 in a town with a median household income of $150,245.",
        "A well-off town losing residents usually points to housing: smaller households, or people priced out.",
        "Compare household size and the number of homes over the same years.","low","The drop is official. The cause is our guess.")],
  ["What the posted jobs pay.","Small-business hiring.","Whether households are getting smaller or homes are sitting empty."],
  [("Principal Aeronautical Engineer","Northrop Grumman"),("Software Integration and Test Engineer","Northrop Grumman"),("Composites Technician","Impulse Space"),("Server","The Rockefeller Redondo Beach"),("Licensed Vocational Nurse I","Optum"),("Project Accountant","Salisbury Moore")]),
 town("carson","Carson","carsoncitycalifornia",90808,-5.0,26974,108703,1956,27.5,74.0,29.3,459,
  [44,5,46,13,27,5,2,36,52,10],
  [read("Making and moving things","46 technician and trades postings and 36 for drivers and logistics, level with 44 for engineers. Software and data is 5.",
        "Carson's openings are hands-on, and many do not ask for a four-year degree.",
        "List the technician and warehouse openings with their pay once wages can be collected, so the good ones stand out.","medium",BLUNT),
   read("A town of owners","About 74% of homes are owned by the people living in them, the highest share of the ten towns.",
        "Residents are settled, so changes to work nearby matter more than in a town where people move often.",
        "Ask what would keep the next generation here: the homes are owned, but by whom, and for how long.","low","One survey figure. It says nothing about age or who inherits.")],
  ["What the posted jobs pay.","Port and refinery hiring that runs through union halls and contractors.","Air quality next to the freight corridors."],
  [("Additive Manufacturing Technician","Divergent"),("Mechanical Engineer, Rover","Starpath"),("Local CDL A Truck Driver","CRST"),("Assistant Controller","Storm Industries"),("In-Home Caregiver","WelbeHealth"),("Sales Specialist","The Home Depot")]),
 town("gardena","Gardena","gardenacitycalifornia",58460,-4.2,20822,84803,1809,29.3,48.8,28.9,439,
  [24,10,29,6,32,2,5,45,28,5],
  [read("Driving and warehouse work leads","45 postings for drivers and logistics, the largest family here, then 32 in sales and 29 for technicians.",
        "The work is steady and local, but it is the kind most exposed to automation over the next few years.",
        "Track these postings each month. A falling count is the earliest warning the town will get.","medium",BLUNT),
   read("A long commute for a town with its own jobs","A mean commute of 29.3 minutes, second only to Inglewood.",
        "Residents are traveling out even though there is work in town, which suggests a mismatch between the jobs here and the people here.",
        "Compare where residents work with who fills Gardena's own jobs.","low","Survey averages, and no commuting data pulled yet.")],
  ["What the posted jobs pay.","Where residents work.","Casino and card-room hiring, which is mostly not in this feed."],
  [("Portable Storage Delivery Driver (CDL)","U-Haul"),("Senior Maintenance Technician","Positive Investments"),("Senior Test Engineer","Stealth Mode"),("Medical Assistant Instructor","UEI College"),("Executive Assistant","InnoForge"),("Sr. Accountant","686")]),
 town("manhattan-beach","Manhattan Beach","manhattanbeachcitycalifornia",33122,-6.6,13369,204306,3449,28.0,64.8,78.9,254,
  [21,7,3,5,19,11,8,3,19,10],
  [read("The jobs here serve the people who live here","254 postings in all. Sales, food and teaching together are 38, more than engineering and software combined at 28.",
        "The local work is shops, restaurants and childcare, in the town with the highest median rent of the ten at $3,449.",
        "Find out where the people who staff the town live and how they get in.","medium","No wages in the feed, so we cannot say how far the pay falls short of the rent."),
   read("The steepest population drop of the ten","Down 6.6% since 2020, with a median household income of $204,306.",
        "The town is getting emptier and richer at once.",
        "Check how many homes are second homes or short-term rentals.","low","The drop is official. The cause is our guess.")],
  ["What the posted jobs pay.","Where service workers commute from.","How many homes are occupied year-round."],
  [("Retail Sales Associate","Aviator Nation"),("Child Care Teacher","Bright Horizons"),("Cook","Westmont Hospitality"),("Nurse Practitioner, Family Medicine","Provider Solutions & Development"),("Broadcast Technician","Pegasus Studios"),("Financial Advisor","Northwestern Mutual")]),
 town("hermosa-beach","Hermosa Beach","hermosabeachcitycalifornia",18513,-6.3,8934,166442,2887,28.5,50.6,76.0,76,
  [1,0,3,4,6,1,1,6,11,1],
  [read("Almost no work is posted in town","76 postings in 30 days for 8,934 households: under one for every 100 households, the lowest rate of the ten.",
        "Nearly everyone who lives here works somewhere else. The town is a place to live, not a place to work.",
        "Count the restaurant, bar and shop jobs along Pier Avenue directly. They are the town's real employers and they are missing here.","medium","The feed misses small restaurants and shops, which are most of Hermosa's employers."),
   read("Fewer residents than in 2020","Down 6.3%, with a mean commute of 28.5 minutes.",
        "A small beach town losing residents changes fast: fewer regulars for the businesses that are left.",
        "Check how many homes are occupied year-round.","low","The drop is official. The cause is our guess.")],
  ["What the posted jobs pay.","Bar, restaurant and shop hiring.","How many homes are occupied year-round."],
  [("Sales and Marketing Manager, North America","Hobonichi"),("Registered Nurse","SEV Laser"),("Special Education Teacher","Cross Country Education"),("Airbrush Technician","SUGARED + BRONZED"),("Delivery Driver","Domino's"),("Accounting Manager","Nolan Capital")]),
]

ALL = []
for t in TOWNS:
    os.makedirs(f"{ROOT}/{t['slug']}", exist_ok=True)
    json.dump(t, open(f"{ROOT}/towns/{t['slug']}.json", "w"), indent=1, ensure_ascii=False)
for slug in ["el-segundo", "torrance"] + [t["slug"] for t in TOWNS]:
    t = json.load(open(f"{ROOT}/towns/{slug}.json"))
    hh = [o["value"] for o in t["official"] if o["label"] == "Households"][0]
    ALL.append({"name": t["name"], "slug": slug, "postings": t["postings"]["total"], "households": hh,
                "per100": round(t["postings"]["total"] / hh * 1000) / 10, "page": True})
ALL.sort(key=lambda x: -x["postings"])
old = json.load(open(f"{ROOT}/region.json"))
region = {"snapshot": "2026-11-11", "snapshot_note": "Town totals and the regional job families were counted Nov 10, 2026.",
          "window_days": 30, "total": sum(t["postings"] for t in ALL), "towns": ALL, "families": old["families"]}
json.dump(region, open(f"{ROOT}/region.json", "w"), indent=1)

NAV = " · ".join(f'<a href="/local-census/{t["slug"]}/">{t["name"]}</a>' for t in sorted(ALL, key=lambda x: x["name"]))
def page(title, desc, path, cfg, nav):
    return f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<meta name="description" content="{desc}">
<link rel="canonical" href="https://pointcast.xyz{path}">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:url" content="https://pointcast.xyz{path}">
<meta property="og:type" content="website">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600&family=IBM+Plex+Sans:wght@400;600&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/local-census/census.css">
</head>
<body>
<header class="lc-top"><a href="/local-census/">Local Census</a><span>{nav}</span></header>
<main id="lc-root">Loading the census…</main>
<footer class="lc-foot">
  <p>Towns: {NAV} · <a href="/local-census/">all ten</a> · <a href="/ping-kit/">Ping Kit</a></p>
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
for t in ALL: print(f"{t['name']:16} {t['postings']:5} {t['households']:6} {t['per100']}")
print(region["total"])
