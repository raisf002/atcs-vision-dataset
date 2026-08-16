export type ExportFilter = { cameraId: string; fromDate: string; toDate: string };

export function getExportDateRangeError({ fromDate, toDate }: ExportFilter) {
  if (fromDate && toDate && fromDate > toDate) return "Tanggal akhir harus sama dengan atau setelah tanggal awal.";
  return null;
}

export function buildExportZipUrl(input: ExportFilter) {
  const params = new URLSearchParams();
  if (input.cameraId !== "all") params.set("cameraId", input.cameraId);
  if (input.fromDate) params.set("from", input.fromDate);
  if (input.toDate) params.set("to", input.toDate);
  const query = params.toString();
  return query ? `/api/exports/zip?${query}` : "/api/exports/zip";
}
