import useSWR from "swr";
import { useAuth } from "@/lib/auth-context";
import {
  getOffices,
  getOffice,
  getEmployees,
  getEmployee,
  getAttendances,
  getAttendance,
} from "./client";

// ─── Key helpers ─────────────────────────────────────────────────────────────

export function officesKey(token: string | null, search?: string) {
  if (!token) return null;
  return ["/offices", token, search ?? ""] as const;
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
  params?: { search?: string; office_id?: number; date?: string },
) {
  if (!token) return null;
  return [
    "/attendances",
    token,
    params?.search ?? "",
    params?.office_id ?? "",
    params?.date ?? "",
  ] as const;
}

export function attendanceKey(token: string | null, id: number | string) {
  if (!token) return null;
  return ["/attendances", token, String(id)] as const;
}

// ─── Hooks ───────────────────────────────────────────────────────────────────

export function useOffices(search?: string) {
  const { token } = useAuth();

  return useSWR(officesKey(token, search), ([, tok, s]) =>
    getOffices(tok, s || undefined),
  );
}

export function useOffice(id: number | string) {
  const { token } = useAuth();

  return useSWR(officeKey(token, id), ([, tok, i]) => getOffice(tok, Number(i)));
}

export function useEmployees(search?: string) {
  const { token } = useAuth();

  return useSWR(employeesKey(token, search), ([, tok, s]) =>
    getEmployees(tok, s || undefined),
  );
}

export function useEmployee(id: number | string) {
  const { token } = useAuth();

  return useSWR(employeeKey(token, id), ([, tok, i]) =>
    getEmployee(tok, Number(i)),
  );
}

export function useAttendances(params?: {
  search?: string;
  office_id?: number;
  date?: string;
}) {
  const { token } = useAuth();

  return useSWR(attendancesKey(token, params), ([, tok, search, officeId, date]) =>
    getAttendances(tok, {
      search: search || undefined,
      office_id: officeId ? Number(officeId) : undefined,
      date: date || undefined,
    }),
  );
}

export function useAttendance(id: number | string) {
  const { token } = useAuth();

  return useSWR(attendanceKey(token, id), ([, tok, i]) =>
    getAttendance(tok, Number(i)),
  );
}
