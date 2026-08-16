import { describe, expect, it } from "vitest";
import { cameraRegistry } from "./cameras";
import { makeSnapshotStorageKey } from "@shared/dataset";

describe("camera registry", () => {
  it("contains exactly the 29 ATCS Tasikmalaya camera entries", () => {
    expect(cameraRegistry).toHaveLength(29);
    expect(new Set(cameraRegistry.map((camera) => camera.id)).size).toBe(29);
    expect(cameraRegistry.filter((camera) => camera.zone === "Jalan Kota")).toHaveLength(20);
    expect(cameraRegistry.filter((camera) => camera.zone === "Jalan Nasional")).toHaveLength(9);
  });

  it("builds S3 keys in the required camera/date/timestamp structure", () => {
    expect(makeSnapshotStorageKey("cimulu", new Date("2026-08-16T09:30:00.000Z")))
      .toBe("cimulu/2026-08-16/2026-08-16T09-30-00-000Z.jpg");
  });
});
