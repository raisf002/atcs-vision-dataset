import PageHeader from "@/components/PageHeader";
import StatusPill from "@/components/StatusPill";
import { cameraRegistry, type CameraZone } from "@/data/cameras";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Camera, ChevronDown, Link2, Search, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export default function Cameras() {
  const [query, setQuery] = useState("");
  const [zone, setZone] = useState<CameraZone | "Semua">("Semua");
  const [activeCameraIds, setActiveCameraIds] = useState<Set<string>>(new Set());

  const filteredCameras = useMemo(() => cameraRegistry.filter((camera) => {
    const matchesQuery = camera.name.toLowerCase().includes(query.toLowerCase()) || camera.id.includes(query.toLowerCase());
    const matchesZone = zone === "Semua" || camera.zone === zone;
    return matchesQuery && matchesZone;
  }), [query, zone]);

  const toggleCamera = (id: string) => {
    setActiveCameraIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-7">
      <PageHeader
        eyebrow="Registry · 29 cameras"
        title="Camera registry"
        description="Kelola sumber HLS atau snapshot, status aktif, dan identitas penyimpanan dari setiap titik CCTV ATCS Tasikmalaya."
        actions={<Button onClick={() => toast.info("Form tambah kamera dinonaktifkan untuk menjaga jumlah registri tetap 29.")} className="rounded-xl bg-stone-900 text-white hover:bg-stone-800"><Camera className="mr-2 h-4 w-4" />29 kamera tetap</Button>}
      />

      <section className="grid gap-4 rounded-[1.35rem] border border-amber-200 bg-amber-50/70 p-5 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <p className="text-sm font-semibold text-amber-950">Mode konfigurasi awal</p>
          <p className="mt-1 text-sm leading-6 text-amber-800">Satu sumber HLS telah terverifikasi dari situs publik. Selesaikan URL sumber pada 28 entri lain sebelum mengaktifkan capture produksi.</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-white/70 px-4 py-3 text-right">
          <p className="text-2xl font-semibold tracking-tight text-amber-950">1 / 29</p>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-700">sumber diverifikasi</p>
        </div>
      </section>

      <section className="rounded-[1.35rem] border border-stone-200 bg-white shadow-[0_18px_45px_-35px_rgba(28,32,30,0.5)]">
        <div className="flex flex-col gap-3 border-b border-stone-100 p-4 lg:flex-row lg:items-center lg:justify-between lg:p-5">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari nama atau ID kamera" className="h-10 rounded-xl border-stone-200 bg-stone-50 pl-9" />
          </div>
          <div className="flex flex-wrap gap-2">
            {(["Semua", "Jalan Kota", "Jalan Nasional"] as const).map((item) => (
              <button key={item} onClick={() => setZone(item)} className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${zone === item ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-600 hover:bg-stone-200"}`}>{item}</button>
            ))}
            <Button variant="outline" onClick={() => toast.info("Pengaturan batch akan tersedia saat database disambungkan.")} className="h-9 rounded-lg border-stone-200 bg-white text-stone-600"><SlidersHorizontal className="mr-2 h-3.5 w-3.5" />Aksi batch</Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[930px] text-left">
            <thead className="bg-stone-50/70 text-[10px] font-bold uppercase tracking-[0.14em] text-stone-500">
              <tr><th className="px-5 py-3">Kamera</th><th className="px-4 py-3">Zona</th><th className="px-4 py-3">Sumber</th><th className="px-4 py-3">Capture</th><th className="px-5 py-3 text-right">Aksi</th></tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredCameras.map((camera, index) => {
                const enabled = activeCameraIds.has(camera.id);
                return (
                  <tr key={camera.id} className="group transition-colors hover:bg-stone-50/70">
                    <td className="px-5 py-4"><div className="flex items-center gap-3"><span className="grid h-8 w-8 place-items-center rounded-lg bg-stone-100 text-xs font-bold text-stone-600">{String(index + 1).padStart(2, "0")}</span><div><p className="text-sm font-semibold text-stone-900">{camera.name}</p><p className="mt-0.5 font-mono text-[10px] text-stone-400">{camera.id}</p></div></div></td>
                    <td className="px-4 py-4"><span className="text-xs font-medium text-stone-600">{camera.zone}</span></td>
                    <td className="px-4 py-4"><div className="flex items-center gap-2"><StatusPill status={camera.sourceStatus} /><span className="max-w-[210px] truncate font-mono text-[10px] text-stone-400">{camera.sourceUrl ?? "URL belum diatur"}</span></div></td>
                    <td className="px-4 py-4"><StatusPill status={enabled ? "active" : "paused"} /></td>
                    <td className="px-5 py-4"><div className="flex items-center justify-end gap-2"><Button variant="ghost" size="icon" aria-label={`Atur ${camera.name}`} onClick={() => toast.info(`Editor sumber untuk ${camera.name} akan disambungkan ke database.`)} className="h-8 w-8 rounded-lg text-stone-500 hover:bg-stone-100"><Link2 className="h-3.5 w-3.5" /></Button><button aria-pressed={enabled} onClick={() => toggleCamera(camera.id)} className={`relative h-6 w-11 rounded-full transition-colors ${enabled ? "bg-lime-400" : "bg-stone-200"}`}><span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${enabled ? "translate-x-6" : "translate-x-1"}`} /></button><ChevronDown className="h-3.5 w-3.5 text-stone-300" /></div></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filteredCameras.length === 0 ? <div className="p-12 text-center text-sm text-stone-500">Tidak ada kamera yang sesuai dengan pencarian.</div> : null}
      </section>
    </div>
  );
}
