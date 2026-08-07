const IMAGE_HOST_PATTERN = /^https:\/\/(images(?:\.eu)?\.ctfassets\.net)\//i

export const IMAGE_FITS = ["pad", "fill", "scale", "crop", "thumb"]
export const IMAGE_FORMATS = ["webp", "avif", "jpg", "png"]
export const IMAGE_FOCUS_AREAS = [
  "center",
  "top",
  "right",
  "bottom",
  "left",
  "face",
  "faces",
]

export function normalizeContentfulImageUrl(value) {
  if (typeof value !== "string" || !value.trim()) return null

  const url = value.startsWith("//") ? `https:${value}` : value
  return IMAGE_HOST_PATTERN.test(url) ? url : null
}

function clamp(value, min, max, fallback) {
  const number = Number(value)
  if (!Number.isFinite(number)) return fallback
  return Math.min(max, Math.max(min, Math.round(number)))
}

export function buildContentfulImageUrl(
  value,
  {
    width = 1200,
    height,
    fit = "scale",
    focus = "center",
    format = "webp",
    quality = 85,
    background = "ffffff",
  } = {}
) {
  const normalized = normalizeContentfulImageUrl(value)
  if (!normalized) return null

  const url = new URL(normalized)
  url.searchParams.set("w", String(clamp(width, 1, 4000, 1200)))

  if (height) {
    url.searchParams.set("h", String(clamp(height, 1, 4000, 1200)))
  } else {
    url.searchParams.delete("h")
  }

  url.searchParams.set("fit", IMAGE_FITS.includes(fit) ? fit : "scale")
  url.searchParams.set("fm", IMAGE_FORMATS.includes(format) ? format : "webp")

  if (["jpg", "webp", "avif"].includes(format)) {
    url.searchParams.set("q", String(clamp(quality, 1, 100, 85)))
  } else {
    url.searchParams.delete("q")
  }

  if (["fill", "crop", "thumb"].includes(fit)) {
    url.searchParams.set(
      "f",
      IMAGE_FOCUS_AREAS.includes(focus) ? focus : "center"
    )
  } else {
    url.searchParams.delete("f")
  }

  if (fit === "pad") {
    url.searchParams.set("bg", `rgb:${background.replace(/[^a-f0-9]/gi, "") || "ffffff"}`)
  } else {
    url.searchParams.delete("bg")
  }

  return url.toString()
}
