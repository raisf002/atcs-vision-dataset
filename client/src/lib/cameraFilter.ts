import type { LatestCaptureStatus } from "@shared/captureStatus";
import { getCameraFailureKind } from "./cameraStatus";

export type CameraHealthFilter = "all" | "success" | "source_failure" | "pipeline_failure" | "waiting" | "disabled";

type CameraHealthFilterInput = {
  lastCaptureStatus: LatestCaptureStatus;
  lastError?: string | null;
};

export function matchesCameraHealthFilter(
  camera: CameraHealthFilterInput,
  filter: CameraHealthFilter,
): boolean {
  if (filter === "all") return true;
  if (filter === "success") return camera.lastCaptureStatus === "success";
  if (filter === "waiting") return camera.lastCaptureStatus === "pending";
  if (filter === "disabled") return camera.lastCaptureStatus === "disabled";
  if (camera.lastCaptureStatus !== "failed") return false;
  return filter === "source_failure"
    ? getCameraFailureKind(camera.lastError) === "source"
    : getCameraFailureKind(camera.lastError) === "pipeline";
}
