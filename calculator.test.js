const { test } = require('node:test');
const assert = require('node:assert/strict');
const { calculatePool } = require('./calculator.js');

test('requested default pool quantities', () => {
  const result = calculatePool(6, 3.5, 1, 1.6);
  assert.equal(result.averageDepth, 1.3);
  assert.ok(Math.abs(result.volume - 27.3) < 1e-10);
  assert.ok(Math.abs(result.floor - 21.10473880435387) < 1e-10);
  assert.equal(result.walls, 24.7);
  assert.ok(Math.abs(result.total - 45.80473880435387) < 1e-10);
});

test('sloped rectangular pool quantities', () => {
  const result = calculatePool(10, 5, 1, 2);
  assert.equal(result.volume, 75);
  assert.equal(result.liters, 75000);
  assert.ok(Math.abs(result.floor - 50.24937810560445) < 1e-10);
  assert.equal(result.walls, 45);
  assert.ok(Math.abs(result.total - 95.24937810560445) < 1e-10);
});

test('flat floor and decimal dimensions', () => {
  const result = calculatePool(2.5, 2, 1.2, 1.2);
  assert.equal(result.volume, 6);
  assert.equal(result.floor, 5);
  assert.ok(Math.abs(result.walls - 10.8) < 1e-10);
});

test('rejects invalid dimensions and reversed depths', () => {
  for (const value of [0, -1, NaN, Infinity]) {
    assert.throws(() => calculatePool(value, 5, 1, 2));
  }
  assert.throws(() => calculatePool(10, 5, 2, 1));
  assert.throws(() => calculatePool(1e308, 5, 1, 2));
});
