import { isIP } from "node:net"

export function getRequestIp(context) {
  const headers = context.req.headers
  const forwarded =
    headers["x-vercel-forwarded-for"] ||
    headers["x-forwarded-for"] ||
    headers["x-real-ip"] ||
    context.req.socket?.remoteAddress ||
    ""
  const value = Array.isArray(forwarded) ? forwarded[0] : forwarded
  const candidate = String(value).split(",")[0].trim().replace(/^::ffff:/, "")

  return isIP(candidate) ? candidate : undefined
}
