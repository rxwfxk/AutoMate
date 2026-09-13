/**
 * Pit Wall flag system — 🟢 green (on track) / 🟡 yellow (due soon) /
 * 🔴 red (overdue). Whichever of the distance/time conditions is more
 * urgent wins ("เตือนตามเงื่อนไขไหนถึงก่อน" — see CLAUDE.md).
 *
 * Deliberately not persisted in the DB: both inputs (today's date, the
 * vehicle's current mileage) change independently of any write to the
 * maintenance/document row, so a stored flag would go stale. Compute it
 * at render/query time instead.
 */

export type FlagStatus = "green" | "yellow" | "red";

const DEFAULT_WARNING_DAYS = 30;
/** Used only when a maintenance type has no default_interval_km on record. */
const DEFAULT_WARNING_KM = 300;
/** Warn once this fraction of the type's interval remains. */
const WARNING_KM_FRACTION = 0.1;

function worseFlag(a: FlagStatus, b: FlagStatus): FlagStatus {
  const rank: Record<FlagStatus, number> = { green: 0, yellow: 1, red: 2 };
  return rank[a] >= rank[b] ? a : b;
}

export function getDateFlagStatus(
  dueDateIso: string | null,
  { warningDays = DEFAULT_WARNING_DAYS, today = new Date() }: { warningDays?: number; today?: Date } = {},
): FlagStatus {
  if (!dueDateIso) return "green";

  const due = new Date(`${dueDateIso}T00:00:00`);
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const daysRemaining = Math.round((due.getTime() - start.getTime()) / 86_400_000);

  if (daysRemaining < 0) return "red";
  if (daysRemaining <= warningDays) return "yellow";
  return "green";
}

export function getMileageFlagStatus(
  dueMileage: number | null,
  currentMileage: number,
  { intervalKm }: { intervalKm?: number | null } = {},
): FlagStatus {
  if (dueMileage === null) return "green";

  const kmRemaining = dueMileage - currentMileage;
  const warningKm = intervalKm ? intervalKm * WARNING_KM_FRACTION : DEFAULT_WARNING_KM;

  if (kmRemaining <= 0) return "red";
  if (kmRemaining <= warningKm) return "yellow";
  return "green";
}

export function getMaintenanceFlagStatus(params: {
  nextDueDate: string | null;
  nextDueMileage: number | null;
  currentMileage: number;
  intervalKm?: number | null;
  warningDays?: number;
  today?: Date;
}): FlagStatus {
  return worseFlag(
    getDateFlagStatus(params.nextDueDate, { warningDays: params.warningDays, today: params.today }),
    getMileageFlagStatus(params.nextDueMileage, params.currentMileage, { intervalKm: params.intervalKm }),
  );
}

export const FLAG_LABEL: Record<FlagStatus, string> = {
  green: "ปกติ",
  yellow: "ใกล้ถึงกำหนด",
  red: "เลยกำหนด",
};
