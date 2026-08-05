import { useMergeTagResolver } from "@contentful/optimization-nextjs/client"

function valueOrFallback(getMergeTagValue, entry) {
  if (!entry) return "fixture unavailable"
  return getMergeTagValue(entry) || entry.fields?.nt_fallback || "not available"
}

export default function MergeTagDemo({ mergeTags }) {
  const { getMergeTagValue } = useMergeTagResolver()
  const firstName = mergeTags.find(
    (entry) => entry.fields?.nt_mergetag_id === "traits.firstName"
  )
  const city = mergeTags.find(
    (entry) => entry.fields?.nt_mergetag_id === "location.city"
  )

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <h3 className="font-bold text-slate-900">Merge-tag output</h3>
      <p className="mt-2 text-slate-700" data-testid="merge-tag-output">
        Hello {valueOrFallback(getMergeTagValue, firstName)} from{" "}
        {valueOrFallback(getMergeTagValue, city)}.
      </p>
      <p className="mt-2 text-xs text-slate-500">
        Identify a visitor above to replace the fallback values.
      </p>
    </div>
  )
}
