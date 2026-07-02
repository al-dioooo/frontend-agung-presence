type PillOption<T extends string> = {
  value: T;
  label: React.ReactNode;
};

type ScrollablePillGroupProps<T extends string> = {
  options: PillOption<T>[];
  value: T;
  onChange: (value: T) => void;
  "aria-label": string;
  className?: string;
  id?: string;
};

const gridCols = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
} as const;

const desktopGridCols = {
  1: "lg:grid-cols-1",
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
} as const;

function columnCount(length: number): keyof typeof gridCols {
  if (length <= 1) return 1;
  if (length === 2) return 2;
  if (length === 3) return 3;
  return 4;
}

export function ScrollablePillGroup<T extends string>({
  options,
  value,
  onChange,
  "aria-label": ariaLabel,
  className = "",
  id,
}: ScrollablePillGroupProps<T>) {
  const mobileScrollable = options.length > 2;
  const desktopScrollable = options.length > 4;
  const count = columnCount(options.length);
  const mobileLayout = mobileScrollable
    ? "flex overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    : `grid ${gridCols[count]}`;
  const desktopLayout = desktopScrollable
    ? "lg:flex lg:overflow-x-auto"
    : `lg:grid lg:overflow-visible ${desktopGridCols[count]}`;
  const buttonLayout = `${mobileScrollable ? "min-w-max shrink-0" : "w-full"} ${
    desktopScrollable ? "lg:min-w-max lg:shrink-0" : "lg:min-w-0 lg:w-full"
  }`;

  return (
    <div
      id={id}
      data-scrollable-pill-group
      data-mobile-scrollable={mobileScrollable}
      data-desktop-scrollable={desktopScrollable}
      role="group"
      aria-label={ariaLabel}
      className={`rounded-full bg-taupe-100 p-1 ${mobileLayout} ${desktopLayout} ${className}`}
    >
      {options.map((option) => {
        const selected = value === option.value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`min-h-10 rounded-full px-4 text-sm font-semibold transition-colors ${buttonLayout} ${
              selected
                ? "bg-white text-foreground shadow-sm"
                : "text-taupe-500 active:bg-white/60"
            }`}
            aria-pressed={selected}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
