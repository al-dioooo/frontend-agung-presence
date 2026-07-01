"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api/client";
import {
  useAttendanceSummary,
  useAttendances,
  useEmployees,
  useOffices,
} from "@/lib/api/hooks";
import {
  mutateCheckOut,
  mutateCreateManualAttendance,
  mutateDownloadAttendanceExport,
} from "@/lib/api/mutations";
import type { ManualAttendanceStatus } from "@/lib/api/types";
import type { AttendanceStatusKey } from "@/lib/attendance-status";
import {
  MANUAL_STATUS_OPTIONS,
  statusLabel,
} from "@/lib/attendance-status";
import { Button, SearchInput } from "@/components/ui";
import { AttendanceHistoryList } from "@/app/components/attendance-history-list";
import { AttendanceTotals } from "@/app/components/attendance-totals";
import { BottomSheet } from "@/app/components/bottom-sheet";
import { MobileDatePicker } from "@/app/components/mobile-date-picker";
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
  ChevronRightIcon,
  DownloadIcon,
  FilterIcon,
  PencilIcon,
  UserIcon,
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

function formatDisplayDate(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function PresencePage() {
  const { token, user } = useAuth();
  const isAdministrator = user?.role === "administrator";
  const today = toDateKey(new Date());

  const [view, setView] = useState<PresenceView>("history");
  const [search, setSearch] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedOfficeId, setSelectedOfficeId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<AttendanceStatusKey | "all">("all");
  const [dateRangeActive, setDateRangeActive] = useState(false);
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkOutError, setCheckOutError] = useState("");

  const [manualInputOpen, setManualInputOpen] = useState(false);
  const [manualDatePickerOpen, setManualDatePickerOpen] = useState(false);
  const [manualUserId, setManualUserId] = useState<number | null>(null);
  const [manualDate, setManualDate] = useState(today);
  const [manualStatus, setManualStatus] = useState<ManualAttendanceStatus>("sick");
  const [manualError, setManualError] = useState("");
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState("");

  const attendanceParams = useMemo(
    () =>
      buildPresenceAttendanceParams({
        search,
        selectedUserId: isAdministrator ? selectedUserId : null,
        selectedOfficeId: isAdministrator ? selectedOfficeId : null,
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
      selectedOfficeId,
      selectedUserId,
      startDate,
      statusFilter,
    ],
  );

  const hasFilters = hasPresenceFilters({
    search,
    selectedUserId: isAdministrator ? selectedUserId : null,
    selectedOfficeId: isAdministrator ? selectedOfficeId : null,
    status: isAdministrator ? statusFilter : "all",
    dateRangeActive: isAdministrator ? dateRangeActive : false,
    startDate,
    endDate,
  });
  const adminSheetHasFilters =
    selectedUserId !== null ||
    selectedOfficeId !== null ||
    statusFilter !== "all" ||
    dateRangeActive;

  const { data: attendances = [], isLoading } = useAttendances(attendanceParams);
  const {
    data: attendanceSummary = [],
    isLoading: isLoadingSummary,
  } = useAttendanceSummary(isAdministrator, attendanceParams);
  const { data: employees = [], isLoading: isLoadingEmployees } = useEmployees(
    undefined,
    isAdministrator,
  );
  const { data: offices = [], isLoading: isLoadingOffices } = useOffices(
    undefined,
    false,
  );

  const activeCheckIn = attendances.find(
    (attendance) =>
      !isAdministrator &&
      attendance.date === today &&
      attendance.in_at &&
      !attendance.out_at,
  ) ?? null;

  const employeeOptions = useMemo(
    () => [...employees].sort((a, b) => a.name.localeCompare(b.name)),
    [employees],
  );
  const officeOptions = useMemo(
    () => [...offices].sort((a, b) => a.name.localeCompare(b.name)),
    [offices],
  );
  const selectedUser = employeeOptions.find((employee) => employee.id === selectedUserId) ?? null;
  const selectedOffice = officeOptions.find((office) => office.id === selectedOfficeId) ?? null;
  const selectedManualEmployee = employeeOptions.find((employee) => employee.id === manualUserId);

  function resetAdminFilters() {
    setSelectedUserId(null);
    setSelectedOfficeId(null);
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

  async function handleManualSubmit() {
    if (!token || manualUserId === null) return;

    setIsSubmittingManual(true);
    setManualError("");
    try {
      await mutateCreateManualAttendance(token, {
        user_id: manualUserId,
        date: manualDate,
        status: manualStatus,
      });
      setManualInputOpen(false);
      setManualUserId(null);
      setManualStatus("sick");
      setManualDate(today);
    } catch (err) {
      setManualError(
        err instanceof ApiError
          ? err.message
          : "Gagal menyimpan input manual.",
      );
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
    <div className="px-5 pt-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-foreground">
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

      <div className="mb-3 flex items-center gap-2">
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
            selectedEmployee={selectedUser}
            selectedOffice={selectedOffice}
            status={statusFilter}
            dateRangeActive={dateRangeActive}
            startDate={startDate}
            endDate={endDate}
            onClearEmployee={() => setSelectedUserId(null)}
            onClearOffice={() => setSelectedOfficeId(null)}
            onClearStatus={() => setStatusFilter("all")}
            onClearDateRange={() => setDateRangeActive(false)}
            onClearAll={resetAdminFilters}
          />
        </>
      )}

      <PresenceFilterSheet
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        employees={employeeOptions}
        offices={officeOptions}
        loadingEmployees={isLoadingEmployees}
        loadingOffices={isLoadingOffices}
        selectedUserId={selectedUserId}
        selectedOfficeId={selectedOfficeId}
        status={statusFilter}
        dateRangeActive={dateRangeActive}
        startDate={startDate}
        endDate={endDate}
        maxDate={today}
        onUserChange={setSelectedUserId}
        onOfficeChange={setSelectedOfficeId}
        onStatusChange={setStatusFilter}
        onDateRangeActiveChange={setDateRangeActive}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onReset={resetAdminFilters}
      />

      <BottomSheet
        open={manualInputOpen}
        onClose={() => {
          setManualInputOpen(false);
          setManualDatePickerOpen(false);
        }}
        title="Input Cuti / Sakit / Izin"
      >
        <div className="space-y-4 px-2 pb-2">
          <div>
            <p className="px-2 text-xs font-semibold uppercase text-taupe-400">
              Karyawan
            </p>
            <div className="mt-2 space-y-1">
              {isLoadingEmployees ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-16 animate-pulse rounded-2xl bg-taupe-100"
                  />
                ))
              ) : employeeOptions.length === 0 ? (
                <p className="rounded-2xl bg-taupe-50 px-4 py-5 text-center text-sm text-taupe-400">
                  Belum ada karyawan
                </p>
              ) : (
                employeeOptions.map((employee) => {
                  const selected = employee.id === manualUserId;
                  return (
                    <button
                      key={employee.id}
                      type="button"
                      onClick={() => setManualUserId(employee.id)}
                      className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm transition-colors active:bg-taupe-50 ${
                        selected ? "bg-taupe-50" : ""
                      }`}
                    >
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-taupe-100">
                        <UserIcon className="size-4 text-taupe-400" />
                      </span>
                      <span className="min-w-0 flex-1 text-left">
                        <span className="block truncate font-medium text-foreground">
                          {employee.name}
                        </span>
                        <span className="block truncate text-xs text-taupe-400">
                          @{employee.username} · {employee.email}
                        </span>
                      </span>
                      {selected && <span className="size-2 rounded-full bg-primary" />}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setManualDatePickerOpen(true)}
            className="flex min-h-16 w-full items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 text-left ring-1 ring-taupe-200 transition-shadow active:bg-taupe-50 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <span className="min-w-0">
              <span className="block text-sm font-medium text-foreground">
                Tanggal
              </span>
              <span className="mt-0.5 block truncate text-xs text-taupe-400">
                {formatDisplayDate(manualDate)}
              </span>
            </span>
            <ChevronRightIcon className="size-5 shrink-0 text-taupe-400" strokeWidth={2} />
          </button>

          <div>
            <p className="px-2 text-xs font-semibold uppercase text-taupe-400">
              Status
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {MANUAL_STATUS_OPTIONS.map((option) => {
                const selected = manualStatus === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setManualStatus(option.value)}
                    className={`rounded-2xl px-4 py-3 text-left ring-1 transition-colors active:bg-taupe-50 ${
                      selected
                        ? "bg-emerald-50 ring-primary"
                        : "bg-white ring-taupe-200"
                    }`}
                  >
                    <span className="block text-sm font-semibold text-foreground">
                      {option.label}
                    </span>
                    <span className="mt-0.5 block text-xs text-taupe-400">
                      {option.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {selectedManualEmployee && (
            <p className="rounded-2xl bg-taupe-50 px-4 py-3 text-xs text-taupe-500">
              {selectedManualEmployee.name} akan ditandai {statusLabel(manualStatus)} pada {formatDisplayDate(manualDate)}.
            </p>
          )}

          {manualError && (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
              {manualError}
            </p>
          )}

          <Button
            variant="primary"
            fullWidth
            className="h-12"
            disabled={manualUserId === null}
            loading={isSubmittingManual}
            loadingText="Menyimpan..."
            onClick={handleManualSubmit}
          >
            Simpan
          </Button>
        </div>
      </BottomSheet>

      <MobileDatePicker
        open={manualDatePickerOpen}
        value={manualDate}
        maxDate={today}
        title="Pilih Tanggal"
        onClose={() => setManualDatePickerOpen(false)}
        onConfirm={(date) => {
          setManualDate(date);
          setManualDatePickerOpen(false);
        }}
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
    </div>
  );
}
