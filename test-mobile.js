const { chromium } = require('playwright');
const http = require('http');

function fetchPage() {
  return new Promise((resolve, reject) => {
    const req = http.get('http://127.0.0.1:3002', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.setTimeout(120000, () => req.destroy());
  });
}

(async () => {
  console.log('Warming up server (first compile may take a while)...');
  for (let i = 0; i < 30; i++) {
    try {
      const html = await fetchPage();
      if (html && html.length > 100) {
        console.log('Server warm, got', html.length, 'bytes');
        break;
      }
    } catch(e) {
      console.log('Attempt', i + 1, 'failed, retrying...');
      await new Promise(r => setTimeout(r, 3000));
    }
  }
  
  const browser = await chromium.launch({ 
    headless: true,
    channel: 'chrome',
    args: ['--no-sandbox']
  });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true
  });
  const page = await context.newPage();
  
  console.log('Navigating...');
  await page.goto('http://127.0.0.1:3002', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(3000);
  
  await page.screenshot({ path: 'E:/nextjs-projects/ustaz/mobile-closed.png', fullPage: false });
  console.log('Closed state captured');
  
  const hamburger = page.locator('.sm-toggle');
  const count = await hamburger.count();
  console.log('Hamburger count:', count);
  
  if (count > 0) {
    await hamburger.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'E:/nextjs-projects/ustaz/mobile-open.png', fullPage: false });
    console.log('Open state captured');
  } else {
    const html = await page.content();
    console.log('HTML:', html.substring(0, 500));
  }
  
  await browser.close();
  console.log('Done!');
})();
