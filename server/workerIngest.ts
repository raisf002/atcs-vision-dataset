import crypto from "crypto";
import express, { type Express, type Request, type Response } from "express";
import { and, eq, sql } from "drizzle-orm";
import { cameras, captureErrors, snapshots } from "../drizzle/schema";
import { makeSnapshotStorageKey } from "../shared/dataset";
import { getDb } from "./db";
import { ensureDatasetFoundation } from "./dataset";
import { ENV } from "./_core/env";
import { storagePutExact } from "./storage";

const JPEG_CONTENT_TYPE = "image/jpeg";
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

function hasValidWorkerToken(request: Request) {
  const expected = ENV.captureWorkerIngestToken;
  const provided = request.header("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!expected || !provided || expected.length !== provided.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(provided));
}

function requireWorkerToken(request: Request, response: Response) {
  if (!ENV.captureWorkerIngestToken) {
    response.status(503).json({ error: "worker_ingest_not_configured" });
    return false;
  }
  if (!hasValidWorkerToken(request)) {
    response.status(401).json({ error: "worker_unauthorized" });
    return false;
  }
  return true;
}

function parseCapturedAt(value: string | undefined) {
  const capturedAt = new Date(value ?? "");
  if (Number.isNaN(capturedAt.getTime())) throw new Error("x-captured-at harus berupa timestamp ISO valid");
  return capturedAt;
}

function optionalInteger(value: string | undefined) {
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

export async function listWorkerCameras() {
  await ensureDatasetFoundation();
  const db = await getDb();
  if (!db) throw new Error("Database tidak tersedia");
  const rows = await db.select({
    id: cameras.id,
    sourceUrl: cameras.sourceUrl,
    sourceKind: cameras.sourceKind,
    captureIntervalMinutes: cameras.captureIntervalMinutes,
    lastCaptureAt: cameras.lastCaptureAt,
  }).from(cameras).where(and(eq(cameras.isActive, true), eq(cameras.sourceStatus, "verified")));
  return rows.filter((camera) => camera.sourceUrl && camera.sourceKind === "hls");
}

export async function recordCaptureFailure(cameraId: string, message: string) {
  const db = await getDb();
  if (!db) throw new Error("Database tidak tersedia");
  const safeMessage = message.slice(0, 4000);
  await db.transaction(async (tx) => {
    await tx.update(cameras).set({ lastCaptureStatus: "failed", lastError: safeMessage }).where(eq(cameras.id, cameraId));
    await tx.insert(captureErrors).values({ cameraId, message: safeMessage });
  });
}

export async function ingestWorkerSnapshot(input: {
  cameraId: string;
  capturedAt: Date;
  image: Buffer;
  width?: number;
  height?: number;
}) {
  if (!input.image.length || input.image.length > MAX_IMAGE_BYTES) throw new Error("Ukuran JPEG worker tidak valid");
  await ensureDatasetFoundation();
  const db = await getDb();
  if (!db) throw new Error("Database tidak tersedia");
  const [camera] = await db.select().from(cameras).where(eq(cameras.id, input.cameraId)).limit(1);
  if (!camera) throw new Error("Kamera tidak ditemukan");
  if (!camera.isActive || camera.sourceStatus !== "verified") throw new Error("Kamera tidak aktif atau sumber belum terverifikasi");

  const storageKey = makeSnapshotStorageKey(input.cameraId, input.capturedAt);
  await storagePutExact(storageKey, input.image, JPEG_CONTENT_TYPE);
  const existing = await db.select({ id: snapshots.id }).from(snapshots).where(eq(snapshots.storageKey, storageKey)).limit(1);

  await db.transaction(async (tx) => {
    if (!existing[0]) {
      await tx.insert(snapshots).values({
        cameraId: input.cameraId,
        capturedAt: input.capturedAt,
        storageKey,
        contentType: JPEG_CONTENT_TYPE,
        sizeBytes: input.image.length,
        width: input.width,
        height: input.height,
      });
      await tx.update(cameras).set({
        captureCount: sql`${cameras.captureCount} + 1`,
        lastCaptureAt: input.capturedAt,
        lastCaptureStatus: "success",
        lastError: null,
      }).where(eq(cameras.id, input.cameraId));
    } else {
      await tx.update(cameras).set({ lastCaptureAt: input.capturedAt, lastCaptureStatus: "success", lastError: null }).where(eq(cameras.id, input.cameraId));
    }
  });

  return { storageKey, duplicate: Boolean(existing[0]) };
}

export function registerWorkerIngestRoutes(app: Express) {
  app.get("/api/worker/cameras", async (request, response) => {
    if (!requireWorkerToken(request, response)) return;
    try {
      const cameras = await listWorkerCameras();
      response.json({ cameras, generatedAt: new Date().toISOString() });
    } catch (error) {
      response.status(500).json({ error: error instanceof Error ? error.message : "worker_camera_config_failed" });
    }
  });

  app.put("/api/worker/ingest", express.raw({ type: JPEG_CONTENT_TYPE, limit: "8mb" }), async (request, response) => {
    if (!requireWorkerToken(request, response)) return;
    try {
      const image = Buffer.isBuffer(request.body) ? request.body : Buffer.alloc(0);
      const result = await ingestWorkerSnapshot({
        cameraId: request.header("x-camera-id") ?? "",
        capturedAt: parseCapturedAt(request.header("x-captured-at") ?? undefined),
        image,
        width: optionalInteger(request.header("x-capture-width") ?? undefined),
        height: optionalInteger(request.header("x-capture-height") ?? undefined),
      });
      response.status(201).json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "worker_ingest_failed";
      const cameraId = request.header("x-camera-id");
      if (cameraId) await recordCaptureFailure(cameraId, message).catch(() => undefined);
      response.status(400).json({ error: message });
    }
  });

  app.post("/api/worker/failure", async (request, response) => {
    if (!requireWorkerToken(request, response)) return;
    const cameraId = typeof request.body?.cameraId === "string" ? request.body.cameraId : "";
    const message = typeof request.body?.message === "string" ? request.body.message : "capture_worker_failure";
    if (!cameraId) return response.status(400).json({ error: "cameraId diperlukan" });
    try {
      await recordCaptureFailure(cameraId, message);
      response.status(201).json({ ok: true });
    } catch (error) {
      response.status(500).json({ error: error instanceof Error ? error.message : "capture_error_log_failed" });
    }
  });
}
