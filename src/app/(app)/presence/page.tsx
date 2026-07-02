"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  useAttendanceRequests,
  useAttendances,
} from "@/lib/api/hooks";
import {
  mutateCheckOut,
  mutateCreateManualAttendance,
} from "@/lib/api/mutations";
import type { Employee, ManualAttendanceInput, Office } from "@/lib/api/types";
import type { AttendanceStatusKey } from "@/lib/attendance-status";
import { apiErrorMessage, apiSuccessMessage } from "@/lib/toast-messages";
import { Button, SearchInput } from "@/components/ui";
import { AttendanceHistoryList } from "@/app/components/attendance-history-list";
import { ManualAttendanceSheet } from "@/app/components/manual-attendance-sheet";
import { AppPage } from "@/app/components/responsive-layout";
import { PresenceFilterChips } from "@/app/components/presence-filter-chips";
import {
  buildPresenceAttendanceParams,
  hasPresenceFilters,
} from "@/app/components/presence-filter-state";
import { PresenceFilterSheet } from "@/app/components/presence-filter-sheet";
import {
  FilterIcon,
  PencilIcon,
} from "@/components/icons/outline";
import { useToast } from "@/app/components/toast-provider";
import { TodayPresenceStatusAlert } from "@/app/components/today-presence-status-alert";
import { resolveTodayPresenceStatus } from "@/lib/today-presence-status";

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
  const toast = useToast();
  const isAdministrator = user?.role === "administrator";
  const today = toDateKey(new Date());

  const [search, setSearch] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedOffice, setSelectedOffice] = useState<Office | null>(null);
  const [statusFilter, setStatusFilter] = useState<AttendanceStatusKey | "all">("all");
  const [dateRangeActive, setDateRangeActive] = useState(true);
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkOutError, setCheckOutError] = useState("");

  const [manualInputOpen, setManualInputOpen] = useState(false);
  const [manualError, setManualError] = useState("");
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);

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
    data: todayAttendances = [],
    isLoading: isLoadingTodayAttendances,
  } = useAttendances({ date: today }, !isAdministrator);
  const {
    data: pendingRequests = [],
    isLoading: isLoadingPendingRequests,
  } = useAttendanceRequests(
    { approval_status: "pending" },
    !isAdministrator,
  );
  const todayStatus = useMemo(
    () =>
      resolveTodayPresenceStatus({
        attendances: todayAttendances,
        pendingRequests,
        today,
      }),
    [pendingRequests, today, todayAttendances],
  );
  const todayStatusLoading =
    isLoadingTodayAttendances || isLoadingPendingRequests;

  const activeCheckIn = todayAttendances.find(
    (attendance) =>
      !isAdministrator &&
      attendance.date === today &&
      attendance.in_at &&
      !attendance.out_at,
  ) ?? null;

  function resetAdminFilters() {
    setSearch("");
    setSelectedEmployee(null);
    setSelectedOffice(null);
    setStatusFilter("all");
    setDateRangeActive(true);
    setStartDate(today);
    setEndDate(today);
  }

  async function handleCheckOut() {
    if (!token || !activeCheckIn || activeCheckIn.id === null) return;
    setIsCheckingOut(true);
    setCheckOutError("");
    try {
      const result = await mutateCheckOut(token, activeCheckIn.id, {
        currentList: attendances,
      });
      toast.success(apiSuccessMessage(result, "Absen keluar berhasil."));
    } catch (err) {
      const message = apiErrorMessage(err, "Gagal absen keluar.");
      setCheckOutError(message);
      toast.error(message);
    } finally {
      setIsCheckingOut(false);
    }
  }

  async function handleManualSubmit(input: ManualAttendanceInput) {
    if (!token) return false;

    setIsSubmittingManual(true);
    setManualError("");
    try {
      const result = await mutateCreateManualAttendance(token, input);
      toast.success(apiSuccessMessage(result, "Input manual berhasil disimpan."));
      return true;
    } catch (err) {
      const message = apiErrorMessage(err, "Gagal menyimpan input manual.");
      setManualError(message);
      toast.error(message);
      return false;
    } finally {
      setIsSubmittingManual(false);
    }
  }

  return (
    <AppPage size="wide">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-foreground md:text-2xl">
          Presence History
        </h1>
        <div className="flex shrink-0 items-center gap-2">
          {isAdministrator && (
            <Button href="/presence/report" variant="secondary" size="sm">
              Report
            </Button>
          )}
          <Button href="/presence/requests" variant="primary" size="sm">
            Pengajuan
          </Button>
        </div>
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

      {!isAdministrator && (
        todayStatusLoading ? (
          <div className="mb-5 h-[88px] animate-pulse rounded-2xl bg-white ring-1 ring-taupe-200 shadow-sm" />
        ) : (
          <TodayPresenceStatusAlert status={todayStatus} className="mb-5" />
        )
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
              onClick={() => setManualInputOpen(true)}
              aria-label="Input manual cuti sakit atau izin"
            >
              <PencilIcon className="size-5" strokeWidth={2} />
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

      {isAdministrator && (
        <>
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

      <AttendanceHistoryList
        attendances={attendances}
        loading={isLoading}
        isAdministrator={isAdministrator}
        emptyMessage={
          hasFilters ? "Tidak ada hasil ditemukan" : "Belum ada riwayat absensi"
        }
      />
    </AppPage>
  );
}
