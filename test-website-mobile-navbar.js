const { chromium } = require("playwright");

const url = process.env.WEBSITE_URL || "http://127.0.0.1:3001";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();

  try {
    await page.goto(url, { waitUntil: "commit", timeout: 120000 });
    await page.waitForSelector(".sm-toggle", { timeout: 10000 });
    await page.waitForTimeout(500);

    const closed = await page.evaluate(() => {
      const toggle = document.querySelector(".sm-toggle");
      const logo = document.querySelector("header img");
      if (!toggle || !logo) return null;

      const toggleRect = toggle.getBoundingClientRect();
      const logoRect = logo.getBoundingClientRect();

      return {
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
        toggle: {
          left: toggleRect.left,
          right: toggleRect.right,
          top: toggleRect.top,
          bottom: toggleRect.bottom,
        },
        logo: {
          top: logoRect.top,
          bottom: logoRect.bottom,
        },
      };
    });

    assert(closed, "Mobile navbar elements were not found");
    assert(
      closed.scrollWidth <= closed.clientWidth,
      `Mobile navbar creates horizontal overflow: ${closed.scrollWidth}px > ${closed.clientWidth}px`
    );
    assert(
      closed.toggle.left >= 0 && closed.toggle.right <= closed.clientWidth,
      `Mobile menu toggle is outside the viewport: left=${closed.toggle.left}, right=${closed.toggle.right}, viewport=${closed.clientWidth}`
    );
    assert(
      closed.logo.top >= 0,
      `Mobile logo is clipped above the header: top=${closed.logo.top}`
    );

    await page.locator(".sm-toggle").click();
    await page.waitForTimeout(900);

    const open = await page.evaluate(() => {
      const panel = document.querySelector(".staggered-menu-panel");
      if (!panel) return null;

      const rect = panel.getBoundingClientRect();
      return {
        clientWidth: document.documentElement.clientWidth,
        ariaHidden: panel.getAttribute("aria-hidden"),
        panel: {
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          width: Math.round(rect.width),
        },
      };
    });

    assert(open, "Mobile menu panel was not found");
    assert(open.ariaHidden === "false", "Mobile menu panel did not open");
    assert(
      open.panel.left <= 1 && open.panel.right >= open.clientWidth - 1,
      `Open mobile menu panel does not cover viewport: left=${open.panel.left}, right=${open.panel.right}, viewport=${open.clientWidth}`
    );

    console.log("Mobile navbar layout passed");
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
