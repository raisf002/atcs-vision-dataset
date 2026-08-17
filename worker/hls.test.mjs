import { describe, expect, it } from "vitest";
import { buildHlsFrameArgs, formatCaptureFailure, hlsRetryDelayMs, isTransientHlsFailure } from "./hls.mjs";

describe("HLS capture recovery", () => {
  it("menandai kegagalan segmen sebagai gangguan HLS yang dapat dicoba ulang", () => {
    const error = new Error("Error when loading first segment 'stream-001.ts': Invalid data found when processing input");
    expect(isTransientHlsFailure(error)).toBe(true);
    expect(formatCaptureFailure(error, 4)).toContain("HLS_TRANSIENT");
    expect(hlsRetryDelayMs(1)).toBe(1200);
    expect(hlsRetryDelayMs(3)).toBe(4800);
  });

  it("meminta FFmpeg memuat segmen live terbaru dengan reconnect", () => {
    const args = buildHlsFrameArgs("https://example.test/live.m3u8");
    expect(args).toEqual(expect.arrayContaining(["-reconnect", "1", "-live_start_index", "-1", "https://example.test/live.m3u8"]));
  });
});
