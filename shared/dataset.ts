export const CAPTURE_INTERVALS = [1, 5, 10, 15] as const;

export type CaptureInterval = (typeof CAPTURE_INTERVALS)[number];

export function isCaptureInterval(value: number): value is CaptureInterval {
  return CAPTURE_INTERVALS.includes(value as CaptureInterval);
}

export function makeSnapshotStorageKey(cameraId: string, capturedAt: Date): string {
  const date = capturedAt.toISOString().slice(0, 10);
  const timestamp = capturedAt.toISOString().replace(/[:.]/g, "-");
  return `${cameraId}/${date}/${timestamp}.jpg`;
}
