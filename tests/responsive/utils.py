from __future__ import annotations

from playwright.sync_api import Page, expect

BASE_URL = "http://127.0.0.1:3000"
ADMIN_USERNAME = "angelika"
ADMIN_PASSWORD = "angelika"


def assert_no_horizontal_overflow(page: Page) -> None:
    overflow = page.evaluate(
        "() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1"
    )
    assert not overflow, "document has horizontal overflow"


def login_as_admin(page: Page) -> None:
    page.goto(f"{BASE_URL}/login")
    page.wait_for_load_state("networkidle")
    page.locator("#login-input").fill(ADMIN_USERNAME)
    page.locator("#password-input").fill(ADMIN_PASSWORD)
    page.locator("#login-submit").click()
    page.wait_for_url("**/dashboard", timeout=15000)
    page.wait_for_load_state("networkidle")


def ensure_logged_in(page: Page) -> None:
    page.goto(f"{BASE_URL}/dashboard")
    page.wait_for_load_state("networkidle")
    if page.url.endswith("/login"):
        login_as_admin(page)


def visible_count(page: Page, selector: str) -> int:
    return page.locator(selector).filter(visible=True).count()


def expect_desktop_shell(page: Page) -> None:
    expect(page.locator("#sidebar-home")).to_be_visible()
    expect(page.locator("#nav-home")).to_have_count(0)
    assert_no_horizontal_overflow(page)


def expect_mobile_shell(page: Page) -> None:
    expect(page.locator("#nav-home")).to_be_visible()
    expect(page.locator("#sidebar-home")).to_have_count(0)
    assert_no_horizontal_overflow(page)
