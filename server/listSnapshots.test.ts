import { beforeEach, describe, expect, it, vi } from "vitest";
import { snapshots } from "../drizzle/schema";

const mocks = vi.hoisted(() => {
  const limit = vi.fn().mockResolvedValue([]);
  const orderBy = vi.fn().mockReturnValue({ limit });
  const where = vi.fn().mockReturnValue({ orderBy });
  const from = vi.fn().mockReturnValue({ where });
  const select = vi.fn().mockReturnValue({ from });

  return {
    getDb: vi.fn().mockResolvedValue({ select }),
    select,
    from,
    where,
    orderBy,
    limit,
    and: vi.fn(),
    eq: vi.fn(),
    gte: vi.fn(),
    lte: vi.fn(),
  };
});

vi.mock("./db", () => ({ getDb: mocks.getDb }));
vi.mock("drizzle-orm", async (importOriginal) => {
  const actual = await importOriginal<typeof import("drizzle-orm")>();
  return { ...actual, and: mocks.and, eq: mocks.eq, gte: mocks.gte, lte: mocks.lte };
});

import { listSnapshots } from "./dataset";

describe("listSnapshots", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.eq.mockReturnValue({ kind: "eq", field: "camera" });
    mocks.gte.mockReturnValue({ kind: "gte", field: "from" });
    mocks.lte.mockReturnValue({ kind: "lte", field: "to" });
    mocks.and.mockReturnValue({ kind: "and" });
  });

  it("menerapkan filter kamera dan rentang waktu inklusif serta mempertahankan limit", async () => {
    const from = new Date("2026-08-01T00:00:00.000Z");
    const to = new Date("2026-08-01T23:59:59.999Z");

    await listSnapshots({ cameraId: "cimulu", from, to, limit: 120 });

    expect(mocks.eq).toHaveBeenCalledWith(snapshots.cameraId, "cimulu");
    expect(mocks.gte).toHaveBeenCalledWith(snapshots.capturedAt, from);
    expect(mocks.lte).toHaveBeenCalledWith(snapshots.capturedAt, to);
    expect(mocks.and).toHaveBeenCalledWith(
      { kind: "eq", field: "camera" },
      { kind: "gte", field: "from" },
      { kind: "lte", field: "to" },
    );
    expect(mocks.where).toHaveBeenCalledWith({ kind: "and" });
    expect(mocks.limit).toHaveBeenCalledWith(120);
  });

  it("tidak menambahkan kondisi saat filter bersifat opsional", async () => {
    await listSnapshots({ limit: 24 });

    expect(mocks.and).not.toHaveBeenCalled();
    expect(mocks.where).toHaveBeenCalledWith(undefined);
    expect(mocks.limit).toHaveBeenCalledWith(24);
  });

  it("menerapkan batas awal tanpa mensyaratkan kamera atau batas akhir", async () => {
    const from = new Date("2026-08-02T00:00:00.000Z");

    await listSnapshots({ from, limit: 36 });

    expect(mocks.gte).toHaveBeenCalledWith(snapshots.capturedAt, from);
    expect(mocks.eq).not.toHaveBeenCalled();
    expect(mocks.lte).not.toHaveBeenCalled();
    expect(mocks.and).toHaveBeenCalledWith({ kind: "gte", field: "from" });
    expect(mocks.limit).toHaveBeenCalledWith(36);
  });

  it("menerapkan batas akhir tanpa mensyaratkan kamera atau batas awal", async () => {
    const to = new Date("2026-08-02T23:59:59.999Z");

    await listSnapshots({ to, limit: 48 });

    expect(mocks.lte).toHaveBeenCalledWith(snapshots.capturedAt, to);
    expect(mocks.eq).not.toHaveBeenCalled();
    expect(mocks.gte).not.toHaveBeenCalled();
    expect(mocks.and).toHaveBeenCalledWith({ kind: "lte", field: "to" });
    expect(mocks.limit).toHaveBeenCalledWith(48);
  });

  it("menggabungkan filter kamera dengan salah satu batas waktu", async () => {
    const to = new Date("2026-08-03T23:59:59.999Z");

    await listSnapshots({ cameraId: "cimulu", to, limit: 60 });

    expect(mocks.and).toHaveBeenCalledWith(
      { kind: "eq", field: "camera" },
      { kind: "lte", field: "to" },
    );
    expect(mocks.gte).not.toHaveBeenCalled();
    expect(mocks.limit).toHaveBeenCalledWith(60);
  });
});
