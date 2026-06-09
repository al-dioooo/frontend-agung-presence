"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useEmployees } from "@/lib/api/hooks";
import type { Employee } from "@/lib/api/types";
import { Button, Card, SearchInput } from "@/components/ui";
import { ChevronRightIcon } from "@/components/icons/outline";

export default function EmployeePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const isAdministrator = user?.role === "administrator";
  const { data: employees = [], isLoading } = useEmployees();

  if (user && !isAdministrator) {
    router.replace("/dashboard");
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-taupe-200 border-t-foreground" />
      </div>
    );
  }

  const filtered = employees.filter(
    (e: Employee) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.username.toLowerCase().includes(search.toLowerCase()) ||
      e.role.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    !isAdministrator ? (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-taupe-200 border-t-foreground" />
      </div>
    ) : (
    <div className="px-5 pt-6">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Employee</h1>
        <Button href="/employee/create" variant="primary" size="sm">
          + Create
        </Button>
      </div>

      <div className="mb-5">
        <SearchInput
          id="employee-search"
          value={search}
          onChange={setSearch}
          placeholder="Search"
        />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-white ring-1 ring-taupe-200 shadow-sm" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="mt-10 text-center text-sm text-taupe-400">
          {search ? "Tidak ada karyawan ditemukan" : "Belum ada data karyawan"}
        </p>
      ) : (
        <div id="employee-list" className="space-y-2">
          {filtered.map((employee) => (
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
    </div>
    )
  );
}
