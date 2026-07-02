"use client";

import { useState } from "react";
import type { AttendanceStatusKey } from "@/lib/attendance-status";
import { STATUS_KEYS, statusLabel } from "@/lib/attendance-status";
import type { Employee, Office } from "@/lib/api/types";
import { Button } from "@/components/ui";
import { BottomSheet } from "@/app/components/bottom-sheet";
import { DateRangeFields, formatDateKey } from "@/app/components/date-range-fields";
import {
  FilterFieldButton,
  SearchableSelectionDialog,
  type FilterSelectionOption,
} from "@/app/components/filter-controls";
import {
  EnterpriseIcon,
  FilterIcon,
  UserIcon,
} from "@/components/icons/outline";
import {
  useEmployeeFilterOptions,
  useOfficeFilterOptions,
} from "@/app/components/filter-option-hooks";

type PresenceFilterSheetProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  selectedEmployee: Employee | null;
  selectedOffice: Office | null;
  status: AttendanceStatusKey | "all";
  dateRangeActive: boolean;
  startDate: string;
  endDate: string;
  maxDate: string;
  onEmployeeChange: (employee: Employee | null) => void;
  onOfficeChange: (office: Office | null) => void;
  onStatusChange: (status: AttendanceStatusKey | "all") => void;
  onDateRangeActiveChange: (active: boolean) => void;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onReset: () => void;
  showStatusFilter?: boolean;
};

function dateRangeLabel(active: boolean, startDate: string, endDate: string) {
  if (!active) return null;

  if (startDate === endDate) return formatDateKey(startDate);

  return `${formatDateKey(startDate)} - ${formatDateKey(endDate)}`;
}

export function PresenceFilterSheet({
  open,
  onClose,
  title = "Filter Riwayat",
  selectedEmployee,
  selectedOffice,
  status,
  dateRangeActive,
  startDate,
  endDate,
  maxDate,
  onEmployeeChange,
  onOfficeChange,
  onStatusChange,
  onDateRangeActiveChange,
  onStartDateChange,
  onEndDateChange,
  onReset,
  showStatusFilter = true,
}: PresenceFilterSheetProps) {
  const [employeeSelectorOpen, setEmployeeSelectorOpen] = useState(false);
  const [officeSelectorOpen, setOfficeSelectorOpen] = useState(false);
  const [statusSelectorOpen, setStatusSelectorOpen] = useState(false);
  const [dateSelectorOpen, setDateSelectorOpen] = useState(false);
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [officeSearch, setOfficeSearch] = useState("");

  const {
    data: employeeOptions = [],
    isLoading: loadingEmployees,
    error: employeeError,
  } = useEmployeeFilterOptions({
    open: employeeSelectorOpen,
    search: employeeSearch,
    role: "employee",
  });
  const {
    data: officeOptions = [],
    isLoading: loadingOffices,
    error: officeError,
  } = useOfficeFilterOptions({
    open: officeSelectorOpen,
    search: officeSearch,
    activeStatus: "all",
  });

  const employeeSelectionOptions: FilterSelectionOption[] = [
    {
      value: null,
      title: "Semua karyawan",
      subtitle: "Tampilkan seluruh riwayat",
      icon: <UserIcon className="size-4 text-taupe-400" />,
    },
    ...employeeOptions.map((employee) => ({
      value: employee.id,
      title: employee.name,
      subtitle: `@${employee.username} · ${employee.email}`,
      icon: <UserIcon className="size-4 text-taupe-400" />,
    })),
  ];
  const officeSelectionOptions: FilterSelectionOption[] = [
    {
      value: null,
      title: "Semua kantor",
      subtitle: "Tidak membatasi lokasi kantor",
      icon: <EnterpriseIcon className="size-4 text-taupe-400" />,
    },
    ...officeOptions.map((office) => ({
      value: office.id,
      title: office.name,
      subtitle: office.address ?? "Tanpa alamat",
      icon: <EnterpriseIcon className="size-4 text-taupe-400" />,
    })),
  ];
  const statusOptions: FilterSelectionOption[] = (["all", ...STATUS_KEYS] as const).map(
    (option) => ({
      value: option,
      title: option === "all" ? "Semua status" : statusLabel(option),
      subtitle:
        option === "all"
          ? "Tidak membatasi status absensi"
          : "Tampilkan kategori ini saja",
      icon: <FilterIcon className="size-4 text-taupe-400" />,
    }),
  );
  const hasFilters =
    selectedEmployee !== null ||
    selectedOffice !== null ||
    (showStatusFilter && status !== "all") ||
    dateRangeActive;

  return (
    <>
      <BottomSheet open={open} onClose={onClose} title={title}>
        <div className="space-y-3 px-2 pb-2">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onReset}
              className="rounded-full bg-taupe-100 px-3 py-1.5 text-xs font-semibold text-taupe-600 active:bg-taupe-200"
            >
              Reset semua
            </button>
          </div>

          <FilterFieldButton
            label="Karyawan"
            value={selectedEmployee?.name ?? null}
            placeholder="Semua karyawan"
            active={selectedEmployee !== null}
            icon={<UserIcon className="size-4 text-taupe-400" />}
            onClick={() => setEmployeeSelectorOpen(true)}
            onClear={() => onEmployeeChange(null)}
          />
          <FilterFieldButton
            label="Kantor"
            value={selectedOffice?.name ?? null}
            placeholder="Semua kantor"
            active={selectedOffice !== null}
            icon={<EnterpriseIcon className="size-4 text-taupe-400" />}
            onClick={() => setOfficeSelectorOpen(true)}
            onClear={() => onOfficeChange(null)}
          />
          {showStatusFilter && (
            <FilterFieldButton
              label="Status"
              value={status === "all" ? null : statusLabel(status)}
              placeholder="Semua status"
              active={status !== "all"}
              icon={<FilterIcon className="size-4 text-taupe-400" />}
              onClick={() => setStatusSelectorOpen(true)}
              onClear={() => onStatusChange("all")}
            />
          )}
          <FilterFieldButton
            label="Tanggal"
            value={dateRangeLabel(dateRangeActive, startDate, endDate)}
            placeholder="Semua tanggal"
            active={dateRangeActive}
            icon={<FilterIcon className="size-4 text-taupe-400" />}
            onClick={() => setDateSelectorOpen(true)}
            onClear={() => onDateRangeActiveChange(false)}
          />

          <Button
            variant={hasFilters ? "primary" : "secondary"}
            fullWidth
            className="h-11"
            onClick={onClose}
          >
            Terapkan
          </Button>
        </div>
      </BottomSheet>

      <SearchableSelectionDialog
        open={employeeSelectorOpen}
        onClose={() => setEmployeeSelectorOpen(false)}
        title="Pilih Karyawan"
        searchValue={employeeSearch}
        onSearchChange={setEmployeeSearch}
        searchPlaceholder="Cari karyawan"
        options={employeeSelectionOptions}
        selectedValue={selectedEmployee?.id ?? null}
        onSelect={(option) => {
          if (option.value === null) {
            onEmployeeChange(null);
            return;
          }

          const employee =
            employeeOptions.find((item) => item.id === option.value) ?? null;
          onEmployeeChange(employee);
        }}
        loading={loadingEmployees}
        error={employeeError ? "Gagal memuat karyawan." : ""}
        emptyMessage="Tidak ada karyawan ditemukan"
      />

      <SearchableSelectionDialog
        open={officeSelectorOpen}
        onClose={() => setOfficeSelectorOpen(false)}
        title="Pilih Kantor"
        searchValue={officeSearch}
        onSearchChange={setOfficeSearch}
        searchPlaceholder="Cari kantor"
        options={officeSelectionOptions}
        selectedValue={selectedOffice?.id ?? null}
        onSelect={(option) => {
          if (option.value === null) {
            onOfficeChange(null);
            return;
          }

          const office =
            officeOptions.find((item) => item.id === option.value) ?? null;
          onOfficeChange(office);
        }}
        loading={loadingOffices}
        error={officeError ? "Gagal memuat kantor." : ""}
        emptyMessage="Tidak ada kantor ditemukan"
      />

      {showStatusFilter && (
        <SearchableSelectionDialog
          open={statusSelectorOpen}
          onClose={() => setStatusSelectorOpen(false)}
          title="Pilih Status"
          options={statusOptions}
          selectedValue={status}
          onSelect={(option) => onStatusChange(option.value as AttendanceStatusKey | "all")}
          searchable={false}
        />
      )}

      <BottomSheet
        open={dateSelectorOpen}
        onClose={() => setDateSelectorOpen(false)}
        title="Pilih Tanggal"
      >
        <div className="space-y-4 px-2 pb-2">
          <button
            type="button"
            onClick={() => onDateRangeActiveChange(!dateRangeActive)}
            className={`flex min-h-12 w-full items-center gap-3 rounded-2xl px-4 py-3 text-left ring-1 transition-colors active:bg-taupe-50 ${
              dateRangeActive ? "bg-emerald-50 ring-primary" : "bg-white ring-taupe-200"
            }`}
          >
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-foreground">
                Rentang tanggal
              </span>
              <span className="block text-xs text-taupe-400">
                {dateRangeActive ? "Aktif" : "Semua tanggal"}
              </span>
            </span>
            <span
              className={`h-6 w-10 rounded-full p-0.5 transition-colors ${
                dateRangeActive ? "bg-primary" : "bg-taupe-200"
              }`}
              aria-hidden="true"
            >
              <span
                className={`block size-5 rounded-full bg-white transition-transform ${
                  dateRangeActive ? "translate-x-4" : ""
                }`}
              />
            </span>
          </button>

          {dateRangeActive && (
            <DateRangeFields
              startDate={startDate}
              endDate={endDate}
              maxDate={maxDate}
              onStartDateChange={onStartDateChange}
              onEndDateChange={onEndDateChange}
            />
          )}

          <Button
            variant="primary"
            fullWidth
            className="h-11"
            onClick={() => setDateSelectorOpen(false)}
          >
            Simpan Tanggal
          </Button>
        </div>
      </BottomSheet>
    </>
  );
}
