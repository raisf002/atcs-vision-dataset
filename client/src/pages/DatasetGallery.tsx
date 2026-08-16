import PageHeader from "@/components/PageHeader";
import StatusPill from "@/components/StatusPill";
import { cameraRegistry } from "@/data/cameras";
import { Button } from "@/components/ui/button";
import { CalendarDays, Download, Filter, ImageOff, Search, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function DatasetGallery() {
  const [camera, setCamera] = useState("all");
  const [date, setDate] = useState("");

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-7">
      <PageHeader
        eyebrow="Dataset browser"
        title="Snapshot gallery"
        description="Telusuri hasil capture berdasarkan kamera, tanggal, dan rentang waktu. Snapshot asli akan tampil di sini setelah pipeline capture aktif."
        actions={<Button onClick={() => toast.info("Pilih filter terlebih dahulu untuk menyiapkan arsip ZIP.")} className="rounded-xl bg-stone-900 text-white hover:bg-stone-800"><Download className="mr-2 h-4 w-4" />Ekspor pilihan</Button>}
      />

      <section className="rounded-[1.35rem] border border-stone-200 bg-white p-4 shadow-[0_18px_45px_-35px_rgba(28,32,30,0.5)] lg:p-5">
        <div className="grid gap-3 lg:grid-cols-[1.5fr_1fr_1fr_auto]">
          <label className="relative"><span className="sr-only">Pilih kamera</span><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" /><select value={camera} onChange={(event) => setCamera(event.target.value)} className="h-11 w-full appearance-none rounded-xl border border-stone-200 bg-stone-50 px-9 text-sm font-medium text-stone-700 outline-none ring-0 focus:border-emerald-500"><option value="all">Semua 29 kamera</option>{cameraRegistry.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <label className="relative"><span className="sr-only">Pilih tanggal</span><CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" /><input value={date} onChange={(event) => setDate(event.target.value)} type="date" className="h-11 w-full rounded-xl border border-stone-200 bg-stone-50 px-9 text-sm font-medium text-stone-700 outline-none focus:border-emerald-500" /></label>
          <button onClick={() => toast.info("Filter rentang waktu akan diterapkan ke data snapshot yang sudah tersedia.")} className="flex h-11 items-center justify-between rounded-xl border border-stone-200 bg-stone-50 px-3 text-sm font-medium text-stone-600"><span>Sepanjang hari</span><Filter className="h-4 w-4 text-stone-400" /></button>
          <Button onClick={() => toast.success("Filter tampilan diperbarui.")} className="h-11 rounded-xl bg-lime-300 text-lime-950 hover:bg-lime-200">Terapkan</Button>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-stone-100 pt-4 text-xs text-stone-500"><StatusPill status="empty" /><span>Belum ada objek snapshot di penyimpanan. Hasil filter akan tersedia segera setelah capture pertama selesai.</span></div>
      </section>

      <section className="surface-grid min-h-[480px] overflow-hidden rounded-[1.5rem] border border-stone-200 bg-white p-5 sm:p-8">
        <div className="mx-auto flex max-w-xl flex-col items-center py-20 text-center">
          <span className="grid h-16 w-16 place-items-center rounded-[1.25rem] border border-stone-200 bg-white shadow-[0_16px_25px_-20px_rgba(28,32,30,0.6)]"><ImageOff className="h-7 w-7 text-emerald-700" /></span>
          <p className="mt-6 text-xl font-semibold tracking-[-0.025em] text-stone-950">Galeri siap menerima capture pertama</p>
          <p className="mt-2 max-w-md text-sm leading-6 text-stone-500">Setiap gambar yang tersimpan akan muncul sebagai kartu dataset dengan identitas kamera, waktu UTC, ukuran berkas, dan key penyimpanan yang dapat dilacak.</p>
          <div className="mt-7 w-full rounded-2xl border border-stone-200 bg-white/80 p-4 text-left shadow-sm"><div className="flex items-center gap-3"><ShieldCheck className="h-5 w-5 text-emerald-700" /><div><p className="text-xs font-semibold text-stone-800">Konvensi penyimpanan terkunci</p><p className="mt-0.5 font-mono text-[11px] text-stone-500">camera_id/YYYY-MM-DD/timestamp.jpg</p></div></div></div>
        </div>
      </section>
    </div>
  );
}
