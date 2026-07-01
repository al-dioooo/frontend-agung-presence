import type { AttendanceSummary } from "@/lib/api/types";
import { ResponsiveDataTable } from "@/app/components/responsive-data-table";

type AttendanceTotalsProps = {
  summaries: AttendanceSummary[];
  loading?: boolean;
};

export function AttendanceTotals({
  summaries,
  loading = false,
}: AttendanceTotalsProps) {
  const totalRealCheckIns = summaries.reduce(
    (sum, item) => sum + item.total_real_check_ins,
    0,
  );

  return (
    <section className="mb-5" aria-label="Total Kehadiran Karyawan">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-foreground">
            Total Kehadiran
          </h2>
          <p className="text-xs text-taupe-400">
            Hanya menghitung absen masuk nyata
          </p>
        </div>
        {!loading && (
          <span className="rounded-full bg-taupe-50 px-3 py-1 text-[10px] font-semibold text-taupe-500 ring-1 ring-taupe-200">
            {totalRealCheckIns} total
          </span>
        )}
      </div>

      <ResponsiveDataTable
        aria-label="Total kehadiran karyawan"
        columns={[
          {
            key: "employee",
            header: "Karyawan",
            cell: (summary) => (
              <div className="min-w-0">
                <p className="truncate font-semibold">{summary.name}</p>
                <p className="truncate text-xs text-taupe-400">
                  @{summary.username}
                </p>
              </div>
            ),
          },
          {
            key: "on_time",
            header: "Tepat",
            cell: (summary) => summary.on_time_count,
            align: "center",
          },
          {
            key: "late",
            header: "Terlambat",
            cell: (summary) => summary.late_count,
            align: "center",
          },
          {
            key: "total",
            header: "Total",
            cell: (summary) => (
              <span className="text-base font-bold">
                {summary.total_real_check_ins}
              </span>
            ),
            align: "right",
          },
        ]}
        rows={summaries}
        getRowKey={(summary) => summary.user_id}
        emptyMessage="Belum ada data kehadiran"
        loading={loading}
      />

      {loading ? (
        <div className="space-y-2 lg:hidden">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="h-16 animate-pulse rounded-2xl bg-white ring-1 ring-taupe-200 shadow-sm"
            />
          ))}
        </div>
      ) : summaries.length === 0 ? (
        <p className="rounded-2xl bg-white px-4 py-6 text-center text-sm text-taupe-400 ring-1 ring-taupe-200 shadow-sm lg:hidden">
          Belum ada data kehadiran
        </p>
      ) : (
        <div className="space-y-2 lg:hidden">
          {summaries.map((summary) => (
            <div
              key={summary.user_id}
              className="flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 ring-1 ring-taupe-200 shadow-sm"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">
                  {summary.name}
                </p>
                <p className="truncate text-xs text-taupe-400">
                  @{summary.username}
                </p>
                <p className="mt-1 text-[10px] font-medium text-taupe-500">
                  Tepat {summary.on_time_count} · Terlambat {summary.late_count}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-2xl font-bold leading-none text-foreground">
                  {summary.total_real_check_ins}
                </p>
                <p className="mt-1 text-[10px] font-semibold text-taupe-400">
                  kehadiran
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
