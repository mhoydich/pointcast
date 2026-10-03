/**
 * An illustrative, USD-denominated, five-year team portfolio model.
 * No input is an observed listing, a lending offer, or a user's actual budget.
 * All rates are human percentages (6.5 means 6.5%); minDscr is a ratio.
 * This module is pure: it reads no accounts and performs no transactions.
 */

const field = (key, label, unit, min, max, step, group, defaultValue, description) =>
  Object.freeze({ key, label, unit, min, max, step, group, defaultValue, description });

export const INPUT_FIELDS = Object.freeze([
  field('capital', 'Hypothetical starting capital', 'USD', 0, 100_000_000, 1_000, 'Capital', 250_000, 'Available team cash before the first annual contribution; no actual budget is assumed.'),
  field('annualContribution', 'Annual cash contribution', 'USD', 0, 10_000_000, 1_000, 'Capital', 30_000, 'Added at the start of each of five years, including year 1; pays any previous funding gap first.'),
  field('purchasePrice', 'Illustrative property price', 'USD', 1, 100_000_000, 5_000, 'Acquisition', 650_000, 'Invented starting property price, not an observed listing. Later acquisition prices follow the appreciation assumption.'),
  field('downPaymentPct', 'Down payment', '%', 0, 100, 1, 'Financing', 35, 'Loan-to-value equals 100% minus the down-payment percentage.'),
  field('interestRate', 'Fixed annual mortgage rate', '%', 0, 40, 0.1, 'Financing', 6.5, 'Nominal annual rate divided by 12; fixed for each scenario, with no refinance or loan fees beyond closing costs.'),
  field('loanYears', 'Amortization term', 'years', 1, 50, 1, 'Financing', 30, 'Whole-year, fully amortizing monthly loan term. No balloon payment or interest-only period.'),
  field('monthlyRent', 'Illustrative monthly scheduled rent', 'USD', 0, 1_000_000, 100, 'Income', 5_200, 'Invented modeling rent per property, not an observed comparable or promised income.'),
  field('vacancyPct', 'Vacancy and collection loss', '%', 0, 100, 1, 'Income', 5, 'Deducted from scheduled rent; a simplified combined allowance rather than monthly tenant events.'),
  field('propertyTax', 'Annual property tax', 'USD', 0, 10_000_000, 100, 'Operating costs', 8_125, 'Editable starting annual tax budget per property; local reassessment and exemptions are not modeled.'),
  field('insurance', 'Annual insurance', 'USD', 0, 10_000_000, 100, 'Operating costs', 2_400, 'Starting annual insurance budget per property; coverage availability and deductibles require separate research.'),
  field('repairs', 'Annual repairs and maintenance', 'USD', 0, 10_000_000, 100, 'Operating costs', 3_000, 'Routine operating maintenance; distinct from the annual capital expenditure budget.'),
  field('managementPct', 'Management share of collected rent', '%', 0, 100, 0.5, 'Operating costs', 8, 'Applied to rent after vacancy and collection loss.'),
  field('capexReserveAnnual', 'Annual capex budget', 'USD', 0, 10_000_000, 100, 'Operating costs', 3_000, 'Conservative annual capital replacement allowance treated as cash spent, excluded from NOI. Unspent capex balances are not tracked.'),
  field('closingCostPct', 'Acquisition closing costs', '%', 0, 25, 0.5, 'Acquisition', 3, 'One-time purchase cost paid from cash; no basis, tax, or financing treatment is inferred.'),
  field('reserveMonths', 'Initial liquidity reserve', 'months', 0, 36, 1, 'Acquisition', 6, 'Months of operating costs, capex budget, and scheduled debt service ring-fenced at purchase. No automatic replenishment.'),
  field('rentGrowthPct', 'Annual rent growth', '%', -50, 50, 0.5, 'Growth and exit', 3, 'Calendar-year growth applied to existing properties and future acquisitions; first-year rent has no growth.'),
  field('appreciationPct', 'Annual property value change', '%', -50, 50, 0.5, 'Growth and exit', 3, 'Changes estimated year-end values and future purchase prices, never spendable cash.'),
  field('expenseGrowthPct', 'Annual expense growth', '%', -50, 50, 0.5, 'Growth and exit', 3, 'Calendar-year growth of tax, insurance, repairs, and capex budgets; management follows collected rent.'),
  field('sellingCostPct', 'Illustrative sale costs', '%', 0, 25, 0.5, 'Growth and exit', 6, 'Applied to gross estimated sale value in the final hypothetical liquidation; sale taxes are excluded.'),
  field('minDscr', 'Minimum acquisition DSCR', 'ratio', 0, 5, 0.05, 'Financing', 1.25, 'NOI divided by first-year scheduled debt service. A modeling screen, not an approval or a lender commitment.'),
]);

export const DEFAULT_INPUTS = Object.freeze(Object.fromEntries(INPUT_FIELDS.map(({ key, defaultValue }) => [key, defaultValue])));

const scenario = (id, label, description, deltas) => Object.freeze({ id, label, description, deltas: Object.freeze(deltas) });

/** These are sensitivity assumptions, not forecasts or probability estimates. */
export const SCENARIOS = Object.freeze([
  scenario('adverse', 'Adverse', 'Lower starting rent, more vacancy, more expensive debt, and slower growth.', {
    monthlyRentPct: -10, vacancyPct: 8, interestRate: 2,
    rentGrowthPct: -3, appreciationPct: -5, expenseGrowthPct: 3,
  }),
  scenario('base', 'Base', 'The editable input assumptions, without additional scenario changes.', {
    monthlyRentPct: 0, vacancyPct: 0, interestRate: 0,
    rentGrowthPct: 0, appreciationPct: 0, expenseGrowthPct: 0,
  }),
  scenario('upside', 'Upside', 'Higher starting rent, less vacancy, cheaper debt, and faster growth.', {
    monthlyRentPct: 5, vacancyPct: -2, interestRate: -1,
    rentGrowthPct: 1, appreciationPct: 2, expenseGrowthPct: -1,
  }),
]);

const FIELDS_BY_KEY = new Map(INPUT_FIELDS.map((entry) => [entry.key, entry]));
const EPSILON = 1e-7;
const percent = (value) => value / 100;
const clean = (value) => Math.abs(value) < EPSILON ? 0 : value;
const ratio = (numerator, denominator) => denominator > EPSILON ? numerator / denominator : null;
const yieldPct = (numerator, denominator) => denominator > EPSILON ? numerator / denominator * 100 : null;

/** Strict numeric input validation. Zero is valid wherever the metadata permits it. */
export function normalizeInputs(input = {}) {
  if (input === null || typeof input !== 'object' || Array.isArray(input) ||
      ![Object.prototype, null].includes(Object.getPrototypeOf(input))) {
    throw new TypeError('Scenario inputs must be a plain object.');
  }
  const result = { ...DEFAULT_INPUTS };
  for (const key of Reflect.ownKeys(input)) {
    if (typeof key !== 'string' || !FIELDS_BY_KEY.has(key)) throw new TypeError(`Unknown scenario input: ${String(key)}.`);
    const value = input[key];
    const definition = FIELDS_BY_KEY.get(key);
    if (typeof value !== 'number' || !Number.isFinite(value)) throw new TypeError(`${key} must be a finite number.`);
    if (value < definition.min || value > definition.max) throw new RangeError(`${key} must be between ${definition.min} and ${definition.max}.`);
    if (key === 'loanYears' && !Number.isInteger(value)) throw new RangeError('loanYears must be a whole number.');
    result[key] = value;
  }
  return result;
}

/** Standard fully amortizing payment; zero principal or zero interest is explicit. */
export function monthlyPayment(principal, annualRatePercent, loanYears) {
  if (![principal, annualRatePercent, loanYears].every((value) => typeof value === 'number' && Number.isFinite(value))) {
    throw new TypeError('Payment inputs must be finite numbers.');
  }
  if (principal < 0 || annualRatePercent < 0 || annualRatePercent > 40 ||
      loanYears < 1 || loanYears > 50 || !Number.isInteger(loanYears)) {
    throw new RangeError('Invalid payment principal, annual percentage rate, or whole-year term.');
  }
  if (principal === 0) return 0;
  const months = loanYears * 12;
  const rate = percent(annualRatePercent) / 12;
  if (rate === 0) return principal / months;
  // log1p/expm1 remain stable for very small positive rates.
  // The principal may be a later-year price derived from bounded user inputs.
  return principal * (rate / -Math.expm1(-months * Math.log1p(rate)));
}

function effectiveAssumptions(inputs, definition) {
  const effectiveInputs = { ...inputs };
  const appliedAdjustments = [];
  for (const [deltaKey, delta] of Object.entries(definition.deltas)) {
    const key = deltaKey === 'monthlyRentPct' ? 'monthlyRent' : deltaKey;
    const metadata = FIELDS_BY_KEY.get(key);
    const requestedValue = deltaKey === 'monthlyRentPct' ? inputs[key] * (1 + percent(delta)) : inputs[key] + delta;
    const after = Math.max(metadata.min, Math.min(metadata.max, requestedValue));
    effectiveInputs[key] = after;
    appliedAdjustments.push({ field: key, before: inputs[key], after, requestedDelta: delta,
      deltaUnit: deltaKey === 'monthlyRentPct' ? '% of input' : 'percentage points', clamped: after !== requestedValue });
  }
  return { effectiveInputs, appliedAdjustments };
}

function operations(inputs, yearIndex) {
  const rentFactor = (1 + percent(inputs.rentGrowthPct)) ** yearIndex;
  const expenseFactor = (1 + percent(inputs.expenseGrowthPct)) ** yearIndex;
  const scheduledRent = inputs.monthlyRent * 12 * rentFactor;
  const collectedRent = scheduledRent * (1 - percent(inputs.vacancyPct));
  const management = collectedRent * percent(inputs.managementPct);
  const propertyTax = inputs.propertyTax * expenseFactor;
  const insurance = inputs.insurance * expenseFactor;
  const repairs = inputs.repairs * expenseFactor;
  const capex = inputs.capexReserveAnnual * expenseFactor;
  const operatingExpenses = propertyTax + insurance + repairs + management;
  return { scheduledRent, collectedRent, management, propertyTax, insurance, repairs, capex,
    operatingExpenses, noi: collectedRent - operatingExpenses };
}

function acquisitionTerms(inputs, yearIndex) {
  const purchasePrice = inputs.purchasePrice * (1 + percent(inputs.appreciationPct)) ** yearIndex;
  const downPayment = purchasePrice * percent(inputs.downPaymentPct);
  const loanAmount = purchasePrice - downPayment;
  const closingCosts = purchasePrice * percent(inputs.closingCostPct);
  const payment = monthlyPayment(loanAmount, inputs.interestRate, inputs.loanYears);
  const debtService = payment * 12;
  const op = operations(inputs, yearIndex);
  const reserveFunding = (op.operatingExpenses + op.capex + debtService) / 12 * inputs.reserveMonths;
  const requiredCash = downPayment + closingCosts + reserveFunding;
  const dscr = ratio(op.noi, debtService);
  return { purchasePrice, downPayment, loanAmount, ltvPct: 100 - inputs.downPaymentPct,
    closingCosts, monthlyPayment: payment, debtService, reserveFunding, requiredCash, dscr,
    dscrStatus: debtService <= EPSILON ? 'debt-free' : 'ratio', ...op,
    grossYieldPct: yieldPct(op.scheduledRent, purchasePrice),
    effectiveGrossYieldPct: yieldPct(op.collectedRent, purchasePrice),
    netYieldPct: yieldPct(op.noi, purchasePrice + closingCosts), capRatePct: yieldPct(op.noi, purchasePrice),
    grossYieldDenominator: purchasePrice, netYieldDenominator: purchasePrice + closingCosts,
    capRateDenominator: purchasePrice, cashOnCashDenominator: requiredCash,
    cashflow: op.noi - op.capex - debtService,
    cashOnCashPct: yieldPct(op.noi - op.capex - debtService, requiredCash) };
}

export const METHODOLOGY = Object.freeze([
  'All currency is hypothetical USD. Defaults are invented modeling examples, not local comparable rents, prices, financial commitments, or lending offers.',
  'The model runs five years. A contribution arrives at the start of every year, including year 1; it first repays any prior unfunded cash deficit.',
  'At most one identical prototype property is acquired at each year start. Available cash must cover down payment, closing costs, and a separate liquidity reserve; acquisition NOI must be nonnegative and DSCR must meet the chosen threshold when there is debt.',
  'Future acquisition prices follow annual appreciation. Rents and expenses follow calendar-year growth for every property, including later acquisitions; first-year inputs receive no growth.',
  'Scheduled rent = monthly rent × 12. Collected rent = scheduled rent × (1 − vacancy percentage). Management = collected rent × management percentage.',
  'NOI = collected rent − property tax − insurance − repairs − management. Debt service and capex are excluded from NOI. Cash flow = NOI − annual capex budget − actual scheduled annual debt service.',
  'Annual capex is conservatively treated as cash spent, rather than an accumulating reserve account. The separate acquisition liquidity reserve is funded at purchase, can cover cash deficits, and is not automatically replenished.',
  'Mortgage payments use a nominal annual rate divided by 12 and monthly amortization. Every scenario uses a fixed rate, with no refinance. Debt-free DSCR is returned as null, never Infinity.',
  'Monthly deficits draw liquid cash, then liquidity reserves; any remainder becomes an explicit unfunded shortfall. Later income or contributions pay that gap before rebuilding cash. Contractual debt amortization continues on schedule; actual default, arrears, foreclosure, and rescue financing are not simulated.',
  'Gross yield = scheduled annual rent ÷ purchase price. Net yield = NOI ÷ (purchase price + acquisition closing costs). Cap rate = NOI ÷ purchase price. Initial works are not modeled. Initial cash-on-cash = annual cash flow after capex and debt ÷ down payment, closing costs, and initial reserves combined.',
  'Portfolio annual gross yield and cap rate use total purchase prices as denominator; net yield includes cumulative acquisition closing costs in that denominator. Annual cash-on-cash uses cumulative acquisition cash committed. Explicit denominator amounts are returned with the metrics. Equity = liquid cash + remaining reserves + estimated property value − debt − unfunded shortfall.',
  'Final illustrative liquidation = liquid cash + remaining reserves + estimated sale value − selling costs − remaining debt − unfunded shortfall. Income taxes, depreciation, recapture, capital-gains taxes, transfer-specific taxes, FX, and legal ownership constraints are excluded.',
  'Adverse, base, and upside deltas are explicit sensitivity assumptions, not forecasts or probabilities. Scenario adjustments clamp to input bounds and report when clamped.',
]);

/**
 * Calculate one scenario. Uses full precision internally; formatting is the UI's job.
 * A funding gap is a liability in equity, not invented cash or a financing approval.
 */
export function calculateScenario(input = {}, scenarioId = 'base') {
  const inputs = normalizeInputs(input);
  const definition = SCENARIOS.find(({ id }) => id === scenarioId);
  if (!definition) throw new RangeError(`Unknown scenario: ${String(scenarioId)}.`);
  const { effectiveInputs: effective, appliedAdjustments } = effectiveAssumptions(inputs, definition);
  let liquidCash = effective.capital;
  let unfundedShortfall = 0;
  let cumulativeContributions = 0;
  let cumulativeAcquisitionCash = 0;
  let cumulativeClosingCosts = 0;
  let cumulativeCashflow = 0;
  const holdings = [];
  const years = [];
  const initialMetrics = acquisitionTerms(effective, 0);

  for (let year = 1; year <= 5; year += 1) {
    const yearIndex = year - 1;
    const liquidCashBeforeContribution = liquidCash;
    cumulativeContributions += effective.annualContribution;
    const contributionToShortfall = Math.min(effective.annualContribution, unfundedShortfall);
    unfundedShortfall = clean(unfundedShortfall - contributionToShortfall);
    liquidCash += effective.annualContribution - contributionToShortfall;
    const terms = acquisitionTerms(effective, yearIndex);
    const reasons = [];
    const reasonCodes = [];
    const reject = (code, message) => { reasonCodes.push(code); reasons.push(message); };
    if (unfundedShortfall > EPSILON) reject('unfunded-shortfall', 'A previous cash deficit remains unfunded.');
    if (liquidCash + EPSILON < terms.requiredCash) reject('insufficient-cash', 'Cash does not cover down payment, closing costs, and the initial liquidity reserve.');
    if (terms.noi < -EPSILON) reject('negative-noi', 'Acquisition NOI is negative.');
    if (terms.dscr !== null && terms.dscr + EPSILON < effective.minDscr) reject('dscr-below-minimum', 'Acquisition DSCR is below the selected minimum.');
    const eligible = reasons.length === 0;
    const acquisitionEligibility = { eligible, acquired: eligible, reasons, reasonCodes,
      cashAvailable: liquidCash, cashGap: Math.max(0, terms.requiredCash - liquidCash),
      remainingUnfundedShortfall: unfundedShortfall, ...terms, minDscr: effective.minDscr };
    if (eligible) {
      liquidCash = clean(liquidCash - terms.requiredCash);
      cumulativeAcquisitionCash += terms.requiredCash;
      cumulativeClosingCosts += terms.closingCosts;
      holdings.push({ id: holdings.length + 1, acquiredYear: year, purchasePrice: terms.purchasePrice,
        originalLoanAmount: terms.loanAmount, debtBalance: terms.loanAmount,
        monthlyPayment: terms.monthlyPayment, paymentsMade: 0,
        reserve: terms.reserveFunding, initialReserve: terms.reserveFunding });
    }

    const op = operations(effective, yearIndex);
    let debtService = 0;
    let principalPaid = 0;
    let interestPaid = 0;
    let cashDraw = 0;
    let reserveDraw = 0;
    let newShortfall = 0;
    let incomeToShortfall = 0;
    const cashflowBeforeDebt = (op.noi - op.capex) * holdings.length;

    for (let month = 0; month < 12; month += 1) {
      let monthlyDebtService = 0;
      for (const holding of holdings) {
        if (holding.debtBalance <= EPSILON) continue;
        const interest = holding.debtBalance * percent(effective.interestRate) / 12;
        const payment = Math.min(holding.monthlyPayment, holding.debtBalance + interest);
        const principal = payment - interest;
        holding.debtBalance = clean(Math.max(0, holding.debtBalance - principal));
        holding.paymentsMade += 1;
        monthlyDebtService += payment;
        principalPaid += principal;
        interestPaid += interest;
      }
      debtService += monthlyDebtService;
      const monthlyCashflow = cashflowBeforeDebt / 12 - monthlyDebtService;
      if (monthlyCashflow >= 0) {
        const gapRepayment = Math.min(monthlyCashflow, unfundedShortfall);
        unfundedShortfall = clean(unfundedShortfall - gapRepayment);
        incomeToShortfall += gapRepayment;
        liquidCash += monthlyCashflow - gapRepayment;
      } else {
        let deficit = -monthlyCashflow;
        const fromCash = Math.min(deficit, liquidCash);
        liquidCash = clean(liquidCash - fromCash);
        deficit -= fromCash;
        cashDraw += fromCash;
        for (const holding of holdings) {
          if (deficit <= EPSILON) break;
          const fromReserve = Math.min(deficit, holding.reserve);
          holding.reserve = clean(holding.reserve - fromReserve);
          deficit -= fromReserve;
          reserveDraw += fromReserve;
        }
        if (deficit > EPSILON) {
          unfundedShortfall += deficit;
          newShortfall += deficit;
        }
      }
    }

    const propertyCount = holdings.length;
    const reserves = holdings.reduce((total, holding) => total + holding.reserve, 0);
    const debtBalance = holdings.reduce((total, holding) => total + holding.debtBalance, 0);
    const totalPurchasePrice = holdings.reduce((total, holding) => total + holding.purchasePrice, 0);
    const propertyValue = holdings.reduce((total, holding) => total +
      holding.purchasePrice * (1 + percent(effective.appreciationPct)) ** (year - holding.acquiredYear + 1), 0);
    const noi = op.noi * propertyCount;
    const capex = op.capex * propertyCount;
    const cashflow = noi - capex - debtService;
    cumulativeCashflow += cashflow;
    const dscr = ratio(noi, debtService);
    const equity = liquidCash + reserves + propertyValue - debtBalance - unfundedShortfall;
    years.push({ year, contribution: effective.annualContribution, liquidCashBeforeContribution,
      contributionToShortfall, incomeToShortfall, acquisitionEligibility, acquiredCount: eligible ? 1 : 0,
      propertyCount, properties: holdings.map((holding) => ({ ...holding,
        value: holding.purchasePrice * (1 + percent(effective.appreciationPct)) ** (year - holding.acquiredYear + 1) })),
      scheduledRent: op.scheduledRent * propertyCount, collectedRent: op.collectedRent * propertyCount,
      operatingExpenses: op.operatingExpenses * propertyCount, noi, capex, debtService,
      principalPaid, interestPaid, cashflow, cashDraw, reserveDraw, newShortfall,
      liquidCash: clean(liquidCash), reserves: clean(reserves), unfundedShortfall: clean(unfundedShortfall),
      propertyValue, debtBalance: clean(debtBalance), assetEquity: propertyValue - debtBalance, equity,
      dscr, dscrStatus: debtService <= EPSILON ? (propertyCount ? 'debt-free' : 'no-properties') : 'ratio',
      grossYieldPct: yieldPct(op.scheduledRent * propertyCount, totalPurchasePrice),
      netYieldPct: yieldPct(noi, totalPurchasePrice + cumulativeClosingCosts), capRatePct: yieldPct(noi, totalPurchasePrice),
      grossYieldDenominator: totalPurchasePrice, netYieldDenominator: totalPurchasePrice + cumulativeClosingCosts,
      capRateDenominator: totalPurchasePrice, cashOnCashDenominator: cumulativeAcquisitionCash,
      cashOnCashPct: yieldPct(cashflow, cumulativeAcquisitionCash),
      reserveCoverageMonths: ratio(reserves * 12, op.operatingExpenses * propertyCount + capex + debtService),
      cumulativeContributions, cumulativeAcquisitionCash, cumulativeClosingCosts, cumulativeCashflow });
  }

  const last = years.at(-1);
  const sellingCosts = last.propertyValue * percent(effective.sellingCostPct);
  const netPropertySaleProceeds = last.propertyValue - sellingCosts - last.debtBalance;
  const netLiquidation = last.liquidCash + last.reserves + netPropertySaleProceeds - last.unfundedShortfall;
  const totalContributed = effective.capital + cumulativeContributions;
  return { modelVersion: '1.0', horizonYears: 5, currency: 'USD', illustrative: true,
    inputs, effectiveInputs: effective, scenario: definition, appliedAdjustments, initialMetrics, years,
    final: { propertyCount: last.propertyCount, liquidCash: last.liquidCash, reserves: last.reserves,
      propertyValue: last.propertyValue, debtBalance: last.debtBalance,
      unfundedShortfall: last.unfundedShortfall, equity: last.equity, grossSaleValue: last.propertyValue,
      sellingCosts, netPropertySaleProceeds, netLiquidation, totalContributed,
      gainAfterIllustrativeSaleCosts: netLiquidation - totalContributed, taxesExcluded: true },
    methodology: METHODOLOGY };
}

export function compareScenarios(input = {}) {
  const inputs = normalizeInputs(input);
  return SCENARIOS.map(({ id }) => calculateScenario(inputs, id));
}
