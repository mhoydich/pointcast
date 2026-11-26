// Sources for the SB Surf House study. [key, short label shown beside a claim, full title, url].
// Every page was opened on 2026-11-11 unless `read: false` says otherwise.
// Titles describe the page in neutral words; a business is named only where the link is its own site.
export const OPENED = '2026-11-11';
export const SOURCES = [
  // market
  ['indy_oct', 'Independent, Oct 29 2026', 'Santa Barbara Independent: South Coast market through September 2026 (MLS figures in a brokerage column)', 'https://www.independent.com/?p=776041'],
  ['indy_mid', 'Independent, Jul 23 2026', 'Santa Barbara Independent: mid-year 2026 real estate review (Santa Barbara MLS data)', 'https://www.independent.com/2026/07/23/real-estate-market-mid-year-review-2026/'],
  ['z_goleta', 'Zillow, Sep 30 2026', 'Zillow Home Value Index and rent, Goleta CA', 'https://www.zillow.com/home-values/4931/goleta-ca/'],
  ['z_iv', 'Zillow, Aug 31 2026', 'Zillow Home Value Index and rent, ZIP 93107 area (Isla Vista)', 'https://www.zillow.com/home-values/97129/isla-vista-ca-93107/'],
  ['z_carp', 'Zillow, Dec 31 2025', 'Zillow Home Value Index and rent, ZIP 93014 area (Carpinteria)', 'https://www.zillow.com/home-values/97093/carpinteria-ca-93014/'],
  ['zumper', 'Zumper, Nov 10 2026', 'Zumper rent research, Santa Barbara CA', 'https://www.zumper.com/rent-research/santa-barbara-ca'],
  ['pmms', 'AP via WCAX, Nov 5 2026', 'Freddie Mac weekly 30-year average, reported by the Associated Press', 'https://www.wcax.com/2026/11/05/average-us-30-year-mortgage-rate-falls-718-this-week-its-third-straight-decline/'],
  ['tax', 'Property Tax Almanac, Apr 2026', 'Property Tax Almanac: Santa Barbara County rates (verify with the County Assessor)', 'https://propertytaxalmanac.com/california/santa-barbara/'],
  ['ins', 'Insurance Journal, Jun 18 2026', 'Insurance Journal: California homeowners insurance averages from a 2026 rate-filing report', 'https://www.insurancejournal.com/news/west/2026/06/18/874306.htm'],
  ['fair', 'CA Dept. of Insurance, Aug 3 2026', 'California Department of Insurance: FAIR Plan growth slows below 2%', 'https://www.insurance.ca.gov/0200-industry/0105-alert/upload/FAIR-Plan-growth-slows-below-2-as-Californias-insurance-market-continues-to-show-signs-of-recovery.pdf'],
  // place
  ['surf', 'The Surf Atlas guide', 'The Surf Atlas: guide to Santa Barbara surf', 'https://thesurfatlas.com/surfing-in-the-usa/santa-barbara-surf/'],
  ['slr', 'City SLR plan summary, 2021', 'City of Santa Barbara Sea-Level Rise Adaptation Plan, executive summary (adopted Feb 2, 2021)', 'https://santabarbaraca.gov/sites/default/files/documents/Services/SLR%20Adaptation%20Plan/Sea-Level%20Rise%20Executive%20Summary.pdf'],
  ['slr_page', 'City sea-level page', 'City of Santa Barbara: sea-level rise adaptation maps page (modified Mar 12, 2026)', 'https://sustainability.santabarbaraca.gov/explore/energy-climate-division/adaptation-resilience-program/sea-level-rise-adaptation/sea-level'],
  ['iv_bluff', 'Independent, Sep 22 2026', 'Santa Barbara Independent: Isla Vista bluffs and the County bluff policy', 'https://www.independent.com/?p=767020'],
  ['iv_bluff19', 'Independent, Jul 19 2019', 'Santa Barbara Independent: County red-tag criteria for Del Playa (retreat up to 20 inches a year)', 'https://www.independent.com/2019/07/19/county-to-narrow-red-tag-criteria-for-homes-atop-isla-vista-cliffs/'],
  ['fire', 'Independent, Apr 13 2025', 'Santa Barbara Independent: 2025 state fire hazard maps for the county', 'https://www.independent.com/2025/04/13/new-map-showing-greatest-santa-barbara-county-fire-hazards/'],
  ['burn', 'County APCD / Fire', 'Santa Barbara County Air Pollution Control District and Fire: permit burning', 'https://www.ourair.org/permit-burning/'],
  // rules
  ['lcp', 'Coastal Commission', 'California Coastal Commission: Local Coastal Programs', 'https://coastal.ca.gov/lcp/lcp-info'],
  ['str_city', 'Independent, Oct 7 2026', 'Santa Barbara Independent: City Council adopts short-term rental ordinances', 'https://www.independent.com/2026/10/07/santa-barbara-city-council-supports-new-rules-for-short-term-rentals/'],
  ['str_city2', 'Avalara, Oct 2026', 'Avalara MyLodgeTax: Santa Barbara short-term rental rules, licensing, fines and taxes', 'https://www.avalara.com/mylodgetax/en/blog/2026/09/santa-barbara-short-term-rental-rules-licensing-zoning-fines-and-taxes.html'],
  ['str_city_gov', 'City notice, Sep 2026', 'City of Santa Barbara: Short-Term Rental Ordinances at City Council (Sep 2026 notice; the ordinance text itself was not read)', 'https://santabarbaraca.gov/node/20302'],
  ['str_county', 'County release, Apr 1 2025', 'Santa Barbara County guidance for short-term rental owners (press release as published by the Independent)', 'https://www.independent.com/2025/04/01/santa-barbara-county-provides-guidance-for-short-term-rental-owners/'],
  ['str_county_gov', 'County page (did not load, not read)', 'County of Santa Barbara: Short-Term Rental Ordinance page (only the navigation loaded on Nov 11, 2026; not read)', 'https://www.countyofsb.org/776/Short-Term-Rental-Ordinance', { read: false }],
  ['ccc2018', 'Coastal Commission, 2018', "Coastal Commission staff report on the County's coastal short-term rental amendment (denied May 10, 2018)", 'https://documents.coastal.ca.gov/reports/2018/8/f17a/f17a-8-2018-report.pdf'],
  ['carp_code', 'Carpinteria code 14.47, third-party copy', 'Carpinteria Municipal Code chapter 14.47, Vacation Rental Overlay District (third-party code library, not the City\'s own copy)', 'https://gocodebook.com/library/us/ca/carpinteria-zoning/chapter-14.47-vacation-rental-overlay-district-2'],
  ['carp_pol', 'City of Carpinteria, Jul 2025', 'City of Carpinteria: short-term rental policies and procedures (updated Jul 31, 2025)', 'https://carpinteriaca.gov/wp-content/uploads/2025/07/STR-Policies-and-Procedures-Updated-2025-07-31-34522409.1.pdf'],
  ['adu', 'HCD ADU Handbook, Mar 2026', 'California HCD Accessory Dwelling Unit Handbook (March 2026)', 'https://www.hcd.ca.gov/sites/default/files/docs/policy-and-research/ADU-Handbook-Update.pdf'],
  ['iv_inspect', 'Independent, Dec 15 2025', 'Santa Barbara Independent: Isla Vista rental inspection pilot at the halfway point', 'https://www.independent.com/2025/12/15/isla-vista-rental-inspection-program-hits-halfway-point/'],
  // legal
  ['sec_fw', 'SEC staff framework (withdrawn)', 'SEC FinHub: Framework for Investment Contract Analysis of Digital Assets (2019; marked withdrawn and superseded Mar 2026)', 'https://sec.gov/corpfin/framework-investment-contract-analysis-digital-assets'],
  ['sec_2026', 'Law-firm summary, Mar 2026', 'Morrison Foerster: SEC interpretive release on crypto assets of Mar 17, 2026 (a summary; the release itself was not read)', 'https://www.mofo.com/resources/insights/260323-sec-issues-interpretive-release-on-crypto-assets'],
  ['regcf', 'SEC: Regulation Crowdfunding', 'SEC: Regulation Crowdfunding overview', 'https://www.sec.gov/smallbusiness/exemptofferings/RegCrowdfunding'],
  ['exempt', 'SEC exemptions chart', 'SEC Office of the Advocate for Small Business Capital Formation: capital-raising exemptions chart', 'https://sec.gov/files/chart-amended-capital-raising-exemptions-oasb.pdf'],
  ['dre', 'Cal. B&P Code 10131', 'California Business and Professions Code section 10131 (acts that require a real estate broker licence)', 'https://california.public.law/codes/business_and_professions_code_section_10131'],
  // structures
  ['wy_dao', 'Wyoming Secretary of State', 'Wyoming Secretary of State: DAO frequently asked questions', 'https://sos.wyo.gov:443/Business/Docs/DAOs_FAQs.pdf'],
  ['duna', 'Law-firm note, Apr 2024', 'Fintech and Digital Assets blog: Wyoming adopts the DUNA structure for DAOs', 'https://www.fintechanddigitalassets.com/2024/04/wyoming-adopts-new-legal-structure-for-daos/'],
  ['ooki', 'Proskauer, Jul 2023', 'Proskauer: a federal default judgment against a DAO with no legal wrapper', 'https://www.proskauer.com/blog/from-code-to-consequence-cftc-obtains-default-judgment-against-ooki-dao-for-commodity-exchange-act-violations'],
  ['lehc', 'Cal. Civil Code 817', 'California Civil Code section 817: limited-equity housing cooperatives', 'https://california.public.law/codes/civil_code_section_817'],
  ['clt', 'Lincoln Institute', 'Lincoln Institute of Land Policy: Community Land Trusts', 'https://www.lincolninst.edu/publications/articles/community-land-trusts'],
  ['cht', 'Champlain Housing Trust', 'Champlain Housing Trust: shared equity programme results', 'https://www.getahome.org/innovation/'],
  ['c7', 'IRS: social clubs', 'IRS: social clubs under section 501(c)(7)', 'https://irs.gov/charities-non-profits/other-non-profits/social-clubs'],
  ['tic', 'TIC primer', 'Sirkin Law: tenancy in common, an introduction', 'https://andysirkin.com/tenancy-in-common-tic/general-information/tenancy-in-common-primer/'],
  ['pac_sh', 'Press Democrat', 'Press Democrat: a Napa Valley city and a fractional-ownership company settle a federal suit', 'https://www.pressdemocrat.com/article/napa/st-helena-pacaso-settle-suit-over-fractional-home-ownership-companys-ope/'],
  ['pac_sb', 'Independent, May 24 2022', 'Santa Barbara Independent: Riviera neighbours oppose a fractional-ownership house', 'https://www.independent.com/?p=390883'],
  // precedents
  ['sbshc', 'SBSHC', 'Santa Barbara Student Housing Cooperative: about', 'https://www.sbcoop.org/about.html'],
  ['sbshc_dn', 'Daily Nexus, May 22 2026', 'Daily Nexus: the student housing co-op as lower-cost housing', 'https://dailynexus.com/2026-05-22/sbshc-provides-alternative-affordable-housing-to-students/'],
  ['sano', 'LAist, Sep 7 2024', "LAist: San Onofre lease renewed, with the surfing club's history", 'https://laist.com/news/los-angeles-activities/lease-to-san-onofre-beach-renewed-for-25-years-yes-its-rented-property'],
  ['links', 'Golf Business News, May 23 2023', 'Golf Business News: a Scottish links course sold to an online golf community', 'https://golfbusinessnews.com/news/property/spey-bay-sold-to-us-based-online-golf-community/'],
  ['city_b', 'Belfer Center, Jun 2023', 'Harvard Kennedy School Belfer Center: case study of a collective land-ownership DAO', 'https://www.belfercenter.org/index%2Ephp/publication/deep-dive-citydao-experiment-collective-land-ownership-and-decentralized-governance'],
  ['city_c', 'Cowboy State Daily, May 14 2023', "Cowboy State Daily: a DAO's parcel near Yellowstone", 'https://cowboystatedaily.com/2023/05/14/wyomings-first-digital-land-buy-wasnt-storys-historic-wagon-box-inn-it-was-citydao-near-yellowstone'],
  ['city_ct', 'Cointelegraph, Sep 4 2025', 'Cointelegraph Magazine: on the record of blockchain city projects', 'https://cointelegraph.com/magazine/why-blockchain-cities-fail'],
  ['cabin', 'Cabin forum', 'Cabin forum: A new era for Cabin', 'https://forum.cabin.city/t/a-new-era-for-cabin/396'],
  ['realt', 'Michigan Public, Mar 20 2026', 'Michigan Public: report on a tokenised rental company in Detroit', 'https://www.michiganpublic.org/social-justice/2026-03-20/the-model-no-longer-works-crypto-landlords-detroit-enterprise-is-crumbling'],
  ['ebprec', 'Shareable, Aug 2018', 'Shareable via Resilience: a Bay Area real estate cooperative with community-investor members', 'https://www.resilience.org/stories/2018-08-13/how-the-east-bay-permanent-real-estate-cooperative-is-pioneering-a-model-for-equitable-housing/'],
  // running
  ['hostel', 'Tofino Hostel FAQ', 'Tofino Hostel: accommodation FAQs (surf shack, outdoor rinse shower)', 'https://tofinohostel.com/?p=257'],
  ['outsite', 'Outsite house rules', 'Outsite coliving: house rules', 'https://www.outsite.co/blog/outsite-house-rules'],
];
