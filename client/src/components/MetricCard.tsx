import type { LucideIcon } from "lucide-react";

type MetricCardProps = {
  label: string;
  value: string;
  note: string;
  icon: LucideIcon;
  tone?: "lime" | "blue" | "coral" | "ink";
};

const toneClasses = {
  lime: "bg-lime-200 text-lime-950",
  blue: "bg-sky-100 text-sky-950",
  coral: "bg-orange-100 text-orange-950",
  ink: "bg-stone-900 text-white",
};

export default function MetricCard({ label, value, note, icon: Icon, tone = "lime" }: MetricCardProps) {
  return (
    <article className="group rounded-[1.35rem] border border-stone-200 bg-white p-5 shadow-[0_12px_32px_-25px_rgba(28,32,30,0.45)] transition-transform duration-200 ease-out hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.13em] text-stone-500">{label}</p>
        <span className={`grid h-9 w-9 place-items-center rounded-xl ${toneClasses[tone]}`}><Icon className="h-4 w-4" /></span>
      </div>
      <p className="mt-6 text-3xl font-semibold tracking-[-0.045em] text-stone-950">{value}</p>
      <p className="mt-2 text-xs leading-5 text-stone-500">{note}</p>
    </article>
  );
}
