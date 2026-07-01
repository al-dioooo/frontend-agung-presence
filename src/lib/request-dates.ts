import type { AttendanceRequest } from "@/lib/api/types";

export const INVALID_REQUEST_DATE_RANGE_MESSAGE =
  "Tanggal mulai tidak boleh lebih besar dari tanggal akhir.";

type DateRangeLike = Pick<AttendanceRequest, "start_date" | "end_date"> & {
  workday_count?: number;
};

function parseDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  if (!year || !month || !day) return null;

  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

export function formatDateKey(dateKey: string) {
  const date = parseDateKey(dateKey);
  if (!date) return dateKey;

  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function isInvalidRequestDateRange(startDate: string, endDate: string) {
  const start = parseDateKey(startDate);
  const end = parseDateKey(endDate);

  if (!start || !end) return true;

  return start.getTime() > end.getTime();
}

export function countRequestWorkdays(startDate: string, endDate: string) {
  const start = parseDateKey(startDate);
  const end = parseDateKey(endDate);

  if (!start || !end || start.getTime() > end.getTime()) return 0;

  let count = 0;
  const cursor = new Date(start);

  while (cursor.getTime() <= end.getTime()) {
    if (cursor.getDay() !== 0) count += 1;
    cursor.setDate(cursor.getDate() + 1);
  }

  return count;
}

export function getRequestWorkdayCount(request: DateRangeLike) {
  if (typeof request.workday_count === "number") return request.workday_count;

  return countRequestWorkdays(request.start_date, request.end_date);
}

export function formatRequestWorkdayTotal(count: number) {
  return `${count} hari kerja`;
}

export function formatRequestDateRange(request: DateRangeLike) {
  if (request.start_date === request.end_date) {
    return formatDateKey(request.start_date);
  }

  return `${formatDateKey(request.start_date)} - ${formatDateKey(
    request.end_date,
  )}`;
}
