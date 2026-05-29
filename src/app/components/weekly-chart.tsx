"use client";

import { useEffect, useRef } from "react";
import type { Attendance } from "@/lib/api/types";

interface Props {
  attendances: Attendance[];
  selectedStatus?: ReportStatusFilter;
}

export const STATUS_KEYS = ["on_time", "late", "absent", "sick", "leave"] as const;

export type AttendanceStatusKey = (typeof STATUS_KEYS)[number];
export type ReportStatusFilter = "all" | AttendanceStatusKey;

export const STATUS_META: Record<AttendanceStatusKey, { label: string; color: string }> = {
  on_time: { label: "Tepat Waktu", color: "#10b981" },
  late: { label: "Terlambat", color: "#f59e0b" },
  absent: { label: "Tidak Hadir", color: "#ef4444" },
  sick: { label: "Sakit", color: "#38bdf8" },
  leave: { label: "Cuti", color: "#8b5cf6" },
};

const DAY_SHORT = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isStatusKey(status: string): status is AttendanceStatusKey {
  return (STATUS_KEYS as readonly string[]).includes(status);
}

export function WeeklyChart({ attendances, selectedStatus = "all" }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chartRef = useRef<any>(null);

  useEffect(() => {
    let disposed = false;

    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d;
    });

    const labels = days.map((d) => DAY_SHORT[d.getDay()]);
    const dateIndex = new Map(days.map((day, index) => [toDateKey(day), index]));
    const grouped = STATUS_KEYS.reduce(
      (acc, status) => {
        acc[status] = Array.from({ length: 7 }, () => 0);
        return acc;
      },
      {} as Record<AttendanceStatusKey, number[]>,
    );

    attendances.forEach((attendance) => {
      const index = dateIndex.get(attendance.date);
      if (index === undefined || !isStatusKey(attendance.status)) return;
      grouped[attendance.status][index] += 1;
    });

    const visibleStatuses =
      selectedStatus === "all" ? STATUS_KEYS : [selectedStatus];

    if (!containerRef.current) return;

    (async () => {
      const echarts = await import("echarts");
      if (disposed || !containerRef.current) return;

      chartRef.current?.dispose();
      const chart = echarts.init(containerRef.current!, null, {
        renderer: "canvas",
      });
      chartRef.current = chart;

      chart.setOption({
        animation: true,
        animationDuration: 500,
        color: visibleStatuses.map((status) => STATUS_META[status].color),
        grid: { top: 16, right: 10, bottom: 56, left: 26, containLabel: false },
        xAxis: {
          type: "category",
          data: labels,
          axisTick: { show: false },
          axisLine: { show: false },
          axisLabel: {
            fontSize: 11,
            color: "#9c9284",
            fontFamily: "system-ui, sans-serif",
            margin: 12,
          },
        },
        yAxis: {
          type: "value",
          minInterval: 1,
          axisTick: { show: false },
          axisLine: { show: false },
          splitLine: { lineStyle: { color: "#e8e4dd" } },
          axisLabel: {
            fontSize: 10,
            color: "#b8b0a3",
            fontFamily: "system-ui, sans-serif",
          },
        },
        series: visibleStatuses.map((status) => ({
          name: STATUS_META[status].label,
          type: "line",
          data: grouped[status],
          smooth: true,
          symbol: "circle",
          symbolSize: 6,
          lineStyle: {
            width: 3,
            color: STATUS_META[status].color,
          },
          itemStyle: {
            color: STATUS_META[status].color,
            borderColor: "#fff",
            borderWidth: 2,
          },
          emphasis: {
            focus: "series",
          },
        })),
        legend: {
          show: selectedStatus === "all",
          bottom: 2,
          icon: "circle",
          itemWidth: 8,
          itemHeight: 8,
          textStyle: {
            fontSize: 10,
            color: "#9c9284",
            fontFamily: "system-ui, sans-serif",
          },
        },
        tooltip: {
          trigger: "axis",
          backgroundColor: "#2b2d42",
          borderWidth: 0,
          textStyle: { color: "#fff", fontSize: 11 },
          padding: [6, 8],
          valueFormatter: (value: number) => `${value} data`,
        },
      });
    })();

    return () => {
      disposed = true;
      chartRef.current?.dispose();
      chartRef.current = null;
    };
  }, [attendances, selectedStatus]);

  useEffect(() => {
    function onResize() {
      chartRef.current?.resize();
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return <div ref={containerRef} className="h-full w-full" />;
}
