import { beforeEach, describe, expect, it, vi } from "vitest";

const stores = vi.hoisted(() => ({
  configs: new Map<string, Record<string, unknown>>(),
  models: new Map<string, Record<string, unknown>>(),
}));

function collectStringValues(value: unknown, visited = new Set<unknown>()): string[] {
  if (typeof value === "string") return [value];
  if (!value || typeof value !== "object" || visited.has(value)) return [];
  visited.add(value);
  const own = Object.values(value as Record<string, unknown>).flatMap((item) => collectStringValues(item, visited));
  const symbols = Object.getOwnPropertySymbols(value).flatMap((symbol) => collectStringValues((value as Record<symbol, unknown>)[symbol], visited));
  return [...own, ...symbols];
}

function cameraIdFromCondition(condition: unknown) {
  return collectStringValues(condition).find((value) => stores.configs.has(value) || value === "cimulu" || value === "alpha");
}

vi.mock("./dataset", () => ({ ensureDatasetFoundation: vi.fn(async () => undefined) }));
vi.mock("./db", () => ({
  getDb: vi.fn(async () => ({
    select: () => ({
      from: (table: any) => ({
        where: (condition: any) => ({
          limit: async () => {
            if (stores.models.size > 0 && stores.configs.size === 0) return Array.from(stores.models.values());
            const cameraId = cameraIdFromCondition(condition);
            return cameraId && stores.configs.has(cameraId) ? [stores.configs.get(cameraId)] : [];
          },
        }),
        orderBy: async () => Array.from(stores.models.values()),
      }),
    }),
    insert: () => ({ values: async (value: Record<string, unknown>) => {
      if ("cameraId" in value) stores.configs.set(value.cameraId as string, value);
      if ("id" in value) stores.models.set(value.id as string, value);
    } }),
    update: () => ({ set: () => ({ where: async () => undefined }), }),
  })),
}));

import { getCameraCountingConfig, listVisionModels, registerVisionModel, saveCameraCountingConfig } from "./counting";

describe("counting persistence integration", () => {
  beforeEach(() => { stores.configs.clear(); stores.models.clear(); });

  it("menyimpan lalu memuat ulang konfigurasi counting dua kamera secara independen", async () => {
    await saveCameraCountingConfig({ cameraId: "cimulu", modelId: "model_a", isEnabled: true, confidenceThreshold: 35, virtualLines: [{ id: "in", name: "Masuk", start: { x: 0.1, y: 0.2 }, end: { x: 0.8, y: 0.2 }, direction: "a_to_b", enabled: true }], classFilter: ["car"] }, 7);
    await saveCameraCountingConfig({ cameraId: "alpha", modelId: "model_b", isEnabled: false, confidenceThreshold: 60, virtualLines: [{ id: "out", name: "Keluar", start: { x: 0.3, y: 0.7 }, end: { x: 0.9, y: 0.7 }, direction: "b_to_a", enabled: true }], classFilter: ["motorcycle"] }, 7);

    await expect(getCameraCountingConfig("cimulu")).resolves.toMatchObject({ modelId: "model_a", virtualLines: [expect.objectContaining({ id: "in" })], classFilter: ["car"] });
    await expect(getCameraCountingConfig("alpha")).resolves.toMatchObject({ modelId: "model_b", virtualLines: [expect.objectContaining({ id: "out" })], classFilter: ["motorcycle"] });
  });

  it("membaca kembali model yang telah diregistrasikan", async () => {
    await registerVisionModel({ id: "model_a", name: "Traffic YOLO", framework: "yolo", format: "pt", fileName: "traffic.pt", storageKey: "vision-models/a/traffic.pt", storageUrl: "/manus-storage/vision-models/a/traffic.pt", sizeBytes: 12, labels: ["car"], status: "draft" }, 7);
    await expect(listVisionModels()).resolves.toEqual([expect.objectContaining({ id: "model_a", name: "Traffic YOLO", labelsJson: '["car"]' })]);
  });
});
