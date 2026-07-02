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
import type {
  AttendanceQueryParams,
  AttendanceRequestQueryParams,
  EmployeeQueryParams,
  EmployeeRoleFilter,
  OfficeActiveStatusFilter,
  OfficeQueryParams,
  OfficeSort,
} from "./types";

// ─── Key helpers ─────────────────────────────────────────────────────────────

export function officesKey(token: string | null, params?: OfficeQueryParams) {
  if (!token) return null;
  return [
    "/offices",
    token,
    params?.search ?? "",
    params?.active_only ? "active-only" : "",
    params?.active_status ?? "",
    params?.sort ?? "",
    params?.latitude ?? "",
    params?.longitude ?? "",
    params?.limit ?? "",
  ] as const;
}

export function officeKey(token: string | null, id: number | string) {
  if (!token) return null;
  return ["/offices", token, String(id)] as const;
}

export function employeesKey(token: string | null, params?: EmployeeQueryParams) {
  if (!token) return null;
  return [
    "/users",
    token,
    params?.search ?? "",
    params?.role ?? "",
    params?.limit ?? "",
  ] as const;
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
    params?.user_id ?? "",
    params?.status ?? "",
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

export function filteredAttendanceSummaryKey(
  token: string | null,
  params?: AttendanceQueryParams,
) {
  if (!token) return null;
  return [
    "/attendances/summary",
    token,
    params?.search ?? "",
    params?.user_id ?? "",
    params?.status ?? "",
    params?.office_id ?? "",
    params?.date ?? "",
    params?.start_date ?? "",
    params?.end_date ?? "",
  ] as const;
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

export function useOffices(params?: OfficeQueryParams, enabled = true) {
  const { token } = useAuth();

  return useSWR(enabled ? officesKey(token, params) : null, ([, tok, search, activeOnly, activeStatus, sort, latitude, longitude, limit]) =>
    getOffices(tok, {
      search: search || undefined,
      active_only: activeOnly === "active-only",
      active_status: (activeStatus || undefined) as OfficeActiveStatusFilter | undefined,
      sort: (sort || undefined) as OfficeSort | undefined,
      latitude: latitude === "" ? undefined : Number(latitude),
      longitude: longitude === "" ? undefined : Number(longitude),
      limit: limit === "" ? undefined : Number(limit),
    }),
  );
}

export function useOffice(id: number | string) {
  const { token } = useAuth();

  return useSWR(officeKey(token, id), ([, tok, i]) => getOffice(tok, Number(i)));
}

export function useEmployees(params?: EmployeeQueryParams, enabled = true) {
  const { token } = useAuth();

  return useSWR(enabled ? employeesKey(token, params) : null, ([, tok, search, role, limit]) =>
    getEmployees(tok, {
      search: search || undefined,
      role: (role || undefined) as EmployeeRoleFilter | undefined,
      limit: limit === "" ? undefined : Number(limit),
    }),
  );
}

export function useEmployee(id: number | string) {
  const { token } = useAuth();

  return useSWR(employeeKey(token, id), ([, tok, i]) =>
    getEmployee(tok, Number(i)),
  );
}

export function useAttendances(params?: AttendanceQueryParams, enabled = true) {
  const { token } = useAuth();

  return useSWR(enabled ? attendancesKey(token, params) : null, ([, tok, search, userId, status, officeId, date, startDate, endDate]) =>
    getAttendances(tok, {
      search: search || undefined,
      user_id: userId ? Number(userId) : undefined,
      status: status || undefined,
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

export function useAttendanceSummary(
  enabled = true,
  params?: AttendanceQueryParams,
) {
  const { token } = useAuth();

  return useSWR(enabled ? filteredAttendanceSummaryKey(token, params) : null, ([, tok, search, userId, status, officeId, date, startDate, endDate]) =>
    getAttendanceSummary(tok, {
      search: search || undefined,
      user_id: userId ? Number(userId) : undefined,
      status: status || undefined,
      office_id: officeId ? Number(officeId) : undefined,
      date: date || undefined,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
    }),
  );
}

export function useAttendanceRequests(
  params?: AttendanceRequestQueryParams,
  enabled = true,
) {
  const { token } = useAuth();

  return useSWR(enabled ? attendanceRequestsKey(token, params) : null, ([, tok, approvalStatus]) =>
    getAttendanceRequests(tok, {
      approval_status:
        approvalStatus === "all"
          ? undefined
          : (approvalStatus as AttendanceRequestQueryParams["approval_status"]),
    }),
  );
}
