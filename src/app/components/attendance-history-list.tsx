"use client";

import type { Attendance } from "@/lib/api/types";
import {
  isManualAttendance,
  statusLabel,
  statusTextClass,
} from "@/lib/attendance-status";
import { Card } from "@/components/ui";
import { ChevronRightIcon } from "@/components/icons/outline";

type AttendanceHistoryListProps = {
  attendances: Attendance[];
  loading?: boolean;
  isAdministrator?: boolean;
  emptyMessage: string;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(iso: string | null) {
  if (!iso) return "--:--";
  return new Date(iso).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AttendanceHistoryList({
  attendances,
  loading = false,
  isAdministrator = false,
  emptyMessage,
}: AttendanceHistoryListProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="h-20 animate-pulse rounded-2xl bg-white ring-1 ring-taupe-200 shadow-sm"
          />
        ))}
      </div>
    );
  }

  if (attendances.length === 0) {
    return (
      <p className="mt-10 text-center text-sm text-taupe-400">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div id="presence-list" className="space-y-2">
      {attendances.map((attendance) => (
        <Card
          key={attendance.id}
          href={`/presence/${attendance.id}`}
          id={`attendance-${attendance.id}`}
          className="flex items-center justify-between gap-3 px-4 py-3.5"
        >
          <div className="min-w-0 flex-1">
            {isAdministrator && attendance.user && (
              <p className="mb-0.5 truncate text-xs font-semibold text-foreground">
                {attendance.user.name}
              </p>
            )}
            <p className="text-sm font-medium text-foreground">
              {attendance.office?.name ??
                (isManualAttendance(attendance)
                  ? "Input Manual"
                  : `Office #${attendance.office_id}`)}
            </p>
            <p className="mt-0.5 text-xs text-taupe-400">
              {formatDate(attendance.date)}
            </p>
            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-taupe-400">
              {isManualAttendance(attendance) ? (
                <span>Tidak memerlukan waktu absen</span>
              ) : (
                <>
                  <span>Masuk: {formatTime(attendance.in_at)}</span>
                  <span>Keluar: {formatTime(attendance.out_at)}</span>
                </>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className={`text-xs font-semibold ${statusTextClass(attendance.status)}`}>
              {statusLabel(attendance.status)}
            </span>
            <ChevronRightIcon strokeWidth={2.5} className="size-4 text-taupe-300" />
          </div>
        </Card>
      ))}
    </div>
  );
}
