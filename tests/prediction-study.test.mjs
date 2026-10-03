import test from 'node:test';
import assert from 'node:assert/strict';
import { bayes, brier, binaryEV, walkBook, drawdown, perpStress } from '../src/lib/prediction-study.mjs';

const close = (actual, expected, tolerance = 1e-12) => {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} should equal ${expected}`);
};

test('Bayes includes the base rate, endpoints, and very rare evidence', () => {
  close(bayes(0.2, 0.8, 0.1), 2 / 3);
  assert.equal(bayes(0, 0.8, 0.1), 0);
  assert.equal(bayes(1, 0.8, 0.1), 1);
  assert.equal(bayes(0.01, 1e-300, 0), 1);
  close(bayes(0.2, 8e-300, 1e-300), 2 / 3);
});

test('Bayes rejects impossible evidence and invalid probabilities', () => {
  assert.throws(() => bayes(0.5, 0, 0), /zero probability/);
  assert.throws(() => bayes(0, 1, 0), /zero probability/);
  assert.throws(() => bayes(1, 0, 1), /zero probability/);
  for (const invalid of [NaN, Infinity, -Infinity, '0.5', null]) {
    assert.throws(() => bayes(invalid, 0.8, 0.1), TypeError);
  }
  assert.throws(() => bayes(-0.01, 0.8, 0.1), RangeError);
  assert.throws(() => bayes(0.2, 1.01, 0.1), RangeError);
});

test('Brier scores perfect, fully wrong, and mixed probability forecasts', () => {
  assert.equal(brier([0, 1], [0, 1]), 0);
  assert.equal(brier([1, 0], [0, 1]), 1);
  assert.equal(brier([0.5, 0.5], [0, 1]), 0.25);
  close(brier([0.7, 0.2, 0.6, 0.8], [1, 0, 1, 0]), 0.2325);
});

test('Brier rejects missing observations and nonbinary outcomes', () => {
  assert.throws(() => brier([], []), RangeError);
  assert.throws(() => brier([0.5], [0, 1]), RangeError);
  assert.throws(() => brier([0.5], [0.2]), RangeError);
  assert.throws(() => brier([0.5], [true]), TypeError);
  assert.throws(() => brier([NaN], [0]), TypeError);
  assert.throws(() => brier(Array(1), [0]), TypeError);
  assert.throws(() => brier([0.5], Array(1)), TypeError);
});

test('Binary EV accounts for the outcome-independent fee and quantity', () => {
  const result = binaryEV({ probability: 0.62, price: 0.55, fee: 0.02, quantity: 20 });
  close(result.totalCost, 11.4);
  close(result.expectedPayout, 12.4);
  close(result.evPerUnit, 0.05);
  close(result.totalEV, 1);
  close(result.netIfYes, 8.6);
  close(result.netIfNo, -11.4);
  close(result.maxLoss, 11.4);
  close(result.breakEvenProbability, 0.57);
});

test('Fees can wipe out an apparent edge or make break-even impossible', () => {
  close(binaryEV({ probability: 0.56, price: 0.55, fee: 0.02, quantity: 100 }).totalEV, -1);
  const impossible = binaryEV({ probability: 1, price: 0.99, fee: 0.02, quantity: 1 });
  close(impossible.breakEvenProbability, 1.01);
  close(impossible.totalEV, -0.01);
  assert.equal(binaryEV({ probability: 0, price: 0, fee: 0, quantity: 1 }).totalEV, 0);
  assert.equal(binaryEV({ probability: 1, price: 1, fee: 0, quantity: 1 }).totalEV, 0);
});

test('Binary EV validates ranges and catches numeric overflow', () => {
  assert.throws(() => binaryEV({ probability: 0.5, price: -1, fee: 0, quantity: 1 }), RangeError);
  assert.throws(() => binaryEV({ probability: 0.5, price: 0.5, fee: -0.01, quantity: 1 }), RangeError);
  assert.throws(() => binaryEV({ probability: 0.5, price: 0.5, fee: 0, quantity: 0 }), RangeError);
  assert.throws(() => binaryEV({ probability: NaN, price: 0.5, fee: 0, quantity: 1 }), TypeError);
  assert.throws(() => binaryEV({ probability: 0.5, price: 0.5, fee: Number.MAX_VALUE, quantity: 2 }), /numeric range/);
});

test('Walking synthetic depth produces the weighted execution price', () => {
  const levels = [{ price: 0.54, quantity: 10 }, { price: 0.56, quantity: 20 }, { price: 0.6, quantity: 10 }];
  const result = walkBook(levels, 25);
  assert.equal(result.complete, true);
  assert.equal(result.filledQuantity, 25);
  assert.equal(result.unfilledQuantity, 0);
  close(result.totalCost, 13.8);
  close(result.averagePrice, 0.552);
  close(result.slippagePerUnit, 0.012);
  assert.deepEqual(result.fills, [{ price: 0.54, quantity: 10 }, { price: 0.56, quantity: 15 }]);
  assert.equal(levels[1].quantity, 20, 'input book is not mutated');
});

test('An incomplete book returns actual partial depth rather than a fictional fill', () => {
  const result = walkBook([{ price: 0.54, quantity: 10 }, { price: 0.56, quantity: 20 }], 50);
  assert.equal(result.complete, false);
  assert.equal(result.filledQuantity, 30);
  assert.equal(result.unfilledQuantity, 20);
  close(result.totalCost, 16.6);
  close(result.averagePrice, 16.6 / 30);
  assert.deepEqual(walkBook([], 3), {
    requestedQuantity: 3, filledQuantity: 0, unfilledQuantity: 3, totalCost: 0,
    averagePrice: null, bestPrice: null, slippagePerUnit: null, complete: false, fills: [],
  });
  assert.equal(walkBook([], 0).complete, true);
  assert.equal(walkBook([{ price: 0.4, quantity: 0 }], 1).averagePrice, null);
});

test('Book validation rejects unsorted, missing, negative, and nonfinite levels', () => {
  assert.throws(() => walkBook([{ price: 0.6, quantity: 1 }, { price: 0.5, quantity: 1 }], 1), /ascending/);
  assert.throws(() => walkBook([{ price: 1.01, quantity: 1 }], 1), RangeError);
  assert.throws(() => walkBook([{ price: 0.5, quantity: -1 }], 1), RangeError);
  assert.throws(() => walkBook([{ price: 0.5, quantity: Infinity }], 1), TypeError);
  assert.throws(() => walkBook(Array(1), 1), TypeError);
  assert.throws(() => walkBook([], -1), RangeError);
});

test('Consecutive fractional losses compound rather than add', () => {
  close(drawdown(0.1, 5), 0.40951);
  assert.equal(drawdown(0, 100), 0);
  assert.equal(drawdown(1, 0), 0);
  assert.equal(drawdown(1, 1), 1);
  assert.equal(drawdown(0.01, 10000), 1);
  close(drawdown(1e-12, 1), 1e-12, 1e-24);
});

test('Drawdown rejects invalid risk fractions and noninteger counts', () => {
  assert.throws(() => drawdown(1.01, 1), RangeError);
  assert.throws(() => drawdown(0.1, -1), RangeError);
  assert.throws(() => drawdown(0.1, 1.5), RangeError);
  assert.throws(() => drawdown(0.1, Number.MAX_SAFE_INTEGER + 1), RangeError);
  assert.throws(() => drawdown(0.1, Infinity), TypeError);
});

const stress = (overrides = {}) => perpStress({
  collateral: 1000, leverage: 6.1, movePct: -10, fundingBps: 10,
  periods: 3, maintenancePct: 5, ...overrides,
});

test('Perpetual stress preserves equity arithmetic and maintenance on ending notional', () => {
  const result = stress();
  close(result.initialNotional, 6100);
  close(result.currentNotional, 5490);
  close(result.pnl, -610);
  close(result.fundingCost, 18.3);
  close(result.netEquity, 371.7);
  close(result.maintenanceRequirement, 274.5);
  close(result.equityChangePct, -62.83);
  assert.equal(result.maintenanceBreach, false);
  assert.equal(result.mayOwe, false);
});

test('Maintenance can be breached while equity remains positive', () => {
  const result = stress({ movePct: -12 });
  close(result.netEquity, 249.7);
  close(result.maintenanceRequirement, 268.4);
  assert.equal(result.maintenanceBreach, true);
  assert.equal(result.mayOwe, false);
  const boundary = stress({ collateral: 100, leverage: 1, movePct: 0, fundingBps: 0, periods: 0, maintenancePct: 100 });
  assert.equal(boundary.maintenanceBreach, true, 'at the maintenance threshold is a breach in this model');
});

test('A synthetic terminal gap may lose more than posted collateral', () => {
  const result = stress({ movePct: -20 });
  close(result.netEquity, -238.3);
  close(result.hypotheticalDeficit, 238.3);
  assert.equal(result.maintenanceBreach, true);
  assert.equal(result.mayOwe, true);
  close(stress({ movePct: -100, fundingBps: 0 }).currentNotional, 0);
});

test('Funding can be paid, received, or zero and is charged on initial notional', () => {
  close(stress({ movePct: 0, fundingBps: -10 }).netEquity, 1018.3);
  close(stress({ movePct: 0, periods: 0 }).netEquity, 1000);
  close(stress({ movePct: 10 }).netEquity, 1591.7);
});

test('Perpetual stress rejects invalid units, counts, and overflowing arithmetic', () => {
  assert.throws(() => stress({ collateral: 0 }), RangeError);
  assert.throws(() => stress({ leverage: 0.5 }), RangeError);
  assert.throws(() => stress({ movePct: -100.01 }), RangeError);
  assert.throws(() => stress({ maintenancePct: 101 }), RangeError);
  assert.throws(() => stress({ periods: 1.5 }), RangeError);
  assert.throws(() => stress({ fundingBps: NaN }), TypeError);
  assert.throws(() => stress({ collateral: Number.MAX_VALUE, leverage: 2 }), /numeric range/);
});
