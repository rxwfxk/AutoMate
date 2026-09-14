import { getDateFlagStatus, getMaintenanceFlagStatus, worseFlag, type FlagStatus } from "@/lib/flag-status";
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
