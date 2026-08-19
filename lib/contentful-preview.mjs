import { parseTimelinePreviewToken } from "@contentful/timeline-preview"

const MAX_TIMELINE_TOKEN_LENGTH = 1024

export function normalizeTimelineToken(value) {
  const token = Array.isArray(value) ? value[0] : value

  if (typeof token !== "string") return null

  const trimmedToken = token.trim()
  return trimmedToken || null
}

export function getTimelinePreviewConfig(value) {
  const token = normalizeTimelineToken(value)

  if (!token) return null
  if (token.length > MAX_TIMELINE_TOKEN_LENGTH || token.split(";").length > 2) {
    throw new Error("Invalid Contentful Timeline token")
  }

  const { releaseId, timestamp } = parseTimelinePreviewToken(token)

  if (!releaseId && !timestamp) {
    return null
  }

  if (timestamp && Number.isNaN(Date.parse(timestamp))) {
    throw new Error("Invalid Contentful Timeline timestamp")
  }

  return {
    ...(releaseId ? { release: { lte: releaseId } } : {}),
    ...(timestamp ? { timestamp: { lte: timestamp } } : {}),
  }
}

export function getPreviewStatus({
  preview = false,
  timeline = null,
  locale = "en-US",
  environment = "master",
} = {}) {
  const timelinePreview = getTimelinePreviewConfig(timeline)
  const releaseId = timelinePreview?.release?.lte || null
  const timestamp = timelinePreview?.timestamp?.lte || null

  return {
    enabled: Boolean(preview),
    mode: !preview
      ? "published"
      : releaseId
        ? "release"
        : timestamp
          ? "timeline"
          : "current",
    releaseId,
    timestamp,
    locale,
    environment,
  }
}

export function getSafePreviewPath(value) {
  const slug = Array.isArray(value) ? value[0] : value
  const routeMap = { "home-page": "/", home: "/" }

  if (!slug || typeof slug !== "string" || slug.includes("{") || slug.includes("}")) {
    return "/"
  }

  if (routeMap[slug]) return routeMap[slug]

  const path = slug.startsWith("/") ? slug : `/${slug}`

  // Prevent protocol-relative redirects while still allowing an internal query string.
  return path.startsWith("//") ? "/" : path
}

export function addLocaleToPath(
  path,
  value,
  { defaultLocale = "en-US", locales = [defaultLocale] } = {}
) {
  const locale = Array.isArray(value) ? value[0] : value

  if (typeof locale !== "string" || !locales.includes(locale) || locale === defaultLocale) {
    return path
  }

  const url = new URL(path, "https://content-preview.local")
  const localePrefix = `/${locale}`
  if (url.pathname === localePrefix || url.pathname.startsWith(`${localePrefix}/`)) {
    return `${url.pathname}${url.search}${url.hash}`
  }

  url.pathname = url.pathname === "/" ? localePrefix : `${localePrefix}${url.pathname}`
  return `${url.pathname}${url.search}${url.hash}`
}

export function addTimelineToPath(path, value) {
  const token = normalizeTimelineToken(value)
  if (!token) return path

  const url = new URL(path, "https://content-preview.local")
  url.searchParams.set("timeline", token)
  return `${url.pathname}${url.search}${url.hash}`
}

export function addSignedPreviewToPath(path, timelineValue, signature) {
  const timeline = normalizeTimelineToken(timelineValue)
  const url = new URL(path, "https://content-preview.local")

  if (timeline) url.searchParams.set("timeline", timeline)
  if (signature) url.searchParams.set("previewKey", signature)

  return `${url.pathname}${url.search}${url.hash}`
}

export function makePreviewCookiesIframeCompatible(res) {
  const setCookieHeader = res.getHeader("Set-Cookie")
  if (!setCookieHeader) return

  const cookies = Array.isArray(setCookieHeader)
    ? setCookieHeader
    : [setCookieHeader]

  res.setHeader(
    "Set-Cookie",
    cookies.map((cookie) => {
      const sameSiteNone = cookie
        .replace("SameSite=Lax", "SameSite=None")
        .replace("SameSite=lax", "SameSite=None")

      return /;\s*Secure(?:;|$)/i.test(sameSiteNone)
        ? sameSiteNone
        : `${sameSiteNone}; Secure`
    })
  )
}
