import express, { type Express, type Request, type Response } from "express";
import { registerVisionModel } from "./counting";
import { sdk } from "./_core/sdk";
import { storagePut } from "./storage";

const MAX_MODEL_BYTES = 50 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set(["pt", "onnx", "engine", "tflite"]);
const ALLOWED_FRAMEWORKS = new Set(["yolo", "onnx", "tensorrt", "other"]);

function header(request: Request, key: string) {
  return request.header(key)?.trim() ?? "";
}

function safeFileName(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 255);
}

export function inferModelFormat(fileName: string) {
  const extension = fileName.split(".").pop()?.toLowerCase() ?? "";
  return ALLOWED_EXTENSIONS.has(extension) ? extension as "pt" | "onnx" | "engine" | "tflite" : "other" as const;
}

export function parseModelLabels(value: string) {
  try {
    const parsed = JSON.parse(value || "[]");
    return Array.isArray(parsed) ? parsed.filter((label): label is string => typeof label === "string").map((label) => label.trim()).filter(Boolean).slice(0, 80) : [];
  } catch {
    return [];
  }
}

export function registerModelUploadRoutes(app: Express) {
  app.post("/api/models/upload", express.raw({ type: "application/octet-stream", limit: "50mb" }), async (request: Request, response: Response) => {
    try {
      const user = await sdk.authenticateRequest(request);
      if (!user || user.role !== "admin") return response.status(403).json({ error: "admin_required" });
      const file = request.body as Buffer | undefined;
      if (!Buffer.isBuffer(file) || file.length === 0) return response.status(400).json({ error: "model_file_required" });
      if (file.length > MAX_MODEL_BYTES) return response.status(413).json({ error: "model_file_too_large", maxBytes: MAX_MODEL_BYTES });

      const fileName = safeFileName(header(request, "x-model-file-name"));
      const name = header(request, "x-model-name").slice(0, 160);
      const frameworkHeader = header(request, "x-model-framework").toLowerCase();
      const framework = ALLOWED_FRAMEWORKS.has(frameworkHeader) ? frameworkHeader as "yolo" | "onnx" | "tensorrt" | "other" : "other";
      const format = inferModelFormat(fileName);
      if (!fileName || format === "other") return response.status(400).json({ error: "unsupported_model_format", allowed: Array.from(ALLOWED_EXTENSIONS) });
      if (!name) return response.status(400).json({ error: "model_name_required" });

      const id = `model_${crypto.randomUUID().replace(/-/g, "").slice(0, 20)}`;
      const contentType = format === "onnx" ? "application/octet-stream" : "application/octet-stream";
      const stored = await storagePut(`vision-models/${id}/${fileName}`, file, contentType);
      const model = await registerVisionModel({
        id,
        name,
        framework,
        format,
        version: header(request, "x-model-version").slice(0, 80) || null,
        fileName,
        storageKey: stored.key,
        storageUrl: stored.url,
        sizeBytes: file.length,
        labels: parseModelLabels(header(request, "x-model-labels")),
        description: header(request, "x-model-description").slice(0, 2000) || null,
        status: "draft",
      }, user.id);
      return response.status(201).json({ model });
    } catch (error) {
      console.error("[ModelUpload] Failed:", error);
      return response.status(500).json({ error: "model_upload_failed" });
    }
  });
}
