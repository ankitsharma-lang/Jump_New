import { createHmac, timingSafeEqual } from "node:crypto"

const PREVIEW_ORIGIN = "https://content-preview.local"

export function normalizeSignedPreviewPath(value) {
  const path = Array.isArray(value) ? value[0] : value

  if (typeof path !== "string" || !path.startsWith("/") || path.startsWith("//")) {
    return null
  }

  const url = new URL(path, PREVIEW_ORIGIN)
  if (url.origin !== PREVIEW_ORIGIN) return null

  return url.pathname
}

function getSignaturePayload({ path, timeline = "" }) {
  const normalizedPath = normalizeSignedPreviewPath(path)
  if (!normalizedPath) throw new Error("Invalid Contentful preview path")

  return `${normalizedPath}\n${timeline || ""}`
}

export function createPreviewSignature({ path, timeline = "", secret }) {
  if (!secret) throw new Error("Contentful preview secret is not configured")

  return createHmac("sha256", secret)
    .update(getSignaturePayload({ path, timeline }))
    .digest("base64url")
}

export function verifyPreviewSignature({ path, timeline = "", signature, secret }) {
  if (!secret || typeof signature !== "string" || !signature) return false

  const expected = createPreviewSignature({ path, timeline, secret })
  const expectedBuffer = Buffer.from(expected)
  const signatureBuffer = Buffer.from(signature)

  return (
    expectedBuffer.length === signatureBuffer.length &&
    timingSafeEqual(expectedBuffer, signatureBuffer)
  )
}
