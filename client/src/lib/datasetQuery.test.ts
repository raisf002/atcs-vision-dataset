import { describe, expect, it } from "vitest";
import { buildSnapshotQueryInput } from "./datasetQuery";

describe("buildSnapshotQueryInput", () => {
  it("uses the full dataset when no date filter is selected", () => {
    expect(buildSnapshotQueryInput({ cameraId: "all", date: "", startTime: "00:00", endTime: "23:59" }))
      .toEqual({ cameraId: undefined, limit: 120 });
  });

  it("includes the selected camera and both time boundaries for a dated filter", () => {
    expect(buildSnapshotQueryInput({ cameraId: "cimulu", date: "2026-08-16", startTime: "08:15", endTime: "09:45" }))
      .toEqual({
        cameraId: "cimulu",
        from: new Date("2026-08-16T08:15:00.000Z"),
        to: new Date("2026-08-16T09:45:59.999Z"),
        limit: 120,
      });
  });

  it("produces a new range when either time boundary changes", () => {
    const morning = buildSnapshotQueryInput({ cameraId: "cimulu", date: "2026-08-16", startTime: "08:00", endTime: "09:00" });
    const later = buildSnapshotQueryInput({ cameraId: "cimulu", date: "2026-08-16", startTime: "10:00", endTime: "11:00" });

    expect(morning).not.toEqual(later);
    expect(morning).toMatchObject({ from: new Date("2026-08-16T08:00:00.000Z"), to: new Date("2026-08-16T09:00:59.999Z") });
    expect(later).toMatchObject({ from: new Date("2026-08-16T10:00:00.000Z"), to: new Date("2026-08-16T11:00:59.999Z") });
  });
});
