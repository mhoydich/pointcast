# Pacific Utility — Local Manufacturing Brief

Revision A.1 · 20 October 2026 · Direction: Michael Hoydich

## Status

Preliminary engineering targets, not validated specifications or a production release. No products are offered for sale. Local fabrication, assembly and repair are the goal; components may be sourced globally. Named suppliers are uncontacted candidates. No quotes, certifications or partnerships are claimed.

## First build

Start with Buoy Light and Dock Fan; prototype Sunboard mechanics in parallel. Harbor Base and refrigeration need experienced electrical/refrigeration partners. Buy documented protected batteries and complete sealed refrigeration systems. Avoid custom cell welding and refrigeration-circuit work in the first program.

## Common interfaces

Physical controls work without phone, network or AI. Solar input, battery connection and regulated appliance output must use distinct, reviewed interfaces. Voltage, current, polarity, keyed connector, fuse and thermal requirements remain open until electrical review. Do not wire from this brief. Keep screws/service panels accessible. Record serial/lot, module supplier, torque values and test results.

## Release pack

Requirements matrix; dimensioned neutral CAD; tolerance stack; make/buy BOM; electrical block diagram and reviewed harness pinout; assembly traveler and fixtures; inspection/test procedures with pass/fail limits; cost model; compliance matrix; signed release. No production CAD or wiring drawings are included yet.

## PU—05 / Buoy Light

Pilot 01 · Indoor + sheltered outdoor

**Target:** 2700 K • 4 W operating assumption

**Envelope study:** 120 × 120 × 220 mm envelope; ≤ 1.2 kg design target

**Power:** USB-C input through a qualified charge module; purchased protected removable battery. Pack capacity and connector remain open until runtime/thermal work.

**Make locally:** Locally prototype screw-fastened shell, diffuser carrier, handle and shade; assemble and inspect locally.

**Buy initially:** Documented battery/charger assembly, LED board and constant-current driver, diffuser material, gasket and captive fasteners.

### Preliminary BOM

| Assembly | Qty | Direction |

|---|---|---|

| Shell + base | 1 set | Printed/CNC prototype; molded later |

| LED + driver | 1 set | Purchased matched assembly |

| Protected battery + charger | 1 set | Supplier documentation required |

| Diffuser + gasket | 1 set | Optical and material review |

| Handle, screws, harness | 1 kit | Replaceable service parts |

**Assembly:** Inspect modules → fit LED to thermal carrier → install insulated harness and protected pack → fit diffuser/gasket → torque shell → functional test and serialize.

### Validation

- Measure CCT, light output and 4 W operating point. Runtime must be measured at each dimmer setting.

- Thermal and charging review with diffuser installed; protection and abnormal-use testing by qualified engineers.

- Tip stability, handle fatigue, drops and service access. Ingress target only after enclosure testing.

**Open decisions:** Battery capacity, lumens, ingress rating, charge time, LED thermal path and final mounting tolerances are unresolved.

## PU—04 / Dock Fan

Pilot 02 · Indoor + sheltered outdoor

**Target:** 200–250 mm rotor study • 12 W setting assumption

**Envelope study:** 300 × 180 × 330 mm envelope; ≤ 2.5 kg design target

**Power:** Purchased matched DC motor/rotor/controller. Protected removable battery and physical speed dial. No custom raw-cell assembly.

**Make locally:** Formed aluminum yoke, base, serviceable grille and assembly fixture; local final assembly.

**Buy initially:** Matched motor/rotor/controller, documented protected battery/charge module, bearings, isolators and harness.

### Preliminary BOM

| Assembly | Qty | Direction |

|---|---|---|

| Motor, rotor, controller | 1 set | Keep manufacturer-matched |

| Yoke + base | 1 set | Laser/formed aluminum study |

| Guard halves | 2 | Finger-access geometry needs lab review |

| Battery + charge module | 1 set | Purchased protected unit |

| Pivot, feet, dial, harness | 1 kit | Serviceable wear parts |

**Assembly:** Inspect balanced rotor assembly → mount vibration isolators → route strain-relieved harness → install guarded motor → fit pivot/yoke → verify clearance and function.

### Validation

- Record airflow, input power and sound at each setting with declared distance, room and instruments.

- Guard access, blocked rotor, motor temperature and abnormal operation must be reviewed before release.

- Tip stability, pivot fatigue, cable pinch and sand-cleaning tests; verify guard remains retained.

**Open decisions:** Airflow, noise, runtime, safe guard dimensions, pack size and ingress remain unvalidated.

## PU—06 / Room Current

After shared fan platform · Indoor

**Target:** 250–300 mm rotor study • table/pedestal conversion

**Envelope study:** 350 × 350 × 950 mm max envelope; weighted-base mass from stability study

**Power:** External qualified low-voltage supply; removable battery option later. Manual operation offline. Shared fan electronics only if validated for the larger load.

**Make locally:** Local stand, weighted base cover, height lock and assembly; common finish and repair parts with Dock Fan.

**Buy initially:** Matched motor/rotor/controller, qualified supply, cable strain relief and optional documented pack.

### Preliminary BOM

| Assembly | Qty | Direction |

|---|---|---|

| Motor/rotor/control | 1 set | Size-specific matched unit |

| Stand + base | 1 set | Local metal fabrication |

| Guard | 2 halves | Safety review required |

| Supply + cable | 1 set | Qualified external unit |

| Height lock + feet | 1 kit | Replaceable |

**Assembly:** Inspect stand and lock → route cable with pinch clearance → attach guarded head → secure weighted base → test all heights and orientations.

### Validation

- Stability with head fully tilted at maximum height and in table mode.

- Acoustic, airflow, power and temperature measurements in all operating settings.

- Cable flex, lock retention and repeated conversion tests; candidate fan safety standard scoped with lab.

**Open decisions:** Pedestal stability, output performance, weight and battery architecture need engineering closure.

## PU—02 / Sunboard

Mechanical prototype in parallel · Outdoor portable solar

**Target:** 100 W nominal module target • four-part folding frame

**Envelope study:** Folded 400 × 350 × 80 mm envelope; module choice determines actual size

**Power:** Purchased documented PV modules. Solar open-circuit voltage, short-circuit current and cold-temperature limits must match selected controller; final electrical interface is not frozen.

**Make locally:** Local folding frame, locking hinges, kickstand and separate work tray; harness installation and inspection.

**Buy initially:** Documented PV modules, matched controller, cable/glands and rated connectors.

### Preliminary BOM

| Assembly | Qty | Direction |

|---|---|---|

| PV modules | 1 matched set | 100 W nominal target |

| Frame + hinges | 1 kit | Local metal fabrication |

| Work tray | 1 | Loads supported by frame only |

| Controller + harness | 1 set | PV compatibility review |

| Feet + carry strap | 1 kit | Replaceable |

**Assembly:** Check modules → assemble frame with protected edges → route flexible harness clear of hinges → fit stand and tray → measure electrical output and inspect insulation.

### Validation

- Output curves under recorded irradiance and temperature; verify controller compatibility and polarity.

- Hinge/cable flex and connector retention; tray load path must bypass cells.

- Stability and wind-load study before outdoor use; balcony attachment is a separate engineered product.

**Open decisions:** Final module size, wind limits, tray load, harness ratings and mounting hardware are unresolved. Remove tray for charging.

## PU—01 / Harbor Base

Engineering partner required · Indoor + dry sheltered outdoor

**Target:** 512 Wh nominal option • protected DC + USB-C

**Envelope study:** 350 × 230 × 280 mm envelope; weight determined by approved module

**Power:** Purchased protected LiFePO4 battery system with matched BMS/charger and supplier transport evidence. No AC inverter in first prototype. Solar input and appliance outputs physically distinct.

**Make locally:** Local enclosure, module restraint, service panels, bumpers and final integration after electrical review.

**Buy initially:** Documented integrated battery/BMS/charger, qualified DC conversion and USB-C modules, MPPT if compatible, fusing/harness.

### Preliminary BOM

| Assembly | Qty | Direction |

|---|---|---|

| Protected LiFePO4 system | 1 | 512 Wh target; no loose-cell build |

| Enclosure + restraint | 1 set | Local fabrication |

| DC/USB-C conversion | 1 set | Match approved electrical limits |

| Protection + harness | 1 set | Engineer-selected ratings |

| Display, feet, handle | 1 kit | Serviceable |

**Assembly:** Approved electrical design first → incoming module/document check → mechanically retain pack → install protected harness → insulated enclosure assembly → approved system tests → serial traceability.

### Validation

- System hazard and protection review; verify supplier battery and transport documents against exact model.

- Thermal/charge derating, peak current, overload and fault behavior assessed by qualified lab/engineer.

- Handle/drop and enclosure review plus full-system certification scoping; component certification alone is insufficient.

**Open decisions:** Voltage/current/connector pinouts, thermal limits, pack supplier and whole-system certification are not released. 1,024 Wh expansion remains a separate concept.

## PU—03 / Cold Box

After power platform · Beach/camp + home utility

**Target:** 20 L usable volume • 25 W average calculator assumption

**Envelope study:** 500 × 330 × 400 mm envelope; insulation and compressor layout determine final dimensions

**Power:** Purchased complete sealed DC compressor refrigeration system, local thermostat and low-voltage cutoff. Size supply for measured startup current, not average power.

**Make locally:** Local shell/handle/liner feasibility, removable gasket and insulation tooling study. Local integration without opening sealed refrigeration circuit.

**Buy initially:** Complete sealed compressor/evaporator/condenser/control assembly, insulation materials, thermostat and gasket.

### Preliminary BOM

| Assembly | Qty | Direction |

|---|---|---|

| Sealed refrigeration assembly | 1 | Purchase intact qualified system |

| Shell + liner | 1 set | Prototype before tooling |

| Insulation + gasket | 1 set | Thickness from thermal model |

| Thermostat + harness | 1 set | Low-battery protection |

| Handles, divider, feet | 1 kit | Replaceable |

**Assembly:** Inspect sealed system → fit insulated shell and airflow channels → mount system without circuit modification → install thermostat/harness → fit gasket → log pull-down and hold performance.

### Validation

- Log chamber temperature, ambient, load, openings, energy and compressor startup across a defined test matrix.

- Verify condensation drainage, cleanability, seal integrity and heat rejection.

- Refrigeration/electrical safety review before distribution; no food-storage or runtime performance claim yet.

**Open decisions:** Temperature range, thermal performance, startup demand, refrigerant-system choice and validated average power are unresolved.

## Gates

- G0 Define — Now. Requirements, make/buy split, hazard review and comparable RFQ pack approved.

- G1 Bench — 5 proposed engineering units. Functional subsystems measured. Open issues and failures logged. No public field use.

- G2 Integrate — Engineering build. Fit, power, thermals, serviceability and test-lab scope agreed; controlled drawing revisions.

- G3 Pilot — 25 proposed pilot units. Qualified assembly traveler, yield/cost evidence, inspection plan and required testing completed.

- G4 Release — Only after review. Signed engineering release, applicable approvals, labels, instructions, warranty and traceability ready.

## Local sourcing candidates

- [Ramda Metal Specialties](https://www.ramda.com/services) — Gardena. Sheet/tube laser cutting, forming, CNC, finishing and product assembly. Proposed fit: Yokes, power chassis, solar frames.

- [Techni-Mold](https://techni-mold.com/services) — Gardena. CAD/DFM, SLA prototypes, mold design and injection molding. Proposed fit: Shells, knobs, guards and later production tooling.

- [ACME PCB Assembly](https://boardassembly.com/contract-electronics-manufacturing-services/) — Carson. PCBA, rework, box builds, turnkey and final system builds. Proposed fit: Control boards, harness integration and assembly.

- [Rotational Molding Inc.](https://rotationalmoldinginc.com/about/) — Gardena. Custom rotational molding, including recreation products. Proposed fit: Cooler enclosure feasibility.

- [RJ Enterprises](https://www.rjenterprise.net/cnc-machine-shop-torrance) — Gardena. Prototype and production CNC machining, turning and inspection. Proposed fit: Hinges, small mechanical parts and fixtures.

## RFQ instructions

Request comparable 5/25/100-unit quotes. Separate tooling/NRE, components, setup, assembly, inspection, packaging, freight, scrap and contingency. Ask for DFM, lead times, MOQ, tooling ownership, process location, substitutions and quality records. No supplier has been contacted. Publish quotes only with supplier permission; otherwise publish anonymized comparisons.

## Economics

Landed unit cost = purchased parts + fabricated parts + assembly labor + test labor + packaging + inbound freight + scrap/rework allowance + warranty allowance + tooling/NRE amortization at the stated volume. Gross margin = (net selling price − landed unit cost) / net selling price. Add channel/payment costs and operating costs separately. No cost or retail-price commitments until quotes and pilot yield exist.

## Evidence & standards

These primary sources guide laboratory scoping. Applicability and current editions must be agreed with a qualified laboratory. Nothing here is a certification claim.

- [Battery transport / PHMSA](https://www.phmsa.dot.gov/training/hazmat/new-un-requirement-test-summaries): Obtain the exact battery model’s UN 38.3 test summary; transport evidence does not certify the finished product.

- [Portable power / UL 2743 scope](https://www.ul.com/services/portable-power-pack-testing): Candidate scope for portable battery power architecture; laboratory review required.

- [Fans / UL 507](https://shopulstandards.com/ProductDetail.aspx?productId=UL507_10_S_20171109): Candidate electric fan standard for laboratory scoping.

- [Luminaires / UL 153](https://www.shopulstandards.com/ProductDetail.aspx?productId=UL153): Candidate portable luminaire standard for Buoy scoping.

- [Refrigeration / UL 60335-2-24](https://www.ul.com/news/explore-new-edition-ul-60335-2-24): Candidate household/similar refrigeration scope.

- [Photovoltaic modules / UL](https://www.ul.com/services/pv-module-certification): PV module safety and performance certification scoping.

- [Radio integration / FCC](https://apps.fcc.gov/oetcf/kdb/forms/FTSSearchResultPage.cfm?id=44637&switch=P): Review host integration obligations even when buying a certified radio module.

- [Bluetooth qualification](https://www.bluetooth.com/develop-with-bluetooth/qualify/): The brand owner must complete the applicable qualification process.

- [Matter certification / CSA](https://csa-iot.org/certification/why-certify/): Plan certification before interoperability/logo claims.

## Public contribution

Read /agents.md and /api/tasks. Submit evidence through /build#contribute. All work enters review; only approved, consented contributions are public. No authority to spend, contact suppliers, merge code, promise employment or release products is delegated.

## Results / 20 October 2026

Published: six preliminary briefs, five official-source sourcing candidates, twelve tasks and a gated manufacturing plan. Measured prototype results: none yet. All performance numbers remain targets or calculator assumptions.
