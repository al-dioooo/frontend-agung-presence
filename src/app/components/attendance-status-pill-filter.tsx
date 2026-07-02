import {
  STATUS_KEYS,
  STATUS_META,
  type AttendanceStatusKey,
} from "@/lib/attendance-status";
import { ScrollablePillGroup } from "@/app/components/scrollable-pill-group";

type AttendanceStatusPillFilterProps = {
  value: AttendanceStatusKey | "all";
  onChange: (value: AttendanceStatusKey | "all") => void;
  className?: string;
};

const STATUS_OPTIONS: { value: AttendanceStatusKey | "all"; label: string }[] = [
  { value: "all", label: "Semua" },
  ...STATUS_KEYS.map((status) => ({
    value: status,
    label: STATUS_META[status].label,
  })),
];

export function AttendanceStatusPillFilter({
  value,
  onChange,
  className = "",
}: AttendanceStatusPillFilterProps) {
  return (
    <ScrollablePillGroup
      id="presence-status-pills"
      options={STATUS_OPTIONS}
      value={value}
      onChange={onChange}
      aria-label="Filter status presensi"
      className={className}
    />
  );
}
