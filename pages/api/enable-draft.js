import {
  addTimelineToPath,
  getSafePreviewPath,
  getTimelinePreviewConfig,
  makePreviewCookiesIframeCompatible,
  normalizeTimelineToken,
} from "../../lib/contentful-preview.mjs"

export default async function handler(req, res) {
  const { secret, slug, timeline: timelineValue } = req.query

  const previewSecret =
    process.env.PREVIEW_SECRET || process.env.NEXT_PUBLIC_PREVIEW_SECRET

  if (secret !== previewSecret) {
    return res.status(401).json({ message: "Invalid token" })
  }

  const timeline = normalizeTimelineToken(timelineValue)

  try {
    getTimelinePreviewConfig(timeline)
  } catch (error) {
    return res.status(400).json({ message: error.message })
  }

  res.setPreviewData({ timeline })

  makePreviewCookiesIframeCompatible(res)

  res.redirect(addTimelineToPath(getSafePreviewPath(slug), timeline))
}
