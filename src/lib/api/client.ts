import { apiProxyPath } from "@/lib/env";
import type {
  ApiEnvelope,
  ApiStatus,
  Attendance,
  Employee,
  LoginResponse,
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
  data: { username?: string; phone?: string; password?: string },
) {
  const response = await apiRequest<ApiEnvelope<User>>("/auth/me", {
    method: "PATCH",
    token,
    body: data,
  });

  return response.data;
}

// ─── Offices ─────────────────────────────────────────────────────────────────

export async function getOffices(token: string, search?: string) {
  const query = search ? `?search=${encodeURIComponent(search)}` : "";
  const response = await apiRequest<PaginatedEnvelope<Office>>(
    `/offices${query}`,
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

export async function getAttendances(token: string, search?: string) {
  const query = search ? `?search=${encodeURIComponent(search)}` : "";
  const response = await apiRequest<PaginatedEnvelope<Attendance>>(
    `/attendances${query}`,
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
  },
) {
  const response = await apiRequest<ApiEnvelope<Attendance>>("/attendances", {
    method: "POST",
    token,
    body: data,
  });

  return response.data;
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
