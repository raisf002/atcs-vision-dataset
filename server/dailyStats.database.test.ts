import { afterEach, describe, expect, it, vi } from "vitest";
import { getDailySnapshotCounts } from "./dataset";

describe("getDailySnapshotCounts database query", () => {
  afterEach(() => vi.restoreAllMocks());

  it("mengembalikan agregasi harian tanpa memakai fallback ketika ekspresi DATE diberi alias", async () => {
    const warning = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    const rows = await getDailySnapshotCounts(7);

    expect(Array.isArray(rows)).toBe(true);
    expect(rows.every((row) => /^\d{4}-\d{2}-\d{2}$/.test(row.date) && Number.isFinite(Number(row.count)))).toBe(true);
    expect(warning).not.toHaveBeenCalledWith(
      expect.stringContaining("Daily SQL aggregation failed"),
      expect.anything(),
    );
  });
});
