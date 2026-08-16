import { describe, expect, it } from "vitest";
import { getCameraFailureLabel, getCameraSourceExplanation, getCameraSourceStatus } from "./cameraStatus";

describe("camera source status", () => {
  it("prioritizes a failed runtime capture over a mapped URL", () => {
    expect(getCameraSourceStatus("verified", "failed")).toBe("invalid");
    expect(getCameraFailureLabel("failed", "Error when loading first segment .ts")).toBe("Sumber HLS gagal");
    expect(getCameraSourceExplanation("verified", "failed", "Error when loading first segment .ts")).toContain("segmen stream");
  });

  it("classifies a non-HLS failure as a pipeline failure", () => {
    expect(getCameraFailureLabel("failed", "worker timeout while uploading snapshot")).toBe("Pipeline worker gagal");
    expect(getCameraSourceExplanation("verified", "failed", "worker timeout while uploading snapshot")).toContain("pipeline");
  });

  it("keeps an untested source pending", () => {
    expect(getCameraSourceStatus("pending", "pending")).toBe("pending");
    expect(getCameraSourceExplanation("pending", "pending")).toContain("belum diuji");
  });

  it("does not add an error explanation after a successful capture", () => {
    expect(getCameraSourceStatus("verified", "success")).toBe("verified");
    expect(getCameraSourceExplanation("verified", "success")).toBeNull();
  });
});
