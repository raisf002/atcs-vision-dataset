import { describe, expect, it } from "vitest";
import { cameraRegistry } from "@/data/cameras";
import { cameraDetailPath } from "./cameraRoutes";

describe("cameraDetailPath", () => {
  it("builds a detail route for every registered ATCS camera", () => {
    expect(cameraRegistry).toHaveLength(29);
    expect(cameraRegistry.map((camera) => cameraDetailPath(camera.id))).toEqual(
      cameraRegistry.map((camera) => `/cameras/${camera.id}`),
    );
  });

  it("encodes an individual camera identifier safely in the route", () => {
    expect(cameraDetailPath("jalan kota/utara")).toBe("/cameras/jalan%20kota%2Futara");
  });
});
