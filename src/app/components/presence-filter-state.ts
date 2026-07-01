import type { AttendanceQueryParams } from "@/lib/api/types";
import type { AttendanceStatusKey } from "@/lib/attendance-status";

export type PresenceFilterState = {
  search: string;
  selectedUserId: number | null;
  selectedOfficeId: number | null;
  status: AttendanceStatusKey | "all";
  dateRangeActive: boolean;
  startDate: string;
  endDate: string;
};

export function buildPresenceAttendanceParams({
  search,
  selectedUserId,
  selectedOfficeId,
  status,
  dateRangeActive,
  startDate,
  endDate,
}: PresenceFilterState): AttendanceQueryParams {
  return {
    ...(search.trim() ? { search: search.trim() } : {}),
    ...(selectedUserId !== null ? { user_id: selectedUserId } : {}),
    ...(selectedOfficeId !== null ? { office_id: selectedOfficeId } : {}),
    ...(status !== "all" ? { status } : {}),
    ...(dateRangeActive && startDate <= endDate
      ? {
          start_date: startDate,
          end_date: endDate,
        }
      : {}),
  };
}

export function hasPresenceFilters({
  search,
  selectedUserId,
  selectedOfficeId,
  status,
  dateRangeActive,
}: PresenceFilterState) {
  return (
    search.trim() !== "" ||
    selectedUserId !== null ||
    selectedOfficeId !== null ||
    status !== "all" ||
    dateRangeActive
  );
}
