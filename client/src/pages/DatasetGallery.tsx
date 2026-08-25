import { useAuth } from "@/_core/hooks/useAuth";
import PageHeader from "@/components/PageHeader";
import StatusPill from "@/components/StatusPill";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { buildSnapshotQueryInput, getSnapshotFilterError } from "@/lib/datasetQuery";
import { AlertTriangle, CalendarDays, Download, Filter, ImageOff, LoaderCircle, Search, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

function formatBytes(bytes: number) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / Math.pow(1024, index)).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

type AnnotationRecord = { snapshotId: number; yoloText: string; status: "draft" | "approved" | "rejected" };

function SnapshotAnnotationEditor({ snapshotId, annotation, isGuest, classMap }: { snapshotId: number; annotation?: AnnotationRecord; isGuest: boolean; classMap: string[] }) {
  const [yoloText, setYoloText] = useState(annotation?.yoloText ?? "");
  const [status, setStatus] = useState<AnnotationRecord["status"]>(annotation?.status ?? "draft");
  const utils = trpc.useUtils();
  const mutation = trpc.dataset.saveSnapshotAnnotation.useMutation({
    onSuccess: async () => {
      await Promise.all([utils.dataset.snapshotAnnotations.invalidate(), utils.dataset.trainingReadiness.invalidate()]);
      toast.success("Anotasi snapshot disimpan.");
    },
    onError: () => toast.error("Anotasi belum dapat disimpan."),
  });
  const label = annotation?.status === "approved" ? "Anotasi disetujui" : annotation?.status === "rejected" ? "Anotasi ditolak" : annotation ? "Draf anotasi" : "Belum dianotasi";
  if (isGuest) return <p className="mt-3 text-[11px] font-medium text-stone-500">{label}</p>;
  return <details className="mt-3 rounded-lg border border-stone-200 bg-stone-50 p-2.5"><summary className="cursor-pointer text-[11px] font-semibold text-emerald-800">{label} · Kelola label YOLO</summary><div className="mt-3 space-y-2"><p className="text-[10px] leading-4 text-stone-500">Format: <code>class x_center y_center width height</code>. Kelas: {classMap.map((item, index) => `${index}=${item}`).join(", ")}.</p><textarea value={yoloText} onChange={(event) => setYoloText(event.target.value)} aria-label={`Label YOLO snapshot ${snapshotId}`} placeholder="0 0.5 0.5 0.2 0.2" className="min-h-20 w-full rounded-md border border-stone-200 bg-white p-2 font-mono text-[10px] text-stone-700 outline-none focus:border-emerald-500" /><div className="flex gap-2"><select value={status} onChange={(event) => setStatus(event.target.value as AnnotationRecord["status"])} aria-label={`Status anotasi snapshot ${snapshotId}`} className="h-8 flex-1 rounded-md border border-stone-200 bg-white px-2 text-[10px] text-stone-700"><option value="draft">Draf</option><option value="approved">Disetujui</option><option value="rejected">Ditolak</option></select><button type="button" disabled={!yoloText.trim() || mutation.isPending} onClick={() => mutation.mutate({ snapshotId, yoloText, status })} className="h-8 rounded-md bg-emerald-800 px-2.5 text-[10px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">{mutation.isPending ? "Menyimpan…" : "Simpan"}</button></div></div></details>;
}

export default function DatasetGallery() {
  const { user } = useAuth();
  const isGuest = !user;
  const [, navigate] = useLocation();
  const [cameraId, setCameraId] = useState("all");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("00:00");
  const [endTime, setEndTime] = useState("23:59");
  const cameraQuery = trpc.dataset.cameras.useQuery();
  const queryInput = useMemo(() => buildSnapshotQueryInput({ cameraId, date, startTime, endTime }), [cameraId, date, startTime, endTime]);
  const filterError = useMemo(() => getSnapshotFilterError({ cameraId, date, startTime, endTime }), [cameraId, date, startTime, endTime]);
  const snapshotQuery = trpc.dataset.snapshots.useQuery(queryInput, { enabled: !filterError });
  const cameras = cameraQuery.data ?? [];
  const snapshots = snapshotQuery.data ?? [];
  const snapshotIds = useMemo(() => snapshots.map((snapshot) => snapshot.id), [snapshots]);
  const annotationsQuery = trpc.dataset.snapshotAnnotations.useQuery({ snapshotIds }, { enabled: snapshotIds.length > 0 });
  const readinessQuery = trpc.dataset.trainingReadiness.useQuery(queryInput, { enabled: !filterError });
  const cameraById = useMemo(() => new Map(cameras.map((camera) => [camera.id, camera])), [cameras]);
  const annotationBySnapshotId = useMemo(() => new Map((annotationsQuery.data ?? []).map((annotation) => [annotation.snapshotId, annotation])), [annotationsQuery.data]);
  const classMap = readinessQuery.data?.classMap ?? ["car", "truck", "bus", "motorcycle"];
  const openExports = () => {
    const params = new URLSearchParams();
    if (cameraId !== "all") params.set("cameraId", cameraId);
    if (date) { params.set("fromDate", date); params.set("toDate", date); params.set("startTime", startTime); params.set("endTime", endTime); }
    navigate(`/exports${params.size ? `?${params}` : ""}`);
  };

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-7">
      <PageHeader eyebrow="Penelusur dataset" title="Galeri snapshot" description="Telusuri snapshot produksi berdasarkan kamera dan tanggal. Metadata muncul segera setelah worker capture menyimpan gambar ke S3." actions={<Button onClick={openExports} disabled={!snapshots.length} className="rounded-xl bg-stone-900 text-white hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-50"><Download className="mr-2 h-4 w-4" />Ekspor pilihan</Button>} />
      <section className="rounded-[1.35rem] border border-stone-200 bg-white p-4 shadow-[0_18px_45px_-35px_rgba(28,32,30,0.5)] lg:p-5"><div className="grid gap-3 lg:grid-cols-[1.3fr_1fr_0.65fr_0.65fr_auto]"><label className="relative"><span className="sr-only">Pilih kamera</span><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" /><select value={cameraId} onChange={(event) => setCameraId(event.target.value)} className="h-11 w-full appearance-none rounded-xl border border-stone-200 bg-stone-50 px-9 text-sm font-medium text-stone-700 outline-none focus:border-emerald-500"><option value="all">Semua 29 kamera</option>{cameras.map((camera) => <option key={camera.id} value={camera.id}>{camera.name}</option>)}</select></label><label className="relative"><span className="sr-only">Pilih tanggal</span><CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" /><input value={date} onChange={(event) => setDate(event.target.value)} type="date" className="h-11 w-full rounded-xl border border-stone-200 bg-stone-50 px-9 text-sm font-medium text-stone-700 outline-none focus:border-emerald-500" /></label><label className="space-y-1"><span className="sr-only">Waktu awal</span><input value={startTime} onChange={(event) => setStartTime(event.target.value)} disabled={!date} type="time" aria-invalid={Boolean(filterError)} aria-describedby={filterError ? "gallery-filter-status" : undefined} className="h-11 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 text-sm font-medium text-stone-700 outline-none disabled:cursor-not-allowed disabled:opacity-50 focus:border-emerald-500" /></label><label className="space-y-1"><span className="sr-only">Waktu akhir</span><input value={endTime} onChange={(event) => setEndTime(event.target.value)} disabled={!date} type="time" aria-invalid={Boolean(filterError)} aria-describedby={filterError ? "gallery-filter-status" : undefined} className="h-11 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 text-sm font-medium text-stone-700 outline-none disabled:cursor-not-allowed disabled:opacity-50 focus:border-emerald-500" /></label><Button onClick={() => snapshotQuery.refetch()} disabled={Boolean(filterError)} className="h-11 rounded-xl bg-lime-300 text-lime-950 hover:bg-lime-200 disabled:cursor-not-allowed disabled:opacity-50">Terapkan</Button></div><div className="mt-4 flex flex-wrap items-center gap-2 border-t border-stone-100 pt-4 text-xs text-stone-500"><button onClick={() => { setCameraId("all"); setDate(""); setStartTime("00:00"); setEndTime("23:59"); }} className="mr-1 inline-flex items-center gap-1 font-semibold text-emerald-800 hover:text-emerald-950"><Filter className="h-3.5 w-3.5" />Reset</button><StatusPill status={filterError || snapshotQuery.isError ? "invalid" : snapshots.length ? "active" : "empty"} /><span id="gallery-filter-status" role={filterError ? "alert" : "status"} aria-live={filterError ? "assertive" : "polite"} aria-atomic="true">{filterError ? filterError : snapshotQuery.isLoading ? "Memuat metadata snapshot…" : snapshotQuery.isError ? "Metadata snapshot belum dapat dimuat; dataset tidak diasumsikan kosong." : snapshots.length ? `${snapshots.length} snapshot cocok dengan filter saat ini.` : "Belum ada objek snapshot untuk filter ini."}</span></div></section>
      {snapshotQuery.isLoading ? <section className="flex min-h-[480px] items-center justify-center rounded-[1.5rem] border border-stone-200 bg-white text-sm text-stone-500"><LoaderCircle className="mr-2 h-5 w-5 animate-spin" />Memuat galeri snapshot…</section> : snapshotQuery.isError ? <section className="flex min-h-[300px] items-center justify-center rounded-[1.5rem] border border-orange-200 bg-orange-50 p-8 text-center"><div><AlertTriangle className="mx-auto h-7 w-7 text-orange-700" /><p className="mt-3 font-semibold text-orange-950">Galeri belum dapat dimuat</p><p className="mt-1 text-sm text-orange-800">Metadata produksi belum dapat dimuat. Coba muat ulang; jika tetap gagal, periksa koneksi metadata.</p><Button variant="outline" onClick={() => snapshotQuery.refetch()} className="mt-5 rounded-xl border-orange-300 bg-white text-orange-900 hover:bg-orange-100">Coba muat ulang</Button></div></section> : snapshots.length ? <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{snapshots.map((snapshot) => { const camera = cameraById.get(snapshot.cameraId); return <article key={snapshot.id} className="overflow-hidden rounded-[1.35rem] border border-stone-200 bg-white shadow-[0_18px_45px_-35px_rgba(28,32,30,0.5)]"><div className="aspect-[4/3] bg-[#16332e]"><img src={`/manus-storage/${snapshot.storageKey}`} alt={`Snapshot ${camera?.name ?? snapshot.cameraId}`} className="h-full w-full object-cover" loading="lazy" onError={(event) => { event.currentTarget.style.display = "none"; }} /></div><div className="p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold text-stone-900">{camera?.name ?? snapshot.cameraId}</p><p className="mt-1 text-xs text-stone-500">{new Date(snapshot.capturedAt).toLocaleString("id-ID")}</p></div><span className="rounded-lg bg-stone-100 px-2 py-1 font-mono text-[10px] text-stone-500">{formatBytes(snapshot.sizeBytes)}</span></div><p className="mt-3 truncate font-mono text-[10px] text-stone-400">{snapshot.storageKey}</p><SnapshotAnnotationEditor snapshotId={snapshot.id} annotation={annotationBySnapshotId.get(snapshot.id)} isGuest={isGuest} classMap={classMap} /></div></article>; })}</section> : <section className="surface-grid min-h-[480px] overflow-hidden rounded-[1.5rem] border border-stone-200 bg-white p-5 sm:p-8"><div className="mx-auto flex max-w-xl flex-col items-center py-20 text-center"><span className="grid h-16 w-16 place-items-center rounded-[1.25rem] border border-stone-200 bg-white shadow-[0_16px_25px_-20px_rgba(28,32,30,0.6)]"><ImageOff className="h-7 w-7 text-emerald-700" /></span><p className="mt-6 text-xl font-semibold tracking-[-0.025em] text-stone-950">Belum ada snapshot untuk filter ini</p><p className="mt-2 max-w-md text-sm leading-6 text-stone-500">Pilih kamera atau tanggal lain, atau jalankan capture saat worker tersedia. Gambar yang tersimpan kemudian akan muncul sebagai kartu dataset yang dapat dilacak.</p><div className="mt-7 w-full rounded-2xl border border-stone-200 bg-white/80 p-4 text-left shadow-sm"><div className="flex items-center gap-3"><ShieldCheck className="h-5 w-5 text-emerald-700" /><div><p className="text-xs font-semibold text-stone-800">Konvensi penyimpanan terkunci</p><p className="mt-0.5 font-mono text-[11px] text-stone-500">camera_id/YYYY-MM-DD/timestamp.jpg</p></div></div></div></div></section>}
    </div>
  );
}
