import { describe, expect, it } from "vitest";
import { buildCaptureAvailability } from "./dataset";

describe("capture availability", () => {
  it("menghitung success rate dan menandai kamera dengan HLS_TRANSIENT sebagai degraded", () => {
    const rows = buildCaptureAvailability({
      cameraIds: ["jati", "cimulu", "paseh"],
      successfulCaptureCameraIds: ["jati", "jati", "cimulu"],
      errors: [
        { cameraId: "jati", message: "HLS_TRANSIENT: segment unavailable" },
        { cameraId: "cimulu", message: "ingest timeout" },
      ],
    });
    expect(rows).toEqual([
      expect.objectContaining({ cameraId: "jati", successfulCaptures: 2, hlsTransientFailures: 1, pipelineFailures: 0, attempts: 3, availabilityPercent: 67, coverageStatus: "degraded" }),
      expect.objectContaining({ cameraId: "cimulu", successfulCaptures: 1, hlsTransientFailures: 0, pipelineFailures: 1, attempts: 2, availabilityPercent: 50, coverageStatus: "degraded" }),
      expect.objectContaining({ cameraId: "paseh", attempts: 0, availabilityPercent: null, coverageStatus: "unknown" }),
    ]);
  });

  it("menandai coverage stabil bila semua capture pada periode berhasil", () => {
    const [row] = buildCaptureAvailability({ cameraIds: ["pataruman"], successfulCaptureCameraIds: ["pataruman", "pataruman"], errors: [] });
    expect(row).toMatchObject({ availabilityPercent: 100, coverageStatus: "healthy" });
  });
});
