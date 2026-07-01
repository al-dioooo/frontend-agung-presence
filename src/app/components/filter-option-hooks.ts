"use client";

import { useDebouncedValue } from "@/lib/use-debounced-value";
import { useEmployees, useOffices } from "@/lib/api/hooks";
import type {
  EmployeeRoleFilter,
  OfficeActiveStatusFilter,
} from "@/lib/api/types";

export const FILTER_OPTION_LIMIT = 25;

export function useEmployeeFilterOptions({
  open,
  search,
  role = "employee",
}: {
  open: boolean;
  search: string;
  role?: EmployeeRoleFilter;
}) {
  const debouncedSearch = useDebouncedValue(search);

  return useEmployees(
    {
      search: debouncedSearch,
      role,
      limit: FILTER_OPTION_LIMIT,
    },
    open,
  );
}

export function useOfficeFilterOptions({
  open,
  search,
  activeStatus = "all",
  activeOnly = false,
}: {
  open: boolean;
  search: string;
  activeStatus?: OfficeActiveStatusFilter;
  activeOnly?: boolean;
}) {
  const debouncedSearch = useDebouncedValue(search);

  return useOffices(
    {
      search: debouncedSearch,
      active_status: activeStatus,
      active_only: activeOnly,
      limit: FILTER_OPTION_LIMIT,
    },
    open,
  );
}
