import LiveHlsPlayer from "@/components/LiveHlsPlayer";
import AtcsCoordinateMap from "@/components/AtcsCoordinateMap";
import { Button } from "@/components/ui/button";
import { getCameraFailureLabel, getCameraSourceStatus } from "@/lib/cameraStatus";
import { trpc } from "@/lib/trpc";
import { captureStatusLabels } from "@shared/captureStatus";
import { Activity, Camera, Check, CircleDot, Expand, Gauge, Map as MapIcon, Maximize2, RotateCcw, ScanLine, Settings2, SlidersHorizontal, Target, Video } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";

function formatTime(value?: Date | string | number | null) {
  return value ? new Date(value).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "—";
}

function statusTone(status: string) {
  if (status === "success") return "text-lime-300";
  if (status === "failed") return "text-orange-300";
  return "text-amber-300";
}

export default function CommandCenter() {
  const camerasQuery = trpc.dataset.cameras.useQuery();
  const cameras = camerasQuery.data ?? [];
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"map" | "console">("map");
  const [aiActive, setAiActive] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  const [highRes, setHighRes] = useState(false);
  const [classes, setClasses] = useState({ car: true, motorcycle: true });
  const selected = cameras.find((camera) => camera.id === selectedId) ?? cameras[0];
  const selectedIndex = Math.max(0, cameras.findIndex((camera) => camera.id === selected?.id));
  const sourceLabel = selected ? getCameraFailureLabel(selected.lastCaptureStatus, selected.lastError) ?? captureStatusLabels[selected.lastCaptureStatus] : "Memuat";
  const sourceStatus = selected ? getCameraSourceStatus(selected.sourceStatus, selected.lastCaptureStatus) : "pending";

  const summary = useMemo(() => cameras.reduce((result, camera) => {
    if (camera.lastCaptureStatus === "success") result.success += 1;
    if (camera.lastCaptureStatus === "failed") result.failed += 1;
    if (camera.lastCaptureStatus === "pending") result.pending += 1;
    if (camera.lastCaptureStatus === "disabled") result.disabled += 1;
    result.snapshots += Number(camera.captureCount ?? 0);
    return result;
  }, { success: 0, failed: 0, pending: 0, disabled: 0, snapshots: 0 }), [cameras]);

  const selectCamera = (id: string) => {
    setSelectedId(id);
    setActiveTab("console");
  };

  const toggleClass = (key: "car" | "motorcycle") => setClasses((current) => ({ ...current, [key]: !current[key] }));

  const resetCamera = () => {
    setSelectedId(cameras[0]?.id ?? null);
    setActiveTab("map");
    toast.success("Kamera command center direset ke titik pertama registry.");
  };

  const takeSnapshot = () => toast.info("Snapshot manual tersedia setelah worker capture produksi tersambung.");

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) await document.documentElement.requestFullscreen?.();
    else await document.exitFullscreen?.();
  };

  return (
    <div className="-m-4 min-h-[calc(100vh-4rem)] bg-[#080b0d] text-white sm:-m-6 lg:-m-8">
      <header className="sticky top-0 z-30 flex min-h-16 flex-wrap items-center gap-3 border-b border-white/10 bg-[#0b1012]/95 px-4 py-3 backdrop-blur sm:px-5">
        <div className="flex min-w-[220px] flex-1 items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-lg border border-lime-300/20 bg-lime-300/10 text-lime-300"><ScanLine className="h-4 w-4" /></span><div><p className="text-sm font-black uppercase tracking-[0.12em] text-white">Tasik traffic vision</p><p className="text-[10px] text-stone-400">ATCS Tasikmalaya · Dataset command center</p></div></div>
        <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.04] p-1"><button type="button" onClick={() => setActiveTab("map")} className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${activeTab === "map" ? "bg-white/10 text-white" : "text-stone-500 hover:text-white"}`}><MapIcon className="mr-1.5 inline h-3.5 w-3.5" />Peta CCTV</button><button type="button" onClick={() => setActiveTab("console")} className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${activeTab === "console" ? "bg-lime-300 text-lime-950" : "text-stone-500 hover:text-white"}`}><Gauge className="mr-1.5 inline h-3.5 w-3.5" />Konsol kamera</button></div>
        <div className="flex items-center gap-2"><span className={`hidden items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-bold sm:inline-flex ${aiActive ? "border-lime-300/30 bg-lime-300/10 text-lime-200" : "border-white/10 bg-white/[0.04] text-stone-400"}`}><span className={`h-1.5 w-1.5 rounded-full ${aiActive ? "bg-lime-300" : "bg-stone-600"}`} />AI {aiActive ? "konfigurasi aktif" : "standby"}</span><button type="button" onClick={toggleFullscreen} aria-label="Buka command center layar penuh" className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 text-stone-400 hover:bg-white/10 hover:text-white"><Maximize2 className="h-4 w-4" /></button></div>
      </header>

      <main className="grid gap-3 p-3 sm:p-4 xl:grid-cols-[minmax(0,1fr)_330px]">
        <section className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-[#101719] p-2.5"><div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-lg border border-white/10 bg-black/20 px-3 py-2"><CircleDot className={`h-3 w-3 ${statusTone(selected?.lastCaptureStatus ?? "pending")}`} /><span className="truncate text-xs font-semibold">{selected?.name ?? "Memuat kamera registry…"}</span><span className="ml-auto font-mono text-[10px] text-stone-500">CAM {String(selectedIndex + 1).padStart(2, "0")}</span></div><span className="rounded-lg border border-white/10 px-3 py-2 text-[10px] font-semibold text-stone-400">{selected?.captureIntervalMinutes ?? "—"} min interval</span><Link href="/cameras" className="rounded-lg border border-white/10 px-3 py-2 text-[10px] font-semibold text-stone-300 hover:bg-white/10">Registry</Link></div>

          {activeTab === "console" && selected ? <div className="rounded-xl border border-white/10 bg-[#101719] p-2"><LiveHlsPlayer sourceUrl={selected.sourceUrl} cameraName={selected.name} /><div className="flex flex-wrap items-center gap-2 border-t border-white/10 pt-2"><button type="button" onClick={resetCamera} className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-[11px] font-semibold text-stone-300 hover:bg-white/10"><RotateCcw className="h-3.5 w-3.5" />Reset kamera</button><button type="button" onClick={() => setAiActive((value) => !value)} className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[11px] font-semibold ${aiActive ? "border-lime-300/30 bg-lime-300/10 text-lime-200" : "border-white/10 text-stone-300 hover:bg-white/10"}`}><Activity className="h-3.5 w-3.5" />AI deteksi: {aiActive ? "AKTIF (preview)" : "STANDBY"}</button><button type="button" onClick={() => toast.info("Zona deteksi akan tersedia setelah koordinat area kamera ditetapkan.")} className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-[11px] font-semibold text-stone-300 hover:bg-white/10"><Target className="h-3.5 w-3.5" />Set zona deteksi</button><span className="ml-auto flex items-center gap-2"><button type="button" onClick={takeSnapshot} className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-[11px] font-semibold text-stone-300 hover:bg-white/10"><Camera className="h-3.5 w-3.5" />Snapshot</button><button type="button" onClick={toggleFullscreen} className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-[11px] font-semibold text-stone-900 hover:bg-lime-200"><Expand className="h-3.5 w-3.5" />Fullscreen</button></span></div></div> : <div className="rounded-xl border border-white/10 bg-[#101719] p-2"><div className="mb-2 flex flex-wrap items-center justify-between gap-2 px-2"><div><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-stone-300"><MapIcon className="h-4 w-4 text-lime-300" />Peta koordinat ATCS · resmi</div><p className="mt-1 text-[10px] text-stone-500">Marker memakai koordinat yang dipublikasikan pada halaman Lokasi resmi ATCS Tasikmalaya.</p></div><span className="rounded-lg border border-lime-300/20 bg-lime-300/10 px-2.5 py-1.5 text-[10px] font-semibold text-lime-200">29 lokasi terverifikasi</span></div><AtcsCoordinateMap cameras={cameras} selectedId={selected?.id} onSelect={selectCamera} /><div className="flex flex-wrap items-center justify-between gap-3 px-2 pt-2 text-[10px] text-stone-500"><span><span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-lime-300" />Capture berhasil {summary.success}</span><span><span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-orange-300" />Riwayat capture gagal {summary.failed}</span><span><span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-slate-400" />Menunggu/nonaktif {summary.pending + summary.disabled}</span></div><p className="mt-2 px-2 text-[10px] text-stone-500">Indikator oranye mencatat hasil percobaan capture terakhir; buka konsol kamera untuk memeriksa live view saat ini.</p></div>}

          <div className="grid gap-3 sm:grid-cols-4"><div className="rounded-xl border border-white/10 bg-[#101719] p-4"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-stone-500">Kamera terpantau</p><p className="mt-2 text-2xl font-semibold text-white">{cameras.length}</p><p className="mt-1 text-[10px] text-stone-500">20 kota · 9 nasional</p></div><div className="rounded-xl border border-white/10 bg-[#101719] p-4"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-stone-500">Capture berhasil</p><p className="mt-2 text-2xl font-semibold text-lime-300">{summary.success}</p><p className="mt-1 text-[10px] text-stone-500">percobaan terakhir sukses</p></div><div className="rounded-xl border border-white/10 bg-[#101719] p-4"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-stone-500">Snapshot</p><p className="mt-2 text-2xl font-semibold text-white">{summary.snapshots}</p><p className="mt-1 text-[10px] text-stone-500">metadata tersimpan</p></div><div className="rounded-xl border border-white/10 bg-[#101719] p-4"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-stone-500">Riwayat capture terpilih</p><p className={`mt-2 text-sm font-semibold ${sourceStatus === "verified" ? "text-lime-300" : "text-orange-300"}`}>{sourceLabel}</p><p className="mt-1 truncate text-[10px] text-stone-500">{formatTime(selected?.lastCaptureAt)}</p></div></div>
        </section>

        <aside className="space-y-3">
          <section className="rounded-xl border border-white/10 bg-[#101719] p-4"><div className="flex items-center justify-between"><h2 className="flex items-center gap-2 text-xs font-bold text-white"><Activity className="h-3.5 w-3.5 text-lime-300" />Telemetri dataset</h2><button type="button" onClick={() => camerasQuery.refetch()} className="text-[10px] text-stone-500 hover:text-white">Refresh</button></div><div className="mt-4 grid grid-cols-2 gap-2"><div className="rounded-lg border border-white/10 bg-black/15 p-3"><p className="text-[10px] text-stone-500">Capture berhasil</p><p className="mt-1 text-2xl font-semibold text-lime-300">{summary.success}</p><p className="mt-1 text-[10px] text-stone-600">percobaan terakhir sukses</p></div><div className="rounded-lg border border-white/10 bg-black/15 p-3"><p className="text-[10px] text-stone-500">Riwayat capture gagal</p><p className="mt-1 text-2xl font-semibold text-orange-300">{summary.failed}</p><p className="mt-1 text-[10px] text-stone-600">bukan status live saat ini</p></div></div><div className="mt-2 rounded-lg border border-white/10 bg-black/15 p-3"><div className="flex items-center justify-between"><p className="text-[10px] text-stone-500">Total snapshot</p><span className="text-[10px] text-stone-600">metadata</span></div><p className="mt-1 text-3xl font-semibold text-white">{summary.snapshots}</p><p className="mt-1 text-[10px] text-stone-500">Akumulasi dari seluruh kamera</p></div></section>

          <section className="rounded-xl border border-white/10 bg-[#101719] p-4"><div className="flex items-center justify-between"><h2 className="flex items-center gap-2 text-xs font-bold text-white"><Settings2 className="h-3.5 w-3.5 text-lime-300" />Konfigurasi AI & video</h2><span className="rounded bg-amber-300/10 px-2 py-1 text-[9px] font-bold text-amber-200">PREVIEW</span></div><p className="mt-4 text-[10px] text-stone-500">Kontrol ini hanya menyimpan preferensi tampilan sesi. Inferensi produksi membutuhkan model, worker, dan persetujuan deployment.</p><label className="mt-4 block text-[10px] font-semibold text-stone-400">Arsitektur neural AI</label><button type="button" onClick={() => toast.info("Pilihan model AI akan dihubungkan setelah endpoint inferensi disiapkan.")} className="mt-2 flex w-full items-center justify-between rounded-lg border border-white/10 bg-black/15 px-3 py-2 text-left text-[11px] text-stone-200 hover:bg-white/5"><span><ScanLine className="mr-2 inline h-3.5 w-3.5 text-lime-300" />YOLO multi-scale · preview</span><SlidersHorizontal className="h-3.5 w-3.5 text-stone-500" /></button><div className="mt-4 flex items-center justify-between"><label className="text-[10px] font-semibold text-stone-400">Ambang confidence</label><span className="font-mono text-xs text-lime-300">35%</span></div><input aria-label="Ambang confidence" type="range" min="10" max="90" defaultValue="35" className="mt-2 w-full accent-lime-300" /><div className="mt-4 grid grid-cols-2 gap-2"><button type="button" onClick={() => toggleClass("car")} className={`rounded-lg border px-2 py-2 text-[10px] font-semibold ${classes.car ? "border-lime-300/30 bg-lime-300/10 text-lime-200" : "border-white/10 text-stone-500"}`}><Check className="mr-1 inline h-3 w-3" />Mobil & truk</button><button type="button" onClick={() => toggleClass("motorcycle")} className={`rounded-lg border px-2 py-2 text-[10px] font-semibold ${classes.motorcycle ? "border-orange-300/30 bg-orange-300/10 text-orange-200" : "border-white/10 text-stone-500"}`}><Check className="mr-1 inline h-3 w-3" />Sepeda motor</button></div><div className="mt-4 space-y-2 border-t border-white/10 pt-3"><label className="flex items-center gap-2 text-[10px] text-stone-400"><input type="checkbox" checked={highRes} onChange={(event) => setHighRes(event.target.checked)} className="accent-lime-300" />HD super-resolution (preview)</label><label className="flex items-center gap-2 text-[10px] text-stone-400"><input type="checkbox" checked={showLabels} onChange={(event) => setShowLabels(event.target.checked)} className="accent-lime-300" />Tampilkan label & akurasi</label><label className="flex items-center gap-2 text-[10px] text-stone-500"><input type="checkbox" disabled className="accent-lime-300" />Alarm kepadatan · segera</label></div></section>

          <section className="rounded-xl border border-white/10 bg-[#101719] p-4"><div className="flex items-center justify-between"><h2 className="flex items-center gap-2 text-xs font-bold text-white"><Video className="h-3.5 w-3.5 text-lime-300" />Kamera registry cepat</h2><Link href="/cameras" className="text-[10px] text-lime-300 hover:text-lime-200">Lihat semua</Link></div><div className="mt-3 max-h-48 space-y-1 overflow-y-auto pr-1">{cameras.slice(0, 8).map((camera) => <button key={camera.id} type="button" onClick={() => selectCamera(camera.id)} className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left transition-colors ${camera.id === selected?.id ? "bg-lime-300/10 text-lime-200" : "text-stone-400 hover:bg-white/5 hover:text-white"}`}><span className={`h-1.5 w-1.5 rounded-full ${camera.lastCaptureStatus === "success" ? "bg-lime-300" : camera.lastCaptureStatus === "failed" ? "bg-orange-300" : "bg-stone-600"}`} /><span className="min-w-0 flex-1 truncate text-[10px]">{camera.name}</span><span className="font-mono text-[9px] text-stone-600">{camera.id.slice(0, 5)}</span></button>)}</div></section>
        </aside>
      </main>
    </div>
  );
}
