import siteLocales from "../../config/locales"
import { getEntriesByContentType } from "../../lib/helpers"
import {
  getRevalidationPaths,
  getWebhookSlugs,
  readWebhookSecret,
  safelyEqualSecrets,
} from "../../lib/webhook"

const MAX_BODY_SIZE = 256_000

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST")
    return res.status(405).json({ error: "Method Not Allowed" })
  }

  const expectedSecret = process.env.CONTENTFUL_WEBHOOK_SECRET || ""
  if (!expectedSecret) {
    return res.status(503).json({ error: "Webhook secret is not configured" })
  }

  if (!safelyEqualSecrets(readWebhookSecret(req), expectedSecret)) {
    return res.status(401).json({ error: "Unauthorized" })
  }

  const bodySize = Buffer.byteLength(JSON.stringify(req.body || {}), "utf8")
  if (bodySize > MAX_BODY_SIZE) {
    return res.status(413).json({ error: "Payload Too Large" })
  }

  const payloadSlugs = getWebhookSlugs(req.body)
  const productEntries = await getEntriesByContentType("product")
  const knownProductSlugs = (productEntries?.items || [])
    .map((entry) => entry.fields?.slug)
    .filter(Boolean)
  const paths = getRevalidationPaths(
    [...payloadSlugs, ...knownProductSlugs],
    siteLocales.locales,
    siteLocales.defaultLocale
  )

  const results = []
  for (const path of paths) {
    try {
      await res.revalidate(path)
      results.push({ path, revalidated: true })
    } catch {
      results.push({ path, revalidated: false })
    }
  }

  const failed = results.filter((result) => !result.revalidated)
  return res.status(failed.length ? 500 : 200).json({
    revalidated: failed.length === 0,
    paths: results,
  })
}
