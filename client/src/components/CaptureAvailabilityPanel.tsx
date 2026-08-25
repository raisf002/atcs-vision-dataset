import { AlertTriangle, CheckCircle2, CircleDashed } from "lucide-react";

export type AvailabilityRow = {
  cameraId: string;
  successfulCaptures: number;
  hlsTransientFailures: number;
  pipelineFailures: number;
  attempts: number;
  availabilityPercent: number | null;
  coverageStatus: "healthy" | "degraded" | "unknown";
};

export function AvailabilityBadge({ row }: { row?: AvailabilityRow }) {
  if (!row || row.coverageStatus === "unknown") return <span className="inline-flex items-center gap-1 rounded-full border border-stone-200 bg-stone-50 px-2 py-1 text-[10px] font-semibold text-stone-500"><CircleDashed className="h-3 w-3" />Belum ada percobaan 7 hari</span>;
  if (row.coverageStatus === "degraded") return <span className="inline-flex items-center gap-1 rounded-full border border-orange-200 bg-orange-50 px-2 py-1 text-[10px] font-semibold text-orange-800"><AlertTriangle className="h-3 w-3" />Coverage menurun · {row.availabilityPercent}%</span>;
  return <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-800"><CheckCircle2 className="h-3 w-3" />Coverage stabil · {row.availabilityPercent}%</span>;
}

export default function CaptureAvailabilityPanel({ rows, cameraNames, compact = false }: { rows: AvailabilityRow[]; cameraNames: Map<string, string>; compact?: boolean }) {
  const degraded = rows.filter((row) => row.coverageStatus === "degraded");
  const transientTotal = rows.reduce((total, row) => total + row.hlsTransientFailures, 0);
  if (compact) {
    const row = rows[0];
    return <div className="rounded-xl border border-stone-200 bg-stone-50 p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-stone-500">Availability capture · 7 hari</p><p className="mt-2 text-2xl font-semibold text-stone-950">{row?.availabilityPercent ?? "—"}{row?.availabilityPercent !== null && row?.availabilityPercent !== undefined ? "%" : ""}</p><p className="mt-1 text-xs text-stone-500">{row ? `${row.successfulCaptures} berhasil · ${row.hlsTransientFailures} HLS transien · ${row.pipelineFailures} pipeline` : "Memuat metrik…"}</p></div><AvailabilityBadge row={row} /></div></div>;
  }
  return <section className="rounded-[1.5rem] border border-stone-200 bg-white p-5 shadow-[0_18px_45px_-35px_rgba(28,32,30,0.5)] sm:p-6"><div className="flex flex-col gap-2 border-b border-stone-100 pb-5 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-700">Availability HLS</p><h2 className="mt-1 text-xl font-semibold tracking-[-0.025em] text-stone-950">Coverage capture tujuh hari</h2><p className="mt-1 text-sm text-stone-500">Success rate dihitung dari snapshot yang tersimpan dibanding error capture yang tercatat dalam tujuh hari terakhir.</p></div><div className="rounded-xl bg-stone-50 px-3 py-2 text-right"><p className="text-lg font-semibold text-stone-900">{degraded.length}</p><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-500">kamera menurun</p></div></div><div className="mt-5 grid gap-3 sm:grid-cols-3"><div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4"><p className="text-xl font-semibold text-emerald-950">{rows.filter((row) => row.coverageStatus === "healthy").length}</p><p className="mt-1 text-xs font-semibold text-emerald-900">Coverage stabil</p></div><div className="rounded-xl border border-orange-100 bg-orange-50 p-4"><p className="text-xl font-semibold text-orange-950">{transientTotal}</p><p className="mt-1 text-xs font-semibold text-orange-900">HLS_TRANSIENT</p></div><div className="rounded-xl border border-stone-200 bg-stone-50 p-4"><p className="text-xl font-semibold text-stone-900">{rows.filter((row) => row.coverageStatus === "unknown").length}</p><p className="mt-1 text-xs font-semibold text-stone-700">Belum ada percobaan</p></div></div>{degraded.length ? <div className="mt-5 divide-y divide-orange-100 rounded-xl border border-orange-100 bg-orange-50/50 px-4">{degraded.map((row) => <div key={row.cameraId} className="flex items-center justify-between gap-3 py-3"><div><p className="text-sm font-semibold text-stone-800">{cameraNames.get(row.cameraId) ?? row.cameraId}</p><p className="mt-0.5 text-[11px] text-stone-600">{row.successfulCaptures} berhasil · {row.hlsTransientFailures} HLS transien · {row.pipelineFailures} pipeline</p></div><AvailabilityBadge row={row} /></div>)}</div> : <p className="mt-5 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">Belum ada kamera dengan coverage menurun pada periode yang memiliki percobaan capture.</p>}</section>;
}
