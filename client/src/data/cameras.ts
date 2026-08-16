import { ATCS_CAMERA_SEED } from "@shared/atcsCameras";
import { makeSnapshotStorageKey } from "@shared/dataset";

export type CameraZone = "Jalan Kota" | "Jalan Nasional";
export type CameraSourceStatus = "verified" | "pending";
export type CameraConfig = {
  id: string;
  name: string;
  zone: CameraZone;
  sourceUrl: string | null;
  sourceStatus: CameraSourceStatus;
  active: boolean;
};

export const cameraRegistry: CameraConfig[] = ATCS_CAMERA_SEED.map((camera) => ({
  id: camera.id,
  name: camera.name,
  zone: camera.zone === "city" ? "Jalan Kota" : "Jalan Nasional",
  sourceUrl: camera.sourceUrl,
  sourceStatus: camera.sourceStatus,
  active: camera.isActive,
}));

export { makeSnapshotStorageKey };
