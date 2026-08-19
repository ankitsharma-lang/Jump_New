import crypto from "node:crypto"

const ACCESS_COOKIE = "jump_optimization_lab_access"

function getLabSecret() {
  return process.env.OPTIMIZATION_LAB_SECRET || ""
}

export function isOptimizationLabEnabled() {
  if (process.env.VERCEL_ENV === "production") return false

  if (process.env.NODE_ENV === "production") {
    return process.env.OPTIMIZATION_LAB_ISOLATED_DEPLOYMENT === "true"
  }

  return process.env.ENABLE_OPTIMIZATION_LAB !== "false"
}

function digest(value) {
  return crypto.createHash("sha256").update(value).digest("hex")
}

function safelyEqual(left, right) {
  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)

  return (
    leftBuffer.length === rightBuffer.length &&
    crypto.timingSafeEqual(leftBuffer, rightBuffer)
  )
}

function parseCookies(cookieHeader = "") {
  return Object.fromEntries(
    cookieHeader
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const separator = part.indexOf("=")
        return separator === -1
          ? [part, ""]
          : [part.slice(0, separator), decodeURIComponent(part.slice(separator + 1))]
      })
  )
}

export function authorizeOptimizationLab(context) {
  if (!isOptimizationLabEnabled()) {
    return { authorized: false }
  }

  const secret = getLabSecret()

  if (!secret && process.env.NODE_ENV !== "production") {
    return { authorized: true }
  }

  if (!secret) {
    return { authorized: false }
  }

  const expectedDigest = digest(secret)
  const cookies = parseCookies(context.req.headers.cookie)
  const cookieDigest = cookies[ACCESS_COOKIE] || ""
  const headerSecret = context.req.headers["x-optimization-lab-secret"] || ""
  const querySecret = Array.isArray(context.query.secret)
    ? context.query.secret[0]
    : context.query.secret || ""

  if (cookieDigest && safelyEqual(cookieDigest, expectedDigest)) {
    return { authorized: true }
  }

  if (headerSecret && safelyEqual(String(headerSecret), secret)) {
    return { authorized: true }
  }

  if (querySecret && safelyEqual(String(querySecret), secret)) {
    const secure = process.env.NODE_ENV === "production" ? "; Secure" : ""
    context.res.setHeader(
      "Set-Cookie",
      `${ACCESS_COOKIE}=${expectedDigest}; HttpOnly; SameSite=Lax; Path=/optimization-lab; Max-Age=28800${secure}`
    )
    return { authorized: true, redirectToCleanUrl: true }
  }

  return { authorized: false }
}
