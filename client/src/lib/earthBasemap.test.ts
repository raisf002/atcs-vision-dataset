import { describe, expect, it } from "vitest";
import { EARTH_ATTRIBUTION, EARTH_TILE_URL } from "./earthBasemap";

describe("Earth basemap", () => {
  it("uses the satellite imagery tile service with an explicit attribution", () => {
    expect(EARTH_TILE_URL).toContain("World_Imagery");
    expect(EARTH_TILE_URL).toContain("{z}/{y}/{x}");
    expect(EARTH_ATTRIBUTION).toContain("Esri");
    expect(EARTH_ATTRIBUTION).toContain("Maxar");
  });
});
