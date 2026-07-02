"use client";

import type { Attendance } from "@/lib/api/types";
import {
  isManualAttendance,
  statusLabel,
  statusTextClass,
} from "@/lib/attendance-status";
import { Card } from "@/components/ui";
import { ChevronRightIcon, EyeIcon } from "@/components/icons/outline";
import { ResponsiveDataTable } from "@/app/components/responsive-data-table";
import {
  TableActionGroup,
  TableActionLink,
} from "@/app/components/table-row-actions";

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

function attendanceKey(attendance: Attendance) {
  return (
    attendance.id ??
    attendance.virtual_key ??
    `${attendance.user_id}-${attendance.date}-${attendance.status}`
  );
}

function canOpenDetail(attendance: Attendance) {
  return attendance.id !== null && !attendance.is_virtual;
}

function officeLabel(attendance: Attendance) {
  if (attendance.office?.name) return attendance.office.name;
  if (isManualAttendance(attendance)) return "Input Manual";
  if (attendance.status === "absent" && attendance.office_id === null) {
    return attendance.is_virtual ? "Belum check-in" : "Tidak Hadir";
  }

  return attendance.office_id ? `Office #${attendance.office_id}` : "-";
}

function timeLabel(attendance: Attendance) {
  if (attendance.status === "absent" && attendance.in_at === null) {
    return "Belum check-in";
  }

  if (isManualAttendance(attendance)) {
    return "Tidak diperlukan";
  }

  return null;
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
            <span className="block truncate">{officeLabel(attendance)}</span>
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
          cell: (attendance: Attendance) => {
            const label = timeLabel(attendance);

            return label ? (
              <span className="text-taupe-400">{label}</span>
            ) : (
              <span className="block text-xs leading-5 text-taupe-500">
                Masuk {formatTime(attendance.in_at)}
                <br />
                Keluar {formatTime(attendance.out_at)}
              </span>
            );
          },
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
        {
          key: "action",
          header: "Aksi",
          cell: (attendance: Attendance) =>
            canOpenDetail(attendance) ? (
              <TableActionGroup>
                <TableActionLink
                  href={`/presence/${attendance.id}`}
                  label={`Lihat detail absensi #${attendance.id}`}
                >
                  <EyeIcon className="size-4" />
                </TableActionLink>
              </TableActionGroup>
            ) : (
              <span className="text-xs font-semibold text-taupe-400">
                Proyeksi
              </span>
            ),
          align: "right" as const,
          className: "w-[10%]",
        },
      ]}
      rows={attendances}
      getRowKey={attendanceKey}
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
        {attendances.map((attendance) => {
          const detailHref = canOpenDetail(attendance)
            ? `/presence/${attendance.id}`
            : undefined;
          const label = timeLabel(attendance);

          return (
            <Card
              key={attendanceKey(attendance)}
              href={detailHref}
              id={`attendance-${attendanceKey(attendance)}`}
              className="flex items-center justify-between gap-3 px-4 py-3.5"
            >
              <div className="min-w-0 flex-1">
                {isAdministrator && attendance.user && (
                  <p className="mb-0.5 truncate text-xs font-semibold text-foreground">
                    {attendance.user.name}
                  </p>
                )}
                <p className="text-sm font-medium text-foreground">
                  {officeLabel(attendance)}
                </p>
                <p className="mt-0.5 text-xs text-taupe-400">
                  {formatDate(attendance.date)}
                </p>
                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-taupe-400">
                  {label ? (
                    <span>{label}</span>
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
                {detailHref ? (
                  <ChevronRightIcon strokeWidth={2.5} className="size-4 text-taupe-300" />
                ) : (
                  <span className="rounded-full bg-taupe-100 px-2 py-1 text-[10px] font-semibold text-taupe-500">
                    Proyeksi
                  </span>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}
