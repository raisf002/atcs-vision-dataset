import { createRequire } from "node:module";
import type { Express, Request, Response } from "express";
import { Readable } from "node:stream";
import { listSnapshots } from "./dataset";
import { sdk } from "./_core/sdk";
import { storageGetSignedUrl } from "./storage";

const require = createRequire(import.meta.url);
const { ZipArchive } = require("archiver") as {
  ZipArchive: new (options: { zlib: { level: number } }) => {
    on: (event: "warning" | "error", callback: (error: Error & { code?: string }) => void) => unknown;
    pipe: (destination: Response) => Response;
    append: (source: Readable, options: { name: string }) => unknown;
    finalize: () => Promise<void>;
  };
};

function parseDate(value: unknown, endOfDay = false) {
  if (typeof value !== "string" || !value) return undefined;
  const date = new Date(`${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}Z`);
  if (Number.isNaN(date.getTime())) throw new Error("Format tanggal ekspor tidak valid");
  return date;
}

function getSingleQueryValue(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

export function registerExportZipRoute(app: Express) {
  app.get("/api/exports/zip", async (request: Request, response: Response) => {
    let user;
    try {
      user = await sdk.authenticateRequest(request);
    } catch {
      return response.status(401).json({ error: "authentication_required" });
    }
    if (user.role !== "admin") return response.status(403).json({ error: "admin_only" });

    try {
      const cameraId = getSingleQueryValue(request.query.cameraId);
      const from = parseDate(getSingleQueryValue(request.query.from));
      const to = parseDate(getSingleQueryValue(request.query.to), true);
      if (from && to && from > to) return response.status(400).json({ error: "Rentang tanggal ekspor tidak valid" });

      const items = await listSnapshots({ cameraId, from, to, limit: 120 });
      if (items.length === 0) return response.status(404).json({ error: "Tidak ada snapshot untuk filter ekspor" });

      const filename = `atcs-dataset-${new Date().toISOString().slice(0, 10)}.zip`;
      response.status(200);
      response.setHeader("Content-Type", "application/zip");
      response.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      response.setHeader("Cache-Control", "no-store");

      const archive = new ZipArchive({ zlib: { level: 6 } });
      archive.on("error", (error: Error) => response.destroy(error));
      archive.pipe(response);

      for (const snapshot of items) {
        const signedUrl = await storageGetSignedUrl(snapshot.storageKey);
        const objectResponse = await fetch(signedUrl);
        if (!objectResponse.ok || !objectResponse.body) throw new Error(`Objek snapshot tidak dapat dibaca: ${snapshot.storageKey}`);
        archive.append(Readable.fromWeb(objectResponse.body as never), { name: snapshot.storageKey });
      }
      await archive.finalize();
    } catch (error) {
      if (!response.headersSent) response.status(500).json({ error: error instanceof Error ? error.message : "zip_export_failed" });
      else response.destroy(error instanceof Error ? error : undefined);
    }
  });
}
