export type ApiEnvelope<T> = {
  message?: string;
  data: T;
};

export type PaginatedEnvelope<T> = {
  message?: string;
  data: T[];
  meta?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
};

export type ApiStatus = {
  status: string;
  name: string;
};

export type UserRole = "administrator" | "employee" | string;

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
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

export type Attendance = {
  id: number;
  user_id: number;
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
};

export type ManualAttendanceStatus = "sick" | "leave";

export type ManualAttendanceInput = {
  user_id: number;
  date: string;
  status: ManualAttendanceStatus;
};

export type AttendanceQueryParams = {
  search?: string;
  office_id?: number;
  date?: string;
  start_date?: string;
  end_date?: string;
};

export type Employee = User;
