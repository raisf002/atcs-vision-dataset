import { describe, expect, it } from "vitest";
import { AUTO_RETRY_DELAYS_MS, CONNECTING_TIMEOUT_MS, getAutomaticRetryDelayMs, getAutomaticRetryMessage, getConnectingTimeoutMessage, getLiveStreamErrorMessage, getObjectContainBox } from "./LiveHlsPlayer";

describe("getObjectContainBox", () => {
  it("menempatkan overlay pada area video nyata ketika stream diberi letterbox", () => {
    expect(getObjectContainBox(1000, 562, 640, 480)).toEqual({ left: 125.33333333333331, top: 0, width: 749.3333333333334, height: 562 });
  });

  it("memakai seluruh frame selama metadata video belum tersedia", () => {
    expect(getObjectContainBox(1000, 562, 0, 0)).toEqual({ left: 0, top: 0, width: 1000, height: 562 });
  });

  it("memberikan pesan tindakan yang jelas ketika sumber HLS gagal dijangkau", () => {
    expect(getLiveStreamErrorMessage("https://atcs.tasikmalayakota.go.id/camera/jati.m3u8")).toContain("Coba sambungkan ulang");
    expect(getLiveStreamErrorMessage(null)).toContain("belum dikonfigurasi");
  });

  it("menetapkan batas waktu CONNECTING dan pesan pemulihan yang dapat ditindaklanjuti", () => {
    expect(CONNECTING_TIMEOUT_MS).toBe(15_000);
    expect(getConnectingTimeoutMessage()).toContain("Coba sambungkan ulang");
  });

  it("menjadwalkan tiga retry otomatis dengan backoff terbatas sebelum meminta tindakan manual", () => {
    expect(AUTO_RETRY_DELAYS_MS).toEqual([2_000, 4_000, 8_000]);
    expect(getAutomaticRetryDelayMs(1)).toBe(2_000);
    expect(getAutomaticRetryDelayMs(2)).toBe(4_000);
    expect(getAutomaticRetryDelayMs(3)).toBe(8_000);
    expect(getAutomaticRetryDelayMs(4)).toBeNull();
    expect(getAutomaticRetryMessage(2)).toContain("(2/3)");
    expect(getAutomaticRetryMessage(4)).toContain("manual");
  });
});
