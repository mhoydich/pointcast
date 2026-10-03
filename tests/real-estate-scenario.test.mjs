import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_INPUTS, INPUT_FIELDS, SCENARIOS, normalizeInputs, monthlyPayment,
  calculateScenario, compareScenarios } from '../src/lib/real-estate-scenario.mjs';

const near = (actual, expected, tolerance = 1e-6) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} differs from ${expected}`);

const simple = (overrides = {}) => ({
  capital: 100_000, annualContribution: 0, purchasePrice: 100_000,
  downPaymentPct: 100, interestRate: 0, loanYears: 30,
  monthlyRent: 0, vacancyPct: 0, propertyTax: 0, insurance: 0, repairs: 0,
  managementPct: 0, capexReserveAnnual: 0, closingCostPct: 0, reserveMonths: 0,
  rentGrowthPct: 0, appreciationPct: 0, expenseGrowthPct: 0, sellingCostPct: 0,
  minDscr: 1.25, ...overrides,
});

test('metadata covers every default and labels hypothetical inputs', () => {
  assert.deepEqual(INPUT_FIELDS.map(({ key }) => key), Object.keys(DEFAULT_INPUTS));
  assert.ok(INPUT_FIELDS.every(({ label, unit, group, min, max, step }) =>
    label && unit && group && Number.isFinite(min) && Number.isFinite(max) && step > 0));
  assert.match(INPUT_FIELDS.find(({ key }) => key === 'monthlyRent').description, /Invented/);
  assert.equal(DEFAULT_INPUTS.minDscr, 1.25);
});

test('normalization preserves permitted zero and rejects unknown, invalid, or unbounded input', () => {
  const zero = normalizeInputs({ capital: 0, annualContribution: 0, monthlyRent: 0, interestRate: 0,
    downPaymentPct: 0, reserveMonths: 0, minDscr: 0 });
  assert.equal(zero.capital, 0);
  assert.equal(zero.interestRate, 0);
  for (const bad of [{ secret: 1 }, { capital: NaN }, { capital: Infinity }, { capital: '250000' },
    { capital: -1 }, { downPaymentPct: 101 }, { purchasePrice: 0 }, { loanYears: 1.5 }]) {
    assert.throws(() => normalizeInputs(bad));
  }
  for (const bad of [null, [], new Date()]) assert.throws(() => normalizeInputs(bad), TypeError);
  assert.throws(() => normalizeInputs({ [Symbol('unknown')]: 1 }), /Unknown/);
  assert.throws(() => normalizeInputs(JSON.parse('{"__proto__": 1}')), /Unknown/);
});

test('monthly payment handles zero debt and zero rate, and agrees with a known amortization payment', () => {
  assert.equal(monthlyPayment(0, 6.5, 30), 0);
  near(monthlyPayment(100_000, 0, 30), 100_000 / 360);
  near(monthlyPayment(100_000, 6, 30), 599.5505251527569);
  assert.throws(() => monthlyPayment(-1, 6, 30), RangeError);
  assert.throws(() => monthlyPayment(100_000, NaN, 30), TypeError);
});

test('default example qualifies in base and reports no invented observed data', () => {
  const result = calculateScenario();
  assert.equal(result.illustrative, true);
  assert.equal(result.currency, 'USD');
  assert.equal(result.years.length, 5);
  assert.equal(result.years[0].acquiredCount, 1);
  assert.ok(result.initialMetrics.dscr >= 1.25);
  assert.match(result.methodology[0], /invented modeling examples/);
  assert.equal(result.final.taxesExcluded, true);
});

test('debt-free acquisition has null DSCR, finite outputs, and all-cash qualification', () => {
  const result = calculateScenario(simple());
  assert.equal(result.years[0].propertyCount, 1);
  assert.equal(result.initialMetrics.dscr, null);
  assert.equal(result.initialMetrics.dscrStatus, 'debt-free');
  assert.equal(result.final.debtBalance, 0);
  assert.equal(result.final.equity, 100_000);
  const checkFinite = (value) => {
    if (typeof value === 'number') assert.ok(Number.isFinite(value));
    if (value && typeof value === 'object') Object.values(value).forEach(checkFinite);
  };
  checkFinite(result);
});

test('monthly amortization matches the independent closed form after 12 and 60 payments', () => {
  const principal = 75_000;
  const rate = 0.06 / 12;
  const payment = principal * rate * (1 + rate) ** 360 / ((1 + rate) ** 360 - 1);
  const balance = (months) => principal * (1 + rate) ** months - payment * ((1 + rate) ** months - 1) / rate;
  const result = calculateScenario(simple({ capital: 25_000, downPaymentPct: 25, interestRate: 6,
    monthlyRent: 1_000, minDscr: 0 }));
  near(result.years[0].debtBalance, balance(12));
  near(result.years[4].properties[0].debtBalance, balance(60));
  near(result.final.debtBalance, result.years[4].properties.reduce((total, holding) =>
    total + balance((6 - holding.acquiredYear) * 12), 0));
  near(result.years[0].principalPaid + result.years[0].interestPaid, result.years[0].debtService);
});

test('one-year zero-rate loan pays off in year 1, with no subsequent scheduled debt service', () => {
  const result = calculateScenario(simple({ capital: 50_000, downPaymentPct: 50,
    loanYears: 1, monthlyRent: 5_000, minDscr: 0 }));
  near(result.years[0].debtBalance, 0);
  near(result.years[0].debtService, 50_000);
  assert.equal(result.years[1].properties[0].debtBalance, 0);
  // New purchases may borrow; the original property never owes a 13th payment.
  assert.equal(result.years[1].properties[0].paymentsMade, 12);
});

test('positive-interest one-year loans pay off after exactly 12 payments', () => {
  for (const interestRate of [6.5, 40]) {
    const result = calculateScenario(simple({ capital: 25_000, downPaymentPct: 25,
      loanYears: 1, interestRate, monthlyRent: 10_000, minDscr: 0 }));
    near(result.years[0].properties[0].debtBalance, 0);
    near(result.years[0].principalPaid, 75_000);
    near(result.years[0].debtService, monthlyPayment(75_000, interestRate, 1) * 12);
    assert.equal(result.years[0].properties[0].paymentsMade, 12);
    assert.equal(result.years[1].properties[0].paymentsMade, 12);
  }
});

test('contributions arrive in year 1 and allow at most one property each year', () => {
  const result = calculateScenario(simple({ capital: 0, annualContribution: 100_000, purchasePrice: 50_000 }));
  assert.deepEqual(result.years.map(({ acquiredCount }) => acquiredCount), [1, 1, 1, 1, 1]);
  assert.deepEqual(result.years.map(({ propertyCount }) => propertyCount), [1, 2, 3, 4, 5]);
  assert.equal(result.years[0].acquisitionEligibility.cashAvailable, 100_000);
  assert.equal(result.final.liquidCash, 250_000);
  assert.equal(result.final.totalContributed, 500_000);
  assert.equal(result.final.equity, 500_000);
});

test('insufficient cash blocks all acquisitions with a cash gap, not hypothetical borrowing', () => {
  const result = calculateScenario(simple({ capital: 0 }));
  assert.equal(result.final.propertyCount, 0);
  assert.equal(result.final.debtBalance, 0);
  assert.equal(result.final.equity, 0);
  assert.ok(result.years.every(({ acquisitionEligibility }) =>
    acquisitionEligibility.reasonCodes.includes('insufficient-cash') && acquisitionEligibility.cashGap === 100_000));
});

test('DSCR can block a purchase even when all acquisition cash is available', () => {
  const result = calculateScenario(simple({ capital: 1_000_000, downPaymentPct: 25,
    interestRate: 10, monthlyRent: 400, minDscr: 2 }));
  assert.equal(result.final.propertyCount, 0);
  assert.ok(result.years[0].acquisitionEligibility.reasonCodes.includes('dscr-below-minimum'));
  assert.ok(!result.years[0].acquisitionEligibility.reasonCodes.includes('insufficient-cash'));
});

test('100% vacancy produces zero collected rent and rejects a financed acquisition', () => {
  const result = calculateScenario(simple({ downPaymentPct: 25, vacancyPct: 100, monthlyRent: 2_000 }));
  assert.equal(result.initialMetrics.collectedRent, 0);
  assert.equal(result.initialMetrics.dscr, 0);
  assert.equal(result.final.propertyCount, 0);
});

test('NOI excludes capex and debt; cash flow includes them; management uses collected rent', () => {
  const result = calculateScenario(simple({ monthlyRent: 1_000, vacancyPct: 10, managementPct: 10,
    propertyTax: 1_000, insurance: 500, repairs: 500, capexReserveAnnual: 1_200 }));
  near(result.initialMetrics.management, 1_080);
  near(result.initialMetrics.noi, 7_720);
  near(result.initialMetrics.cashflow, 6_520);
  near(result.initialMetrics.grossYieldPct, 12);
  near(result.initialMetrics.netYieldPct, 7.72);
  near(result.initialMetrics.cashOnCashPct, 6.52);
});

test('net yield includes acquisition closing costs while cap rate uses property prices', () => {
  const result = calculateScenario(simple({ capital: 0, annualContribution: 200_000,
    monthlyRent: 1_000, closingCostPct: 3, appreciationPct: 10 }));
  near(result.initialMetrics.netYieldPct, 12_000 / 103_000 * 100);
  near(result.initialMetrics.capRatePct, 12);
  assert.equal(result.initialMetrics.grossYieldDenominator, 100_000);
  assert.equal(result.initialMetrics.netYieldDenominator, 103_000);
  assert.equal(result.initialMetrics.capRateDenominator, 100_000);
  assert.equal(result.initialMetrics.cashOnCashDenominator, 103_000);
  assert.equal(result.years[1].propertyCount, 2);
  for (const row of result.years) {
    const purchasePrices = row.properties.reduce((total, holding) => total + holding.purchasePrice, 0);
    const acquisitionCosts = purchasePrices + row.cumulativeClosingCosts;
    near(row.netYieldDenominator, acquisitionCosts);
    near(row.capRateDenominator, purchasePrices);
    near(row.grossYieldDenominator, purchasePrices);
    near(row.cashOnCashDenominator, row.cumulativeAcquisitionCash);
    near(row.netYieldPct, row.noi / acquisitionCosts * 100);
    near(row.capRatePct, row.noi / purchasePrices * 100);
    assert.ok(row.netYieldPct < row.capRatePct);
  }
  assert.ok(result.methodology.some((entry) => /Initial works are not modeled/.test(entry)));
});

test('acquisition reserves are separate from liquid cash and do not reduce total equity', () => {
  const result = calculateScenario(simple({ capital: 130_000, monthlyRent: 1_000,
    propertyTax: 1_200, reserveMonths: 6 }));
  const row = result.years[0];
  near(row.acquisitionEligibility.reserveFunding, 600);
  near(row.liquidCash, 40_200);
  near(row.reserves, 600);
  near(row.equity, 140_800);
  near(row.liquidCash + row.reserves + row.propertyValue - row.debtBalance - row.unfundedShortfall, row.equity);
});

test('negative cash flow exhausts reserves and creates an explicit liability', () => {
  const result = calculateScenario(simple({ capital: 22_000, purchasePrice: 10_000,
    monthlyRent: 100, capexReserveAnnual: 24_000, reserveMonths: 6, minDscr: 0 }));
  const row = result.years[0];
  near(row.acquisitionEligibility.reserveFunding, 12_000);
  near(row.cashflow, -22_800);
  near(row.cashDraw, 0);
  near(row.reserveDraw, 12_000);
  near(row.reserves, 0);
  near(row.newShortfall, 10_800);
  near(row.unfundedShortfall, 10_800);
  near(row.equity, -800);
  assert.ok(result.years[1].acquisitionEligibility.reasonCodes.includes('unfunded-shortfall'));
  near(result.final.unfundedShortfall, 102_000);
  near(result.final.netLiquidation, -92_000);
});

test('later contributions repay old funding gaps before becoming acquisition cash', () => {
  const result = calculateScenario(simple({ capital: 16_000, annualContribution: 6_000,
    purchasePrice: 10_000, monthlyRent: 100, capexReserveAnnual: 24_000, reserveMonths: 6, minDscr: 0 }));
  near(result.years[0].unfundedShortfall, 10_800);
  near(result.years[1].contributionToShortfall, 6_000);
  near(result.years[1].acquisitionEligibility.cashAvailable, 0);
  near(result.years[1].acquisitionEligibility.remainingUnfundedShortfall, 4_800);
});

test('later operating income repays funding gaps before accumulating cash and resuming acquisitions', () => {
  const result = calculateScenario(simple({ capital: 10_000, purchasePrice: 10_000,
    monthlyRent: 1_000, capexReserveAnnual: 24_000, rentGrowthPct: 50, expenseGrowthPct: -50 }));
  assert.deepEqual(result.years.slice(0, 3).map(({ unfundedShortfall }) => unfundedShortfall), [12_000, 6_000, 0]);
  near(result.years[1].incomeToShortfall, 6_000);
  near(result.years[2].incomeToShortfall, 6_000);
  near(result.years[2].liquidCash, 15_000);
  assert.deepEqual(result.years.map(({ acquiredCount }) => acquiredCount), [1, 0, 0, 1, 1]);
});

test('appreciation is never spendable cash and future purchase prices rise independently', () => {
  const result = calculateScenario(simple({ appreciationPct: 50 }));
  assert.equal(result.final.propertyCount, 1);
  assert.equal(result.years[1].acquisitionEligibility.purchasePrice, 150_000);
  assert.equal(result.years[1].acquisitionEligibility.cashAvailable, 0);
  near(result.final.propertyValue, 100_000 * 1.5 ** 5);
});

test('calendar rent and cost growth applies equally to existing and later acquisitions', () => {
  const result = calculateScenario(simple({ annualContribution: 100_000, monthlyRent: 1_000,
    propertyTax: 1_000, rentGrowthPct: 10, expenseGrowthPct: 20 }));
  near(result.years[1].scheduledRent, 12_000 * 1.1 * 2);
  near(result.years[1].operatingExpenses, 1_000 * 1.2 * 2);
  near(result.years[1].acquisitionEligibility.scheduledRent, 13_200);
});

test('liquidation deducts sale costs, remaining debt, and funding gaps but no invented tax estimate', () => {
  const result = calculateScenario(simple({ capital: 25_000, downPaymentPct: 25, interestRate: 6,
    monthlyRent: 1_000, minDscr: 0, sellingCostPct: 6 }));
  near(result.final.sellingCosts, result.final.grossSaleValue * 0.06);
  near(result.final.netLiquidation, result.final.liquidCash + result.final.reserves +
    result.final.grossSaleValue - result.final.sellingCosts - result.final.debtBalance - result.final.unfundedShortfall);
  near(result.final.gainAfterIllustrativeSaleCosts, result.final.netLiquidation - result.final.totalContributed);
  assert.equal(result.final.taxesExcluded, true);
});

test('annual equity and debt conserve contributions, acquisition costs, operating results, and value changes', () => {
  const cases = [
    calculateScenario(),
    calculateScenario(simple({ capital: 22_000, purchasePrice: 10_000, monthlyRent: 100,
      capexReserveAnnual: 24_000, reserveMonths: 6, minDscr: 0 })),
    calculateScenario(simple({ annualContribution: 100_000, monthlyRent: 1_000, downPaymentPct: 25,
      interestRate: 6, closingCostPct: 3, reserveMonths: 6, propertyTax: 1_000,
      appreciationPct: -10, expenseGrowthPct: 20, minDscr: 0 })),
  ];
  for (const result of cases) {
    let previousEquity = result.effectiveInputs.capital;
    let previousDebt = 0;
    let previousValue = 0;
    let previousNetCash = result.effectiveInputs.capital;
    for (const row of result.years) {
      const newPurchasePrice = row.properties.filter(({ acquiredYear }) => acquiredYear === row.year)
        .reduce((total, holding) => total + holding.purchasePrice, 0);
      const downPayment = newPurchasePrice * result.effectiveInputs.downPaymentPct / 100;
      const newLoan = newPurchasePrice - downPayment;
      const closingCosts = newPurchasePrice * result.effectiveInputs.closingCostPct / 100;
      const valueChange = row.propertyValue - previousValue - newPurchasePrice;
      near(row.debtBalance, previousDebt + newLoan - row.principalPaid, 1e-5);
      near(row.equity, previousEquity + row.contribution + row.noi - row.capex - row.interestPaid - closingCosts + valueChange, 1e-5);
      const netCash = row.liquidCash + row.reserves - row.unfundedShortfall;
      near(netCash, previousNetCash + row.contribution + row.cashflow - downPayment - closingCosts, 1e-5);
      previousEquity = row.equity;
      previousDebt = row.debtBalance;
      previousValue = row.propertyValue;
      previousNetCash = netCash;
    }
  }
});

test('scenario deltas are explicit, fixed-rate, bounded sensitivities rather than forecasts', () => {
  const results = compareScenarios({ vacancyPct: 1, interestRate: 0, appreciationPct: 50 });
  assert.deepEqual(results.map(({ scenario }) => scenario.id), ['adverse', 'base', 'upside']);
  assert.equal(SCENARIOS[0].deltas.interestRate, 2);
  assert.equal(results[0].effectiveInputs.monthlyRent, DEFAULT_INPUTS.monthlyRent * 0.9);
  assert.equal(results[0].effectiveInputs.interestRate, 2);
  assert.equal(results[2].effectiveInputs.vacancyPct, 0);
  assert.equal(results[2].effectiveInputs.interestRate, 0);
  assert.equal(results[2].effectiveInputs.appreciationPct, 50);
  assert.ok(results[2].appliedAdjustments.some(({ clamped }) => clamped));
  assert.throws(() => calculateScenario({}, 'forecast'), /Unknown scenario/);
});

test('valid upper-bound prices continue calculating as future acquisition prices grow', () => {
  const result = calculateScenario(simple({ purchasePrice: 100_000_000, capital: 0,
    downPaymentPct: 0, closingCostPct: 3, appreciationPct: 50, interestRate: 40 }));
  assert.equal(result.final.propertyCount, 0);
  near(result.years[4].acquisitionEligibility.purchasePrice, 100_000_000 * 1.5 ** 4);
  assert.ok(Number.isFinite(result.years[4].acquisitionEligibility.monthlyPayment));
  near(monthlyPayment(500_000_000, 0, 30), 500_000_000 / 360);
  near(monthlyPayment(100_000, 1e-12, 30), 100_000 / 360, 1e-6);
});

test('calculation does not mutate supplied inputs or leak state between runs', () => {
  const input = Object.freeze(simple());
  const first = calculateScenario(input);
  first.years[0].properties[0].reserve = 999;
  assert.equal(calculateScenario(input).years[0].properties[0].reserve, 0);
  assert.equal(input.capital, 100_000);
});
