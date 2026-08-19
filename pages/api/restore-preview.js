import {
  addSignedPreviewToPath,
  getTimelinePreviewConfig,
  makePreviewCookiesIframeCompatible,
  normalizeTimelineToken,
} from "../../lib/contentful-preview.mjs"
import {
  normalizeSignedPreviewPath,
  verifyPreviewSignature,
} from "../../lib/contentful-preview-signature.mjs"

export default function handler(req, res) {
  const { path: pathValue, previewKey: signatureValue, timeline: timelineValue } = req.query
  const previewSecret = process.env.PREVIEW_SECRET || process.env.NEXT_PUBLIC_PREVIEW_SECRET
  const path = normalizeSignedPreviewPath(pathValue)
  const timeline = normalizeTimelineToken(timelineValue)
  const previewKey = Array.isArray(signatureValue) ? signatureValue[0] : signatureValue

  if (!path) {
    return res.status(400).json({ message: "Invalid preview path" })
  }

  try {
    getTimelinePreviewConfig(timeline)
  } catch (error) {
    return res.status(400).json({ message: error.message })
  }

  if (
    !verifyPreviewSignature({
      path,
      timeline,
      signature: previewKey,
      secret: previewSecret,
    })
  ) {
    return res.status(401).json({ message: "Invalid preview signature" })
  }

  res.setPreviewData({ timeline })
  makePreviewCookiesIframeCompatible(res)
  res.redirect(addSignedPreviewToPath(path, timeline, previewKey))
}
