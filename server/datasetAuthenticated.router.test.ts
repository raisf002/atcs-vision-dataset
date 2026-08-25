import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const mocks = vi.hoisted(() => ({
  getDatasetOverview: vi.fn(),
  listCameras: vi.fn(),
  listSnapshots: vi.fn(),
  listSnapshotAnnotations: vi.fn(),
  getTrainingReadiness: vi.fn(),
  getDatasetPolicy: vi.fn(),
  listDatasetExportAudits: vi.fn(),
  getDailySnapshotCounts: vi.fn(),
  getSnapshotStatsByCamera: vi.fn(),
  updateCameraConfig: vi.fn(),
  saveSnapshotAnnotation: vi.fn(),
  updateDatasetPolicy: vi.fn(),
}));

vi.mock("./dataset", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./dataset")>();
  return { ...actual, ...mocks };
});

import { appRouter } from "./routers";

function makeAdminCaller() {
  const now = new Date();
  return appRouter.createCaller({
    user: {
      id: 1,
      openId: "admin-test",
      name: "Admin Test",
      email: "admin@example.com",
      loginMethod: "test",
      role: "admin",
      createdAt: now,
      updatedAt: now,
      lastSignedIn: now,
    },
    req: {} as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  });
}

function makeGuestCaller() {
  return appRouter.createCaller({ user: null, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] });
}

describe("dataset router authenticated workflows", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getDatasetOverview.mockResolvedValue({ totals: { snapshots: 4 } });
    mocks.listCameras.mockResolvedValue([{ id: "cimulu", sortOrder: 1 }]);
    mocks.listSnapshots.mockResolvedValue([{ id: 1, cameraId: "cimulu" }]);
    mocks.listSnapshotAnnotations.mockResolvedValue([{ snapshotId: 1, status: "draft" }]);
    mocks.getTrainingReadiness.mockResolvedValue({ totalSnapshots: 1, approvedAnnotations: 0, pendingAnnotations: 1, invalidAnnotations: 0, classMap: ["car"] });
    mocks.getDatasetPolicy.mockResolvedValue({ id: 1, classMap: ["car"], retentionDays: 365, retentionEnabled: false });
    mocks.listDatasetExportAudits.mockResolvedValue([{ id: 1, exportMode: "raw", fileCount: 1 }]);
    mocks.getDailySnapshotCounts.mockResolvedValue([{ date: "2026-08-16", count: 4 }]);
    mocks.getSnapshotStatsByCamera.mockResolvedValue([{ cameraId: "cimulu", count: 4, storageBytes: 1234 }]);
    mocks.updateCameraConfig.mockResolvedValue(undefined);
    mocks.saveSnapshotAnnotation.mockResolvedValue(undefined);
    mocks.updateDatasetPolicy.mockResolvedValue(undefined);
  });

  it("returns dashboard, registry, filtered snapshots, and daily stats to an authenticated user", async () => {
    const caller = makeAdminCaller();
    const from = new Date("2026-08-16T00:00:00.000Z");
    const to = new Date("2026-08-16T23:59:59.999Z");

    await expect(caller.dataset.overview()).resolves.toEqual({ totals: { snapshots: 4 } });
    await expect(caller.dataset.cameras()).resolves.toEqual([{ id: "cimulu", sortOrder: 1 }]);
    await expect(caller.dataset.snapshots({ cameraId: "cimulu", from, to, limit: 24 })).resolves.toEqual([{ id: 1, cameraId: "cimulu" }]);
    await expect(caller.dataset.dailyStats({ days: 7 })).resolves.toEqual([{ date: "2026-08-16", count: 4 }]);
    await expect(caller.dataset.cameraStats()).resolves.toEqual([{ cameraId: "cimulu", count: 4, storageBytes: 1234 }]);
    await expect(caller.dataset.trainingReadiness({ cameraId: "cimulu", limit: 24 })).resolves.toMatchObject({ totalSnapshots: 1, classMap: ["car"] });

    expect(mocks.listSnapshots).toHaveBeenCalledWith({ cameraId: "cimulu", from, to, limit: 24 });
    expect(mocks.getDailySnapshotCounts).toHaveBeenCalledWith(7);
    expect(mocks.getSnapshotStatsByCamera).toHaveBeenCalledWith(["cimulu"]);
  });

  it("persists the per-camera admin configuration through the protected mutation", async () => {
    const caller = makeAdminCaller();

    await expect(caller.dataset.updateCamera({
      id: "cimulu",
      isActive: true,
      captureIntervalMinutes: "10",
      sourceStatus: "verified",
    })).resolves.toBeUndefined();

    expect(mocks.updateCameraConfig).toHaveBeenCalledWith({
      id: "cimulu",
      isActive: true,
      captureIntervalMinutes: "10",
      sourceStatus: "verified",
    });
  });

  it("membuka data baca untuk Guest tetapi tetap menolak mutasi konfigurasi", async () => {
    const caller = makeGuestCaller();
    await expect(caller.dataset.overview()).resolves.toEqual({ totals: { snapshots: 4 } });
    await expect(caller.dataset.cameras()).resolves.toEqual([{ id: "cimulu", sortOrder: 1 }]);
    await expect(caller.dataset.snapshots({ cameraId: "cimulu", limit: 24 })).resolves.toEqual([{ id: 1, cameraId: "cimulu" }]);
    await expect(caller.dataset.snapshotAnnotations({ snapshotIds: [1] })).resolves.toEqual([{ snapshotId: 1, status: "draft" }]);
    await expect(caller.dataset.datasetPolicy()).resolves.toMatchObject({ classMap: ["car"] });
    await expect(caller.dataset.updateCamera({ id: "cimulu", isActive: true })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.dataset.saveSnapshotAnnotation({ snapshotId: 1, yoloText: "0 0.5 0.5 0.2 0.2", status: "approved" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.dataset.exportAudits({ limit: 20 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.dataset.updateDatasetPolicy({ classMap: ["car"], retentionDays: 365, retentionEnabled: true })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("menyimpan anotasi hanya melalui mutasi admin", async () => {
    const caller = makeAdminCaller();
    await expect(caller.dataset.saveSnapshotAnnotation({ snapshotId: 1, yoloText: "0 0.5 0.5 0.2 0.2", status: "approved" })).resolves.toBeUndefined();
    expect(mocks.saveSnapshotAnnotation).toHaveBeenCalledWith({ snapshotId: 1, yoloText: "0 0.5 0.5 0.2 0.2", status: "approved" }, 1);
  });

  it("membuka audit dan menyimpan kebijakan retensi hanya melalui admin", async () => {
    const caller = makeAdminCaller();
    await expect(caller.dataset.exportAudits({ limit: 20 })).resolves.toEqual([{ id: 1, exportMode: "raw", fileCount: 1 }]);
    await expect(caller.dataset.updateDatasetPolicy({ classMap: ["car", "truck"], retentionDays: 365, retentionEnabled: true })).resolves.toBeUndefined();
    expect(mocks.updateDatasetPolicy).toHaveBeenCalledWith({ classMap: ["car", "truck"], retentionDays: 365, retentionEnabled: true }, 1);
  });
});
