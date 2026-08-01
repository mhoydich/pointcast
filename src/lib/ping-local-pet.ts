export const PING_LOCAL_PET = {
  schema: 'pointcast.ping-local-pet/v3',
  id: 'ping-local-pet-01',
  name: 'PING / Local Pet 01',
  family: 'LOCAL STAR',
  title: 'One little signal is enough.',
  description:
    'The open production room for a palm-sized, local-first physical companion that lets trusted people exchange five small presence signals.',
  route: '/digital-pets/ping',
  jsonRoute: '/digital-pets/ping.json',
  blockId: '0547',
  publishedAt: '2026-07-30T12:00:00-07:00',
  updatedAt: '2026-08-01T16:38:54-07:00',
  status: 'alpha-0-planning',
  gate: 'G0',
  center: 'El Segundo, California',
  fieldRadiusMiles: 25,
  positioning:
    'A local pet for people who want to feel present without starting another conversation.',
  productBoundary:
    'Five finite signals, visible delivery truth, no microphone, camera, GPS, mandatory cloud account, or open-ended chat.',
  conceptImage: '/images/digital-pets/ping/local-star-family-concept.png',
  conceptImageAlt:
    'Concept rendering of a sculptural cream signal dish on a dark desktop overlooking the coast at blue hour.',
  conceptImageDisclosure:
    'Industrial-design direction only. This image is not a photograph of manufactured hardware.',
  truth: {
    physicalUnitsBuilt: 0,
    physicalUnitsVerified: 0,
    componentsOrdered: false,
    vendorQuotesReceived: 0,
    capitalCommittedUsd: 0,
    applicationsPrepared: 1,
    applicationsSubmitted: 0,
    capitalReleaseQueueComplete: true,
    investorDeckSourceComplete: true,
    ycLateApplicationVerifiedOpen: true,
    ycApplicationPrepared: false,
    ycSubmissionApproved: false,
    exactComputeReferencePublicStockVisible: true,
    publicDisplayUnitsVisible: 7,
    proofPairProcurementPlanComplete: true,
    proofPairPartsCeilingUsd: 1250,
    hostTestsPassed: 47,
    hostTestsTotal: 47,
    sanitizerPass: true,
    hostSimulationPass: true,
    protocolVersion: 3,
    wireEnvelopeBytes: 168,
    wireAcknowledgementBytes: 135,
    hostSecurityTestDouble: true,
    esp32CompileTargetPassed: true,
    esp32SourceCommit: '0208b9bc4ba7d846917ed3b83bee513b792bbc14',
    espIdfVersion: '6.0.1',
    esp32ReportedFlashBytes: 370585,
    esp32ReportedRamBytes: 17584,
    esp32FirmwareBytes: 371008,
    esp32FirmwareSha256:
      '57de6283d2f79ee2c835d82952d53951d11102d3606316105c06d4d3c8b1f018',
    localSetupFirmwareBytes: 951904,
    localSetupFirmwareSha256:
      '4d5b7dab77167c9ce583a85fac4787e3ad0e7c3f9d000f68ac09a6bb8ba65bb1',
    reproducibleBinaryHashesPassed: true,
    psaCryptoAdapterCompiles: true,
    nvsCheckpointAdapterCompiles: true,
    pairingStatus: 'host_and_compile_partial',
    pairingContractAttemptsPassed: 100,
    pairingHelloBytes: 153,
    pairingConfirmationBytes: 117,
    pairingRecordBytes: 309,
    pairingCoreHostPassed: true,
    pairingPsaAdapterCompiles: true,
    pairingNvsStoreCompiles: true,
    pairingBleTransportImplemented: false,
    pairingPhysicalRuntimeVerified: false,
    pairingRateLimitPersistent: false,
    pairingIndependentlyReviewed: false,
    rak3172UartAdapterCompiles: true,
    gpioModeSwitchAdapterCompiles: true,
    productionCryptoComplete: false,
    boardRuntimeVerified: false,
    secureBootProvisioned: false,
    flashEncryptionProvisioned: false,
    encryptedNvsRuntimeVerified: false,
    hardwarePortComplete: false,
    flashPersistenceComplete: false,
    publicPreordersOpen: false,
    productionReady: false,
  },
  signals: [
    {
      code: 'HOME',
      meaning: 'I am here / home',
      expression: 'steady warm eyes',
      color: '#ffc864',
      glyph: '⌂',
    },
    {
      code: 'HELLO',
      meaning: 'Thinking of you',
      expression: 'two soft pulses',
      color: '#ff8a66',
      glyph: '✦',
    },
    {
      code: 'OPEN',
      meaning: 'Want company?',
      expression: 'rising blue-white glow',
      color: '#8fc8ff',
      glyph: '◌',
    },
    {
      code: 'OKAY',
      meaning: 'Everything is okay',
      expression: 'slow green-white breath',
      color: '#b9ff90',
      glyph: '✓',
    },
    {
      code: 'KNOCK',
      meaning: 'Please respond when you can',
      expression: 'one haptic tap and chest mark',
      color: '#f7eddf',
      glyph: '·',
    },
  ],
  modes: [
    {
      code: 'HOME',
      meaning: 'Normal desk use over configured local paths.',
    },
    {
      code: 'MESH',
      meaning: 'Permit authorized local relay paths, up to three planned hops.',
    },
    {
      code: 'QUIET',
      meaning: 'Suppress speaker and haptic expression without hiding state.',
    },
  ],
  currentProof: [
    {
      label: 'Message core',
      value: '47 / 47',
      detail:
        'Normal and sanitizer host tests pass across compose, route, retry, expiry, acknowledgement, replay, relay, recovery, and mutual pairing behavior.',
    },
    {
      label: 'Pairing contract',
      value: '100 / 100 host',
      detail:
        'Fresh ceremonies agree on separate content and relay roots, reject MITM, tamper, replay, expiry, self-pair, and rate-limit abuse. BLE and physical confirmation are not implemented.',
    },
    {
      label: 'ESP32-S3 target',
      value: 'LINKED',
      detail:
        'Two clean ESP-IDF 6.0.1 field builds produced the same 371,008-byte app hash. The PSA pairing adapter and atomic NVS pairing store compile. No board was flashed.',
    },
    {
      label: 'Relay boundary',
      value: '168 bytes',
      detail:
        'Protocol V3 carries opaque ciphertext, a P-256 origin signature, and a relay-integrity tag derived from a separate key root.',
    },
    {
      label: 'Restart recovery',
      value: '2 slots',
      detail:
        'A versioned checkpoint journal falls back when the newest simulated write is truncated or corrupt.',
    },
    {
      label: 'Public source check',
      value: '12 items',
      detail:
        'Catalog evidence covers eleven Alpha BOM lines. It is research, not a delivered quote or purchase.',
    },
  ],
  notYetProof: [
    'The transport-neutral pairing ceremony, PSA ECDH adapter, and atomic NVS record compile, but BLE discovery, fragmentation, code display, buttons, and physical two-person confirmation are not implemented.',
    'Pair identity is trust-on-first-use, the attempt limiter is volatile across reboot, and manufacturer certificates, revocation, recovery, and independent security review remain open.',
    'The Alpha private identity scalar is software-readable in NVS; secure-element storage remains open.',
    'No ESP32-S3 has been flashed; no RAK3172 command response, packet exchange, pin map, or switch state has been verified on hardware.',
    'Secure Boot, flash encryption, encrypted NVS, and group keys have not been provisioned on a device.',
    'No real radio range, battery, drop, power-cut, thermal, ESD, or compliance evidence.',
    'No working physical unit, supplier commitment, signed partner, customer order, or preorder.',
  ],
  alpha: {
    targetWorkingUnits: 10,
    engineeringSpares: 2,
    partsCeilingUsd: 4500,
    proofPairPartsCeilingUsd: 1250,
    remainingAlphaPartsCeilingUsd: 3250,
    totalCeilingUsd: 40000,
    revisedPlanningBomUsd: 3855,
    publicCatalogPartialBasketUsd: 1462.32,
    orderableAsWritten: false,
    blockers: [
      'The exact ESP32-S3-DevKitC-1-N8R8 later showed 600 public DigiKey units, but no stock is reserved and no delivered quote exists.',
      'The selected 2.13-inch e-paper display fell to seven visible units—five short of the twelve-unit Alpha requirement.',
      'The RAK3172 US915 page exposes a purchase path but no public stock count or delivered-date commitment.',
      'Five BOM groups still need current written delivered quotes and substitution review.',
    ],
  },
  capital: {
    alphaBridgeTargetUsd: 125000,
    preSeedTargetUsd: 750000,
    inventoryLaunchTargetUsd: 500000,
    estimatedProgramToFirstRunUsd: {
      low: 1130000,
      high: 1350000,
    },
    immediateRoute: {
      name: 'Boost VC Fellowship',
      amountUsd: 50000,
      publishedCapUsd: 1500000,
      formStatus:
        'Live fields mapped and application release packet prepared; not submitted.',
      missing:
        'Founder email, actual location, LinkedIn URL, confirmed first-person history, required two-minute-or-less video, and explicit submission approval.',
      termsBoundary:
        'The live form calls this an equity investment. SAFE mechanics, discount, MFN, pro rata, information rights, fees, and other complete terms remain unknown until documents are supplied.',
      faqUrl: 'https://www.boost.vc/faq',
      formUrl: 'https://boostvc.fillout.com/founder_start_50k',
    },
    secondaryRoute: {
      name: 'Y Combinator Fall 2026',
      amountUsd: 500000,
      applicationStatus:
        'Late applications are publicly accepted; PING application is not prepared or submitted.',
      publishedDeal:
        '$125,000 for 7% plus $375,000 on an uncapped MFN SAFE, with pro rata rights.',
      founderDecision:
        'Interview path, in-person San Francisco batch, published economics, founder facts, and explicit submission approval remain open.',
      applyUrl: 'https://www.ycombinator.com/apply',
      dealUrl: 'https://www.ycombinator.com/deal',
    },
    rule:
      'No investment application, security, bank action, purchase, or vendor commitment is made from this page.',
  },
  productionRing: [
    {
      need: 'Bench integration',
      candidate: 'South Bay Electronics',
      place: 'El Segundo',
      fit: 'Same-city wiring, rework, fixtures, and rapid enclosure experiments.',
      status: 'Research only',
      url: 'https://southbayelectronics.com/',
    },
    {
      need: 'Prototype PCBA',
      candidate: 'Calpak USA',
      place: 'Hawthorne',
      fit: 'Publicly describes 1–100 assemblies, AOI, X-ray, and functional test.',
      status: 'Primary capability RFQ',
      url: 'https://www.calpak-usa.com/Build/Electronic-Assemblies/Prototype-Assembly',
    },
    {
      need: 'PCBA alternate',
      candidate: 'ACME PCB Assembly',
      place: 'Carson',
      fit: 'Prototype through 20,000-unit assembly, harness, inspection, and box build.',
      status: 'Comparable RFQ',
      url: 'https://acme-pcbassembly.com/about/',
    },
    {
      need: 'Enclosure',
      candidate: 'West LA 3D Printing',
      place: 'Westchester',
      fit: 'CAD, industrial design, FDM, SLA, PolyJet, CNC, and molding support.',
      status: 'Capability RFQ',
      url: 'https://westla3dprinting.com/',
    },
    {
      need: 'Antenna',
      candidate: 'Matterwaves',
      place: 'Torrance',
      fit: 'Published 250 MHz–60 GHz antenna measurement and chamber capability.',
      status: 'Characterization RFQ',
      url: 'https://matterwaves.com/test-capability',
    },
    {
      need: 'Fixtures',
      candidate: 'FPC / funTest',
      place: 'Torrance',
      fit: 'Functional, HIL, environmental, RF/EMC, and end-of-line test systems.',
      status: 'Test engineering RFQ',
      url: 'https://www.funtestfpc.com/',
    },
  ],
  complianceGap:
    'The reviewed public pages did not establish a complete accredited consumer Wi-Fi/BLE plus US915 certification path inside the 25-mile ring. Local pre-compliance can stay close; final certification may require a lab outside it.',
  buildSequence: [
    {
      gate: 'G0',
      title: 'Freeze + fund',
      proof: 'Approve the $4,500 parts ceiling, name the purchasing/fundraising entity, close founder facts, and release RFQs.',
      status: 'now',
    },
    {
      gate: 'G1',
      title: 'Make 10 + 2',
      proof: 'Run the compiled port on two radios, assemble Alpha pets, and publish defects as well as demos.',
      status: 'blocked',
    },
    {
      gate: 'G2',
      title: 'Break the path',
      proof: 'Measure radio, battery, recovery, privacy, thermal, ESD, update, and teardown behavior.',
      status: 'blocked',
    },
    {
      gate: 'G3',
      title: 'Loan 100 locally',
      proof: 'Run an adult, no-payment El Segundo evaluation and publish aggregate evidence.',
      status: 'blocked',
    },
    {
      gate: 'G4',
      title: 'Certify + tool',
      proof: 'Close production crypto, security review, compliance, DFM, quotes, and factory gates.',
      status: 'blocked',
    },
    {
      gate: 'G5',
      title: 'Sell V1',
      proof: 'Release 1,500 units at a $349 target only with funded fulfillment and support.',
      status: 'blocked',
    },
  ],
  goToMarket: {
    category:
      'A designed communication object—not a toy robot, smart speaker, security device, or generic AI companion.',
    firstCustomers: [
      'Adult design and technology households',
      'Two people living apart who want a low-pressure ritual',
      'Creative studios and small teams',
      'Nearby friends and neighbors',
      'Adult non-medical care pairs',
    ],
    launchRule:
      'No interviews are required before Alpha. Build and bench evidence lead. The later loaned field evaluation measures actual setup, weekly use, delivery, support, privacy, and repair behavior.',
    offer: [
      'Alpha 0: 10 working + 2 engineering spares; not sold.',
      'El Segundo evaluation: 100 loaned units; no payment.',
      'Founding release: up to 300 compliant units at a $299 target.',
      'V1: 1,500 units at a $349 target; pair pack only after support is stable.',
    ],
    firstEpisodes: [
      'Why five signals are enough.',
      'The first two pets say hello.',
      'We unplugged the internet.',
      'What LoRa can and cannot do.',
      'The battery did not last—what changed.',
      'Opening the pet without breaking it.',
      'One hundred PINGs around El Segundo.',
      'The factory ledger: what every unit costs.',
    ],
  },
  decisionRights: {
    codex:
      'Maintains requirements, schedule, sourcing research, firmware evidence, risks, capital and GTM drafts, and public truth.',
    michael:
      'Approves spending, company and securities actions, application submission, external first-person claims, contracts, industrial design, and public sale.',
  },
  boundaries: [
    'PING is not a satellite terminal. Any future satellite path belongs to a separately certified gateway with provider, price, and session state exposed.',
    'PING V1 is adult-first and makes no emergency, medical, caregiving, security-alarm, or guaranteed-delivery claim.',
    'The page instrument is a browser-only rehearsal. It does not transmit a message, contact a device, collect a lead, take payment, or open a preorder.',
    'All prices, schedules, range, battery, margin, and release quantities remain targets until measured or supported by written commitments.',
  ],
} as const;

export type PingSignal = (typeof PING_LOCAL_PET.signals)[number];
