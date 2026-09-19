/**
 * "Superseded" rule: once a maintenance type (per vehicle) or a document type
 * (per vehicle / per user for the driving license) has been recorded again,
 * only the newest record counts for alerts and flags. Older records stay in
 * the history lists but no longer raise reminders.
 */

type LogLike = { id: string; vehicle_id: string; maintenance_type_id: string; service_date: string; created_at: string };
type DocLike = {
  id: string;
  vehicle_id: string | null;
  user_id: string | null;
  document_type: string;
  expiry_date: string;
  created_at: string;
};

/** Negative when `a` is newer than `b`. */
function newerFirst(a: [string, string], b: [string, string]) {
  return b[0].localeCompare(a[0]) || b[1].localeCompare(a[1]);
}

function latestIds<T extends { id: string }>(items: T[], keyOf: (item: T) => string, rankOf: (item: T) => [string, string]) {
  const best = new Map<string, T>();
  for (const item of items) {
    const current = best.get(keyOf(item));
    if (!current || newerFirst(rankOf(item), rankOf(current)) < 0) best.set(keyOf(item), item);
  }
  return new Set(Array.from(best.values(), (item) => item.id));
}

/** Ids of the newest log per (vehicle, maintenance type) — by service date, then created_at. */
export function getCurrentLogIds(logs: LogLike[]) {
  return latestIds(
    logs,
    (l) => `${l.vehicle_id}:${l.maintenance_type_id}`,
    (l) => [l.service_date, l.created_at],
  );
}

/** Ids of the newest document per (owner, type) — by expiry date (a renewal expires later), then created_at. */
export function getCurrentDocumentIds(documents: DocLike[]) {
  return latestIds(
    documents,
    (d) => `${d.vehicle_id ?? d.user_id}:${d.document_type}`,
    (d) => [d.expiry_date, d.created_at],
  );
}

export function currentLogs<T extends LogLike>(logs: T[]): T[] {
  const ids = getCurrentLogIds(logs);
  return logs.filter((l) => ids.has(l.id));
}

export function currentDocuments<T extends DocLike>(documents: T[]): T[] {
  const ids = getCurrentDocumentIds(documents);
  return documents.filter((d) => ids.has(d.id));
}
