export type ApiEnvelope<T> = {
  message?: string;
  data: T;
};

export type ApiActionResult<T> = {
  data: T;
  message: string;
};

export type PaginationMeta = {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
};

export type PaginatedEnvelope<T> = {
  message?: string;
  data: T[];
  meta: PaginationMeta;
};

export type PaginationQueryParams = {
  page?: number;
  per_page?: number;
};

export type ApiStatus = {
  status: string;
  name: string;
};

export type UserRole = "administrator" | "employee" | string;
export type EmployeeRoleFilter = "all" | "administrator" | "employee";
export type OfficeActiveStatusFilter = "all" | "active" | "inactive";
export type OfficeSort = "name" | "nearest";

export type User = {
  id: number;
  name: string;
  username: string;
  email: string;
  role: UserRole;
  created_at: string;
};

export type LoginResponse = {
  user: User;
  token: string;
};

export type Office = {
  id: number;
  name: string;
  address: string | null;
  latitude: string | number;
  longitude: string | number;
  radius: number;
  work_start_time: string | null;
  work_end_time: string | null;
  photo: string | null;
  is_active: boolean;
  distance_meters?: number;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

export type Attendance = {
  id: number | null;
  virtual_key: string | null;
  is_virtual: boolean;
  user_id: number;
  attendance_request_id: number | null;
  office_id: number | null;
  date: string;
  in_at: string | null;
  out_at: string | null;
  in_latitude: string | number | null;
  in_longitude: string | number | null;
  proof_photo: string | null;
  status: string;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  user?: User;
  office?: Office;
  attendance_request?: AttendanceRequest | null;
};

export type AttendanceStatus =
  | "on_time"
  | "late"
  | "absent"
  | "sick"
  | "leave"
  | "permit"
  | string;

export type ManualAttendanceStatus = "sick" | "leave" | "permit";

export type AttendanceRequestType = "sick" | "leave" | "permit";
export type AttendanceRequestApprovalStatus = "pending" | "approved" | "rejected";

export type AttendanceRequest = {
  id: number;
  user_id: number;
  type: AttendanceRequestType;
  start_date: string;
  end_date: string;
  workday_count: number;
  description: string;
  proof_photo: string;
  approval_status: AttendanceRequestApprovalStatus;
  reviewed_by: number | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  user?: User;
  reviewer?: User | null;
};

export type AttendanceRequestInput = {
  type: AttendanceRequestType;
  start_date: string;
  end_date: string;
  description: string;
  proof_photo: string;
};

export type AttendanceRequestReviewInput =
  | {
      approval_status: "approved";
      rejection_reason?: never;
    }
  | {
      approval_status: "rejected";
      rejection_reason: string;
    };

export type ManualAttendanceInput = {
  user_id: number;
  status: ManualAttendanceStatus;
} & (
  | {
      date: string;
      start_date?: never;
      end_date?: never;
    }
  | {
      date?: never;
      start_date: string;
      end_date: string;
    }
);

export type AttendanceQueryParams = {
  search?: string;
  user_id?: number;
  status?: AttendanceStatus;
  office_id?: number;
  date?: string;
  start_date?: string;
  end_date?: string;
} & PaginationQueryParams;

export type AttendanceRequestQueryParams = {
  approval_status?: AttendanceRequestApprovalStatus | "all";
  covers_date?: string;
} & PaginationQueryParams;

export type EmployeeQueryParams = {
  search?: string;
  role?: EmployeeRoleFilter;
  limit?: number;
} & PaginationQueryParams;

export type OfficeQueryParams = {
  search?: string;
  active_only?: boolean;
  active_status?: OfficeActiveStatusFilter;
  sort?: OfficeSort;
  latitude?: number;
  longitude?: number;
  limit?: number;
} & PaginationQueryParams;

export type AttendanceSummary = {
  user_id: number;
  name: string;
  username: string;
  email: string;
  on_time_count: number;
  late_count: number;
  total_real_check_ins: number;
  sick_count: number;
  leave_count: number;
  permit_count: number;
  absent_count: number;
  first_attendance_date: string | null;
  latest_attendance_date: string | null;
};

export type AttendanceChartDay = {
  date: string;
  total: number;
  on_time: number;
  late: number;
  absent: number;
  sick: number;
  leave: number;
  permit: number;
};

export type AttendanceChart = {
  start_date: string;
  end_date: string;
  total: number;
  days: AttendanceChartDay[];
};

export type Employee = User;
