import { mutate } from "swr";
import {
  createOffice,
  updateOffice,
  deleteOffice,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  checkIn,
  checkOut,
  createManualAttendance,
  createAttendanceRequest,
  reviewAttendanceRequest,
  downloadAttendanceExport,
  type OfficeInput,
  type CreateEmployeeInput,
  type UpdateEmployeeInput,
} from "./client";
import type {
  Office,
  Employee,
  Attendance,
  AttendanceQueryParams,
  ManualAttendanceInput,
  AttendanceRequestInput,
  AttendanceRequestReviewInput,
} from "./types";
import {
  officeKey,
  employeeKey,
  attendanceKey,
  attendanceRequestKey,
  attendanceSummaryKey,
} from "./hooks";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Revalidate all SWR keys that start with the given prefix.
 * This handles cases where we don't know the exact search/filter params
 * used by other mounted hooks.
 */
function revalidatePrefix(prefix: string) {
  mutate(
    (key: unknown) =>
      Array.isArray(key) && typeof key[0] === "string" && key[0] === prefix,
    undefined,
    { revalidate: true },
  );
}

// ─── Office mutations ────────────────────────────────────────────────────────

export async function mutateCreateOffice(token: string, data: OfficeInput) {
  const result = await createOffice(token, data);

  // Revalidate all office list caches
  revalidatePrefix("/offices");

  return result;
}

export async function mutateUpdateOffice(
  token: string,
  id: number,
  data: Partial<OfficeInput>,
) {
  const result = await updateOffice(token, id, data);

  // Optimistically update the detail cache
  const detailKey = officeKey(token, id);
  if (detailKey) {
    mutate(detailKey, result.data, { revalidate: false });
  }

  // Revalidate all office list caches
  revalidatePrefix("/offices");

  return result;
}

export async function mutateDeleteOffice(
  token: string,
  id: number,
  _opts?: {
    currentList?: Office[];
  },
) {
  void _opts;

  try {
    const result = await deleteOffice(token, id);
    revalidatePrefix("/offices");
    return result;
  } catch (err) {
    revalidatePrefix("/offices");
    throw err;
  }
}

// ─── Employee mutations ──────────────────────────────────────────────────────

export async function mutateCreateEmployee(
  token: string,
  data: CreateEmployeeInput,
) {
  const result = await createEmployee(token, data);

  // Revalidate all employee list caches
  revalidatePrefix("/users");

  return result;
}

export async function mutateUpdateEmployee(
  token: string,
  id: number,
  data: UpdateEmployeeInput,
) {
  const result = await updateEmployee(token, id, data);

  // Optimistically update the detail cache
  const detailKey = employeeKey(token, id);
  if (detailKey) {
    mutate(detailKey, result.data, { revalidate: false });
  }

  // Revalidate all employee list caches
  revalidatePrefix("/users");

  return result;
}

export async function mutateDeleteEmployee(
  token: string,
  id: number,
  _opts?: {
    currentList?: Employee[];
  },
) {
  void _opts;

  try {
    const result = await deleteEmployee(token, id);
    revalidatePrefix("/users");
    return result;
  } catch (err) {
    revalidatePrefix("/users");
    throw err;
  }
}

// ─── Attendance mutations ────────────────────────────────────────────────────

export async function mutateCheckIn(
  token: string,
  data: {
    office_id: number;
    latitude: number;
    longitude: number;
    user_id?: number;
    proof_photo?: string | null;
  },
) {
  const result = await checkIn(token, data);

  // Revalidate all attendance caches
  revalidatePrefix("/attendances");
  revalidatePrefix("/attendances/chart");
  revalidatePrefix("/attendances/summary");

  return result;
}

export async function mutateCheckOut(
  token: string,
  id: number,
  _opts?: {
    currentList?: Attendance[];
  },
) {
  void _opts;

  try {
    const result = await checkOut(token, id);

    // Update the detail cache
    const detailKey = attendanceKey(token, id);
    if (detailKey) {
      mutate(detailKey, result.data, { revalidate: false });
    }

    // Revalidate all attendance caches for consistency
    revalidatePrefix("/attendances");
    revalidatePrefix("/attendances/chart");
    revalidatePrefix("/attendances/summary");

    return result;
  } catch (err) {
    // Rollback: revalidate everything
    revalidatePrefix("/attendances");
    throw err;
  }
}

export async function mutateCreateManualAttendance(
  token: string,
  data: ManualAttendanceInput,
) {
  const result = await createManualAttendance(token, data);

  revalidatePrefix("/attendances");
  revalidatePrefix("/attendances/chart");
  revalidatePrefix("/attendances/summary");

  const attendances = Array.isArray(result.data) ? result.data : [result.data];

  for (const attendance of attendances) {
    if (attendance.id === null) continue;

    const detailKey = attendanceKey(token, attendance.id);
    if (detailKey) {
      mutate(detailKey, attendance, { revalidate: false });
    }
  }

  return result;
}

export async function mutateCreateAttendanceRequest(
  token: string,
  data: AttendanceRequestInput,
) {
  const result = await createAttendanceRequest(token, data);

  revalidatePrefix("/attendance-requests");

  const detailKey = attendanceRequestKey(token, result.data.id);
  if (detailKey) {
    mutate(detailKey, result.data, { revalidate: false });
  }

  return result;
}

export async function mutateReviewAttendanceRequest(
  token: string,
  id: number,
  data: AttendanceRequestReviewInput,
) {
  const result = await reviewAttendanceRequest(token, id, data);

  const detailKey = attendanceRequestKey(token, id);
  if (detailKey) {
    mutate(detailKey, result.data, { revalidate: false });
  }

  revalidatePrefix("/attendance-requests");
  revalidatePrefix("/attendances");
  revalidatePrefix("/attendances/chart");
  revalidatePrefix("/attendances/summary");

  const summaryKey = attendanceSummaryKey(token);
  if (summaryKey) {
    mutate(summaryKey);
  }

  return result;
}

export async function mutateDownloadAttendanceExport(
  token: string,
  params?: AttendanceQueryParams,
) {
  return downloadAttendanceExport(token, params);
}
