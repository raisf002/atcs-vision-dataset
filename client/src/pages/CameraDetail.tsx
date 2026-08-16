import LiveHlsPlayer from "@/components/LiveHlsPlayer";
import PageHeader from "@/components/PageHeader";
import StatusPill from "@/components/StatusPill";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Activity, ArrowLeft, Camera, Check, ExternalLink, FolderKey, Save, Settings2 } from "lucide-react";
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
  const { user } = useAuth();
  const updateCamera = trpc.dataset.updateCamera.useMutation({ onSuccess: () => cameraQuery.refetch() });

  useEffect(() => {
    if (!camera) return;
    const rawDraft = user?.role === "admin" ? null : localStorage.getItem(`atcs-camera-draft-${camera.id}`);
    if (rawDraft) {
      try {
        const draft = JSON.parse(rawDraft) as { sourceUrl?: string | null; isActive?: boolean; captureIntervalMinutes?: (typeof intervals)[number] };
        setSourceUrl(draft.sourceUrl ?? camera.sourceUrl ?? "");
        setCaptureEnabled(draft.isActive ?? camera.isActive);
        setInterval(draft.captureIntervalMinutes ?? camera.captureIntervalMinutes ?? "5");
        return;
      } catch {
        if (camera) localStorage.removeItem(`atcs-camera-draft-${camera.id}`);
      }
    }
    setSourceUrl(camera.sourceUrl ?? "");
    setCaptureEnabled(camera.isActive);
    setInterval(camera.captureIntervalMinutes ?? "5");
  }, [camera, user?.role]);

  if (cameraQuery.isLoading) return <div className="mx-auto max-w-xl rounded-[1.5rem] border border-stone-200 bg-white p-8 text-center text-sm text-stone-500 shadow-sm">Memuat konfigurasi kamera…</div>;
  if (!camera) {
    return <div className="mx-auto max-w-xl rounded-[1.5rem] border border-stone-200 bg-white p-8 text-center shadow-sm"><Camera className="mx-auto h-8 w-8 text-stone-300" /><h1 className="mt-4 text-xl font-semibold text-stone-900">Kamera tidak ditemukan</h1><p className="mt-2 text-sm text-stone-500">Kembali ke registry untuk memilih salah satu dari 29 CCTV ATCS.</p><Link href="/cameras" className="mt-6 inline-flex rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white">Kembali ke registry</Link></div>;
  }

  const saveDraft = () => {
    const payload = { sourceUrl: sourceUrl || null, isActive: captureEnabled, captureIntervalMinutes: interval };
    if (user?.role !== "admin") localStorage.setItem(`atcs-camera-draft-${camera.id}`, JSON.stringify(payload));
    if (user?.role !== "admin") {
      toast.success("Draf konfigurasi disimpan di peramban. Masuk sebagai admin untuk menyimpan ke server.");
      return;
    }
    if (updateCamera.isPending) return;
    updateCamera.mutate({ id: camera.id, sourceUrl: sourceUrl || null, isActive: captureEnabled, captureIntervalMinutes: interval }, {
      onSuccess: () => { localStorage.removeItem(`atcs-camera-draft-${camera.id}`); toast.success("Konfigurasi kamera disimpan."); },
      onError: () => toast.error("Konfigurasi belum dapat disimpan ke server."),
    });
  };

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-7">
      <Link href="/cameras" className="inline-flex items-center gap-2 text-sm font-semibold text-stone-500 transition-colors hover:text-stone-950"><ArrowLeft className="h-4 w-4" />Kembali ke camera registry</Link>
      <PageHeader
        eyebrow={`CCTV ${camera.id} · ${camera.zone}`}
        title={camera.name}
        description={user?.role === "admin" ? "Pantau live view dan kelola pengaturan capture khusus untuk titik CCTV ini. Perubahan disimpan langsung ke registry produksi." : "Pantau live view dan siapkan pengaturan capture khusus untuk titik CCTV ini. Draf lokal dapat digunakan sebelum akses admin tersedia."}
        actions={<><StatusPill status={camera.sourceStatus} /><Button onClick={saveDraft} disabled={updateCamera.isPending} className="rounded-xl bg-stone-900 text-white hover:bg-stone-800"><Save className="mr-2 h-4 w-4" />{updateCamera.isPending ? "Menyimpan…" : "Simpan konfigurasi"}</Button></>}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.75fr)]">
        <section className="space-y-5"><LiveHlsPlayer sourceUrl={sourceUrl || null} cameraName={camera.name} /><div className="grid gap-3 sm:grid-cols-3"><div className="rounded-xl border border-stone-200 bg-white p-4"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-stone-500">Dataset images</p><p className="mt-2 text-2xl font-semibold tracking-tight text-stone-950">{camera.captureCount}</p><p className="mt-1 text-xs text-stone-500">{camera.captureCount ? "Metadata tersimpan" : "Menunggu capture"}</p></div><div className="rounded-xl border border-stone-200 bg-white p-4"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-stone-500">Last capture</p><p className="mt-2 text-sm font-semibold text-stone-950">{camera.lastCaptureAt ? new Date(camera.lastCaptureAt).toLocaleString("id-ID") : "Belum ada"}</p><p className="mt-1 text-xs text-stone-500">{camera.lastCaptureAt ? "Waktu capture terakhir" : "Tidak ada snapshot"}</p></div><div className="rounded-xl border border-stone-200 bg-white p-4"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-stone-500">Storage key</p><p className="mt-2 font-mono text-[11px] font-medium text-stone-800">{camera.id}/…</p><p className="mt-1 text-xs text-stone-500">JPEG per tanggal</p></div></div></section>

        <aside className="rounded-[1.5rem] border border-stone-200 bg-white p-5 shadow-[0_18px_45px_-35px_rgba(28,32,30,0.5)] sm:p-6"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-lime-200 text-lime-950"><Settings2 className="h-5 w-5" /></span><div><p className="text-lg font-semibold tracking-tight text-stone-950">Camera configuration</p><p className="mt-0.5 text-xs text-stone-500">Khusus untuk kamera ini</p></div></div><div className="mt-7 space-y-5"><label className="block space-y-2"><span className="text-xs font-semibold uppercase tracking-[0.12em] text-stone-500">HLS source URL</span><div className="relative"><Input value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} className="h-11 rounded-xl border-stone-200 bg-stone-50 pr-10 font-mono text-xs" /><ExternalLink className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" /></div></label><div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-stone-500">Interval capture</p><div className="mt-3 grid grid-cols-4 gap-2">{intervals.map((item) => <button key={item} onClick={() => setInterval(item)} className={`rounded-xl border py-3 text-center transition-colors ${interval === item ? "border-emerald-700 bg-emerald-50 text-emerald-950" : "border-stone-200 bg-stone-50 text-stone-600 hover:border-stone-300"}`}><span className="text-lg font-semibold">{item}</span><span className="ml-0.5 text-[10px] font-medium">min</span></button>)}</div><p className="mt-2 text-xs leading-5 text-stone-500">Override khusus kamera. Saat kosong, sistem menggunakan interval global 5 menit.</p></div><div className="rounded-2xl border border-stone-200 bg-stone-50 p-4"><div className="flex items-center justify-between gap-4"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-white text-emerald-700 shadow-sm"><Activity className="h-4 w-4" /></span><div><p className="text-sm font-semibold text-stone-800">Aktifkan capture untuk kamera ini</p><p className="mt-0.5 text-xs leading-5 text-stone-500">Hanya diaktifkan setelah worker capture tersedia.</p></div></div><button aria-pressed={captureEnabled} onClick={() => setCaptureEnabled((current) => !current)} className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${captureEnabled ? "bg-lime-400" : "bg-stone-300"}`}><span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${captureEnabled ? "translate-x-6" : "translate-x-1"}`} /></button></div></div><div className="rounded-2xl bg-[#16332e] p-4 text-white"><div className="flex items-center gap-2 text-lime-200"><FolderKey className="h-4 w-4" /><p className="text-[10px] font-bold uppercase tracking-[0.14em]">Snapshot contract</p></div><p className="mt-3 font-mono text-xs leading-6">{camera.id}/<br />YYYY-MM-DD/<br /><span className="text-lime-300">timestamp.jpg</span></p></div><Button onClick={saveDraft} disabled={updateCamera.isPending} className="h-11 w-full rounded-xl bg-lime-300 text-lime-950 hover:bg-lime-200"><Check className="mr-2 h-4 w-4" />Simpan konfigurasi kamera</Button></div></aside>
      </div>
    </div>
  );
}
