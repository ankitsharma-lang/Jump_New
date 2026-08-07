import { useSelectedOptimizationsState } from "@contentful/optimization-nextjs/client"

export default function PersonalizationNotice({ baselineLabel, personalizedLabel }) {
  const selectedOptimizations = useSelectedOptimizationsState()
  const selectionCount = Array.isArray(selectedOptimizations)
    ? selectedOptimizations.length
    : Object.keys(selectedOptimizations || {}).length

  return (
    <span
      className="hidden items-center gap-2 rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-2 text-xs font-semibold text-emerald-100 md:flex"
      title={selectionCount ? personalizedLabel : baselineLabel}
    >
      <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(110,231,183,0.9)]" />
      {selectionCount ? personalizedLabel : baselineLabel}
    </span>
  )
}
