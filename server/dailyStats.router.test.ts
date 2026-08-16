import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const mocks = vi.hoisted(() => {
  const sqlOrderBy = vi.fn();
  const fallbackOrderBy = vi.fn();
  const groupBy = vi.fn();
  const sqlWhere = vi.fn();
  const fallbackWhere = vi.fn();
  const from = vi.fn();
  const select = vi.fn();
  const getDb = vi.fn();
  return { sqlOrderBy, fallbackOrderBy, groupBy, sqlWhere, fallbackWhere, from, select, getDb };
});

vi.mock("./db", () => ({ getDb: mocks.getDb }));

import { appRouter } from "./routers";

describe("dataset.dailyStats integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.sqlOrderBy.mockRejectedValue(new Error("DATE aggregation unavailable"));
    mocks.fallbackOrderBy.mockResolvedValue([
      { capturedAt: new Date("2026-08-16T01:00:00.000Z") },
      { capturedAt: new Date("2026-08-16T02:00:00.000Z") },
      { capturedAt: new Date("2026-08-15T23:59:59.000Z") },
    ]);
    mocks.groupBy.mockReturnValue({ orderBy: mocks.sqlOrderBy });
    mocks.sqlWhere.mockReturnValue({ groupBy: mocks.groupBy });
    mocks.fallbackWhere.mockReturnValue({ orderBy: mocks.fallbackOrderBy });
    mocks.from
      .mockReturnValueOnce({ where: mocks.sqlWhere })
      .mockReturnValueOnce({ where: mocks.fallbackWhere });
    mocks.select.mockReturnValue({ from: mocks.from });
    mocks.getDb.mockResolvedValue({ select: mocks.select });
  });

  it("returns fallback rows to an authenticated client when SQL date grouping fails", async () => {
    const warning = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const now = new Date();
    const caller = appRouter.createCaller({
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

    try {
      await expect(caller.dataset.dailyStats({ days: 7 })).resolves.toEqual([
        { date: "2026-08-15", count: 1 },
        { date: "2026-08-16", count: 2 },
      ]);
      expect(mocks.sqlOrderBy).toHaveBeenCalledOnce();
      expect(mocks.fallbackOrderBy).toHaveBeenCalledOnce();
      expect(mocks.select).toHaveBeenCalledTimes(2);
      expect(warning).toHaveBeenCalledWith(
        expect.stringContaining("Daily SQL aggregation failed"),
        expect.any(Error),
      );
    } finally {
      warning.mockRestore();
    }
  });
});
