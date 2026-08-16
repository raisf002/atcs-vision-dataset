import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Archive, CalendarRange, CheckCircle2, Download, FileArchive, FolderDown, HardDriveDownload, LoaderCircle, PackageCheck } from "lucide-react";
import { useMemo, useState } from "react";

function formatBytes(bytes: number) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / Math.pow(1024, index)).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

export default function Exports() {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [cameraId, setCameraId] = useState("all");
  const cameraQuery = trpc.dataset.cameras.useQuery();
  const snapshotInput = useMemo(() => ({
    cameraId: cameraId === "all" ? undefined : cameraId,
    from: fromDate ? new Date(`${fromDate}T00:00:00.000Z`) : undefined,
    to: toDate ? new Date(`${toDate}T23:59:59.999Z`) : undefined,
    limit: 120,
  }), [cameraId, fromDate, toDate]);
  const snapshotQuery = trpc.dataset.snapshots.useQuery(snapshotInput);
  const snapshots = snapshotQuery.data ?? [];
  const selectedBytes = snapshots.reduce((total, snapshot) => total + snapshot.sizeBytes, 0);
  const canBuild = snapshots.length > 0 && !snapshotQuery.isLoading && !snapshotQuery.isError;
  const startExport = () => {
    const params = new URLSearchParams();
    if (cameraId !== "all") params.set("cameraId", cameraId);
    if (fromDate) params.set("from", fromDate);
    if (toDate) params.set("to", toDate);
    window.location.assign(`/api/exports/zip?${params.toString()}`);
  };

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-7">
      <PageHeader eyebrow="Training delivery" title="Dataset exports" description="Pilih subset kamera dan rentang tanggal. Pratinjau selalu menghitung dari metadata snapshot produksi, bukan data simulasi." />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(340px,0.8fr)]">
        <section className="rounded-[1.5rem] border border-stone-200 bg-white p-5 shadow-[0_18px_45px_-35px_rgba(28,32,30,0.5)] sm:p-7"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-lime-200 text-lime-950"><FileArchive className="h-5 w-5" /></span><div><h2 className="text-lg font-semibold tracking-tight text-stone-950">Build a training bundle</h2><p className="mt-0.5 text-sm text-stone-500">Pilih sumber gambar yang akan dimasukkan ke satu arsip ZIP.</p></div></div><div className="mt-8 grid gap-5 sm:grid-cols-2"><label className="space-y-2"><span className="text-xs font-semibold uppercase tracking-[0.12em] text-stone-500">Kamera</span><select value={cameraId} onChange={(event) => setCameraId(event.target.value)} className="h-11 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 text-sm font-medium text-stone-700 outline-none focus:border-emerald-500"><option value="all">Semua kamera</option>{(cameraQuery.data ?? []).map((camera) => <option key={camera.id} value={camera.id}>{camera.name}</option>)}</select></label><div className="space-y-2"><span className="text-xs font-semibold uppercase tracking-[0.12em] text-stone-500">Format</span><div className="flex h-11 items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-3 text-sm font-medium text-stone-700"><Archive className="h-4 w-4 text-stone-400" />ZIP · JPEG asli</div></div><label className="space-y-2"><span className="text-xs font-semibold uppercase tracking-[0.12em] text-stone-500">Dari tanggal</span><input value={fromDate} onChange={(event) => setFromDate(event.target.value)} type="date" className="h-11 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 text-sm text-stone-700 outline-none focus:border-emerald-500" /></label><label className="space-y-2"><span className="text-xs font-semibold uppercase tracking-[0.12em] text-stone-500">Sampai tanggal</span><input value={toDate} onChange={(event) => setToDate(event.target.value)} type="date" className="h-11 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 text-sm text-stone-700 outline-none focus:border-emerald-500" /></label></div><div className="mt-6 flex flex-col gap-3 rounded-2xl bg-stone-950 p-4 text-stone-200 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><CalendarRange className="h-5 w-5 text-lime-300" /><p className="text-xs leading-5">{snapshotQuery.isLoading ? "Menghitung snapshot yang cocok…" : snapshotQuery.isError ? "Pratinjau tidak dapat dimuat; data tidak diasumsikan kosong." : "Ukuran dihitung dari snapshot yang sesuai dengan filter."}</p></div><span className="shrink-0 text-sm font-semibold text-white">{snapshotQuery.isLoading ? "…" : `${snapshots.length} file · ${formatBytes(selectedBytes)}`}</span></div><Button onClick={startExport} disabled={!canBuild} className="mt-5 h-11 w-full rounded-xl bg-lime-300 text-lime-950 hover:bg-lime-200 disabled:cursor-not-allowed disabled:opacity-50"><FolderDown className="mr-2 h-4 w-4" />Unduh arsip ZIP</Button></section>
        <aside className="rounded-[1.5rem] border border-stone-200 bg-[#eff4ef] p-6"><p className="text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-800">Export contract</p><h2 className="mt-3 text-2xl font-semibold tracking-[-0.035em] text-stone-950">Dibuat untuk alur training yang bersih.</h2><div className="mt-7 space-y-5">{[[PackageCheck, "Struktur tetap", "Setiap berkas mempertahankan prefix kamera dan tanggal."], [HardDriveDownload, "Tanpa duplikasi", "Arsip akan membaca objek snapshot asli dari penyimpanan."], [CheckCircle2, "Dapat dilacak", "Filter dan metadata ekspor dicatat untuk reproduksibilitas dataset."]].map(([Icon, title, detail]) => <div key={title as string} className="flex gap-3"><span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white text-emerald-800 shadow-sm"><Icon className="h-4 w-4" /></span><div><p className="text-sm font-semibold text-stone-800">{title as string}</p><p className="mt-1 text-xs leading-5 text-stone-600">{detail as string}</p></div></div>)}</div><div className="mt-8 border-t border-emerald-900/10 pt-5"><p className="text-xs text-stone-600">Pembuatan ZIP tidak menyimpan arsip sementara di server aplikasi. Arsip produksi akan ditulis langsung ke object storage.</p><Button variant="outline" disabled className="mt-3 w-full rounded-xl border-stone-300 bg-white text-stone-400"><Download className="mr-2 h-4 w-4" />{snapshotQuery.isLoading ? <LoaderCircle className="ml-2 h-3.5 w-3.5 animate-spin" /> : "Belum ada arsip"}</Button></div></aside>
      </div>
    </div>
  );
}
