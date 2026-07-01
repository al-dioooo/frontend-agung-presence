from playwright.sync_api import expect, sync_playwright

from utils import BASE_URL, ensure_logged_in, expect_desktop_shell


ROUTES_WITH_TABLES = [
    ("/presence", "table[aria-label='Riwayat absensi']"),
    ("/presence/requests", "table[aria-label='Daftar pengajuan absensi']"),
    ("/office", "table[aria-label='Daftar kantor']"),
    ("/employee", "table[aria-label='Daftar karyawan']"),
]


with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1280, "height": 800})
    ensure_logged_in(page)

    page.goto(f"{BASE_URL}/dashboard")
    page.wait_for_load_state("networkidle")
    expect_desktop_shell(page)
    expect(page.locator("section[aria-label='Kantor Terdekat']")).to_be_visible()

    for route, table_selector in ROUTES_WITH_TABLES:
        page.goto(f"{BASE_URL}{route}")
        page.wait_for_load_state("networkidle")
        expect_desktop_shell(page)
        expect(page.locator(table_selector)).to_be_visible()

    browser.close()
