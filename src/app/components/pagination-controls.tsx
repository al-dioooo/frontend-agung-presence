"use client";

import type { PaginationMeta } from "@/lib/api/types";
import { Button } from "@/components/ui";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@/components/icons/outline";

type PageItem = number | "ellipsis-left" | "ellipsis-right";

type PaginationControlsProps = {
  meta?: PaginationMeta;
  onPageChange: (page: number) => void;
  className?: string;
  label?: string;
};

function pageItems(currentPage: number, lastPage: number): PageItem[] {
  if (lastPage <= 7) {
    return Array.from({ length: lastPage }, (_, index) => index + 1);
  }

  const pages = new Set([1, lastPage, currentPage - 1, currentPage, currentPage + 1]);
  const bounded = [...pages]
    .filter((page) => page >= 1 && page <= lastPage)
    .sort((left, right) => left - right);
  const items: PageItem[] = [];

  bounded.forEach((page, index) => {
    const previous = bounded[index - 1];
    if (previous !== undefined && page - previous > 1) {
      const ellipsis: PageItem = index === 1 ? "ellipsis-left" : "ellipsis-right";
      items.push(page - previous === 2 ? previous + 1 : ellipsis);
    }
    items.push(page);
  });

  return items;
}

export function PaginationControls({
  meta,
  onPageChange,
  className = "",
  label = "Navigasi halaman",
}: PaginationControlsProps) {
  if (!meta || meta.last_page <= 1) return null;

  const currentPage = meta.current_page;
  const previousDisabled = currentPage <= 1;
  const nextDisabled = currentPage >= meta.last_page;
  const rangeText =
    meta.from === null || meta.to === null
      ? `0 dari ${meta.total}`
      : `${meta.from}-${meta.to} dari ${meta.total}`;

  return (
    <nav
      aria-label={label}
      className={`mt-4 ${className}`.trim()}
      data-pagination-controls
    >
      <div className="hidden items-center justify-between gap-3 lg:flex">
        <p className="text-xs font-medium text-taupe-400">
          Menampilkan {rangeText}
        </p>
        <div className="flex items-center gap-1.5">
          {pageItems(currentPage, meta.last_page).map((item) =>
            typeof item === "number" ? (
              <button
                key={item}
                type="button"
                onClick={() => onPageChange(item)}
                aria-current={item === currentPage ? "page" : undefined}
                className={`flex size-9 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                  item === currentPage
                    ? "bg-primary text-white"
                    : "bg-white text-taupe-500 ring-1 ring-taupe-200 active:bg-taupe-50"
                }`}
              >
                {item}
              </button>
            ) : (
              <span
                key={item}
                className="flex size-9 items-center justify-center text-xs font-semibold text-taupe-300"
                aria-hidden="true"
              >
                ...
              </span>
            ),
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 lg:hidden">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={previousDisabled}
          leftIcon={<ChevronLeftIcon className="size-4" strokeWidth={2} />}
        >
          Sebelumnya
        </Button>
        <span className="min-w-0 text-center text-xs font-semibold text-taupe-500">
          Halaman {currentPage} / {meta.last_page}
        </span>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={nextDisabled}
          rightIcon={<ChevronRightIcon className="size-4" strokeWidth={2} />}
        >
          Berikutnya
        </Button>
      </div>
    </nav>
  );
}
