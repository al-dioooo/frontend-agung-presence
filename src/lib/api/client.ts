import { apiProxyPath } from "@/lib/env";
import { beginApiRequest } from "@/lib/api/request-activity";
import type {
  ApiActionResult,
  ApiEnvelope,
  ApiStatus,
  Attendance,
  AttendanceChart,
  AttendanceQueryParams,
  AttendanceRequest,
  AttendanceRequestInput,
  AttendanceRequestQueryParams,
  AttendanceRequestReviewInput,
  AttendanceSummary,
  Employee,
  EmployeeQueryParams,
  LoginResponse,
  ManualAttendanceInput,
  Office,
  OfficeQueryParams,
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
  const endApiRequest = beginApiRequest();
  const headers = new Headers({
    Accept: "application/json",
  });

  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  if (options.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }

  try {
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
  } finally {
    endApiRequest();
  }
}

function actionResult<T>(
  response: ApiEnvelope<T>,
  fallbackMessage: string,
): ApiActionResult<T> {
  return {
    data: response.data,
    message: response.message ?? fallbackMessage,
  };
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

  return actionResult(response, "Login successful.");
}

export async function getProfile(token: string) {
  const response = await apiRequest<ApiEnvelope<User>>("/auth/me", { token });

  return response.data;
}

export async function logout(token: string) {
  const response = await apiRequest<ApiEnvelope<null>>("/auth/logout", {
    method: "POST",
    token,
  });

  return actionResult(response, "Logged out successfully.");
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

  return actionResult(response, "User profile updated.");
}

// ─── Offices ─────────────────────────────────────────────────────────────────

function appendOptionalParam(
  params: URLSearchParams,
  key: string,
  value: string | number | boolean | undefined,
) {
  if (value === undefined || value === "" || value === false) return;
  params.set(key, String(value));
}

function appendPaginationParams(
  params: URLSearchParams,
  page?: number,
  perPage?: number,
) {
  appendOptionalParam(params, "page", page);
  appendOptionalParam(params, "per_page", perPage);
}

function officeQueryString(params?: OfficeQueryParams) {
  const q = new URLSearchParams();
  appendOptionalParam(q, "search", params?.search?.trim());
  appendOptionalParam(q, "active_only", params?.active_only);
  appendOptionalParam(q, "active_status", params?.active_status);
  appendOptionalParam(q, "sort", params?.sort);
  appendOptionalParam(q, "latitude", params?.latitude);
  appendOptionalParam(q, "longitude", params?.longitude);
  appendOptionalParam(q, "limit", params?.limit);
  appendPaginationParams(q, params?.page, params?.per_page);

  return q.toString();
}

export async function getOffices(token: string, params?: OfficeQueryParams) {
  const query = officeQueryString(params);
  const response = await apiRequest<PaginatedEnvelope<Office>>(
    `/offices${query ? `?${query}` : ""}`,
    { token },
  );

  return response;
}

export async function getOffice(token: string, id: number) {
  const response = await apiRequest<ApiEnvelope<Office>>(`/offices/${id}`, {
    token,
  });

  return response.data;
}

// ─── Attendances ─────────────────────────────────────────────────────────────

function attendanceQueryString(params?: AttendanceQueryParams) {
  const q = new URLSearchParams();
  if (params?.search) q.set("search", params.search);
  if (params?.user_id) q.set("user_id", String(params.user_id));
  if (params?.status) q.set("status", params.status);
  if (params?.office_id) q.set("office_id", String(params.office_id));
  if (params?.date) q.set("date", params.date);
  if (params?.start_date) q.set("start_date", params.start_date);
  if (params?.end_date) q.set("end_date", params.end_date);
  appendPaginationParams(q, params?.page, params?.per_page);

  return q.toString();
}

export async function getAttendances(
  token: string,
  params?: AttendanceQueryParams,
) {
  const qs = attendanceQueryString(params);
  const response = await apiRequest<PaginatedEnvelope<Attendance>>(
    `/attendances${qs ? `?${qs}` : ""}`,
    { token },
  );

  return response;
}

export async function getAttendanceSummary(
  token: string,
  params?: AttendanceQueryParams,
) {
  const qs = attendanceQueryString(params);
  const response = await apiRequest<PaginatedEnvelope<AttendanceSummary>>(
    `/attendances/summary${qs ? `?${qs}` : ""}`,
    { token },
  );

  return response;
}

export async function getAttendanceChart(
  token: string,
  params?: AttendanceQueryParams,
) {
  const qs = attendanceQueryString(params);
  const response = await apiRequest<ApiEnvelope<AttendanceChart>>(
    `/attendances/chart${qs ? `?${qs}` : ""}`,
    { token },
  );

  return response.data;
}

export async function downloadAttendanceExport(
  token: string,
  params?: AttendanceQueryParams,
) {
  const qs = attendanceQueryString(params);
  const endApiRequest = beginApiRequest();

  try {
    const response = await fetch(`${apiProxyPath}/attendances/export${qs ? `?${qs}` : ""}`, {
      method: "GET",
      headers: {
        Accept: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      throw new ApiError(
        payload?.message ?? "Gagal mengunduh rekap absensi.",
        response.status,
        payload,
      );
    }

    const disposition = response.headers.get("Content-Disposition") ?? "";
    const filename =
      disposition.match(/filename="([^"]+)"/)?.[1] ??
      disposition.match(/filename=([^;]+)/)?.[1]?.trim() ??
      "attendance-recap.xlsx";

    return {
      data: {
        blob: await response.blob(),
        filename,
      },
      message: "Rekap absensi berhasil diunduh.",
    };
  } finally {
    endApiRequest();
  }
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

  return actionResult(response, "Attendance created successfully.");
}

export async function checkOut(token: string, id: number) {
  const response = await apiRequest<ApiEnvelope<Attendance>>(
    `/attendances/${id}/checkout`,
    { method: "POST", token },
  );

  return actionResult(response, "Attendance checked out successfully.");
}

export async function createManualAttendance(
  token: string,
  data: ManualAttendanceInput,
) {
  const response = await apiRequest<ApiEnvelope<Attendance | Attendance[]>>(
    "/attendances/manual",
    {
      method: "POST",
      token,
      body: data,
    },
  );

  return actionResult(response, "Manual attendance stored successfully.");
}

export async function getAttendanceRequests(
  token: string,
  params?: AttendanceRequestQueryParams,
) {
  const q = new URLSearchParams();
  if (params?.approval_status && params.approval_status !== "all") {
    q.set("approval_status", params.approval_status);
  }
  if (params?.covers_date) q.set("covers_date", params.covers_date);
  appendPaginationParams(q, params?.page, params?.per_page);
  const qs = q.toString();
  const response = await apiRequest<PaginatedEnvelope<AttendanceRequest>>(
    `/attendance-requests${qs ? `?${qs}` : ""}`,
    { token },
  );

  return response;
}

export async function getAttendanceRequest(token: string, id: number) {
  const response = await apiRequest<ApiEnvelope<AttendanceRequest>>(
    `/attendance-requests/${id}`,
    { token },
  );

  return response.data;
}

export async function createAttendanceRequest(
  token: string,
  data: AttendanceRequestInput,
) {
  const response = await apiRequest<ApiEnvelope<AttendanceRequest>>(
    "/attendance-requests",
    {
      method: "POST",
      token,
      body: data,
    },
  );

  return actionResult(response, "Attendance request created successfully.");
}

export async function reviewAttendanceRequest(
  token: string,
  id: number,
  data: AttendanceRequestReviewInput,
) {
  const response = await apiRequest<ApiEnvelope<AttendanceRequest>>(
    `/attendance-requests/${id}/review`,
    {
      method: "PATCH",
      token,
      body: data,
    },
  );

  return actionResult(response, "Attendance request reviewed successfully.");
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

  return actionResult(response, "Office created successfully.");
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

  return actionResult(response, "Office updated successfully.");
}

export async function deleteOffice(token: string, id: number) {
  const response = await apiRequest<ApiEnvelope<null>>(`/offices/${id}`, {
    method: "DELETE",
    token,
  });

  return actionResult(response, "Office deleted successfully.");
}

// ─── Employees ───────────────────────────────────────────────────────────────

function employeeQueryString(params?: EmployeeQueryParams) {
  const q = new URLSearchParams();
  appendOptionalParam(q, "search", params?.search?.trim());
  if (params?.role && params.role !== "all") {
    q.set("role", params.role);
  }
  appendOptionalParam(q, "limit", params?.limit);
  appendPaginationParams(q, params?.page, params?.per_page);

  return q.toString();
}

export async function getEmployees(token: string, params?: EmployeeQueryParams) {
  const query = employeeQueryString(params);
  const response = await apiRequest<PaginatedEnvelope<Employee>>(
    `/users${query ? `?${query}` : ""}`,
    { token },
  );

  return response;
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

  return {
    data: response.data.user,
    message: response.message ?? "User registered successfully.",
  };
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

  return actionResult(response, "User updated successfully.");
}

export async function deleteEmployee(token: string, id: number) {
  const response = await apiRequest<ApiEnvelope<null>>(`/users/${id}`, {
    method: "DELETE",
    token,
  });

  return actionResult(response, "User deleted successfully.");
}
