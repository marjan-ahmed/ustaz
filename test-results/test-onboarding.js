const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', err => errors.push(err.toString()));
  await page.goto('http://localhost:8082/onboarding', { timeout: 30000 });
  await page.waitForLoadState('networkidle', { timeout: 15000 });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'test-results/new-onboarding.png', full_page: true });
  console.log('Errors:', errors.length);
  errors.forEach(e => console.log(' -', e.substring(0, 200)));
  const text = await page.evaluate(() => document.body.innerText);
  console.log('Text:', text.substring(0, 500));
  await browser.close();
})();
