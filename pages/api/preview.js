import {
  addSignedPreviewToPath,
  getSafePreviewPath,
  getTimelinePreviewConfig,
  makePreviewCookiesIframeCompatible,
  normalizeTimelineToken,
} from '../../lib/contentful-preview.mjs'
import { createPreviewSignature } from '../../lib/contentful-preview-signature.mjs'

export default async function handler(req, res) {
  const { secret, slug, timeline: timelineValue } = req.query

  const previewSecret =
    process.env.PREVIEW_SECRET || process.env.NEXT_PUBLIC_PREVIEW_SECRET

  if (!previewSecret || secret !== previewSecret) {
    return res.status(401).json({ message: 'Invalid token' })
  }

  const timeline = normalizeTimelineToken(timelineValue)

  try {
    getTimelinePreviewConfig(timeline)
  } catch (error) {
    return res.status(400).json({ message: error.message })
  }

  // Preview data securely carries the Timeline token into getStaticProps.
  res.setPreviewData({ timeline })

  makePreviewCookiesIframeCompatible(res)

  const previewPath = getSafePreviewPath(slug)
  const previewKey = createPreviewSignature({
    path: previewPath,
    timeline,
    secret: previewSecret,
  })

  res.redirect(addSignedPreviewToPath(previewPath, timeline, previewKey))
}
