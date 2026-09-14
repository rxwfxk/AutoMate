"use client";

import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import type { MonthlyExpensePoint, YearlyExpensePoint } from "@/lib/dashboard-data";

// Validated against our dark surface (#15151e) with scripts/validate_palette.js
// from the dataviz skill — CVD ΔE 26.8, normal-vision ΔE 31.8, both well clear
// of the floors. Deliberately not the flag-status hues (teal/gold/red), which
// already carry "overdue" meaning elsewhere in this app.
const MAINTENANCE_COLOR = "#3987e5";
const DOCUMENTS_COLOR = "#d95926";

const GRID_COLOR = "rgba(255,255,255,0.08)";
const AXIS_COLOR = "#9a9aad";

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
    <div className="rounded-lg border border-border bg-card p-3 text-sm shadow-md">
      <p className="mb-1.5 font-medium">{label}</p>
      <div className="flex items-center gap-2">
        <span className="size-2 rounded-full" style={{ backgroundColor: MAINTENANCE_COLOR }} />
        <span className="text-muted-foreground">ซ่อมบำรุง</span>
        <span className="ml-auto">
          <span className="font-sans">฿ </span>
          <span className="font-mono">{maintenance.toLocaleString("th-TH")}</span>
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="size-2 rounded-full" style={{ backgroundColor: DOCUMENTS_COLOR }} />
        <span className="text-muted-foreground">เอกสาร</span>
        <span className="ml-auto">
          <span className="font-sans">฿ </span>
          <span className="font-mono">{documents.toLocaleString("th-TH")}</span>
        </span>
      </div>
      <div className="mt-1.5 flex items-center gap-2 border-t border-border pt-1.5 font-medium">
        <span className="text-muted-foreground">รวม</span>
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
    <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full" style={{ backgroundColor: MAINTENANCE_COLOR }} />
            <span className="text-muted-foreground">ซ่อมบำรุง</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full" style={{ backgroundColor: DOCUMENTS_COLOR }} />
            <span className="text-muted-foreground">เอกสาร</span>
          </span>
        </div>
        <div className="flex gap-1">
          <Button
            type="button"
            size="sm"
            variant={view === "monthly" ? "default" : "outline"}
            onClick={() => setView("monthly")}
          >
            รายเดือน
          </Button>
          <Button
            type="button"
            size="sm"
            variant={view === "yearly" ? "default" : "outline"}
            onClick={() => setView("yearly")}
          >
            รายปี
          </Button>
        </div>
      </div>

      <p className="mb-3 text-2xl font-bold tracking-tight">
        <span className="font-sans">฿ </span>
        <span className="font-mono">{periodTotal.toLocaleString("th-TH")}</span>
        <span className="ml-1.5 text-sm font-normal text-muted-foreground">
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
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
            <Bar dataKey="maintenance" stackId="cost" fill={MAINTENANCE_COLOR} radius={[0, 0, 0, 0]} />
            <Bar dataKey="documents" stackId="cost" fill={DOCUMENTS_COLOR} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <p className="flex h-[240px] items-center justify-center text-sm text-muted-foreground">
          ยังไม่มีข้อมูลค่าใช้จ่าย
        </p>
      )}
    </div>
  );
}
