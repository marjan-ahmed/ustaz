from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(
        viewport={"width": 390, "height": 844},
        device_scale_factor=2,
        is_mobile=True,
        has_touch=True
    )
    page = context.new_page()
    
    page.goto("http://127.0.0.1:3002", wait_until="domcontentloaded", timeout=30000)
    page.wait_for_timeout(5000)
    
    page.screenshot(path="E:/nextjs-projects/ustaz/mobile-closed.png", full_page=False)
    
    hamburger = page.locator(".sm-toggle")
    if hamburger.count() > 0:
        hamburger.click()
        page.wait_for_timeout(2000)
        page.screenshot(path="E:/nextjs-projects/ustaz/mobile-open.png", full_page=False)
    
    print("Done!")
    browser.close()
