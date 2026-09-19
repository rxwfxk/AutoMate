import { getDateFlagStatus, getMaintenanceFlagStatus, worseFlag, type FlagStatus } from "@/lib/flag-status";
import { DOCUMENT_TYPE_LABEL } from "@/lib/document-types";
import type { MaintenanceLogWithType } from "@/components/maintenance/maintenance-log-item";
import type { Document } from "@/types/database.types";

/** Worst flag across a single vehicle's logs + documents, or `null` if the
 * vehicle has nothing tracked yet (distinct from "green" — there's simply
 * no data to be confident about). */
export function getVehicleOverallStatus(
  vehicleId: string,
  currentMileage: number,
  logs: MaintenanceLogWithType[],
  documents: Document[],
): FlagStatus | null {
  const vehicleLogs = logs.filter((l) => l.vehicle_id === vehicleId);
  const vehicleDocs = documents.filter((d) => d.vehicle_id === vehicleId);
  if (vehicleLogs.length === 0 && vehicleDocs.length === 0) return null;

  let status: FlagStatus = "green";
  for (const log of vehicleLogs) {
    status = worseFlag(
      status,
      getMaintenanceFlagStatus({
        nextDueDate: log.next_due_date,
        nextDueMileage: log.next_due_mileage,
        currentMileage,
        intervalKm: log.maintenance_types?.default_interval_km,
      }),
    );
  }
  for (const doc of vehicleDocs) {
    status = worseFlag(status, getDateFlagStatus(doc.expiry_date));
  }
  return status;
}

/** Count of logs+documents (across every vehicle, plus the driving license)
 * currently yellow or red — the dashboard's "needs attention" tile. */
export function countActionableItems(
  logs: MaintenanceLogWithType[],
  vehicleMileageById: Map<string, number>,
  documents: Document[],
): number {
  let count = 0;
  for (const log of logs) {
    const currentMileage = vehicleMileageById.get(log.vehicle_id) ?? 0;
    const status = getMaintenanceFlagStatus({
      nextDueDate: log.next_due_date,
      nextDueMileage: log.next_due_mileage,
      currentMileage,
      intervalKm: log.maintenance_types?.default_interval_km,
    });
    if (status !== "green") count++;
  }
  for (const doc of documents) {
    if (getDateFlagStatus(doc.expiry_date) !== "green") count++;
  }
  return count;
}

export type UrgentItem = {
  status: FlagStatus;
  title: string;
  vehicleId: string;
  vehicleName: string | null;
  dueMileage: number | null;
  dueDate: string | null;
  href: string;
};

const STATUS_RANK: Record<FlagStatus, number> = { green: 0, yellow: 1, red: 2 };

/** The single most urgent item across every vehicle's logs + documents, for
 * the dashboard's priority task card — `null` when everything is green (or
 * there's nothing tracked yet). Among items sharing the worst status, keeps
 * whichever was encountered first (logs before documents); good enough for
 * "what needs attention", not a strict overdue-amount ranking. */
export function getMostUrgentItem(
  logs: MaintenanceLogWithType[],
  documents: Document[],
  vehicleMileageById: Map<string, number>,
  vehicleNameById: Map<string, string>,
): UrgentItem | null {
  return getTopUrgentItems(logs, documents, vehicleMileageById, vehicleNameById, 1)[0] ?? null;
}

/** The `limit` most urgent non-green items across the given logs+documents,
 * worst first — the vehicles-list card's "2 รายการเร่งด่วนสุด" summary and,
 * with `limit` 1, `getMostUrgentItem`. The sort is stable, so ties keep
 * encounter order (logs before documents). */
export function getTopUrgentItems(
  logs: MaintenanceLogWithType[],
  documents: Document[],
  vehicleMileageById: Map<string, number>,
  vehicleNameById: Map<string, string>,
  limit: number,
): UrgentItem[] {
  const items: UrgentItem[] = [];

  for (const log of logs) {
    const currentMileage = vehicleMileageById.get(log.vehicle_id) ?? 0;
    const status = getMaintenanceFlagStatus({
      nextDueDate: log.next_due_date,
      nextDueMileage: log.next_due_mileage,
      currentMileage,
      intervalKm: log.maintenance_types?.default_interval_km,
    });
    if (status === "green") continue;
    items.push({
      status,
      title: log.maintenance_types?.name ?? "ไม่ระบุประเภท",
      vehicleId: log.vehicle_id,
      vehicleName: vehicleNameById.get(log.vehicle_id) ?? null,
      dueMileage: log.next_due_mileage,
      dueDate: log.next_due_date,
      href: `/vehicles/${log.vehicle_id}/maintenance/new`,
    });
  }

  for (const doc of documents) {
    if (!doc.vehicle_id) continue; // driving license — handled separately, not vehicle-scoped
    const status = getDateFlagStatus(doc.expiry_date);
    if (status === "green") continue;
    items.push({
      status,
      title: DOCUMENT_TYPE_LABEL[doc.document_type],
      vehicleId: doc.vehicle_id,
      vehicleName: vehicleNameById.get(doc.vehicle_id) ?? null,
      dueMileage: null,
      dueDate: doc.expiry_date,
      href: `/vehicles/${doc.vehicle_id}/documents/new`,
    });
  }

  return items.sort((a, b) => STATUS_RANK[b.status] - STATUS_RANK[a.status]).slice(0, limit);
}

/** Most recent `limit` logs by service_date, newest first — dashboard's
 * "recent activity" timeline. */
export function getRecentActivity(logs: MaintenanceLogWithType[], limit = 8): MaintenanceLogWithType[] {
  return [...logs].sort((a, b) => b.service_date.localeCompare(a.service_date)).slice(0, limit);
}

export type MonthlyExpensePoint = {
  key: string;
  label: string;
  maintenance: number;
  documents: number;
};

/** Trailing `months` calendar months (oldest first), bucketed by
 * service_date (maintenance) / issue_date-or-created_at (documents). */
export function aggregateMonthlyExpenses(
  logs: { service_date: string; cost: number | null }[],
  documents: { issue_date: string | null; created_at: string; cost: number | null }[],
  months = 6,
  today = new Date(),
): MonthlyExpensePoint[] {
  const points: MonthlyExpensePoint[] = [];
  const buckets = new Map<string, MonthlyExpensePoint>();

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const point: MonthlyExpensePoint = {
      key,
      label: d.toLocaleDateString("th-TH", { month: "short", year: "2-digit" }),
      maintenance: 0,
      documents: 0,
    };
    points.push(point);
    buckets.set(key, point);
  }

  for (const log of logs) {
    if (!log.cost) continue;
    const key = log.service_date.slice(0, 7);
    const bucket = buckets.get(key);
    if (bucket) bucket.maintenance += log.cost;
  }

  for (const doc of documents) {
    if (!doc.cost) continue;
    const dateStr = doc.issue_date ?? doc.created_at;
    const key = dateStr.slice(0, 7);
    const bucket = buckets.get(key);
    if (bucket) bucket.documents += doc.cost;
  }

  return points;
}

export type YearlyExpensePoint = {
  key: string;
  label: string;
  maintenance: number;
  documents: number;
};

/** One bucket per calendar year present in the data (oldest first), always
 * including the current year even with no data yet. */
export function aggregateYearlyExpenses(
  logs: { service_date: string; cost: number | null }[],
  documents: { issue_date: string | null; created_at: string; cost: number | null }[],
  today = new Date(),
): YearlyExpensePoint[] {
  const buckets = new Map<string, YearlyExpensePoint>();

  function bucketFor(year: string): YearlyExpensePoint {
    let bucket = buckets.get(year);
    if (!bucket) {
      bucket = { key: year, label: year, maintenance: 0, documents: 0 };
      buckets.set(year, bucket);
    }
    return bucket;
  }

  bucketFor(String(today.getFullYear()));

  for (const log of logs) {
    if (!log.cost) continue;
    bucketFor(log.service_date.slice(0, 4)).maintenance += log.cost;
  }
  for (const doc of documents) {
    if (!doc.cost) continue;
    bucketFor((doc.issue_date ?? doc.created_at).slice(0, 4)).documents += doc.cost;
  }

  return Array.from(buckets.values()).sort((a, b) => a.key.localeCompare(b.key));
}

export type UsageSummary = {
  vehicleCount: number;
  totalLogs: number;
  /** % of logs done on or before the due date/mileage set by the previous
   * log of the same type on the same vehicle — `null` when there's no such
   * pair to compare yet (first log of its kind always has nothing to be
   * "on time" against). Not defined anywhere in the design handoff, so this
   * is a judgment call: "on time" means neither the date nor the mileage
   * threshold from the prior log was exceeded, mirroring the same
   * worst-of-date-or-mileage philosophy `getMaintenanceFlagStatus` uses. */
  onTimeRate: number | null;
  totalCost: number;
  /** Total cost divided by whole months since the earliest record (logs or
   * documents combined), floored at 1 month so a same-month total isn't
   * divided by zero. */
  avgCostPerMonth: number;
};

/** Profile page's "สรุปการใช้งาน" card — see `getUsageSummary`'s per-field docs. */
export function getUsageSummary(
  vehicleCount: number,
  logs: MaintenanceLogWithType[],
  documents: { issue_date: string | null; created_at: string; cost: number | null }[],
  today = new Date(),
): UsageSummary {
  const byVehicleAndType = new Map<string, MaintenanceLogWithType[]>();
  for (const log of logs) {
    const key = `${log.vehicle_id}:${log.maintenance_type_id}`;
    const bucket = byVehicleAndType.get(key);
    if (bucket) bucket.push(log);
    else byVehicleAndType.set(key, [log]);
  }

  let comparable = 0;
  let onTime = 0;
  for (const group of byVehicleAndType.values()) {
    const sorted = [...group].sort((a, b) => a.service_date.localeCompare(b.service_date));
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1];
      const curr = sorted[i];
      if (prev.next_due_date === null && prev.next_due_mileage === null) continue;
      comparable++;
      const dateOk = prev.next_due_date === null || curr.service_date <= prev.next_due_date;
      const mileageOk = prev.next_due_mileage === null || curr.mileage_at_service <= prev.next_due_mileage;
      if (dateOk && mileageOk) onTime++;
    }
  }

  const totalCost =
    logs.reduce((sum, l) => sum + (l.cost ?? 0), 0) + documents.reduce((sum, d) => sum + (d.cost ?? 0), 0);

  const allDates = [
    ...logs.map((l) => l.service_date),
    ...documents.map((d) => d.issue_date ?? d.created_at),
  ];
  let monthsSpan = 1;
  if (allDates.length > 0) {
    const earliest = new Date(allDates.reduce((min, d) => (d < min ? d : min)));
    monthsSpan = Math.max(
      1,
      (today.getFullYear() - earliest.getFullYear()) * 12 + (today.getMonth() - earliest.getMonth()) + 1,
    );
  }

  return {
    vehicleCount,
    totalLogs: logs.length,
    onTimeRate: comparable > 0 ? Math.round((onTime / comparable) * 100) : null,
    totalCost,
    avgCostPerMonth: Math.round(totalCost / monthsSpan),
  };
}
