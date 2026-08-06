import assert from "node:assert/strict"
import {
  addTimelineToPath,
  getSafePreviewPath,
  getTimelinePreviewConfig,
  makePreviewCookiesIframeCompatible,
} from "../lib/contentful-preview.mjs"

assert.deepEqual(getTimelinePreviewConfig("release-123;2026-08-05T10:00:00.000Z"), {
  release: { lte: "release-123" },
  timestamp: { lte: "2026-08-05T10:00:00.000Z" },
})
assert.deepEqual(getTimelinePreviewConfig(";2026-08-05T10:00:00.000Z"), {
  timestamp: { lte: "2026-08-05T10:00:00.000Z" },
})
assert.equal(getTimelinePreviewConfig(""), null)
assert.throws(() => getTimelinePreviewConfig("release-123;not-a-date"))
assert.equal(getSafePreviewPath("home-page"), "/")
assert.equal(getSafePreviewPath("//example.com"), "/")
assert.equal(
  addTimelineToPath("/", "release-123;2026-08-05T10:00:00.000Z"),
  "/?timeline=release-123%3B2026-08-05T10%3A00%3A00.000Z"
)

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
