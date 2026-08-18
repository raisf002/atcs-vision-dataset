import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { DEFAULT_CLASS_FILTER, createDefaultCountingConfig, type NormalizedPoint, type VirtualCountingLine } from "@shared/counting";
import { Check, Loader2, MousePointer2, Save, Trash2, Upload, Waypoints } from "lucide-react";
import { createPortal } from "react-dom";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type CameraSelection = { id: string; name: string } | undefined;
type ModelFramework = "yolo" | "onnx" | "tensorrt" | "other";
type ModelScope = "global" | "camera";

const CLASS_OPTIONS = ["car", "truck", "bus", "motorcycle"];

function createLine(start: NormalizedPoint, end: NormalizedPoint): VirtualCountingLine {
  return {
    id: `line_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name: "Garis hitung baru",
    start,
    end,
    direction: "both",
    enabled: true,
  };
}

function pointFromElement(event: React.MouseEvent<SVGSVGElement | SVGRectElement> | React.PointerEvent<SVGSVGElement | SVGCircleElement>): NormalizedPoint {
  const current = event.currentTarget;
  const tagName = current.tagName.toLowerCase();
  const rect = tagName === "svg" || tagName === "rect" ? current.getBoundingClientRect() : (current.ownerSVGElement?.getBoundingClientRect() ?? current.getBoundingClientRect());
  return {
    x: Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)),
    y: Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height)),
  };
}

function directionLabel(direction: VirtualCountingLine["direction"]) {
  return direction === "a_to_b" ? "A → B" : direction === "b_to_a" ? "B → A" : "Dua arah";
}

export default function CountingWorkspace({ camera, overlayTargetId, overlayElement, isConsoleActive, onOpenConsole }: { camera: CameraSelection; overlayTargetId: string; overlayElement?: HTMLElement | null; isConsoleActive: boolean; onOpenConsole: () => void }) {
  const utils = trpc.useUtils();
  const { user } = useAuth();
  const isGuest = !user;
  const cameraId = camera?.id ?? "";
  const configQuery = trpc.dataset.countingConfig.useQuery({ cameraId }, { enabled: Boolean(cameraId) });
  const modelsQuery = trpc.dataset.visionModels.useQuery(cameraId ? { cameraId } : undefined);
  const [config, setConfig] = useState(() => createDefaultCountingConfig(cameraId));
  const [pendingPoint, setPendingPoint] = useState<NormalizedPoint | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [modelName, setModelName] = useState("");
  const [modelFramework, setModelFramework] = useState<ModelFramework>("yolo");
  const [modelScope, setModelScope] = useState<ModelScope>("global");
  const [labels, setLabels] = useState("car, truck, bus, motorcycle");
  const [uploading, setUploading] = useState(false);
  const [isEditingOverlay, setIsEditingOverlay] = useState(false);
  const [overlayTarget, setOverlayTarget] = useState<HTMLElement | null>(null);
  const [selectedLineId, setSelectedLineId] = useState<string | null>(null);
  const [draggingEndpoint, setDraggingEndpoint] = useState<{ lineId: string; endpoint: "start" | "end" } | null>(null);

  useEffect(() => {
    if (configQuery.data) setConfig(configQuery.data);
    setPendingPoint(null);
    setIsEditingOverlay(false);
    setSelectedLineId(null);
    setDraggingEndpoint(null);
  }, [cameraId, configQuery.data]);

  useEffect(() => {
    if (!isConsoleActive) {
      setOverlayTarget(null);
      return;
    }
    if (overlayElement) {
      setOverlayTarget(overlayElement);
      return;
    }
    const fallbackTarget = document.getElementById(overlayTargetId);
    if (fallbackTarget) {
      setOverlayTarget(fallbackTarget);
      return;
    }
    const frame = requestAnimationFrame(() => setOverlayTarget(document.getElementById(overlayTargetId)));
    return () => cancelAnimationFrame(frame);
  }, [isConsoleActive, overlayElement, overlayTargetId]);

  const saveConfig = trpc.dataset.saveCountingConfig.useMutation({
    onSuccess: async (saved) => {
      setConfig(saved);
      await utils.dataset.countingConfig.invalidate({ cameraId });
      toast.success(`Konfigurasi counting ${camera?.name ?? "kamera"} disimpan.`);
    },
    onError: (error) => toast.error(error.message),
  });

  const selectedModel = useMemo(() => (modelsQuery.data ?? []).find((model) => model.id === config.modelId), [config.modelId, modelsQuery.data]);

  const updateLine = (id: string, patch: Partial<VirtualCountingLine>) => {
    if (isGuest) return;
    setConfig((current) => ({
    ...current,
    virtualLines: current.virtualLines.map((line) => line.id === id ? { ...line, ...patch } : line),
    }));
  };

  const handleCanvasClick = (event: React.MouseEvent<SVGSVGElement | SVGRectElement>) => {
    if (isGuest) return;
    const point = pointFromElement(event);
    if (!pendingPoint) {
      setPendingPoint(point);
      return;
    }
    const line = createLine(pendingPoint, point);
    setConfig((current) => ({ ...current, virtualLines: [...current.virtualLines, line] }));
    setSelectedLineId(line.id);
    setPendingPoint(null);
  };

  const startEndpointDrag = (event: React.PointerEvent<SVGCircleElement>, lineId: string, endpoint: "start" | "end") => {
    if (isGuest) return;
    event.stopPropagation();
    if (typeof event.currentTarget.setPointerCapture === "function") event.currentTarget.setPointerCapture(event.pointerId);
    setSelectedLineId(lineId);
    setPendingPoint(null);
    setDraggingEndpoint({ lineId, endpoint });
  };

  const moveEndpoint = (event: React.PointerEvent<SVGSVGElement>) => {
    if (!draggingEndpoint) return;
    updateLine(draggingEndpoint.lineId, { [draggingEndpoint.endpoint]: pointFromElement(event) });
  };

  const finishEndpointDrag = () => setDraggingEndpoint(null);

  const save = () => {
    if (isGuest) return toast.info("Mode Guest hanya dapat melihat konfigurasi counting. Masuk sebagai admin untuk menyimpan perubahan.");
    if (!cameraId) return;
    saveConfig.mutate({ ...config, cameraId });
  };

  const uploadModel = async () => {
    if (isGuest) return toast.info("Mode Guest tidak dapat mengunggah model. Masuk sebagai admin untuk melanjutkan.");
    if (!file) return toast.error("Pilih berkas model .pt, .onnx, .engine, atau .tflite terlebih dahulu.");
    if (!modelName.trim()) return toast.error("Masukkan nama model terlebih dahulu.");
    if (file.size > 50 * 1024 * 1024) return toast.error("Ukuran unggah dari Command Center dibatasi 50 MB. Gunakan handoff VPS untuk bobot yang lebih besar.");
    setUploading(true);
    try {
      const response = await fetch("/api/models/upload", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/octet-stream",
          "x-model-file-name": file.name,
          "x-model-name": modelName.trim(),
          "x-model-framework": modelFramework,
          "x-model-labels": JSON.stringify(labels.split(",").map((label) => label.trim()).filter(Boolean)),
          "x-model-scope": modelScope,
          ...(modelScope === "camera" ? { "x-model-camera-id": cameraId } : {}),
        },
        body: await file.arrayBuffer(),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error ?? "Unggah model gagal");
      await utils.dataset.visionModels.invalidate({ cameraId });
      setConfig((current) => ({ ...current, modelId: payload.model.id }));
      setFile(null);
      setModelName("");
      toast.success(modelScope === "camera" ? `Model khusus ${camera?.name ?? "kamera"} disimpan sebagai draf.` : "Model global disimpan sebagai draf di registry.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unggah model gagal");
    } finally {
      setUploading(false);
    }
  };

  if (!camera) return null;

  const lineOverlay = !isGuest && isConsoleActive && overlayTarget ? createPortal(
    <div className={`absolute inset-0 ${isEditingOverlay ? "pointer-events-auto" : "pointer-events-none"}`}>
      <svg viewBox="0 0 1000 562" role="button" tabIndex={isEditingOverlay ? 0 : -1} aria-label="Overlay editor garis virtual pada live video" onPointerMove={moveEndpoint} onPointerUp={finishEndpointDrag} onPointerCancel={finishEndpointDrag} className={`h-full w-full ${isEditingOverlay && !draggingEndpoint ? "cursor-crosshair" : ""}`}>
        {isEditingOverlay ? <rect width="1000" height="562" fill="transparent" aria-label="Bidang tambah garis pada live video" onClick={handleCanvasClick} /> : null}
        {config.virtualLines.map((line, index) => { const isSelected = line.id === selectedLineId; const tone = index % 2 ? "#fb923c" : "#bef264"; return <g key={line.id} opacity={line.enabled ? 1 : 0.38} role="button" aria-label={`Pilih garis ${line.name}`} aria-pressed={isSelected} onClick={(event) => { event.stopPropagation(); setSelectedLineId(line.id); }} className={isEditingOverlay ? "cursor-pointer" : ""}><line x1={line.start.x * 1000} y1={line.start.y * 562} x2={line.end.x * 1000} y2={line.end.y * 562} stroke={isSelected ? "#ffffff" : tone} strokeWidth={isSelected ? "4" : "2"} /><line x1={line.start.x * 1000} y1={line.start.y * 562} x2={line.end.x * 1000} y2={line.end.y * 562} stroke={tone} strokeWidth={isSelected ? "1.5" : "2"} /><text x={(line.start.x + line.end.x) * 500} y={(line.start.y + line.end.y) * 281 - 8} textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="700" paintOrder="stroke" stroke="#071012" strokeWidth="2.5">{line.name}</text>{isSelected && isEditingOverlay ? <><circle cx={line.start.x * 1000} cy={line.start.y * 562} r="11" fill="#071012" fillOpacity="0.72" stroke={tone} strokeWidth="1.5" pointerEvents="none" /><circle cx={line.end.x * 1000} cy={line.end.y * 562} r="11" fill="#071012" fillOpacity="0.72" stroke={tone} strokeWidth="1.5" pointerEvents="none" /><circle cx={line.start.x * 1000} cy={line.start.y * 562} r="5" fill={tone} stroke="#ffffff" strokeWidth="1.5" aria-label={`Pindahkan titik awal ${line.name}`} onPointerDown={(event) => startEndpointDrag(event, line.id, "start")} className="cursor-grab active:cursor-grabbing" /><circle cx={line.end.x * 1000} cy={line.end.y * 562} r="5" fill={tone} stroke="#ffffff" strokeWidth="1.5" aria-label={`Pindahkan titik akhir ${line.name}`} onPointerDown={(event) => startEndpointDrag(event, line.id, "end")} className="cursor-grab active:cursor-grabbing" /></> : null}</g>; })}
        {isEditingOverlay ? <><rect x="24" y="24" width="300" height="42" rx="12" fill="#071012" fillOpacity="0.82" pointerEvents="none" /><text x="42" y="50" fill="#bef264" fontSize="16" fontWeight="700" pointerEvents="none">{draggingEndpoint ? "Seret titik ujung garis" : pendingPoint ? "Pilih titik kedua" : selectedLineId ? "Seret titik ujung untuk edit" : "Klik titik pertama garis"}</text>{pendingPoint ? <circle cx={pendingPoint.x * 1000} cy={pendingPoint.y * 562} r="9" fill="#bef264" pointerEvents="none" /> : null}</> : null}
      </svg>
    </div>,
    overlayTarget,
  ) : null;

  if (configQuery.isLoading || modelsQuery.isLoading) {
    return <section className="rounded-xl border border-white/10 bg-[#101719] p-4" aria-live="polite"><div className="flex items-center gap-2 text-xs font-semibold text-stone-300"><Loader2 className="h-4 w-4 animate-spin text-lime-300" />Memuat konfigurasi counting dan registry model untuk {camera.name}…</div></section>;
  }

  if (configQuery.error || modelsQuery.error) {
    return <section className="rounded-xl border border-orange-300/25 bg-orange-300/5 p-4" role="alert"><p className="text-xs font-semibold text-orange-200">Konfigurasi counting belum dapat dimuat.</p><p className="mt-1 text-[10px] text-stone-400">Periksa koneksi atau coba muat ulang data sebelum mengubah garis virtual dan model.</p><Button type="button" variant="outline" onClick={() => { configQuery.refetch(); modelsQuery.refetch(); }} className="mt-3 border-orange-300/30 text-orange-100 hover:bg-orange-300/10">Coba muat ulang</Button></section>;
  }

  if (isGuest) {
    return <div className="space-y-3"><section className="rounded-xl border border-sky-300/25 bg-sky-300/5 p-4"><div className="flex items-center justify-between gap-3"><div><h2 className="flex items-center gap-2 text-xs font-bold text-white"><Waypoints className="h-3.5 w-3.5 text-sky-200" />Counting per kamera</h2><p className="mt-1 text-[10px] text-stone-400">{camera.name} · konfigurasi hanya-baca</p></div><span className="rounded bg-sky-300/10 px-2 py-1 text-[9px] font-bold text-sky-100">GUEST</span></div><p className="mt-3 text-[10px] leading-5 text-stone-300">Garis, pilihan model, dan kelas ditampilkan sebagai referensi. Mode Guest tidak dapat menggambar, menggeser, menyimpan, atau mengunggah model.</p><div className="mt-3 space-y-2">{config.virtualLines.length ? config.virtualLines.map((line) => <div key={line.id} className="rounded-lg border border-white/10 bg-black/15 p-2.5"><p className="text-[11px] font-semibold text-white">{line.name}</p><p className="mt-1 text-[10px] text-stone-500">{directionLabel(line.direction)} · {line.enabled ? "Aktif" : "Jeda"}</p></div>) : <p className="rounded-lg border border-dashed border-white/10 p-3 text-[10px] text-stone-500">Belum ada garis virtual tersimpan untuk kamera ini.</p>}</div></section><section className="rounded-xl border border-white/10 bg-[#101719] p-4"><h2 className="text-xs font-bold text-white">Model & target klasifikasi</h2><p className="mt-2 text-[10px] text-stone-400">{selectedModel ? `${selectedModel.scope === "camera" ? "Model khusus kamera" : "Model global"} · ${selectedModel.name} · ${selectedModel.framework.toUpperCase()}` : "Belum ada model yang dipilih untuk kamera ini."}</p><p className="mt-2 text-[10px] text-stone-500">Kelas: {config.classFilter.join(", ")} · Confidence {config.confidenceThreshold}%</p></section></div>;
  }

  return <>
    {lineOverlay}
    <div className="space-y-3">
      <section className="rounded-xl border border-white/10 bg-[#101719] p-4">
        <div className="flex items-center justify-between gap-2"><div><h2 className="flex items-center gap-2 text-xs font-bold text-white"><Waypoints className="h-3.5 w-3.5 text-lime-300" />Counting per kamera</h2><p className="mt-1 text-[10px] text-stone-500">{camera.name} · garis disimpan khusus untuk CCTV ini</p></div><span className="rounded bg-lime-300/10 px-2 py-1 text-[9px] font-bold text-lime-200">TERSIMPAN</span></div>
        <div className="mt-3 rounded-lg border border-white/10 bg-black/15 p-3"><p className="text-[10px] text-stone-400">Garis ditampilkan pada frame live CCTV. Saat mode edit aktif, pilih garis lalu seret titik ujungnya untuk memindahkan atau mengubah bentuk; nama, arah, status, dan penghapusan tetap tersedia di panel ini.</p>{isConsoleActive ? <Button type="button" variant={isEditingOverlay ? "default" : "outline"} onClick={() => { if (!overlayTarget) return toast.info("Area live video masih disiapkan. Tunggu sebentar lalu coba lagi."); setIsEditingOverlay((value) => !value); setPendingPoint(null); setDraggingEndpoint(null); }} className={`mt-3 w-full ${isEditingOverlay ? "bg-lime-300 text-slate-950 hover:bg-lime-200" : "border-white/10 text-stone-100 hover:bg-white/10"}`}><MousePointer2 className="mr-2 h-3.5 w-3.5" />{isEditingOverlay ? "Selesai mengedit garis di video" : "Edit garis langsung di live video"}</Button> : <Button type="button" variant="outline" onClick={onOpenConsole} className="mt-3 w-full border-white/10 text-stone-100 hover:bg-white/10">Buka konsol kamera untuk edit di live video</Button>}</div>
        <div className="mt-3 space-y-2">
          {config.virtualLines.length === 0 ? <p className="rounded-lg border border-dashed border-white/10 p-3 text-[10px] text-stone-500">Belum ada garis virtual. Garis ini nantinya digunakan worker inferensi sebagai batas counting kendaraan.</p> : config.virtualLines.map((line, index) => <div key={line.id} role="button" tabIndex={0} aria-pressed={line.id === selectedLineId} onClick={() => setSelectedLineId(line.id)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") setSelectedLineId(line.id); }} className={`rounded-lg border p-2.5 transition-colors ${line.id === selectedLineId ? "border-lime-300/60 bg-lime-300/10" : "border-white/10 bg-black/15"}`}><div className="flex items-center gap-2"><input value={line.name} onClick={(event) => event.stopPropagation()} onChange={(event) => updateLine(line.id, { name: event.target.value.slice(0, 80) })} aria-label={`Nama garis ${index + 1}`} className="min-w-0 flex-1 bg-transparent text-[11px] font-semibold text-white outline-none" /><button type="button" onClick={(event) => { event.stopPropagation(); setSelectedLineId((current) => current === line.id ? null : current); setConfig((current) => ({ ...current, virtualLines: current.virtualLines.filter((item) => item.id !== line.id) })); }} aria-label={`Hapus ${line.name}`} className="text-stone-500 hover:text-red-300"><Trash2 className="h-3.5 w-3.5" /></button></div><div className="mt-2 flex items-center gap-2"><select value={line.direction} onClick={(event) => event.stopPropagation()} onChange={(event) => updateLine(line.id, { direction: event.target.value as VirtualCountingLine["direction"] })} aria-label={`Arah ${line.name}`} className="min-w-0 flex-1 rounded border border-white/10 bg-[#101719] px-2 py-1.5 text-[10px] text-stone-200"><option value="both">{directionLabel("both")}</option><option value="a_to_b">{directionLabel("a_to_b")}</option><option value="b_to_a">{directionLabel("b_to_a")}</option></select><button type="button" onClick={(event) => { event.stopPropagation(); updateLine(line.id, { enabled: !line.enabled }); }} className={`rounded px-2 py-1.5 text-[10px] font-semibold ${line.enabled ? "bg-lime-300/10 text-lime-200" : "bg-white/5 text-stone-500"}`}>{line.enabled ? "Aktif" : "Jeda"}</button></div><p className={`mt-2 text-[9px] font-semibold ${line.id === selectedLineId ? "text-lime-200" : "text-stone-600"}`}>{line.id === selectedLineId ? isEditingOverlay ? "Tarik titik ujung pada video untuk memindahkan garis" : "Dipilih di overlay live" : "Klik untuk pilih pada panel atau overlay"}</p></div>)}
        </div>
      </section>

      <section className="rounded-xl border border-white/10 bg-[#101719] p-4">
        <div className="flex items-center justify-between"><h2 className="text-xs font-bold text-white">Model & target klasifikasi</h2><span className="text-[9px] font-bold text-amber-200">INFERENSI STANDBY</span></div>
        <label className="mt-3 block text-[10px] font-semibold text-stone-400">Model untuk {camera.name}</label>
        <select value={config.modelId ?? ""} onChange={(event) => setConfig((current) => ({ ...current, modelId: event.target.value || null }))} aria-label="Pilih model visi" className="mt-1.5 w-full rounded-lg border border-white/10 bg-black/15 px-3 py-2 text-[11px] text-stone-200 outline-none"><option value="">Belum memilih model</option>{(modelsQuery.data ?? []).filter((model) => model.status !== "archived").map((model) => <option key={model.id} value={model.id}>{model.scope === "camera" ? "KHUSUS KAMERA" : "GLOBAL"} · {model.name} · {model.framework.toUpperCase()} · {model.status}</option>)}</select>
        <p className="mt-1.5 text-[10px] text-stone-500">{selectedModel ? `${selectedModel.scope === "camera" ? "Khusus kamera ini" : "Model global"} · ${selectedModel.fileName} · ${(selectedModel.sizeBytes / 1024 / 1024).toFixed(1)} MB · ${selectedModel.status}` : (modelsQuery.data ?? []).length === 0 ? "Belum ada model global atau khusus kamera ini. Unggah model sebagai draf untuk mengaitkannya ke kamera ini." : "Pilih atau unggah model sebelum worker inferensi diaktifkan."}</p>
        <div className="mt-3 flex items-center justify-between"><label className="text-[10px] font-semibold text-stone-400">Ambang confidence</label><span className="font-mono text-xs text-lime-300">{config.confidenceThreshold}%</span></div><input aria-label="Ambang confidence counting" type="range" min="10" max="90" value={config.confidenceThreshold} onChange={(event) => setConfig((current) => ({ ...current, confidenceThreshold: Number(event.target.value) }))} className="mt-1 w-full accent-lime-300" />
        <div className="mt-3 grid grid-cols-2 gap-2">{CLASS_OPTIONS.map((className) => { const active = config.classFilter.includes(className); return <button key={className} type="button" onClick={() => setConfig((current) => ({ ...current, classFilter: active ? current.classFilter.filter((item) => item !== className) : [...current.classFilter, className] }))} className={`rounded-lg border px-2 py-2 text-[10px] font-semibold ${active ? "border-lime-300/30 bg-lime-300/10 text-lime-200" : "border-white/10 text-stone-500"}`}><Check className="mr-1 inline h-3 w-3" />{className}</button>; })}</div>
        <label className="mt-3 flex items-center gap-2 text-[10px] text-stone-400"><input type="checkbox" checked={config.isEnabled} onChange={(event) => setConfig((current) => ({ ...current, isEnabled: event.target.checked }))} className="accent-lime-300" />Konfigurasi counting siap digunakan worker</label>
        <Button type="button" onClick={save} disabled={saveConfig.isPending || config.classFilter.length === 0} className="mt-3 w-full bg-lime-300 text-slate-950 hover:bg-lime-200"><Save className="mr-2 h-3.5 w-3.5" />{saveConfig.isPending ? "Menyimpan…" : "Simpan konfigurasi kamera"}</Button>
      </section>

      <section className="rounded-xl border border-white/10 bg-[#101719] p-4">
        <h2 className="text-xs font-bold text-white">Registri model visi</h2><p className="mt-1 text-[10px] text-stone-500">Bobot model disimpan ke S3 sebagai draf. Pilih apakah model berlaku untuk semua CCTV atau hanya {camera.name}; unggahan tidak menjalankan inferensi.</p>
        <label className="mt-3 block text-[10px] font-semibold text-stone-400">Nama model</label><input value={modelName} onChange={(event) => setModelName(event.target.value)} placeholder="contoh: YOLOv8 kendaraan v1" className="mt-1.5 w-full rounded-lg border border-white/10 bg-black/15 px-3 py-2 text-[11px] text-white outline-none placeholder:text-stone-600" />
        <div className="mt-2 grid grid-cols-2 gap-2" role="group" aria-label="Cakupan model yang diunggah"><button type="button" aria-pressed={modelScope === "global"} onClick={() => setModelScope("global")} className={`rounded-lg border px-2 py-2 text-left text-[10px] font-semibold ${modelScope === "global" ? "border-lime-300/50 bg-lime-300/10 text-lime-100" : "border-white/10 text-stone-500 hover:bg-white/5"}`}><span className="block">Global</span><span className="mt-0.5 block font-normal text-[9px] opacity-75">Tersedia untuk semua CCTV</span></button><button type="button" aria-pressed={modelScope === "camera"} onClick={() => setModelScope("camera")} className={`rounded-lg border px-2 py-2 text-left text-[10px] font-semibold ${modelScope === "camera" ? "border-orange-300/50 bg-orange-300/10 text-orange-100" : "border-white/10 text-stone-500 hover:bg-white/5"}`}><span className="block">Khusus kamera</span><span className="mt-0.5 block truncate font-normal text-[9px] opacity-75">{camera.name}</span></button></div>
        <div className="mt-2 grid grid-cols-2 gap-2"><select value={modelFramework} onChange={(event) => setModelFramework(event.target.value as ModelFramework)} aria-label="Framework model" className="rounded-lg border border-white/10 bg-black/15 px-2 py-2 text-[10px] text-stone-200"><option value="yolo">YOLO</option><option value="onnx">ONNX</option><option value="tensorrt">TensorRT</option><option value="other">Lainnya</option></select><input type="file" accept=".pt,.onnx,.engine,.tflite" onChange={(event) => setFile(event.target.files?.[0] ?? null)} aria-label="Berkas model" className="w-full text-[10px] text-stone-400 file:mr-2 file:rounded file:border-0 file:bg-white/10 file:px-2 file:py-1 file:text-[10px] file:text-white" /></div>
        <input value={labels} onChange={(event) => setLabels(event.target.value)} aria-label="Label kelas model" placeholder="car, truck, bus, motorcycle" className="mt-2 w-full rounded-lg border border-white/10 bg-black/15 px-3 py-2 text-[10px] text-white outline-none placeholder:text-stone-600" />
        <Button type="button" variant="outline" onClick={uploadModel} disabled={uploading} className="mt-3 w-full border-white/10 text-stone-100 hover:bg-white/10"><Upload className="mr-2 h-3.5 w-3.5" />{uploading ? "Mengunggah…" : modelScope === "camera" ? "Unggah model khusus kamera" : "Unggah model global"}</Button>
      </section>
    </div>
  </>;
}
