import { bindNextjsPagesRouterOptimization } from "@contentful/optimization-nextjs/pages-router"
import { clientConsentDefaults } from "./optimization-consent"

export const APP_LOCALE = "en-US"

const clientId =
  process.env.NEXT_PUBLIC_OPTIMIZATION_CLIENT_ID ||
  process.env.NEXT_PUBLIC_CONTENTFUL_PERSONALIZATION_CLIENT_ID ||
  ""

const environment =
  process.env.NEXT_PUBLIC_OPTIMIZATION_ENVIRONMENT ||
  process.env.NEXT_PUBLIC_CONTENTFUL_PERSONALIZATION_ENVIRONMENT ||
  "main"

export const {
  OptimizationAnalyticsRoot,
  OptimizationProvider,
  OptimizationRoot,
  OptimizedEntry,
} = bindNextjsPagesRouterOptimization({
  clientId,
  environment,
  locale: APP_LOCALE,
  consent: {
    clientDefaults: clientConsentDefaults,
  },
  app: {
    name: "jumpstart-shop-nextjs",
    version: "1.0.0",
  },
})
