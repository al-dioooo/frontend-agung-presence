import useSWR from "swr";
import { useAuth } from "@/lib/auth-context";
import {
  getOffices,
  getOffice,
  getEmployees,
  getEmployee,
  getAttendances,
  getAttendance,
  getAttendanceRequests,
  getAttendanceSummary,
} from "./client";
import type { AttendanceQueryParams, AttendanceRequestQueryParams } from "./types";

// ─── Key helpers ─────────────────────────────────────────────────────────────

export function officesKey(
  token: string | null,
  search?: string,
  activeOnly?: boolean,
) {
  if (!token) return null;
  return ["/offices", token, search ?? "", activeOnly ? "active" : "all"] as const;
}

export function officeKey(token: string | null, id: number | string) {
  if (!token) return null;
  return ["/offices", token, String(id)] as const;
}

export function employeesKey(token: string | null, search?: string) {
  if (!token) return null;
  return ["/users", token, search ?? ""] as const;
}

export function employeeKey(token: string | null, id: number | string) {
  if (!token) return null;
  return ["/users", token, String(id)] as const;
}

export function attendancesKey(
  token: string | null,
  params?: AttendanceQueryParams,
) {
  if (!token) return null;
  return [
    "/attendances",
    token,
    params?.search ?? "",
    params?.office_id ?? "",
    params?.date ?? "",
    params?.start_date ?? "",
    params?.end_date ?? "",
  ] as const;
}

export function attendanceKey(token: string | null, id: number | string) {
  if (!token) return null;
  return ["/attendances", token, String(id)] as const;
}

export function attendanceSummaryKey(token: string | null) {
  if (!token) return null;
  return ["/attendances/summary", token] as const;
}

export function attendanceRequestsKey(
  token: string | null,
  params?: AttendanceRequestQueryParams,
) {
  if (!token) return null;
  return [
    "/attendance-requests",
    token,
    params?.approval_status ?? "all",
  ] as const;
}

export function attendanceRequestKey(token: string | null, id: number | string) {
  if (!token) return null;
  return ["/attendance-requests", token, String(id)] as const;
}

// ─── Hooks ───────────────────────────────────────────────────────────────────

export function useOffices(search?: string, activeOnly?: boolean) {
  const { token } = useAuth();

  return useSWR(officesKey(token, search, activeOnly), ([, tok, s, active]) =>
    getOffices(tok, s || undefined, active === "active"),
  );
}

export function useOffice(id: number | string) {
  const { token } = useAuth();

  return useSWR(officeKey(token, id), ([, tok, i]) => getOffice(tok, Number(i)));
}

export function useEmployees(search?: string, enabled = true) {
  const { token } = useAuth();

  return useSWR(enabled ? employeesKey(token, search) : null, ([, tok, s]) =>
    getEmployees(tok, s || undefined),
  );
}

export function useEmployee(id: number | string) {
  const { token } = useAuth();

  return useSWR(employeeKey(token, id), ([, tok, i]) =>
    getEmployee(tok, Number(i)),
  );
}

export function useAttendances(params?: AttendanceQueryParams) {
  const { token } = useAuth();

  return useSWR(attendancesKey(token, params), ([, tok, search, officeId, date, startDate, endDate]) =>
    getAttendances(tok, {
      search: search || undefined,
      office_id: officeId ? Number(officeId) : undefined,
      date: date || undefined,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
    }),
  );
}

export function useAttendance(id: number | string) {
  const { token } = useAuth();

  return useSWR(attendanceKey(token, id), ([, tok, i]) =>
    getAttendance(tok, Number(i)),
  );
}

export function useAttendanceSummary(enabled = true) {
  const { token } = useAuth();

  return useSWR(enabled ? attendanceSummaryKey(token) : null, ([, tok]) =>
    getAttendanceSummary(tok),
  );
}

export function useAttendanceRequests(params?: AttendanceRequestQueryParams) {
  const { token } = useAuth();

  return useSWR(attendanceRequestsKey(token, params), ([, tok, approvalStatus]) =>
    getAttendanceRequests(tok, {
      approval_status:
        approvalStatus === "all"
          ? undefined
          : (approvalStatus as AttendanceRequestQueryParams["approval_status"]),
    }),
  );
}
