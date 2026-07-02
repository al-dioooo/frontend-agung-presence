import type { TodayPresenceStatusModel } from "@/lib/today-presence-status";

type TodayPresenceStatusAlertProps = {
  status: TodayPresenceStatusModel;
  className?: string;
};

export function TodayPresenceStatusAlert({
  status,
  className = "",
}: TodayPresenceStatusAlertProps) {
  return (
    <section
      data-today-status-alert
      data-today-status={status.key}
      aria-label="Status presensi hari ini"
      className={`rounded-2xl px-4 py-3 ring-1 ${status.tone.bgClass} ${status.tone.borderClass} ${className}`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`mt-1 size-2.5 shrink-0 rounded-full ${status.tone.accentClass}`}
          aria-hidden="true"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-bold text-foreground">
              {status.title}
            </h2>
            <span
              className={`rounded-full bg-white/72 px-2.5 py-1 text-[10px] font-semibold ${status.tone.textClass} ring-1 ring-white/70`}
            >
              {status.label}
            </span>
          </div>
          <p className="mt-1 text-xs leading-5 text-taupe-600">
            {status.description}
          </p>
        </div>
      </div>
    </section>
  );
}
