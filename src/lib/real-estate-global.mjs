/**
 * Curated educational research, checked 2026-10-03.
 * Sources establish the cited rules and definitions, not investment merit.
 * Market theses, strategy questions, and the yield example are original study prompts.
 * No observed listing prices, market yields, forecasts, or loan offers are represented.
 */
export const globalResearchMetadata = {
  checkedAt: '2026-10-03',
  coverage: 'Eight representative markets; a starting atlas rather than an exhaustive global database.',
  approach: 'Compare the ownership wrapper, cash-flow mechanism, rules, operating burden, financing and exit before comparing returns.',
  thesisStatus: 'Editorial research questions, not evidence of mispricing or recommendations.',
  noiConvention: 'Operating NOI here is before debt service, income tax, depreciation, capital expenditure and replacement reserves. Cash flow then deducts reserves and debt service. A lender may use a different NOI convention.',
  notIncluded: ['Observed market yield rankings', 'Personal tax calculations', 'Current mortgage offers', 'Foreign-buyer eligibility determinations', 'Executable trades or property purchases'],
};

export const globalMarkets = [
  {
    id: 'los-angeles', name: 'Los Angeles', country: 'United States', region: 'North America', currency: 'USD',
    access: 'Begin with a specific parcel, title, permitted use and ownership structure. The local atlas is a 25-mile study from El Segundo City Hall; it is not the boundary of the Los Angeles market.',
    thesis: 'The neighborhood is the unit of research. Compare small rentals, multifamily, employment-serving space and reuse by lawful use, tenant needs and the cost of keeping the building useful.',
    risks: ['State and local tenant protections can change the timing and cost of an operating plan.', 'Insurance availability, deductibles, structural condition and hazard exposure require property-level evidence.', 'One building concentrates vacancy, repair and exit risk; a USD asset still creates FX risk for a non-USD investor.'],
    tax: 'Model assessed property tax, special assessments, acquisition and sale costs separately from income tax. A foreign seller may face FIRPTA withholding; withholding is not the final tax on gain.',
    financing: 'An illustrative DSCR or LTV does not establish loan eligibility. Obtain actual underwriting, rate, amortization, insurance and closing terms; projected rent is not automatically qualifying income.',
    operating: 'Check the applicable city, unit age, tenancy, exemptions, habitability and fair-housing obligations before assuming rent increases, turnover or renovation access.',
    sourceIds: ['global-ca-tenants', 'global-irs-rental', 'global-firpta', 'global-cfpb-closing', 'global-fannie-rental', 'global-fair-housing'],
  },
  {
    id: 'london', name: 'London', country: 'United Kingdom', region: 'Europe', currency: 'GBP',
    access: 'Distinguish freehold from leasehold and an individual buyer from an overseas entity. Overseas entities in relevant UK land transactions must address the beneficial-ownership register and ongoing updates.',
    thesis: 'A flat is also a contract with the building. Study lease duration, service charges, repair obligations and lawful long-term letting before using a headline rent-to-price ratio.',
    risks: ['Private-tenancy rules already in force and later reform phases affect possession, rent-setting and compliance.', 'Leasehold service charges and major works can overwhelm an apparently positive rent margin.', 'GBP conversion, interest-rate resets, tax changes and a slow sale can alter home-currency outcomes.'],
    tax: 'England and Northern Ireland apply a 2-percentage-point SDLT surcharge to relevant nonresident residential purchases, alongside other applicable charges. Residence tests, additional-property rules and relief require buyer-specific checking; Scotland and Wales use different transaction taxes.',
    financing: 'Verify nonresident lending, lease acceptability, rental underwriting, fixed-rate duration and refinance terms. This atlas has no live UK mortgage quote.',
    operating: 'For covered private tenancies in England, Phase 1 took effect on 1 May 2026: section 21 was abolished, most assured tenancies became periodic, and rent increases use the revised annual statutory process. Check tenancy coverage, transition rules, licensing and safety; later phases are separate.',
    sourceIds: ['global-uk-sdlt', 'global-uk-overseas-entity', 'global-uk-renters', 'global-uk-landlord-guide', 'global-uk-renters-roadmap', 'global-international-risk'],
  },
  {
    id: 'tokyo', name: 'Tokyo', country: 'Japan', region: 'Asia Pacific', currency: 'JPY',
    access: 'Japan’s Ministry of Finance describes post-acquisition reporting for nonresident real-property acquisitions through the Bank of Japan, generally within 20 days, in Japanese. Reporting guidance does not establish that every buyer or parcel is eligible.',
    thesis: 'Read the building as carefully as the district. Compare durable rental operations with the age, engineering, condominium reserves, management quality and long-term usefulness of the asset.',
    risks: ['Seismic engineering, maintenance records and future replacement work need a qualified building review.', 'A remote owner depends on local management, language support and collection/reporting arrangements.', 'JPY rent, debt and an investor’s home currency can move differently; national tax and reporting policy can change.'],
    tax: 'Japanese rents and certain disposal proceeds are domestic-source income for nonresidents. Check withholding, filing, treaty treatment and any tax-agent requirement; acquisition, registration, stamp, fixed-asset and city-planning taxes have their own bases and relief.',
    financing: 'Confirm whether a lender accepts the buyer’s residency, income documentation and property type. Do not substitute a national policy rate for an available property loan.',
    operating: 'Identify title and land rights, condominium bylaws, reserve adequacy, lease obligations and local permissions. The study makes no blanket claim of unrestricted foreign ownership.',
    sourceIds: ['global-jp-reporting', 'global-jp-nonresident-tax', 'global-jetro-tax-agent', 'global-jetro-property-taxes', 'global-international-risk'],
  },
  {
    id: 'singapore', name: 'Singapore', country: 'Singapore', region: 'Asia Pacific', currency: 'SGD',
    access: 'Under the Residential Property Act, foreign persons generally need approval for landed residential property; condominium and flat units are among categories that can be purchased without that approval. Separate HDB eligibility and other rules still matter.',
    thesis: 'Start with the buyer profile, then the building. The same residential unit can produce very different acquisition economics after citizenship, residency, existing-property count and applicable remission are considered.',
    risks: ['Ownership approval, stamp duty, cooling measures and use rules can change the feasible strategy.', 'Condominium charges, repairs and rental restrictions belong in the operating model.', 'SGD conversion and debt-service capacity can dominate a modest rental surplus.'],
    tax: 'IRAS lists a 60% residential ABSD rate for foreign individuals for acquisitions from 27 April 2023, subject to applicable remissions and profile rules. Eligible treaty treatment can change the result, including treatment described for US citizens; add ordinary buyer’s stamp duty and check disposal taxes separately.',
    financing: 'MAS describes a 55% total-debt-servicing threshold for applicable property loans, with specified exceptions. It is a borrower-level test, not property DSCR and not a promise of financing.',
    operating: 'Confirm property category, tenure, leasing permissions, management obligations and the exact buyer profile. Do not apply the foreign-individual headline duty to every overseas buyer.',
    sourceIds: ['global-sg-ownership', 'global-sg-absd', 'global-sg-tdsr', 'global-international-risk'],
  },
  {
    id: 'dubai', name: 'Dubai', country: 'United Arab Emirates', region: 'Middle East', currency: 'AED',
    access: 'Dubai Land Department identifies foreign ownership in designated freehold areas and provides sale-registration procedures. Verify the project, title and permitted ownership form; a nonresident passport being accepted is not approval of every property.',
    thesis: 'Separate a completed rental asset from a promise to deliver one. Study service charges, completion and registration records, recurring rent and a credible exit rather than treating off-plan marketing as cash flow.',
    risks: ['Off-plan delivery, developer performance and recovery procedures differ from owning a completed asset.', 'Annual service charges, reserve funding, leasing costs and vacancy can reduce a gross yield.', 'Registration, rental rules, fee allocation and wider political or economic events require review; home-currency outcomes remain exposed to conversion costs and currency changes.'],
    tax: 'DLD’s sale service lists 2% of sale value for the seller and 2% for the buyer, plus other applicable registration/partner fees. Check the contract’s allocation and the owner’s actual federal and home-country tax treatment; do not assume every structure is tax free.',
    financing: 'Verify nonresident loan eligibility, valuation, advance limits, rate reset, completion conditions and all fees directly with a lender. No current offer is supplied.',
    operating: 'Check RERA-approved service charges, lease registration and rent rules. DLD’s public data catalog is useful research infrastructure; its availability does not grant unrestricted reuse or establish a tested real-time feed.',
    sourceIds: ['global-dld-sale', 'global-dld-faq', 'global-dld-data', 'global-international-risk'],
  },
  {
    id: 'berlin', name: 'Berlin', country: 'Germany', region: 'Europe', currency: 'EUR',
    access: 'Establish registered title, tenancy, condominium obligations and property-specific buyer requirements through local conveyancing. This research does not determine an individual foreign buyer’s eligibility.',
    thesis: 'The existing lease is part of the asset. Compare lawful rent, repair obligations and energy work with the acquisition basis; an advertised vacant-market rent is not necessarily the rent an occupied unit can earn.',
    risks: ['Tenant law, rent regulation and designated-market rules can constrain a rent-growth assumption.', 'Building maintenance and condominium decisions may require cash before an owner expects it.', 'EUR conversion, tax changes, energy-policy requirements and refinance conditions affect cash flow and exit.'],
    tax: 'Obtain the applicable transfer-tax, annual property-tax, rental-income and sale-tax treatment for the buyer and property. No German tax percentage is inserted into the scenario as an observed fact.',
    financing: 'Confirm local income evidence, property valuation, amortization, fixed-interest period and nonresident eligibility. Compare remaining loan balance and reset risk, not just the first payment.',
    operating: 'Use Berlin’s 2026 Mietspiegel where applicable. Federal BGB §556d provides a general 10%-above-comparable-rent rule in designated stressed markets, with exceptions; verify the current Berlin designation, unit coverage and exemption before applying it.',
    sourceIds: ['global-de-rent-law', 'global-berlin-mietspiegel', 'global-international-risk'],
  },
  {
    id: 'mexico-city', name: 'Mexico City', country: 'Mexico', region: 'Latin America', currency: 'MXN',
    access: 'Mexico’s Foreign Investment Law distinguishes the zone within 100 km of borders or 50 km of beaches from land outside it. Mexico City is not a coastal-trust case by default; confirm the SRE procedure, nationality agreement and title for the actual acquisition.',
    thesis: 'Treat neighborhood demand as a question to measure, and title as a fact to prove. Compare lawful long-term rental operations, condominium expenses and usable building quality with the fully documented acquisition cost.',
    risks: ['Registered title, liens, condominium debts and permitted use require local legal checking.', 'Seismic condition, water arrangements and maintenance require a building-specific review.', 'MXN rent can diverge from home-currency debt and returns; tax, rental and remittance policy may change.'],
    tax: 'The Income Tax Law contains a nonresident Mexican-source rental framework, including gross-receipts withholding rules. Residency and treaty eligibility can change treatment. Check local acquisition tax, annual predial, rental filings and sale costs separately.',
    financing: 'Obtain actual resident/nonresident loan terms, currency, amortization and documentation requirements. Banxico FIX is a daily reference, not an executable conversion quote or property financing rate.',
    operating: 'Verify condominium rules, rental permissions, management, insurance and collection arrangements. Restricted-zone trusts are a different legal mechanism and are not asserted as a requirement for this city.',
    sourceIds: ['global-mx-investment-law', 'global-mx-income-tax', 'global-banxico-fx', 'global-international-risk'],
  },
  {
    id: 'sao-paulo', name: 'São Paulo', country: 'Brazil', region: 'Latin America', currency: 'BRL',
    access: 'Brazil’s Civil Code makes real-property title transfer dependent on registration at the Registro de Imóveis. Confirm urban/rural classification, foreign-buyer eligibility, registered liens and documentation; a CPF is an administrative identifier, not proof of ownership eligibility.',
    thesis: 'Compare the operating building and condominium accounts with the purchase contract. A useful study tests collected rent, repair responsibility and liquidity after taxes and conversion rather than translating an asking price alone.',
    risks: ['Unregistered title, condominium liabilities and property classification can disrupt an acquisition.', 'Repairs, building services, insurance and management create obligations beyond monthly rent.', 'BRL conversion, inflation, financing conditions and changes in tax or remittance policy can alter home-currency results.'],
    tax: 'The municipality’s 2026 guidance lists 3% ITBI on the applicable base for ordinary purchases without bank financing; qualifying financing, valuation and relief differ. Annual IPTU uses assessed valor venal, which can differ from the sale price. Check income and disposal taxes separately.',
    financing: 'Confirm actual lender eligibility, down payment, indexation, rate structure, amortization and remittance documentation. The study does not supply a BRL mortgage quote.',
    operating: 'Reconcile the registered title with the unit, condominium accounts and lease. Confirm rental-tax status, cash collection and management arrangements before assigning a net yield.',
    sourceIds: ['global-br-title', 'global-sp-itbi', 'global-sp-iptu', 'global-br-cpf', 'global-international-risk'],
  },
];

export const glossary = [
  { term: 'Gross rental yield', definition: 'Annual scheduled rent compared with a stated acquisition basis, before vacancy and expenses.', formula: 'Scheduled annual rent ÷ purchase price × 100', caution: 'Disclose the denominator. Using total acquisition cost gives a different number; gross yield is not spendable cash.', sourceIds: ['global-occ-cre'] },
  { term: 'Effective gross income', definition: 'Income expected to be collected after vacancy and credit loss, plus separately stated other income.', formula: 'Scheduled rent − vacancy/credit loss + other income', caution: 'An occupied unit can still have unpaid rent. Avoid counting a refundable security deposit as income.', sourceIds: ['global-occ-cre', 'global-irs-rental'] },
  { term: 'Operating NOI', definition: 'Property operating income after recurring operating expenses under the convention stated here.', formula: 'Effective gross income − operating expenses', caution: 'Here NOI precedes debt, income tax, depreciation, capex and replacement reserves. Lender underwriting may deduct reserves in NOI.', sourceIds: ['global-occ-cre'] },
  { term: 'Net rental yield', definition: 'An explicitly defined operating return on total acquisition cost.', formula: 'Operating NOI ÷ (price + acquisition costs + initial works) × 100', caution: '“Net yield” is not a universal standard. State whether reserves, financing and taxes are included; this definition excludes them.', sourceIds: ['global-occ-cre'] },
  { term: 'Capitalization rate', definition: 'A property’s stated annual NOI relative to its price or value.', formula: 'NOI ÷ price or value × 100; implied value = NOI ÷ cap rate', caution: 'Use a consistent stabilized NOI. A cap rate is not total return; a higher exit cap rate reduces value at unchanged NOI.', sourceIds: ['global-occ-cre'] },
  { term: 'Cash-on-cash return', definition: 'Annual cash available to equity compared with the cash initially committed.', formula: '(NOI − debt service − reserve funding − unfunded capex) ÷ initial equity cash × 100', caution: 'This study uses a pre-income-tax version and includes closing costs, initial works and opening reserves in committed equity. Appreciation and principal repayment are separate.', sourceIds: ['global-occ-cre', 'global-cfpb-closing'] },
  { term: 'Debt service', definition: 'Principal and interest payments due on the loan during the period.', formula: 'Annual debt service = sum of scheduled principal and interest payments', caution: 'Interest is a financing cost; principal reduces debt but still consumes cash. Escrow for taxes and insurance is a separate property cost.', sourceIds: ['global-cfpb-closing'] },
  { term: 'DSCR', definition: 'Debt-service coverage ratio measures the income buffer over required loan payments.', formula: 'Stated underwriting NOI ÷ annual debt service', caution: 'Label the numerator. If reserves are deducted, say so. A model threshold is an assumption, and a ratio above 1 does not guarantee approval or solvency.', sourceIds: ['global-occ-cre'] },
  { term: 'LTV', definition: 'Loan-to-value compares debt with the lender’s property valuation.', formula: 'Loan amount ÷ appraised value × 100', caution: 'Purchase price and appraisal can differ. A lower valuation may require more equity; eligibility also depends on borrower and property.', sourceIds: ['global-cfpb-ltv'] },
  { term: 'Leverage', definition: 'Debt lets equity control an asset larger than the equity contribution.', formula: 'Equity value = asset value − debt balance', caution: 'Debt payments survive weaker rent. Leverage magnifies losses as well as gains and can create refinance, covenant or forced-sale risk.', sourceIds: ['global-occ-cre'] },
  { term: 'Vacancy and credit loss', definition: 'The gap between scheduled rent and collectible rent caused by empty space or nonpayment.', formula: 'Loss allowance = scheduled rent × assumed loss rate', caution: 'A smooth annual percentage is a planning simplification. One vacant unit can cause a sharp cash shortfall.', sourceIds: ['global-occ-cre'] },
  { term: 'Repairs and maintenance', definition: 'Recurring work to keep a property safe and usable.', formula: 'Operating expenses include the stated recurring repair allowance', caution: 'Tax treatment of a repair can differ from an improvement. A percentage allowance cannot replace a condition survey or habitability duties.', sourceIds: ['global-irs-rental', 'global-ca-tenants'] },
  { term: 'Capital expenditure', definition: 'Long-lived replacement or improvement work, such as a roof or major system.', formula: 'Cash flow deducts actual capex or the chosen reserve funding convention', caution: 'Avoid deducting both a funded replacement reserve and the same expense without releasing reserve cash. Tax depreciation is a separate accounting treatment.', sourceIds: ['global-irs-rental'] },
  { term: 'Replacement reserve', definition: 'Cash set aside for future capital work.', formula: 'Closing reserve + new funding − capital spending = remaining reserve', caution: 'A reserve transfer reduces distributable cash, but retained reserve cash remains an asset until spent. Do not label it investor distributions.', sourceIds: ['global-occ-cre'] },
  { term: 'Insurance', definition: 'Coverage for specified losses under a policy with exclusions, limits and deductibles.', formula: 'Budget premium + retained deductible exposure; keep reserves separately', caution: 'Use a property-specific quote and coverage review. A modeled premium does not establish availability or full replacement coverage.', sourceIds: ['global-cfpb-closing'] },
  { term: 'Property tax', definition: 'A recurring levy under the property’s local assessment and tax rules.', formula: 'Applicable assessed base × rates + relevant assessments, where that system applies', caution: 'Current seller tax is not necessarily buyer tax. Confirm reassessment, exemptions, special charges and the relevant jurisdiction.', sourceIds: ['global-irs-rental', 'global-sp-iptu'] },
  { term: 'Closing cash', definition: 'Cash needed to acquire and fund the asset at completion.', formula: 'Down payment + acquisition costs + initial works + opening reserves', caution: 'Closing costs and down payment are different. Include loan fees, transfer/registration charges and any required working capital.', sourceIds: ['global-cfpb-closing'] },
  { term: 'Exit proceeds', definition: 'Cash equity remaining after a modeled sale.', formula: 'Sale price − sale costs − debt payoff − applicable tax/other settlement costs', caution: 'A terminal property value is not cash in hand. Time to sell, prepayment charges, tax withholding and conversion costs may matter.', sourceIds: ['global-cfpb-closing', 'global-firpta'] },
  { term: 'FX-adjusted return', definition: 'A foreign asset’s outcome expressed in the investor’s home currency after conversion.', formula: 'Home-currency proceeds = local-currency proceeds × home currency per local currency − conversion costs', caution: 'Keep currency units explicit. Currency moves can reverse a local-currency gain; a reference rate is not a trade quote.', sourceIds: ['global-international-risk', 'global-banxico-fx'] },
  { term: 'Liquidity', definition: 'The ability to turn an investment into cash within a desired time and at an acceptable price.', formula: 'No single formula; compare sale windows, spreads, restrictions and costs', caution: 'Listed shares generally trade on an exchange but prices can fall sharply. Buildings, private funds and non-traded REITs can have slow or restricted exits.', sourceIds: ['global-sec-reits', 'global-international-risk'] },
  { term: 'Equity REIT versus mortgage REIT', definition: 'An equity REIT primarily owns property interests; a mortgage REIT primarily holds real-estate debt or related claims.', formula: 'Property operations exposure ≠ loan/interest-spread exposure', caution: 'Owning a REIT share does not give direct title to a building. Inspect the actual portfolio, debt, management and filings rather than relying on the label.', sourceIds: ['global-sec-reits', 'global-irs-reit'] },
  { term: 'Dividend yield', definition: 'A stated annual share distribution relative to the share price.', formula: 'Annual dividend per share ÷ share price × 100', caution: 'A dividend is not property NOI or total return. It may change, and some non-traded REIT distributions may use borrowings or offering proceeds.', sourceIds: ['global-sec-reits'] },
  { term: 'REIT distribution rule', definition: 'US REIT qualification includes a distribution calculation tied to taxable income, with statutory adjustments.', formula: 'Generally at least 90% of the relevant taxable-income measure, subject to the detailed rule', caution: 'This is not a guaranteed shareholder yield, 90% of rent, or a promise to distribute accounting profit. Other countries use different regimes.', sourceIds: ['global-irs-reit'] },
  { term: 'Total return', definition: 'Income plus the change in equity value, after the costs included in the calculation.', formula: '(Distributions + ending equity − initial equity − later contributions) ÷ invested capital, for a stated simple-return convention', caution: 'Timing matters. An annualized IRR uses dated cash flows and differs from this simple expression; neither is a forecast.', sourceIds: ['global-sec-reits'] },
];

// These are educational workload/capital categories, not rankings of quality or return.
export const propertyTiers = [
  { name: 'Shared exposure', propertyTypes: 'Listed REITs or diversified real-estate securities funds', capital: 'Share-sized entry; no direct building control', operations: 'Read holdings, leverage, costs, governance and disclosures', risk: 'Equity prices, fees and portfolio financing; fund diversification varies', sourceIds: ['global-sec-reits'] },
  { name: 'Small direct ownership', propertyTypes: 'Single rental unit, small residential building or condominium', capital: 'Down payment, closing costs and usable reserve for one concentrated asset', operations: 'Leasing, collections, repairs, insurance, tenancy and condominium compliance', risk: 'A single vacancy or major repair can be large relative to cash flow', sourceIds: ['global-ca-tenants', 'global-irs-rental'] },
  { name: 'Multifamily operations', propertyTypes: 'Larger apartment or mixed residential portfolios', capital: 'More equity and a building/portfolio reserve plan', operations: 'Multiple leases, professional systems, maintenance and regulated tenant relationships', risk: 'Common-system capex, legal duties, operating execution and refinancing', sourceIds: ['global-occ-cre', 'global-fair-housing'] },
  { name: 'Commercial leases', propertyTypes: 'Office, retail and industrial space', capital: 'Purchase equity plus leasing, fit-out and downtime budget', operations: 'Tenant credit, lease expense allocation, renewals and building suitability', risk: 'One large lease expiry, re-leasing costs and changing space demand', sourceIds: ['global-occ-cre', 'global-realty-model'] },
  { name: 'Operating businesses', propertyTypes: 'Hotels, hospitality and other service-intensive assets', capital: 'Property funding plus business working capital', operations: 'Staffing, service, licensing and short booking cycles', risk: 'Income volatility and business execution; building ownership alone does not capture the whole model', sourceIds: ['global-occ-cre'] },
  { name: 'Transformation', propertyTypes: 'Development, conversion, major renovation or land assembly', capital: 'Acquisition, approvals, construction contingency and cash during delay', operations: 'Entitlements, design, contracts, safety, delivery and lease-up', risk: 'Cost overruns, delayed permits, contractor failure and an uncertain end market', sourceIds: ['global-occ-cre'] },
];

export const strategies = [
  { name: 'Income first', mechanism: 'Study an existing rent roll and the cost of keeping it collectible; test whether after-reserve cash survives a vacancy or insurance increase.', tradeoff: 'Existing income can be easier to observe, but leases, condition and acquisition price can limit flexibility.' },
  { name: 'Useful improvement', mechanism: 'Make permitted improvements that reduce operating problems or meet documented tenant needs; model the work, downtime and lawful rent separately.', tradeoff: 'Execution and capital costs arrive before any benefit. A renovation does not erase tenant rights or establish achievable rent.' },
  { name: 'Adaptive reuse', mechanism: 'Test whether a building can lawfully and physically serve a different use, with a full entitlement, engineering and cost study.', tradeoff: 'A compelling sketch can fail on circulation, structure, services, safety, approvals or economics.' },
  { name: 'Long commercial lease', mechanism: 'Study lease duration, tenant credit and which expenses the lease actually transfers; reserve for renewal and re-leasing.', tradeoff: 'Longer contracted rent can coexist with concentrated tenant failure, vacancy and residual building risk.' },
  { name: 'Public equity exposure', mechanism: 'Compare listed equity REIT portfolios, debt maturity, valuation, governance and distributions using filings.', tradeoff: 'Share-sized access and exchange trading come with share-price volatility and limited control over assets or leverage.' },
  { name: 'Credit exposure', mechanism: 'Study loans, security, borrower cash flow, seniority, maturity and how the provider funds its own balance sheet.', tradeoff: 'A lender’s claim differs from property equity; defaults, collateral recovery, spreads and funding risks replace some ownership risks.' },
  { name: 'Cross-border study', mechanism: 'Translate a complete local-currency operating and exit model into home currency, then verify ownership, taxes, reporting and management.', tradeoff: 'Geographic variety can add currency, legal, information, tax and remote-operation costs. Different cities are not automatically diversified cash flows.' },
];

export const ownershipComparison = [
  { name: 'Direct property', own: 'Registered property interest under local law', control: 'Operating and financing decisions, subject to leases, law and co-owner rules', liquidity: 'Negotiated sale; timing and costs vary', cashFlow: 'Collected rent less operating costs, reserves, debt and applicable taxes', diligence: 'Title, condition, legal use, tenants, insurance, taxes, financing and exit', sourceIds: ['global-occ-cre', 'global-ca-tenants'] },
  { name: 'Listed equity REIT', own: 'Shares in a company that owns property interests', control: 'Shareholder rights; management selects and operates assets', liquidity: 'Exchange trading at the available market price', cashFlow: 'Company distributions and changes in share value; not the same as property rent', diligence: 'Filings, holdings, concentration, debt, fees, governance and valuation', sourceIds: ['global-sec-reits', 'global-irs-reit'] },
  { name: 'Mortgage REIT', own: 'Shares in a company exposed principally to real-estate finance', control: 'Shareholder rights; management selects loans/securities and funding', liquidity: 'Depends on whether listed; the label alone does not settle liquidity', cashFlow: 'Financing income and expenses, defaults and changes in share value', diligence: 'Collateral, credit, duration, funding, leverage, hedging and disclosures', sourceIds: ['global-sec-reits', 'global-irs-reit'] },
  { name: 'Non-traded REIT or private vehicle', own: 'A security or fund interest under its documents', control: 'Usually delegated; actual rights depend on the documents', liquidity: 'May be restricted, capped or suspended', cashFlow: 'Distributions depend on terms, financing and operations', diligence: 'Offering documents, valuation, fees, conflicts, redemption terms and source of distributions', sourceIds: ['global-sec-reits'] },
];

export const history = [
  { year: '1960', title: 'The US REIT structure begins', detail: 'Congress creates the US REIT framework. Its importance to this study is the separation of share ownership from direct ownership of a building.', sourceIds: ['global-us-reit-act', 'global-sec-reits'] },
  { year: '1968', title: 'Fair housing becomes federal law', detail: 'The US Fair Housing Act prohibits discrimination in covered housing activity. Later amendments broaden protection; an operating plan must account for rights as well as rent.', sourceIds: ['global-fair-housing'] },
  { year: '1991', title: 'Nareit defines FFO', detail: 'Nareit adopts funds from operations as an industry reporting measure. The lesson is to read the metric definition: accounting income, FFO, distributions and owner cash flow answer different questions.', sourceIds: ['global-nareit-history'] },
  { year: '2001', title: 'Tokyo opens its J-REIT market', detail: 'Tokyo Stock Exchange records the J-REIT market launch on 10 September. Listed structures spread access while preserving exposure to property operations and the price of the security.', sourceIds: ['global-jpx-history', 'global-jpx-reits'] },
  { year: '2007–09', title: 'Housing losses become a financial crisis', detail: 'The Federal Reserve’s history describes housing and mortgage losses followed by global financial stress and recession. This study draws a practical question: can a portfolio survive weak income and unavailable refinancing?', sourceIds: ['global-fed-recession'] },
  { year: '2022', title: 'The Fed begins raising its target range', detail: 'The March FOMC statement raises the target range and anticipates further increases. A historical policy move illustrates why debt resets, refinancing and exit valuation belong in a property model; it is not a current rate quote.', sourceIds: ['global-fed-2022'] },
];

export const players = [
  { name: 'Property-owning companies', role: 'Own and operate portfolios; shareholders hold company equity rather than individual property titles.', examples: ['Realty Income: a documented long-term net-lease business model'], sourceIds: ['global-realty-model', 'global-sec-reits'] },
  { name: 'Private fund managers', role: 'Manage pooled capital across stated strategies and vehicles; mandates, fees and liquidity differ.', examples: ['Blackstone Real Estate: opportunistic, core-plus and real-estate debt businesses'], sourceIds: ['global-blackstone'] },
  { name: 'Real-estate service firms', role: 'Advise on leasing and capital markets or manage buildings and facilities; the service role is different from owning the asset.', examples: ['CBRE', 'JLL'], sourceIds: ['global-cbre', 'global-jll'] },
  { name: 'Lenders and mortgage-market institutions', role: 'Underwrite or finance property debt; loan eligibility, debt terms and investor exposure are separate questions.', examples: ['Fannie Mae: buys lender mortgages and supports mortgage securitization', 'Blackstone Mortgage Trust: identified by Blackstone as a real-estate finance platform'], sourceIds: ['global-fannie-about', 'global-blackstone', 'global-occ-cre'] },
  { name: 'Public authorities and registries', role: 'Set or administer rules, record rights, maintain tax systems and publish some public data; an official database is not a recommendation.', examples: ['Singapore Land Authority', 'Dubai Land Department', 'São Paulo municipal tax authority'], sourceIds: ['global-sg-ownership', 'global-dld-sale', 'global-sp-iptu'] },
  { name: 'Residents and operating teams', role: 'Tenants, managers and maintenance teams turn a legal asset into a functioning place. Their rights, contracts and service needs shape the cash flow.', examples: ['Residential tenants under applicable law', 'Property managers and building maintenance providers'], sourceIds: ['global-ca-tenants', 'global-fair-housing', 'global-occ-cre'] },
];

/** Fixed arithmetic illustration, deliberately unrelated to any observed market or reader budget. */
export const yieldIllustration = {
  label: 'Hypothetical rental arithmetic — no actual property, market quote or investor budget',
  currency: 'USD',
  assumptions: {
    purchasePrice: 500000, acquisitionCosts: 25000, initialWorks: 10000,
    scheduledAnnualRent: 36000, vacancyAndCreditLossPct: 5, operatingExpenses: 12500,
    annualReplacementReserve: 3000, annualDebtService: 18000, loanAmount: 300000,
    openingCashReserve: 12000,
  },
  results: {
    vacancyAndCreditLoss: 1800, effectiveGrossIncome: 34200, operatingNOI: 21700,
    afterReserveIncome: 18700, cashFlowBeforeIncomeTax: 700,
    totalAcquisitionCost: 535000, initialEquityCash: 247000,
    grossYieldOnPricePct: 7.2, netYieldOnTotalCostPct: 4.05607476635514,
    capRateOnPricePct: 4.34, operatingDSCR: 1.2055555555555555,
    afterReserveDSCR: 1.038888888888889, loanToPricePct: 60,
    cashOnCashBeforeIncomeTaxPct: 0.2834008097165992,
  },
  interpretation: 'The same hypothetical asset shows a 7.2% gross yield and only $700 annual cash after reserve funding and debt service. Denominators and the cash-flow waterfall explain the difference; none of these numbers describe a city or listing.',
  exclusions: 'No income tax, tax benefit, appreciation, extraordinary repair, currency conversion, refinancing, sale or loan qualification is assumed. Loan-to-price is shown because no appraisal is supplied.',
};

const checkedAt = '2026-10-03';
const source = (id, title, url, publisher, cadence) => ({ id, title, url, publisher, checkedAt, cadence });
export const sources = [
  source('global-sec-reits', 'Real Estate Investment Trusts (REITs)', 'https://www.investor.gov/introduction-investing/investing-basics/investment-products/real-estate-investment-trusts-reits', 'US Securities and Exchange Commission / Investor.gov', 'Educational guidance; update cadence not promised'),
  source('global-irs-reit', 'Instructions for Form 1120-REIT (2025)', 'https://www.irs.gov/instructions/i1120rei', 'US Internal Revenue Service', 'Tax-year instructions; check later changes'),
  source('global-international-risk', 'International Investing', 'https://www.investor.gov/introduction-investing/investing-basics/investment-products/international-investing', 'US Securities and Exchange Commission / Investor.gov', 'Educational guidance; securities risk framework'),
  source('global-occ-cre', 'Commercial Real Estate Lending, version 2.0 (March 2022)', 'https://www.occ.treas.gov/publications-and-resources/publications/comptrollers-handbook/files/commercial-real-estate-lending/pub-ch-commercial-real-estate.pdf', 'US Office of the Comptroller of the Currency', 'Supervisory handbook; March 2022 edition, not a live credit policy'),
  source('global-irs-rental', 'Publication 527 (2025), Residential Rental Property', 'https://www.irs.gov/publications/p527', 'US Internal Revenue Service', 'Tax-year publication; US federal treatment only'),
  source('global-cfpb-closing', 'Closing Disclosure explainer', 'https://www.consumerfinance.gov/owning-a-home/closing-disclosure/', 'US Consumer Financial Protection Bureau', 'Consumer guidance; not a loan offer'),
  source('global-cfpb-ltv', 'What is a loan-to-value ratio?', 'https://www.consumerfinance.gov/ask-cfpb/what-is-a-loan-to-value-ratio-and-how-does-it-relate-to-my-costs-en-121/', 'US Consumer Financial Protection Bureau', 'Guidance; page last reviewed January 2025'),
  source('global-fannie-rental', 'General Rental Income Information', 'https://selling-guide.fanniemae.com/sel/b3-3.1-08/rental-income', 'Fannie Mae Selling Guide', 'Guide entry dated September 2, 2026; lender program rules can change'),
  source('global-firpta', 'FIRPTA withholding', 'https://www.irs.gov/individuals/international-taxpayers/firpta-withholding', 'US Internal Revenue Service', 'Tax guidance; transaction-specific exceptions apply'),
  source('global-ca-tenants', 'Landlord-Tenant Issues', 'https://oag.ca.gov/tenants', 'California Department of Justice', 'Current guidance; check local rules and later law changes'),
  source('global-uk-sdlt', 'Rates of Stamp Duty Land Tax for non-UK residents', 'https://www.gov.uk/guidance/rates-of-stamp-duty-land-tax-for-non-uk-residents', 'HM Revenue & Customs', 'Guidance last updated April 2025; England and Northern Ireland'),
  source('global-uk-overseas-entity', 'Register an overseas entity', 'https://www.gov.uk/guidance/register-an-overseas-entity', 'Companies House', 'Guidance last updated February 2026; annual entity updates'),
  source('global-uk-renters', 'Private landlords: private renting has changed', 'https://housinghub.campaign.gov.uk/renting-is-changing/', 'UK Ministry of Housing, Communities and Local Government', 'Current landlord guidance checked October 2026; Phase 1 effective May 1, 2026; later phases separate'),
  source('global-uk-landlord-guide', 'Assured periodic tenancies: a guide for landlords', 'https://www.gov.uk/assured-tenancy-agreements-a-guide-for-landlords', 'UK Government', 'Current full landlord guidance; scope, exceptions and transition rules matter'),
  source('global-uk-renters-roadmap', 'Implementing the Renters’ Rights Act 2025: roadmap', 'https://www.gov.uk/government/publications/renters-rights-act-2025-implementation-roadmap/implementing-the-renters-rights-act-2025-our-roadmap-for-reforming-the-private-rented-sector', 'UK Ministry of Housing, Communities and Local Government', 'Dated November 2025 phase plan; cross-check later phases with current landlord guidance'),
  source('global-jp-reporting', 'Acquisition of real property in Japan by a non-resident', 'https://www.mof.go.jp/english/policy/international_policy/real_property/index.html', 'Japan Ministry of Finance', 'Administrative guidance; transaction deadlines are separate from source refresh'),
  source('global-jp-nonresident-tax', 'Taxation on a nonresident', 'https://www.nta.go.jp/english/taxes/individual/12006.htm', 'Japan National Tax Agency', 'Tax guidance; residency, filing and treaty circumstances matter'),
  source('global-jetro-tax-agent', 'Taxes in Japan: overview of the tax system', 'https://www.jetro.go.jp/en/invest/setting_up/section3/page1.html', 'Japan External Trade Organization', 'Official investment guidance; check current law and taxpayer circumstances'),
  source('global-jetro-property-taxes', 'Other principal taxes', 'https://www.jetro.go.jp/en/invest/setting_up/section3/page8.html', 'Japan External Trade Organization', 'Official investment guidance; bases and relief differ by tax'),
  source('global-sg-ownership', 'Foreign ownership of property', 'https://www.sla.gov.sg/regulatory/foreign-ownership-of-property/', 'Singapore Land Authority', 'Page content dated August 20, 2025; site footer updated October 2, 2026; check property category'),
  source('global-sg-absd', 'Additional Buyer’s Stamp Duty (ABSD)', 'https://www.iras.gov.sg/taxes/stamp-duty/for-property/buying-or-acquiring-property/additional-buyer%27s-stamp-duty-%28absd%29', 'Inland Revenue Authority of Singapore', 'Published residential rate table and guidance; buyer profile and applicable remission matter'),
  source('global-sg-tdsr', 'Calculating Total Debt Servicing Ratio thresholds', 'https://www.mas.gov.sg/regulation/explainers/tdsr-for-property-loans/calculating-tdsr-thresholds', 'Monetary Authority of Singapore', 'Regulatory explainer; revised December 2021, checked October 2026'),
  source('global-dld-sale', 'Property sale registration', 'https://dubailand.gov.ae/en/eservices/property-sale-registration/', 'Dubai Land Department', 'Service/fee guidance; verify transaction terms'),
  source('global-dld-faq', 'Frequently Asked Questions', 'https://dubailand.gov.ae/en/frequently-asked-questions/', 'Dubai Land Department', 'Administrative/rental guidance; check project and tenancy details'),
  source('global-dld-data', 'Real Estate Data', 'https://dubailand.gov.ae/en/open-data/real-estate-data/', 'Dubai Land Department', 'Public catalog; dataset periods and reuse terms vary; no automated feed verified here'),
  source('global-de-rent-law', 'Civil Code §556d: permissible rent at commencement', 'https://www.gesetze-im-internet.de/bgb/__556d.html', 'German Federal Ministry of Justice / Federal Office of Justice', 'Consolidated statute; local designation and exceptions require separate checking'),
  source('global-berlin-mietspiegel', 'Berliner Mietspiegel 2026', 'https://mietspiegel.berlin.de/', 'Berlin Senate', '2026 rent reference; applicability and property features matter'),
  source('global-mx-investment-law', 'Ley de Inversión Extranjera', 'https://www.diputados.gob.mx/LeyesBiblio/pdf/LIE.pdf', 'Mexico Chamber of Deputies', 'Consolidated law; last reform May 27, 2024 in checked text'),
  source('global-mx-income-tax', 'Ley del Impuesto sobre la Renta', 'https://www.diputados.gob.mx/LeyesBiblio/pdf/LISR.pdf', 'Mexico Chamber of Deputies', 'Consolidated law; last reform April 1, 2024 in checked text'),
  source('global-banxico-fx', 'Exchange rates: daily table CF102', 'https://www.banxico.org.mx/SieInternet/consultarDirectorioInternetAction.do?sector=6&accion=consultarCuadro&idCuadro=CF102&locale=en', 'Banco de México', 'Banking-day reference series; FIX publication timing differs; not real time'),
  source('global-br-title', 'Código Civil, Article 1,245', 'https://www.planalto.gov.br/ccivil_03/leis/2002/l10406compilada.htm', 'Presidency of Brazil', 'Consolidated law; registration requirement'),
  source('global-sp-itbi', 'Como calcular o ITBI', 'https://prefeitura.sp.gov.br/web/fazenda/w/servicos/itbi/2513', 'Municipality of São Paulo', 'Municipal guidance updated January 13, 2026'),
  source('global-sp-iptu', 'IPTU rules from 2026', 'https://prefeitura.sp.gov.br/web/fazenda/w/servicos/iptu/2456', 'Municipality of São Paulo', 'Municipal guidance updated February 10, 2026; annual assessment'),
  source('global-br-cpf', 'Register for a CPF from abroad', 'https://www.gov.br/pt-br/servicos/inscrever-no-cpf-no-exterior', 'Government of Brazil', 'Service guidance modified December 15, 2025; does not determine property eligibility'),
  source('global-us-reit-act', 'Public Law 86-779, September 14, 1960, Section 10', 'https://www.govinfo.gov/content/pkg/STATUTE-74/pdf/STATUTE-74-Pg998.pdf', 'US Congress / Government Publishing Office', 'Original historical statute; not current tax law'),
  source('global-nareit-history', 'The History of REITs', 'https://www.reit.com/what-reit/history-reits', 'Nareit, REIT industry association', 'Industry institutional history; historical milestones, not return evidence'),
  source('global-fair-housing', 'The Fair Housing Act', 'https://www.justice.gov/crt/fair-housing-act-1', 'US Department of Justice', 'Enforcement/history guidance; updated June 2023'),
  source('global-jpx-history', 'Tokyo Stock Exchange history before JPX launched', 'https://www.jpx.co.jp/english/corporate/about-jpx/history/01-01.html', 'Japan Exchange Group', 'Exchange’s historical record'),
  source('global-jpx-reits', 'REIT overview', 'https://www.jpx.co.jp/english/equities/products/reits/outline/index.html', 'Japan Exchange Group', 'Exchange product guidance; no price or expected yield used'),
  source('global-fed-recession', 'The Great Recession and its aftermath', 'https://www.federalreservehistory.org/essays/great-recession-and-its-aftermath', 'Federal Reserve History', 'Historical essay published November 2013'),
  source('global-fed-2022', 'FOMC statement, March 16, 2022', 'https://www.federalreserve.gov/newsevents/pressreleases/monetary20220316a.htm', 'US Federal Reserve Board', 'Dated historical policy release; not the current rate'),
  source('global-realty-model', 'The Realty Income Business Model', 'https://www.realtyincome.com/who-we-are/business-model', 'Realty Income', 'Company description; self-reported role, not endorsement or performance evidence'),
  source('global-blackstone', 'Real Estate', 'https://www.blackstone.com/our-businesses/real-estate/', 'Blackstone', 'Company description; self-reported businesses, no valuation or return claim used'),
  source('global-cbre', 'About CBRE', 'https://www.cbre.com/about', 'CBRE', 'Company description; self-reported role'),
  source('global-jll', 'About JLL', 'https://www.jll.com/en-us/about-jll', 'JLL', 'Company description; self-reported role'),
  source('global-fannie-about', 'About Fannie Mae', 'https://www.fanniemae.com/about-us', 'Fannie Mae', 'Institution description; secondary mortgage-market role'),
];
