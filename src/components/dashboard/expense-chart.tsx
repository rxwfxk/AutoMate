"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "cn";
import { MAINTENANCE_COLOR, DOCUMENTS_COLOR } from "@/lib/chart-colors";
import type { MonthlyExpensePoint, YearlyExpensePoint } from "@/lib/dashboard-data";

const GRID_COLOR = "#efe2d8"; // --rd-line
const AXIS_COLOR = "#8c7a6e"; // --rd-ink-muted

type Point = MonthlyExpensePoint | YearlyExpensePoint;

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number; dataKey: string }[];
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;

  const maintenance = payload.find((p) => p.dataKey === "maintenance")?.value ?? 0;
  const documents = payload.find((p) => p.dataKey === "documents")?.value ?? 0;
  const total = maintenance + documents;

  return (
    <div className="rounded-list border border-line bg-surface-card p-3 text-sm shadow-card">
      <p className="mb-1.5 font-bold text-ink">{label}</p>
      <div className="flex items-center gap-2">
        <span className="size-2 rounded-full" style={{ backgroundColor: MAINTENANCE_COLOR }} />
        <span className="text-ink-3">ซ่อมบำรุง</span>
        <span className="ml-auto text-ink">
          <span className="font-sans">฿ </span>
          <span className="font-mono">{maintenance.toLocaleString("th-TH")}</span>
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="size-2 rounded-full" style={{ backgroundColor: DOCUMENTS_COLOR }} />
        <span className="text-ink-3">เอกสาร</span>
        <span className="ml-auto text-ink">
          <span className="font-sans">฿ </span>
          <span className="font-mono">{documents.toLocaleString("th-TH")}</span>
        </span>
      </div>
      <div className="mt-1.5 flex items-center gap-2 border-t border-line pt-1.5 font-bold text-ink">
        <span className="text-ink-3">รวม</span>
        <span className="ml-auto">
          <span className="font-sans">฿ </span>
          <span className="font-mono">{total.toLocaleString("th-TH")}</span>
        </span>
      </div>
    </div>
  );
}

export function ExpenseChart({
  monthly,
  yearly,
}: {
  monthly: MonthlyExpensePoint[];
  yearly: YearlyExpensePoint[];
}) {
  const [view, setView] = useState<"monthly" | "yearly">("monthly");
  const data: Point[] = view === "monthly" ? monthly : yearly;
  const hasData = data.some((d) => d.maintenance > 0 || d.documents > 0);
  const periodTotal = data.reduce((sum, d) => sum + d.maintenance + d.documents, 0);

  return (
    <div className="rounded-card bg-surface-card p-5">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-extrabold text-ink">ค่าใช้จ่าย</h2>
        <div className="flex gap-1.5 rounded-full bg-base p-1">
          <button
            type="button"
            onClick={() => setView("monthly")}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-[13px] font-bold",
              view === "monthly" ? "bg-ink text-surface" : "text-ink-3",
            )}
          >
            รายเดือน
          </button>
          <button
            type="button"
            onClick={() => setView("yearly")}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-[13px] font-bold",
              view === "yearly" ? "bg-ink text-surface" : "text-ink-3",
            )}
          >
            รายปี
          </button>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-4 text-[13px] font-bold">
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-[3px]" style={{ backgroundColor: MAINTENANCE_COLOR }} />
          <span className="text-ink-3">ซ่อมบำรุง</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-[3px]" style={{ backgroundColor: DOCUMENTS_COLOR }} />
          <span className="text-ink-3">เอกสาร</span>
        </span>
      </div>

      <p className="mb-3 text-2xl font-bold tracking-tight text-ink">
        <span className="font-sans">฿ </span>
        <span className="font-mono">{periodTotal.toLocaleString("th-TH")}</span>
        <span className="ml-1.5 text-sm font-normal text-ink-muted">
          {view === "monthly" ? "12 เดือนล่าสุด" : "รวมทุกปี"}
        </span>
      </p>

      {hasData ? (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data} margin={{ left: -20 }}>
            <CartesianGrid stroke={GRID_COLOR} vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: AXIS_COLOR, fontSize: 12 }}
              axisLine={{ stroke: GRID_COLOR }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: AXIS_COLOR, fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              width={56}
              tickFormatter={(v: number) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(36,26,20,0.05)" }} />
            <Bar dataKey="maintenance" stackId="cost" fill={MAINTENANCE_COLOR} radius={[0, 0, 0, 0]} />
            <Bar dataKey="documents" stackId="cost" fill={DOCUMENTS_COLOR} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex h-[240px] flex-col items-center justify-center gap-2 text-sm text-ink-muted">
          <p>ยังไม่มีค่าใช้จ่ายที่บันทึกไว้</p>
          <Link href="/vehicles" className="font-bold text-cta">
            + เพิ่มบันทึก
          </Link>
        </div>
      )}
    </div>
  );
}
