import type { AtcsCameraCoordinate } from "@shared/atcsCoordinates";

export function buildCoordinatePopup(point: AtcsCameraCoordinate) {
  const verificationLabel = point.verificationStatus === "verified" ? "Koordinat terverifikasi" : "Koordinat belum terverifikasi";
  return `<strong>${point.name}</strong><br/><span>${verificationLabel}</span><br/><code>${point.latitude.toFixed(6)}, ${point.longitude.toFixed(6)}</code>`;
}

export function getCoordinateStatusLabel(point: AtcsCameraCoordinate | undefined) {
  if (!point) return "Lokasi belum dipetakan";
  return point.verificationStatus === "verified" ? "Lokasi terverifikasi" : "Lokasi belum terverifikasi";
}

export function selectCameraCoordinate(points: AtcsCameraCoordinate[], cameraName: string) {
  return points.find((point) => point.name === cameraName);
}
