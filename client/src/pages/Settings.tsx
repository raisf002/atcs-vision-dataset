import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Clock3, FolderKey, Save, ShieldAlert, TimerReset } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const intervals = [1, 5, 10, 15] as const;

export default function Settings() {
  const [interval, setInterval] = useState<(typeof intervals)[number]>(5);
  const [captureEnabled, setCaptureEnabled] = useState(false);

  return (
    <div className="mx-auto w-full max-w-[1260px] space-y-7">
      <PageHeader eyebrow="Pipeline controls" title="Capture settings" description="Atur frekuensi capture dan batas pengoperasian. Konfigurasi ini akan menjadi sumber kebenaran bagi pekerjaan terjadwal saat integrasi backend diaktifkan." actions={<Button onClick={() => toast.success("Draf konfigurasi disimpan untuk integrasi backend berikutnya.")} className="rounded-xl bg-stone-900 text-white hover:bg-stone-800"><Save className="mr-2 h-4 w-4" />Simpan draf</Button>} />

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-6 rounded-[1.5rem] border border-stone-200 bg-white p-5 shadow-[0_18px_45px_-35px_rgba(28,32,30,0.5)] sm:p-7">
          <div><div className="flex items-center gap-2"><TimerReset className="h-4 w-4 text-emerald-700" /><h2 className="text-lg font-semibold tracking-tight text-stone-950">Capture cadence</h2></div><p className="mt-1 text-sm leading-6 text-stone-500">Pilih interval capture untuk semua kamera yang statusnya aktif. Opsi dikunci pada interval yang aman untuk pengumpulan dataset.</p></div>
          <fieldset><legend className="text-xs font-semibold uppercase tracking-[0.13em] text-stone-500">Interval pengambilan</legend><div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">{intervals.map((item) => <button key={item} onClick={() => setInterval(item)} className={`rounded-xl border p-4 text-left transition-all ${interval === item ? "border-emerald-700 bg-emerald-50 shadow-sm" : "border-stone-200 bg-stone-50 hover:border-stone-300"}`}><p className={`text-2xl font-semibold tracking-tight ${interval === item ? "text-emerald-950" : "text-stone-800"}`}>{item}<span className="ml-1 text-sm font-medium">min</span></p><p className="mt-1 text-[11px] font-medium text-stone-500">per siklus</p></button>)}</div></fieldset>
          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4"><div className="flex items-center justify-between gap-4"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-white text-stone-600 shadow-sm"><Clock3 className="h-4 w-4" /></span><div><p className="text-sm font-semibold text-stone-800">Aktifkan capture otomatis</p><p className="mt-0.5 text-xs text-stone-500">Saat ini aman dinonaktifkan sampai sumber dan layanan capture siap.</p></div></div><button aria-pressed={captureEnabled} onClick={() => setCaptureEnabled(!captureEnabled)} className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${captureEnabled ? "bg-lime-400" : "bg-stone-300"}`}><span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${captureEnabled ? "translate-x-6" : "translate-x-1"}`} /></button></div></div>
        </section>

        <aside className="space-y-6"><section className="rounded-[1.5rem] border border-stone-200 bg-[#16332e] p-6 text-white"><div className="flex items-center gap-2 text-lime-200"><FolderKey className="h-4 w-4" /><p className="text-[11px] font-bold uppercase tracking-[0.16em]">S3 key contract</p></div><p className="mt-5 font-mono text-sm leading-7 text-white">camera_id/<br />YYYY-MM-DD/<br /><span className="text-lime-300">timestamp.jpg</span></p><p className="mt-5 text-xs leading-5 text-stone-300">Key dibentuk server-side. Antarmuka tidak pernah menerima kredensial penyimpanan.</p></section><section className="rounded-[1.5rem] border border-orange-200 bg-orange-50 p-6"><div className="flex items-center gap-2 text-orange-800"><ShieldAlert className="h-4 w-4" /><p className="text-[11px] font-bold uppercase tracking-[0.16em]">Safety guard</p></div><p className="mt-3 text-sm font-semibold text-orange-950">Capture belum siap dijalankan.</p><p className="mt-1 text-xs leading-5 text-orange-800">Aktivasi produksi memerlukan sumber terverifikasi untuk setiap kamera aktif dan worker yang mendukung pengambilan frame HLS.</p><div className="mt-4 flex items-center gap-2 text-xs font-medium text-orange-800"><AlertTriangle className="h-3.5 w-3.5" />0 kamera aktif saat ini</div></section></aside>
      </div>
    </div>
  );
}
