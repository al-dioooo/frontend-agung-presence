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
  officesKey,
  officeKey,
  employeesKey,
  employeeKey,
  attendancesKey,
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
  const newOffice = await createOffice(token, data);

  // Revalidate all office list caches
  revalidatePrefix("/offices");

  return newOffice;
}

export async function mutateUpdateOffice(
  token: string,
  id: number,
  data: Partial<OfficeInput>,
) {
  const updated = await updateOffice(token, id, data);

  // Optimistically update the detail cache
  const detailKey = officeKey(token, id);
  if (detailKey) {
    mutate(detailKey, updated, { revalidate: false });
  }

  // Revalidate all office list caches
  revalidatePrefix("/offices");

  return updated;
}

export async function mutateDeleteOffice(
  token: string,
  id: number,
  opts?: {
    /** Current list to optimistically remove the item from */
    currentList?: Office[];
  },
) {
  // Optimistically remove from any known list cache
  if (opts?.currentList) {
    const optimistic = opts.currentList.filter((o) => o.id !== id);
    // Update the default (no-search) list key optimistically
    const listKey = officesKey(token);
    if (listKey) {
      mutate(listKey, optimistic, { revalidate: false });
    }
  }

  try {
    await deleteOffice(token, id);
  } catch (err) {
    // Rollback: revalidate everything
    revalidatePrefix("/offices");
    throw err;
  }

  // Revalidate to ensure consistency
  revalidatePrefix("/offices");
}

// ─── Employee mutations ──────────────────────────────────────────────────────

export async function mutateCreateEmployee(
  token: string,
  data: CreateEmployeeInput,
) {
  const newEmployee = await createEmployee(token, data);

  // Revalidate all employee list caches
  revalidatePrefix("/users");

  return newEmployee;
}

export async function mutateUpdateEmployee(
  token: string,
  id: number,
  data: UpdateEmployeeInput,
) {
  const updated = await updateEmployee(token, id, data);

  // Optimistically update the detail cache
  const detailKey = employeeKey(token, id);
  if (detailKey) {
    mutate(detailKey, updated, { revalidate: false });
  }

  // Revalidate all employee list caches
  revalidatePrefix("/users");

  return updated;
}

export async function mutateDeleteEmployee(
  token: string,
  id: number,
  opts?: {
    /** Current list to optimistically remove the item from */
    currentList?: Employee[];
  },
) {
  // Optimistically remove from any known list cache
  if (opts?.currentList) {
    const optimistic = opts.currentList.filter((e) => e.id !== id);
    const listKey = employeesKey(token);
    if (listKey) {
      mutate(listKey, optimistic, { revalidate: false });
    }
  }

  try {
    await deleteEmployee(token, id);
  } catch (err) {
    // Rollback: revalidate everything
    revalidatePrefix("/users");
    throw err;
  }

  // Revalidate to ensure consistency
  revalidatePrefix("/users");
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
  const newAttendance = await checkIn(token, data);

  // Revalidate all attendance caches
  revalidatePrefix("/attendances");
  revalidatePrefix("/attendances/summary");

  return newAttendance;
}

export async function mutateCheckOut(
  token: string,
  id: number,
  opts?: {
    /** Current list to optimistically update the attendance in */
    currentList?: Attendance[];
  },
) {
  // Optimistically mark as checked-out in the list
  if (opts?.currentList) {
    const now = new Date().toISOString();
    const optimistic = opts.currentList.map((a) =>
      a.id === id ? { ...a, out_at: now } : a,
    );
    const listKey = attendancesKey(token);
    if (listKey) {
      mutate(listKey, optimistic, { revalidate: false });
    }
  }

  try {
    const result = await checkOut(token, id);

    // Update the detail cache
    const detailKey = attendanceKey(token, id);
    if (detailKey) {
      mutate(detailKey, result, { revalidate: false });
    }

    // Revalidate all attendance caches for consistency
    revalidatePrefix("/attendances");
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
  const attendance = await createManualAttendance(token, data);

  revalidatePrefix("/attendances");
  revalidatePrefix("/attendances/summary");

  const detailKey = attendanceKey(token, attendance.id);
  if (detailKey) {
    mutate(detailKey, attendance, { revalidate: false });
  }

  return attendance;
}

export async function mutateCreateAttendanceRequest(
  token: string,
  data: AttendanceRequestInput,
) {
  const attendanceRequest = await createAttendanceRequest(token, data);

  revalidatePrefix("/attendance-requests");

  const detailKey = attendanceRequestKey(token, attendanceRequest.id);
  if (detailKey) {
    mutate(detailKey, attendanceRequest, { revalidate: false });
  }

  return attendanceRequest;
}

export async function mutateReviewAttendanceRequest(
  token: string,
  id: number,
  data: AttendanceRequestReviewInput,
) {
  const attendanceRequest = await reviewAttendanceRequest(token, id, data);

  const detailKey = attendanceRequestKey(token, id);
  if (detailKey) {
    mutate(detailKey, attendanceRequest, { revalidate: false });
  }

  revalidatePrefix("/attendance-requests");
  revalidatePrefix("/attendances");
  revalidatePrefix("/attendances/summary");

  const summaryKey = attendanceSummaryKey(token);
  if (summaryKey) {
    mutate(summaryKey);
  }

  return attendanceRequest;
}

export async function mutateDownloadAttendanceExport(
  token: string,
  params?: AttendanceQueryParams,
) {
  return downloadAttendanceExport(token, params);
}
