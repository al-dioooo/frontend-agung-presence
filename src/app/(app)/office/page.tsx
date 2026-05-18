"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { getOffices } from "@/lib/api/client";
import type { Office } from "@/lib/api/types";
import { SearchBar } from "@/app/components/search-bar";
import { ChevronRightIcon } from "@/components/icons/outline";

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
    <div className="px-5 pt-6">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Office</h1>
        <Link
          href="/office/create"
          className="flex items-center gap-1 rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-white transition-opacity active:opacity-80"
        >
          + Create
        </Link>
      </div>

      <div className="mb-5">
        <SearchBar
          id="office-search"
          value={search}
          onChange={setSearch}
          placeholder="Search"
        />
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded bg-taupe-100" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="mt-10 text-center text-sm text-taupe-400">
          {search ? "Tidak ada kantor ditemukan" : "Belum ada data kantor"}
        </p>
      ) : (
        <div id="office-list">
          {filtered.map((office, index) => (
            <Link
              key={office.id}
              href={`/office/${office.id}`}
              id={`office-item-${office.id}`}
              className={`flex items-center justify-between py-3.5 ${
                index < filtered.length - 1 ? "border-b border-taupe-200/60" : ""
              }`}
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {office.name}
                </p>
                <p className="mt-0.5 text-xs text-taupe-400">
                  {office.address}
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
