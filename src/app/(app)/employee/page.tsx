"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { getEmployees } from "@/lib/api/client";
import type { Employee } from "@/lib/api/types";
import { SearchBar } from "@/app/components/search-bar";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const avatarColors = [
  "bg-accent",
  "bg-amber-700",
  "bg-emerald-700",
  "bg-rose-700",
  "bg-indigo-700",
  "bg-teal-700",
];

function getAvatarColor(index: number) {
  return avatarColors[index % avatarColors.length];
}

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
    <div className="px-5 pt-7">
      <h1 className="mb-5 text-xl font-semibold text-foreground tracking-tight">Employee</h1>

      <div className="mb-5">
        <SearchBar
          id="employee-search"
          value={search}
          onChange={setSearch}
          placeholder="Cari karyawan..."
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-1">
              <div className="h-11 w-11 animate-pulse rounded-full bg-surface-warm" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 w-32 animate-pulse rounded bg-surface-warm" />
                <div className="h-2.5 w-20 animate-pulse rounded bg-surface-warm" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="mt-10 text-center text-sm text-muted">
          {search ? "Tidak ada karyawan ditemukan" : "Belum ada data karyawan"}
        </p>
      ) : (
        <div id="employee-list" className="card-soft overflow-hidden">
          {filtered.map((employee, index) => (
            <div
              key={employee.id}
              id={`employee-${employee.id}`}
              className={`flex items-center justify-between px-4 py-3.5 ${
                index < filtered.length - 1 ? "border-b border-border" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex size-11 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white ${getAvatarColor(index)}`}
                >
                  {getInitials(employee.name)}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {employee.name}
                  </p>
                  <p className="text-xs text-muted capitalize">
                    {employee.role}
                  </p>
                </div>
              </div>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                className="size-4 shrink-0 text-muted/50"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.25 4.5l7.5 7.5-7.5 7.5"
                />
              </svg>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
