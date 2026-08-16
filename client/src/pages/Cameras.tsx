import { useAuth } from "@/_core/hooks/useAuth";
import PageHeader from "@/components/PageHeader";
import StatusPill from "@/components/StatusPill";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cameraDetailPath } from "@/lib/cameraRoutes";
import { getCameraFailureLabel, getCameraSourceExplanation, getCameraSourceStatus } from "@/lib/cameraStatus";
import { trpc } from "@/lib/trpc";
import { captureStatusLabels, captureStatusStyles } from "@shared/captureStatus";
import { Camera, ChevronDown, Link2, Search, SlidersHorizontal } from "lucide-react";
import React, { useMemo, useState } from "react";
import { toast } from "sonner";
import { Link, useLocation } from "wouter";

type ZoneFilter = "Semua" | "city" | "national";

export default function Cameras() {
  const [query, setQuery] = useState("");
  const [zone, setZone] = useState<ZoneFilter>("Semua");
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const cameraQuery = trpc.dataset.cameras.useQuery();
  const updateCamera = trpc.dataset.updateCamera.useMutation({ onSuccess: () => cameraQuery.refetch() });
  const cameras = cameraQuery.data ?? [];
  const configuredSources = cameras.filter((camera) => camera.sourceStatus === "verified").length;
  const isAdmin = user?.role === "admin";

  const filteredCameras = useMemo(() => cameras.filter((camera) => {
    const matchesQuery = camera.name.toLowerCase().includes(query.toLowerCase()) || camera.id.includes(query.toLowerCase());
    const matchesZone = zone === "Semua" || camera.zone === zone;
    return matchesQuery && matchesZone;
  }), [cameras, query, zone]);

  const toggleCamera = (id: string, isActive: boolean) => {
    if (!isAdmin) {
      toast.info("Masuk sebagai admin untuk mengubah status capture kamera.");
      return;
    }
    updateCamera.mutate({ id, isActive: !isActive }, {
      onSuccess: () => toast.success(`Capture kamera ${isActive ? "dinonaktifkan" : "diaktifkan"}.`),
      onError: () => toast.error("Status kamera belum dapat diperbarui."),
    });
  };

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-7">
      <PageHeader
        eyebrow="Registry · 29 cameras"
        title="Camera registry"
        description="Kelola sumber HLS, status aktif, interval, dan identitas penyimpanan dari setiap titik CCTV ATCS Tasikmalaya."
        actions={<Button onClick={() => toast.info("Jumlah registry dikunci tepat 29 kamera ATCS.")} className="rounded-xl bg-stone-900 text-white hover:bg-stone-800"><Camera className="mr-2 h-4 w-4" />29 kamera tetap</Button>}
      />

      <section className="grid gap-4 rounded-[1.35rem] border border-amber-200 bg-amber-50/70 p-5 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <p className="text-sm font-semibold text-amber-950">Konfigurasi sumber per CCTV</p>
          <p className="mt-1 text-sm leading-6 text-amber-800">{configuredSources} URL HLS telah dipetakan dari konfigurasi live streaming publik. Klik satu baris CCTV untuk menguji live view serta menetapkan interval dan capture state individual.</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-white/70 px-4 py-3 text-right"><p className="text-2xl font-semibold tracking-tight text-amber-950">{configuredSources} / 29</p><p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-700">sumber terkonfigurasi</p></div>
      </section>

      <section className="rounded-[1.35rem] border border-stone-200 bg-white shadow-[0_18px_45px_-35px_rgba(28,32,30,0.5)]">
        <div className="flex flex-col gap-3 border-b border-stone-100 p-4 lg:flex-row lg:items-center lg:justify-between lg:p-5">
          <div className="relative w-full max-w-md"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari nama atau ID kamera" className="h-10 rounded-xl border-stone-200 bg-stone-50 pl-9" /></div>
          <div className="flex flex-wrap gap-2">
            {([{ label: "Semua", value: "Semua" }, { label: "Jalan Kota", value: "city" }, { label: "Jalan Nasional", value: "national" }] as const).map((item) => <button key={item.value} onClick={() => setZone(item.value)} className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${zone === item.value ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-600 hover:bg-stone-200"}`}>{item.label}</button>)}
            <Button variant="outline" onClick={() => toast.info("Konfigurasi batch sengaja tidak tersedia agar setiap CCTV ditinjau individual.")} className="h-9 rounded-lg border-stone-200 bg-white text-stone-600"><SlidersHorizontal className="mr-2 h-3.5 w-3.5" />Per-CCTV</Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[930px] text-left">
            <thead className="bg-stone-50/70 text-[10px] font-bold uppercase tracking-[0.14em] text-stone-500"><tr><th className="px-5 py-3">Kamera</th><th className="px-4 py-3">Zona</th><th className="px-4 py-3">Sumber</th><th className="px-4 py-3">Capture terakhir</th><th className="px-5 py-3 text-right">Aksi</th></tr></thead>
            <tbody className="divide-y divide-stone-100">
              {cameraQuery.isLoading ? <tr><td colSpan={5} className="px-5 py-12 text-center text-sm text-stone-500">Memuat registry produksi…</td></tr> : filteredCameras.map((camera) => (
                <tr
                  key={camera.id}
                  role="link"
                  tabIndex={0}
                  aria-label={`Buka detail dan pengaturan ${camera.name}`}
                  onClick={() => navigate(cameraDetailPath(camera.id))}
                  onKeyDown={(event) => {
                    if (event.target !== event.currentTarget) return;
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      navigate(cameraDetailPath(camera.id));
                    }
                  }}
                  className="group cursor-pointer transition-colors hover:bg-stone-50/70 focus-visible:bg-lime-50 focus-visible:outline-none"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span className="grid h-8 w-8 place-items-center rounded-lg bg-stone-100 text-xs font-bold text-stone-600">{String(camera.sortOrder).padStart(2, "0")}</span>
                      <div><p className="text-sm font-semibold text-stone-900 group-hover:text-emerald-800">{camera.name}</p><p className="mt-0.5 font-mono text-[10px] text-stone-400">{camera.id}</p></div>
                    </div>
                  </td>
                  <td className="px-4 py-4"><span className="text-xs font-medium text-stone-600">{camera.zone === "city" ? "Jalan Kota" : "Jalan Nasional"}</span></td>
                  <td className="px-4 py-4"><div className="flex min-w-[270px] flex-col items-start gap-1"><div className="flex items-center gap-2"><StatusPill status={getCameraSourceStatus(camera.sourceStatus, camera.lastCaptureStatus)} /><span className="max-w-[210px] truncate font-mono text-[10px] text-stone-400">{camera.sourceUrl ?? "URL belum diatur"}</span></div>{getCameraFailureLabel(camera.lastCaptureStatus, camera.lastError) ? <span className={`text-[10px] font-semibold ${getCameraFailureLabel(camera.lastCaptureStatus, camera.lastError) === "Sumber HLS gagal" ? "text-orange-700" : "text-red-700"}`}>{getCameraFailureLabel(camera.lastCaptureStatus, camera.lastError)}</span> : null}{getCameraSourceExplanation(camera.sourceStatus, camera.lastCaptureStatus, camera.lastError) ? <span className="text-[10px] leading-4 text-stone-500">{getCameraSourceExplanation(camera.sourceStatus, camera.lastCaptureStatus, camera.lastError)}</span> : null}</div></td>
                  <td className="px-4 py-4"><div className="flex items-center gap-2"><span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${captureStatusStyles[camera.lastCaptureStatus]}`}>{captureStatusLabels[camera.lastCaptureStatus]}</span><span className="text-[10px] text-stone-400">{camera.lastCaptureAt ? new Date(camera.lastCaptureAt).toLocaleString("id-ID") : camera.captureIntervalMinutes ? `${camera.captureIntervalMinutes} min` : "belum berjalan"}</span></div></td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={cameraDetailPath(camera.id)} onClick={(event) => event.stopPropagation()} aria-label={`Buka ${camera.name}`} className="grid h-8 w-8 place-items-center rounded-lg text-stone-500 transition-colors hover:bg-stone-100"><Link2 className="h-3.5 w-3.5" /></Link>
                      <button aria-label={`${camera.isActive ? "Nonaktifkan" : "Aktifkan"} capture ${camera.name}`} aria-pressed={camera.isActive} onClick={(event) => { event.stopPropagation(); toggleCamera(camera.id, camera.isActive); }} onKeyDown={(event) => event.stopPropagation()} disabled={updateCamera.isPending} className={`relative h-6 w-11 rounded-full transition-colors disabled:cursor-not-allowed ${camera.isActive ? "bg-lime-400" : "bg-stone-200"}`}><span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${camera.isActive ? "translate-x-6" : "translate-x-1"}`} /></button>
                      <Link href={cameraDetailPath(camera.id)} onClick={(event) => event.stopPropagation()} aria-label={`Detail dan pengaturan ${camera.name}`} className="grid h-8 w-8 place-items-center rounded-lg text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700"><ChevronDown className="h-3.5 w-3.5 rotate-[-90deg]" /></Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!cameraQuery.isLoading && filteredCameras.length === 0 ? <div className="p-12 text-center text-sm text-stone-500">Tidak ada kamera yang sesuai dengan pencarian.</div> : null}
      </section>
    </div>
  );
}
