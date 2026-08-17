import { describe, expect, it } from "vitest";
import { getObjectContainBox } from "./LiveHlsPlayer";

describe("getObjectContainBox", () => {
  it("menempatkan overlay pada area video nyata ketika stream diberi letterbox", () => {
    expect(getObjectContainBox(1000, 562, 640, 480)).toEqual({ left: 125.33333333333331, top: 0, width: 749.3333333333334, height: 562 });
  });

  it("memakai seluruh frame selama metadata video belum tersedia", () => {
    expect(getObjectContainBox(1000, 562, 0, 0)).toEqual({ left: 0, top: 0, width: 1000, height: 562 });
  });
});
