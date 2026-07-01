import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const BASE_URL = process.env.BASE_URL ?? "http://127.0.0.1:3000";
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

async function visibleElementCount(page, selector) {
  return page.locator(selector).evaluateAll((elements) =>
    elements.filter((element) => {
      const style = window.getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
    }).length,
  );
}

async function expectVisibleAction(page, selector, message) {
  const action = page.locator(selector).first();
  try {
    await action.waitFor({ state: "visible", timeout: 15000 });
  } catch {
    throw new Error(message);
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

async function getFirstEmployee(page) {
  return page.evaluate(async () => {
    const token = window.localStorage.getItem("agung-presence-token");
    const response = await fetch("/api/backend/users", {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    const payload = await response.json();
    return payload.data?.find((employee) => employee.role !== "administrator") ?? null;
  });
}

async function expectDesktopFormPanel(page, submitName) {
  await expectVisible(
    page,
    "[data-desktop-form-layout]",
    "desktop form layout should be visible",
  );
  await expectVisible(
    page,
    "[data-desktop-form-rail]",
    "desktop form rail should be visible",
  );
  await expectVisible(
    page,
    "[data-desktop-form-panel]",
    "desktop form panel should be visible",
  );
  await expectVisible(
    page,
    "[data-desktop-form-actions]",
    "desktop form actions should be visible",
  );

  const fixedOrSticky = await page
    .locator("[data-desktop-form-actions]")
    .first()
    .evaluate((element) => {
      const style = window.getComputedStyle(element);
      return style.position === "fixed" || style.position === "sticky";
    });
  if (fixedOrSticky) {
    throw new Error("desktop form actions should not be fixed or sticky");
  }

  const panelBox = await page.locator("[data-desktop-form-panel]").first().boundingBox();
  const actionBox = await page.locator("[data-desktop-form-actions]").first().boundingBox();
  if (!panelBox || !actionBox || Math.abs(panelBox.width - actionBox.width) > 2) {
    throw new Error("desktop form actions should span the form panel width");
  }

  await expectVisibleAction(
    page,
    `[data-desktop-form-actions] button:has-text("${submitName}")`,
    `desktop form submit ${submitName} should be visible in the panel footer`,
  );
}

async function expectNoDesktopFormRailOrActions(page, route) {
  await page.goto(`${BASE_URL}${route}`);
  await page.waitForLoadState("networkidle");
  await expectMobileShell(page);

  if ((await visibleElementCount(page, "[data-desktop-form-rail]")) > 0) {
    throw new Error(`Desktop form rail visible below desktop width at ${route}`);
  }
  if ((await visibleElementCount(page, "[data-desktop-form-actions]")) > 0) {
    throw new Error(`Desktop form actions visible below desktop width at ${route}`);
  }
}

async function expectAdminDesktopFormPanels(page) {
  const office = await getFirstActiveOffice(page);
  if (!office) {
    throw new Error("No office available for desktop form smoke");
  }

  const employee = await getFirstEmployee(page);
  if (!employee) {
    throw new Error("No employee available for desktop form smoke");
  }

  for (const [route, submitName] of [
    ["/office/create", "Buat Kantor"],
    [`/office/${office.id}/edit`, "Simpan Perubahan"],
    ["/employee/create", "Buat Karyawan"],
    [`/employee/${employee.id}/edit`, "Simpan Perubahan"],
    ["/profile/edit", "Save Profile"],
  ]) {
    await page.goto(`${BASE_URL}${route}`);
    await page.waitForLoadState("networkidle");
    await expectDesktopShell(page);
    await expectDesktopFormPanel(page, submitName);
    await assertNoHorizontalOverflow(page);
  }
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
  await expectDesktopFormPanel(page, "Kirim Pengajuan");
  await expectVisible(page, "table[aria-label='Riwayat pengajuan']");
  await page.getByText(/^Total: \d+ hari kerja$/).first().waitFor({ timeout: 15000 });

  const requestDetailActions = page.locator(
    "table[aria-label='Riwayat pengajuan'] button[aria-label^='Lihat detail pengajuan']",
  );
  if ((await requestDetailActions.count()) > 0) {
    await requestDetailActions.first().click();
    const detailDialog = page.getByRole("dialog", { name: "Detail Pengajuan" });
    await detailDialog.waitFor({ timeout: 15000 });
    await detailDialog.getByText("Tanggal Mulai").waitFor({ timeout: 15000 });
    await detailDialog.getByText("Tanggal Selesai").waitFor({ timeout: 15000 });
    await detailDialog.getByText("Total Hari").waitFor({ timeout: 15000 });
    if (await detailDialog.getByRole("button", { name: "Setujui" }).isVisible()) {
      throw new Error("Employee request detail exposed review controls");
    }
    await detailDialog.getByRole("button", { name: "Tutup" }).click();
    await detailDialog.waitFor({ state: "hidden", timeout: 15000 });
  } else {
    const emptyHistory = page
      .locator("table[aria-label='Riwayat pengajuan']")
      .getByText("Belum ada pengajuan");
    if ((await emptyHistory.count()) === 0 || !(await emptyHistory.first().isVisible())) {
      throw new Error("Employee request history rows are missing detail actions");
    }
  }

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

async function expectDeleteConfirmationCancel(page, actionSelector, dialogName) {
  const action = page.locator(actionSelector).first();
  await action.waitFor({ state: "visible", timeout: 15000 });
  await action.click();

  const dialog = page.getByRole("dialog", { name: dialogName });
  await dialog.waitFor({ timeout: 15000 });
  await dialog.getByRole("button", { name: "Batal" }).click();
  await dialog.waitFor({ state: "hidden", timeout: 15000 });
}

async function expectAdminDesktopTableActions(page) {
  await page.goto(`${BASE_URL}/presence`);
  await page.waitForLoadState("networkidle");
  await expectDesktopShell(page);
  await expectVisibleAction(
    page,
    "table[aria-label='Riwayat absensi'] a[aria-label^='Lihat detail absensi']",
    "Presence history should expose Eye detail actions on desktop",
  );
  if (
    (await visibleElementCount(
      page,
      "table[aria-label='Riwayat absensi'] a[aria-label^='Edit absensi'], table[aria-label='Riwayat absensi'] button[aria-label^='Hapus absensi']",
    )) > 0
  ) {
    throw new Error("Presence history should not expose edit/delete actions");
  }

  await page.goto(`${BASE_URL}/presence/requests`);
  await page.waitForLoadState("networkidle");
  await expectDesktopShell(page);
  await page.getByRole("button", { name: "Semua" }).click();
  await expectVisibleAction(
    page,
    "table[aria-label='Daftar pengajuan absensi'] button[aria-label^='Review pengajuan']",
    "Admin request table should expose Eye review actions on desktop",
  );
  await page
    .locator("table[aria-label='Daftar pengajuan absensi'] button[aria-label^='Review pengajuan']")
    .first()
    .click();
  const reviewDialog = page.getByRole("dialog", { name: "Review Pengajuan" });
  await reviewDialog.waitFor({ timeout: 15000 });
  await reviewDialog.getByText("Tanggal Mulai").waitFor({ timeout: 15000 });
  await reviewDialog.getByText("Tanggal Selesai").waitFor({ timeout: 15000 });
  await reviewDialog.getByText("Total Hari").waitFor({ timeout: 15000 });
  await reviewDialog.getByRole("button", { name: "Tutup" }).click();
  await reviewDialog.waitFor({ state: "hidden", timeout: 15000 });

  await page.goto(`${BASE_URL}/office`);
  await page.waitForLoadState("networkidle");
  await expectDesktopShell(page);
  await expectVisibleAction(
    page,
    "table[aria-label='Daftar kantor'] a[aria-label^='Lihat detail kantor']",
    "Office table should expose Eye detail actions on desktop",
  );
  await expectVisibleAction(
    page,
    "table[aria-label='Daftar kantor'] a[aria-label^='Edit kantor']",
    "Office table should expose Pencil edit actions for administrators",
  );
  await expectVisibleAction(
    page,
    "table[aria-label='Daftar kantor'] button[aria-label^='Hapus kantor']",
    "Office table should expose Trash delete actions for administrators",
  );
  await expectDeleteConfirmationCancel(
    page,
    "table[aria-label='Daftar kantor'] button[aria-label^='Hapus kantor']",
    "Hapus Kantor?",
  );

  await page.goto(`${BASE_URL}/employee`);
  await page.waitForLoadState("networkidle");
  await expectDesktopShell(page);
  await expectVisibleAction(
    page,
    "table[aria-label='Daftar karyawan'] a[aria-label^='Lihat detail karyawan']",
    "Employee table should expose Eye detail actions on desktop",
  );
  await expectVisibleAction(
    page,
    "table[aria-label='Daftar karyawan'] a[aria-label^='Edit karyawan']",
    "Employee table should expose Pencil edit actions for non-protected employees",
  );
  await expectVisibleAction(
    page,
    "table[aria-label='Daftar karyawan'] button[aria-label^='Hapus karyawan']",
    "Employee table should expose Trash delete actions for non-protected employees",
  );
  await expectDeleteConfirmationCancel(
    page,
    "table[aria-label='Daftar karyawan'] button[aria-label^='Hapus karyawan']",
    "Hapus Karyawan?",
  );
}

async function expectAdminFilterAffordances(page) {
  await page.goto(`${BASE_URL}/employee`);
  await page.waitForLoadState("networkidle");
  await expectDesktopShell(page);
  await page.getByRole("button", { name: "Semua role" }).click();
  const roleDialog = page.getByRole("dialog", { name: "Filter Role" });
  await roleDialog.waitFor({ timeout: 15000 });
  await roleDialog.getByRole("button", { name: /^Karyawan\b/ }).click();
  await roleDialog.waitFor({ state: "hidden", timeout: 15000 });
  await page.getByRole("button", { name: "Karyawan", exact: true }).waitFor({ timeout: 15000 });

  await page.goto(`${BASE_URL}/office`);
  await page.waitForLoadState("networkidle");
  await expectDesktopShell(page);
  await page.getByRole("button", { name: "Semua status" }).click();
  const statusDialog = page.getByRole("dialog", { name: "Filter Status Kantor" });
  await statusDialog.waitFor({ timeout: 15000 });
  await statusDialog.getByRole("button", { name: /^Aktif\b/ }).click();
  await statusDialog.waitFor({ state: "hidden", timeout: 15000 });
  await page.getByRole("button", { name: "Aktif", exact: true }).waitFor({ timeout: 15000 });
  await page.getByRole("button", { name: "Nama" }).click();
  const sortDialog = page.getByRole("dialog", { name: "Urutkan Kantor" });
  await sortDialog.waitFor({ timeout: 15000 });
  await sortDialog.getByRole("button", { name: /Terdekat/ }).click();
  await sortDialog.waitFor({ state: "hidden", timeout: 15000 });
  await page.getByRole("button", { name: /Terdekat|Lokasi/ }).waitFor({ timeout: 15000 });

  await page.goto(`${BASE_URL}/presence`);
  await page.waitForLoadState("networkidle");
  await expectDesktopShell(page);
  await page.getByRole("button", { name: "Filter riwayat" }).click();
  const filterDialog = page.getByRole("dialog", { name: "Filter Riwayat" });
  await filterDialog.waitFor({ timeout: 15000 });
  for (const label of ["Karyawan", "Kantor", "Status", "Tanggal"]) {
    await filterDialog.getByText(label).first().waitFor({ timeout: 15000 });
  }
  await filterDialog.getByRole("button", { name: /Karyawan/ }).click();
  const employeeDialog = page.getByRole("dialog", { name: "Pilih Karyawan" });
  await employeeDialog.waitFor({ timeout: 15000 });
  await employeeDialog.getByPlaceholder("Cari karyawan").fill("a");
  await employeeDialog.getByRole("button", { name: /Semua karyawan/ }).click();
  await employeeDialog.waitFor({ state: "hidden", timeout: 15000 });
  await filterDialog.getByRole("button", { name: /Kantor/ }).click();
  const officeDialog = page.getByRole("dialog", { name: "Pilih Kantor" });
  await officeDialog.waitFor({ timeout: 15000 });
  await officeDialog.getByPlaceholder("Cari kantor").fill("kampus");
  await officeDialog.getByRole("button", { name: /Semua kantor/ }).click();
  await officeDialog.waitFor({ state: "hidden", timeout: 15000 });
  await filterDialog.getByRole("button", { name: "Terapkan" }).click();
  await filterDialog.waitFor({ state: "hidden", timeout: 15000 });
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

  await expectAdminDesktopTableActions(page);
  await expectAdminFilterAffordances(page);
  await expectAdminDesktopFormPanels(page);

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

  for (const viewport of [
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
  ]) {
    await page.setViewportSize(viewport);
    await expectNoDesktopFormRailOrActions(page, "/office/create");
    await expectNoDesktopFormRailOrActions(page, "/employee/create");
    await expectNoDesktopFormRailOrActions(page, "/profile/edit");
  }

  await expectEmployeeDesktopCameraFlows(browser);

  await browser.close();
}

run().catch(async (error) => {
  console.error(error);
  process.exit(1);
});
