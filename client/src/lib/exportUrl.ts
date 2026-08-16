export function buildExportZipUrl(input: { cameraId: string; fromDate: string; toDate: string }) {
  const params = new URLSearchParams();
  if (input.cameraId !== "all") params.set("cameraId", input.cameraId);
  if (input.fromDate) params.set("from", input.fromDate);
  if (input.toDate) params.set("to", input.toDate);
  const query = params.toString();
  return query ? `/api/exports/zip?${query}` : "/api/exports/zip";
}
