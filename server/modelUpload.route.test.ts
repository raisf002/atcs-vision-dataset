import express from "express";
import type { AddressInfo } from "node:net";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  models: [] as Array<Record<string, unknown>>,
  storagePut: vi.fn(async () => ({ key: "vision-models/model_test/traffic.pt", url: "/manus-storage/vision-models/model_test/traffic.pt" })),
  authenticateRequest: vi.fn(async () => ({ id: 7, role: "admin" })),
}));

vi.mock("./dataset", () => ({ ensureDatasetFoundation: vi.fn(async () => undefined) }));
vi.mock("./db", () => ({
  getDb: vi.fn(async () => ({
    select: () => ({
      from: () => ({
        where: () => ({ limit: async () => mocks.models.slice(-1) }),
        orderBy: async () => mocks.models,
      }),
    }),
    insert: () => ({ values: async (value: Record<string, unknown>) => { mocks.models.push(value); } }),
  })),
}));
vi.mock("./storage", () => ({ storagePut: mocks.storagePut }));
vi.mock("./_core/sdk", () => ({ sdk: { authenticateRequest: mocks.authenticateRequest } }));

import { registerModelUploadRoutes } from "./modelUpload";
import { appRouter } from "./routers";

describe("model upload route", () => {
  const servers: ReturnType<express.Express["listen"]>[] = [];
  afterEach(async () => {
    await Promise.all(servers.splice(0).map((server) => new Promise<void>((resolve) => server.close(() => resolve()))));
    vi.clearAllMocks();
    mocks.models.length = 0;
  });

  it("mendaftarkan model dari unggahan admin setelah menyimpan bobot ke storage", async () => {
    const app = express();
    registerModelUploadRoutes(app);
    const server = app.listen(0);
    servers.push(server);
    const address = server.address() as AddressInfo;
    const response = await fetch(`http://127.0.0.1:${address.port}/api/models/upload`, {
      method: "POST",
      headers: { "content-type": "application/octet-stream", "x-model-file-name": "traffic.pt", "x-model-name": "Traffic YOLO", "x-model-framework": "yolo", "x-model-labels": '["car","motorcycle"]' },
      body: new Uint8Array([1, 2, 3, 4]),
    });
    expect(response.status).toBe(201);
    expect(mocks.storagePut).toHaveBeenCalledWith(expect.stringContaining("vision-models/"), expect.any(Buffer), "application/octet-stream");
    const caller = appRouter.createCaller({ user: { id: 7, role: "admin" } } as never);
    await expect(caller.dataset.visionModels()).resolves.toEqual([expect.objectContaining({ name: "Traffic YOLO" })]);
  });

  it("mendaftarkan model khusus untuk satu kamera ketika cakupan camera dipilih", async () => {
    const app = express();
    registerModelUploadRoutes(app);
    const server = app.listen(0);
    servers.push(server);
    const address = server.address() as AddressInfo;
    const response = await fetch(`http://127.0.0.1:${address.port}/api/models/upload`, {
      method: "POST",
      headers: { "content-type": "application/octet-stream", "x-model-file-name": "cimulu.onnx", "x-model-name": "Cimulu ONNX", "x-model-framework": "onnx", "x-model-labels": '["car"]', "x-model-scope": "camera", "x-model-camera-id": "cimulu" },
      body: new Uint8Array([1, 2, 3, 4]),
    });

    expect(response.status).toBe(201);
    expect(mocks.storagePut).toHaveBeenCalledWith(expect.stringContaining("vision-models/camera-cimulu/"), expect.any(Buffer), "application/octet-stream");
    expect(mocks.models[0]).toEqual(expect.objectContaining({ name: "Cimulu ONNX", scope: "camera", cameraId: "cimulu" }));
  });
});
