const TRANSIENT_HLS_PATTERN = /hls|segment|\.ts|m3u8|invalid data|opening input|timed? ?out|connection reset|http.*(?:403|404|408|429|5\d\d)/i;

export function isTransientHlsFailure(error) {
  return TRANSIENT_HLS_PATTERN.test(String(error?.message ?? error));
}

export function hlsRetryDelayMs(attempt) {
  return Math.min(5_000, 1_200 * 2 ** Math.max(0, attempt - 1));
}

export function buildHlsFrameArgs(sourceUrl) {
  return [
    "-hide_banner", "-loglevel", "error",
    "-rw_timeout", "15000000",
    "-reconnect", "1", "-reconnect_streamed", "1", "-reconnect_delay_max", "5",
    "-http_persistent", "0",
    "-live_start_index", "-1",
    "-user_agent", "ATCS-Vision-Dataset/1.0",
    "-i", sourceUrl,
    "-frames:v", "1", "-q:v", "2", "-f", "image2pipe", "-vcodec", "mjpeg", "pipe:1",
  ];
}

export function formatCaptureFailure(error, attempts) {
  const detail = String(error?.message ?? error).slice(0, 3600);
  if (isTransientHlsFailure(error)) {
    return `HLS_TRANSIENT: segmen live tidak tersedia atau tidak valid setelah ${attempts} percobaan. Worker akan mencoba ulang pada siklus capture berikutnya. Detail FFmpeg: ${detail}`;
  }
  return detail;
}
