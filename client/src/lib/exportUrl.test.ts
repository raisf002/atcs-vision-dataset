import { describe, expect, it } from "vitest";
import { buildExportZipUrl, getExportDateRangeError } from "./exportUrl";

describe("buildExportZipUrl", () => {
  it("builds an unfiltered export endpoint without a dangling query delimiter", () => {
    expect(buildExportZipUrl({ cameraId: "all", fromDate: "", toDate: "" })).toBe("/api/exports/zip");
  });

  it("forwards camera and inclusive date filters to the ZIP endpoint", () => {
    expect(buildExportZipUrl({ cameraId: "cimulu", fromDate: "2026-08-01", toDate: "2026-08-16" }))
      .toBe("/api/exports/zip?cameraId=cimulu&from=2026-08-01&to=2026-08-16");
  });

  it("supports a one-sided date boundary for reproducible partial exports", () => {
    expect(buildExportZipUrl({ cameraId: "all", fromDate: "2026-08-16", toDate: "" }))
      .toBe("/api/exports/zip?from=2026-08-16");
  });

  it("rejects a final date earlier than the first date", () => {
    expect(getExportDateRangeError({ cameraId: "all", fromDate: "2026-08-16", toDate: "2026-08-15" }))
      .toBe("Tanggal akhir harus sama dengan atau setelah tanggal awal.");
    expect(getExportDateRangeError({ cameraId: "all", fromDate: "2026-08-16", toDate: "2026-08-16" }))
      .toBeNull();
  });
});
