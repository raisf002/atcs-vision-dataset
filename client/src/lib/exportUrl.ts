export type ExportMode = "raw" | "training";
export type ExportFilter = { cameraId: string; fromDate: string; toDate: string; startTime?: string; endTime?: string; mode?: ExportMode };

export function getExportDateRangeError({ fromDate, toDate }: ExportFilter) {
  if (fromDate && toDate && fromDate > toDate) return "Tanggal akhir harus sama dengan atau setelah tanggal awal.";
  return null;
}

export function buildExportZipUrl(input: ExportFilter) {
  const params = new URLSearchParams();
  if (input.cameraId !== "all") params.set("cameraId", input.cameraId);
  if (input.fromDate) params.set("from", input.startTime ? `${input.fromDate}T${input.startTime}:00.000Z` : input.fromDate);
  if (input.toDate) params.set("to", input.endTime ? `${input.toDate}T${input.endTime}:59.999Z` : input.toDate);
  if (input.mode === "training") params.set("mode", "training");
  const query = params.toString();
  return query ? `/api/exports/zip?${query}` : "/api/exports/zip";
}
