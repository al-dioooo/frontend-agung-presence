import type { PaginationMeta } from "@/lib/api/types";

export const LIST_PAGE_SIZE = 15;

export function listNumberForIndex(index: number, meta?: PaginationMeta) {
  return (meta?.from ?? 1) + index;
}
