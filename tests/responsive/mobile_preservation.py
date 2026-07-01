from playwright.sync_api import expect, sync_playwright

from utils import BASE_URL, ensure_logged_in, expect_mobile_shell, visible_count


ROUTES = ["/dashboard", "/presence", "/presence/requests", "/office", "/employee"]


with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 390, "height": 844})
    ensure_logged_in(page)

    for route in ROUTES:
        page.goto(f"{BASE_URL}{route}")
        page.wait_for_load_state("networkidle")
        expect_mobile_shell(page)
        assert visible_count(page, "table") == 0, "desktop table is visible on mobile"

    browser.close()
