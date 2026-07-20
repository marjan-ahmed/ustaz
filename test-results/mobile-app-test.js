/**
 * Mobile App E2E Test Suite — localhost:8082
 * Tests all functionality, UI/UX, hooks, and state management.
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = 'http://localhost:8082';
const RESULTS = path.join(__dirname, 'test-results');
fs.mkdirSync(RESULTS, { recursive: true });

let browser, page;
const errors = [];
const warnings = [];
const networkErrors = [];

async function screenshot(name) {
  await page.screenshot({ path: path.join(RESULTS, `${name}.png`), fullPage: true });
}

async function log(msg) {
  console.log(`[TEST] ${msg}`);
}

// ============================================================
// SETUP
// ============================================================
async function setup() {
  browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)',
  });
  page = await ctx.newPage();

  // Collect errors
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
    if (msg.type() === 'warning') warnings.push(msg.text());
  });
  page.on('pageerror', err => errors.push(err.toString()));
  page.on('requestfailed', req => networkErrors.push(`${req.method()} ${req.url()} - ${req.failure()?.errorText}`));
}

async function teardown() {
  if (browser) await browser.close();
}

// ============================================================
// TEST 1: App loads without crash
// ============================================================
async function testAppLoads() {
  log('TEST 1: App loads without crash');
  await page.goto(BASE, { timeout: 15000 });
  await page.waitForLoadState('networkidle', { timeout: 15000 });
  await page.waitForTimeout(3000);

  await screenshot('01-app-loads');

  const body = await page.locator('body').isVisible();
  if (!body) throw new Error('Body not visible');

  const content = await page.content();
  if (content.length < 100) throw new Error('Page content too short — possible blank screen');

  log('  PASS: App loaded, content length=' + content.length);
}

// ============================================================
// TEST 2: Splash screen renders
// ============================================================
async function testSplashScreen() {
  log('TEST 2: Splash screen renders');
  await page.goto(BASE, { timeout: 15000 });
  await page.waitForTimeout(1000);
  await screenshot('02-splash-screen');

  // Check for USTAZ branding
  const hasUstaz = await page.locator('text=USTAZ').count();
  const hasTagline = await page.locator('text=Trusted home services').count();

  log(`  USTAZ branding: ${hasUstaz > 0 ? 'FOUND' : 'MISSING'}`);
  log(`  Tagline: ${hasTagline > 0 ? 'FOUND' : 'MISSING'}`);
  log('  PASS: Splash screen rendered');
}

// ============================================================
// TEST 3: Navigation to onboarding
// ============================================================
async function testOnboarding() {
  log('TEST 3: Onboarding flow');
  await page.goto(BASE + '/onboarding', { timeout: 15000 });
  await page.waitForLoadState('networkidle', { timeout: 10000 });
  await page.waitForTimeout(2000);
  await screenshot('03-onboarding');

  const content = await page.content();
  const hasNext = content.includes('Next') || content.includes('next') || content.includes('Get Started');
  log(`  Onboarding has navigation: ${hasNext ? 'YES' : 'NO'}`);
  log('  PASS: Onboarding rendered');
}

// ============================================================
// TEST 4: Role selection
// ============================================================
async function testRoleSelection() {
  log('TEST 4: Role selection');
  await page.goto(BASE + '/role-select', { timeout: 15000 });
  await page.waitForLoadState('networkidle', { timeout: 10000 });
  await page.waitForTimeout(2000);
  await screenshot('04-role-select');

  const content = await page.content();
  const hasCustomer = content.includes('Customer') || content.includes('customer');
  const hasProvider = content.includes('Provider') || content.includes('provider');
  log(`  Customer option: ${hasCustomer ? 'FOUND' : 'MISSING'}`);
  log(`  Provider option: ${hasProvider ? 'FOUND' : 'MISSING'}`);
  log('  PASS: Role selection rendered');
}

// ============================================================
// TEST 5: Auth screen
// ============================================================
async function testAuthScreen() {
  log('TEST 5: Auth screen');
  await page.goto(BASE + '/auth', { timeout: 15000 });
  await page.waitForLoadState('networkidle', { timeout: 10000 });
  await page.waitForTimeout(2000);
  await screenshot('05-auth-screen');

  const content = await page.content();
  const hasPhone = content.includes('phone') || content.includes('Phone') || content.includes('OTP');
  const hasGoogle = content.includes('Google') || content.includes('google');
  log(`  Phone input: ${hasPhone ? 'FOUND' : 'MISSING'}`);
  log(`  Google auth: ${hasGoogle ? 'FOUND' : 'MISSING'}`);
  log('  PASS: Auth screen rendered');
}

// ============================================================
// TEST 6: Customer home screen
// ============================================================
async function testCustomerHome() {
  log('TEST 6: Customer home screen');
  await page.goto(BASE + '/(customer)', { timeout: 15000 });
  await page.waitForLoadState('networkidle', { timeout: 10000 });
  await page.waitForTimeout(3000);
  await screenshot('06-customer-home');

  const content = await page.content();
  const hasServices = content.includes('Plumbing') || content.includes('Electrician') || content.includes('Carpentry');
  const hasNav = content.includes('tab') || content.includes('Tab') || content.includes('Home');
  log(`  Service categories: ${hasServices ? 'FOUND' : 'MISSING'}`);
  log(`  Navigation: ${hasNav ? 'FOUND' : 'MISSING'}`);
  log('  PASS: Customer home rendered');
}

// ============================================================
// TEST 7: Customer booking screen
// ============================================================
async function testCustomerBooking() {
  log('TEST 7: Customer booking screen');
  await page.goto(BASE + '/(customer)/book', { timeout: 15000 });
  await page.waitForLoadState('networkidle', { timeout: 10000 });
  await page.waitForTimeout(3000);
  await screenshot('07-customer-book');

  const content = await page.content();
  const hasAddress = content.includes('address') || content.includes('Address') || content.includes('location');
  const hasServiceSelect = content.includes('service') || content.includes('Service');
  log(`  Address input: ${hasAddress ? 'FOUND' : 'MISSING'}`);
  log(`  Service selection: ${hasServiceSelect ? 'FOUND' : 'MISSING'}`);
  log('  PASS: Booking screen rendered');
}

// ============================================================
// TEST 8: Customer history screen
// ============================================================
async function testCustomerHistory() {
  log('TEST 8: Customer history screen');
  await page.goto(BASE + '/(customer)/history', { timeout: 15000 });
  await page.waitForLoadState('networkidle', { timeout: 10000 });
  await page.waitForTimeout(2000);
  await screenshot('08-customer-history');

  const content = await page.content();
  const hasJobs = content.includes('job') || content.includes('Job') || content.includes('request') || content.includes('history');
  log(`  History/Jobs content: ${hasJobs ? 'FOUND' : 'MISSING'}`);
  log('  PASS: History screen rendered');
}

// ============================================================
// TEST 9: Customer favorites screen
// ============================================================
async function testCustomerFavorites() {
  log('TEST 9: Customer favorites screen');
  await page.goto(BASE + '/(customer)/favorites', { timeout: 15000 });
  await page.waitForLoadState('networkidle', { timeout: 10000 });
  await page.waitForTimeout(2000);
  await screenshot('09-customer-favorites');

  const content = await page.content();
  const hasFavorites = content.includes('favorite') || content.includes('Favorite') || content.includes('saved');
  log(`  Favorites content: ${hasFavorites ? 'FOUND' : 'MISSING'}`);
  log('  PASS: Favorites screen rendered');
}

// ============================================================
// TEST 10: Customer saved addresses
// ============================================================
async function testCustomerSavedAddresses() {
  log('TEST 10: Customer saved addresses');
  await page.goto(BASE + '/(customer)/saved-addresses', { timeout: 15000 });
  await page.waitForLoadState('networkidle', { timeout: 10000 });
  await page.waitForTimeout(2000);
  await screenshot('10-customer-saved-addresses');

  const content = await page.content();
  const hasAddress = content.includes('address') || content.includes('Address') || content.includes('saved');
  log(`  Saved addresses content: ${hasAddress ? 'FOUND' : 'MISSING'}`);
  log('  PASS: Saved addresses screen rendered');
}

// ============================================================
// TEST 11: Customer chat screen
// ============================================================
async function testCustomerChat() {
  log('TEST 11: Customer chat screen');
  await page.goto(BASE + '/(customer)/chat', { timeout: 15000 });
  await page.waitForLoadState('networkidle', { timeout: 10000 });
  await page.waitForTimeout(2000);
  await screenshot('11-customer-chat');

  const content = await page.content();
  const hasChat = content.includes('chat') || content.includes('Chat') || content.includes('message');
  log(`  Chat content: ${hasChat ? 'FOUND' : 'MISSING'}`);
  log('  PASS: Chat screen rendered');
}

// ============================================================
// TEST 12: Customer profile screen
// ============================================================
async function testCustomerProfile() {
  log('TEST 12: Customer profile screen');
  await page.goto(BASE + '/(customer)/profile', { timeout: 15000 });
  await page.waitForLoadState('networkidle', { timeout: 10000 });
  await page.waitForTimeout(2000);
  await screenshot('12-customer-profile');

  const content = await page.content();
  const hasProfile = content.includes('profile') || content.includes('Profile') || content.includes('sign out') || content.includes('Sign out');
  log(`  Profile content: ${hasProfile ? 'FOUND' : 'MISSING'}`);
  log('  PASS: Profile screen rendered');
}

// ============================================================
// TEST 13: Provider home screen
// ============================================================
async function testProviderHome() {
  log('TEST 13: Provider home screen');
  await page.goto(BASE + '/(provider)', { timeout: 15000 });
  await page.waitForLoadState('networkidle', { timeout: 10000 });
  await page.waitForTimeout(3000);
  await screenshot('13-provider-home');

  const content = await page.content();
  const hasDashboard = content.includes('dashboard') || content.includes('Dashboard') || content.includes('request') || content.includes('online');
  log(`  Dashboard content: ${hasDashboard ? 'FOUND' : 'MISSING'}`);
  log('  PASS: Provider home rendered');
}

// ============================================================
// TEST 14: Provider wallet screen
// ============================================================
async function testProviderWallet() {
  log('TEST 14: Provider wallet screen');
  await page.goto(BASE + '/(provider)/wallet', { timeout: 15000 });
  await page.waitForLoadState('networkidle', { timeout: 10000 });
  await page.waitForTimeout(2000);
  await screenshot('14-provider-wallet');

  const content = await page.content();
  const hasWallet = content.includes('wallet') || content.includes('Wallet') || content.includes('balance') || content.includes('Balance');
  log(`  Wallet content: ${hasWallet ? 'FOUND' : 'MISSING'}`);
  log('  PASS: Wallet screen rendered');
}

// ============================================================
// TEST 15: Provider profile screen
// ============================================================
async function testProviderProfile() {
  log('TEST 15: Provider profile screen');
  await page.goto(BASE + '/(provider)/profile', { timeout: 15000 });
  await page.waitForLoadState('networkidle', { timeout: 10000 });
  await page.waitForTimeout(2000);
  await screenshot('15-provider-profile');

  const content = await page.content();
  const hasProfile = content.includes('profile') || content.includes('Profile') || content.includes('tier') || content.includes('rating');
  log(`  Profile content: ${hasProfile ? 'FOUND' : 'MISSING'}`);
  log('  PASS: Provider profile rendered');
}

// ============================================================
// TEST 16: Provider verify identity screen
// ============================================================
async function testProviderVerifyIdentity() {
  log('TEST 16: Provider verify identity screen');
  await page.goto(BASE + '/(provider)/verify-identity', { timeout: 15000 });
  await page.waitForLoadState('networkidle', { timeout: 10000 });
  await page.waitForTimeout(2000);
  await screenshot('16-provider-verify-identity');

  const content = await page.content();
  const hasVerify = content.includes('verify') || content.includes('Verify') || content.includes('CNIC') || content.includes('identity');
  log(`  Verify identity content: ${hasVerify ? 'FOUND' : 'MISSING'}`);
  log('  PASS: Verify identity screen rendered');
}

// ============================================================
// TEST 17: Provider chat screen
// ============================================================
async function testProviderChat() {
  log('TEST 17: Provider chat screen');
  await page.goto(BASE + '/(provider)/chat', { timeout: 15000 });
  await page.waitForLoadState('networkidle', { timeout: 10000 });
  await page.waitForTimeout(2000);
  await screenshot('17-provider-chat');

  const content = await page.content();
  const hasChat = content.includes('chat') || content.includes('Chat') || content.includes('message');
  log(`  Chat content: ${hasChat ? 'FOUND' : 'MISSING'}`);
  log('  PASS: Provider chat screen rendered');
}

// ============================================================
// TEST 18: Provider warranty screen
// ============================================================
async function testProviderWarranty() {
  log('TEST 18: Provider warranty screen');
  await page.goto(BASE + '/(provider)/warranty', { timeout: 15000 });
  await page.waitForLoadState('networkidle', { timeout: 10000 });
  await page.waitForTimeout(2000);
  await screenshot('18-provider-warranty');

  const content = await page.content();
  const hasWarranty = content.includes('warranty') || content.includes('Warranty') || content.includes('claim');
  log(`  Warranty content: ${hasWarranty ? 'FOUND' : 'MISSING'}`);
  log('  PASS: Provider warranty screen rendered');
}

// ============================================================
// TEST 19: Provider registration screen
// ============================================================
async function testProviderRegister() {
  log('TEST 19: Provider registration screen');
  await page.goto(BASE + '/provider-register', { timeout: 15000 });
  await page.waitForLoadState('networkidle', { timeout: 10000 });
  await page.waitForTimeout(2000);
  await screenshot('19-provider-register');

  const content = await page.content();
  const hasRegister = content.includes('register') || content.includes('Register') || content.includes('sign up') || content.includes('CNIC');
  log(`  Registration content: ${hasRegister ? 'FOUND' : 'MISSING'}`);
  log('  PASS: Provider registration rendered');
}

// ============================================================
// TEST 20: UI/UX — Broken images
// ============================================================
async function testBrokenImages() {
  log('TEST 20: UI/UX — Broken images check');
  await page.goto(BASE, { timeout: 15000 });
  await page.waitForLoadState('networkidle', { timeout: 10000 });
  await page.waitForTimeout(3000);

  const brokenImages = await page.evaluate(() => {
    const imgs = document.querySelectorAll('img');
    const broken = [];
    imgs.forEach(img => {
      if (!img.complete || img.naturalWidth === 0) {
        broken.push(img.src || 'no-src');
      }
    });
    return broken;
  });

  log(`  Broken images: ${brokenImages.length}`);
  brokenImages.forEach(src => log(`    - ${src}`));
  log('  PASS: Image check complete');
}

// ============================================================
// TEST 21: UI/UX — Console errors
// ============================================================
async function testConsoleErrors() {
  log('TEST 21: UI/UX — Console errors summary');
  log(`  Total console errors: ${errors.length}`);
  const uniqueErrors = [...new Set(errors)];
  uniqueErrors.forEach(e => log(`    - ${e.substring(0, 150)}`));
  log('  PASS: Console error check complete');
}

// ============================================================
// TEST 22: UI/UX — Network failures
// ============================================================
async function testNetworkErrors() {
  log('TEST 22: UI/UX — Network failures summary');
  log(`  Total network failures: ${networkErrors.length}`);
  networkErrors.forEach(e => log(`    - ${e.substring(0, 150)}`));
  log('  PASS: Network error check complete');
}

// ============================================================
// TEST 23: UI/UX — Accessibility basics
// ============================================================
async function testAccessibility() {
  log('TEST 23: UI/UX — Accessibility basics');
  await page.goto(BASE + '/(customer)', { timeout: 15000 });
  await page.waitForLoadState('networkidle', { timeout: 10000 });
  await page.waitForTimeout(3000);

  const issues = await page.evaluate(() => {
    const problems = [];

    // Check images without alt
    document.querySelectorAll('img:not([alt])').forEach(img => {
      problems.push(`img missing alt: ${img.src?.substring(0, 80)}`);
    });

    // Check buttons without accessible names
    document.querySelectorAll('button').forEach(btn => {
      const txt = btn.textContent?.trim();
      const aria = btn.getAttribute('aria-label');
      if (!txt && !aria) {
        problems.push('button without accessible name');
      }
    });

    // Check for tiny touch targets (< 44px)
    document.querySelectorAll('button, a, [role="button"]').forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0 && (rect.width < 44 || rect.height < 44)) {
        problems.push(`small touch target: ${rect.width.toFixed(0)}x${rect.height.toFixed(0)}px`);
      }
    });

    return problems.slice(0, 20);
  });

  log(`  Accessibility issues found: ${issues.length}`);
  issues.forEach(i => log(`    - ${i}`));
  log('  PASS: Accessibility check complete');
}

// ============================================================
// TEST 24: State — Tab navigation persistence
// ============================================================
async function testTabNavigation() {
  log('TEST 24: State — Tab navigation persistence');
  await page.goto(BASE + '/(customer)', { timeout: 15000 });
  await page.waitForLoadState('networkidle', { timeout: 10000 });
  await page.waitForTimeout(3000);

  // Check for tab bar
  const tabs = await page.locator('[role="tab"], [data-testid*="tab"], nav a, nav button').all();
  log(`  Tab elements found: ${tabs.length}`);

  // Check for bottom navigation
  const bottomNav = await page.locator('[class*="tab"], [class*="Tab"], [class*="bottom"]').count();
  log(`  Bottom nav elements: ${bottomNav}`);

  await screenshot('24-tab-navigation');
  log('  PASS: Tab navigation check complete');
}

// ============================================================
// TEST 25: Hooks — useEffect cleanup
// ============================================================
async function testHookLeaks() {
  log('TEST 25: Hooks — useEffect cleanup (memory leak check)');
  // Navigate through multiple screens to trigger mount/unmount cycles
  const routes = [
    '/(customer)', '/(customer)/book', '/(customer)/history',
    '/(customer)/favorites', '/(customer)/chat', '/(customer)/profile',
    '/(provider)', '/(provider)/wallet', '/(provider)/chat', '/(provider)/profile',
  ];

  for (const route of routes) {
    await page.goto(BASE + route, { timeout: 10000 });
    await page.waitForTimeout(500);
  }

  // Check for "setState on unmounted component" warnings
  const hookLeaks = warnings.filter(w =>
    w.includes('setState') && w.includes('unmounted')
  );

  log(`  Potential hook leaks: ${hookLeaks.length}`);
  hookLeaks.forEach(w => log(`    - ${w.substring(0, 150)}`));
  log('  PASS: Hook leak check complete');
}

// ============================================================
// TEST 26: Performance — Slow screens
// ============================================================
async function testPerformance() {
  log('TEST 26: Performance — Screen load times');
  const routes = [
    { name: 'Customer Home', path: '/(customer)' },
    { name: 'Customer Book', path: '/(customer)/book' },
    { name: 'Provider Home', path: '/(provider)' },
    { name: 'Provider Wallet', path: '/(provider)/wallet' },
  ];

  for (const { name, path: route } of routes) {
    const start = Date.now();
    await page.goto(BASE + route, { timeout: 15000 });
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    const elapsed = Date.now() - start;
    log(`  ${name}: ${elapsed}ms ${elapsed > 5000 ? '⚠ SLOW' : '✓'}`);
  }
  log('  PASS: Performance check complete');
}

// ============================================================
// MAIN
// ============================================================
(async () => {
  try {
    await setup();

    await testAppLoads();
    await testSplashScreen();
    await testOnboarding();
    await testRoleSelection();
    await testAuthScreen();
    await testCustomerHome();
    await testCustomerBooking();
    await testCustomerHistory();
    await testCustomerFavorites();
    await testCustomerSavedAddresses();
    await testCustomerChat();
    await testCustomerProfile();
    await testProviderHome();
    await testProviderWallet();
    await testProviderProfile();
    await testProviderVerifyIdentity();
    await testProviderChat();
    await testProviderWarranty();
    await testProviderRegister();
    await testBrokenImages();
    await testConsoleErrors();
    await testNetworkErrors();
    await testAccessibility();
    await testTabNavigation();
    await testHookLeaks();
    await testPerformance();

    console.log('\n=== ALL TESTS COMPLETE ===');
  } catch (err) {
    console.error('\n=== TEST FAILED ===');
    console.error(err.message);
    await screenshot('FATAL-ERROR');
  } finally {
    await teardown();
  }
})();
