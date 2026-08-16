export function cameraDetailPath(cameraId: string) {
  return `/cameras/${encodeURIComponent(cameraId)}`;
}
