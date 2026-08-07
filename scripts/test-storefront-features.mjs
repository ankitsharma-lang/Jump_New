import assert from "node:assert/strict"
import {
  createContentSnapshot,
  createLocaleCoverage,
  createRelationshipTree,
} from "../lib/contentful-diagnostics.js"
import { buildContentfulImageUrl } from "../lib/contentful-image.js"
import {
  getRevalidationPaths,
  getWebhookSlugs,
  isSafeSlug,
  readWebhookSecret,
  safelyEqualSecrets,
} from "../lib/webhook.js"

const asset = {
  sys: { id: "asset-1", type: "Asset", publishedAt: "2026-01-01T00:00:00Z" },
  fields: {
    title: "Mug",
    file: { url: "//images.ctfassets.net/space/asset/file/mug.jpg" },
  },
}
const product = {
  sys: {
    id: "product-1",
    type: "Entry",
    contentType: { sys: { id: "product" } },
    publishedAt: "2026-01-01T00:00:00Z",
  },
  fields: { title: "Coffee mug", price: 99, image: asset },
}

const imageUrl = new URL(
  buildContentfulImageUrl(asset.fields.file.url, {
    width: 900,
    height: 620,
    fit: "fill",
    focus: "top",
    format: "avif",
    quality: 72,
  })
)
assert.equal(imageUrl.protocol, "https:")
assert.equal(imageUrl.searchParams.get("w"), "900")
assert.equal(imageUrl.searchParams.get("h"), "620")
assert.equal(imageUrl.searchParams.get("fit"), "fill")
assert.equal(imageUrl.searchParams.get("f"), "top")
assert.equal(imageUrl.searchParams.get("fm"), "avif")
assert.equal(imageUrl.searchParams.get("q"), "72")

assert.equal(safelyEqualSecrets("secret", "secret"), true)
assert.equal(safelyEqualSecrets("secret", "different"), false)
assert.equal(readWebhookSecret({ headers: { "x-contentful-webhook-secret": "secret" } }), "secret")
assert.equal(readWebhookSecret({ headers: { authorization: "Bearer secret" } }), "secret")
assert.equal(isSafeSlug("contentful-coffee-mug"), true)
assert.equal(isSafeSlug("../admin"), false)
assert.deepEqual(getWebhookSlugs({ fields: { slug: { "en-US": "coffee-mug", "de-DE": "kaffeetasse" } } }), [
  "coffee-mug",
  "kaffeetasse",
])
assert.deepEqual(
  getRevalidationPaths(["coffee-mug"], ["en-US", "de-DE"], "en-US"),
  ["/", "/de-DE", "/products/coffee-mug", "/de-DE/products/coffee-mug"]
)

const snapshot = createContentSnapshot(product)
assert.equal(snapshot.some((row) => row.path === "page.title" && row.value === "Coffee mug"), true)
assert.equal(snapshot.some((row) => row.kind === "image" && row.referenceId === "asset-1"), true)
const relationships = createRelationshipTree(product)
assert.equal(relationships.children[0].type, "asset")

const localizedProduct = {
  ...product,
  fields: {
    title: { "en-US": "Coffee mug", "de-DE": "Kaffeetasse" },
    price: { "en-US": 99 },
  },
}
const coverage = createLocaleCoverage(localizedProduct, ["en-US", "de-DE"])
assert.deepEqual(coverage.find((row) => row.fieldId === "title").availability, {
  "en-US": true,
  "de-DE": true,
})

console.log("Storefront feature checks passed")
