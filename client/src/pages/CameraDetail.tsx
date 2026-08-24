import { useAuth } from "@/_core/hooks/useAuth";
import LiveHlsPlayer from "@/components/LiveHlsPlayer";
import PageHeader from "@/components/PageHeader";
import StatusPill from "@/components/StatusPill";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { getCameraFailureLabel, getCameraSourceExplanation, getCameraSourceStatus, isTransientHlsFailure } from "@/lib/cameraStatus";
import { recordLivePlayback } from "@/lib/livePlayback";
import { Activity, ArrowLeft, Camera, Check, ExternalLink, FolderKey, LockKeyhole, RefreshCw, Save, Settings2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useRoute } from "wouter";
import { toast } from "sonner";

const intervals = ["1", "5", "10", "15"] as const;

export default function CameraDetail() {
  const [, params] = useRoute("/cameras/:cameraId");
  const cameraQuery = trpc.dataset.cameras.useQuery();
  const camera = cameraQuery.data?.find((item) => item.id === params?.cameraId);
  const [sourceUrl, setSourceUrl] = useState("");
  const [captureEnabled, setCaptureEnabled] = useState(false);
  const [interval, setInterval] = useState<(typeof intervals)[number]>("5");
  const [playerAttempt, setPlayerAttempt] = useState(0);
  const [livePlaybackStatus, setLivePlaybackStatus] = useState<"loading" | "playing" | "error" | "empty">("loading");
  const { user } = useAuth();
  const isGuest = !user;
  const isAdmin = user?.role === "admin";
  const updateCamera = trpc.dataset.updateCamera.useMutation({ onSuccess: () => cameraQuery.refetch() });

  useEffect(() => {
    if (!camera) return;
    const rawDraft = !isGuest && !isAdmin ? localStorage.getItem(`atcs-camera-draft-${camera.id}`) : null;
    if (rawDraft) {
      try {
        const draft = JSON.parse(rawDraft) as { sourceUrl?: string | null; isActive?: boolean; captureIntervalMinutes?: (typeof intervals)[number] };
        setSourceUrl(draft.sourceUrl ?? camera.sourceUrl ?? "");
        setCaptureEnabled(draft.isActive ?? camera.isActive);
        setInterval(draft.captureIntervalMinutes ?? camera.captureIntervalMinutes ?? "5");
        return;
      } catch { localStorage.removeItem(`atcs-camera-draft-${camera.id}`); }
    }
    setSourceUrl(camera.sourceUrl ?? "");
    setCaptureEnabled(camera.isActive);
    setInterval(camera.captureIntervalMinutes ?? "5");
  }, [camera, isAdmin, isGuest]);

  if (cameraQuery.isLoading) return <div className="mx-auto max-w-xl rounded-[1.5rem] border border-stone-200 bg-white p-8 text-center text-sm text-stone-500 shadow-sm">Memuat konfigurasi kamera…</div>;
  if (!camera) return <div className="mx-auto max-w-xl rounded-[1.5rem] border border-stone-200 bg-white p-8 text-center shadow-sm"><Camera className="mx-auto h-8 w-8 text-stone-300" /><h1 className="mt-4 text-xl font-semibold text-stone-900">Kamera tidak ditemukan</h1><p className="mt-2 text-sm text-stone-500">Kembali ke registry untuk memilih salah satu dari 29 CCTV ATCS.</p><Link href="/cameras" className="mt-6 inline-flex rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white">Kembali ke registry</Link></div>;

  const sourceDisplayStatus = getCameraSourceStatus(camera.sourceStatus, camera.lastCaptureStatus);
  const failureLabel = getCameraFailureLabel(camera.lastCaptureStatus, camera.lastError);
  const failureExplanation = getCameraSourceExplanation(camera.sourceStatus, camera.lastCaptureStatus, camera.lastError);
  const isRecoverableSourceFailure = failureLabel === "Sumber HLS gagal" || isTransientHlsFailure(camera.lastError);
  const isLiveAvailable = livePlaybackStatus === "playing";
  const displayedSourceStatus = isLiveAvailable ? "verified" : sourceDisplayStatus;

  const saveDraft = () => {
    if (isGuest) return toast.info("Mode Guest hanya dapat melihat konfigurasi CCTV.");
    const payload = { sourceUrl: sourceUrl || null, isActive: captureEnabled, captureIntervalMinutes: interval };
    if (!isAdmin) {
      localStorage.setItem(`atcs-camera-draft-${camera.id}`, JSON.stringify(payload));
      toast.success("Draf konfigurasi disimpan di peramban. Masuk sebagai admin untuk menyimpan ke server.");
      return;
    }
    if (updateCamera.isPending) return;
    updateCamera.mutate({ id: camera.id, sourceUrl: sourceUrl || null, isActive: captureEnabled, captureIntervalMinutes: interval }, { onSuccess: () => { localStorage.removeItem(`atcs-camera-draft-${camera.id}`); toast.success("Konfigurasi kamera disimpan."); }, onError: () => toast.error("Konfigurasi belum dapat disimpan ke server.") });
  };

  return <div className="mx-auto w-full max-w-[1500px] space-y-7">
    <Link href="/cameras" className="inline-flex items-center gap-2 text-sm font-semibold text-stone-500 transition-colors hover:text-stone-950"><ArrowLeft className="h-4 w-4" />Kembali ke camera registry</Link>
    <PageHeader eyebrow={`CCTV ${camera.id} · ${camera.zone}`} title={camera.name} description={isGuest ? "Mode Guest: pantau live view, status sumber, dan metadata kamera tanpa mengubah pengaturan." : isAdmin ? "Pantau live view dan kelola pengaturan capture khusus untuk titik CCTV ini. Perubahan disimpan langsung ke registry produksi." : "Pantau live view dan siapkan pengaturan capture khusus untuk titik CCTV ini. Draf lokal dapat digunakan sebelum akses admin tersedia."} actions={<><StatusPill status={displayedSourceStatus} />{isGuest ? <Button disabled className="rounded-xl"><LockKeyhole className="mr-2 h-4 w-4" />Mode Guest</Button> : <Button onClick={saveDraft} disabled={updateCamera.isPending} className="rounded-xl bg-stone-900 text-white hover:bg-stone-800"><Save className="mr-2 h-4 w-4" />{updateCamera.isPending ? "Menyimpan…" : "Simpan konfigurasi"}</Button>}</>} />
    {failureExplanation ? <div role="status" className={`rounded-2xl border p-4 ${isLiveAvailable ? "border-emerald-200 bg-emerald-50" : isRecoverableSourceFailure ? "border-orange-200 bg-orange-50" : "border-red-200 bg-red-50"}`}><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className={`text-sm font-semibold ${isLiveAvailable ? "text-emerald-900" : isRecoverableSourceFailure ? "text-orange-900" : "text-red-900"}`}>{isLiveAvailable ? "Live view tersedia sekarang" : failureLabel}</p><p className="mt-1 text-sm leading-6 text-stone-700">{isLiveAvailable ? "Stream HLS berhasil diputar di peramban ini. Kegagalan capture yang tercatat sebelumnya tidak menunjukkan gangguan sumber yang sedang aktif." : failureExplanation}</p></div>{!isLiveAvailable ? isRecoverableSourceFailure ? <Button type="button" variant="outline" onClick={() => setPlayerAttempt((attempt) => attempt + 1)} className="shrink-0 rounded-xl border-orange-300 bg-white text-orange-900 hover:bg-orange-100"><RefreshCw className="mr-2 h-3.5 w-3.5" />Muat ulang live view</Button> : <Link href="/cameras" className="inline-flex h-10 shrink-0 items-center rounded-xl border border-red-300 bg-white px-3 text-sm font-semibold text-red-900 hover:bg-red-100">Tinjau registry</Link> : null}</div></div> : null}
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.75fr)]"><section className="space-y-5"><LiveHlsPlayer key={`${camera.id}-${playerAttempt}`} sourceUrl={sourceUrl || null} cameraName={camera.name} onPlaybackStatusChange={(status) => { setLivePlaybackStatus(status); if (status === "playing") recordLivePlayback(camera.id); }} /><div className="grid gap-3 sm:grid-cols-3"><Metric label="Dataset images" value={String(camera.captureCount)} note={camera.captureCount ? "Metadata tersimpan" : "Menunggu capture"} /><Metric label="Last capture" value={camera.lastCaptureAt ? new Date(camera.lastCaptureAt).toLocaleString("id-ID") : "Belum ada"} note={camera.lastCaptureAt ? "Waktu capture terakhir" : "Tidak ada snapshot"} small /><Metric label="Storage key" value={`${camera.id}/…`} note="JPEG per tanggal" mono /></div></section>
      {isGuest ? <aside className="rounded-[1.5rem] border border-sky-200 bg-sky-50 p-5 shadow-sm sm:p-6"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-sky-700 shadow-sm"><LockKeyhole className="h-5 w-5" /></span><div><p className="text-lg font-semibold tracking-tight text-sky-950">Mode Guest</p><p className="mt-0.5 text-xs text-sky-800">Konfigurasi kamera hanya-baca</p></div></div><dl className="mt-7 space-y-4 text-sm"><div><dt className="text-xs font-semibold uppercase tracking-[0.12em] text-sky-700">HLS source URL</dt><dd className="mt-1 break-all font-mono text-xs text-sky-950">{camera.sourceUrl ?? "Belum dikonfigurasi"}</dd></div><div><dt className="text-xs font-semibold uppercase tracking-[0.12em] text-sky-700">Interval capture</dt><dd className="mt-1 font-semibold text-sky-950">{camera.captureIntervalMinutes ?? "Default"} menit</dd></div><div><dt className="text-xs font-semibold uppercase tracking-[0.12em] text-sky-700">Status capture</dt><dd className="mt-1 font-semibold text-sky-950">{camera.isActive ? "Aktif" : "Standby"}</dd></div></dl><p className="mt-6 rounded-xl border border-sky-200 bg-white/80 p-3 text-xs leading-5 text-sky-900">Masuk sebagai admin untuk mengubah sumber HLS, interval, atau status capture.</p></aside> : <CameraConfig sourceUrl={sourceUrl} onSourceUrlChange={setSourceUrl} interval={interval} onIntervalChange={setInterval} captureEnabled={captureEnabled} onCaptureEnabledChange={setCaptureEnabled} isPending={updateCamera.isPending} cameraId={camera.id} onSave={saveDraft} />}
    </div>
  </div>;
}

function Metric({ label, value, note, small, mono }: { label: string; value: string; note: string; small?: boolean; mono?: boolean }) { return <div className="rounded-xl border border-stone-200 bg-white p-4"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-stone-500">{label}</p><p className={`mt-2 ${small ? "text-sm" : "text-2xl"} ${mono ? "font-mono text-[11px]" : "font-semibold"} tracking-tight text-stone-950`}>{value}</p><p className="mt-1 text-xs text-stone-500">{note}</p></div>; }

function CameraConfig({ sourceUrl, onSourceUrlChange, interval, onIntervalChange, captureEnabled, onCaptureEnabledChange, isPending, cameraId, onSave }: { sourceUrl: string; onSourceUrlChange: (value: string) => void; interval: (typeof intervals)[number]; onIntervalChange: (value: (typeof intervals)[number]) => void; captureEnabled: boolean; onCaptureEnabledChange: (value: boolean) => void; isPending: boolean; cameraId: string; onSave: () => void }) {
  return <aside className="rounded-[1.5rem] border border-stone-200 bg-white p-5 shadow-[0_18px_45px_-35px_rgba(28,32,30,0.5)] sm:p-6">
    <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-lime-200 text-lime-950"><Settings2 className="h-5 w-5" /></span><div><p className="text-lg font-semibold tracking-tight text-stone-950">Camera configuration</p><p className="mt-0.5 text-xs text-stone-500">Khusus untuk kamera ini</p></div></div>
    <div className="mt-7 space-y-5">
      <label className="block space-y-2"><span className="text-xs font-semibold uppercase tracking-[0.12em] text-stone-500">HLS source URL</span><div className="relative"><Input value={sourceUrl} onChange={(event) => onSourceUrlChange(event.target.value)} className="h-11 rounded-xl border-stone-200 bg-stone-50 pr-10 font-mono text-xs" /><ExternalLink className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" /></div></label>
      <div><p id="capture-interval-label" className="text-xs font-semibold uppercase tracking-[0.12em] text-stone-500">Interval capture</p><div role="group" aria-labelledby="capture-interval-label" className="mt-3 grid grid-cols-4 gap-2">{intervals.map((item) => <button key={item} type="button" aria-pressed={interval === item} onClick={() => onIntervalChange(item)} className={`rounded-xl border py-3 text-center transition-colors ${interval === item ? "border-emerald-700 bg-emerald-50 text-emerald-950" : "border-stone-200 bg-stone-50 text-stone-600 hover:border-stone-300"}`}><span className="text-lg font-semibold">{item}</span><span className="ml-0.5 text-[10px] font-medium">min</span></button>)}</div></div>
      <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4"><div className="flex items-center justify-between gap-4"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-white text-emerald-700 shadow-sm"><Activity className="h-4 w-4" /></span><div><p className="text-sm font-semibold text-stone-800">Aktifkan capture untuk kamera ini</p><p className="mt-0.5 text-xs leading-5 text-stone-500">Hanya diaktifkan setelah worker capture tersedia.</p></div></div><button type="button" aria-label="Aktifkan capture untuk kamera ini" aria-pressed={captureEnabled} onClick={() => onCaptureEnabledChange(!captureEnabled)} className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${captureEnabled ? "bg-lime-400" : "bg-stone-300"}`}><span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${captureEnabled ? "translate-x-6" : "translate-x-1"}`} /></button></div></div>
      <div className="rounded-2xl bg-[#16332e] p-4 text-white"><div className="flex items-center gap-2 text-lime-200"><FolderKey className="h-4 w-4" /><p className="text-[10px] font-bold uppercase tracking-[0.14em]">Snapshot contract</p></div><p className="mt-3 font-mono text-xs leading-6">{cameraId}/<br />YYYY-MM-DD/<br /><span className="text-lime-300">timestamp.jpg</span></p></div>
      <Button onClick={onSave} disabled={isPending} className="h-11 w-full rounded-xl bg-lime-300 text-lime-950 hover:bg-lime-200"><Check className="mr-2 h-4 w-4" />Simpan konfigurasi kamera</Button>
    </div>
  </aside>;
}
