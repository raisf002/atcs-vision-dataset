import fs from "node:fs";

const htmlPath = "/home/ubuntu/upload/atcs.tasikmalayakota.go.id__lokasi_1786936370996.html";
const outputPath = "/home/ubuntu/atcs-vision-dataset/shared/atcsCoordinates.ts";
const html = fs.readFileSync(htmlPath, "utf8");
const match = html.match(/var cctv=(\{.*?\});/s);
if (!match) throw new Error("Official ATCS cctv configuration was not found");
const cctv = JSON.parse(match[1]);
const entries = Object.values(cctv).map((camera) => ({
  officialId: camera.id,
  name: camera.nama,
  zone: camera.jalan_status === "Nasional" ? "national" : "city",
  sourceUrl: camera.link,
  cameraType: camera.jenis.toLowerCase(),
  latitude: Number(camera.lokasi_lat),
  longitude: Number(camera.lokasi_lng),
  source: "https://atcs.tasikmalayakota.go.id/#lokasi",
}));
if (entries.length !== 29) throw new Error(`Expected 29 official cameras, found ${entries.length}`);
const names = new Set(entries.map((entry) => entry.name));
if (names.size !== entries.length) throw new Error("Duplicate official camera name found");
const body = JSON.stringify(entries, null, 2).replaceAll('"', '"');
const output = `export type AtcsCameraCoordinate = {\n  officialId: string;\n  name: string;\n  zone: "city" | "national";\n  sourceUrl: string;\n  cameraType: "ptz" | "fix";\n  latitude: number;\n  longitude: number;\n  source: string;\n};\n\n/** Coordinates published by the official ATCS Tasikmalaya Lokasi Leaflet map. */\nexport const ATCS_CAMERA_COORDINATES: AtcsCameraCoordinate[] = ${body};\n`;
fs.writeFileSync(outputPath, output);
console.log(`Extracted ${entries.length} verified ATCS camera coordinates to ${outputPath}`);
