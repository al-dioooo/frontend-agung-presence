import type { Attendance, AttendanceRequest } from "@/lib/api/types";
import {
  isAttendanceStatusKey,
  statusLabel,
  STATUS_META,
  type AttendanceStatusKey,
} from "@/lib/attendance-status";

export type TodayPresenceStatusKey = AttendanceStatusKey | "pending_request";

export type TodayPresenceStatusTone = {
  accentClass: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
};

export type TodayPresenceStatusModel = {
  key: TodayPresenceStatusKey;
  label: string;
  title: string;
  description: string;
  tone: TodayPresenceStatusTone;
};

const TONES: Record<TodayPresenceStatusKey, TodayPresenceStatusTone> = {
  on_time: {
    accentClass: "bg-emerald-500",
    bgClass: "bg-emerald-50",
    borderClass: "ring-emerald-200",
    textClass: "text-emerald-700",
  },
  late: {
    accentClass: "bg-amber-500",
    bgClass: "bg-amber-50",
    borderClass: "ring-amber-200",
    textClass: "text-amber-700",
  },
  absent: {
    accentClass: "bg-red-500",
    bgClass: "bg-red-50",
    borderClass: "ring-red-200",
    textClass: "text-red-700",
  },
  sick: {
    accentClass: "bg-sky-500",
    bgClass: "bg-sky-50",
    borderClass: "ring-sky-200",
    textClass: "text-sky-700",
  },
  leave: {
    accentClass: "bg-violet-500",
    bgClass: "bg-violet-50",
    borderClass: "ring-violet-200",
    textClass: "text-violet-700",
  },
  permit: {
    accentClass: "bg-teal-500",
    bgClass: "bg-teal-50",
    borderClass: "ring-teal-200",
    textClass: "text-teal-700",
  },
  pending_request: {
    accentClass: "bg-slate-500",
    bgClass: "bg-slate-50",
    borderClass: "ring-slate-200",
    textClass: "text-slate-700",
  },
};

const STATUS_COPY: Record<AttendanceStatusKey, { title: string; description: string }> = {
  on_time: {
    title: "Presensi hari ini: Tepat Waktu",
    description: "Kamu sudah melakukan absen masuk tepat waktu hari ini.",
  },
  late: {
    title: "Presensi hari ini: Terlambat",
    description: "Kamu sudah melakukan absen masuk, tetapi melewati jam masuk kantor.",
  },
  absent: {
    title: "Status hari ini: Tidak Hadir",
    description: "Belum ada presensi, izin, cuti, atau sakit yang tercatat untuk hari ini.",
  },
  sick: {
    title: "Status hari ini: Sakit",
    description: "Pengajuan sakit untuk hari ini sudah tercatat.",
  },
  leave: {
    title: "Status hari ini: Cuti",
    description: "Cuti untuk hari ini sudah tercatat.",
  },
  permit: {
    title: "Status hari ini: Izin",
    description: "Izin untuk hari ini sudah tercatat.",
  },
};

function coversDate(request: AttendanceRequest, dateKey: string) {
  return request.start_date <= dateKey && request.end_date >= dateKey;
}

function requestDescription(request: AttendanceRequest | null) {
  if (!request) {
    return "Ada pengajuan untuk hari ini yang masih menunggu persetujuan administrator.";
  }

  return `Pengajuan ${statusLabel(request.type).toLowerCase()} untuk hari ini masih menunggu persetujuan administrator.`;
}

export function pendingRequestForToday(
  requests: AttendanceRequest[],
  today: string,
) {
  return (
    requests.find(
      (request) =>
        request.approval_status === "pending" && coversDate(request, today),
    ) ?? null
  );
}

export function selectTodayAttendance(
  attendances: Attendance[],
  today: string,
) {
  const rows = attendances.filter((attendance) => attendance.date === today);

  return (
    rows.find((attendance) => attendance.in_at !== null) ??
    rows.find((attendance) => attendance.status !== "absent") ??
    rows[0] ??
    null
  );
}

export function resolveTodayPresenceStatus({
  attendances,
  pendingRequests,
  today,
}: {
  attendances: Attendance[];
  pendingRequests: AttendanceRequest[];
  today: string;
}): TodayPresenceStatusModel {
  const attendance = selectTodayAttendance(attendances, today);
  const pendingRequest = pendingRequestForToday(pendingRequests, today);
  const status = attendance?.status;

  if (status && status !== "absent" && isAttendanceStatusKey(status)) {
    const copy = STATUS_COPY[status];

    return {
      key: status,
      label: STATUS_META[status].label,
      title: copy.title,
      description: copy.description,
      tone: TONES[status],
    };
  }

  if (pendingRequest) {
    return {
      key: "pending_request",
      label: "Menunggu",
      title: "Pengajuan menunggu persetujuan",
      description: requestDescription(pendingRequest),
      tone: TONES.pending_request,
    };
  }

  return {
    key: "absent",
    label: STATUS_META.absent.label,
    title: STATUS_COPY.absent.title,
    description: STATUS_COPY.absent.description,
    tone: TONES.absent,
  };
}
