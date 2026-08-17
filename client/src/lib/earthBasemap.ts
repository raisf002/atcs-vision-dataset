export const EARTH_TILE_URL = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";

export const EARTH_ATTRIBUTION = "Tiles © Esri — Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community";

export const STREET_TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

export const STREET_ATTRIBUTION = "© OpenStreetMap contributors";

export type BasemapName = "earth" | "street";

export function getBasemapConfig(basemap: BasemapName) {
  return basemap === "earth"
    ? { label: "Earth", url: EARTH_TILE_URL, attribution: EARTH_ATTRIBUTION }
    : { label: "Jalan", url: STREET_TILE_URL, attribution: STREET_ATTRIBUTION };
}
