export type AtcsCameraCoordinate = {
  officialId: string;
  name: string;
  zone: "city" | "national";
  sourceUrl: string;
  cameraType: "ptz" | "fix";
  latitude: number;
  longitude: number;
  source: string;
};

/** Coordinates published by the official ATCS Tasikmalaya Lokasi Leaflet map. */
export const ATCS_CAMERA_COORDINATES: AtcsCameraCoordinate[] = [
  {
    "officialId": "1",
    "name": "Simpang Jati",
    "zone": "national",
    "sourceUrl": "https://atcs.tasikmalayakota.go.id/camera/jati.m3u8",
    "cameraType": "ptz",
    "latitude": -7.30405798,
    "longitude": 108.20548296,
    "source": "https://atcs.tasikmalayakota.go.id/#lokasi"
  },
  {
    "officialId": "3",
    "name": "Simpang Mitra Batik",
    "zone": "national",
    "sourceUrl": "https://atcs.tasikmalayakota.go.id/camera/mitrabatik.m3u8",
    "cameraType": "ptz",
    "latitude": -7.31573718,
    "longitude": 108.21582556,
    "source": "https://atcs.tasikmalayakota.go.id/#lokasi"
  },
  {
    "officialId": "4",
    "name": "Simpang Rancabango Arah Simpang Bantar",
    "zone": "city",
    "sourceUrl": "https://atcs.tasikmalayakota.go.id/camera/rancabangoptz.m3u8",
    "cameraType": "ptz",
    "latitude": -7.31782823,
    "longitude": 108.19884181,
    "source": "https://atcs.tasikmalayakota.go.id/#lokasi"
  },
  {
    "officialId": "5",
    "name": "Simpang Wasita Kusuma Arah Bandung",
    "zone": "national",
    "sourceUrl": "https://atcs.tasikmalayakota.go.id/camera/wasitakusumaarahbandung.m3u8",
    "cameraType": "fix",
    "latitude": -7.28333264,
    "longitude": 108.19812298,
    "source": "https://atcs.tasikmalayakota.go.id/#lokasi"
  },
  {
    "officialId": "7",
    "name": "Simpang Wasita Kusuma Arah Bojong Jengkol",
    "zone": "national",
    "sourceUrl": "https://atcs.tasikmalayakota.go.id/camera/wasitakusumaarahletnanharun.m3u8",
    "cameraType": "fix",
    "latitude": -7.28314108,
    "longitude": 108.1980747,
    "source": "https://atcs.tasikmalayakota.go.id/#lokasi"
  },
  {
    "officialId": "8",
    "name": "Simpang Lima",
    "zone": "national",
    "sourceUrl": "https://atcs.tasikmalayakota.go.id/camera/simpanglima.m3u8",
    "cameraType": "ptz",
    "latitude": -7.31983946,
    "longitude": 108.2199347,
    "source": "https://atcs.tasikmalayakota.go.id/#lokasi"
  },
  {
    "officialId": "9",
    "name": "Simpang Cimulu",
    "zone": "city",
    "sourceUrl": "https://atcs.tasikmalayakota.go.id/camera/cimulu.m3u8",
    "cameraType": "ptz",
    "latitude": -7.32110046,
    "longitude": 108.22129726,
    "source": "https://atcs.tasikmalayakota.go.id/#lokasi"
  },
  {
    "officialId": "10",
    "name": "Simpang Masjid Agung",
    "zone": "city",
    "sourceUrl": "https://atcs.tasikmalayakota.go.id/camera/masjidagungptz.m3u8",
    "cameraType": "ptz",
    "latitude": -7.3258252,
    "longitude": 108.22079837,
    "source": "https://atcs.tasikmalayakota.go.id/#lokasi"
  },
  {
    "officialId": "14",
    "name": "Simpang Sutisna Senjaya",
    "zone": "city",
    "sourceUrl": "https://atcs.tasikmalayakota.go.id/camera/sutisnasenjaya.m3u8",
    "cameraType": "ptz",
    "latitude": -7.32757569,
    "longitude": 108.22712302,
    "source": "https://atcs.tasikmalayakota.go.id/#lokasi"
  },
  {
    "officialId": "15",
    "name": "Batas Kota Arah Bandung",
    "zone": "national",
    "sourceUrl": "https://atcs.tasikmalayakota.go.id/camera/bataskotaarahbandung.m3u8",
    "cameraType": "ptz",
    "latitude": -7.27380239,
    "longitude": 108.19348812,
    "source": "https://atcs.tasikmalayakota.go.id/#lokasi"
  },
  {
    "officialId": "16",
    "name": "Simpang Bojong Jengkol Arah Wasita Kusuma",
    "zone": "national",
    "sourceUrl": "https://atcs.tasikmalayakota.go.id/camera/bojongjengkolarahwasita.m3u8",
    "cameraType": "fix",
    "latitude": -7.28802586,
    "longitude": 108.20033312,
    "source": "https://atcs.tasikmalayakota.go.id/#lokasi"
  },
  {
    "officialId": "17",
    "name": "Simpang Bojong Jengkol Arah Leuwidahu",
    "zone": "national",
    "sourceUrl": "https://atcs.tasikmalayakota.go.id/camera/bojongjengkolarahleuwidahu.m3u8",
    "cameraType": "fix",
    "latitude": -7.28782898,
    "longitude": 108.20052624,
    "source": "https://atcs.tasikmalayakota.go.id/#lokasi"
  },
  {
    "officialId": "21",
    "name": "Simpang Dewi Sartika Arah Cimulu",
    "zone": "city",
    "sourceUrl": "https://atcs.tasikmalayakota.go.id/camera/dewisartikaarahcimulu.m3u8",
    "cameraType": "fix",
    "latitude": -7.32348299,
    "longitude": 108.221383,
    "source": "https://atcs.tasikmalayakota.go.id/#lokasi"
  },
  {
    "officialId": "22",
    "name": "Simpang Dewi Sartika Arah Masjid Agung",
    "zone": "city",
    "sourceUrl": "https://atcs.tasikmalayakota.go.id/camera/dewisartikaarahmasjidagung.m3u8",
    "cameraType": "fix",
    "latitude": -7.32334046,
    "longitude": 108.22167277,
    "source": "https://atcs.tasikmalayakota.go.id/#lokasi"
  },
  {
    "officialId": "24",
    "name": "Simpang Nagarawangi",
    "zone": "city",
    "sourceUrl": "https://atcs.tasikmalayakota.go.id/camera/nagarawangi.m3u8",
    "cameraType": "ptz",
    "latitude": -7.33444986,
    "longitude": 108.21906567,
    "source": "https://atcs.tasikmalayakota.go.id/#lokasi"
  },
  {
    "officialId": "25",
    "name": "Ruas M. Hatta",
    "zone": "national",
    "sourceUrl": "https://atcs.tasikmalayakota.go.id/camera/mhatta.m3u8",
    "cameraType": "fix",
    "latitude": -7.31804106,
    "longitude": 108.22813153,
    "source": "https://atcs.tasikmalayakota.go.id/#lokasi"
  },
  {
    "officialId": "26",
    "name": "Simpang Alun-alun Arah Otista",
    "zone": "city",
    "sourceUrl": "https://atcs.tasikmalayakota.go.id/camera/alunalunarahotista.m3u8",
    "cameraType": "fix",
    "latitude": -7.32683612,
    "longitude": 108.22484314,
    "source": "https://atcs.tasikmalayakota.go.id/#lokasi"
  },
  {
    "officialId": "27",
    "name": "Simpang Alun-alun Arah Tentara Pelajar",
    "zone": "city",
    "sourceUrl": "https://atcs.tasikmalayakota.go.id/camera/alunalunarahtentarapelajar.m3u8",
    "cameraType": "fix",
    "latitude": -7.32684144,
    "longitude": 108.22468758,
    "source": "https://atcs.tasikmalayakota.go.id/#lokasi"
  },
  {
    "officialId": "28",
    "name": "Simpang Alun-alun Arah Sutisna Senjaya",
    "zone": "city",
    "sourceUrl": "https://atcs.tasikmalayakota.go.id/camera/alunalunarahsutsen.m3u8",
    "cameraType": "fix",
    "latitude": -7.3268042,
    "longitude": 108.22466612,
    "source": "https://atcs.tasikmalayakota.go.id/#lokasi"
  },
  {
    "officialId": "33",
    "name": "Simpang Gunung Sabeulah",
    "zone": "city",
    "sourceUrl": "https://atcs.tasikmalayakota.go.id/camera/gunungsabeulah.m3u8",
    "cameraType": "ptz",
    "latitude": -7.322939,
    "longitude": 108.215706,
    "source": "https://atcs.tasikmalayakota.go.id/#lokasi"
  },
  {
    "officialId": "34",
    "name": "Simpang Rancabango Arah Jati",
    "zone": "city",
    "sourceUrl": "https://atcs.tasikmalayakota.go.id/camera/rancabangoarahjati.m3u8",
    "cameraType": "fix",
    "latitude": -7.31824857,
    "longitude": 108.19898665,
    "source": "https://atcs.tasikmalayakota.go.id/#lokasi"
  },
  {
    "officialId": "35",
    "name": "Simpang Rancabango Arah Letnan Harun",
    "zone": "city",
    "sourceUrl": "https://atcs.tasikmalayakota.go.id/camera/rancabangoarahletnanharun.m3u8",
    "cameraType": "fix",
    "latitude": -7.31827517,
    "longitude": 108.19899738,
    "source": "https://atcs.tasikmalayakota.go.id/#lokasi"
  },
  {
    "officialId": "39",
    "name": "Simpang Pataruman PTZ",
    "zone": "city",
    "sourceUrl": "https://atcs.tasikmalayakota.go.id/camera/patarumanptz.m3u8",
    "cameraType": "ptz",
    "latitude": -7.33084554,
    "longitude": 108.21940362,
    "source": "https://atcs.tasikmalayakota.go.id/#lokasi"
  },
  {
    "officialId": "40",
    "name": "Simpang Pataruman FIX",
    "zone": "city",
    "sourceUrl": "https://atcs.tasikmalayakota.go.id/camera/patarumanarahnagarawangi.m3u8",
    "cameraType": "fix",
    "latitude": -7.33067529,
    "longitude": 108.21973622,
    "source": "https://atcs.tasikmalayakota.go.id/#lokasi"
  },
  {
    "officialId": "41",
    "name": "Simpang Panyerutan PTZ",
    "zone": "city",
    "sourceUrl": "https://atcs.tasikmalayakota.go.id/camera/panyerutanptz.m3u8",
    "cameraType": "ptz",
    "latitude": -7.33245617,
    "longitude": 108.21920782,
    "source": "https://atcs.tasikmalayakota.go.id/#lokasi"
  },
  {
    "officialId": "42",
    "name": "Simpang Panyerutan FIX",
    "zone": "city",
    "sourceUrl": "https://atcs.tasikmalayakota.go.id/camera/panyerutanarahnagarawangi.m3u8",
    "cameraType": "fix",
    "latitude": -7.33264771,
    "longitude": 108.21917027,
    "source": "https://atcs.tasikmalayakota.go.id/#lokasi"
  },
  {
    "officialId": "43",
    "name": "Simpang Paseh",
    "zone": "city",
    "sourceUrl": "https://atcs.tasikmalayakota.go.id/camera/pasehptz.m3u8",
    "cameraType": "ptz",
    "latitude": -7.33389191,
    "longitude": 108.21521401,
    "source": "https://atcs.tasikmalayakota.go.id/#lokasi"
  },
  {
    "officialId": "44",
    "name": "Simpang Padayungan",
    "zone": "city",
    "sourceUrl": "https://atcs.tasikmalayakota.go.id/camera/padayunganarahkawalu.m3u8",
    "cameraType": "fix",
    "latitude": -7.34821456,
    "longitude": 108.21789622,
    "source": "https://atcs.tasikmalayakota.go.id/#lokasi"
  },
  {
    "officialId": "45",
    "name": "Simpang Rumah Sakit",
    "zone": "city",
    "sourceUrl": "https://atcs.tasikmalayakota.go.id/camera/rumahsakit.m3u8",
    "cameraType": "ptz",
    "latitude": -7.331533,
    "longitude": 108.222395,
    "source": "https://atcs.tasikmalayakota.go.id/#lokasi"
  }
];
