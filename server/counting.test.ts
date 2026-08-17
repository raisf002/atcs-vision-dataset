import { describe, expect, it } from "vitest";
import { normalizeCountingConfig } from "./counting";

describe("normalizeCountingConfig", () => {
  it("membuat konfigurasi default aman ketika kamera belum memiliki konfigurasi tersimpan", () => {
    const config = normalizeCountingConfig(undefined, "cimulu");
    expect(config).toMatchObject({
      cameraId: "cimulu",
      modelId: null,
      isEnabled: false,
      confidenceThreshold: 35,
      virtualLines: [],
      classFilter: ["car", "truck", "bus", "motorcycle"],
    });
  });

  it("memuat garis dan model yang berbeda untuk dua kamera tanpa tercampur", () => {
    const cimulu = normalizeCountingConfig({
      cameraId: "cimulu", modelId: "model_a", isEnabled: true, confidenceThreshold: 40,
      virtualLinesJson: '[{"id":"line-a","name":"Masuk","start":{"x":0.1,"y":0.2},"end":{"x":0.8,"y":0.2},"direction":"a_to_b","enabled":true}]',
      classFilterJson: '["car"]',
    } as never, "cimulu");
    const alpha = normalizeCountingConfig({
      cameraId: "alpha", modelId: "model_b", isEnabled: false, confidenceThreshold: 55,
      virtualLinesJson: '[{"id":"line-b","name":"Keluar","start":{"x":0.3,"y":0.7},"end":{"x":0.9,"y":0.7},"direction":"b_to_a","enabled":true}]',
      classFilterJson: '["motorcycle"]',
    } as never, "alpha");
    expect(cimulu).toMatchObject({ cameraId: "cimulu", modelId: "model_a", virtualLines: [expect.objectContaining({ id: "line-a" })], classFilter: ["car"] });
    expect(alpha).toMatchObject({ cameraId: "alpha", modelId: "model_b", virtualLines: [expect.objectContaining({ id: "line-b" })], classFilter: ["motorcycle"] });
  });
});
