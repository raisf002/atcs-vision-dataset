import PageHeader from "@/components/PageHeader";
import { cameraRegistry } from "@/data/cameras";
import { Button } from "@/components/ui/button";
import { Archive, CalendarRange, CheckCircle2, Download, FileArchive, FolderDown, HardDriveDownload, PackageCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Exports() {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [camera, setCamera] = useState("all");

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-7">
      <PageHeader eyebrow="Training delivery" title="Dataset exports" description="Siapkan arsip ZIP dari subset kamera dan rentang tanggal tertentu agar data dapat langsung dipindahkan ke alur anotasi atau pelatihan model." />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(340px,0.8fr)]">
        <section className="rounded-[1.5rem] border border-stone-200 bg-white p-5 shadow-[0_18px_45px_-35px_rgba(28,32,30,0.5)] sm:p-7">
          <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-lime-200 text-lime-950"><FileArchive className="h-5 w-5" /></span><div><h2 className="text-lg font-semibold tracking-tight text-stone-950">Build a training bundle</h2><p className="mt-0.5 text-sm text-stone-500">Pilih sumber gambar yang akan dimasukkan ke satu arsip ZIP.</p></div></div>
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            <label className="space-y-2"><span className="text-xs font-semibold uppercase tracking-[0.12em] text-stone-500">Kamera</span><select value={camera} onChange={(event) => setCamera(event.target.value)} className="h-11 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 text-sm font-medium text-stone-700 outline-none focus:border-emerald-500"><option value="all">Semua kamera</option>{cameraRegistry.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
            <div className="space-y-2"><span className="text-xs font-semibold uppercase tracking-[0.12em] text-stone-500">Format</span><div className="flex h-11 items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-3 text-sm font-medium text-stone-700"><Archive className="h-4 w-4 text-stone-400" />ZIP · JPEG asli</div></div>
            <label className="space-y-2"><span className="text-xs font-semibold uppercase tracking-[0.12em] text-stone-500">Dari tanggal</span><input value={fromDate} onChange={(event) => setFromDate(event.target.value)} type="date" className="h-11 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 text-sm text-stone-700 outline-none focus:border-emerald-500" /></label>
            <label className="space-y-2"><span className="text-xs font-semibold uppercase tracking-[0.12em] text-stone-500">Sampai tanggal</span><input value={toDate} onChange={(event) => setToDate(event.target.value)} type="date" className="h-11 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 text-sm text-stone-700 outline-none focus:border-emerald-500" /></label>
          </div>
          <div className="mt-6 flex flex-col gap-3 rounded-2xl bg-stone-950 p-4 text-stone-200 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><CalendarRange className="h-5 w-5 text-lime-300" /><p className="text-xs leading-5">Jumlah file dan ukuran arsip dihitung dari snapshot yang cocok ketika data produksi tersedia.</p></div><span className="shrink-0 text-sm font-semibold text-white">0 file terpilih</span></div>
          <Button onClick={() => toast.info("Antrian ekspor akan dibuat setelah snapshot produksi tersedia.")} className="mt-5 h-11 w-full rounded-xl bg-lime-300 text-lime-950 hover:bg-lime-200"><FolderDown className="mr-2 h-4 w-4" />Buat arsip ZIP</Button>
        </section>

        <aside className="rounded-[1.5rem] border border-stone-200 bg-[#eff4ef] p-6"><p className="text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-800">Export contract</p><h2 className="mt-3 text-2xl font-semibold tracking-[-0.035em] text-stone-950">Dibuat untuk alur training yang bersih.</h2><div className="mt-7 space-y-5">{[
          [PackageCheck, "Struktur tetap", "Setiap berkas mengikuti prefix kamera dan tanggal."],
          [HardDriveDownload, "Tanpa duplikasi", "Arsip mereferensikan objek snapshot asli di penyimpanan."],
          [CheckCircle2, "Dapat dilacak", "Filter dan metadata ekspor tercatat untuk reproduksibilitas dataset."],
        ].map(([Icon, title, detail]) => <div key={title as string} className="flex gap-3"><span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white text-emerald-800 shadow-sm"><Icon className="h-4 w-4" /></span><div><p className="text-sm font-semibold text-stone-800">{title as string}</p><p className="mt-1 text-xs leading-5 text-stone-600">{detail as string}</p></div></div>)}</div><div className="mt-8 border-t border-emerald-900/10 pt-5"><p className="text-xs text-stone-600">Riwayat ekspor akan muncul di sini setelah ada data snapshot yang tersimpan.</p><Button variant="outline" disabled className="mt-3 w-full rounded-xl border-stone-300 bg-white text-stone-400"><Download className="mr-2 h-4 w-4" />Belum ada arsip</Button></div></aside>
      </div>
    </div>
  );
}
