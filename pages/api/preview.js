import { COOKIE_NAME_PRERENDER_BYPASS } from 'next/dist/server/api-utils'

export default async function handler(req, res) {
  const { secret, slug } = req.query

  const previewSecret =
    process.env.PREVIEW_SECRET || process.env.NEXT_PUBLIC_PREVIEW_SECRET

  if (secret !== previewSecret) {
    return res.status(401).json({ message: 'Invalid token' })
  }

  // Use setDraftMode (official) not setPreviewData
  res.setDraftMode({ enable: true })

  // CRITICAL: patch cookie for Contentful iframe
  // https://github.com/vercel/next.js/issues/49927
  const headers = res.getHeader('Set-Cookie')
  if (Array.isArray(headers)) {
    res.setHeader(
      'Set-Cookie',
      headers.map((cookie) => {
        if (cookie.includes(COOKIE_NAME_PRERENDER_BYPASS)) {
          return cookie.replace('SameSite=Lax', 'SameSite=None; Secure')
        }
        return cookie
      })
    )
  }

  // Map slug to route
  const routeMap = { 'home-page': '/', 'home': '/' }
  const safeSlug = routeMap[slug] || (slug?.startsWith('/') ? slug : `/${slug}`) || '/'
  res.redirect(safeSlug)
}
