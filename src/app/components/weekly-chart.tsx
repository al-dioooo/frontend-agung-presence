"use client";

import { useEffect, useRef } from "react";
import type { Attendance } from "@/lib/api/types";

interface Props {
  attendances: Attendance[];
}

const STATUS_COLOR: Record<string, string> = {
  on_time: "#10b981",
  present: "#10b981",
  late: "#f59e0b",
  absent: "#ef4444",
};

const STATUS_LABEL: Record<string, string> = {
  on_time: "Tepat Waktu",
  present: "Hadir",
  late: "Terlambat",
  absent: "Tidak Hadir",
};

const DAY_SHORT = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

export function WeeklyChart({ attendances }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chartRef = useRef<any>(null);

  useEffect(() => {
    // Build last-7-days data
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d;
    });

    const labels = days.map((d) => DAY_SHORT[d.getDay()]);
    const data = days.map((d) => {
      const iso = d.toISOString().slice(0, 10);
      return attendances.find((a) => a.date === iso) ?? null;
    });

    const barData = data.map((att) => ({
      value: att ? 1 : 0,
      itemStyle: {
        color: att ? (STATUS_COLOR[att.status] ?? "#b8b0a3") : "#e8e4dd",
        borderRadius: [4, 4, 0, 0],
      },
    }));

    if (!containerRef.current) return;

    (async () => {
      const echarts = await import("echarts");
      const chart = echarts.init(containerRef.current!, null, {
        renderer: "canvas",
      });
      chartRef.current = chart;

      chart.setOption({
        animation: true,
        animationDuration: 500,
        grid: { top: 8, right: 8, bottom: 28, left: 8, containLabel: false },
        xAxis: {
          type: "category",
          data: labels,
          axisTick: { show: false },
          axisLine: { show: false },
          axisLabel: {
            fontSize: 11,
            color: "#9c9284",
            fontFamily: "system-ui, sans-serif",
          },
        },
        yAxis: { show: false, max: 1.3 },
        series: [
          {
            type: "bar",
            data: barData,
            barMaxWidth: 32,
            label: {
              show: false,
            },
          },
        ],
        tooltip: {
          trigger: "item",
          formatter: (params: { dataIndex: number }) => {
            const att = data[params.dataIndex];
            if (!att) return "Tidak hadir";
            return `${STATUS_LABEL[att.status] ?? att.status}`;
          },
          backgroundColor: "#2b2d42",
          borderWidth: 0,
          textStyle: { color: "#fff", fontSize: 11 },
          padding: [4, 8],
        },
      });
    })();

    return () => {
      chartRef.current?.dispose();
      chartRef.current = null;
    };
  }, [attendances]);

  // Resize on window resize
  useEffect(() => {
    function onResize() {
      chartRef.current?.resize();
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return <div ref={containerRef} className="h-full w-full" />;
}
