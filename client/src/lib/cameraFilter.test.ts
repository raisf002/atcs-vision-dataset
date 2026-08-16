import { describe, expect, it } from "vitest";
import { matchesCameraHealthFilter } from "./cameraFilter";

describe("matchesCameraHealthFilter", () => {
  const success = { lastCaptureStatus: "success" as const, lastError: null };
  const sourceFailure = { lastCaptureStatus: "failed" as const, lastError: "Error when loading first segment .ts" };
  const pipelineFailure = { lastCaptureStatus: "failed" as const, lastError: "worker upload timeout" };
  const pending = { lastCaptureStatus: "pending" as const, lastError: null };
  const disabled = { lastCaptureStatus: "disabled" as const, lastError: null };

  it("memisahkan kamera berhasil, sumber HLS gagal, pipeline gagal, menunggu, serta nonaktif", () => {
    expect(matchesCameraHealthFilter(success, "success")).toBe(true);
    expect(matchesCameraHealthFilter(sourceFailure, "source_failure")).toBe(true);
    expect(matchesCameraHealthFilter(sourceFailure, "pipeline_failure")).toBe(false);
    expect(matchesCameraHealthFilter(pipelineFailure, "pipeline_failure")).toBe(true);
    expect(matchesCameraHealthFilter(pending, "waiting")).toBe(true);
    expect(matchesCameraHealthFilter(disabled, "waiting")).toBe(false);
    expect(matchesCameraHealthFilter(disabled, "disabled")).toBe(true);
    expect(matchesCameraHealthFilter(pending, "disabled")).toBe(false);
  });
});
