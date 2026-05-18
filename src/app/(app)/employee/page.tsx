"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { getEmployees } from "@/lib/api/client";
import type { Employee } from "@/lib/api/types";
import { SearchBar } from "@/app/components/search-bar";
import { ChevronRightIcon } from "@/components/icons/outline";
import Link from "next/link";

export default function EmployeePage() {
  const { token } = useAuth();
  const [search, setSearch] = useState("");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    getEmployees(token)
      .then(setEmployees)
      .finally(() => setIsLoading(false));
  }, [token]);

  const filtered = employees.filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.username.toLowerCase().includes(search.toLowerCase()) ||
      e.role.toLowerCase().includes(search.toLowerCase()),
  );

  return (
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
  );
}
