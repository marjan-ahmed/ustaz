/** Get actual rendered HTML content from auth screen */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = 'http://localhost:8082';
const R = path.join(__dirname, 'test-results');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();

  // 1. Auth screen
  await page.goto(BASE + '/auth', { timeout: 15000 });
  await page.waitForLoadState('networkidle', { timeout: 10000 });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(R, 'auth-detail.png'), fullPage: true });

  // Get innerHTML
  const authHtml = await page.evaluate(() => document.body.innerHTML);
  fs.writeFileSync(path.join(R, 'auth-body.html'), authHtml, 'utf-8');

  // Get all text content via innerText
  const authText = await page.evaluate(() => document.body.innerText);
  fs.writeFileSync(path.join(R, 'auth-innerText.txt'), authText, 'utf-8');
  console.log('Auth innerText length:', authText.length);
  console.log('Auth innerText preview:', authText.substring(0, 500));

  // 2. Onboarding
  await page.goto(BASE + '/onboarding', { timeout: 15000 });
  await page.waitForLoadState('networkidle', { timeout: 10000 });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(R, 'onboarding-detail.png'), fullPage: true });

  const onbText = await page.evaluate(() => document.body.innerText);
  fs.writeFileSync(path.join(R, 'onboarding-innerText.txt'), onbText, 'utf-8');
  console.log('\nOnboarding innerText length:', onbText.length);
  console.log('Onboarding innerText preview:', onbText.substring(0, 500));

  // 3. Role select
  await page.goto(BASE + '/role-select', { timeout: 15000 });
  await page.waitForLoadState('networkidle', { timeout: 10000 });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(R, 'role-select-detail.png'), fullPage: true });

  const roleText = await page.evaluate(() => document.body.innerText);
  fs.writeFileSync(path.join(R, 'role-select-innerText.txt'), roleText, 'utf-8');
  console.log('\nRole-select innerText length:', roleText.length);
  console.log('Role-select innerText preview:', roleText.substring(0, 500));

  // 4. Provider register
  await page.goto(BASE + '/provider-register', { timeout: 15000 });
  await page.waitForLoadState('networkidle', { timeout: 10000 });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(R, 'prov-register-detail.png'), fullPage: true });

  const regText = await page.evaluate(() => document.body.innerText);
  fs.writeFileSync(path.join(R, 'prov-register-innerText.txt'), regText, 'utf-8');
  console.log('\nProvider-register innerText length:', regText.length);
  console.log('Provider-register innerText preview:', regText.substring(0, 500));

  await browser.close();
  console.log('\nDone');
})();
