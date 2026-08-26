import type Hls from "hls.js";
import { selectHlsPlaybackMode } from "@/lib/hlsPlayback";
import { AlertTriangle, CirclePlay, LoaderCircle, Maximize2, RotateCcw, VideoOff } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

export type VideoContentBox = { left: number; top: number; width: number; height: number };

export function getObjectContainBox(containerWidth: number, containerHeight: number, videoWidth: number, videoHeight: number): VideoContentBox {
  if (containerWidth <= 0 || containerHeight <= 0) return { left: 0, top: 0, width: 0, height: 0 };
  if (videoWidth <= 0 || videoHeight <= 0) return { left: 0, top: 0, width: containerWidth, height: containerHeight };
  const scale = Math.min(containerWidth / videoWidth, containerHeight / videoHeight);
  const width = videoWidth * scale;
  const height = videoHeight * scale;
  return { left: (containerWidth - width) / 2, top: (containerHeight - height) / 2, width, height };
}

export function getLiveStreamErrorMessage(sourceUrl: string | null) {
  return sourceUrl ? "Sumber HLS belum merespons dari jaringan ini. Coba sambungkan ulang; bila tetap gagal, kemungkinan sumber publik ATCS sedang tidak dapat dijangkau." : "URL stream belum dikonfigurasi untuk kamera ini.";
}

export const CONNECTING_TIMEOUT_MS = 15_000;
export const AUTO_RETRY_DELAYS_MS = [2_000, 4_000, 8_000] as const;

export function getConnectingTimeoutMessage() {
  return "Stream belum mulai memutar. Coba sambungkan ulang; bila tetap gagal, periksa status sumber HLS kamera ini.";
}

export function getAutomaticRetryDelayMs(attempt: number) {
  return AUTO_RETRY_DELAYS_MS[attempt - 1] ?? null;
}

export function getAutomaticRetryMessage(attempt: number) {
  const delayMs = getAutomaticRetryDelayMs(attempt);
  if (delayMs === null) return "Sumber HLS masih belum merespons setelah percobaan otomatis. Gunakan tombol sambungkan ulang untuk mencoba kembali secara manual.";
  return `Sumber belum merespons. Mencoba sambungkan ulang otomatis (${attempt}/${AUTO_RETRY_DELAYS_MS.length}) dalam ${delayMs / 1_000} detik…`;
}

type LiveHlsPlayerProps = {
  sourceUrl: string | null;
  cameraName: string;
  onPlaybackStatusChange?: (status: "loading" | "playing" | "error" | "empty") => void;
  overlaySlotId?: string;
  onOverlaySlotChange?: (element: HTMLDivElement | null) => void;
};

export default function LiveHlsPlayer({ sourceUrl, cameraName, onPlaybackStatusChange, overlaySlotId, onOverlaySlotChange }: LiveHlsPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerFrameRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "playing" | "error" | "empty">(sourceUrl ? "loading" : "empty");
  const [message, setMessage] = useState("Menyiapkan stream live…");
  const [overlayBox, setOverlayBox] = useState<VideoContentBox | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [automaticRetryAttempt, setAutomaticRetryAttempt] = useState(0);
  const automaticRetryTimerRef = useRef<number | null>(null);
  const automaticRetryAttemptRef = useRef(0);

  const updateOverlayBox = useCallback(() => {
    const frame = playerFrameRef.current;
    const video = videoRef.current;
    if (!frame) return;
    const bounds = frame.getBoundingClientRect();
    const next = getObjectContainBox(bounds.width, bounds.height, video?.videoWidth ?? 0, video?.videoHeight ?? 0);
    setOverlayBox((current) => current && Math.abs(current.left - next.left) < 0.25 && Math.abs(current.top - next.top) < 0.25 && Math.abs(current.width - next.width) < 0.25 && Math.abs(current.height - next.height) < 0.25 ? current : next);
  }, []);

  const setOverlaySlot = useCallback((element: HTMLDivElement | null) => onOverlaySlotChange?.(element), [onOverlaySlotChange]);
  const clearAutomaticRetry = useCallback(() => {
    if (automaticRetryTimerRef.current !== null) window.clearTimeout(automaticRetryTimerRef.current);
    automaticRetryTimerRef.current = null;
  }, []);
  const resetAutomaticRetry = useCallback(() => {
    clearAutomaticRetry();
    automaticRetryAttemptRef.current = 0;
    setAutomaticRetryAttempt(0);
  }, [clearAutomaticRetry]);
  const scheduleAutomaticRetry = useCallback(() => {
    const nextAttempt = automaticRetryAttemptRef.current + 1;
    const delayMs = getAutomaticRetryDelayMs(nextAttempt);
    if (delayMs === null) {
      clearAutomaticRetry();
      setStatus("error");
      setMessage(getAutomaticRetryMessage(nextAttempt));
      return false;
    }
    automaticRetryAttemptRef.current = nextAttempt;
    setAutomaticRetryAttempt(nextAttempt);
    setStatus("loading");
    setMessage(getAutomaticRetryMessage(nextAttempt));
    clearAutomaticRetry();
    automaticRetryTimerRef.current = window.setTimeout(() => {
      automaticRetryTimerRef.current = null;
      setRetryKey((value) => value + 1);
    }, delayMs);
    return true;
  }, [clearAutomaticRetry]);
  const retryPlayback = useCallback(() => {
    resetAutomaticRetry();
    setStatus("loading");
    setMessage("Menyambungkan ulang ke stream live…");
    setRetryKey((value) => value + 1);
  }, [resetAutomaticRetry]);

  useEffect(() => onPlaybackStatusChange?.(status), [onPlaybackStatusChange, status]);
  useEffect(() => () => clearAutomaticRetry(), [clearAutomaticRetry, sourceUrl]);

  useEffect(() => {
    const frame = playerFrameRef.current;
    const video = videoRef.current;
    if (!frame) return;
    updateOverlayBox();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(updateOverlayBox);
    observer?.observe(frame);
    video?.addEventListener("loadedmetadata", updateOverlayBox);
    video?.addEventListener("resize", updateOverlayBox);
    return () => {
      observer?.disconnect();
      video?.removeEventListener("loadedmetadata", updateOverlayBox);
      video?.removeEventListener("resize", updateOverlayBox);
    };
  }, [sourceUrl, updateOverlayBox]);

  const startPlayback = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = true;
    video.play().catch(() => {
      setStatus("error");
      setMessage("Pemutaran belum dapat dimulai. Gunakan tombol sambungkan ulang untuk memuat ulang sumber.");
    });
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !sourceUrl) {
      setStatus("empty");
      setMessage("URL stream belum dikonfigurasi untuk kamera ini.");
      return;
    }

    setStatus("loading");
    setMessage(automaticRetryAttempt ? `Menyambungkan ulang ke stream live (otomatis ${automaticRetryAttempt}/${AUTO_RETRY_DELAYS_MS.length})…` : "Menyiapkan stream live…");
    let hls: Hls | undefined;
    const retryAfterFailure = () => {
      clearConnectingTimeout();
      hls?.destroy();
      scheduleAutomaticRetry();
    };
    const connectingTimeout = window.setTimeout(() => {
      retryAfterFailure();
    }, CONNECTING_TIMEOUT_MS);
    const clearConnectingTimeout = () => window.clearTimeout(connectingTimeout);
    const handlePlaying = () => {
      clearConnectingTimeout();
      resetAutomaticRetry();
      setStatus("playing");
    };
    const handleError = () => {
      clearConnectingTimeout();
      retryAfterFailure();
    };

    video.addEventListener("playing", handlePlaying);
    video.addEventListener("error", handleError);
    let disposed = false;
    const nativeHlsSupport = video.canPlayType("application/vnd.apple.mpegurl");

    if (nativeHlsSupport) {
      video.src = sourceUrl;
      video.play().catch(() => scheduleAutomaticRetry());
    } else {
      void import("hls.js").then(({ default: HlsRuntime }) => {
        if (disposed) return;
        const playbackMode = selectHlsPlaybackMode(HlsRuntime.isSupported(), nativeHlsSupport);
        if (playbackMode !== "hls-js") {
          clearConnectingTimeout();
          setStatus("error");
          setMessage("Peramban ini belum mendukung pemutaran HLS.");
          return;
        }
        hls = new HlsRuntime({ enableWorker: true, lowLatencyMode: true, maxBufferLength: 10 });
        hls.loadSource(sourceUrl);
        hls.attachMedia(video);
        hls.on(HlsRuntime.Events.MANIFEST_PARSED, () => {
          video.play().catch(() => scheduleAutomaticRetry());
        });
        hls.on(HlsRuntime.Events.ERROR, (_event, data) => {
          if (!data.fatal) return;
          if (data.type === HlsRuntime.ErrorTypes.MEDIA_ERROR) {
            hls?.recoverMediaError();
            setMessage("Memulihkan gangguan media stream…");
            return;
          }
          retryAfterFailure();
        });
      }).catch(() => {
        if (disposed) return;
        retryAfterFailure();
      });
    }

    return () => {
      disposed = true;
      clearConnectingTimeout();
      video.pause();
      video.removeAttribute("src");
      video.load();
      video.removeEventListener("playing", handlePlaying);
      video.removeEventListener("error", handleError);
      hls?.destroy();
    };
  }, [sourceUrl, retryKey, resetAutomaticRetry, scheduleAutomaticRetry]);

  return <div className="overflow-hidden rounded-[1.35rem] border border-white/10 bg-[#0e211d] shadow-[0_24px_55px_-32px_rgba(8,31,26,0.7)]">
    <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 text-white"><div className="flex min-w-0 items-center gap-2"><span className={`h-2 w-2 rounded-full ${status === "playing" ? "bg-lime-300 shadow-[0_0_0_4px_rgba(190,242,100,0.12)]" : status === "error" ? "bg-orange-400" : status === "empty" ? "bg-stone-500" : "bg-amber-300"}`} /><span className="truncate text-xs font-semibold">{status === "playing" ? "LIVE" : status === "error" ? "STREAM ERROR" : status === "empty" ? "NO SOURCE" : "CONNECTING"}</span></div><span className="font-mono text-[10px] text-stone-400">HLS · live view</span></div>
    <div ref={playerFrameRef} className="relative aspect-video bg-black">
      {sourceUrl ? <video ref={videoRef} controls playsInline muted className="h-full w-full object-contain" aria-label={`Video live ${cameraName}`} /> : null}
      {overlaySlotId ? <div ref={setOverlaySlot} id={overlaySlotId} className="pointer-events-none absolute z-20" style={overlayBox ? { left: overlayBox.left, top: overlayBox.top, width: overlayBox.width, height: overlayBox.height } : { inset: 0 }} /> : null}
      {status !== "playing" ? <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0e211d]/85 px-6 text-center text-white">{status === "loading" ? <LoaderCircle className="h-7 w-7 animate-spin text-lime-300" /> : status === "error" ? <AlertTriangle className="h-7 w-7 text-orange-300" /> : <VideoOff className="h-7 w-7 text-stone-400" />}<p className="mt-3 max-w-sm text-sm font-medium">{message}</p>{status === "loading" ? <p className="mt-1 text-xs text-stone-400">{automaticRetryAttempt ? "Sambungan akan dicoba kembali secara otomatis." : "Menyambungkan ke kamera publik…"}</p> : null}{sourceUrl ? status === "error" ? <button type="button" onClick={retryPlayback} className="mt-4 inline-flex h-9 items-center rounded-lg bg-lime-300 px-3.5 text-xs font-semibold text-lime-950 transition-colors hover:bg-lime-200"><RotateCcw className="mr-1.5 h-3.5 w-3.5" />Coba sambungkan ulang</button> : automaticRetryAttempt === 0 ? <button type="button" onClick={startPlayback} className="mt-4 inline-flex h-9 items-center rounded-lg bg-lime-300 px-3.5 text-xs font-semibold text-lime-950 transition-colors hover:bg-lime-200"><CirclePlay className="mr-1.5 h-3.5 w-3.5" />Mulai live</button> : null : null}</div> : null}
      {status === "playing" ? <span className="pointer-events-none absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/45 px-2.5 py-1 text-[10px] font-bold tracking-[0.12em] text-lime-200 backdrop-blur"><CirclePlay className="h-3 w-3" />LIVE</span> : null}
    </div>
    <div className="flex items-center justify-between px-4 py-3 text-xs text-stone-400"><span className="truncate pr-4">{sourceUrl ?? "URL stream belum dikonfigurasi"}</span><Maximize2 className="h-3.5 w-3.5 shrink-0" /></div>
  </div>;
}
