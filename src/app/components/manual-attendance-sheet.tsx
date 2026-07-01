"use client";

import { useState } from "react";
import type {
  Employee,
  ManualAttendanceInput,
  ManualAttendanceStatus,
} from "@/lib/api/types";
import { MANUAL_STATUS_OPTIONS, statusLabel } from "@/lib/attendance-status";
import {
  countRequestWorkdays,
  formatDateKey,
  formatRequestWorkdayTotal,
  isInvalidRequestDateRange,
} from "@/lib/request-dates";
import { Button } from "@/components/ui";
import { BottomSheet } from "@/app/components/bottom-sheet";
import { DateRangeFields } from "@/app/components/date-range-fields";
import {
  FilterFieldButton,
  SearchableSelectionDialog,
  type FilterSelectionOption,
} from "@/app/components/filter-controls";
import { useEmployeeFilterOptions } from "@/app/components/filter-option-hooks";
import { FilterIcon, UserIcon } from "@/components/icons/outline";

type ManualAttendanceSheetProps = {
  open: boolean;
  onClose: () => void;
  maxDate: string;
  error: string;
  submitting: boolean;
  onSubmit: (input: ManualAttendanceInput) => Promise<boolean>;
};

function dateRangeLabel(startDate: string, endDate: string) {
  if (startDate === endDate) return formatDateKey(startDate);

  return `${formatDateKey(startDate)} - ${formatDateKey(endDate)}`;
}

export function ManualAttendanceSheet({
  open,
  onClose,
  maxDate,
  error,
  submitting,
  onSubmit,
}: ManualAttendanceSheetProps) {
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [manualStatus, setManualStatus] =
    useState<ManualAttendanceStatus>("sick");
  const [startDate, setStartDate] = useState(maxDate);
  const [endDate, setEndDate] = useState(maxDate);
  const [employeeSelectorOpen, setEmployeeSelectorOpen] = useState(false);
  const [statusSelectorOpen, setStatusSelectorOpen] = useState(false);
  const [dateSelectorOpen, setDateSelectorOpen] = useState(false);
  const [employeeSearch, setEmployeeSearch] = useState("");

  const {
    data: employeeOptions = [],
    isLoading: loadingEmployees,
    error: employeeError,
  } = useEmployeeFilterOptions({
    open: employeeSelectorOpen,
    search: employeeSearch,
    role: "employee",
  });

  const invalidDateRange = isInvalidRequestDateRange(startDate, endDate);
  const workdayCount = invalidDateRange
    ? 0
    : countRequestWorkdays(startDate, endDate);
  const dateError =
    !invalidDateRange && workdayCount === 0
      ? "Rentang tanggal harus memiliki minimal 1 hari kerja."
      : "";
  const submitDisabled =
    selectedEmployee === null || invalidDateRange || workdayCount === 0;
  const selectedDateLabel = dateRangeLabel(startDate, endDate);

  const employeeSelectionOptions: FilterSelectionOption[] = employeeOptions.map(
    (employee) => ({
      value: employee.id,
      title: employee.name,
      subtitle: `@${employee.username} · ${employee.email}`,
      icon: <UserIcon className="size-4 text-taupe-400" />,
    }),
  );
  const statusOptions: FilterSelectionOption[] = MANUAL_STATUS_OPTIONS.map(
    (option) => ({
      value: option.value,
      title: option.label,
      subtitle: option.description,
      icon: <FilterIcon className="size-4 text-taupe-400" />,
    }),
  );

  function resetForm() {
    setSelectedEmployee(null);
    setManualStatus("sick");
    setStartDate(maxDate);
    setEndDate(maxDate);
    setEmployeeSearch("");
  }

  function closeAll() {
    setEmployeeSelectorOpen(false);
    setStatusSelectorOpen(false);
    setDateSelectorOpen(false);
    onClose();
  }

  async function handleSubmit() {
    if (!selectedEmployee || submitDisabled) return;

    const submitted = await onSubmit({
      user_id: selectedEmployee.id,
      start_date: startDate,
      end_date: endDate,
      status: manualStatus,
    });

    if (submitted) {
      resetForm();
      closeAll();
    }
  }

  return (
    <>
      <BottomSheet open={open} onClose={closeAll} title="Input Cuti / Sakit / Izin">
        <div className="space-y-3 px-2 pb-2">
          <FilterFieldButton
            label="Karyawan"
            value={selectedEmployee?.name ?? null}
            placeholder="Pilih karyawan"
            active={selectedEmployee !== null}
            icon={<UserIcon className="size-4 text-taupe-400" />}
            onClick={() => setEmployeeSelectorOpen(true)}
            onClear={() => setSelectedEmployee(null)}
          />
          <FilterFieldButton
            label="Status"
            value={statusLabel(manualStatus)}
            placeholder="Sakit"
            icon={<FilterIcon className="size-4 text-taupe-400" />}
            onClick={() => setStatusSelectorOpen(true)}
          />
          <FilterFieldButton
            label="Tanggal"
            value={selectedDateLabel}
            placeholder="Pilih tanggal"
            icon={<FilterIcon className="size-4 text-taupe-400" />}
            onClick={() => setDateSelectorOpen(true)}
          />

          {selectedEmployee && (
            <p className="rounded-2xl bg-taupe-50 px-4 py-3 text-xs text-taupe-500">
              {selectedEmployee.name} akan ditandai {statusLabel(manualStatus)} untuk{" "}
              {formatRequestWorkdayTotal(workdayCount)}, {selectedDateLabel}.
            </p>
          )}

          {error && (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
              {error}
            </p>
          )}

          <Button
            variant="primary"
            fullWidth
            className="h-12"
            disabled={submitDisabled}
            loading={submitting}
            loadingText="Menyimpan..."
            onClick={handleSubmit}
          >
            Simpan
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
          const employee =
            employeeOptions.find((item) => item.id === option.value) ?? null;
          setSelectedEmployee(employee);
        }}
        loading={loadingEmployees}
        error={employeeError ? "Gagal memuat karyawan." : ""}
        emptyMessage="Tidak ada karyawan ditemukan"
      />

      <SearchableSelectionDialog
        open={statusSelectorOpen}
        onClose={() => setStatusSelectorOpen(false)}
        title="Pilih Status"
        options={statusOptions}
        selectedValue={manualStatus}
        onSelect={(option) =>
          setManualStatus(option.value as ManualAttendanceStatus)
        }
        searchable={false}
      />

      <BottomSheet
        open={dateSelectorOpen}
        onClose={() => setDateSelectorOpen(false)}
        title="Pilih Tanggal"
      >
        <div className="space-y-4 px-2 pb-2">
          <DateRangeFields
            startDate={startDate}
            endDate={endDate}
            maxDate={maxDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
            error={dateError}
          />

          <Button
            variant="primary"
            fullWidth
            className="h-11"
            onClick={() => setDateSelectorOpen(false)}
            disabled={invalidDateRange || workdayCount === 0}
          >
            Simpan Tanggal
          </Button>
        </div>
      </BottomSheet>
    </>
  );
}
