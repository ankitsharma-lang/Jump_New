import assert from "node:assert/strict"
import {
  addLocaleToPath,
  addSignedPreviewToPath,
  addTimelineToPath,
  getSafePreviewPath,
  getPreviewStatus,
  getTimelinePreviewConfig,
  makePreviewCookiesIframeCompatible,
} from "../lib/contentful-preview.mjs"
import {
  createPreviewSignature,
  normalizeSignedPreviewPath,
  verifyPreviewSignature,
} from "../lib/contentful-preview-signature.mjs"

assert.deepEqual(getTimelinePreviewConfig("release-123;2026-08-05T10:00:00.000Z"), {
  release: { lte: "release-123" },
  timestamp: { lte: "2026-08-05T10:00:00.000Z" },
})
assert.deepEqual(getTimelinePreviewConfig(";2026-08-05T10:00:00.000Z"), {
  timestamp: { lte: "2026-08-05T10:00:00.000Z" },
})
assert.equal(getTimelinePreviewConfig(""), null)
assert.deepEqual(
  getPreviewStatus({
    preview: true,
    timeline: "release-123;2026-08-05T10:00:00.000Z",
    locale: "de-DE",
    environment: "production",
  }),
  {
    enabled: true,
    mode: "release",
    releaseId: "release-123",
    timestamp: "2026-08-05T10:00:00.000Z",
    locale: "de-DE",
    environment: "production",
  }
)
assert.throws(() => getTimelinePreviewConfig("release-123;not-a-date"))
assert.equal(getSafePreviewPath("home-page"), "/")
assert.equal(getSafePreviewPath("//example.com"), "/")
assert.equal(
  addLocaleToPath("/", "de-DE", {
    defaultLocale: "en-US",
    locales: ["en-US", "de-DE"],
  }),
  "/de-DE"
)
assert.equal(
  addLocaleToPath("/products/mug?preview=true", "de-DE", {
    defaultLocale: "en-US",
    locales: ["en-US", "de-DE"],
  }),
  "/de-DE/products/mug?preview=true"
)
assert.equal(
  addLocaleToPath("/", "en-US", {
    defaultLocale: "en-US",
    locales: ["en-US", "de-DE"],
  }),
  "/"
)
assert.equal(
  addLocaleToPath("/", "de-DE/../../admin", {
    defaultLocale: "en-US",
    locales: ["en-US", "de-DE"],
  }),
  "/"
)
assert.equal(
  addTimelineToPath("/", "release-123;2026-08-05T10:00:00.000Z"),
  "/?timeline=release-123%3B2026-08-05T10%3A00%3A00.000Z"
)
assert.equal(
  addSignedPreviewToPath(
    "/products/mug",
    "release-123;2026-08-05T10:00:00.000Z",
    "signed-value"
  ),
  "/products/mug?timeline=release-123%3B2026-08-05T10%3A00%3A00.000Z&previewKey=signed-value"
)

const previewSignature = createPreviewSignature({
  path: "/products/mug",
  timeline: "release-123;2026-08-05T10:00:00.000Z",
  secret: "test-secret",
})
assert.equal(
  verifyPreviewSignature({
    path: "/products/mug",
    timeline: "release-123;2026-08-05T10:00:00.000Z",
    signature: previewSignature,
    secret: "test-secret",
  }),
  true
)
assert.equal(
  verifyPreviewSignature({
    path: "/products/another-mug",
    timeline: "release-123;2026-08-05T10:00:00.000Z",
    signature: previewSignature,
    secret: "test-secret",
  }),
  false
)
assert.equal(normalizeSignedPreviewPath("/de-DE/products/mug?ignored=true"), "/de-DE/products/mug")
assert.equal(normalizeSignedPreviewPath("//example.com"), null)

const headers = new Map([
  ["Set-Cookie", ["preview=a; SameSite=Lax", "data=b; SameSite=None; Secure"]],
])
const mockResponse = {
  getHeader: (name) => headers.get(name),
  setHeader: (name, value) => headers.set(name, value),
}
makePreviewCookiesIframeCompatible(mockResponse)
assert.deepEqual(headers.get("Set-Cookie"), [
  "preview=a; SameSite=None; Secure",
  "data=b; SameSite=None; Secure",
])

console.log("Contentful preview helper checks passed")
