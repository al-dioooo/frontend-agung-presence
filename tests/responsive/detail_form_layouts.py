from playwright.sync_api import expect, sync_playwright

from utils import BASE_URL, ensure_logged_in, expect_desktop_shell


with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1280, "height": 800})
    ensure_logged_in(page)

    for route in ["/office/create", "/employee/create", "/profile", "/profile/edit"]:
        page.goto(f"{BASE_URL}{route}")
        page.wait_for_load_state("networkidle")
        expect_desktop_shell(page)

    page.goto(f"{BASE_URL}/office")
    page.wait_for_load_state("networkidle")
    first_office = page.locator("table[aria-label='Daftar kantor'] a, table[aria-label='Daftar kantor'] button").first
    if first_office.count() > 0:
        page.goto(f"{BASE_URL}/office/1")
        page.wait_for_load_state("networkidle")
        expect_desktop_shell(page)

    page.goto(f"{BASE_URL}/employee")
    page.wait_for_load_state("networkidle")
    first_employee_detail = page.locator("text=Detail").first
    if first_employee_detail.count() > 0:
        first_employee_detail.click()
        page.wait_for_load_state("networkidle")
        expect_desktop_shell(page)

    browser.close()
