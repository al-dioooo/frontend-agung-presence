import type {
  AttendanceRequestApprovalStatus,
  AttendanceStatus,
} from "@/lib/api/types";
import {
  REQUEST_STATUS_META,
  statusBadgeClass,
  statusLabel,
} from "@/lib/attendance-status";

type BadgeProps = {
  className?: string;
};

export function AttendanceStatusBadge({
  status,
  className = "",
}: BadgeProps & { status: AttendanceStatus | string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass(
        status,
      )} ${className}`}
    >
      {statusLabel(status)}
    </span>
  );
}

export function RequestStatusBadge({
  status,
  className = "",
}: BadgeProps & { status: AttendanceRequestApprovalStatus }) {
  const meta = REQUEST_STATUS_META[status];

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${meta.badgeClass} ${className}`}
    >
      {meta.label}
    </span>
  );
}
