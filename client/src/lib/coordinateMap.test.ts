import { describe, expect, it } from "vitest";
import { ATCS_CAMERA_COORDINATES } from "@shared/atcsCoordinates";
import { buildCoordinatePopup, getCoordinateStatusLabel, selectCameraCoordinate } from "./coordinateMap";

describe("coordinate map utilities", () => {
  it("selects the official coordinate for the requested camera", () => {
    const point = selectCameraCoordinate(ATCS_CAMERA_COORDINATES, "Simpang Cimulu");
    expect(point?.verificationStatus).toBe("verified");
    expect(point?.latitude).toBe(-7.32110046);
    expect(point?.longitude).toBe(108.22129726);
  });

  it("builds a verified popup label with readable coordinates", () => {
    const point = ATCS_CAMERA_COORDINATES.find((camera) => camera.name === "Simpang Cimulu")!;
    expect(getCoordinateStatusLabel(point)).toBe("Lokasi terverifikasi");
    expect(buildCoordinatePopup(point)).toContain("Koordinat terverifikasi");
    expect(buildCoordinatePopup(point)).toContain("-7.321100, 108.221297");
  });
});
