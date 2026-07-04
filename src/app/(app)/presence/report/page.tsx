"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  useAttendanceSummary,
  useAttendances,
} from "@/lib/api/hooks";
import { mutateDownloadAttendanceExport } from "@/lib/api/mutations";
import type { Employee, Office } from "@/lib/api/types";
import { LIST_PAGE_SIZE } from "@/lib/pagination";
import type { AttendanceStatusKey } from "@/lib/attendance-status";
import { apiErrorMessage, apiSuccessMessage } from "@/lib/toast-messages";
import { Button } from "@/components/ui";
import { AttendanceHistoryList } from "@/app/components/attendance-history-list";
import { AttendanceTotals } from "@/app/components/attendance-totals";
import { AdminOnly } from "@/app/components/admin-only";
import { PaginationControls } from "@/app/components/pagination-controls";
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
  const [summaryPage, setSummaryPage] = useState(1);
  const [detailPage, setDetailPage] = useState(1);
  const [dateRangeActive, setDateRangeActive] = useState(true);
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState("");

  const baseAttendanceParams = useMemo(
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
  const detailAttendanceParams = useMemo(
    () => ({
      ...baseAttendanceParams,
      page: detailPage,
      per_page: LIST_PAGE_SIZE,
    }),
    [baseAttendanceParams, detailPage],
  );
  const summaryAttendanceParams = useMemo(
    () => ({
      ...baseAttendanceParams,
      page: summaryPage,
      per_page: LIST_PAGE_SIZE,
    }),
    [baseAttendanceParams, summaryPage],
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

  function resetReportPages() {
    setSummaryPage(1);
    setDetailPage(1);
  }

  const { data: attendancePage, isLoading: loadingAttendances } =
    useAttendances(detailAttendanceParams);
  const attendances = attendancePage?.data ?? [];
  const attendanceMeta = attendancePage?.meta;
  const {
    data: attendanceSummaryPage,
    isLoading: loadingSummary,
  } = useAttendanceSummary(true, summaryAttendanceParams);
  const attendanceSummary = attendanceSummaryPage?.data ?? [];
  const attendanceSummaryMeta = attendanceSummaryPage?.meta;

  function resetFilters() {
    setSelectedEmployee(null);
    setSelectedOffice(null);
    setStatusFilter("all");
    setDateRangeActive(true);
    setStartDate(today);
    setEndDate(today);
    setSummaryPage(1);
    setDetailPage(1);
  }

  async function handleExport() {
    if (!token) return;

    setIsExporting(true);
    setExportError("");
    try {
      const result = await mutateDownloadAttendanceExport(
        token,
        baseAttendanceParams,
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
        onClearEmployee={() => {
          setSelectedEmployee(null);
          resetReportPages();
        }}
        onClearOffice={() => {
          setSelectedOffice(null);
          resetReportPages();
        }}
        onClearStatus={() => {
          setStatusFilter("all");
          resetReportPages();
        }}
        onClearDateRange={() => {
          setDateRangeActive(false);
          resetReportPages();
        }}
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
        onEmployeeChange={(value) => {
          setSelectedEmployee(value);
          resetReportPages();
        }}
        onOfficeChange={(value) => {
          setSelectedOffice(value);
          resetReportPages();
        }}
        onStatusChange={(value) => {
          setStatusFilter(value);
          resetReportPages();
        }}
        onDateRangeActiveChange={(value) => {
          setDateRangeActive(value);
          resetReportPages();
        }}
        onStartDateChange={(value) => {
          setStartDate(value);
          resetReportPages();
        }}
        onEndDateChange={(value) => {
          setEndDate(value);
          resetReportPages();
        }}
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
        <>
          <AttendanceTotals
            summaries={attendanceSummary}
            loading={loadingSummary}
          />
          <PaginationControls
            meta={attendanceSummaryMeta}
            onPageChange={setSummaryPage}
          />
        </>
      ) : (
        <>
          <AttendanceHistoryList
            attendances={attendances}
            loading={loadingAttendances}
            isAdministrator
            emptyMessage={
              hasFilters ? "Tidak ada hasil ditemukan" : "Belum ada detail laporan"
            }
          />
          <PaginationControls
            meta={attendanceMeta}
            onPageChange={setDetailPage}
          />
        </>
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
