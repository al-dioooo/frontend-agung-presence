"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  useAttendanceSummary,
  useAttendances,
} from "@/lib/api/hooks";
import { mutateDownloadAttendanceExport } from "@/lib/api/mutations";
import type { Employee, Office } from "@/lib/api/types";
import type { AttendanceStatusKey } from "@/lib/attendance-status";
import { apiErrorMessage, apiSuccessMessage } from "@/lib/toast-messages";
import { Button } from "@/components/ui";
import { AttendanceHistoryList } from "@/app/components/attendance-history-list";
import { AttendanceTotals } from "@/app/components/attendance-totals";
import { AdminOnly } from "@/app/components/admin-only";
import { AppPage } from "@/app/components/responsive-layout";
import { PresenceFilterChips } from "@/app/components/presence-filter-chips";
import { ScrollablePillGroup } from "@/app/components/scrollable-pill-group";
import {
  buildPresenceAttendanceParams,
  hasPresenceFilters,
} from "@/app/components/presence-filter-state";
import { PresenceFilterSheet } from "@/app/components/presence-filter-sheet";
import { DownloadIcon, FilterIcon } from "@/components/icons/outline";
import { useToast } from "@/app/components/toast-provider";

type ReportView = "summary" | "detail";

const REPORT_VIEWS: { value: ReportView; label: string }[] = [
  { value: "summary", label: "Ringkasan" },
  { value: "detail", label: "Detail" },
];

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function PresenceReportContent() {
  const { token } = useAuth();
  const toast = useToast();
  const today = toDateKey(new Date());

  const [view, setView] = useState<ReportView>("summary");
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedOffice, setSelectedOffice] = useState<Office | null>(null);
  const [statusFilter, setStatusFilter] = useState<AttendanceStatusKey | "all">("all");
  const [dateRangeActive, setDateRangeActive] = useState(true);
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState("");

  const attendanceParams = useMemo(
    () =>
      buildPresenceAttendanceParams({
        search: "",
        selectedUserId: selectedEmployee?.id ?? null,
        selectedOfficeId: selectedOffice?.id ?? null,
        status: statusFilter,
        dateRangeActive,
        startDate,
        endDate,
      }),
    [
      dateRangeActive,
      endDate,
      selectedEmployee,
      selectedOffice,
      startDate,
      statusFilter,
    ],
  );

  const hasFilters = hasPresenceFilters({
    search: "",
    selectedUserId: selectedEmployee?.id ?? null,
    selectedOfficeId: selectedOffice?.id ?? null,
    status: statusFilter,
    dateRangeActive,
    startDate,
    endDate,
  });
  const sheetHasFilters =
    selectedEmployee !== null ||
    selectedOffice !== null ||
    statusFilter !== "all" ||
    dateRangeActive;

  const { data: attendances = [], isLoading: loadingAttendances } =
    useAttendances(attendanceParams);
  const {
    data: attendanceSummary = [],
    isLoading: loadingSummary,
  } = useAttendanceSummary(true, attendanceParams);

  function resetFilters() {
    setSelectedEmployee(null);
    setSelectedOffice(null);
    setStatusFilter("all");
    setDateRangeActive(true);
    setStartDate(today);
    setEndDate(today);
  }

  async function handleExport() {
    if (!token) return;

    setIsExporting(true);
    setExportError("");
    try {
      const result = await mutateDownloadAttendanceExport(
        token,
        attendanceParams,
      );
      const { blob, filename } = result.data;
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
      toast.success(apiSuccessMessage(result, "Laporan absensi berhasil diunduh."));
    } catch (err) {
      const message = apiErrorMessage(err, "Gagal mengunduh laporan absensi.");
      setExportError(message);
      toast.error(message);
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <AppPage size="wide">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-foreground md:text-2xl">
            Presence Report
          </h1>
          <p className="mt-1 text-sm text-taupe-400">
            Ringkasan dan detail absensi
          </p>
        </div>
        <Button href="/presence" variant="secondary" size="sm">
          History
        </Button>
      </div>

      <div className="mb-3 flex items-center justify-between gap-2 rounded-2xl bg-white p-3 ring-1 ring-taupe-200 shadow-sm">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">
            Filter laporan
          </p>
          <p className="text-xs text-taupe-400">
            {dateRangeActive ? `${startDate} - ${endDate}` : "Semua tanggal"}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="secondary"
            size="icon"
            onClick={handleExport}
            loading={isExporting}
            aria-label="Unduh laporan absensi"
          >
            <DownloadIcon className="size-5" strokeWidth={2} />
          </Button>
          <Button
            variant={sheetHasFilters ? "primary" : "secondary"}
            size="icon"
            onClick={() => setFilterOpen(true)}
            aria-label="Filter laporan"
          >
            <FilterIcon className="size-5" />
          </Button>
        </div>
      </div>

      {exportError && (
        <p className="mb-4 rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
          {exportError}
        </p>
      )}

      <PresenceFilterChips
        selectedEmployee={selectedEmployee}
        selectedOffice={selectedOffice}
        status={statusFilter}
        dateRangeActive={dateRangeActive}
        startDate={startDate}
        endDate={endDate}
        onClearEmployee={() => setSelectedEmployee(null)}
        onClearOffice={() => setSelectedOffice(null)}
        onClearStatus={() => setStatusFilter("all")}
        onClearDateRange={() => setDateRangeActive(false)}
        onClearAll={resetFilters}
      />

      <PresenceFilterSheet
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        title="Filter Laporan"
        selectedEmployee={selectedEmployee}
        selectedOffice={selectedOffice}
        status={statusFilter}
        dateRangeActive={dateRangeActive}
        startDate={startDate}
        endDate={endDate}
        maxDate={today}
        onEmployeeChange={setSelectedEmployee}
        onOfficeChange={setSelectedOffice}
        onStatusChange={setStatusFilter}
        onDateRangeActiveChange={setDateRangeActive}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onReset={resetFilters}
      />

      <ScrollablePillGroup
        options={REPORT_VIEWS}
        value={view}
        onChange={setView}
        aria-label="Tampilan laporan presensi"
        className="mb-4"
      />

      {view === "summary" ? (
        <AttendanceTotals
          summaries={attendanceSummary}
          loading={loadingSummary}
        />
      ) : (
        <AttendanceHistoryList
          attendances={attendances}
          loading={loadingAttendances}
          isAdministrator
          emptyMessage={
            hasFilters ? "Tidak ada hasil ditemukan" : "Belum ada detail laporan"
          }
        />
      )}
    </AppPage>
  );
}

export default function PresenceReportPage() {
  return (
    <AdminOnly>
      <PresenceReportContent />
    </AdminOnly>
  );
}
