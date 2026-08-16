import { describe, expect, it } from "vitest";
import { getCaptureHealthSummary } from "./captureHealth";

describe("capture health summary", () => {
  it("separates source HLS failures from pipeline failures", () => {
    const summary = getCaptureHealthSummary([
      { lastCaptureStatus: "success" },
      { lastCaptureStatus: "failed", lastError: "Error when loading first segment .ts" },
      { lastCaptureStatus: "failed", lastError: "worker timeout while uploading snapshot" },
      { lastCaptureStatus: "pending" },
      { lastCaptureStatus: "disabled" },
    ]);

    expect(summary).toEqual({ success: 1, sourceFailures: 1, pipelineFailures: 1, pending: 1, disabled: 1 });
  });
});
