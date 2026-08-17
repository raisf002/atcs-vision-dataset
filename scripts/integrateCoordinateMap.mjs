import fs from "node:fs";

const path = "/home/ubuntu/atcs-vision-dataset/client/src/pages/CommandCenter.tsx";
let source = fs.readFileSync(path, "utf8");
if (!source.includes('import AtcsCoordinateMap from "@/components/AtcsCoordinateMap";')) {
  source = source.replace('import LiveHlsPlayer from "@/components/LiveHlsPlayer";', 'import LiveHlsPlayer from "@/components/LiveHlsPlayer";\nimport AtcsCoordinateMap from "@/components/AtcsCoordinateMap";');
}
const start = source.indexOf('<div className="relative min-h-[520px]');
const marker = source.indexOf('\n\n          <div className="grid gap-3 sm:grid-cols-4"', start);
if (start < 0 || marker < 0) throw new Error("Command Center map block was not found");
const replacement = `<div className="rounded-xl border border-white/10 bg-[#101719] p-2"><div className="mb-2 flex flex-wrap items-center justify-between gap-2 px-2"><div><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-stone-300"><MapIcon className="h-4 w-4 text-lime-300" />Peta koordinat ATCS · resmi</div><p className="mt-1 text-[10px] text-stone-500">Marker memakai koordinat yang dipublikasikan pada halaman Lokasi resmi ATCS Tasikmalaya.</p></div><span className="rounded-lg border border-lime-300/20 bg-lime-300/10 px-2.5 py-1.5 text-[10px] font-semibold text-lime-200">29 lokasi terverifikasi</span></div><AtcsCoordinateMap cameras={cameras} selectedId={selected?.id} onSelect={selectCamera} /><div className="flex flex-wrap items-center justify-between gap-3 px-2 pt-2 text-[10px] text-stone-500"><span><span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-lime-300" />Capture berhasil {summary.success}</span><span><span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-orange-300" />Riwayat capture gagal {summary.failed}</span><span><span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-slate-400" />Menunggu/nonaktif {summary.pending + summary.disabled}</span></div></div>`;
source = source.slice(0, start) + replacement + source.slice(marker);
fs.writeFileSync(path, source);
console.log("Integrated official coordinate map into CommandCenter.tsx");
