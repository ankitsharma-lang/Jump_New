import { useEffect, useState } from "react"
import { useOptimizationContext } from "@contentful/optimization-nextjs/client"

export default function PreviewPanelLoader({ audiences, experiences }) {
  const { error: optimizationError, isLive, sdk: optimization } = useOptimizationContext()
  const [status, setStatus] = useState("loading")

  useEffect(() => {
    if (optimizationError) {
      setStatus(`error: ${optimizationError.message}`)
      return undefined
    }
    if (!isLive || !optimization) return undefined

    let active = true

    import("@contentful/optimization-web-preview-panel")
      .then(({ default: attachOptimizationPreviewPanel }) =>
        attachOptimizationPreviewPanel({
          entries: { audiences, experiences },
          optimization,
        })
      )
      .then(() => active && setStatus("ready"))
      .catch((error) =>
        active && setStatus(`error: ${error?.message || "unknown preview-panel error"}`)
      )

    return () => {
      active = false
    }
  }, [audiences, experiences, isLive, optimization, optimizationError])

  return (
    <p className="text-sm text-slate-600" data-testid="preview-panel-status">
      Preview panel: {status}
    </p>
  )
}
