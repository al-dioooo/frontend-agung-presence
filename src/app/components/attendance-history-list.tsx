"use client";

import type { Attendance } from "@/lib/api/types";
import {
  isManualAttendance,
  statusLabel,
  statusTextClass,
} from "@/lib/attendance-status";
import { Card } from "@/components/ui";
import { ChevronRightIcon } from "@/components/icons/outline";
import { ResponsiveDataTable } from "@/app/components/responsive-data-table";

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
  const table = (
    <ResponsiveDataTable
      aria-label="Riwayat absensi"
      columns={[
        ...(isAdministrator
          ? [
              {
                key: "employee",
                header: "Karyawan",
                cell: (attendance: Attendance) => (
                  <div className="min-w-0">
                    <p className="truncate font-semibold">
                      {attendance.user?.name ?? `User #${attendance.user_id}`}
                    </p>
                    {attendance.user?.email && (
                      <p className="truncate text-xs text-taupe-400">
                        {attendance.user.email}
                      </p>
                    )}
                  </div>
                ),
                className: "w-[22%]",
              },
            ]
          : []),
        {
          key: "office",
          header: "Kantor",
          cell: (attendance: Attendance) => (
            <span className="block truncate">
              {attendance.office?.name ??
                (isManualAttendance(attendance)
                  ? "Input Manual"
                  : `Office #${attendance.office_id}`)}
            </span>
          ),
          className: "w-[20%]",
        },
        {
          key: "date",
          header: "Tanggal",
          cell: (attendance: Attendance) => formatDate(attendance.date),
          className: "w-[16%] text-taupe-500",
        },
        {
          key: "time",
          header: "Waktu",
          cell: (attendance: Attendance) =>
            isManualAttendance(attendance) ? (
              <span className="text-taupe-400">Tidak diperlukan</span>
            ) : (
              <span className="block text-xs leading-5 text-taupe-500">
                Masuk {formatTime(attendance.in_at)}
                <br />
                Keluar {formatTime(attendance.out_at)}
              </span>
            ),
          className: "w-[18%]",
        },
        {
          key: "photo",
          header: "Foto",
          cell: (attendance: Attendance) => (
            <span className="rounded-full bg-taupe-100 px-2 py-1 text-xs font-semibold text-taupe-500">
              {attendance.proof_photo ? "Ada" : "-"}
            </span>
          ),
          align: "center" as const,
          className: "w-[10%]",
        },
        {
          key: "status",
          header: "Status",
          cell: (attendance: Attendance) => (
            <span className={`text-xs font-semibold ${statusTextClass(attendance.status)}`}>
              {statusLabel(attendance.status)}
            </span>
          ),
          align: "right" as const,
          className: "w-[14%]",
        },
      ]}
      rows={attendances}
      getRowKey={(attendance) => attendance.id}
      emptyMessage={emptyMessage}
      loading={loading}
    />
  );

  if (loading) {
    return (
      <>
        {table}
        <div className="space-y-2 lg:hidden">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-20 animate-pulse rounded-2xl bg-white ring-1 ring-taupe-200 shadow-sm"
            />
          ))}
        </div>
      </>
    );
  }

  if (attendances.length === 0) {
    return (
      <>
        {table}
        <p className="mt-10 text-center text-sm text-taupe-400 lg:hidden">
          {emptyMessage}
        </p>
      </>
    );
  }

  return (
    <>
      {table}
      <div id="presence-list" className="space-y-2 lg:hidden">
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
    </>
  );
}
