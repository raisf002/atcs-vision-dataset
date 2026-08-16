import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const mocks = vi.hoisted(() => ({
  getDatasetOverview: vi.fn(),
  listCameras: vi.fn(),
  listSnapshots: vi.fn(),
  getDailySnapshotCounts: vi.fn(),
  getSnapshotStatsByCamera: vi.fn(),
  updateCameraConfig: vi.fn(),
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

describe("dataset router authenticated workflows", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getDatasetOverview.mockResolvedValue({ totals: { snapshots: 4 } });
    mocks.listCameras.mockResolvedValue([{ id: "cimulu", sortOrder: 1 }]);
    mocks.listSnapshots.mockResolvedValue([{ id: 1, cameraId: "cimulu" }]);
    mocks.getDailySnapshotCounts.mockResolvedValue([{ date: "2026-08-16", count: 4 }]);
    mocks.getSnapshotStatsByCamera.mockResolvedValue([{ cameraId: "cimulu", count: 4, storageBytes: 1234 }]);
    mocks.updateCameraConfig.mockResolvedValue(undefined);
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
});
