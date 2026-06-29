"use client";

import { useState } from "react";
import { ChevronRightIcon } from "@/components/icons/outline";
import { MobileDatePicker } from "@/app/components/mobile-date-picker";

type DateField = "start" | "end";

type DateRangeFieldsProps = {
  startDate: string;
  endDate: string;
  maxDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  error?: string;
};

export function formatDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function DateButton({
  label,
  value,
  onClick,
}: {
  label: string;
  value: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-16 w-full items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 text-left ring-1 ring-taupe-200 transition-shadow active:bg-taupe-50 focus:outline-none focus:ring-2 focus:ring-primary"
    >
      <span className="min-w-0">
        <span className="block text-sm font-medium text-foreground">{label}</span>
        <span className="mt-0.5 block truncate text-xs text-taupe-400">
          {formatDateKey(value)}
        </span>
      </span>
      <ChevronRightIcon
        className="size-5 shrink-0 text-taupe-400"
        strokeWidth={2}
      />
    </button>
  );
}

export function DateRangeFields({
  startDate,
  endDate,
  maxDate,
  onStartDateChange,
  onEndDateChange,
  error,
}: DateRangeFieldsProps) {
  const [activeField, setActiveField] = useState<DateField | null>(null);
  const invalidRange = startDate > endDate;
  const message =
    error ??
    (invalidRange
      ? "Tanggal mulai tidak boleh lebih besar dari tanggal akhir."
      : "");

  function handleConfirm(date: string) {
    if (activeField === "start") onStartDateChange(date);
    if (activeField === "end") onEndDateChange(date);
    setActiveField(null);
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <DateButton
          label="Tanggal Mulai"
          value={startDate}
          onClick={() => setActiveField("start")}
        />
        <DateButton
          label="Tanggal Akhir"
          value={endDate}
          onClick={() => setActiveField("end")}
        />
      </div>
      {message && (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
          {message}
        </p>
      )}
      <MobileDatePicker
        open={activeField !== null}
        value={activeField === "end" ? endDate : startDate}
        maxDate={maxDate}
        title={
          activeField === "end" ? "Pilih Tanggal Akhir" : "Pilih Tanggal Mulai"
        }
        onClose={() => setActiveField(null)}
        onConfirm={handleConfirm}
      />
    </div>
  );
}
