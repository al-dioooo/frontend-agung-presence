import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const BASE_URL = "http://127.0.0.1:3000";
const ADMIN_USERNAME = "angelika";
const ADMIN_PASSWORD = "angelika";
const EMPLOYEE_USERNAME = "kartika_sari";
const EMPLOYEE_PASSWORD = "password";

async function assertNoHorizontalOverflow(page) {
  const hasOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  );
  if (hasOverflow) {
    throw new Error(`Horizontal overflow at ${page.url()}`);
  }
}

async function visible(page, selector) {
  const locator = page.locator(selector).first();
  return (await locator.count()) > 0 && (await locator.isVisible());
}

async function expectVisible(page, selector, message) {
  if (!(await visible(page, selector))) {
    throw new Error(message ?? `${selector} should be visible`);
  }
}

async function expectHidden(page, selector, message) {
  if (await visible(page, selector)) {
    throw new Error(message ?? `${selector} should be hidden`);
  }
}

async function waitForShellOrPermissionGate(page) {
  await page.waitForFunction(
    () =>
      document.querySelector("#sidebar-home") ||
      document.querySelector("#nav-home") ||
      document.body.innerText.includes("Izinkan Akses") ||
      document.body.innerText.includes("Akses ditolak"),
    null,
    { timeout: 15000 },
  );
}

async function loginAs(page, username, password) {
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState("networkidle");
  await page.locator("#login-input").fill(username);
  await page.locator("#password-input").fill(password);
  await page.locator("#login-submit").click();
  await page.waitForURL("**/dashboard", { timeout: 15000 });
  await page.waitForLoadState("networkidle");
}

async function loginAsAdmin(page) {
  await loginAs(page, ADMIN_USERNAME, ADMIN_PASSWORD);
}

async function passPermissionGate(page) {
  const allowButton = page.getByRole("button", { name: "Izinkan Akses" }).first();
  if ((await allowButton.count()) > 0 && (await allowButton.isVisible())) {
    await allowButton.click();
    await page.waitForSelector("#sidebar-home, #nav-home", { timeout: 15000 });
  }

  const deniedText = page.getByText("Akses ditolak").first();
  if ((await deniedText.count()) > 0 && (await deniedText.isVisible())) {
    throw new Error("Permission gate reported denied camera/geolocation access");
  }
}

async function expectDesktopShell(page) {
  await waitForShellOrPermissionGate(page);
  await passPermissionGate(page);
  await page.locator("#sidebar-home").waitFor({ state: "visible", timeout: 15000 });
  await expectVisible(page, "#sidebar-home", "desktop sidebar should be visible");
  await expectHidden(page, "#nav-home", "mobile bottom nav should be hidden on desktop");
  await assertNoHorizontalOverflow(page);
}

async function expectMobileShell(page) {
  await waitForShellOrPermissionGate(page);
  await passPermissionGate(page);
  await page.locator("#nav-home").waitFor({ state: "visible", timeout: 15000 });
  await expectVisible(page, "#nav-home", "mobile bottom nav should be visible");
  await expectHidden(page, "#sidebar-home", "desktop sidebar should be hidden on mobile");
  await assertNoHorizontalOverflow(page);
}

async function getFirstActiveOffice(page) {
  return page.evaluate(async () => {
    const token = window.localStorage.getItem("agung-presence-token");
    const response = await fetch("/api/backend/offices?active_only=true", {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    const payload = await response.json();
    return payload.data?.[0] ?? null;
  });
}

async function expectEmployeeDesktopCameraFlows(browser) {
  const context = await browser.newContext({
    geolocation: { latitude: -2.976073, longitude: 104.746872 },
    permissions: ["camera", "geolocation"],
  });
  await context.grantPermissions(["camera", "geolocation"], { origin: BASE_URL });
  const page = await context.newPage();
  await page.setViewportSize({ width: 1280, height: 800 });
  await loginAs(page, EMPLOYEE_USERNAME, EMPLOYEE_PASSWORD);
  await expectDesktopShell(page);

  await page.goto(`${BASE_URL}/presence/requests`);
  await page.waitForLoadState("networkidle");
  await expectDesktopShell(page);
  await page.getByRole("button", { name: "Kamera" }).first().click();
  await page.getByRole("button", { name: "Ambil foto" }).waitFor({ timeout: 15000 });
  await page.getByRole("button", { name: "Ganti kamera" }).click();
  await page.getByRole("button", { name: "Ambil foto" }).click();
  await page.locator("img[alt='Bukti pengajuan']").waitFor({ timeout: 15000 });

  const office = await getFirstActiveOffice(page);
  if (!office) {
    throw new Error("No active office available for desktop check-in camera smoke");
  }

  await context.setGeolocation({
    latitude: Number(office.latitude),
    longitude: Number(office.longitude),
  });
  await page.goto(`${BASE_URL}/office/${office.id}`);
  await page.waitForLoadState("networkidle");
  await expectDesktopShell(page);

  const presenceButton = page.locator("#presence-button");
  await presenceButton.waitFor({ timeout: 15000 });
  if (!(await presenceButton.isEnabled())) {
    throw new Error("Presence button was disabled for active office camera smoke");
  }
  await presenceButton.click();
  await page.getByRole("button", { name: "Ambil foto" }).waitFor({ timeout: 15000 });
  await page.getByRole("button", { name: "Tutup kamera" }).click();
  await page.getByRole("button", { name: "Ambil foto" }).waitFor({
    state: "hidden",
    timeout: 15000,
  });

  await context.close();
}

async function run() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"],
  });
  const context = await browser.newContext({
    geolocation: { latitude: -2.9862, longitude: 104.7597 },
    permissions: ["camera", "geolocation"],
  });
  await context.grantPermissions(["camera", "geolocation"], { origin: BASE_URL });
  const page = await context.newPage();

  for (const viewport of [
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
    { width: 1280, height: 800 },
    { width: 1440, height: 900 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState("networkidle");
    await expectVisible(page, "#login-submit", "login submit should be visible");
    await assertNoHorizontalOverflow(page);
  }

  await page.setViewportSize({ width: 1280, height: 800 });
  await loginAsAdmin(page);
  await expectDesktopShell(page);

  await page.goto(`${BASE_URL}/dashboard`);
  await page.waitForLoadState("networkidle");
  await expectDesktopShell(page);
  await expectVisible(page, "section[aria-label='Kantor Terdekat']");

  for (const [route, tableSelector] of [
    ["/presence", "table[aria-label='Riwayat absensi']"],
    ["/presence/requests", "table[aria-label='Daftar pengajuan absensi']"],
    ["/office", "table[aria-label='Daftar kantor']"],
    ["/employee", "table[aria-label='Daftar karyawan']"],
  ]) {
    await page.goto(`${BASE_URL}${route}`);
    await page.waitForLoadState("networkidle");
    await expectDesktopShell(page);
    await expectVisible(page, tableSelector, `${tableSelector} should be visible`);
  }

  for (const route of ["/office/create", "/employee/create", "/profile", "/profile/edit"]) {
    await page.goto(`${BASE_URL}${route}`);
    await page.waitForLoadState("networkidle");
    await expectDesktopShell(page);
  }

  await page.goto(`${BASE_URL}/dashboard`);
  await page.waitForLoadState("networkidle");
  await expectDesktopShell(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("alertdialog", { name: "Refresh halaman untuk melanjutkan" }).waitFor({
    timeout: 15000,
  });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${BASE_URL}/dashboard`);
  await page.waitForLoadState("networkidle");
  await expectMobileShell(page);

  for (const route of ["/presence", "/presence/requests", "/office", "/employee"]) {
    await page.goto(`${BASE_URL}${route}`);
    await page.waitForLoadState("networkidle");
    await expectMobileShell(page);
    const visibleTables = await page.locator("table").evaluateAll((tables) =>
      tables.filter((table) => {
        const style = window.getComputedStyle(table);
        const rect = table.getBoundingClientRect();
        return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
      }).length,
    );
    if (visibleTables !== 0) {
      throw new Error(`Desktop table visible on mobile at ${route}`);
    }
  }

  await expectEmployeeDesktopCameraFlows(browser);

  await browser.close();
}

run().catch(async (error) => {
  console.error(error);
  process.exit(1);
});
