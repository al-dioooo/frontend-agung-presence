"use client";

import type { AttendanceStatusKey } from "@/lib/attendance-status";
import { STATUS_KEYS, statusLabel } from "@/lib/attendance-status";
import type { Employee, Office } from "@/lib/api/types";
import { BottomSheet } from "@/app/components/bottom-sheet";
import { DateRangeFields } from "@/app/components/date-range-fields";
import {
  EnterpriseIcon,
  FilterIcon,
  UserIcon,
} from "@/components/icons/outline";

type PresenceFilterSheetProps = {
  open: boolean;
  onClose: () => void;
  employees: Employee[];
  offices: Office[];
  loadingEmployees?: boolean;
  loadingOffices?: boolean;
  selectedUserId: number | null;
  selectedOfficeId: number | null;
  status: AttendanceStatusKey | "all";
  dateRangeActive: boolean;
  startDate: string;
  endDate: string;
  maxDate: string;
  onUserChange: (userId: number | null) => void;
  onOfficeChange: (officeId: number | null) => void;
  onStatusChange: (status: AttendanceStatusKey | "all") => void;
  onDateRangeActiveChange: (active: boolean) => void;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onReset: () => void;
};

function OptionButton({
  icon,
  title,
  subtitle,
  selected,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm transition-colors active:bg-taupe-50 ${
        selected ? "bg-taupe-50" : ""
      }`}
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-taupe-100">
        {icon}
      </span>
      <span className="min-w-0 flex-1 text-left">
        <span className="block truncate font-medium text-foreground">
          {title}
        </span>
        {subtitle && (
          <span className="block truncate text-xs text-taupe-400">
            {subtitle}
          </span>
        )}
      </span>
      {selected && <span className="size-2 rounded-full bg-primary" />}
    </button>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <p className="px-2 text-xs font-semibold uppercase text-taupe-400">
        {title}
      </p>
      {children}
    </section>
  );
}

export function PresenceFilterSheet({
  open,
  onClose,
  employees,
  offices,
  loadingEmployees = false,
  loadingOffices = false,
  selectedUserId,
  selectedOfficeId,
  status,
  dateRangeActive,
  startDate,
  endDate,
  maxDate,
  onUserChange,
  onOfficeChange,
  onStatusChange,
  onDateRangeActiveChange,
  onStartDateChange,
  onEndDateChange,
  onReset,
}: PresenceFilterSheetProps) {
  return (
    <BottomSheet open={open} onClose={onClose} title="Filter Riwayat">
      <div className="space-y-5 px-2 pb-2">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onReset}
            className="rounded-full bg-taupe-100 px-3 py-1.5 text-xs font-semibold text-taupe-600 active:bg-taupe-200"
          >
            Reset semua
          </button>
        </div>

        <Section title="Karyawan">
          <div className="space-y-1">
            <OptionButton
              icon={<UserIcon className="size-4 text-taupe-400" />}
              title="Semua karyawan"
              subtitle="Tampilkan seluruh riwayat"
              selected={selectedUserId === null}
              onClick={() => onUserChange(null)}
            />
            {loadingEmployees ? (
              Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="h-16 animate-pulse rounded-2xl bg-taupe-100"
                />
              ))
            ) : (
              employees.map((employee) => (
                <OptionButton
                  key={employee.id}
                  icon={<UserIcon className="size-4 text-taupe-400" />}
                  title={employee.name}
                  subtitle={`@${employee.username} · ${employee.email}`}
                  selected={selectedUserId === employee.id}
                  onClick={() => onUserChange(employee.id)}
                />
              ))
            )}
          </div>
        </Section>

        <Section title="Status">
          <div className="grid grid-cols-2 gap-2">
            {(["all", ...STATUS_KEYS] as const).map((option) => {
              const selected = status === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => onStatusChange(option)}
                  className={`min-h-12 rounded-2xl px-3 py-2 text-left text-sm font-semibold ring-1 transition-colors active:bg-taupe-50 ${
                    selected
                      ? "bg-emerald-50 text-foreground ring-primary"
                      : "bg-white text-taupe-500 ring-taupe-200"
                  }`}
                >
                  {option === "all" ? "Semua" : statusLabel(option)}
                </button>
              );
            })}
          </div>
        </Section>

        <Section title="Kantor">
          <div className="space-y-1">
            <OptionButton
              icon={<EnterpriseIcon className="size-4 text-taupe-400" />}
              title="Semua kantor"
              subtitle="Tidak membatasi lokasi kantor"
              selected={selectedOfficeId === null}
              onClick={() => onOfficeChange(null)}
            />
            {loadingOffices ? (
              Array.from({ length: 2 }).map((_, index) => (
                <div
                  key={index}
                  className="h-16 animate-pulse rounded-2xl bg-taupe-100"
                />
              ))
            ) : (
              offices.map((office) => (
                <OptionButton
                  key={office.id}
                  icon={<EnterpriseIcon className="size-4 text-taupe-400" />}
                  title={office.name}
                  subtitle={office.address ?? "Tanpa alamat"}
                  selected={selectedOfficeId === office.id}
                  onClick={() => onOfficeChange(office.id)}
                />
              ))
            )}
          </div>
        </Section>

        <Section title="Tanggal">
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => onDateRangeActiveChange(!dateRangeActive)}
              className={`flex min-h-12 w-full items-center gap-3 rounded-2xl px-4 py-3 text-left ring-1 transition-colors active:bg-taupe-50 ${
                dateRangeActive
                  ? "bg-emerald-50 ring-primary"
                  : "bg-white ring-taupe-200"
              }`}
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-taupe-100">
                <FilterIcon className="size-4 text-taupe-400" />
              </span>
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
          </div>
        </Section>
      </div>
    </BottomSheet>
  );
}
