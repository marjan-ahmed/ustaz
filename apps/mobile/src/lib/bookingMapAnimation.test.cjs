const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');

const { getNextProviderSearchRadius } = require(path.join(__dirname, 'bookingMapAnimation.cjs'));

test('provider search radius matches the web sawtooth circle animation', () => {
  assert.equal(getNextProviderSearchRadius(0), 2);
  assert.equal(getNextProviderSearchRadius(198), 200);
  assert.equal(getNextProviderSearchRadius(200), 50);
  assert.equal(getNextProviderSearchRadius(250), 50);
});
