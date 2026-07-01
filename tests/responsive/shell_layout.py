from playwright.sync_api import sync_playwright

from utils import (
    BASE_URL,
    assert_no_horizontal_overflow,
    expect_desktop_shell,
    expect_mobile_shell,
    login_as_admin,
)


VIEWPORTS = [
    {"width": 390, "height": 844},
    {"width": 768, "height": 1024},
    {"width": 1280, "height": 800},
    {"width": 1440, "height": 900},
]


with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()

    for viewport in VIEWPORTS:
        page.set_viewport_size(viewport)
        page.goto(f"{BASE_URL}/login")
        page.wait_for_load_state("networkidle")
        page.locator("#login-input").wait_for(state="visible")
        assert_no_horizontal_overflow(page)

    page.set_viewport_size({"width": 1280, "height": 800})
    login_as_admin(page)
    expect_desktop_shell(page)

    page.set_viewport_size({"width": 390, "height": 844})
    page.reload()
    page.wait_for_load_state("networkidle")
    expect_mobile_shell(page)

    browser.close()
