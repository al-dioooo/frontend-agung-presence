import type {
  Attendance,
  AttendanceRequestType,
  AttendanceStatus,
  ManualAttendanceStatus,
} from "@/lib/api/types";

export const STATUS_KEYS = [
  "on_time",
  "late",
  "absent",
  "sick",
  "leave",
  "permit",
] as const;

export type AttendanceStatusKey = (typeof STATUS_KEYS)[number];
export type ReportStatusFilter = "all" | AttendanceStatusKey;

export const STATUS_META: Record<
  AttendanceStatusKey,
  {
    label: string;
    color: string;
    textClass: string;
    badgeClass: string;
  }
> = {
  on_time: {
    label: "Tepat Waktu",
    color: "#10b981",
    textClass: "text-emerald-600",
    badgeClass: "bg-emerald-50 text-emerald-700",
  },
  late: {
    label: "Terlambat",
    color: "#f59e0b",
    textClass: "text-amber-500",
    badgeClass: "bg-amber-50 text-amber-600",
  },
  absent: {
    label: "Tidak Hadir",
    color: "#ef4444",
    textClass: "text-red-500",
    badgeClass: "bg-red-50 text-red-600",
  },
  sick: {
    label: "Sakit",
    color: "#38bdf8",
    textClass: "text-sky-500",
    badgeClass: "bg-sky-50 text-sky-600",
  },
  leave: {
    label: "Cuti",
    color: "#8b5cf6",
    textClass: "text-violet-500",
    badgeClass: "bg-violet-50 text-violet-600",
  },
  permit: {
    label: "Izin",
    color: "#14b8a6",
    textClass: "text-teal-600",
    badgeClass: "bg-teal-50 text-teal-700",
  },
};

export const REQUEST_STATUS_META = {
  pending: {
    label: "Menunggu",
    badgeClass: "bg-amber-50 text-amber-600",
    textClass: "text-amber-600",
  },
  approved: {
    label: "Disetujui",
    badgeClass: "bg-emerald-50 text-emerald-700",
    textClass: "text-emerald-600",
  },
  rejected: {
    label: "Ditolak",
    badgeClass: "bg-red-50 text-red-600",
    textClass: "text-red-500",
  },
} as const;

export const REQUEST_TYPE_OPTIONS: {
  value: AttendanceRequestType;
  label: string;
  description: string;
}[] = [
  { value: "sick", label: "Sakit", description: "Butuh istirahat atau perawatan" },
  { value: "leave", label: "Cuti", description: "Mengajukan cuti kerja" },
  { value: "permit", label: "Izin", description: "Izin untuk keperluan tertentu" },
];

export const MANUAL_STATUS_OPTIONS: {
  value: ManualAttendanceStatus;
  label: string;
  description: string;
}[] = [
  { value: "sick", label: "Sakit", description: "Tandai karyawan sakit" },
  { value: "leave", label: "Cuti", description: "Tandai karyawan cuti" },
  { value: "permit", label: "Izin", description: "Tandai karyawan izin" },
];

export function isAttendanceStatusKey(status: string): status is AttendanceStatusKey {
  return (STATUS_KEYS as readonly string[]).includes(status);
}

export function statusLabel(status: AttendanceStatus | AttendanceRequestType | string) {
  return isAttendanceStatusKey(status) ? STATUS_META[status].label : status;
}

export function statusTextClass(status: string) {
  return isAttendanceStatusKey(status)
    ? STATUS_META[status].textClass
    : "text-taupe-400";
}

export function statusBadgeClass(status: string) {
  return isAttendanceStatusKey(status)
    ? STATUS_META[status].badgeClass
    : "bg-taupe-100 text-taupe-500";
}

export function isManualAttendance(attendance: Pick<Attendance, "status" | "in_at">) {
  return (
    (attendance.status === "sick" ||
      attendance.status === "leave" ||
      attendance.status === "permit") &&
    attendance.in_at === null
  );
}
