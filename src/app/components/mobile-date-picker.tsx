"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronBackIcon, ChevronRightIcon } from "@/components/icons/outline";
import { Button } from "@/components/ui";

type MobileDatePickerProps = {
  open: boolean;
  value: string;
  maxDate: string;
  title?: string;
  onClose: () => void;
  onConfirm: (date: string) => void;
};

type CalendarDay = {
  date: Date;
  key: string;
  day: number;
  inCurrentMonth: boolean;
  disabled: boolean;
};

const MONTH_NAMES = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const DAY_NAMES = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

function parseDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, months: number) {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

function isSameMonth(left: Date, right: Date) {
  return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth();
}

function isAfterDate(left: Date, right: Date) {
  return toDateKey(left) > toDateKey(right);
}

function buildCalendarDays(displayMonth: Date, maxDate: Date): CalendarDay[] {
  const monthStart = startOfMonth(displayMonth);
  const gridStart = new Date(monthStart);
  gridStart.setDate(monthStart.getDate() - monthStart.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);

    return {
      date,
      key: toDateKey(date),
      day: date.getDate(),
      inCurrentMonth: isSameMonth(date, monthStart),
      disabled: isAfterDate(date, maxDate),
    };
  });
}

function formatMonthYear(date: Date) {
  return `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
}

export function MobileDatePicker({
  open,
  value,
  maxDate,
  title = "Pilih Tanggal",
  onClose,
  onConfirm,
}: MobileDatePickerProps) {
  const max = useMemo(() => parseDateKey(maxDate), [maxDate]);

  useEffect(() => {
    if (!open) return;

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, open]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[90] flex items-end justify-center lg:items-center lg:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/35"
          />

          <motion.div
            key={value}
            initial={{ y: "100%", opacity: 0.98 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0.98 }}
            transition={{ type: "spring", stiffness: 360, damping: 36 }}
            className="relative z-10 w-full max-w-md rounded-t-3xl bg-white pb-[max(env(safe-area-inset-bottom),1.25rem)] shadow-2xl lg:rounded-2xl lg:pb-6"
            role="dialog"
            aria-modal="true"
            aria-label={title}
          >
            <DatePickerPanel
              value={value}
              max={max}
              title={title}
              onClose={onClose}
              onConfirm={onConfirm}
            />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function DatePickerPanel({
  value,
  max,
  title,
  onClose,
  onConfirm,
}: {
  value: string;
  max: Date;
  title: string;
  onClose: () => void;
  onConfirm: (date: string) => void;
}) {
  const [draftDate, setDraftDate] = useState(value);
  const [displayMonth, setDisplayMonth] = useState(() => startOfMonth(parseDateKey(value)));
  const days = useMemo(
    () => buildCalendarDays(displayMonth, max),
    [displayMonth, max],
  );
  const nextMonth = addMonths(displayMonth, 1);
  const nextDisabled = nextMonth > startOfMonth(max);

  return (
    <>
      <div className="flex justify-center pt-3 pb-1 lg:hidden">
        <div className="h-1 w-10 rounded-full bg-taupe-200" />
      </div>

      <div className="flex items-start justify-between gap-3">
        <h3 className="px-6 pt-3 text-base font-bold text-foreground lg:pt-5">{title}</h3>
        <button
          type="button"
          onClick={onClose}
          className="mr-5 mt-2 flex size-8 shrink-0 items-center justify-center rounded-full bg-taupe-100 text-taupe-500 transition-opacity active:opacity-70"
          aria-label="Tutup pemilih tanggal"
        >
          <svg
            viewBox="0 0 24 24"
            className="size-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="px-5 pt-4 lg:px-6">
        <div className="mb-5 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setDisplayMonth((current) => addMonths(current, -1))}
            className="flex size-11 items-center justify-center rounded-full text-taupe-500 transition-colors active:bg-taupe-100"
            aria-label="Bulan sebelumnya"
          >
            <ChevronBackIcon className="size-6" strokeWidth={2} />
          </button>

          <p className="text-xl font-bold text-foreground">
            {formatMonthYear(displayMonth)}
          </p>

          <button
            type="button"
            onClick={() => setDisplayMonth(nextMonth)}
            disabled={nextDisabled}
            className="flex size-11 items-center justify-center rounded-full text-taupe-500 transition-colors active:bg-taupe-100 disabled:opacity-30"
            aria-label="Bulan berikutnya"
          >
            <ChevronRightIcon className="size-6" strokeWidth={2} />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-y-3">
          {DAY_NAMES.map((day) => (
            <div
              key={day}
              className="flex h-8 items-center justify-center text-xs font-semibold text-taupe-400"
            >
              {day}
            </div>
          ))}

          {days.map((day) => {
            const selected = draftDate === day.key;
            const base =
              "mx-auto flex size-10 items-center justify-center rounded-full text-sm font-semibold transition-colors";
            const tone = selected
              ? "bg-foreground text-white"
              : day.disabled
                ? "bg-taupe-100/60 text-taupe-300 line-through"
                : day.inCurrentMonth
                  ? "bg-taupe-100 text-foreground active:bg-taupe-200"
                  : "bg-taupe-100/70 text-taupe-400 active:bg-taupe-200";

            return (
              <button
                key={day.key}
                type="button"
                disabled={day.disabled}
                onClick={() => setDraftDate(day.key)}
                className={`${base} ${tone}`}
                aria-pressed={selected}
                aria-label={day.key}
              >
                {day.day}
              </button>
            );
          })}
        </div>

        <Button
          variant="success"
          fullWidth
          disabled={!draftDate}
          onClick={() => onConfirm(draftDate)}
          className="mt-8 h-14 text-base"
        >
          Selesai
        </Button>
      </div>
    </>
  );
}
