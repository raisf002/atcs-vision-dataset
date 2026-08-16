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

export type DailySnapshotCount = { date: string; count: number };

export function buildDailySnapshotSeries(rows: DailySnapshotCount[], days = 7, referenceDate = new Date()) {
  const byDate = new Map(rows.map((row) => [row.date.slice(0, 10), Number(row.count)]));
  const end = new Date(Date.UTC(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth(), referenceDate.getUTCDate()));
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(end);
    date.setUTCDate(end.getUTCDate() - (days - 1 - index));
    const key = date.toISOString().slice(0, 10);
    return { date: key, count: byDate.get(key) ?? 0 };
  });
}
