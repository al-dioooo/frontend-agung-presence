type ListNumberBadgeProps = {
  value: number;
  className?: string;
};

export function ListNumberBadge({
  value,
  className = "",
}: ListNumberBadgeProps) {
  return (
    <span
      className={`inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-taupe-100 text-xs font-bold tabular-nums text-taupe-500 ring-1 ring-taupe-200 ${className}`}
      aria-label={`Nomor ${value}`}
    >
      {value}
    </span>
  );
}
