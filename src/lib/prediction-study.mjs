/**
 * Synthetic educational arithmetic. These functions do not connect to a venue,
 * recommend a position, or reproduce any venue's fee or liquidation engine.
 * Dollar amounts and contract quantities refer only to the user's paper inputs.
 */

function finite(name, value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new TypeError(`${name} must be a finite number.`);
  }
  return value;
}

function bounded(name, value, min, max) {
  finite(name, value);
  if (value < min || value > max) {
    throw new RangeError(`${name} must be between ${min} and ${max}.`);
  }
  return value;
}

function nonnegative(name, value) {
  finite(name, value);
  if (value < 0) throw new RangeError(`${name} must be nonnegative.`);
  return value;
}

function positive(name, value) {
  finite(name, value);
  if (value <= 0) throw new RangeError(`${name} must be greater than zero.`);
  return value;
}

function count(name, value) {
  nonnegative(name, value);
  if (!Number.isSafeInteger(value)) {
    throw new RangeError(`${name} must be a nonnegative safe integer.`);
  }
  return value;
}

function checked(name, value) {
  if (!Number.isFinite(value)) {
    throw new RangeError(`${name} exceeds the supported numeric range.`);
  }
  return value;
}

/** P(H | E), given P(H), P(E | H), and P(E | not H). */
export function bayes(prior, likelihoodIfYes, likelihoodIfNo) {
  bounded('prior', prior, 0, 1);
  bounded('likelihoodIfYes', likelihoodIfYes, 0, 1);
  bounded('likelihoodIfNo', likelihoodIfNo, 0, 1);
  // Rescale likelihoods before multiplication so rare evidence does not
  // disappear merely because both likelihoods are extremely small.
  const scale = Math.max(likelihoodIfYes, likelihoodIfNo);
  if (scale === 0) {
    throw new RangeError('The supplied evidence has zero probability; the posterior is undefined.');
  }
  const yesMass = prior * (likelihoodIfYes / scale);
  const noMass = (1 - prior) * (likelihoodIfNo / scale);
  const evidenceMass = yesMass + noMass;
  if (evidenceMass === 0) {
    throw new RangeError('The supplied evidence has zero probability; the posterior is undefined.');
  }
  return yesMass / evidenceMass;
}

/** Mean squared probability error; binary outcomes must be exactly 0 or 1. */
export function brier(probabilities, outcomes) {
  if (!Array.isArray(probabilities) || !Array.isArray(outcomes)) {
    throw new TypeError('probabilities and outcomes must be arrays.');
  }
  if (probabilities.length === 0 || probabilities.length !== outcomes.length) {
    throw new RangeError('Use equally sized, nonempty probability and outcome arrays.');
  }
  let mean = 0;
  for (let index = 0; index < probabilities.length; index += 1) {
    const probability = probabilities[index];
    bounded(`probabilities[${index}]`, probability, 0, 1);
    const outcome = outcomes[index];
    finite(`outcomes[${index}]`, outcome);
    if (outcome !== 0 && outcome !== 1) {
      throw new RangeError(`outcomes[${index}] must be 0 or 1.`);
    }
    const squaredError = (probability - outcome) ** 2;
    // Incremental mean avoids overflowing a sum for a very long input array.
    mean += (squaredError - mean) / (index + 1);
  }
  return mean;
}

/**
 * A synthetic YES unit costs price + fee now and pays $1 for YES, $0 for NO.
 * fee is a fixed dollar cost per unit, charged regardless of outcome. It does
 * not represent a real venue fee schedule. Negative EV remains negative.
 */
export function binaryEV({ probability, price, fee, quantity }) {
  bounded('probability', probability, 0, 1);
  bounded('price', price, 0, 1);
  nonnegative('fee', fee);
  positive('quantity', quantity);
  const unitCost = checked('unitCost', price + fee);
  const evPerUnit = probability - unitCost;
  const totalCost = checked('totalCost', unitCost * quantity);
  const expectedPayout = checked('expectedPayout', probability * quantity);
  const netIfYes = checked('netIfYes', (1 - unitCost) * quantity);
  const netIfNo = -totalCost;
  return {
    evPerUnit,
    totalEV: checked('totalEV', evPerUnit * quantity),
    totalCost,
    expectedPayout,
    netIfYes,
    netIfNo,
    maxLoss: totalCost,
    breakEvenProbability: unitCost,
  };
}

/**
 * Walk a static synthetic YES ask book in ascending price order. Each level
 * is { price, quantity }. Return available partial fills without inventing
 * liquidity. There are no fees, queue effects, cancellations, or live orders.
 */
export function walkBook(levels, quantity) {
  if (!Array.isArray(levels)) throw new TypeError('levels must be an array.');
  nonnegative('quantity', quantity);
  let previousPrice = -Infinity;
  for (let index = 0; index < levels.length; index += 1) {
    const level = levels[index];
    if (!level || typeof level !== 'object' || Array.isArray(level)) {
      throw new TypeError(`levels[${index}] must be a price/quantity object.`);
    }
    bounded(`levels[${index}].price`, level.price, 0, 1);
    nonnegative(`levels[${index}].quantity`, level.quantity);
    if (level.price < previousPrice) {
      throw new RangeError('Ask levels must be in ascending price order.');
    }
    previousPrice = level.price;
  }
  let remaining = quantity;
  let filledQuantity = 0;
  let totalCost = 0;
  const fills = [];
  for (const level of levels) {
    if (remaining === 0) break;
    const filled = Math.min(remaining, level.quantity);
    if (filled === 0) continue;
    totalCost = checked('totalCost', totalCost + level.price * filled);
    filledQuantity = checked('filledQuantity', filledQuantity + filled);
    remaining = Math.max(0, remaining - filled);
    fills.push({ price: level.price, quantity: filled });
  }
  const bestPrice = fills.length ? fills[0].price : null;
  const averagePrice = filledQuantity > 0 ? totalCost / filledQuantity : null;
  return {
    requestedQuantity: quantity,
    filledQuantity,
    unfilledQuantity: remaining,
    totalCost,
    averagePrice,
    bestPrice,
    slippagePerUnit: averagePrice === null ? null : Math.max(0, averagePrice - bestPrice),
    complete: remaining === 0,
    fills,
  };
}

/** Fraction of starting paper capital lost after consecutive fractional losses. */
export function drawdown(riskFraction, lossCount) {
  bounded('riskFraction', riskFraction, 0, 1);
  count('lossCount', lossCount);
  if (lossCount === 0 || riskFraction === 0) return 0;
  if (riskFraction === 1) return 1;
  return -Math.expm1(lossCount * Math.log1p(-riskFraction));
}

/**
 * One synthetic linear LONG perpetual scenario, held without an early close.
 * movePct and maintenancePct are percentage points (e.g. -10 and 5).
 * Positive fundingBps is a cost; negative fundingBps is a receipt. Funding is
 * charged on INITIAL notional for each period at a constant synthetic rate.
 * Maintenance is a percentage of ENDING mark notional. The terminal check
 * cannot establish a real liquidation price or detect an earlier path breach.
 * Real obligations and any deficit treatment depend on the product and rules.
 */
export function perpStress({ collateral, leverage, movePct, fundingBps, periods, maintenancePct }) {
  positive('collateral', collateral);
  finite('leverage', leverage);
  if (leverage < 1) throw new RangeError('leverage must be at least 1.');
  finite('movePct', movePct);
  if (movePct < -100) throw new RangeError('A synthetic long underlying cannot fall below a -100% move.');
  finite('fundingBps', fundingBps);
  count('periods', periods);
  bounded('maintenancePct', maintenancePct, 0, 100);

  const initialNotional = checked('initialNotional', collateral * leverage);
  const pnl = checked('pnl', initialNotional * (movePct / 100));
  const currentNotional = checked('currentNotional', initialNotional * (1 + movePct / 100));
  const fundingCost = checked('fundingCost', initialNotional * (fundingBps / 10000) * periods);
  const netEquity = checked('netEquity', collateral + pnl - fundingCost);
  const maintenanceRequirement = checked('maintenanceRequirement', currentNotional * (maintenancePct / 100));
  const equityChangePct = checked('equityChangePct', ((netEquity - collateral) / collateral) * 100);
  return {
    initialNotional,
    currentNotional,
    pnl,
    fundingCost,
    netEquity,
    maintenanceRequirement,
    maintenanceBreach: netEquity <= maintenanceRequirement,
    mayOwe: netEquity < 0,
    hypotheticalDeficit: Math.max(0, -netEquity),
    equityChangePct,
  };
}
