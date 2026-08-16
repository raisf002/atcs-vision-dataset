import { and, asc, count, desc, eq, gte, inArray, lte, sql, sum } from "drizzle-orm";
import { captureErrors, cameras, captureSettings, snapshots } from "../drizzle/schema";
import { ATCS_CAMERA_SEED } from "../shared/atcsCameras";
import { getDb } from "./db";

export async function ensureDatasetFoundation() {
  const db = await getDb();
  if (!db) throw new Error("Database tidak tersedia");

  const existing = await db.select({ id: cameras.id }).from(cameras);
  const existingIds = new Set(existing.map((camera) => camera.id));
  const missing = ATCS_CAMERA_SEED.filter((camera) => !existingIds.has(camera.id));
  if (missing.length > 0) await db.insert(cameras).values(missing);

  const settings = await db.select({ id: captureSettings.id }).from(captureSettings).where(eq(captureSettings.id, 1)).limit(1);
  if (settings.length === 0) await db.insert(captureSettings).values({ id: 1, intervalMinutes: "5", isEnabled: false });
}

export async function listCameras() {
  await ensureDatasetFoundation();
  const db = await getDb();
  if (!db) return [];
  return db.select().from(cameras).orderBy(asc(cameras.sortOrder));
}

export async function updateCameraConfig(input: {
  id: string;
  sourceUrl?: string | null;
  sourceKind?: "hls" | "snapshot";
  sourceStatus?: "pending" | "verified" | "invalid";
  isActive?: boolean;
  captureIntervalMinutes?: "1" | "5" | "10" | "15" | null;
}) {
  await ensureDatasetFoundation();
  const db = await getDb();
  if (!db) throw new Error("Database tidak tersedia");
  const { id, ...updates } = input;
  await db.update(cameras).set(updates).where(eq(cameras.id, id));
}

export async function getCaptureSettings() {
  await ensureDatasetFoundation();
  const db = await getDb();
  if (!db) return null;
  return (await db.select().from(captureSettings).where(eq(captureSettings.id, 1)).limit(1))[0] ?? null;
}

export async function updateCaptureSettings(input: { intervalMinutes: "1" | "5" | "10" | "15"; isEnabled: boolean }) {
  await ensureDatasetFoundation();
  const db = await getDb();
  if (!db) throw new Error("Database tidak tersedia");
  await db.update(captureSettings).set(input).where(eq(captureSettings.id, 1));
}

export async function getDatasetOverview() {
  await ensureDatasetFoundation();
  const db = await getDb();
  if (!db) throw new Error("Database tidak tersedia");

  const [cameraRows, storageRows, errorRows, settings] = await Promise.all([
    db.select().from(cameras).orderBy(asc(cameras.sortOrder)),
    db.select({ snapshots: count(snapshots.id), storageBytes: sql<number>`COALESCE(SUM(${snapshots.sizeBytes}), 0)` }).from(snapshots),
    db.select().from(captureErrors).orderBy(desc(captureErrors.occurredAt)).limit(8),
    getCaptureSettings(),
  ]);

  return {
    cameras: cameraRows,
    totals: {
      snapshots: storageRows[0]?.snapshots ?? 0,
      storageBytes: Number(storageRows[0]?.storageBytes ?? 0),
      verifiedSources: cameraRows.filter((camera) => camera.sourceStatus === "verified").length,
      activeCameras: cameraRows.filter((camera) => camera.isActive).length,
    },
    errors: errorRows,
    settings,
  };
}

export async function listSnapshots(input: { cameraId?: string; from?: Date; to?: Date; limit: number }) {
  const db = await getDb();
  if (!db) return [];
  const filters = [
    input.cameraId ? eq(snapshots.cameraId, input.cameraId) : undefined,
    input.from ? gte(snapshots.capturedAt, input.from) : undefined,
    input.to ? lte(snapshots.capturedAt, input.to) : undefined,
  ].filter(Boolean);
  return db.select().from(snapshots).where(filters.length ? and(...filters) : undefined).orderBy(desc(snapshots.capturedAt)).limit(input.limit);
}

export async function getSnapshotStatsByCamera(cameraIds: string[]) {
  const db = await getDb();
  if (!db || cameraIds.length === 0) return [];
  return db.select({ cameraId: snapshots.cameraId, count: count(snapshots.id), storageBytes: sum(snapshots.sizeBytes) }).from(snapshots).where(inArray(snapshots.cameraId, cameraIds)).groupBy(snapshots.cameraId);
}

export function aggregateDailySnapshotRows(rows: Array<{ capturedAt: Date | string }>) {
  const totals = new Map<string, number>();
  for (const row of rows) {
    const date = new Date(row.capturedAt).toISOString().slice(0, 10);
    totals.set(date, (totals.get(date) ?? 0) + 1);
  }
  return Array.from(totals.entries()).sort(([left], [right]) => left.localeCompare(right)).map(([date, snapshotCount]) => ({ date, count: snapshotCount }));
}

export async function getDailySnapshotCounts(days = 7) {
  const db = await getDb();
  if (!db) return [];
  const start = new Date();
  start.setUTCDate(start.getUTCDate() - (days - 1));
  start.setUTCHours(0, 0, 0, 0);
  const captureDate = sql<string>`DATE(${snapshots.capturedAt})`;
  try {
    return await db.select({ date: captureDate, count: count(snapshots.id) }).from(snapshots).where(gte(snapshots.capturedAt, start)).groupBy(captureDate).orderBy(asc(captureDate));
  } catch (error) {
    console.warn("[Dataset] Daily SQL aggregation failed; using application fallback:", error);
    const rows = await db.select({ capturedAt: snapshots.capturedAt }).from(snapshots).where(gte(snapshots.capturedAt, start)).orderBy(asc(snapshots.capturedAt));
    return aggregateDailySnapshotRows(rows);
  }
}
