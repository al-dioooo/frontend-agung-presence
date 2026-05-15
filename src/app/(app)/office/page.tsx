"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { getOffices } from "@/lib/api/client";
import type { Office } from "@/lib/api/types";
import { SearchBar } from "@/app/components/search-bar";

export default function OfficePage() {
  const { token } = useAuth();
  const [search, setSearch] = useState("");
  const [offices, setOffices] = useState<Office[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    getOffices(token)
      .then(setOffices)
      .finally(() => setIsLoading(false));
  }, [token]);

  const filtered = offices.filter(
    (o) =>
      o.name.toLowerCase().includes(search.toLowerCase()) ||
      o.address.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="px-4 pt-6">
      <h1 className="mb-5 text-xl font-semibold text-gray-900">Office</h1>

      <div className="mb-4">
        <SearchBar
          id="office-search"
          value={search}
          onChange={setSearch}
          placeholder="Cari kantor..."
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-gray-100" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="mt-8 text-center text-sm text-gray-400">
          {search ? "Tidak ada kantor ditemukan" : "Belum ada data kantor"}
        </p>
      ) : (
        <div
          id="office-list"
          className="overflow-hidden rounded-2xl border border-gray-100"
        >
          {filtered.map((office, index) => (
            <Link
              key={office.id}
              href={`/office/${office.id}`}
              id={`office-item-${office.id}`}
              className={`flex items-center justify-between px-4 py-4 active:bg-gray-50 ${
                index < filtered.length - 1 ? "border-b border-gray-100" : ""
              }`}
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-gray-900">
                  {office.name}
                </p>
                <p className="mt-0.5 truncate text-xs text-gray-400">
                  {office.address}
                </p>
              </div>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                className="ml-2 size-4 shrink-0 text-gray-300"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.25 4.5l7.5 7.5-7.5 7.5"
                />
              </svg>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
