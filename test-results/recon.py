"""Reconnaissance: screenshot + DOM inspection of the mobile app."""
from playwright.sync_api import sync_playwright
import json, os

os.makedirs("test-results", exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 390, "height": 844})  # iPhone 14 size

    # Collect console errors
    errors = []
    page.on("console", lambda msg: errors.append(msg.text) if msg.type == "error" else None)
    page.on("pageerror", lambda err: errors.append(str(err)))

    # 1. Load the app
    print("=== Loading app ===")
    page.goto("http://localhost:8082/", timeout=15000)
    page.wait_for_load_state("networkidle", timeout=15000)
    page.wait_for_timeout(3000)  # Let React Native web render

    # Screenshot
    page.screenshot(path="test-results/01-initial-load.png", full_page=True)
    print(f"URL: {page.url}")
    print(f"Title: {page.title()}")

    # Get page content structure
    content = page.content()
    with open("test-results/page-content.html", "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Page HTML length: {len(content)}")

    # Find all visible text elements
    texts = page.locator("text=*").all()
    visible_texts = []
    for t in texts[:50]:
        try:
            if t.is_visible():
                txt = t.inner_text()
                if txt.strip():
                    visible_texts.append(txt.strip()[:80])
        except:
            pass
    print(f"\n=== Visible texts (first 50) ===")
    for vt in visible_texts:
        print(f"  - {vt}")

    # Find all buttons
    buttons = page.locator("button, [role='button'], a[href]").all()
    print(f"\n=== Interactive elements: {len(buttons)} ===")
    for b in buttons[:30]:
        try:
            if b.is_visible():
                tag = b.evaluate("el => el.tagName")
                txt = b.inner_text()[:60] if b.inner_text() else ""
                href = b.get_attribute("href") or ""
                print(f"  [{tag}] {txt} {href}")
        except:
            pass

    # Check for images
    images = page.locator("img").all()
    print(f"\n=== Images: {len(images)} ===")
    for img in images[:10]:
        try:
            src = img.get_attribute("src") or "no-src"
            alt = img.get_attribute("alt") or "no-alt"
            print(f"  img: src={src[:80]} alt={alt}")
        except:
            pass

    # Console errors
    print(f"\n=== Console errors: {len(errors)} ===")
    for e in errors[:20]:
        print(f"  ERROR: {e[:200]}")

    # Take screenshots of different viewports
    page.set_viewport_size({"width": 390, "height": 844})
    page.wait_for_timeout(500)
    page.screenshot(path="test-results/02-iphone-size.png", full_page=True)

    browser.close()
    print("\n=== Reconnaissance complete ===")
