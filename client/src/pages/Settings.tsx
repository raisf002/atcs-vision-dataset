import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Camera, FolderKey, ListFilter, Route, ShieldAlert } from "lucide-react";
import { Link } from "wouter";

export default function Settings() {
  return (
    <div className="mx-auto w-full max-w-[1260px] space-y-7">
      <PageHeader
        eyebrow="Workspace policy"
        title="Pipeline standards"
        description="Konfigurasi live view, sumber HLS, interval, dan status capture sekarang dimiliki oleh masing-masing CCTV—bukan lagi satu pengaturan global."
        actions={<Link href="/cameras"><Button className="rounded-xl bg-stone-900 text-white hover:bg-stone-800"><Camera className="mr-2 h-4 w-4" />Buka camera registry</Button></Link>}
      />

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[1.5rem] border border-stone-200 bg-white p-5 shadow-[0_18px_45px_-35px_rgba(28,32,30,0.5)] sm:p-7">
          <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-lime-200 text-lime-950"><ListFilter className="h-5 w-5" /></span><div><h2 className="text-lg font-semibold tracking-tight text-stone-950">Per-camera configuration</h2><p className="mt-0.5 text-sm text-stone-500">Setiap pengaturan mengikuti titik CCTV yang dipilih.</p></div></div>
          <div className="mt-8 divide-y divide-stone-100 rounded-2xl border border-stone-200"><div className="flex items-start gap-4 p-4"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-stone-100 text-stone-600"><Camera className="h-4 w-4" /></span><div><p className="text-sm font-semibold text-stone-800">Sumber & live view</p><p className="mt-1 text-xs leading-5 text-stone-500">URL HLS dan pemutaran video diperiksa dari halaman detail kamera yang dipilih.</p></div></div><div className="flex items-start gap-4 p-4"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-stone-100 text-stone-600"><Route className="h-4 w-4" /></span><div><p className="text-sm font-semibold text-stone-800">Interval & capture state</p><p className="mt-1 text-xs leading-5 text-stone-500">Pilih 1, 5, 10, atau 15 menit serta status aktif/nonaktif secara individual untuk tiap CCTV.</p></div></div><div className="flex items-start gap-4 p-4"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-stone-100 text-stone-600"><FolderKey className="h-4 w-4" /></span><div><p className="text-sm font-semibold text-stone-800">Dataset lineage</p><p className="mt-1 text-xs leading-5 text-stone-500">Ringkasan snapshot, capture terakhir, dan prefix penyimpanan tampil bersama konfigurasi kamera.</p></div></div></div>
          <Link href="/cameras/rancabango-bantar" className="mt-5 inline-flex h-10 items-center rounded-xl bg-lime-300 px-4 text-sm font-semibold text-lime-950 transition-colors hover:bg-lime-200">Lihat contoh konfigurasi CCTV</Link>
        </section>

        <aside className="space-y-6"><section className="rounded-[1.5rem] border border-stone-200 bg-[#16332e] p-6 text-white"><div className="flex items-center gap-2 text-lime-200"><FolderKey className="h-4 w-4" /><p className="text-[11px] font-bold uppercase tracking-[0.16em]">S3 key contract</p></div><p className="mt-5 font-mono text-sm leading-7 text-white">camera_id/<br />YYYY-MM-DD/<br /><span className="text-lime-300">timestamp.jpg</span></p><p className="mt-5 text-xs leading-5 text-stone-300">Key dibentuk server-side berdasarkan kamera yang sedang diproses. Antarmuka tidak pernah menerima kredensial penyimpanan.</p></section><section className="rounded-[1.5rem] border border-orange-200 bg-orange-50 p-6"><div className="flex items-center gap-2 text-orange-800"><ShieldAlert className="h-4 w-4" /><p className="text-[11px] font-bold uppercase tracking-[0.16em]">Capture guard</p></div><p className="mt-3 text-sm font-semibold text-orange-950">Tidak ada tombol capture global.</p><p className="mt-1 text-xs leading-5 text-orange-800">Aktivasi selalu dilakukan dari detail CCTV untuk menghindari seluruh kamera berjalan tanpa peninjauan satu per satu.</p></section></aside>
      </div>
    </div>
  );
}
