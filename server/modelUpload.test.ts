import { describe, expect, it } from "vitest";
import { inferModelFormat, parseModelLabels } from "./modelUpload";

describe("model upload validation", () => {
  it("menerima format bobot yang diizinkan dan menolak ekstensi lain", () => {
    expect(inferModelFormat("traffic-yolo.pt")).toBe("pt");
    expect(inferModelFormat("traffic.onnx")).toBe("onnx");
    expect(inferModelFormat("traffic.weights")).toBe("other");
  });

  it("menyaring label model menjadi kelas non-kosong", () => {
    expect(parseModelLabels('["car", "", 12, "motorcycle"]')).toEqual(["car", "motorcycle"]);
    expect(parseModelLabels("invalid-json")).toEqual([]);
  });
});
