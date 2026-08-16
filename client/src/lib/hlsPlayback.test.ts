import { describe, expect, it } from "vitest";
import { selectHlsPlaybackMode } from "./hlsPlayback";

describe("selectHlsPlaybackMode", () => {
  it("prefers hls.js on desktop-capable browsers", () => {
    expect(selectHlsPlaybackMode(true, "maybe")).toBe("hls-js");
  });

  it("falls back to native HLS when hls.js is unavailable", () => {
    expect(selectHlsPlaybackMode(false, "probably")).toBe("native");
  });

  it("reports unsupported playback when neither capability exists", () => {
    expect(selectHlsPlaybackMode(false, "")).toBe("unsupported");
  });
});
