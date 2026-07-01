"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api/client";
import { useEmployees } from "@/lib/api/hooks";
import { mutateDeleteEmployee } from "@/lib/api/mutations";
import type { Employee, EmployeeRoleFilter } from "@/lib/api/types";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { Button, Card, SearchInput } from "@/components/ui";
import {
  ChevronRightIcon,
  EyeIcon,
  FilterIcon,
  PencilIcon,
  TrashIcon,
} from "@/components/icons/outline";
import { BottomSheet } from "@/app/components/bottom-sheet";
import {
  SearchableSelectionDialog,
  type FilterSelectionOption,
} from "@/app/components/filter-controls";
import {
  DesktopToolbar,
  ResponsiveDataTable,
} from "@/app/components/responsive-data-table";
import { AppPage } from "@/app/components/responsive-layout";
import {
  TableActionButton,
  TableActionGroup,
  TableActionLink,
} from "@/app/components/table-row-actions";

export default function EmployeePage() {
  const { token, user } = useAuth();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<EmployeeRoleFilter>("all");
  const [roleFilterOpen, setRoleFilterOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const isAdministrator = user?.role === "administrator";
  const debouncedSearch = useDebouncedValue(search);
  const { data: employees = [], isLoading } = useEmployees({
    search: debouncedSearch,
    role: roleFilter,
  });

  const roleOptions: FilterSelectionOption[] = [
    { value: "all", title: "Semua role", subtitle: "Tampilkan semua akun" },
    { value: "employee", title: "Karyawan", subtitle: "Akun karyawan saja" },
    {
      value: "administrator",
      title: "Administrator",
      subtitle: "Akun pengelola sistem",
    },
  ];
  const selectedRoleLabel =
    roleOptions.find((option) => option.value === roleFilter)?.title ??
    "Semua role";
  const hasEmployeeFilters = search.trim() !== "" || roleFilter !== "all";

  if (user && !isAdministrator) {
    router.replace("/dashboard");
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-taupe-200 border-t-foreground" />
      </div>
    );
  }

  function isProtectedEmployee(employee: Employee) {
    return employee.role === "administrator" || user?.id === employee.id;
  }

  async function handleDeleteEmployee() {
    if (!token || !employeeToDelete) return;

    setIsDeleting(true);
    setDeleteError("");
    try {
      await mutateDeleteEmployee(token, employeeToDelete.id, {
        currentList: employees,
      });
      setEmployeeToDelete(null);
    } catch (err) {
      setDeleteError(
        err instanceof ApiError ? err.message : "Gagal menghapus karyawan.",
      );
    } finally {
      setIsDeleting(false);
    }
  }

  function closeDeleteConfirmation() {
    if (isDeleting) return;
    setDeleteError("");
    setEmployeeToDelete(null);
  }

  return (
    !isAdministrator ? (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-taupe-200 border-t-foreground" />
      </div>
    ) : (
    <AppPage size="wide">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground md:text-2xl">Employee</h1>
        <Button href="/employee/create" variant="primary" size="sm">
          + Create
        </Button>
      </div>

      <div className="mb-5 space-y-3 lg:hidden">
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <SearchInput
              id="employee-search"
              value={search}
              onChange={setSearch}
              placeholder="Search"
            />
          </div>
          <Button
            variant={roleFilter !== "all" ? "primary" : "secondary"}
            size="icon"
            onClick={() => setRoleFilterOpen(true)}
            aria-label="Filter role karyawan"
          >
            <FilterIcon className="size-5" />
          </Button>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="rounded-full bg-taupe-50 px-3 py-1 text-xs font-semibold text-taupe-500 ring-1 ring-taupe-200">
            {employees.length} karyawan
          </span>
          {roleFilter !== "all" && (
            <button
              type="button"
              onClick={() => setRoleFilter("all")}
              className="rounded-full px-2 py-1 text-xs font-semibold text-taupe-500 active:opacity-70"
            >
              Reset filter
            </button>
          )}
        </div>
      </div>

      <DesktopToolbar className="mb-5">
        <div className="w-full max-w-xl">
          <SearchInput
            id="employee-search-desktop"
            value={search}
            onChange={setSearch}
            placeholder="Search"
          />
        </div>
        <Button
          variant={roleFilter !== "all" ? "primary" : "secondary"}
          size="sm"
          onClick={() => setRoleFilterOpen(true)}
          leftIcon={<FilterIcon className="size-4" />}
        >
          {selectedRoleLabel}
        </Button>
        <span className="shrink-0 rounded-full bg-taupe-50 px-3 py-1 text-xs font-semibold text-taupe-500 ring-1 ring-taupe-200">
          {employees.length} karyawan
        </span>
      </DesktopToolbar>
      {deleteError && (
        <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {deleteError}
        </p>
      )}

      <ResponsiveDataTable
        aria-label="Daftar karyawan"
        columns={[
          {
            key: "name",
            header: "Nama",
            cell: (employee) => (
              <div className="min-w-0">
                <p className="truncate font-semibold">{employee.name}</p>
                <p className="truncate text-xs text-taupe-400">
                  @{employee.username}
                </p>
              </div>
            ),
            className: "w-[34%]",
          },
          {
            key: "email",
            header: "Email",
            cell: (employee) => (
              <span className="block truncate text-taupe-500">
                {employee.email}
              </span>
            ),
            className: "w-[30%]",
          },
          {
            key: "role",
            header: "Role",
            cell: (employee) => (
              <span className="rounded-full bg-taupe-100 px-2.5 py-1 text-xs font-semibold capitalize text-taupe-600">
                {employee.role}
              </span>
            ),
            className: "w-[16%]",
          },
          {
            key: "action",
            header: "Aksi",
            cell: (employee) => (
              <TableActionGroup>
                <TableActionLink
                  href={`/employee/${employee.id}`}
                  label={`Lihat detail karyawan ${employee.name}`}
                >
                  <EyeIcon className="size-4" />
                </TableActionLink>
                {!isProtectedEmployee(employee) && (
                  <>
                    <TableActionLink
                      href={`/employee/${employee.id}/edit`}
                      label={`Edit karyawan ${employee.name}`}
                    >
                      <PencilIcon className="size-4" />
                    </TableActionLink>
                    <TableActionButton
                      label={`Hapus karyawan ${employee.name}`}
                      tone="danger"
                      onClick={() => {
                        setDeleteError("");
                        setEmployeeToDelete(employee);
                      }}
                    >
                      <TrashIcon className="size-4" />
                    </TableActionButton>
                  </>
                )}
              </TableActionGroup>
            ),
            align: "right",
            className: "w-[20%]",
          },
        ]}
        rows={employees}
        getRowKey={(employee) => employee.id}
        emptyMessage={hasEmployeeFilters ? "Tidak ada karyawan ditemukan" : "Belum ada data karyawan"}
        loading={isLoading}
      />

      {isLoading ? (
        <div className="space-y-2 lg:hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-white ring-1 ring-taupe-200 shadow-sm" />
          ))}
        </div>
      ) : employees.length === 0 ? (
        <p className="mt-10 text-center text-sm text-taupe-400 lg:hidden">
          {hasEmployeeFilters ? "Tidak ada karyawan ditemukan" : "Belum ada data karyawan"}
        </p>
      ) : (
        <div id="employee-list" className="space-y-2 lg:hidden">
          {employees.map((employee) => (
            <Card
              key={employee.id}
              href={`/employee/${employee.id}`}
              id={`employee-${employee.id}`}
              className="flex items-center justify-between gap-3 px-4 py-3.5"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {employee.name}
                </p>
                <p className="mt-0.5 text-xs text-taupe-400 capitalize">
                  {employee.role}
                </p>
              </div>
              <ChevronRightIcon
                strokeWidth={2.5}
                className="ml-1 size-4 shrink-0 text-taupe-300"
              />
            </Card>
          ))}
        </div>
      )}
      <SearchableSelectionDialog
        open={roleFilterOpen}
        onClose={() => setRoleFilterOpen(false)}
        title="Filter Role"
        options={roleOptions}
        selectedValue={roleFilter}
        onSelect={(option) => setRoleFilter(option.value as EmployeeRoleFilter)}
        searchable={false}
      />
      <BottomSheet
        open={employeeToDelete !== null}
        onClose={closeDeleteConfirmation}
        title="Hapus Karyawan?"
      >
        <div className="px-4 pt-1">
          <p className="text-sm text-taupe-400">
            Tindakan ini tidak dapat dibatalkan. Karyawan{" "}
            {employeeToDelete ? `"${employeeToDelete.name}" ` : ""}
            akan dihapus secara permanen.
          </p>
          {deleteError && (
            <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
              {deleteError}
            </p>
          )}
          <div className="mt-5 flex gap-3">
            <Button
              variant="secondary"
              className="flex-1 py-3"
              onClick={closeDeleteConfirmation}
              disabled={isDeleting}
            >
              Batal
            </Button>
            <Button
              variant="danger"
              className="flex-1 py-3"
              onClick={handleDeleteEmployee}
              loading={isDeleting}
              loadingText="Menghapus..."
            >
              Hapus
            </Button>
          </div>
        </div>
      </BottomSheet>
    </AppPage>
    )
  );
}
