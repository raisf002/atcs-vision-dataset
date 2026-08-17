import Hls from "hls.js";
import { selectHlsPlaybackMode } from "@/lib/hlsPlayback";
import { AlertTriangle, CirclePlay, LoaderCircle, Maximize2, VideoOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type LiveHlsPlayerProps = {
  sourceUrl: string | null;
  cameraName: string;
  onPlaybackStatusChange?: (status: "loading" | "playing" | "error" | "empty") => void;
  overlaySlotId?: string;
};

export default function LiveHlsPlayer({ sourceUrl, cameraName, onPlaybackStatusChange, overlaySlotId }: LiveHlsPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<"loading" | "playing" | "error" | "empty">(sourceUrl ? "loading" : "empty");
  const [message, setMessage] = useState("Menyiapkan stream live…");

  useEffect(() => onPlaybackStatusChange?.(status), [onPlaybackStatusChange, status]);

  const startPlayback = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = true;
    video.play().catch(() => {
      setStatus("error");
      setMessage("Pemutaran belum dapat dimulai. Coba ulangi setelah stream selesai dimuat.");
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
    setMessage("Menyiapkan stream live…");
    let hls: Hls | undefined;

    const handlePlaying = () => setStatus("playing");
    const handleError = () => {
      setStatus("error");
      setMessage("Stream belum dapat diputar. Periksa koneksi atau URL sumber kamera.");
    };

    video.addEventListener("playing", handlePlaying);
    video.addEventListener("error", handleError);

    const playbackMode = selectHlsPlaybackMode(Hls.isSupported(), video.canPlayType("application/vnd.apple.mpegurl"));

    if (playbackMode === "hls-js") {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        maxBufferLength: 10,
      });
      hls.loadSource(sourceUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => setMessage("Tekan tombol putar untuk memulai stream live."));
      });
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          setStatus("error");
          setMessage("Stream HLS tidak tersedia untuk sementara. Silakan coba lagi.");
        }
      });
    } else if (playbackMode === "native") {
      video.src = sourceUrl;
      video.play().catch(() => setMessage("Tekan tombol putar untuk memulai stream live."));
    } else {
      setStatus("error");
      setMessage("Peramban ini belum mendukung pemutaran HLS.");
    }

    return () => {
      video.pause();
      video.removeAttribute("src");
      video.load();
      video.removeEventListener("playing", handlePlaying);
      video.removeEventListener("error", handleError);
      hls?.destroy();
    };
  }, [sourceUrl]);

  return (
    <div className="overflow-hidden rounded-[1.35rem] border border-white/10 bg-[#0e211d] shadow-[0_24px_55px_-32px_rgba(8,31,26,0.7)]">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 text-white">
        <div className="flex min-w-0 items-center gap-2"><span className={`h-2 w-2 rounded-full ${status === "playing" ? "bg-lime-300 shadow-[0_0_0_4px_rgba(190,242,100,0.12)]" : status === "error" ? "bg-orange-400" : status === "empty" ? "bg-stone-500" : "bg-amber-300"}`} /><span className="truncate text-xs font-semibold">{status === "playing" ? "LIVE" : status === "error" ? "STREAM ERROR" : status === "empty" ? "NO SOURCE" : "CONNECTING"}</span></div>
        <span className="font-mono text-[10px] text-stone-400">HLS · live view</span>
      </div>
      <div className="relative aspect-video bg-black">
        {sourceUrl ? <video ref={videoRef} controls playsInline muted className="h-full w-full object-contain" aria-label={`Video live ${cameraName}`} /> : null}
        {overlaySlotId ? <div id={overlaySlotId} className="pointer-events-none absolute inset-0 z-20" /> : null}
        {status !== "playing" ? <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0e211d]/85 px-6 text-center text-white">{status === "loading" ? <LoaderCircle className="h-7 w-7 animate-spin text-lime-300" /> : status === "error" ? <AlertTriangle className="h-7 w-7 text-orange-300" /> : <VideoOff className="h-7 w-7 text-stone-400" />}<p className="mt-3 max-w-sm text-sm font-medium">{message}</p>{status === "loading" ? <p className="mt-1 text-xs text-stone-400">Menyambungkan ke kamera publik…</p> : null}{sourceUrl ? <button onClick={startPlayback} className="mt-4 inline-flex h-9 items-center rounded-lg bg-lime-300 px-3.5 text-xs font-semibold text-lime-950 transition-colors hover:bg-lime-200"><CirclePlay className="mr-1.5 h-3.5 w-3.5" />Mulai live</button> : null}</div> : null}
        {status === "playing" ? <span className="pointer-events-none absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/45 px-2.5 py-1 text-[10px] font-bold tracking-[0.12em] text-lime-200 backdrop-blur"><CirclePlay className="h-3 w-3" />LIVE</span> : null}
      </div>
      <div className="flex items-center justify-between px-4 py-3 text-xs text-stone-400"><span className="truncate pr-4">{sourceUrl ?? "URL stream belum dikonfigurasi"}</span><Maximize2 className="h-3.5 w-3.5 shrink-0" /></div>
    </div>
  );
}
