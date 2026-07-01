"use client";

import type { AttendanceStatusKey } from "@/lib/attendance-status";
import { statusLabel } from "@/lib/attendance-status";
import type { Employee, Office } from "@/lib/api/types";
import { formatDateKey } from "@/app/components/date-range-fields";

type PresenceFilterChipsProps = {
  selectedEmployee?: Employee | null;
  selectedOffice?: Office | null;
  status: AttendanceStatusKey | "all";
  dateRangeActive: boolean;
  startDate: string;
  endDate: string;
  onClearEmployee: () => void;
  onClearOffice: () => void;
  onClearStatus: () => void;
  onClearDateRange: () => void;
  onClearAll: () => void;
};

function Chip({
  label,
  onClear,
}: {
  label: string;
  onClear: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClear}
      className="flex max-w-full items-center gap-2 rounded-full bg-taupe-100 px-3 py-1.5 text-xs font-semibold text-taupe-600 active:bg-taupe-200"
    >
      <span className="truncate">{label}</span>
      <span aria-hidden="true">x</span>
    </button>
  );
}

export function PresenceFilterChips({
  selectedEmployee,
  selectedOffice,
  status,
  dateRangeActive,
  startDate,
  endDate,
  onClearEmployee,
  onClearOffice,
  onClearStatus,
  onClearDateRange,
  onClearAll,
}: PresenceFilterChipsProps) {
  const hasFilters =
    !!selectedEmployee ||
    !!selectedOffice ||
    status !== "all" ||
    dateRangeActive;

  if (!hasFilters) return null;

  const dateLabel =
    startDate === endDate
      ? formatDateKey(startDate)
      : `${formatDateKey(startDate)} - ${formatDateKey(endDate)}`;

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      {selectedEmployee && (
        <Chip label={selectedEmployee.name} onClear={onClearEmployee} />
      )}
      {selectedOffice && (
        <Chip label={selectedOffice.name} onClear={onClearOffice} />
      )}
      {status !== "all" && (
        <Chip label={statusLabel(status)} onClear={onClearStatus} />
      )}
      {dateRangeActive && (
        <Chip label={dateLabel} onClear={onClearDateRange} />
      )}
      <button
        type="button"
        onClick={onClearAll}
        className="rounded-full px-2 py-1 text-xs font-semibold text-taupe-500 active:opacity-70"
      >
        Reset
      </button>
    </div>
  );
}
