/** Deep inspection: screenshot each screen and dump visible text */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = 'http://localhost:8082';
const R = path.join(__dirname, 'test-results');
fs.mkdirSync(R, { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();

  const screens = [
    { name: 'splash', route: '/' },
    { name: 'onboarding', route: '/onboarding' },
    { name: 'role-select', route: '/role-select' },
    { name: 'auth', route: '/auth' },
    { name: 'cust-home', route: '/(customer)' },
    { name: 'cust-book', route: '/(customer)/book' },
    { name: 'cust-history', route: '/(customer)/history' },
    { name: 'cust-favorites', route: '/(customer)/favorites' },
    { name: 'cust-saved-addr', route: '/(customer)/saved-addresses' },
    { name: 'cust-chat', route: '/(customer)/chat' },
    { name: 'cust-profile', route: '/(customer)/profile' },
    { name: 'prov-home', route: '/(provider)' },
    { name: 'prov-wallet', route: '/(provider)/wallet' },
    { name: 'prov-profile', route: '/(provider)/profile' },
    { name: 'prov-verify', route: '/(provider)/verify-identity' },
    { name: 'prov-chat', route: '/(provider)/chat' },
    { name: 'prov-warranty', route: '/(provider)/warranty' },
    { name: 'prov-register', route: '/provider-register' },
  ];

  for (const { name, route } of screens) {
    await page.goto(BASE + route, { timeout: 15000 });
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    await page.waitForTimeout(2500);
    await page.screenshot({ path: path.join(R, `deep-${name}.png`), fullPage: true });

    // Dump visible text
    const texts = await page.evaluate(() => {
      const walk = (el, depth = 0) => {
        if (depth > 6) return [];
        const result = [];
        for (const child of el.childNodes) {
          if (child.nodeType === 3) {
            const t = child.textContent?.trim();
            if (t && t.length > 1 && t.length < 100) result.push(t);
          } else if (child.nodeType === 1) {
            const tag = child.tagName.toLowerCase();
            if (['script', 'style', 'noscript'].includes(tag)) continue;
            result.push(...walk(child, depth + 1));
          }
        }
        return result;
      };
      return [...new Set(walk(document.body))];
    });

    fs.writeFileSync(path.join(R, `deep-${name}-texts.txt`), texts.join('\n'), 'utf-8');
    console.log(`${name}: ${texts.length} texts, URL=${page.url()}`);
  }

  await browser.close();
  console.log('Done');
})();
