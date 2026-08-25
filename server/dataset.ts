import { and, asc, count, desc, eq, gte, inArray, lte, sql, sum } from "drizzle-orm";
import { captureErrors, cameras, captureSettings, datasetExports, datasetSettings, snapshotAnnotations, snapshots, users } from "../drizzle/schema";
import { ATCS_CAMERA_SEED } from "../shared/atcsCameras";
import { getDb } from "./db";
import { DEFAULT_YOLO_CLASSES, validateYoloLabel } from "./trainingDataset";

export type DatasetPolicy = {
  id: number;
  classMap: string[];
  retentionDays: number;
  retentionEnabled: boolean;
  updatedByUserId: number | null;
  createdAt: Date;
  updatedAt: Date;
};

function parseClassMap(value: string) {
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [...DEFAULT_YOLO_CLASSES];
    const classMap = parsed.map((label) => String(label).trim()).filter(Boolean).slice(0, 64);
    return classMap.length ? classMap : [...DEFAULT_YOLO_CLASSES];
  } catch {
    return [...DEFAULT_YOLO_CLASSES];
  }
}

export async function ensureDatasetFoundation() {
  const db = await getDb();
  if (!db) throw new Error("Database tidak tersedia");

  const existing = await db.select({ id: cameras.id }).from(cameras);
  const existingIds = new Set(existing.map((camera) => camera.id));
  const missing = ATCS_CAMERA_SEED.filter((camera) => !existingIds.has(camera.id));
  if (missing.length > 0) await db.insert(cameras).values(missing);

  const settings = await db.select({ id: captureSettings.id }).from(captureSettings).where(eq(captureSettings.id, 1)).limit(1);
  if (settings.length === 0) await db.insert(captureSettings).values({ id: 1, intervalMinutes: "5", isEnabled: false });

  const policy = await db.select({ id: datasetSettings.id }).from(datasetSettings).where(eq(datasetSettings.id, 1)).limit(1);
  if (policy.length === 0) await db.insert(datasetSettings).values({ id: 1, classMapJson: JSON.stringify(DEFAULT_YOLO_CLASSES), retentionDays: 365, retentionEnabled: false });
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

export async function getDatasetPolicy(): Promise<DatasetPolicy | null> {
  await ensureDatasetFoundation();
  const db = await getDb();
  if (!db) return null;
  const row = (await db.select().from(datasetSettings).where(eq(datasetSettings.id, 1)).limit(1))[0];
  if (!row) return null;
  return { ...row, classMap: parseClassMap(row.classMapJson) };
}

export async function updateDatasetPolicy(input: { classMap: string[]; retentionDays: number; retentionEnabled: boolean }, userId: number) {
  await ensureDatasetFoundation();
  const db = await getDb();
  if (!db) throw new Error("Database tidak tersedia");
  const classMap = input.classMap.map((label) => label.trim()).filter(Boolean).slice(0, 64);
  if (!classMap.length) throw new Error("Class map tidak boleh kosong");
  await db.update(datasetSettings).set({ classMapJson: JSON.stringify(classMap), retentionDays: input.retentionDays, retentionEnabled: input.retentionEnabled, updatedByUserId: userId }).where(eq(datasetSettings.id, 1));
}

export type DatasetExportAuditInput = {
  requestedByUserId: number;
  cameraId: string | null;
  fromDate: Date;
  toDate: Date;
  exportMode: "raw" | "training";
  fileCount: number;
  filters: unknown;
  manifest?: unknown;
  qualitySummary?: unknown;
  status?: "ready" | "failed";
  errorMessage?: string;
};

export async function recordDatasetExport(input: DatasetExportAuditInput) {
  const db = await getDb();
  if (!db) return;
  await db.insert(datasetExports).values({
    requestedByUserId: input.requestedByUserId,
    cameraId: input.cameraId,
    fromDate: input.fromDate,
    toDate: input.toDate,
    exportMode: input.exportMode,
    fileCount: input.fileCount,
    filtersJson: JSON.stringify(input.filters),
    manifestJson: input.manifest ? JSON.stringify(input.manifest) : null,
    qualitySummaryJson: input.qualitySummary ? JSON.stringify(input.qualitySummary) : null,
    status: input.status ?? "ready",
    errorMessage: input.errorMessage ?? null,
    completedAt: new Date(),
  });
}

export async function listDatasetExportAudits(limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: datasetExports.id,
    requestedByUserId: datasetExports.requestedByUserId,
    requestedByName: users.name,
    cameraId: datasetExports.cameraId,
    fromDate: datasetExports.fromDate,
    toDate: datasetExports.toDate,
    exportMode: datasetExports.exportMode,
    status: datasetExports.status,
    fileCount: datasetExports.fileCount,
    filtersJson: datasetExports.filtersJson,
    qualitySummaryJson: datasetExports.qualitySummaryJson,
    createdAt: datasetExports.createdAt,
    completedAt: datasetExports.completedAt,
  }).from(datasetExports).leftJoin(users, eq(datasetExports.requestedByUserId, users.id)).orderBy(desc(datasetExports.createdAt)).limit(limit);
}

export async function listSnapshotAnnotations(snapshotIds: number[]) {
  const db = await getDb();
  if (!db || snapshotIds.length === 0) return [];
  return db.select().from(snapshotAnnotations).where(inArray(snapshotAnnotations.snapshotId, snapshotIds));
}

export async function saveSnapshotAnnotation(input: { snapshotId: number; yoloText: string; status: "draft" | "approved" | "rejected" }, userId: number) {
  await ensureDatasetFoundation();
  const db = await getDb();
  if (!db) throw new Error("Database tidak tersedia");
  const snapshot = (await db.select({ id: snapshots.id }).from(snapshots).where(eq(snapshots.id, input.snapshotId)).limit(1))[0];
  if (!snapshot) throw new Error("Snapshot tidak ditemukan");
  await db.insert(snapshotAnnotations).values({ ...input, updatedByUserId: userId }).onDuplicateKeyUpdate({
    set: { yoloText: input.yoloText, status: input.status, updatedByUserId: userId, updatedAt: new Date() },
  });
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

export async function getTrainingReadiness(input: { cameraId?: string; from?: Date; to?: Date; limit: number }) {
  const [items, policy] = await Promise.all([listSnapshots(input), getDatasetPolicy()]);
  const annotations = await listSnapshotAnnotations(items.map((item) => item.id));
  const annotationBySnapshot = new Map(annotations.map((annotation) => [annotation.snapshotId, annotation]));
  const classMap = policy?.classMap ?? [...DEFAULT_YOLO_CLASSES];
  let approved = 0;
  let invalid = 0;
  for (const snapshot of items) {
    const annotation = annotationBySnapshot.get(snapshot.id);
    if (annotation?.status !== "approved") continue;
    const validation = validateYoloLabel(annotation.yoloText, classMap.length);
    if (validation.valid) approved += 1;
    else invalid += 1;
  }
  return {
    totalSnapshots: items.length,
    approvedAnnotations: approved,
    pendingAnnotations: Math.max(0, items.length - approved - invalid),
    invalidAnnotations: invalid,
    classMap,
  };
}

export async function getSnapshotStatsByCamera(cameraIds: string[]) {
  const db = await getDb();
  if (!db || cameraIds.length === 0) return [];
  return db.select({ cameraId: snapshots.cameraId, count: count(snapshots.id), storageBytes: sum(snapshots.sizeBytes) }).from(snapshots).where(inArray(snapshots.cameraId, cameraIds)).groupBy(snapshots.cameraId);
}

export type CaptureAvailability = {
  cameraId: string;
  successfulCaptures: number;
  hlsTransientFailures: number;
  pipelineFailures: number;
  attempts: number;
  availabilityPercent: number | null;
  coverageStatus: "healthy" | "degraded" | "unknown";
};

export function buildCaptureAvailability(input: {
  cameraIds: string[];
  successfulCaptureCameraIds: string[];
  errors: Array<{ cameraId: string; message: string }>;
}): CaptureAvailability[] {
  const rows = new Map(input.cameraIds.map((cameraId) => [cameraId, { successfulCaptures: 0, hlsTransientFailures: 0, pipelineFailures: 0 }]));
  for (const cameraId of input.successfulCaptureCameraIds) {
    const row = rows.get(cameraId);
    if (row) row.successfulCaptures += 1;
  }
  for (const error of input.errors) {
    const row = rows.get(error.cameraId);
    if (!row) continue;
    if (error.message.includes("HLS_TRANSIENT")) row.hlsTransientFailures += 1;
    else row.pipelineFailures += 1;
  }
  return input.cameraIds.map((cameraId) => {
    const row = rows.get(cameraId) ?? { successfulCaptures: 0, hlsTransientFailures: 0, pipelineFailures: 0 };
    const attempts = row.successfulCaptures + row.hlsTransientFailures + row.pipelineFailures;
    const availabilityPercent = attempts ? Math.round((row.successfulCaptures / attempts) * 100) : null;
    const coverageStatus = attempts === 0 ? "unknown" : row.hlsTransientFailures > 0 || (availabilityPercent ?? 0) < 80 ? "degraded" : "healthy";
    return { cameraId, ...row, attempts, availabilityPercent, coverageStatus };
  });
}

export async function getCaptureAvailability(days = 7) {
  await ensureDatasetFoundation();
  const db = await getDb();
  if (!db) return [];
  const start = new Date();
  start.setUTCDate(start.getUTCDate() - (days - 1));
  start.setUTCHours(0, 0, 0, 0);
  const [cameraRows, successfulRows, errorRows] = await Promise.all([
    db.select({ id: cameras.id }).from(cameras).orderBy(asc(cameras.sortOrder)),
    db.select({ cameraId: snapshots.cameraId }).from(snapshots).where(gte(snapshots.capturedAt, start)),
    db.select({ cameraId: captureErrors.cameraId, message: captureErrors.message }).from(captureErrors).where(gte(captureErrors.occurredAt, start)),
  ]);
  return buildCaptureAvailability({ cameraIds: cameraRows.map((camera) => camera.id), successfulCaptureCameraIds: successfulRows.map((row) => row.cameraId), errors: errorRows });
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
  const captureDate = sql<string>`DATE(${snapshots.capturedAt})`.as("date");
  try {
    return await db.select({ date: captureDate, count: count(snapshots.id) }).from(snapshots).where(gte(snapshots.capturedAt, start)).groupBy(captureDate).orderBy(asc(captureDate));
  } catch (error) {
    console.warn("[Dataset] Daily SQL aggregation failed; using application fallback:", error);
    const rows = await db.select({ capturedAt: snapshots.capturedAt }).from(snapshots).where(gte(snapshots.capturedAt, start)).orderBy(asc(snapshots.capturedAt));
    return aggregateDailySnapshotRows(rows);
  }
}
