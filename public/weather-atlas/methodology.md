# A year within reach: research method and two proposed product briefs

Research checked 2 October 2026. The published atlas includes seasonal hazards, living guidance, station values, record histories and source periods. Product briefs below are proposed plans. The proposals below do not establish physical inventory, fabrication, lending operations, a forecast service, or official affiliation with Nouns.

## Publish-ready mapping story

**A weather map used to begin with a station.** The U.S. Signal Office began the Daily Weather Map on 1 January 1871. The series evolved into charts of surface weather, upper-air height, daily high/low temperature, and precipitation. NCEI's scanned historical collection covers 1871–13 January 2002; modern weekly editions are a separate WPC product. These maps place a day in its wider weather pattern. They do not resolve the temperature of a particular porch. [NOAA NCEI Daily Weather Maps metadata](https://www.ncei.noaa.gov/access/metadata/landing-page/bin/iso?id=gov.noaa.ncdc%3AC01006), [WPC Daily Weather Map](https://www.wpc.ncep.noaa.gov/dwm/dwm.shtml)

**Contours supplied the missing landscape.** USGS's historical topographic collection preserves maps originally printed from 1884 to 2006. A dated quadrangle can show hills, contours, waterways, settlement, and changing land cover. Comparing editions helps explain the physical setting in which observations were made; a contour is elevation, not a measured temperature boundary. Historic maps use historic datums and editions, so overlays need georeferencing and metadata. [USGS Historical Topographic Maps](https://www.usgs.gov/programs/national-geospatial-program/historical-topographic-maps-preserving-past)

**A modern climate surface is an estimate between observations.** PRISM's current normals describe 1991–2020, with 800 m and 4 km grids. Its mapping uses elevation and station information; the methods also consider coastal proximity, terrain orientation, atmospheric layers, topographic position, and related physical differences. This is more defensible than connecting airport values with a smooth color gradient that ignores the coast and hills. A grid still represents a model estimate over an area, not a sensor at every home. The 2008 methods paper describes an older 1971–2000 dataset: cite it for method, not as the period of the current normals. [PRISM 1991–2020 normals](https://prism.oregonstate.edu/normals/), [Daly et al. 2008 methods paper](https://prism.oregonstate.edu/pubs/link/2008_daly-etal_ijoc.pdf)

**The best map answers a specific living question.** A useful map lets a resident select a season and a purpose—shade, a removable layer, rain readiness, a cooler outing, or an indoor alternative—then inspect tradeoffs. There is no universally optimal neighborhood. The same hill may be sunny above a shallow marine layer, exposed to wind, or cooler under another weather pattern. NOAA describes how the marine layer's depth changes and how terrain changes its reach; in early summer it can persist as May Gray or June Gloom. [NOAA Marine Layer](https://www.noaa.gov/jetstream/ocean/marine-layer)

## Proposed modern map and calendar method

1. **Declare the center.** Use one stated editorial reference point in El Segundo, with its latitude/longitude shown in the methodology. Keep that same center in the map, station inclusion checks, CSV, and text. A city has an area; a radius needs a point. The implementing team must supply the exact chosen point rather than silently changing it between views.
2. **Define 25 miles.** Use a geodesic/great-circle straight-line distance, not driving time or road distance. Twenty-five statute miles equals 40.2336 km. For a simple reproducible inclusion check use the Haversine formula with mean Earth radius 6,371.0088 km. A GIS geodesic on WGS84 is preferable for drawing the final boundary. Document which is used; do not present either as a travel catchment.
3. **Show observations first.** Display station pins, station IDs, elevation, distance from center, source, record period, and coverage caveats. Stations beyond the circle may supply clearly labeled regional context; they are not inside-area observations. Airport exposure differs from a shaded yard or a dense street.
4. **Separate layers.** Keep actual station observations, 1991–2020 normals, historical map links, regional trend context, future scenarios, and editorial suitability in distinct labeled views. Statewide warming context must not be drawn as a measured local trend.
5. **Use an honest first-release map.** If no PRISM raster is actually downloaded and processed, show categorical illustrative coastal/inland/hill areas and station pins. Label the areas “illustrative microclimate zones” and “seasonal planning guidance.” Do not call the graphics NOAA interpolation or PRISM data. Coastal cloud boundaries move; draw soft transitions or explain that visible boundaries are editorial.
6. **Reserve numerical interpolation for a documented pipeline.** To add a PRISM layer, retain the downloaded product/version, variable, units, period, resolution, retrieval date, land mask, clipping process, and cell values. Compare cells at the station locations, describe resolution limits, and provide the inputs. Do not infer indoor comfort, smoke exposure, route passability, or parcel hazard from temperature/precipitation cells.
7. **Show the tradeoff.** A selection should explain an activity fit and the next check, rather than assigning a universal “best” score. Good example: “For a shaded summer walk, compare this coastal route with your inland option; check today's heat, wind, air quality, and route conditions.” The preference is editorial, not a forecast probability.
8. **Make the calendar adaptable.** Use the six seasonal rows in the seasonal living appendix, paired with actual monthly station normals. Display all 12 months as accessible buttons or a select menu, with keyboard operation and a text alternative to the map. The season is a planning default; current official information can change the plan.
9. **Expose limitations in place.** The circle is an editorial boundary, not a barrier to storms, smoke, wind, watersheds, or water supply. Record gaps, station moves, instruments, urban surfaces, aspect, shade, humidity, and building conditions limit generalization.

### Four evidence types that must never be blended

| Label | What it means | Required context |
| --- | --- | --- |
| Historical observation | What a station measured on a date, or what a dated incident report recorded | Station/report, date/time, units, source, coverage |
| Climate normal | A statistical baseline over a defined period | 1991–2020 here; station or modeled grid; variable and units |
| Trend context | An analyzed change over a stated area and time span | Method, region, period, consistent data versions; statewide is not local |
| Future scenario | A modeled possible future under assumptions | Emissions pathway, model/ensemble, baseline, future period, range |

Illustrative suitability is a fifth category: an interpretation of the evidence for a chosen activity. It should have its own legend and should not inherit an “observed” badge.

### Comparing “past” and current normals correctly

NOAA's latest standard station normals are 1991–2020, released in 2021 and corrected for some sites in 2023. NOAA warns that directly subtracting the separately released 2011-era 1981–2010 station normals from the 2021-era 1991–2020 normals can mix climate changes with revisions and different homogenization. For temperature comparisons, use NOAA's derived comparison files, which recompute the earlier period from the same underlying data version. The two periods overlap for 20 years; a difference between them is not automatically a linear annual trend. [NOAA U.S. Climate Normals, comparison documentation](https://www.ncei.noaa.gov/products/land-based-station/us-climate-normals)

## Historical context suitable for a compact timeline

- **1871 onward, mapping history:** National Daily Weather Maps begin. Treat an archival chart as a dated snapshot, not a local forecast or neighborhood measurement. [NCEI metadata](https://www.ncei.noaa.gov/access/metadata/landing-page/bin/iso?id=gov.noaa.ncdc%3AC01006)
- **1884–2006, landscape history:** USGS preserves printed topographic-map editions; link the viewer rather than inventing a specific El Segundo edition that has not been fetched. [USGS collection](https://www.usgs.gov/programs/national-geospatial-program/historical-topographic-maps-preserving-past)
- **2014–2015, state drought context:** NOAA's 2022 assessment describes severe drought associated with multiple below-average precipitation years and record warmth. This is a state-scale episode, not an El Segundo soil-moisture measurement. [California State Climate Summary 2022](https://statesummaries.ncics.org/chapter/ca/)
- **7 January 2025, local-area incident:** CAL FIRE's incident record places the Palisades Fire southeast of Palisades Drive, at 34.07022, −118.54453; it records containment on 31 January 2025. Calculate its point's distance from the chosen El Segundo center before claiming circle inclusion. A point location is not the complete burn perimeter or a map of exposure across the circle. Do not infer the cause from weather or treat an event as a recurrence probability. [CAL FIRE Palisades Fire record](https://www.fire.ca.gov/incidents/2025/1/7/palisades-fire)

NOAA's 2022 California summary uses observations through 2020 and describes almost 3°F of statewide warming since the early twentieth century. It finds large rainfall variability and no long-term statewide winter-precipitation trend in its analysis. Future heat/drought statements in that report are scenarios, with emissions assumptions and uncertainty. Do not imply a measured warming rate or a guaranteed rainfall future inside the 25-mile area. [NOAA state summary](https://statesummaries.ncics.org/chapter/ca/)

For wind context, NWS says Santa Ana winds are most common September–May. Dry winds descend toward the coast through mountain passages and can warm by compression. That supports keeping wind/fire checks beyond autumn, without assigning a local event count or claiming every offshore day is hot. [NWS Mountain and Valley Winds](https://www.weather.gov/safety/wind-mountain-valley)

## Object utility and original guide proposals

These are design concepts and editorial connections, not tested equipment or loan stock. Existing Focus Dial, Ambient Lamp, and Pocket Companion concepts should remain the core catalog; each should link back to Local Object Factory.

| Guide proposal | Purpose in the atlas | Object connections and practical use |
| --- | --- | --- |
| **Cloud**, a cloud-headed pixel character | Coastal uncertainty and May–June layers | Pocket Companion packing checklist; Ambient Lamp for indoor work under a gray sky. No therapeutic lighting claim. |
| **Shade**, a canopy-headed pixel character | Sun exposure and summer timing | Shade Dial as a manual shade/time reminder; Focus Dial for an indoor session during an uncomfortable heat period. It does not measure UV or prevent heat illness. |
| **Contour**, a folded-map-headed character | Hills, exposure, terrain, and historic maps | Pocket Companion's coast/inland/hill comparison card; Window Compass reminder to compare conditions before opening windows. It is not a wind sensor. |
| **Drop**, a rain-gauge-headed character | Rain variability and water routines | Rain Sleeve for carrying a notebook; Water Ledger as a manual rain/soil/watering log. It does not certify waterproofing or replace actual local water rules. |
| **Filter**, a filter-caddy-headed character | Indoor alternative when heat and smoke intersect | A storage/handling caddy for a standard commercial air cleaner and spare filter, pending design tests; never claim homemade filtration performance. |

Use original artwork with geometric pixel styling and square glasses. State “Original PointCast characters inspired by Nouns; independent project.” If using actual Nouns trait art, record the asset source, exact files/seeds, and art license separately. The monorepo's general code license is GPL-3.0: do not treat it as proof of the art's CC0 status. The official assets README identifies the bodies/accessories/heads/glasses data and rendering workflow, and Nouns Center supplies asset downloads, but these reads did not independently establish the CC0 dedication. The implementation's asset-provenance work must verify that dedication before attributing imported art as CC0. [Nouns official asset README](https://raw.githubusercontent.com/nounsDAO/nouns-monorepo/master/packages/nouns-assets/README.md), [Nouns Center assets](https://nouns.center/assets)

## Proposed PRD: El Segundo Object Library

**Problem and audience.** A local resident can see a promising object design but cannot yet tell what it helps with, how a trial would work, or how their experience might improve it. A designer needs structured use feedback before building inventory.

**Product hypothesis.** Connecting a transparent concept catalog to a short trial-planning demo and the climate atlas will make object utility legible and produce better design questions. This is a hypothesis to evaluate; there is no evidence here of demand, lending readiness, or revenue.

**First release.** Publish Focus Dial, Ambient Lamp, and Pocket Companion, plus clearly marked seasonal concept extensions. Every card has use case, concept status, climate/season connections, care/testing questions, and a Local Object Factory link. A “Try the lending demo” flow lets a visitor choose an object and purpose, sketch a pretend trial duration, and review a local demo summary. Every step and result says that it creates no booking and no pickup commitment. Feedback can be a local worksheet or downloadable trial card; avoid contact-data collection without an actual operator and retention plan.

**Core journey.** Atlas season/zone → relevant concept → object use case → demo trial plan → reflection prompts (“What worked?”, “What failed?”, “What would you change?”) → Local Object Factory design brief. Also support catalog → atlas as the reverse journey.

**Success criteria proposed for evaluation.** In five voluntary usability sessions, all participants can identify concept status and lack of booking; at least four can complete a demo and locate the linked factory/atlas. These are proposed acceptance targets, not measured results. Technical acceptance: keyboard completion, mobile layout, visible status at every step, no payment/reservation endpoint, working reset/download, and no false availability count.

**Operations required before a real pilot.** Named operator and location, actual tracked inventory, fabrication and relevant safety testing, cleaning/care procedures, lending terms, accessibility, return/damage process, capacity, and privacy controls. Enable actual booking only after those facts exist and the owner authorizes it.

## Proposed PRD: El Segundo Weather and Living Atlas

**Problem and audience.** One city temperature fails to explain the coastal/inland/hill differences and the seasonal choices a resident makes about outdoor time, shade, layers, windows, water, and gear.

**Product hypothesis.** A map that distinguishes evidence types and pairs seasons with useful objects can improve planning literacy and local experimentation without pretending to predict each day.

**First release.** A transparent 25-mile boundary; coast/inland/hill selections; accessible month controls; NOAA station pins and monthly normals; historical observations and mapping history; clearly bounded trend/scenario context; a six-part living calendar; object-library connections; source/method appendix; downloadable CSV and planning/research briefs. Map graphics remain illustrative unless a documented raster pipeline is implemented.

**Acceptance.** A resident can identify the center/radius method, normal period, relevant station, illustrative map status, and live information links. In proposed usability checks, ask visitors to explain the difference between a normal and a forecast; record understanding rather than claiming behavioral benefit. Technical acceptance includes numeric/source consistency, radius checks, keyboard and text equivalents, legible legends, touch controls, working cross-links/images/downloads, and no unverified “optimal” score.

**Later evidence work.** Add reproducible PRISM cells; shade/land-cover context; longer same-version station comparisons; local participatory observation protocols. Treat portable sensor logs as separate citizen observations with calibration/exposure metadata, not replacement NOAA records. A live warning or forecast feature needs its own freshness, outage, source, and operational requirements.

## Business-case outline and options

| Option | Expected value to test | Cost categories | Dependency and principal risk |
| --- | --- | --- | --- |
| Publish catalog + atlas + demo now | Clearer object utility; source literacy; learn which concepts residents understand | Editorial research, design/development, hosting, maintenance, accessibility review | Content and links need periodic review; readers may mistake demo for service without prominent status |
| Staffed small physical pilot later | Observe actual use, returns, care burden, repair, and design changes | Fabrication quotes, testing, operator time, storage, cleaning, repair, replacement, administration | Requires actual operator/inventory/testing; utilization and willingness to pay are unmeasured |
| Full lending service later | Broader access and sustained design feedback if a pilot supports it | Inventory, staffing, fulfillment, systems, support, security/privacy, ongoing maintenance | Do not launch from concept-page traffic alone; operating costs and local demand remain unknown |

**Illustrative budget worksheet, not a forecast.** Assume 12 trial kits solely to structure an eventual pilot worksheet: `12 × actual quoted kit cost + testing cost + operator hours × actual rate + storage/cleaning/repair costs + an explicitly chosen contingency`. This does not assert that any kits exist or give a procurement recommendation. Atlas maintenance should similarly budget `review hours × actual rate + hosting/data/storage costs`. No revenue, savings, market-size, or payback projection is supported by this research.

**Decision gates.** Continue the concept release if visitors understand the evidence and service status. Consider a physical pilot only after operating facts exist and qualitative research supports it. Consider charging or scaling only after actual cost/use/return evidence and separate owner approval. Measure completed demos, correctly understood limitations, useful design-feedback quality, and real pilot outcomes when applicable; do not label page views as successful loans.

## Source appendix, verification, and remaining limits

Primary sources used above: NOAA NCEI Daily Weather Maps metadata; WPC Daily Weather Map; USGS Historical Topographic Maps; PRISM normals and Daly et al.'s original methods paper; NOAA U.S. Climate Normals documentation; NOAA California State Climate Summary 2022; NOAA Marine Layer; NWS Mountain and Valley Winds; CAL FIRE Palisades Fire; official Nouns asset README and Nouns Center resources. Specific living/hazard sources and their interpretations are in the seasonal living appendix.

Verification method: opened primary pages and followed source links; used the original PRISM research PDF for the interpolation method. NOAA map metadata and WPC material were available in indexed primary-source text, while direct reruns intermittently returned timeout/403. USGS's viewer was blocked by 403; no specific local historic quadrangle was fetched. The California Fourth Assessment Los Angeles report is linked by the official CEC catalog, but its 14.3 MB PDF exceeded this web tool's fetch limit and shell networking could not resolve the host; no numeric regional projection from that unread report is used. [CEC official regional report entry](https://www.energy.ca.gov/media/2078)

No new scientific raster interpolation, parcel-level risk map, forecast, local temperature trend, equipment performance test, measured demand study, or fabrication audit was performed for this handoff. Final implementation must reconcile its station tables and exact chosen center with this method. Exact historic-map editions and imported art's CC0 provenance remain tasks for the relevant implementation lanes.

## Published edition implementation

The center is an approximate El Segundo civic-center reference at 33.9192°N, 118.4165°W. This edition uses spherical haversine distance with mean Earth radius 6,371.0088 km. The 25-mile boundary is sampled at 5° bearings and displayed with a local equirectangular projection. Coastline and zone shapes are schematic; no numerical weather interpolation or PRISM raster is displayed.

Controls choose four seasons, five qualitative zones and four purposes. Each selection gives a seasonal starting plan, a location tradeoff, an evidence limit and links to original object concepts. The Object Library creates only a browser-local demo card and reflection. No inventory, reservation, manufacturing, submission, pickup or payment exists.

Downloads contain 48 station-month rows, 70 observed calendar-year rows (LAX and Downtown, 1991–2025), raw monthly source CSVs, evidence JSON and a complete research ZIP. The ZIP includes the exact daily and comparison source inputs required by its extractor. Run python3 extract-weather-data.py inside the extracted folder; no API key or network access is required. Public aliases are evidence.json = weather-data.json, normals.csv = monthly-normals.csv, observed-years.csv = observed-calendar-years.csv. All three outputs have been reproduced byte-for-byte from the included source snapshots.

Daily data filters retain nonmissing observations with blank GHCNd quality flags. Precipitation in tenths of mm is divided by 254 to obtain inches; trace rain retains zero measured depth. Temperatures in tenths of °C are converted to °F. Heat counts use whole-Fahrenheit rounding before the 90°F threshold and are not HeatRisk or an indoor safety measure. Counts are omitted when temperature coverage is incomplete. Annual rain requires all 365 or 366 expected calendar days, with no partial total presented as a complete year. Displayed annual rain is rounded to one decimal; revisions and conversions can differ from official annual climate reports.

Station history and data coverage differ. LAX airport metadata reaches 1930, while supplied daily elements begin in August 1944. Downtown's composite record began in July 1877; supplied daily elements begin in April 1906. Civic Center observations ran 1964–1999, USC 1999–2024, and FHMC began in May 2024. The normal uses a labeled USC orientation point, while original CSV metadata and current-site differences are retained in the evidence. Burbank airport metadata reaches 1931 but supplied daily elements begin in May 1998. Long Beach metadata reaches 1930 and supplied daily elements begin in January 1949.

Quality flags are variable-specific. Burbank normal high temperatures are R / Representative with 20–21 available years; lows are R with 18–20 and rain R with 20–23. Long Beach highs are S / Standard with 24–26 years, lows R with 22–23, and rain S with 29–30. Downtown mean-temperature flags vary R/S, while high and low flags are S. Missing months may be estimated; the source tables and JSON retain all separate high, low, mean and rain availability fields. A historic station name or metadata start does not prove a continuous variable record.

Original SVG illustrations use square glasses inspired by Nouns visual culture. No Nouns token artwork or repository code was imported. The object-character SVGs are dedicated to CC0 1.0; the atlas guides are independent original PointCast artwork. No NOAA, NWS, EPA, Nouns or municipal endorsement is claimed.

## Published source appendix

- [NOAA U.S. Climate Normals / periods, quality and comparison method](https://www.ncei.noaa.gov/products/land-based-station/us-climate-normals): Defines station normals, available-year flags and consistent-version comparison cautions. Four raw monthly station CSVs are linked above and downloadable below.
- [NWS Downtown Los Angeles observing-site move notice](https://www.weather.gov/media/notification/pdf_2023_24/scn24-47_downtown_los_angeles_observing_site_move.pdf): Series began July 1877; Civic Center 1964–1999, USC since 1999, relocation in May 2024. Moves limit direct site comparisons.
- [NOAA Historical Observing Metadata Repository](https://www.ncei.noaa.gov/access/homr/): Station coordinates, elevations and histories. The historical USC anchor differs from coordinates retained in the monthly normals CSV.
- [NOAA GHCN-Daily station data and quality flags](https://www.ncei.noaa.gov/pub/data/ghcn/daily/readme.txt): Daily records were aggregated for complete calendar years 1991–2025 at LAX and Downtown. Nonmissing values with blank quality flag only; trace measured rain retained as zero. Daily file links are included in downloads.
- [NOAA JetStream: Marine Layer](https://www.noaa.gov/jetstream/ocean/marine-layer): Explains inversion, variable depth, terrain reach and May Gray / June Gloom. Does not establish cloud hours on any atlas parcel.
- [NWS Los Angeles: Weather of Southern California, WR-261 (2000)](https://www.weather.gov/media/wrh/online_publications/TMs/TM-261.pdf): Historic regional interpretation: station-location map, August 1999 inversion and wind maps. Historic statistics and service guidance are not used as current warnings.
- [NWS Mountain and Valley Winds](https://www.weather.gov/safety/wind-mountain-valley): Santa Ana mechanism and September–May occurrence context. Offshore-wind checks apply beyond autumn.
- [NOAA California State Climate Summary 2022](https://statesummaries.ncics.org/chapter/ca/): Observations through 2020 show nearly 3°F statewide warming since the early twentieth century and major rainfall variability. State trend context and future emissions scenarios are separate from local station evidence.
- [NOAA/WPC Daily Weather Map archive](https://www.wpc.ncep.noaa.gov/dwm/dwm.shtml): Dated synoptic charts and historical 1871–2002 scans; these are weather snapshots, not porch-scale climatology.
- [USGS Historical Topographic Maps](https://www.usgs.gov/programs/national-geospatial-program/historical-topographic-maps-preserving-past): Preserves printed map editions from 1884–2006. Contours explain landscape; elevation lines are not measured weather boundaries.
- [PRISM 1991–2020 normals](https://prism.oregonstate.edu/normals/): 800 m and 4 km modeled climate grids. Linked as a future quantitative mapping option; no PRISM raster was processed for this edition.
- [PRISM mapping methods](https://prism.oregonstate.edu/methods/): Models consider terrain, station information and coastal influence; modeled cell values still need uncertainty and validation.
- [NWS During a Heat Wave](https://www.weather.gov/safety/heat-during): Basis for cooler activity periods, shade breaks and an indoor cooling alternative. Seasonal mean is not a heat-alert threshold.
- [EPA Wildfires and Indoor Air Quality](https://www.epa.gov/emergencies-iaq/wildfires-and-indoor-air-quality-iaq): Explains smoke entering homes and the limits of ventilation. Use current AirNow and official guidance.
- [EPA Create a Clean Room](https://www.epa.gov/emergencies-iaq/create-clean-room-protect-indoor-air-quality-during-wildfire): Source for clean-air room planning, commercial filtration and cooling tradeoffs. No library object is an air cleaner.
- [NOAA NIDIS California drought information](https://www.drought.gov/states/california): Dated drought context and different water-system impacts. A normal dry season is not a drought declaration.
- [NWS Flood Safety](https://www.weather.gov/safety/flood-turn-around-dont-drown): Current storm guidance overrides seasonal route ideas. The atlas does not estimate route passability.
- [Nouns visual culture](https://nouns.wtf/): Inspiration for original square-glasses illustrations. No Nouns token assets or code imported. Independent art; no official Nouns affiliation.


## Source SHA-256 fingerprints

```json
{
  "weather-data.json": "ca9afa472e8d9042b1c7813d93e35cfee2b16d1382365adb2634894743a1899b",
  "monthly-normals.csv": "db0237cbee33264e1f0f657fd88bcf96f291217924cfe0d3615919c2289fbae0",
  "observed-calendar-years.csv": "af16b9396f2d27ddb3697ddb09a0928dacfbaf0bd8c5d4de05f8432c1cee596b",
  "noaa-lax-1991-2020.csv": "a5505d14850b573b76f49e26124fb5ba927d33317d47f2bc5ef2fbda81f544e3",
  "noaa-downtown-la-1991-2020.csv": "b780e7c7c85a2dd5f39b99fc5fc8a3f269f78d617025630e7ee53e6915cea4a8",
  "noaa-burbank-1991-2020.csv": "043e06c591388f47e6d23a5928a0afa0aa248af8fc86164b17903ea9e789f285",
  "noaa-long-beach-1991-2020.csv": "40c98a899d32746020663933e27a6e52010ac2a6e215bd0303ac0589c7869540"
}
```

## Seasonal hazards and living evidence

# El Segundo living atlas — seasonal patterns, hazards, and useful objects

Research checked 2 October 2026. This is a primary-source editorial brief for a historical and seasonal atlas within a 25-mile straight-line radius of El Segundo. It is not a forecast, parcel-level hazard assessment, medical plan, or claim that any object has been made or is available to borrow. Suggested object names and map treatments below are original design proposals.

## Verified factual basis

### Marine layer and coast–inland contrasts

Cold coastal water cools the lowest air beneath a warmer layer: a temperature inversion. NOAA describes the persistence of this marine layer in Southern California's early summer as May Gray and June Gloom. Strong pressure aloft can compress the layer close to the coast; weaker pressure allows it to deepen and move farther inland. Terrain can interrupt that movement, and places above the inversion can be warmer and clearer than places below it. Therefore, a beach, an inland neighborhood, and a hilltop should not share one fixed comfort label. This is a physical explanation, not a measured boundary for a particular morning. [NOAA JetStream: The Marine Layer](https://www.noaa.gov/jetstream/ocean/marine-layer)

The sea breeze arises from different heating of land and water. Cooler marine air can advance inland during the day and alter temperature, humidity, and wind. Its local reach depends on the wider weather pattern, terrain, vegetation, and buildings; NOAA's generic examples should not be imported as measured El Segundo temperature differences or guaranteed afternoon cooling. [NOAA JetStream: The Sea Breeze](https://www.noaa.gov/jetstream/ocean/sea-breeze)

### Rain, dry summers, offshore wind, and terrain

NWS's regional guide describes metropolitan Southern California as having mild, sometimes wet winters and warm, very dry summers, with most rain from winter storms between November and March. Rain varies sharply with storm tracks, showers, wind direction, and terrain. Rising air over mountains can enhance precipitation. The same guide describes Santa Ana winds as dry offshore winds from the east or northeast, strongest below some passes and canyons. They occur mainly in fall and winter; falling air warms by compression, and fall events can produce coastal heat. Their impacts can include fire spread, debris, outages, and difficult travel. These are regional mechanisms, not an El Segundo frequency estimate. The guide is legacy educational material; do not reuse its old alert thresholds or assert that every offshore event is hot. [NWS San Diego: The Weather Guide](https://www.weather.gov/media/sgx/documents/The_Weather_Guide.pdf) (PDF pp. 33–35 and 42–43; zero-based pages; the history section is marked February 2012.)

### Historical variability, trends, and future scenarios

NOAA's 2022 California summary uses observations through 2020. It describes large year-to-year rainfall variability and periodic extended wet and dry intervals, and explains that atmospheric rivers can cause torrential rain. The statewide historical temperature series rose almost 3°F since the early twentieth century. Its future warming ranges come from climate-model emissions scenarios, not observed future conditions or annual local forecasts. These statewide results are useful context; they do not establish the warming rate, rainfall trend, or expected heat increase inside this 25-mile circle. The summary found no long-term statewide winter-precipitation trend through its analysis period. Avoid a single deterministic claim that every local winter will become drier. [NOAA NCEI: California State Climate Summary 2022](https://statesummaries.ncics.org/chapter/ca/)

Drought is an extended precipitation deficiency. NWS distinguishes meteorological drought (rainfall deficit), hydrologic drought (water supply effects), agricultural drought (soil and irrigation effects), and socioeconomic drought (supply and demand effects). A dry summer by itself is not proof of a declared drought, nor does a wet local storm prove that regional water supply has recovered. [NWS: Understand Drought and Know How to Respond](https://www.weather.gov/safety/drought)

The U.S. Drought Monitor is a weekly synthesis of physical indicators and local observations, with D0 identifying abnormally dry conditions and D1–D4 drought categories. Use its historical maps as separately dated regional context, not a neighborhood water restriction or property-level moisture reading. [NOAA NIDIS: California Drought Information](https://www.drought.gov/states/california)

### Heat and daily living

NWS recommends moving strenuous activities to cooler periods, reducing direct sun exposure, taking shade breaks, wearing suitable light clothing, and using a cool indoor location when needed. It also notes that fans can exhaust hot air or draw in cooler air, but should not be directed at people when a room is hotter than 90°F. Do not reduce heat comfort to a monthly average high; activity, shade, humidity, nighttime conditions, and the building matter. Current NWS information should override the seasonal plan. [NWS: During a Heat Wave](https://www.weather.gov/safety/heat-during)

### Smoke, air quality, ventilation, and combined heat

Smoke can affect a community even when the fire is far away, and can enter a building through open windows, ventilation, and leaks. A map of nearby fire locations alone does not measure personal exposure. [EPA: Wildfires and Indoor Air Quality](https://www.epa.gov/emergencies-iaq/wildfires-and-indoor-air-quality-iaq)

EPA's clean-room guidance recommends a comfortable room with windows and doors closed against smoke, no particle-producing activities, and a portable air cleaner sized for the room that does not generate ozone. A compatible higher-efficiency HVAC filter may also help; compatibility requires checking the system. Keep safely cool, and seek another suitable place if the home cannot remain cool or smoke continues entering. A homemade object should not be presented as a proven air-cleaning device. [EPA: Create a Clean Room](https://www.epa.gov/emergencies-iaq/create-clean-room-protect-indoor-air-quality-during-wildfire)

EPA's June 2026 combined heat-and-smoke guidance says that the coolest period can also be the smokiest. It recommends checking both temperature and air quality when timing outdoor activity, and explains that managing dangerous indoor heat can require tradeoffs with smoke protection. Consequently, “open the windows every evening” is unsuitable atlas copy. Describe ventilation as conditional on cooler outdoor air, acceptable air quality, safe conditions, and the building's equipment; include a cleaner-air cooling alternative. [EPA: Protect Yourself From Smoke and Heat](https://www.epa.gov/system/files/documents/2026-06/heat-and-smoke-factsheet_1.pdf) (June 2026, EPA-452/F-26-009)

AirNow recommends its Fire and Smoke Map during wildfire smoke. It combines permanent and temporary PM2.5 monitors with crowdsourced sensors, fire locations, and smoke information. The ordinary AirNow dial can show a different pollutant, such as ozone. A smoke plume and a nearby sensor should not be treated as a certified indoor reading or a guarantee for an unmonitored neighborhood. [AirNow: Using AirNow During Wildfires](https://www.airnow.gov/fires/using-airnow-during-wildfires/); [AirNow Fire and Smoke Map](https://fire.airnow.gov/)

### Travel and storm overrides

During a high wind warning, NWS directs people into a sturdy building. Outdoor areas under trees or power lines and high-profile road vehicles can be vulnerable. The atlas should make wind warnings an override for exposed recreation rather than marking a ridge or beach as always suitable. [NWS: During a High Wind Event](https://www.weather.gov/safety/wind-during)

Do not route walkers or drivers into flood water or around flooded-road barriers. A historical rain map is not a passability map. [NWS Flood Safety](https://www.weather.gov/safety/flood-turn-around-dont-drown)

Low visibility can change an otherwise comfortable coastal trip: NWS advises slower driving, extra time, low-beam headlights, and greater following distance in fog. A thermal suitability layer should not imply that transportation conditions are safe. [NWS: Driving in Fog](https://www.weather.gov/safety/fog-driving)

### Station-data interpretation

LAX's ASOS calculates running five-minute temperature averages. Its shortened public five-minute reports round to whole Celsius degrees, while official daily highs and lows use more precise internally tracked values. Daily climate-report times use local standard time. Use official climate records for historical extremes, not highs and lows reconstructed from rounded public intraday observations. This still leaves station exposure, coverage, and neighborhood representativeness to be documented by the atlas's station appendix. [NWS Los Angeles: How Is Temperature Reported at Airports (Like LAX)?](https://www.weather.gov/lox/asostemperature)

## Suggested seasonal calendar — editorial inference

These are planning defaults inferred from the verified mechanisms above. They are not monthly predictions or universal rules. Pair them with the atlas's actual station normals and dated observations.

| Period | Useful living pattern | Change plan when | Object concept connection |
| --- | --- | --- | --- |
| December–February | Choose a dry daylight interval for outdoor time; carry a removable layer and keep rain gear accessible. Plan an indoor making or reading alternative. | Storm, flood, surf, wind, air-quality, or heat information conflicts with the seasonal default. | Rain Sleeve for a notebook; Layer Roll for a light layer; Focus Dial and Ambient Lamp for indoor time. |
| March–April | Reassess shade and layers as days lengthen. Use a garden observation log before adjusting watering; follow the actual local water rules. | Late storms, rain-slick routes, wind, or unusually warm days change the outing. | Water Ledger as a manual soil/rain/watering journal; Pocket Companion as a packing reminder. |
| May–June | Allow for coastal gray mornings and variable clearing. Compare the beach and inland plan on the day; keep a removable layer in the bag. | Persistent coastal cloud, low visibility, unexpected inland heat, or a deep marine layer changes comfort. | Layer Roll; Ambient Lamp for gray-day indoor work; Pocket Companion with separate coast/inland checkboxes. |
| July–August | Start with a shade-first route and cooler activity window; compare indoor and outdoor conditions before ventilating. Choose a cooled indoor alternative during significant heat. | Hot nights, unusual humidity, smoke, poor air quality, or a weak marine layer reduces the expected relief. | Shade Dial as a manual sun/shade planning tool; Window Compass as a check-before-opening reminder; Focus Dial indoors. |
| September–October | Keep both summer shade gear and an offshore-wind plan ready. Coastal proximity can be helpful under onshore flow, but it is not a heat exemption. | Offshore heat, wind, fire alerts, smoke, or the first storm overrides the routine. | Shade Dial; Filter Caddy for storing/carrying a standard commercial cleaner and replacement filter; Pocket Companion for an alert checklist. |
| November | Return rain gear to the everyday kit while retaining heat, wind, and smoke checks. Prepare an indoor alternate and review household equipment. | Weather differs from the seasonal transition; significant hazards require following current official instructions. | Rain Sleeve; Ambient Lamp; Window Compass. |

Object names above are illustrative concepts, not inventory, bookings, fabrication claims, tested products, sensors, protective equipment, or substitutes for official guidance. The Filter Caddy is storage/handling furniture, not an original filtration technology. A shade object needs real wind and stability testing before outdoor use.

## Suitable map design

Use separate layers for coastal exposure, inland thermal range, hills/slopes, and urban surface context. Draw illustrative zones softly rather than crisp claims about exact marine-layer reach. Offer seasons and daily-use goals such as “shade,” “layers,” “rain readiness,” and “indoor alternate.” Do not name one neighborhood the optimum place for every resident or activity.

For each selected zone, show the nearest relevant station(s), elevation, record period, data category, and uncertainty. Keep these categories explicit:

- **Observed history:** a measured station value on a date, with source and station metadata.
- **Climate normals:** a defined 30-year station baseline; not the conditions expected every day.
- **Trend context:** an analysis over a stated region and period; statewide warming is not a measured local rate.
- **Scenario:** a modeled possible future with stated assumptions; not an annual prediction.
- **Illustrative suitability:** an editorial interpretation for a specified activity and season; not measured at every map point.

The 25-mile circle is an editorial area, not a meteorological barrier: systems, smoke, winds, watersheds, and water supplies cross it. Clip displayed recommendations to the circle, but allow explicitly labeled outside-area stations or regional context where necessary. Do not infer local smoke safety, landslide exposure, fire hazard, road passability, or flood probability solely from monthly temperature and rain normals.

Current information links should be clearly labeled live external resources: [NWS Los Angeles/Oxnard](https://www.weather.gov/lox/), [AirNow Fire and Smoke Map](https://fire.airnow.gov/), and [NOAA NIDIS California](https://www.drought.gov/states/california). Do not freeze today's advisories into a timeless historical atlas.

## Historical mapping connection

NWS's education resource page links both archived daily weather maps and its regional weather-history compilation. Those support a historical story about station observations and large-scale maps being interpreted alongside local terrain and reports. The weather-history compilation is selected significant events, not a complete census or a normal-frequency estimate. A dated map should carry its observation time and period rather than being presented as a modern forecast. [NWS San Diego: Education Resources](https://www.weather.gov/sgx/education_resources); [NWS: A History of Significant Weather Events in Southern California](https://www.weather.gov/media/sgx/documents/weatherhistory.pdf)

## Methodology and limitations

1. Read NOAA/NWS sources for regional mechanisms, seasonal context, station interpretation, and public hazard guidance; read EPA/AirNow for smoke and indoor-air choices. Followed primary-source links and verified the exact destinations through web reads.
2. Kept qualitative regional explanations separate from local measurements. No new interpolation, neighborhood heat series, daily smoke climatology, parcel hazard ranking, or equipment performance study was performed for this brief.
3. Included the NOAA 2022 state summary only as state-scale context, retaining its observed period through 2020 and separating its model projections from observations. Excluded today's transient alerts from seasonal factual copy.
4. Applied regional sources as clearly labeled editorial inference in the calendar. Need station normals and a radius calculation from the atlas's other research work before publishing numeric local claims.
5. NWS's legacy Weather Guide is appropriate for broad mechanisms, but its historic service descriptions, statistics, hazard criteria, and some narrative claims may be outdated. The atlas should use current official information for live decisions.
6. DWR's Drought and Conservation Tips pages appeared in web responses but returned 403 on detailed reread; no specific water-saving claim from them is used here. The HeatRisk application likewise returned 403. Use verified NWS heat guidance and link the local NWS entry point; do not imply the research captured HeatRisk data.

The practical atlas question is “what helps this activity under these conditions?” Good labels describe the tradeoff and the next check. They cannot guarantee personal comfort, forecast precision, or one universally best place to live.
