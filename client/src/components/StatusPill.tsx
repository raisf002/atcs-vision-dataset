type StatusPillProps = {
  status: "verified" | "pending" | "invalid" | "active" | "paused" | "empty";
  compact?: boolean;
};

const statusStyles = {
  verified: { label: "Terkonfigurasi", className: "bg-emerald-50 text-emerald-800 ring-emerald-700/15", dot: "bg-emerald-500" },
  pending: { label: "Perlu sumber", className: "bg-amber-50 text-amber-800 ring-amber-700/15", dot: "bg-amber-500" },
  invalid: { label: "Sumber bermasalah", className: "bg-orange-50 text-orange-800 ring-orange-700/15", dot: "bg-orange-500" },
  active: { label: "Aktif", className: "bg-lime-100 text-lime-950 ring-lime-700/15", dot: "bg-lime-600" },
  paused: { label: "Nonaktif", className: "bg-stone-100 text-stone-600 ring-stone-600/10", dot: "bg-stone-400" },
  empty: { label: "Belum ada data", className: "bg-stone-100 text-stone-600 ring-stone-600/10", dot: "bg-stone-400" },
};

export default function StatusPill({ status, compact = false }: StatusPillProps) {
  const item = statusStyles[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${item.className}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${item.dot}`} />
      {!compact ? item.label : null}
    </span>
  );
}
