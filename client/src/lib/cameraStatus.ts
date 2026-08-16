import type { LatestCaptureStatus } from "@shared/captureStatus";

type CameraSourceStatus = "verified" | "pending" | "invalid";

/** A mapped URL is not necessarily reachable; a failed capture is the stronger runtime signal. */
export function getCameraSourceStatus(
  sourceStatus: CameraSourceStatus,
  lastCaptureStatus: LatestCaptureStatus,
): CameraSourceStatus {
  return lastCaptureStatus === "failed" ? "invalid" : sourceStatus;
}

export type CameraFailureKind = "source" | "pipeline";

export function getCameraFailureKind(lastError: string | null | undefined): CameraFailureKind {
  const error = (lastError ?? "").toLowerCase();
  return /hls|segment|invalid data|opening input|m3u8|\.ts/.test(error) ? "source" : "pipeline";
}

export function getCameraSourceExplanation(
  sourceStatus: CameraSourceStatus,
  lastCaptureStatus: LatestCaptureStatus,
  lastError?: string | null,
): string | null {
  if (lastCaptureStatus === "failed") {
    return getCameraFailureKind(lastError) === "source"
      ? "URL HLS terpetakan, tetapi segmen stream dari server ATCS gagal dibaca."
      : "Worker/pipeline gagal memproses capture; sumber HLS belum dapat dinyatakan bermasalah.";
  }
  if (sourceStatus === "pending") {
    return "URL HLS belum diuji oleh worker.";
  }
  return null;
}

export function getCameraFailureLabel(lastCaptureStatus: LatestCaptureStatus, lastError?: string | null): string | null {
  if (lastCaptureStatus !== "failed") return null;
  return getCameraFailureKind(lastError) === "source" ? "Sumber HLS gagal" : "Pipeline worker gagal";
}
