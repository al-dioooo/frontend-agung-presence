"use client";

export type PresenceView = "history" | "summary";

type PresenceViewToggleProps = {
  value: PresenceView;
  onChange: (value: PresenceView) => void;
};

const VIEWS: { value: PresenceView; label: string }[] = [
  { value: "history", label: "Riwayat" },
  { value: "summary", label: "Ringkasan" },
];

export function PresenceViewToggle({ value, onChange }: PresenceViewToggleProps) {
  return (
    <div className="mb-4 grid grid-cols-2 gap-1 rounded-full bg-taupe-100 p-1">
      {VIEWS.map((view) => {
        const selected = value === view.value;

        return (
          <button
            key={view.value}
            type="button"
            onClick={() => onChange(view.value)}
            className={`min-h-10 rounded-full px-4 text-sm font-semibold transition-colors ${
              selected
                ? "bg-white text-foreground shadow-sm"
                : "text-taupe-500 active:bg-white/60"
            }`}
            aria-pressed={selected}
          >
            {view.label}
          </button>
        );
      })}
    </div>
  );
}
