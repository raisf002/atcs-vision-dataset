export type LatestCaptureStatus = "success" | "failed" | "pending" | "disabled";

export const captureStatusLabels: Record<LatestCaptureStatus, string> = {
  success: "Berhasil",
  failed: "Gagal",
  pending: "Menunggu",
  disabled: "Nonaktif",
};

export const captureStatusStyles: Record<LatestCaptureStatus, string> = {
  success: "bg-emerald-50 text-emerald-800 ring-emerald-700/15",
  failed: "bg-orange-50 text-orange-800 ring-orange-700/15",
  pending: "bg-amber-50 text-amber-800 ring-amber-700/15",
  disabled: "bg-stone-100 text-stone-600 ring-stone-600/10",
};
