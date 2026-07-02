type DataTableColumn<T> = {
  key: string;
  header: React.ReactNode;
  cell: (row: T, index: number) => React.ReactNode;
  className?: string;
  headerClassName?: string;
  align?: "left" | "center" | "right";
};

type ResponsiveDataTableProps<T> = {
  columns: DataTableColumn<T>[];
  rows: T[];
  getRowKey: (row: T) => string | number;
  emptyMessage: string;
  loading?: boolean;
  loadingRows?: number;
  rowClassName?: (row: T) => string;
  "aria-label"?: string;
};

const alignClass = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

export function ResponsiveDataTable<T>({
  columns,
  rows,
  getRowKey,
  emptyMessage,
  loading = false,
  loadingRows = 5,
  rowClassName,
  "aria-label": ariaLabel,
}: ResponsiveDataTableProps<T>) {
  return (
    <div className="hidden overflow-hidden rounded-2xl bg-white ring-1 ring-taupe-200 shadow-sm lg:block">
      <div className="overflow-x-auto">
        <table
          className="min-w-full table-fixed divide-y divide-taupe-200"
          aria-label={ariaLabel}
        >
          <thead className="bg-taupe-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={`px-4 py-3 text-xs font-semibold uppercase text-taupe-500 ${alignClass[column.align ?? "left"]} ${column.headerClassName ?? ""}`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-taupe-100">
            {loading
              ? Array.from({ length: loadingRows }).map((_, rowIndex) => (
                  <tr key={`loading-${rowIndex}`}>
                    {columns.map((column) => (
                      <td key={column.key} className="px-4 py-4">
                        <div className="h-4 animate-pulse rounded-full bg-taupe-100" />
                      </td>
                    ))}
                  </tr>
                ))
              : rows.map((row, rowIndex) => (
                  <tr
                    key={getRowKey(row)}
                    className={`transition-colors hover:bg-taupe-50/70 ${rowClassName?.(row) ?? ""}`}
                  >
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={`px-4 py-3 text-sm text-foreground ${alignClass[column.align ?? "left"]} ${column.className ?? ""}`}
                      >
                        {column.cell(row, rowIndex)}
                      </td>
                    ))}
                  </tr>
                ))}
            {!loading && rows.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-10 text-center text-sm text-taupe-400"
                >
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

type ResponsiveListSwitchProps = {
  mobile: React.ReactNode;
  desktop: React.ReactNode;
};

export function ResponsiveListSwitch({
  mobile,
  desktop,
}: ResponsiveListSwitchProps) {
  return (
    <>
      <div className="lg:hidden">{mobile}</div>
      <div className="hidden lg:block">{desktop}</div>
    </>
  );
}

type DesktopToolbarProps = {
  children: React.ReactNode;
  className?: string;
};

export function DesktopToolbar({
  children,
  className = "",
}: DesktopToolbarProps) {
  return (
    <div
      className={`hidden items-center justify-between gap-3 rounded-2xl bg-white p-3 ring-1 ring-taupe-200 shadow-sm lg:flex ${className}`}
    >
      {children}
    </div>
  );
}
