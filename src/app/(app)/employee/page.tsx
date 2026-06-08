"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useEmployees } from "@/lib/api/hooks";
import type { Employee } from "@/lib/api/types";
import { SearchBar } from "@/app/components/search-bar";
import { ChevronRightIcon } from "@/components/icons/outline";
import Link from "next/link";

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
        <Link
          href="/employee/create"
          className="flex items-center gap-1 rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-white transition-opacity active:opacity-80"
        >
          + Create
        </Link>
      </div>

      <div className="mb-5">
        <SearchBar
          id="employee-search"
          value={search}
          onChange={setSearch}
          placeholder="Search"
        />
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded bg-taupe-100" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="mt-10 text-center text-sm text-taupe-400">
          {search ? "Tidak ada karyawan ditemukan" : "Belum ada data karyawan"}
        </p>
      ) : (
        <div id="employee-list">
          {filtered.map((employee, index) => (
            <Link
              key={employee.id}
              href={`/employee/${employee.id}`}
              id={`employee-${employee.id}`}
              className={`flex items-center justify-between py-3.5 ${
                index < filtered.length - 1 ? "border-b border-taupe-200/60" : ""
              }`}
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
            </Link>
          ))}
        </div>
      )}
    </div>
    )
  );
}
