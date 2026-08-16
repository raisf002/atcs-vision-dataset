import { describe, expect, it } from "vitest";
import { captureStatusLabels, captureStatusStyles } from "./captureStatus";

describe("latest capture status presentation", () => {
  it("distinguishes successful, failed, pending, and disabled captures", () => {
    expect(captureStatusLabels.success).toBe("Berhasil");
    expect(captureStatusLabels.failed).toBe("Gagal");
    expect(captureStatusLabels.pending).toBe("Menunggu");
    expect(captureStatusLabels.disabled).toBe("Nonaktif");
    expect(captureStatusStyles.failed).toContain("orange");
    expect(captureStatusStyles.success).toContain("emerald");
  });
});
