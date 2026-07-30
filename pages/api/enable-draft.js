export default async function handler(req, res) {
  const { secret, slug } = req.query

  if (secret !== process.env.NEXT_PUBLIC_PREVIEW_SECRET) {
    return res.status(401).json({ message: "Invalid token" })
  }

  // Use setDraftMode (Next.js 13.4+)
  res.setDraftMode({ enable: true })

  // Patch cookie for iframe compatibility
  // Required for Contentful web app preview iframe
  const setCookieHeader = res.getHeader("Set-Cookie")
  if (setCookieHeader) {
    const cookies = Array.isArray(setCookieHeader)
      ? setCookieHeader
      : [setCookieHeader]

    res.setHeader(
      "Set-Cookie",
      cookies.map(
        (cookie) =>
          `${cookie
            .replace("SameSite=Lax", "SameSite=None")
            .replace("SameSite=lax", "SameSite=None")}; Secure`
      )
    )
  }

  const routeMap = { "home-page": "/", home: "/" }
  const safeSlug =
    routeMap[slug] ||
    (slug && !slug.includes("{")
      ? slug.startsWith("/")
        ? slug
        : `/${slug}`
      : "/")

  res.redirect(safeSlug)
}
