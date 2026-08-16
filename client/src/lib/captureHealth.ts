import type { LatestCaptureStatus } from "@shared/captureStatus";
import { getCameraFailureKind } from "./cameraStatus";

type CaptureHealthCamera = {
  lastCaptureStatus: LatestCaptureStatus;
  lastError?: string | null;
};

export type CaptureHealthSummary = {
  success: number;
  sourceFailures: number;
  pipelineFailures: number;
  pending: number;
  disabled: number;
};

export function getCaptureHealthSummary(cameras: CaptureHealthCamera[]): CaptureHealthSummary {
  return cameras.reduce<CaptureHealthSummary>((summary, camera) => {
    if (camera.lastCaptureStatus === "success") summary.success += 1;
    if (camera.lastCaptureStatus === "failed") {
      if (getCameraFailureKind(camera.lastError) === "source") summary.sourceFailures += 1;
      else summary.pipelineFailures += 1;
    }
    if (camera.lastCaptureStatus === "pending") summary.pending += 1;
    if (camera.lastCaptureStatus === "disabled") summary.disabled += 1;
    return summary;
  }, { success: 0, sourceFailures: 0, pipelineFailures: 0, pending: 0, disabled: 0 });
}
