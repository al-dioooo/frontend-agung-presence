"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api/client";
import {
  useAttendanceSummary,
  useAttendances,
} from "@/lib/api/hooks";
import {
  mutateCheckOut,
  mutateCreateManualAttendance,
  mutateDownloadAttendanceExport,
} from "@/lib/api/mutations";
import type { Employee, ManualAttendanceInput, Office } from "@/lib/api/types";
import type { AttendanceStatusKey } from "@/lib/attendance-status";
import { Button, SearchInput } from "@/components/ui";
import { AttendanceHistoryList } from "@/app/components/attendance-history-list";
import { AttendanceTotals } from "@/app/components/attendance-totals";
import { ManualAttendanceSheet } from "@/app/components/manual-attendance-sheet";
import { AppPage } from "@/app/components/responsive-layout";
import { PresenceFilterChips } from "@/app/components/presence-filter-chips";
import {
  buildPresenceAttendanceParams,
  hasPresenceFilters,
} from "@/app/components/presence-filter-state";
import { PresenceFilterSheet } from "@/app/components/presence-filter-sheet";
import {
  PresenceView,
  PresenceViewToggle,
} from "@/app/components/presence-view-toggle";
import {
  DownloadIcon,
  FilterIcon,
  PencilIcon,
} from "@/components/icons/outline";

function formatTime(iso: string | null) {
  if (!iso) return "--:--";
  return new Date(iso).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function PresencePage() {
  const { token, user } = useAuth();
  const isAdministrator = user?.role === "administrator";
  const today = toDateKey(new Date());

  const [view, setView] = useState<PresenceView>("history");
  const [search, setSearch] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedOffice, setSelectedOffice] = useState<Office | null>(null);
  const [statusFilter, setStatusFilter] = useState<AttendanceStatusKey | "all">("all");
  const [dateRangeActive, setDateRangeActive] = useState(false);
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkOutError, setCheckOutError] = useState("");

  const [manualInputOpen, setManualInputOpen] = useState(false);
  const [manualError, setManualError] = useState("");
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState("");

  const attendanceParams = useMemo(
    () =>
      buildPresenceAttendanceParams({
        search,
        selectedUserId: isAdministrator ? selectedEmployee?.id ?? null : null,
        selectedOfficeId: isAdministrator ? selectedOffice?.id ?? null : null,
        status: isAdministrator ? statusFilter : "all",
        dateRangeActive: isAdministrator ? dateRangeActive : false,
        startDate,
        endDate,
      }),
    [
      dateRangeActive,
      endDate,
      isAdministrator,
      search,
      selectedEmployee,
      selectedOffice,
      startDate,
      statusFilter,
    ],
  );

  const hasFilters = hasPresenceFilters({
    search,
    selectedUserId: isAdministrator ? selectedEmployee?.id ?? null : null,
    selectedOfficeId: isAdministrator ? selectedOffice?.id ?? null : null,
    status: isAdministrator ? statusFilter : "all",
    dateRangeActive: isAdministrator ? dateRangeActive : false,
    startDate,
    endDate,
  });
  const adminSheetHasFilters =
    selectedEmployee !== null ||
    selectedOffice !== null ||
    statusFilter !== "all" ||
    dateRangeActive;

  const { data: attendances = [], isLoading } = useAttendances(attendanceParams);
  const {
    data: attendanceSummary = [],
    isLoading: isLoadingSummary,
  } = useAttendanceSummary(isAdministrator, attendanceParams);

  const activeCheckIn = attendances.find(
    (attendance) =>
      !isAdministrator &&
      attendance.date === today &&
      attendance.in_at &&
      !attendance.out_at,
  ) ?? null;

  function resetAdminFilters() {
    setSelectedEmployee(null);
    setSelectedOffice(null);
    setStatusFilter("all");
    setDateRangeActive(false);
    setStartDate(today);
    setEndDate(today);
  }

  async function handleCheckOut() {
    if (!token || !activeCheckIn) return;
    setIsCheckingOut(true);
    setCheckOutError("");
    try {
      await mutateCheckOut(token, activeCheckIn.id, {
        currentList: attendances,
      });
    } catch (err) {
      setCheckOutError(err instanceof ApiError ? err.message : "Gagal absen keluar.");
    } finally {
      setIsCheckingOut(false);
    }
  }

  async function handleManualSubmit(input: ManualAttendanceInput) {
    if (!token) return false;

    setIsSubmittingManual(true);
    setManualError("");
    try {
      await mutateCreateManualAttendance(token, input);
      return true;
    } catch (err) {
      setManualError(
        err instanceof ApiError
          ? err.message
          : "Gagal menyimpan input manual.",
      );
      return false;
    } finally {
      setIsSubmittingManual(false);
    }
  }

  async function handleExport() {
    if (!token) return;

    setIsExporting(true);
    setExportError("");
    try {
      const { blob, filename } = await mutateDownloadAttendanceExport(
        token,
        attendanceParams,
      );
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setExportError(
        err instanceof ApiError ? err.message : "Gagal mengunduh rekap absensi.",
      );
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <AppPage size="wide">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-foreground md:text-2xl">
          Presence History
        </h1>
        <Button href="/presence/requests" variant="primary" size="sm">
          Pengajuan
        </Button>
      </div>

      {activeCheckIn && (
        <div className="mb-5 overflow-hidden rounded-2xl bg-emerald-50 ring-1 ring-emerald-200">
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
                Sedang Absen
              </p>
              <p className="mt-0.5 truncate text-sm font-medium text-foreground">
                {activeCheckIn.office?.name ?? `Office #${activeCheckIn.office_id}`}
              </p>
              <p className="text-xs text-emerald-600">
                Masuk: {formatTime(activeCheckIn.in_at)}
              </p>
            </div>
            <Button
              variant="success"
              className="shrink-0"
              onClick={handleCheckOut}
              loading={isCheckingOut}
              loadingText="Memproses..."
            >
              Absen Keluar
            </Button>
          </div>
          {checkOutError && (
            <p className="border-t border-emerald-100 px-4 py-2 text-xs text-red-500">
              {checkOutError}
            </p>
          )}
        </div>
      )}

      <div className="mb-3 flex items-center gap-2 lg:rounded-2xl lg:bg-white lg:p-3 lg:ring-1 lg:ring-taupe-200 lg:shadow-sm">
        <div className="min-w-0 flex-1">
          <SearchInput
            id="presence-search"
            value={search}
            onChange={setSearch}
            placeholder="Search"
          />
        </div>
        {isAdministrator && (
          <>
            <Button
              variant="secondary"
              size="icon"
              onClick={() => {
                setManualError("");
                setManualInputOpen(true);
              }}
              aria-label="Input manual cuti sakit atau izin"
            >
              <PencilIcon className="size-5" strokeWidth={2} />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              onClick={handleExport}
              loading={isExporting}
              aria-label="Unduh rekapan sesuai filter"
            >
              <DownloadIcon className="size-5" strokeWidth={2} />
            </Button>
            <Button
              variant={adminSheetHasFilters ? "primary" : "secondary"}
              size="icon"
              onClick={() => setFilterOpen(true)}
              aria-label="Filter riwayat"
            >
              <FilterIcon className="size-5" />
            </Button>
          </>
        )}
      </div>

      {exportError && (
        <p className="mb-4 rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
          {exportError}
        </p>
      )}

      {isAdministrator && (
        <>
          <PresenceViewToggle value={view} onChange={setView} />
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
            onClearAll={resetAdminFilters}
          />
        </>
      )}

      <PresenceFilterSheet
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
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
        onReset={resetAdminFilters}
      />

      <ManualAttendanceSheet
        open={manualInputOpen}
        onClose={() => setManualInputOpen(false)}
        maxDate={today}
        error={manualError}
        submitting={isSubmittingManual}
        onSubmit={handleManualSubmit}
      />

      {isAdministrator && view === "summary" ? (
        <AttendanceTotals
          summaries={attendanceSummary}
          loading={isLoadingSummary}
        />
      ) : (
        <AttendanceHistoryList
          attendances={attendances}
          loading={isLoading}
          isAdministrator={isAdministrator}
          emptyMessage={
            hasFilters ? "Tidak ada hasil ditemukan" : "Belum ada riwayat absensi"
          }
        />
      )}
    </AppPage>
  );
}
