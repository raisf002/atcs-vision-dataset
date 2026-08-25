import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import type { Express, Request, Response } from "express";
import { Readable } from "node:stream";
import { getDatasetPolicy, listSnapshotAnnotations, listSnapshots, recordDatasetExport, type DatasetExportAuditInput } from "./dataset";
import { sdk } from "./_core/sdk";
import { storageGetSignedUrl } from "./storage";
import { buildTrainingPlan, createDatasetYaml, inspectJpegQuality, type TrainingSnapshot } from "./trainingDataset";

const require = createRequire(import.meta.url);
const { ZipArchive } = require("archiver") as { ZipArchive: new (options: { zlib: { level: number } }) => { on: (event: "warning" | "error", callback: (error: Error & { code?: string }) => void) => unknown; pipe: (destination: Response) => Response; append: (source: Readable | Buffer | string, options: { name: string }) => unknown; finalize: () => Promise<void> } };
type ExportMode = "raw" | "training";

function parseDate(value: unknown, endOfDay = false) {
  if (typeof value !== "string" || !value) return undefined;
  const date = new Date(value.includes("T") ? value : `${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}Z`);
  if (Number.isNaN(date.getTime())) throw new Error("Format tanggal ekspor tidak valid");
  return date;
}

function getSingleQueryValue(value: unknown) { return typeof value === "string" ? value : undefined; }
function parseExportMode(value: unknown): ExportMode { return value === "training" ? "training" : "raw"; }
function makeTrainingVersion(input: unknown) { return `atcs-yolo-${createHash("sha256").update(JSON.stringify(input)).digest("hex").slice(0, 12)}`; }
async function loadSnapshotBytes(storageKey: string) { const signedUrl = await storageGetSignedUrl(storageKey); const objectResponse = await fetch(signedUrl); if (!objectResponse.ok || !objectResponse.body) throw new Error(`Objek snapshot tidak dapat dibaca: ${storageKey}`); return Buffer.from(await objectResponse.arrayBuffer()); }

export function registerExportZipRoute(app: Express) {
  app.get("/api/exports/zip", async (request: Request, response: Response) => {
    let user;
    try { user = await sdk.authenticateRequest(request); } catch { return response.status(401).json({ error: "authentication_required" }); }
    if (user.role !== "admin") return response.status(403).json({ error: "admin_only" });
    let auditContext: Omit<DatasetExportAuditInput, "status" | "errorMessage" | "manifest" | "qualitySummary"> | null = null;
    let auditRecorded = false;
    try {
      const cameraId = getSingleQueryValue(request.query.cameraId);
      const from = parseDate(getSingleQueryValue(request.query.from));
      const to = parseDate(getSingleQueryValue(request.query.to), true);
      const mode = parseExportMode(getSingleQueryValue(request.query.mode));
      if (from && to && from > to) return response.status(400).json({ error: "Rentang tanggal ekspor tidak valid" });
      const items = await listSnapshots({ cameraId, from, to, limit: 120 });
      if (items.length === 0) return response.status(404).json({ error: "Tidak ada snapshot untuk filter ekspor" });
      const filters = { cameraId: cameraId ?? null, from: from?.toISOString() ?? null, to: to?.toISOString() ?? null, limit: 120 };
      auditContext = { requestedByUserId: user.id, cameraId: cameraId ?? null, fromDate: from ?? new Date(items.at(-1)?.capturedAt ?? Date.now()), toDate: to ?? new Date(items[0]?.capturedAt ?? Date.now()), exportMode: mode, fileCount: items.length, filters };

      if (mode === "raw") {
        await recordDatasetExport({ ...auditContext, status: "ready" });
        auditRecorded = true;
        response.status(200).setHeader("Content-Type", "application/zip");
        response.setHeader("Content-Disposition", `attachment; filename="atcs-dataset-${new Date().toISOString().slice(0, 10)}.zip"`);
        response.setHeader("Cache-Control", "no-store");
        const archive = new ZipArchive({ zlib: { level: 6 } });
        archive.on("error", (error: Error) => response.destroy(error));
        archive.pipe(response);
        for (const snapshot of items) { const signedUrl = await storageGetSignedUrl(snapshot.storageKey); const objectResponse = await fetch(signedUrl); if (!objectResponse.ok || !objectResponse.body) throw new Error(`Objek snapshot tidak dapat dibaca: ${snapshot.storageKey}`); archive.append(Readable.fromWeb(objectResponse.body as never), { name: snapshot.storageKey }); }
        await archive.finalize();
        return;
      }

      const [policy, annotations] = await Promise.all([getDatasetPolicy(), listSnapshotAnnotations(items.map((item) => item.id))]);
      const bytesBySnapshotId = new Map<number, Buffer>();
      const qualities = new Map<number, ReturnType<typeof inspectJpegQuality>>();
      for (const snapshot of items) { const bytes = await loadSnapshotBytes(snapshot.storageKey); bytesBySnapshotId.set(snapshot.id, bytes); qualities.set(snapshot.id, inspectJpegQuality(bytes)); }
      const plan = buildTrainingPlan({ snapshots: items as TrainingSnapshot[], annotations, classMap: policy?.classMap ?? [], qualities });
      if (plan.entries.length === 0) {
        await recordDatasetExport({ ...auditContext, fileCount: 0, status: "failed", errorMessage: "training_not_ready", qualitySummary: plan.quality });
        auditRecorded = true;
        return response.status(422).json({ error: "training_not_ready", message: "Tidak ada snapshot beranotasi yang lolos quality gate untuk paket training.", quality: plan.quality, excluded: plan.excluded });
      }
      const version = makeTrainingVersion({ filters, classMap: plan.classMap, entries: plan.entries });
      const manifest = { schemaVersion: 1, datasetVersion: version, createdAt: new Date().toISOString(), format: "YOLO detection", classMap: plan.classMap, filters, quality: plan.quality, entries: plan.entries, excluded: plan.excluded };
      await recordDatasetExport({ ...auditContext, fileCount: plan.entries.length, status: "ready", manifest, qualitySummary: plan.quality });
      auditRecorded = true;
      response.status(200).setHeader("Content-Type", "application/zip");
      response.setHeader("Content-Disposition", `attachment; filename="${version}.zip"`);
      response.setHeader("Cache-Control", "no-store");
      const archive = new ZipArchive({ zlib: { level: 6 } });
      archive.on("error", (error: Error) => response.destroy(error));
      archive.pipe(response);
      for (const entry of plan.entries) { const bytes = bytesBySnapshotId.get(entry.snapshotId); const label = plan.labelsBySnapshotId.get(entry.snapshotId); if (!bytes || !label) throw new Error(`Data paket training tidak lengkap untuk snapshot ${entry.snapshotId}`); archive.append(bytes, { name: entry.image }); archive.append(label, { name: entry.label }); }
      archive.append(createDatasetYaml(plan.classMap), { name: "dataset.yaml" });
      archive.append(JSON.stringify(plan.classMap, null, 2) + "\n", { name: "class-map.json" });
      archive.append(JSON.stringify(manifest, null, 2) + "\n", { name: "manifest.json" });
      await archive.finalize();
    } catch (error) {
      if (auditContext && !auditRecorded) { try { await recordDatasetExport({ ...auditContext, status: "failed", errorMessage: error instanceof Error ? error.message : "zip_export_failed" }); } catch (auditError) { console.error("[Dataset export] Gagal mencatat audit ekspor:", auditError); } }
      if (!response.headersSent) response.status(500).json({ error: error instanceof Error ? error.message : "zip_export_failed" });
      else response.destroy(error instanceof Error ? error : undefined);
    }
  });
}
