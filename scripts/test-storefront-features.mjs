import assert from "node:assert/strict"
import "dotenv/config"
import { readFile } from "node:fs/promises"
import {
  createContentSnapshot,
  createLocaleCoverage,
  createRelationshipTree,
} from "../lib/contentful-diagnostics.js"
import { buildContentfulImageUrl } from "../lib/contentful-image.js"
import { getLinkedOptimizationExperienceIds } from "../lib/optimization-experiences.js"
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

assert.deepEqual(
  getLinkedOptimizationExperienceIds({
    sys: { id: "page", type: "Entry" },
    fields: {
      nt_experiences: [
        {
          sys: { id: "experience-entry", type: "Entry" },
          fields: { nt_experience_id: "optimization-experience" },
        },
      ],
      sections: [
        {
          sys: { id: "section", type: "Entry" },
          fields: {
            nt_experiences: [
              { sys: { id: "nested-experience", type: "Entry" }, fields: {} },
            ],
          },
        },
      ],
    },
  }).sort(),
  ["experience-entry", "nested-experience", "optimization-experience"]
)

const personalizedRouteSources = await Promise.all([
  readFile(new URL("../pages/index.jsx", import.meta.url), "utf8"),
  readFile(new URL("../pages/products/[slug].jsx", import.meta.url), "utf8"),
])

personalizedRouteSources.forEach((source) => {
  assert.equal(source.includes("useOptimizationContext"), false)
  assert.equal(source.includes("<OptimizedEntry"), true)
  assert.equal(source.includes("getServerSideProps"), true)
  assert.equal(source.includes("getStaticProps"), false)
  assert.equal(source.includes("revalidate: 30"), false)
})

const optimizationServerSource = await readFile(
  new URL("../lib/optimization-server.js", import.meta.url),
  "utf8"
)
assert.equal(optimizationServerSource.includes('scope: "private-request"'), true)
assert.equal(optimizationServerSource.includes('hydration: "preserve-server"'), true)
assert.equal(optimizationServerSource.includes("experienceOptions"), true)

const { getRequestGeoLocation, getRequestIp } = await import(
  "../lib/optimization-request.js"
)
assert.equal(
  getRequestIp({
    req: {
      headers: { "x-vercel-forwarded-for": "81.2.69.142, 10.0.0.1" },
      socket: {},
    },
  }),
  "81.2.69.142"
)
assert.equal(
  getRequestIp({ req: { headers: { "x-forwarded-for": "not-an-ip" }, socket: {} } }),
  undefined
)
assert.deepEqual(
  getRequestGeoLocation({
    req: {
      headers: {
        "x-vercel-ip-country": "gb",
        "x-vercel-ip-city": "Greater%20London",
        "x-vercel-ip-latitude": "51.5072",
        "x-vercel-ip-longitude": "-0.1276",
      },
    },
  }),
  {
    countryCode: "GB",
    city: "Greater London",
    coordinates: { latitude: 51.5072, longitude: -0.1276 },
  }
)
assert.deepEqual(
  getRequestGeoLocation({
    req: { headers: { "x-vercel-ip-country": "US" } },
  }),
  { countryCode: "US" }
)
assert.equal(
  getRequestGeoLocation({
    req: { headers: { "x-vercel-ip-country": "invalid" } },
  }),
  undefined
)

const { resolveServerConsent } = await import("../lib/optimization-consent.js")
assert.deepEqual(resolveServerConsent("granted"), {
  events: true,
  persistence: true,
})
assert.deepEqual(resolveServerConsent("session"), {
  events: true,
  persistence: false,
})
assert.deepEqual(resolveServerConsent("denied"), {
  events: false,
  persistence: false,
})

const previousVercelEnvironment = process.env.VERCEL_ENV
process.env.VERCEL_ENV = "production"
const { isOptimizationLabEnabled } = await import("../lib/optimization-lab-server.js")
assert.equal(isOptimizationLabEnabled(), false)
if (previousVercelEnvironment === undefined) {
  delete process.env.VERCEL_ENV
} else {
  process.env.VERCEL_ENV = previousVercelEnvironment
}

console.log("Storefront feature checks passed")
