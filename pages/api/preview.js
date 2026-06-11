export default async function handler(req, res) {
  const secret = req.query.secret
  const slug = req.query.slug || '/'
  const timeline = req.query.timeline || null

  if (secret !== process.env.NEXT_PUBLIC_PREVIEW_SECRET) {
    return res.status(401).json({ message: 'Invalid token' })
  }

  res.setPreviewData({ timeline })
  res.redirect(slug)
}
