export type HlsPlaybackMode = "hls-js" | "native" | "unsupported";

/** Prefer hls.js where available; native HLS remains the compatibility fallback. */
export function selectHlsPlaybackMode(hlsSupported: boolean, nativeHlsSupport: string): HlsPlaybackMode {
  if (hlsSupported) return "hls-js";
  if (nativeHlsSupport === "probably" || nativeHlsSupport === "maybe") return "native";
  return "unsupported";
}
