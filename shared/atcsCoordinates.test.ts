import { describe, expect, it } from "vitest";
import { ATCS_CAMERA_COORDINATES } from "./atcsCoordinates";

describe("ATCS official camera coordinates", () => {
  it("contains all 29 published camera markers with verifiable provenance", () => {
    expect(ATCS_CAMERA_COORDINATES).toHaveLength(29);
    expect(new Set(ATCS_CAMERA_COORDINATES.map((camera) => camera.name)).size).toBe(29);
    expect(ATCS_CAMERA_COORDINATES.every((camera) => camera.source === "https://atcs.tasikmalayakota.go.id/#lokasi")).toBe(true);
    expect(ATCS_CAMERA_COORDINATES.every((camera) => camera.latitude < -7 && camera.latitude > -8 && camera.longitude > 108 && camera.longitude < 109)).toBe(true);
  });

  it("maps Simpang Cimulu to the official published coordinate", () => {
    const cimulu = ATCS_CAMERA_COORDINATES.find((camera) => camera.name === "Simpang Cimulu");
    expect(cimulu).toMatchObject({ latitude: -7.32110046, longitude: 108.22129726, zone: "city", cameraType: "ptz" });
  });
});
