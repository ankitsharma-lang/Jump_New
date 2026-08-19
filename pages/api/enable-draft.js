import {
  addLocaleToPath,
  addSignedPreviewToPath,
  getSafePreviewPath,
  getTimelinePreviewConfig,
  makePreviewCookiesIframeCompatible,
  normalizeTimelineToken,
} from "../../lib/contentful-preview.mjs"
import { createPreviewSignature } from "../../lib/contentful-preview-signature.mjs"
import siteLocales from "../../config/locales"

export default async function handler(req, res) {
  const { locale, secret, slug, timeline: timelineValue } = req.query

  const previewSecret =
    process.env.PREVIEW_SECRET || process.env.NEXT_PUBLIC_PREVIEW_SECRET

  if (!previewSecret || secret !== previewSecret) {
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

  const previewPath = addLocaleToPath(getSafePreviewPath(slug), locale, siteLocales)
  const previewKey = createPreviewSignature({
    path: previewPath,
    timeline,
    secret: previewSecret,
  })

  res.redirect(addSignedPreviewToPath(previewPath, timeline, previewKey))
}
