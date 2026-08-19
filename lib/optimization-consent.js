export const OPTIMIZATION_CONSENT_COOKIE = "jump_personalization_consent"

function enabled(value, fallback) {
  if (value === "true") return true
  if (value === "false") return false
  return fallback
}

// This demo storefront has an explicit default-on personalization policy. A
// customer CMP can override it by setting the application-owned consent cookie.
export const clientConsentDefaults = {
  consent: enabled(
    process.env.NEXT_PUBLIC_OPTIMIZATION_DEFAULT_CONSENT,
    true
  ),
  persistenceConsent: enabled(
    process.env.NEXT_PUBLIC_OPTIMIZATION_DEFAULT_PERSISTENCE_CONSENT,
    true
  ),
}

export function resolveServerConsent(cookieValue) {
  if (cookieValue === "denied") {
    return { events: false, persistence: false }
  }

  if (cookieValue === "session") {
    return { events: true, persistence: false }
  }

  if (cookieValue === "granted") {
    return { events: true, persistence: true }
  }

  return {
    events: enabled(
      process.env.OPTIMIZATION_DEFAULT_CONSENT,
      clientConsentDefaults.consent
    ),
    persistence: enabled(
      process.env.OPTIMIZATION_DEFAULT_PERSISTENCE_CONSENT,
      clientConsentDefaults.persistenceConsent
    ),
  }
}
