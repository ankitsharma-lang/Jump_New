import crypto from "node:crypto"

export function safelyEqualSecrets(left, right) {
  if (typeof left !== "string" || typeof right !== "string" || !left || !right) {
    return false
  }

  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)

  return (
    leftBuffer.length === rightBuffer.length &&
    crypto.timingSafeEqual(leftBuffer, rightBuffer)
  )
}

export function readWebhookSecret(req) {
  const customHeader = req.headers["x-contentful-webhook-secret"]
  if (typeof customHeader === "string") return customHeader

  const authorization = req.headers.authorization
  if (typeof authorization === "string" && authorization.startsWith("Bearer ")) {
    return authorization.slice(7)
  }

  return ""
}

function localizedStrings(value) {
  if (typeof value === "string") return [value]
  if (!value || typeof value !== "object") return []
  return Object.values(value).filter((item) => typeof item === "string")
}

export function isSafeSlug(value) {
  return (
    typeof value === "string" &&
    value.length <= 160 &&
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(value)
  )
}

export function getWebhookSlugs(body) {
  return [...new Set(localizedStrings(body?.fields?.slug).filter(isSafeSlug))]
}

export function getRevalidationPaths(slugs, locales, defaultLocale) {
  const paths = new Set(["/"])

  locales.forEach((locale) => {
    if (locale !== defaultLocale) paths.add(`/${locale}`)
  })

  slugs.filter(isSafeSlug).forEach((slug) => {
    paths.add(`/products/${slug}`)
    locales.forEach((locale) => {
      if (locale !== defaultLocale) paths.add(`/${locale}/products/${slug}`)
    })
  })

  return [...paths]
}
