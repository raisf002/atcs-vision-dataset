export type SnapshotFilter = {
  cameraId: string;
  date: string;
  startTime: string;
  endTime: string;
};

export function buildSnapshotQueryInput({ cameraId, date, startTime, endTime }: SnapshotFilter) {
  const selectedCamera = cameraId === "all" ? undefined : cameraId;
  if (!date) return { cameraId: selectedCamera, limit: 120 };
  return {
    cameraId: selectedCamera,
    from: new Date(`${date}T${startTime}:00.000Z`),
    to: new Date(`${date}T${endTime}:59.999Z`),
    limit: 120,
  };
}
