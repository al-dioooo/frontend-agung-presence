"use client";

import { Button, SearchInput } from "@/components/ui";
import { ChevronRightIcon } from "@/components/icons/outline";
import { BottomSheet } from "@/app/components/bottom-sheet";

export type FilterSelectionValue = string | number | null;

export type FilterSelectionOption = {
  value: FilterSelectionValue;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
};

type FilterFieldButtonProps = {
  label: string;
  value?: string | null;
  placeholder: string;
  icon?: React.ReactNode;
  active?: boolean;
  onClick: () => void;
  onClear?: () => void;
};

export function FilterFieldButton({
  label,
  value,
  placeholder,
  icon,
  active = false,
  onClick,
  onClear,
}: FilterFieldButtonProps) {
  return (
    <div
      className={`flex min-h-16 items-center gap-3 rounded-2xl bg-white px-4 py-3 text-left ring-1 transition-colors ${
        active ? "ring-primary" : "ring-taupe-200"
      }`}
    >
      {icon && (
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-taupe-100">
          {icon}
        </span>
      )}
      <button
        type="button"
        onClick={onClick}
        className="min-w-0 flex-1 text-left focus:outline-none"
      >
        <span className="block text-sm font-semibold text-foreground">
          {label}
        </span>
        <span className="mt-0.5 block truncate text-xs text-taupe-400">
          {value || placeholder}
        </span>
      </button>
      {value && onClear ? (
        <button
          type="button"
          onClick={onClear}
          className="shrink-0 rounded-full bg-taupe-100 px-2.5 py-1 text-xs font-semibold text-taupe-500 active:bg-taupe-200"
          aria-label={`Hapus filter ${label}`}
        >
          Reset
        </button>
      ) : (
        <ChevronRightIcon
          className="size-5 shrink-0 text-taupe-400"
          strokeWidth={2}
        />
      )}
    </div>
  );
}

type SearchableSelectionDialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  options: FilterSelectionOption[];
  selectedValue: FilterSelectionValue;
  onSelect: (option: FilterSelectionOption) => void;
  loading?: boolean;
  error?: string;
  emptyMessage?: string;
  closeOnSelect?: boolean;
  searchable?: boolean;
};

export function SearchableSelectionDialog({
  open,
  onClose,
  title,
  searchValue = "",
  onSearchChange,
  searchPlaceholder = "Search",
  options,
  selectedValue,
  onSelect,
  loading = false,
  error = "",
  emptyMessage = "Tidak ada pilihan",
  closeOnSelect = true,
  searchable = true,
}: SearchableSelectionDialogProps) {
  return (
    <BottomSheet open={open} onClose={onClose} title={title}>
      <div className="space-y-3 px-2 pb-2">
        {searchable && onSearchChange && (
          <SearchInput
            id={`${title.toLowerCase().replace(/\s+/g, "-")}-search`}
            value={searchValue}
            onChange={onSearchChange}
            placeholder={searchPlaceholder}
          />
        )}

        {error && (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
            {error}
          </p>
        )}

        <div className="space-y-1">
          {loading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-16 animate-pulse rounded-2xl bg-taupe-100"
              />
            ))
          ) : options.length === 0 ? (
            <p className="rounded-2xl bg-taupe-50 px-4 py-5 text-center text-sm text-taupe-400">
              {emptyMessage}
            </p>
          ) : (
            options.map((option) => {
              const selected = option.value === selectedValue;
              return (
                <button
                  key={String(option.value)}
                  type="button"
                  onClick={() => {
                    onSelect(option);
                    if (closeOnSelect) onClose();
                  }}
                  className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm transition-colors active:bg-taupe-50 ${
                    selected ? "bg-emerald-50" : ""
                  }`}
                >
                  {option.icon && (
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-taupe-100">
                      {option.icon}
                    </span>
                  )}
                  <span className="min-w-0 flex-1 text-left">
                    <span className="block truncate font-medium text-foreground">
                      {option.title}
                    </span>
                    {option.subtitle && (
                      <span className="block truncate text-xs text-taupe-400">
                        {option.subtitle}
                      </span>
                    )}
                  </span>
                  {selected && <span className="size-2 rounded-full bg-primary" />}
                </button>
              );
            })
          )}
        </div>

        <Button variant="secondary" fullWidth className="h-11" onClick={onClose}>
          Tutup
        </Button>
      </div>
    </BottomSheet>
  );
}
