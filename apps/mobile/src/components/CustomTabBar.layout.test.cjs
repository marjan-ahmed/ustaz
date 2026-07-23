const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');

const { getPillTranslateX } = require(path.join(__dirname, 'CustomTabBar.layout.cjs'));

test('tab pill centers inside the padded tab content width', () => {
  const barWidth = 390;
  const tabCount = 5;
  const pillSize = 46;
  const paddingHorizontal = 4;

  assert.equal(getPillTranslateX({ barWidth, tabCount, activeIndex: 0, pillSize, paddingHorizontal }), 19.200000000000003);
  assert.equal(getPillTranslateX({ barWidth, tabCount, activeIndex: 2, pillSize, paddingHorizontal }), 172);
  assert.equal(getPillTranslateX({ barWidth, tabCount, activeIndex: 4, pillSize, paddingHorizontal }), 324.8);
});