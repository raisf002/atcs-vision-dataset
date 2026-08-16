export type AtcsCameraSeed = {
  id: string;
  sortOrder: number;
  name: string;
  zone: "city" | "national";
  sourceUrl: string | null;
  sourceKind: "hls" | "snapshot";
  sourceStatus: "pending" | "verified";
  isActive: boolean;
};

const cityNames = [
  "Simpang Rancabango Arah Simpang Bantar", "Simpang Rancabango Arah Jati", "Simpang Rancabango Arah Letnan Harun", "Simpang Cimulu", "Simpang Dewi Sartika Arah Cimulu", "Simpang Dewi Sartika Arah Masjid Agung", "Simpang Masjid Agung", "Simpang Nagarawangi", "Simpang Alun-alun Arah Otista", "Simpang Alun-alun Arah Tentara Pelajar", "Simpang Alun-alun Arah Sutisna Senjaya", "Simpang Sutisna Senjaya", "Simpang Gunung Sabeulah", "Simpang Pataruman PTZ", "Simpang Pataruman FIX", "Simpang Panyerutan PTZ", "Simpang Panyerutan FIX", "Simpang Paseh", "Simpang Padayungan", "Simpang Rumah Sakit",
] as const;

const cityIds = [
  "rancabango-bantar", "rancabango-jati", "rancabango-letnan-harun", "cimulu", "dewi-sartika-cimulu", "dewi-sartika-masjid-agung", "masjid-agung", "nagarawangi", "alun-alun-otista", "alun-alun-tentara-pelajar", "alun-alun-sutisna-senjaya", "sutisna-senjaya", "gunung-sabeulah", "pataruman-ptz", "pataruman-fix", "panyerutan-ptz", "panyerutan-fix", "paseh", "padayungan", "rumah-sakit",
] as const;

const nationalNames = [
  "Batas Kota Arah Bandung", "Simpang Wasita Kusuma Arah Bandung", "Simpang Wasita Kusuma Arah Bojong Jengkol", "Simpang Bojong Jengkol Arah Wasita Kusuma", "Simpang Bojong Jengkol Arah Leuwidahu", "Simpang Jati", "Simpang Mitra Batik", "Simpang Lima", "Ruas M. Hatta",
] as const;

const nationalIds = [
  "batas-kota-bandung", "wasita-kusuma-bandung", "wasita-kusuma-bojong-jengkol", "bojong-jengkol-wasita-kusuma", "bojong-jengkol-leuwidahu", "jati", "mitra-batik", "simpang-lima", "ruas-m-hatta",
] as const;

const sourceUrls: Record<string, string> = {
  "rancabango-bantar": "https://atcs.tasikmalayakota.go.id/camera/rancabangoptz.m3u8",
  "rancabango-jati": "https://atcs.tasikmalayakota.go.id/camera/rancabangoarahjati.m3u8",
  "rancabango-letnan-harun": "https://atcs.tasikmalayakota.go.id/camera/rancabangoarahletnanharun.m3u8",
  cimulu: "https://atcs.tasikmalayakota.go.id/camera/cimulu.m3u8",
  "dewi-sartika-cimulu": "https://atcs.tasikmalayakota.go.id/camera/dewisartikaarahcimulu.m3u8",
  "dewi-sartika-masjid-agung": "https://atcs.tasikmalayakota.go.id/camera/dewisartikaarahmasjidagung.m3u8",
  "masjid-agung": "https://atcs.tasikmalayakota.go.id/camera/masjidagungptz.m3u8",
  nagarawangi: "https://atcs.tasikmalayakota.go.id/camera/nagarawangi.m3u8",
  "alun-alun-otista": "https://atcs.tasikmalayakota.go.id/camera/alunalunarahotista.m3u8",
  "alun-alun-tentara-pelajar": "https://atcs.tasikmalayakota.go.id/camera/alunalunarahtentarapelajar.m3u8",
  "alun-alun-sutisna-senjaya": "https://atcs.tasikmalayakota.go.id/camera/alunalunarahsutsen.m3u8",
  "sutisna-senjaya": "https://atcs.tasikmalayakota.go.id/camera/sutisnasenjaya.m3u8",
  "gunung-sabeulah": "https://atcs.tasikmalayakota.go.id/camera/gunungsabeulah.m3u8",
  "pataruman-ptz": "https://atcs.tasikmalayakota.go.id/camera/patarumanptz.m3u8",
  "pataruman-fix": "https://atcs.tasikmalayakota.go.id/camera/patarumanarahnagarawangi.m3u8",
  "panyerutan-ptz": "https://atcs.tasikmalayakota.go.id/camera/panyerutanptz.m3u8",
  "panyerutan-fix": "https://atcs.tasikmalayakota.go.id/camera/panyerutanarahnagarawangi.m3u8",
  paseh: "https://atcs.tasikmalayakota.go.id/camera/pasehptz.m3u8",
  padayungan: "https://atcs.tasikmalayakota.go.id/camera/padayunganarahkawalu.m3u8",
  "rumah-sakit": "https://atcs.tasikmalayakota.go.id/camera/rumahsakit.m3u8",
  "batas-kota-bandung": "https://atcs.tasikmalayakota.go.id/camera/bataskotaarahbandung.m3u8",
  "wasita-kusuma-bandung": "https://atcs.tasikmalayakota.go.id/camera/wasitakusumaarahbandung.m3u8",
  "wasita-kusuma-bojong-jengkol": "https://atcs.tasikmalayakota.go.id/camera/wasitakusumaarahletnanharun.m3u8",
  "bojong-jengkol-wasita-kusuma": "https://atcs.tasikmalayakota.go.id/camera/bojongjengkolarahwasita.m3u8",
  "bojong-jengkol-leuwidahu": "https://atcs.tasikmalayakota.go.id/camera/bojongjengkolarahleuwidahu.m3u8",
  jati: "https://atcs.tasikmalayakota.go.id/camera/jati.m3u8",
  "mitra-batik": "https://atcs.tasikmalayakota.go.id/camera/mitrabatik.m3u8",
  "simpang-lima": "https://atcs.tasikmalayakota.go.id/camera/simpanglima.m3u8",
  "ruas-m-hatta": "https://atcs.tasikmalayakota.go.id/camera/mhatta.m3u8",
};

export const ATCS_CAMERA_SEED: AtcsCameraSeed[] = [
  ...cityNames.map((name, index) => ({
    id: cityIds[index]!,
    sortOrder: index + 1,
    name,
    zone: "city" as const,
    sourceUrl: sourceUrls[cityIds[index]!]!,
    sourceKind: "hls" as const,
    sourceStatus: "verified" as const,
    isActive: false,
  })),
  ...nationalNames.map((name, index) => ({
    id: nationalIds[index]!,
    sortOrder: index + cityNames.length + 1,
    name,
    zone: "national" as const,
    sourceUrl: sourceUrls[nationalIds[index]!]!,
    sourceKind: "hls" as const,
    sourceStatus: "verified" as const,
    isActive: false,
  })),
];
