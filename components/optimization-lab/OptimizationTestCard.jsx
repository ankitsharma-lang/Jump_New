export default function OptimizationTestCard({ entry, metadata, onConvert }) {
  const fields = entry?.fields || {}
  const accent = fields.accent || "slate"
  const accentClasses = {
    blue: "border-blue-500 bg-blue-50",
    emerald: "border-emerald-500 bg-emerald-50",
    orange: "border-orange-500 bg-orange-50",
    purple: "border-purple-500 bg-purple-50",
    slate: "border-slate-400 bg-slate-50",
  }

  return (
    <article
      className={`rounded-lg border-2 p-5 shadow-sm ${
        accentClasses[accent] || accentClasses.slate
      }`}
      data-testid={`optimization-card-${fields.slug || entry?.sys?.id}`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        Resolved entry: {entry?.sys?.id || "unavailable"}
      </p>
      <h3 className="mt-2 text-xl font-bold text-slate-900">{fields.title}</h3>
      <p className="mt-2 text-slate-700">{fields.body}</p>
      <button
        className="mt-4 rounded bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
        data-testid="optimization-card-conversion"
        onClick={() => onConvert?.(entry, metadata)}
        type="button"
      >
        {fields.buttonLabel || "Track conversion"}
      </button>
    </article>
  )
}
