import { isIP } from "node:net"

function getHeaderValue(headers, name) {
  const value = headers[name]

  return Array.isArray(value) ? value[0] : value
}

function decodeHeaderValue(value) {
  if (!value) return undefined

  try {
    return decodeURIComponent(String(value))
  } catch {
    return String(value)
  }
}

function parseCoordinate(value) {
  if (value === undefined || value === null || String(value).trim() === "") {
    return undefined
  }

  const coordinate = Number(value)

  return Number.isFinite(coordinate) ? coordinate : undefined
}

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

export function getRequestGeoLocation(context) {
  const headers = context.req.headers
  const countryCode = String(
    getHeaderValue(headers, "x-vercel-ip-country") || ""
  ).toUpperCase()

  if (!/^[A-Z]{2}$/.test(countryCode)) return undefined

  const location = {
    countryCode,
    continent: decodeHeaderValue(
      getHeaderValue(headers, "x-vercel-ip-continent")
    ),
    city: decodeHeaderValue(getHeaderValue(headers, "x-vercel-ip-city")),
    region: decodeHeaderValue(
      getHeaderValue(headers, "x-vercel-ip-country-region")
    ),
    postalCode: decodeHeaderValue(
      getHeaderValue(headers, "x-vercel-ip-postal-code")
    ),
    timezone: decodeHeaderValue(
      getHeaderValue(headers, "x-vercel-ip-timezone")
    ),
  }
  const latitude = parseCoordinate(
    getHeaderValue(headers, "x-vercel-ip-latitude")
  )
  const longitude = parseCoordinate(
    getHeaderValue(headers, "x-vercel-ip-longitude")
  )

  if (latitude !== undefined && longitude !== undefined) {
    location.coordinates = { latitude, longitude }
  }

  return Object.fromEntries(
    Object.entries(location).filter(([, value]) => value !== undefined)
  )
}
