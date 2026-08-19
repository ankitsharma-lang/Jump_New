import { useSelectedOptimizationsState } from "@contentful/optimization-nextjs/client"

export default function PersonalizationNotice({
  baselineLabel,
  experienceIds = [],
  personalizedLabel,
}) {
  const selectedOptimizations = useSelectedOptimizationsState()
  const linkedExperienceIds = new Set(experienceIds)
  const selections = Array.isArray(selectedOptimizations)
    ? selectedOptimizations
    : Object.values(selectedOptimizations || {})
  const hasAuthoredVariant = selections.some(
    (selection) =>
      linkedExperienceIds.has(selection?.experienceId) &&
      Number(selection?.variantIndex) > 0
  )

  return (
    <span
      className="hidden items-center gap-2 rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-2 text-xs font-semibold text-emerald-100 md:flex"
      title={hasAuthoredVariant ? personalizedLabel : baselineLabel}
    >
      <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(110,231,183,0.9)]" />
      {hasAuthoredVariant ? personalizedLabel : baselineLabel}
    </span>
  )
}
