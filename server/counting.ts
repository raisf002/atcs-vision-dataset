import { and, desc, eq, or } from "drizzle-orm";
import { cameraCountingConfigs, visionModels } from "../drizzle/schema";
import { createDefaultCountingConfig, type VirtualCountingLine } from "../shared/counting";
import { ensureDatasetFoundation } from "./dataset";
import { getDb } from "./db";

export type CountingConfigInput = {
  cameraId: string;
  modelId: string | null;
  isEnabled: boolean;
  confidenceThreshold: number;
  virtualLines: VirtualCountingLine[];
  classFilter: string[];
};

function readJson<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function normalizeCountingConfig(row: typeof cameraCountingConfigs.$inferSelect | undefined, cameraId: string) {
  const fallback = createDefaultCountingConfig(cameraId);
  if (!row) return fallback;
  return {
    cameraId: row.cameraId,
    modelId: row.modelId,
    isEnabled: row.isEnabled,
    confidenceThreshold: row.confidenceThreshold,
    virtualLines: readJson<VirtualCountingLine[]>(row.virtualLinesJson, []),
    classFilter: readJson<string[]>(row.classFilterJson, fallback.classFilter),
  };
}

export async function getCameraCountingConfig(cameraId: string) {
  await ensureDatasetFoundation();
  const db = await getDb();
  if (!db) throw new Error("Database tidak tersedia");
  const [row] = await db.select().from(cameraCountingConfigs).where(eq(cameraCountingConfigs.cameraId, cameraId)).limit(1);
  return normalizeCountingConfig(row, cameraId);
}

export async function saveCameraCountingConfig(input: CountingConfigInput, userId: number) {
  await ensureDatasetFoundation();
  const db = await getDb();
  if (!db) throw new Error("Database tidak tersedia");

  if (input.modelId) {
    const [model] = await db.select().from(visionModels).where(eq(visionModels.id, input.modelId)).limit(1);
    if (!model || model.status === "archived") throw new Error("Model visi yang dipilih tidak tersedia");
    if (model.scope === "camera" && model.cameraId !== input.cameraId) throw new Error("Model khusus kamera hanya dapat dipakai pada CCTV asalnya");
  }

  const values = {
    modelId: input.modelId,
    isEnabled: input.isEnabled,
    confidenceThreshold: input.confidenceThreshold,
    virtualLinesJson: JSON.stringify(input.virtualLines),
    classFilterJson: JSON.stringify(input.classFilter),
    updatedByUserId: userId,
  };

  const [existing] = await db.select({ cameraId: cameraCountingConfigs.cameraId }).from(cameraCountingConfigs).where(eq(cameraCountingConfigs.cameraId, input.cameraId)).limit(1);
  if (existing) {
    await db.update(cameraCountingConfigs).set(values).where(eq(cameraCountingConfigs.cameraId, input.cameraId));
  } else {
    await db.insert(cameraCountingConfigs).values({ cameraId: input.cameraId, ...values });
  }
  return getCameraCountingConfig(input.cameraId);
}

export async function listVisionModels(cameraId?: string) {
  const db = await getDb();
  if (!db) return [];
  if (cameraId) {
    return db.select().from(visionModels).where(or(
      eq(visionModels.scope, "global"),
      and(eq(visionModels.scope, "camera"), eq(visionModels.cameraId, cameraId)),
    )).orderBy(desc(visionModels.updatedAt));
  }
  return db.select().from(visionModels).orderBy(desc(visionModels.updatedAt));
}

export async function registerVisionModel(input: {
  id: string;
  name: string;
  framework: "yolo" | "onnx" | "tensorrt" | "other";
  format: "pt" | "onnx" | "engine" | "tflite" | "other";
  version?: string | null;
  fileName: string;
  storageKey: string;
  storageUrl: string;
  sizeBytes: number;
  labels: string[];
  description?: string | null;
  status: "draft" | "ready" | "archived";
  scope?: "global" | "camera";
  cameraId?: string | null;
}, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database tidak tersedia");
  const scope = input.scope ?? "global";
  if (scope === "camera" && !input.cameraId) throw new Error("Model khusus kamera memerlukan cameraId");
  await db.insert(visionModels).values({
    ...input,
    scope,
    cameraId: scope === "camera" ? input.cameraId : null,
    labelsJson: JSON.stringify(input.labels),
    createdByUserId: userId,
  });
  return (await db.select().from(visionModels).where(eq(visionModels.id, input.id)).limit(1))[0];
}
