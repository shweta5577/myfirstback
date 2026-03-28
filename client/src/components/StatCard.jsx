export default function StatCard({ title, value, tone = "teal" }) {
  const toneMap = {
    teal: "from-teal-500 to-emerald-400",
    amber: "from-amber-500 to-orange-400",
    slate: "from-slate-700 to-slate-500",
    rose: "from-rose-500 to-orange-400"
  };

  return (
    <article className="rounded-2xl border border-white/50 bg-white/90 p-4 shadow-sm">
      <p className="text-sm text-slate-500">{title}</p>
      <div className={`mt-2 inline-flex rounded-xl bg-gradient-to-r px-3 py-2 text-2xl font-bold text-white ${toneMap[tone]}`}>
        {value}
      </div>
    </article>
  );
}
