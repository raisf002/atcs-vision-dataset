import { describe, expect, it } from "vitest";
import { ATCS_CAMERA_SEED } from "../shared/atcsCameras";
import { CAPTURE_INTERVALS, isCaptureInterval, makeSnapshotStorageKey } from "../shared/dataset";

describe("dataset foundation contracts", () => {
  it("pins the registry to exactly 29 unique ATCS cameras", () => {
    expect(ATCS_CAMERA_SEED).toHaveLength(29);
    expect(new Set(ATCS_CAMERA_SEED.map((camera) => camera.id)).size).toBe(29);
    expect(ATCS_CAMERA_SEED.map((camera) => camera.sortOrder)).toEqual(Array.from({ length: 29 }, (_, index) => index + 1));
    expect(ATCS_CAMERA_SEED.every((camera) => camera.sourceUrl?.endsWith(".m3u8") && camera.sourceStatus === "verified")).toBe(true);
  });

  it("accepts only the configured capture intervals", () => {
    expect(CAPTURE_INTERVALS).toEqual([1, 5, 10, 15]);
    expect(isCaptureInterval(5)).toBe(true);
    expect(isCaptureInterval(3)).toBe(false);
  });

  it("creates the strict camera/date/timestamp object key", () => {
    expect(makeSnapshotStorageKey("cimulu", new Date("2026-08-16T09:30:00.000Z")))
      .toBe("cimulu/2026-08-16/2026-08-16T09-30-00-000Z.jpg");
  });
});
