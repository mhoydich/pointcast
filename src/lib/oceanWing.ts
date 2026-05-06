/**
 * Ocean Wing — UES Track 09. The Pacific edge of the 25-mile radius.
 *
 * Water as the second elemental track, paired with Geology (earth) at
 * Track 08. The wing maps the coastline inside the radius from El
 * Porto south to Redondo, names the surf breaks and tide pools and
 * sand-quality bands, and proposes four ocean practices that run
 * parallel to Marine Layer's eight-week atmospheric calendar.
 */

export const TRACK_META = {
  title: 'Ocean Wing',
  subtitle: 'UES Track 09 · The Pacific edge of the 25-mile radius',
  thesis: 'The ocean is the western boundary of the radius and the largest single piece of geography we have. The wing names twelve coastal sites, six tide-and-surf realities, four ocean practices, and the small civic architecture (six benches, four signs, one observation deck) that makes the coastline legible. Cross-paired with Marine Layer (atmospheric track) and Geology (subterranean track) to complete a three-axis sensory frame.',
  authors: [
    { name: 'Michael Hoydich', dept: 'Department of Local Geography', email: 'mh@pointcast.xyz' },
    { name: 'The Marine Layer Cohort', dept: 'University of El Segundo', email: 'cohort@pointcast.xyz' },
  ],
  affiliation: 'University of El Segundo',
  paperNumber: 'UES-Track-09',
  date: '2026-05-06',
};

export const PRINCIPLES = [
  'The ocean is older than the meditation. The Pacific has been here for ~200 million years; we have been sitting on its edge for ten.',
  'Read the tide before you read the news. Tides are predictable, public, and free; the daily news is none of those.',
  'Cold water is honest. The Pacific at El Porto is 58–62°F most of the year. There is no warm version of this practice.',
  'Beach access is a civic right. The California Coastal Act establishes vertical access; private property steadily closes it. Document, do not lament.',
  'The surf line is a social place. The lineup at Manhattan Pier is the Civic Layer with a different vocabulary.',
  'Take only photographs and tide-pool observations. Leave only ledger entries.',
];

export type CoastalSite = {
  slug: string; name: string; city: string;
  kind: 'beach' | 'pier' | 'overlook' | 'tide-pool' | 'preserve' | 'jetty';
  access: string; sand: string; surf: string; whatItTeaches: string;
  marineLayerLink?: string;
};

export const COASTAL_SITES: CoastalSite[] = [
  { slug:'el-porto', name:'El Porto', city:'Manhattan Beach', kind:'beach', access:'Public; metered street parking on Highland; lifeguarded.', sand:'Fine quartz; magnetite black-sand bands at the swash zone after winter storms.', surf:'A-frame beach break, mostly closeouts at low; head-high or larger on solid swells. Crowded.', whatItTeaches:'The radius\'s most consistent surf school. Marine Layer Week 05 sits here under the LAX flight path.', marineLayerLink:'/marine-layer' },
  { slug:'es-beach', name:'El Segundo Beach', city:'El Segundo', kind:'beach', access:'Free; large parking lot at Grand Ave end; lifeguarded summer.', sand:'Coarser quartz; less heavy-mineral concentration than El Porto.', surf:'Mellow walls; a beginner-friendly break south of the jetty.', whatItTeaches:'The home beach. The ocean substrate of the city.', marineLayerLink:'/marine-layer' },
  { slug:'dockweiler', name:'Dockweiler State Beach', city:'Playa del Rey', kind:'beach', access:'Free; large lot; LAX departure traffic immediately overhead.', sand:'Mixed quartz; heavy summer crowding.', surf:'Long beach break; rideable on most days.', whatItTeaches:'The acoustic edge — surf plus jet engines. A reading of the post-1928 Anthropocene marker layer at sound-pressure scale.', marineLayerLink:'/marine-layer' },
  { slug:'imperial-jetty', name:'Imperial Highway Jetty', city:'El Segundo', kind:'jetty', access:'Public walkway; check signage at the Hyperion outfall.', sand:'No sand; granite riprap.', surf:'No break; the jetty interrupts longshore drift.', whatItTeaches:'How the coastline gets engineered. The Hyperion treatment plant outfall is here; the jetty was built to protect it.' },
  { slug:'mb-pier', name:'Manhattan Beach Pier', city:'Manhattan Beach', kind:'pier', access:'Open, free; Roundhouse Aquarium at the end (donation).', sand:'Fine quartz; small dune section north of the pier.', surf:'Quality A-frame on most swells; the Roundhouse marks the takeoff.', whatItTeaches:'Marine Layer Week 08 — Pier Closer. The radius edge as architectural fact: the pier is the line.', marineLayerLink:'/marine-layer' },
  { slug:'hermosa-pier', name:'Hermosa Beach Pier', city:'Hermosa Beach', kind:'pier', access:'Open, free; busy promenade.', sand:'Coarse quartz; volleyball courts adjacent.', surf:'Lefts and rights off the pier pilings.', whatItTeaches:'The volleyball-and-bar-life civic culture of the radius south.' },
  { slug:'redondo-tide-pools', name:'Redondo Tide Pools (Veterans Park area)', city:'Redondo Beach', kind:'tide-pool', access:'Public; tide-table required.', sand:'Cobble + sand; rocky reef exposed at low tide.', surf:'Reef break for advanced; not a beginner spot.', whatItTeaches:'Sea anemones, hermit crabs, ochre stars. Living geology at low tide.' },
  { slug:'pv-marine-preserve', name:'Abalone Cove (PV Marine Reserve)', city:'Rancho Palos Verdes', kind:'preserve', access:'Trail down the bluff; tide-table mandatory; no take.', sand:'Cobble; minimal sand pockets between rock outcrops.', surf:'Strong reef break for experienced surfers only.', whatItTeaches:'A protected marine reserve inside the 25-mile radius. The Pleistocene marine terrace stairsteps Marine Layer Week 03 reads from Hilltop.', marineLayerLink:'/marine-layer' },
  { slug:'topanga-state', name:'Topanga State Beach', city:'Topanga', kind:'beach', access:'Free; PCH parking; rocky shoreline.', sand:'Cobble + coarse sand; limited beach.', surf:'Right-hand point break, world-class on the right swell.', whatItTeaches:'A real point break inside the radius. The waves wrap a rocky headland and produce one of California\'s longer rides.' },
  { slug:'malibu-pier', name:'Malibu Pier (Surfrider Beach)', city:'Malibu', kind:'pier', access:'Free; PCH parking; busy.', sand:'Fine quartz; protected by the headland.', surf:'The right-hand point break; arguably the most-photographed wave in California.', whatItTeaches:'The 1957 *Gidget* shoreline; the cultural origin of California surf identity. Near the radius edge.' },
  { slug:'imperial-overlook', name:'Imperial Avenue Dunes Overlook', city:'El Segundo', kind:'overlook', access:'Free; bring a layer.', sand:'Aeolian dune sand; ES Blue butterfly habitat substrate.', surf:'View only; no water access here.', whatItTeaches:'Marine Layer Week 03 (Imperial Blue Hour). The dune you stand on is the same dune the butterfly needs.', marineLayerLink:'/marine-layer' },
  { slug:'vista-del-mar-bluff', name:'Vista del Mar Bluffs', city:'Playa del Rey', kind:'overlook', access:'Free; sidewalk access; do not approach the edge.', sand:'No sand at overlook; bluff face is Pleistocene sandstone.', surf:'View only; surf at Dockweiler below.', whatItTeaches:'Active sea-cliff retreat at measurable rates. Geology field walk #4. Common Forms commission B3 (the cantilevered observation deck).', marineLayerLink:'/marine-layer' },
];

export type TideAndSurfReality = { name: string; detail: string; cohortNote: string };

export const TIDE_SURF_REALITIES: TideAndSurfReality[] = [
  { name: 'Two highs, two lows per day (mostly)', detail: 'The Pacific runs a mixed semi-diurnal tide: roughly two highs and two lows in 24h 50min, with significant inequality between the pair. Tide-table apps work; the printed NOAA chart for Santa Monica Bay is canonical.', cohortNote: 'Marine Layer Week 01 (Plaza Dawn) sits at low tide most of the time by accident; Week 03 (Imperial Blue Hour) reads better at incoming tide.' },
  { name: 'Spring and neap tides cycle every two weeks', detail: 'Spring tides at new and full moon (extreme highs and lows); neap at the quarter moons (compressed range). The cohort\'s tide-pool walks are scheduled at spring lows.', cohortNote: 'Tide-pool field walks at Redondo and Abalone Cove require checking the tide chart 48h ahead; spring lows are the only useful windows.' },
  { name: 'Longshore drift moves sand south to north (mostly)', detail: 'Wave action sorts sand along the coast. Inside the radius, the dominant net drift is northward, but seasonal reversal occurs in winter storm sets. The Imperial Highway jetty interrupts the flow.', cohortNote: 'The dark magnetite bands at El Porto are concentrated by storm reversals; check the swash zone after the first big winter swell.' },
  { name: 'The marine layer fog cycle is daily', detail: 'May–September the marine layer rolls in nightly and burns off by mid-morning; October–April it is more variable. The cohort schedules dawn sits in May–September for reliable fog.', cohortNote: 'Marine Layer paper UES-WP-2026-01 documents the eight weekly sit locations as fog-window-aware.' },
  { name: 'Pacific water temperature: 58–66°F year-round', detail: 'Summer peaks low-to-mid 60s in the South Bay; winter lows high 50s. There is no warm version of this practice; cold-water acclimation is part of the work.', cohortNote: 'Cold-water swim practice (Practice 03 below) is a 60-day acclimation arc, not a one-time event.' },
  { name: 'Surf height correlates with NOAA buoy 46221 (Santa Monica Bay)', detail: 'The buoy 11 nautical miles offshore reads dominant period and significant wave height; surf forecasts at El Porto/MB are derived from this reading plus tide and wind. Most days the buoy reads 2–4 ft; storm swells push 8–12 ft.', cohortNote: 'A weekly buoy reading at Plaza Dawn Sit is a Marine Layer artifact-of-attention practice. Buoy data: ndbc.noaa.gov/station_page.php?station=46221.' },
];

export type OceanPractice = { name: string; cadence: string; detail: string; logsTo: string };

export const OCEAN_PRACTICES: OceanPractice[] = [
  { name: 'Tide-table read', cadence: 'daily', detail: 'Read the next high and low tide for Santa Monica Bay. One line written down. Takes thirty seconds; orients the day toward water rather than news.', logsTo: '/commons (Hours give-back, ×30 daily reads = +1 weight per month)' },
  { name: 'Beach walk to a known point', cadence: 'weekly', detail: 'Walk one of the twelve coastal sites end-to-end at low tide. Note the swash zone color, the heavy-mineral bands if any, the surf height by the buoy reading. Photo, post, log.', logsTo: '/commons (Hours give-back, +1 weight per walk)' },
  { name: 'Cold-water acclimation', cadence: '60-day arc, three sessions per week', detail: 'Begin with 30-second waist-deep wades at El Porto; build to 5-minute submerged sessions over sixty days. Always with a witness. Always at lifeguarded beaches.', logsTo: '/commons (Hours give-back, +1 per session; Custody +4 at completion of the 60-day arc)' },
  { name: 'Tide-pool sit', cadence: 'monthly at spring low', detail: 'At Redondo or Abalone Cove, sit beside one tide pool for thirty minutes. Identify three species. Touch nothing; take only one photograph; leave the pool exactly as you arrived.', logsTo: '/commons (Hours +1) and the Marine Layer artifact log' },
];

export const SMALL_INTERVENTIONS = [
  { id: 'six-benches', name: 'Six Pacific-edge benches', detail: 'Bench markers at El Porto south jetty, El Segundo Grand Ave end, Imperial Highway overlook, MB Pier base, Hermosa Pier base, Redondo Tide Pool entry. Cast concrete with reclaimed Douglas fir. Cross-pairs with Common Forms commission A2 (Imperial Bench).', cost: '$11,000', commonsCommission: 'A2' },
  { id: 'four-tide-signs', name: 'Four tide-realities signs', detail: 'Weathering-steel signs at the four most-walked beach entry points (El Porto, El Segundo, Dockweiler, MB Pier) carrying the printed NOAA Santa Monica Bay tide table updated quarterly. Bronze plaque on each crediting the Coastal Commission and the Marine Layer cohort.', cost: '$6,400', commonsCommission: 'A4' },
  { id: 'vista-deck', name: 'Vista del Mar bluff observation deck', detail: 'Already a Common Forms commission (B3). Cantilevered cast-concrete deck acknowledging active sea-cliff retreat. Reading point for the radius\'s most legible coastal change.', cost: '$70–100K', commonsCommission: 'B3' },
];

export const CITATIONS = [
  { key: 'noaa-bouy', source: 'NOAA National Data Buoy Center · Station 46221 (Santa Monica Bay) · ndbc.noaa.gov/station_page.php?station=46221.' },
  { key: 'noaa-tides', source: 'NOAA Tides and Currents · Santa Monica reference station 9410840 · tidesandcurrents.noaa.gov.' },
  { key: 'coastal-act', source: 'California Coastal Act (1976), Public Resources Code §30000 et seq. · coastal.ca.gov.' },
  { key: 'la-county-beaches', source: 'Los Angeles County Department of Beaches and Harbors · beaches.lacounty.gov.' },
  { key: 'pv-marine-reserve', source: 'California Department of Fish and Wildlife · Abalone Cove State Marine Conservation Area · wildlife.ca.gov.' },
  { key: 'pointcast-marine-layer', source: 'University of El Segundo. (2026). Marine Layer: A Place-Based Meditative Program. UES-WP-2026-01. https://pointcast.xyz/marine-layer' },
  { key: 'pointcast-geology', source: 'University of El Segundo. (2026). Geology — UES Track 08. https://pointcast.xyz/geology' },
];
