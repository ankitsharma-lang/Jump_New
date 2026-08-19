import { APP_LOCALE } from "./optimization"
import {
  OPTIMIZATION_CONSENT_COOKIE,
  resolveServerConsent,
} from "./optimization-consent"
import {
  getRequestGeoLocation,
  getRequestIp,
} from "./optimization-request"

// Next 14 resolves the package ESM condition during page-data collection, but
// React 18 does not expose the named `cache` export used by that bundle. The
// supported CommonJS condition avoids that loader mismatch on Pages Router.
const { bindNextjsPagesRouterServerOptimization } = require(
  "@contentful/optimization-nextjs/pages-router/server"
)

const clientId =
  process.env.OPTIMIZATION_CLIENT_ID ||
  process.env.NEXT_PUBLIC_OPTIMIZATION_CLIENT_ID ||
  process.env.NEXT_PUBLIC_CONTENTFUL_PERSONALIZATION_CLIENT_ID ||
  ""

const environment =
  process.env.OPTIMIZATION_ENVIRONMENT ||
  process.env.NEXT_PUBLIC_OPTIMIZATION_ENVIRONMENT ||
  process.env.NEXT_PUBLIC_CONTENTFUL_PERSONALIZATION_ENVIRONMENT ||
  "main"

if (!clientId) {
  throw new Error("Missing Contentful Optimization client ID")
}

const { createRequestHandoff } = bindNextjsPagesRouterServerOptimization({
  clientId,
  environment,
  locale: APP_LOCALE,
  consent: {
    server: ({ cookies }) =>
      resolveServerConsent(cookies.get(OPTIMIZATION_CONSENT_COOKIE)?.value),
  },
  app: {
    name: "jumpstart-shop-nextjs",
    version: "1.0.0",
  },
})

export async function createStorefrontOptimizationHandoff(
  context,
  { locale = APP_LOCALE, route = context.resolvedUrl } = {}
) {
  const ip = getRequestIp(context)
  const location = getRequestGeoLocation(context)

  return createRequestHandoff(context, {
    cache: { scope: "private-request" },
    hydration: "preserve-server",
    locale,
    experienceOptions: ip ? { ip } : undefined,
    eventContext: location ? { location } : undefined,
    pagePayload: {
      properties: { route, locale },
    },
    cookieOptions: {
      httpOnly: false,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 31536000,
    },
  })
}

export async function getSafeStorefrontOptimizationHandoff(context, options) {
  try {
    return await createStorefrontOptimizationHandoff(context, options)
  } catch (error) {
    console.error(
      "Contentful Optimization request failed",
      error?.response?.status || error?.status || error?.code || error?.name || ""
    )
    return null
  }
}
