const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await page.goto('http://localhost:8082/', { timeout: 30000 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'test-results/splash-check.png' });
  await browser.close();
  console.log('Done');
})();
