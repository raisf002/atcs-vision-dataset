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

const cityCameras: Omit<CameraConfig, "zone">[] = [
  {
    id: "rancabango-bantar",
    name: "Simpang Rancabango Arah Simpang Bantar",
    sourceUrl: "https://atcs.tasikmalayakota.go.id/camera/rancabangoptz.m3u8",
    sourceStatus: "verified",
    active: false,
  },
  { id: "rancabango-jati", name: "Simpang Rancabango Arah Jati", sourceUrl: null, sourceStatus: "pending", active: false },
  { id: "rancabango-letnan-harun", name: "Simpang Rancabango Arah Letnan Harun", sourceUrl: null, sourceStatus: "pending", active: false },
  { id: "cimulu", name: "Simpang Cimulu", sourceUrl: null, sourceStatus: "pending", active: false },
  { id: "dewi-sartika-cimulu", name: "Simpang Dewi Sartika Arah Cimulu", sourceUrl: null, sourceStatus: "pending", active: false },
  { id: "dewi-sartika-masjid-agung", name: "Simpang Dewi Sartika Arah Masjid Agung", sourceUrl: null, sourceStatus: "pending", active: false },
  { id: "masjid-agung", name: "Simpang Masjid Agung", sourceUrl: null, sourceStatus: "pending", active: false },
  { id: "nagarawangi", name: "Simpang Nagarawangi", sourceUrl: null, sourceStatus: "pending", active: false },
  { id: "alun-alun-otista", name: "Simpang Alun-alun Arah Otista", sourceUrl: null, sourceStatus: "pending", active: false },
  { id: "alun-alun-tentara-pelajar", name: "Simpang Alun-alun Arah Tentara Pelajar", sourceUrl: null, sourceStatus: "pending", active: false },
  { id: "alun-alun-sutisna-senjaya", name: "Simpang Alun-alun Arah Sutisna Senjaya", sourceUrl: null, sourceStatus: "pending", active: false },
  { id: "sutisna-senjaya", name: "Simpang Sutisna Senjaya", sourceUrl: null, sourceStatus: "pending", active: false },
  { id: "gunung-sabeulah", name: "Simpang Gunung Sabeulah", sourceUrl: null, sourceStatus: "pending", active: false },
  { id: "pataruman-ptz", name: "Simpang Pataruman PTZ", sourceUrl: null, sourceStatus: "pending", active: false },
  { id: "pataruman-fix", name: "Simpang Pataruman FIX", sourceUrl: null, sourceStatus: "pending", active: false },
  { id: "panyerutan-ptz", name: "Simpang Panyerutan PTZ", sourceUrl: null, sourceStatus: "pending", active: false },
  { id: "panyerutan-fix", name: "Simpang Panyerutan FIX", sourceUrl: null, sourceStatus: "pending", active: false },
  { id: "paseh", name: "Simpang Paseh", sourceUrl: null, sourceStatus: "pending", active: false },
  { id: "padayungan", name: "Simpang Padayungan", sourceUrl: null, sourceStatus: "pending", active: false },
  { id: "rumah-sakit", name: "Simpang Rumah Sakit", sourceUrl: null, sourceStatus: "pending", active: false },
];

const nationalCameras: Omit<CameraConfig, "zone">[] = [
  { id: "batas-kota-bandung", name: "Batas Kota Arah Bandung", sourceUrl: null, sourceStatus: "pending", active: false },
  { id: "wasita-kusuma-bandung", name: "Simpang Wasita Kusuma Arah Bandung", sourceUrl: null, sourceStatus: "pending", active: false },
  { id: "wasita-kusuma-bojong-jengkol", name: "Simpang Wasita Kusuma Arah Bojong Jengkol", sourceUrl: null, sourceStatus: "pending", active: false },
  { id: "bojong-jengkol-wasita-kusuma", name: "Simpang Bojong Jengkol Arah Wasita Kusuma", sourceUrl: null, sourceStatus: "pending", active: false },
  { id: "bojong-jengkol-leuwidahu", name: "Simpang Bojong Jengkol Arah Leuwidahu", sourceUrl: null, sourceStatus: "pending", active: false },
  { id: "jati", name: "Simpang Jati", sourceUrl: null, sourceStatus: "pending", active: false },
  { id: "mitra-batik", name: "Simpang Mitra Batik", sourceUrl: null, sourceStatus: "pending", active: false },
  { id: "simpang-lima", name: "Simpang Lima", sourceUrl: null, sourceStatus: "pending", active: false },
  { id: "ruas-m-hatta", name: "Ruas M. Hatta", sourceUrl: null, sourceStatus: "pending", active: false },
];

export const cameraRegistry: CameraConfig[] = [
  ...cityCameras.map((camera) => ({ ...camera, zone: "Jalan Kota" as const })),
  ...nationalCameras.map((camera) => ({ ...camera, zone: "Jalan Nasional" as const })),
];

export function makeSnapshotStorageKey(cameraId: string, date: string, timestamp: string) {
  return `${cameraId}/${date}/${timestamp}.jpg`;
}
