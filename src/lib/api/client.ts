import { apiProxyPath } from "@/lib/env";
import type {
  ApiEnvelope,
  ApiStatus,
  Attendance,
  AttendanceQueryParams,
  Employee,
  LoginResponse,
  ManualAttendanceInput,
  Office,
  PaginatedEnvelope,
  User,
} from "./types";

type ApiRequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  token?: string;
  body?: unknown;
};

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const headers = new Headers({
    Accept: "application/json",
  });

  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  if (options.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }

  const response = await fetch(`${apiProxyPath}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    cache: "no-store",
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(
      payload?.message ?? "Request ke API gagal.",
      response.status,
      payload,
    );
  }

  return payload as T;
}

// ─── Auth ───────────────────────────────────────────────────────────────────

export function getStatus() {
  return apiRequest<ApiStatus>("/status");
}

export async function login(login: string, password: string) {
  const response = await apiRequest<ApiEnvelope<LoginResponse>>("/auth/login", {
    method: "POST",
    body: { login, password },
  });

  return response.data;
}

export async function getProfile(token: string) {
  const response = await apiRequest<ApiEnvelope<User>>("/auth/me", { token });

  return response.data;
}

export function logout(token: string) {
  return apiRequest<ApiEnvelope<null>>("/auth/logout", {
    method: "POST",
    token,
  });
}

export async function updateProfile(
  token: string,
  data: { username?: string; email?: string; password?: string },
) {
  const response = await apiRequest<ApiEnvelope<User>>("/auth/me", {
    method: "PATCH",
    token,
    body: data,
  });

  return response.data;
}

// ─── Offices ─────────────────────────────────────────────────────────────────

export async function getOffices(
  token: string,
  search?: string,
  activeOnly?: boolean,
) {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (activeOnly) params.set("active_only", "true");
  const query = params.toString();
  const response = await apiRequest<PaginatedEnvelope<Office>>(
    `/offices${query ? `?${query}` : ""}`,
    { token },
  );

  return response.data;
}

export async function getOffice(token: string, id: number) {
  const response = await apiRequest<ApiEnvelope<Office>>(`/offices/${id}`, {
    token,
  });

  return response.data;
}

// ─── Attendances ─────────────────────────────────────────────────────────────

export async function getAttendances(
  token: string,
  params?: AttendanceQueryParams,
) {
  const q = new URLSearchParams();
  if (params?.search) q.set("search", params.search);
  if (params?.office_id) q.set("office_id", String(params.office_id));
  if (params?.date) q.set("date", params.date);
  if (params?.start_date) q.set("start_date", params.start_date);
  if (params?.end_date) q.set("end_date", params.end_date);
  const qs = q.toString();
  const response = await apiRequest<PaginatedEnvelope<Attendance>>(
    `/attendances${qs ? `?${qs}` : ""}`,
    { token },
  );

  return response.data;
}

export async function getAttendance(token: string, id: number) {
  const response = await apiRequest<ApiEnvelope<Attendance>>(
    `/attendances/${id}`,
    { token },
  );

  return response.data;
}

export async function checkIn(
  token: string,
  data: {
    office_id: number;
    latitude: number;
    longitude: number;
    user_id?: number;
    proof_photo?: string | null;
  },
) {
  const response = await apiRequest<ApiEnvelope<Attendance>>("/attendances", {
    method: "POST",
    token,
    body: {
      office_id: data.office_id,
      in_latitude: data.latitude,
      in_longitude: data.longitude,
      ...(data.user_id !== undefined ? { user_id: data.user_id } : {}),
      ...(data.proof_photo !== undefined ? { proof_photo: data.proof_photo } : {}),
    },
  });

  return response.data;
}

export async function checkOut(token: string, id: number) {
  const response = await apiRequest<ApiEnvelope<Attendance>>(
    `/attendances/${id}/checkout`,
    { method: "POST", token },
  );

  return response.data;
}

export async function createManualAttendance(
  token: string,
  data: ManualAttendanceInput,
) {
  const response = await apiRequest<ApiEnvelope<Attendance>>(
    "/attendances/manual",
    {
      method: "POST",
      token,
      body: data,
    },
  );

  return response.data;
}

export type OfficeInput = {
  name: string;
  address?: string | null;
  latitude: number;
  longitude: number;
  radius?: number;
  work_start_time: string;
  work_end_time: string;
  photo?: string | null;
  is_active?: boolean;
};

export async function createOffice(token: string, data: OfficeInput) {
  const response = await apiRequest<ApiEnvelope<Office>>(`/offices`, {
    method: "POST",
    token,
    body: data,
  });

  return response.data;
}

export async function updateOffice(
  token: string,
  id: number,
  data: Partial<OfficeInput>,
) {
  const response = await apiRequest<ApiEnvelope<Office>>(`/offices/${id}`, {
    method: "PATCH",
    token,
    body: data,
  });

  return response.data;
}

export async function deleteOffice(token: string, id: number) {
  return apiRequest<ApiEnvelope<null>>(`/offices/${id}`, {
    method: "DELETE",
    token,
  });
}

// ─── Employees ───────────────────────────────────────────────────────────────

export async function getEmployees(token: string, search?: string) {
  const query = search ? `?search=${encodeURIComponent(search)}` : "";
  const response = await apiRequest<PaginatedEnvelope<Employee>>(
    `/users${query}`,
    { token },
  );

  return response.data;
}

export async function getEmployee(token: string, id: number) {
  const response = await apiRequest<ApiEnvelope<Employee>>(`/users/${id}`, {
    token,
  });

  return response.data;
}

export type CreateEmployeeInput = {
  name: string;
  username: string;
  email: string;
  password: string;
  role: "administrator" | "employee";
};

export async function createEmployee(token: string, data: CreateEmployeeInput) {
  const response = await apiRequest<ApiEnvelope<{ user: Employee }>>(
    `/auth/register`,
    {
      method: "POST",
      token,
      body: data,
    },
  );

  return response.data.user;
}

export type UpdateEmployeeInput = {
  name?: string;
  username?: string;
  email?: string;
  password?: string;
  role?: "administrator" | "employee";
};

export async function updateEmployee(
  token: string,
  id: number,
  data: UpdateEmployeeInput,
) {
  const response = await apiRequest<ApiEnvelope<Employee>>(`/users/${id}`, {
    method: "PATCH",
    token,
    body: data,
  });

  return response.data;
}

export async function deleteEmployee(token: string, id: number) {
  return apiRequest<ApiEnvelope<null>>(`/users/${id}`, {
    method: "DELETE",
    token,
  });
}
