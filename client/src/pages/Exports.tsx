import PageHeader from "@/components/PageHeader";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { buildExportZipUrl, getExportDateRangeError, type ExportMode } from "@/lib/exportUrl";
import { Archive, CalendarRange, CheckCircle2, Download, FileArchive, FolderDown, HardDriveDownload, LoaderCircle, PackageCheck, ShieldAlert, Tags } from "lucide-react";
import { useMemo, useState } from "react";

function formatBytes(bytes: number) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / Math.pow(1024, index)).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

export default function Exports() {
  const { user } = useAuth();
  const isGuest = !user;
  const initialFilters = useMemo(() => new URLSearchParams(window.location.search), []);
  const [fromDate, setFromDate] = useState(() => initialFilters.get("fromDate") ?? "");
  const [toDate, setToDate] = useState(() => initialFilters.get("toDate") ?? "");
  const [startTime, setStartTime] = useState(() => initialFilters.get("startTime") ?? "00:00");
  const [endTime, setEndTime] = useState(() => initialFilters.get("endTime") ?? "23:59");
  const [cameraId, setCameraId] = useState(() => initialFilters.get("cameraId") ?? "all");
  const [exportMode, setExportMode] = useState<ExportMode>("raw");
  const cameraQuery = trpc.dataset.cameras.useQuery();
  const snapshotInput = useMemo(() => ({
    cameraId: cameraId === "all" ? undefined : cameraId,
    from: fromDate ? new Date(`${fromDate}T${startTime}:00.000Z`) : undefined,
    to: toDate ? new Date(`${toDate}T${endTime}:59.999Z`) : undefined,
    limit: 120,
  }), [cameraId, fromDate, toDate, startTime, endTime]);
  const dateRangeError = useMemo(() => {
    const dateError = getExportDateRangeError({ cameraId, fromDate, toDate });
    if (dateError) return dateError;
    if (fromDate && toDate && fromDate === toDate && startTime > endTime) return "Waktu akhir harus sama dengan atau setelah waktu awal.";
    return null;
  }, [cameraId, fromDate, toDate, startTime, endTime]);
  const snapshotQuery = trpc.dataset.snapshots.useQuery(snapshotInput, { enabled: !dateRangeError });
  const readinessQuery = trpc.dataset.trainingReadiness.useQuery(snapshotInput, { enabled: !dateRangeError });
  const snapshots = snapshotQuery.data ?? [];
  const readiness = readinessQuery.data;
  const selectedBytes = snapshots.reduce((total, snapshot) => total + snapshot.sizeBytes, 0);
  const baseReady = snapshots.length > 0 && !snapshotQuery.isLoading && !snapshotQuery.isError && !dateRangeError;
  const trainingReady = Boolean(readiness && readiness.approvedAnnotations > 0);
  const canBuild = baseReady && (exportMode === "raw" || trainingReady);
  const startExport = () => {
    if (isGuest) return;
    window.location.assign(buildExportZipUrl({ cameraId, fromDate, toDate, startTime, endTime, mode: exportMode }));
  };

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-7">
      <PageHeader eyebrow="Paket training" title="Ekspor dataset" description="Pilih subset kamera dan rentang tanggal. Pratinjau selalu dihitung dari metadata snapshot produksi, bukan data simulasi." />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(340px,0.8fr)]">
        <section className="rounded-[1.5rem] border border-stone-200 bg-white p-5 shadow-[0_18px_45px_-35px_rgba(28,32,30,0.5)] sm:p-7">
          <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-lime-200 text-lime-950"><FileArchive className="h-5 w-5" /></span><div><h2 className="text-lg font-semibold tracking-tight text-stone-950">Buat paket dataset</h2><p className="mt-0.5 text-sm text-stone-500">{isGuest ? "Pratinjau tersedia untuk Guest; unduhan ZIP memerlukan akses admin." : "Pilih gambar mentah atau paket YOLO yang sudah lolos pemeriksaan."}</p></div></div>
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            <label className="space-y-2"><span className="text-xs font-semibold uppercase tracking-[0.12em] text-stone-500">Kamera</span><select value={cameraId} onChange={(event) => setCameraId(event.target.value)} className="h-11 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 text-sm font-medium text-stone-700 outline-none focus:border-emerald-500"><option value="all">Semua kamera</option>{(cameraQuery.data ?? []).map((camera) => <option key={camera.id} value={camera.id}>{camera.name}</option>)}</select></label>
            <fieldset className="space-y-2"><legend className="text-xs font-semibold uppercase tracking-[0.12em] text-stone-500">Mode ekspor</legend><div className="grid h-11 grid-cols-2 gap-2"><button type="button" aria-pressed={exportMode === "raw"} onClick={() => setExportMode("raw")} className={`rounded-xl border px-2 text-xs font-semibold ${exportMode === "raw" ? "border-emerald-700 bg-emerald-50 text-emerald-900" : "border-stone-200 bg-stone-50 text-stone-500"}`}>JPEG mentah</button><button type="button" aria-pressed={exportMode === "training"} onClick={() => setExportMode("training")} className={`rounded-xl border px-2 text-xs font-semibold ${exportMode === "training" ? "border-emerald-700 bg-emerald-50 text-emerald-900" : "border-stone-200 bg-stone-50 text-stone-500"}`}>Siap-training YOLO</button></div></fieldset>
            <label className="space-y-2"><span className="text-xs font-semibold uppercase tracking-[0.12em] text-stone-500">Dari tanggal</span><input value={fromDate} onChange={(event) => setFromDate(event.target.value)} type="date" aria-invalid={Boolean(dateRangeError)} aria-describedby={dateRangeError ? "export-filter-status" : undefined} className="h-11 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 text-sm text-stone-700 outline-none focus:border-emerald-500" /></label>
            <label className="space-y-2"><span className="text-xs font-semibold uppercase tracking-[0.12em] text-stone-500">Sampai tanggal</span><input value={toDate} onChange={(event) => setToDate(event.target.value)} type="date" aria-invalid={Boolean(dateRangeError)} aria-describedby={dateRangeError ? "export-filter-status" : undefined} className="h-11 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 text-sm text-stone-700 outline-none focus:border-emerald-500" /></label>
            <label className="space-y-2"><span className="text-xs font-semibold uppercase tracking-[0.12em] text-stone-500">Waktu awal</span><input value={startTime} onChange={(event) => setStartTime(event.target.value)} type="time" disabled={!fromDate} aria-describedby={dateRangeError ? "export-filter-status" : undefined} className="h-11 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 text-sm text-stone-700 outline-none disabled:cursor-not-allowed disabled:opacity-50 focus:border-emerald-500" /></label>
            <label className="space-y-2"><span className="text-xs font-semibold uppercase tracking-[0.12em] text-stone-500">Waktu akhir</span><input value={endTime} onChange={(event) => setEndTime(event.target.value)} type="time" disabled={!toDate} aria-describedby={dateRangeError ? "export-filter-status" : undefined} className="h-11 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 text-sm text-stone-700 outline-none disabled:cursor-not-allowed disabled:opacity-50 focus:border-emerald-500" /></label>
          </div>
          <div className="mt-6 flex flex-col gap-3 rounded-2xl bg-stone-950 p-4 text-stone-200 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><CalendarRange className="h-5 w-5 text-lime-300" /><p id="export-filter-status" role={dateRangeError ? "alert" : "status"} aria-live={dateRangeError ? "assertive" : "polite"} aria-atomic="true" className="text-xs leading-5">{dateRangeError ? dateRangeError : snapshotQuery.isLoading ? "Menghitung snapshot yang cocok…" : snapshotQuery.isError ? "Pratinjau tidak dapat dimuat; data tidak diasumsikan kosong." : !snapshots.length ? "Belum ada snapshot yang sesuai; pilih rentang lain atau jalankan capture terlebih dahulu." : exportMode === "training" ? `${readiness?.approvedAnnotations ?? 0}/${readiness?.totalSnapshots ?? snapshots.length} anotasi disetujui. Blur dan duplikat diperiksa saat arsip dibuat.` : "Ukuran dihitung dari snapshot yang sesuai dengan filter."}</p></div><span className="shrink-0 text-sm font-semibold text-white">{snapshotQuery.isLoading ? "…" : `${snapshots.length} file · ${formatBytes(selectedBytes)}`}</span></div>
          {exportMode === "training" ? <div className={`mt-4 rounded-xl border p-4 text-xs ${trainingReady ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-amber-200 bg-amber-50 text-amber-900"}`}><div className="flex items-start gap-2"><Tags className="mt-0.5 h-4 w-4 shrink-0" /><div><p className="font-semibold">Kesiapan YOLO</p><p className="mt-1 leading-5">Class map: {(readiness?.classMap ?? []).join(", ") || "memuat…"}. Paket hanya memasukkan anotasi berstatus disetujui; snapshot blur, duplikat byte-identik, atau JPEG tidak terbaca akan dikeluarkan dan dicatat pada manifest.</p>{readiness ? <p className="mt-2 font-medium">{readiness.approvedAnnotations} siap · {readiness.pendingAnnotations} belum disetujui · {readiness.invalidAnnotations} label tidak valid</p> : null}</div></div></div> : null}
          <Button onClick={startExport} disabled={isGuest || !canBuild} className="mt-5 h-11 w-full rounded-xl bg-lime-300 text-lime-950 hover:bg-lime-200 disabled:cursor-not-allowed disabled:opacity-50"><FolderDown className="mr-2 h-4 w-4" />{isGuest ? "Mode Guest · unduhan dikunci" : exportMode === "training" ? trainingReady ? "Unduh paket siap-training" : "Belum ada anotasi disetujui" : "Unduh arsip JPEG mentah"}</Button>
        </section>
        <aside className="rounded-[1.5rem] border border-stone-200 bg-[#eff4ef] p-6"><p className="text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-800">Kontrak ekspor</p><h2 className="mt-3 text-2xl font-semibold tracking-[-0.035em] text-stone-950">Dibuat untuk alur training yang dapat ditelusuri.</h2><div className="mt-7 space-y-5">{[[PackageCheck, "Struktur YOLO", "Mode siap-training menghasilkan images/train|val|test, labels, dataset.yaml, class-map, dan manifest versi."], [HardDriveDownload, "Tanpa duplikasi", "Arsip membaca objek snapshot asli dari object storage tanpa mengubah gambar sumber."], [CheckCircle2, "Split deterministik", "Pembagian 70/20/10 ditentukan hash storage key sehingga dapat diulang."], [ShieldAlert, "Quality gate", "Anotasi yang belum disetujui, label invalid, blur, duplikat, dan JPEG gagal baca tidak ikut paket training."]].map(([Icon, title, detail]) => <div key={title as string} className="flex gap-3"><span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white text-emerald-800 shadow-sm"><Icon className="h-4 w-4" /></span><div><p className="text-sm font-semibold text-stone-800">{title as string}</p><p className="mt-1 text-xs leading-5 text-stone-600">{detail as string}</p></div></div>)}</div><div className="mt-8 border-t border-emerald-900/10 pt-5"><p className="text-xs text-stone-600">Pembuatan ZIP tidak menyimpan arsip sementara di server aplikasi. Mode siap-training membuat manifest JSON di dalam ZIP dan tidak mengubah snapshot historis.</p><Button variant="outline" disabled className="mt-3 w-full rounded-xl border-stone-300 bg-white text-stone-400"><Download className="mr-2 h-4 w-4" />{snapshotQuery.isLoading ? <LoaderCircle className="ml-2 h-3.5 w-3.5 animate-spin" /> : "Pratinjau hanya-baca"}</Button></div></aside>
      </div>
    </div>
  );
}
