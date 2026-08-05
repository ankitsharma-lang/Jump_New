import { bindNextjsPagesRouterOptimization } from "@contentful/optimization-nextjs/pages-router"

export const APP_LOCALE = "en-US"

const clientId =
  process.env.NEXT_PUBLIC_OPTIMIZATION_CLIENT_ID ||
  process.env.NEXT_PUBLIC_CONTENTFUL_PERSONALIZATION_CLIENT_ID ||
  ""

const environment =
  process.env.NEXT_PUBLIC_OPTIMIZATION_ENVIRONMENT ||
  process.env.NEXT_PUBLIC_CONTENTFUL_PERSONALIZATION_ENVIRONMENT ||
  "main"

const defaultConsent =
  process.env.NEXT_PUBLIC_OPTIMIZATION_DEFAULT_CONSENT !== "false"

const defaultPersistenceConsent =
  process.env.NEXT_PUBLIC_OPTIMIZATION_DEFAULT_PERSISTENCE_CONSENT !== "false"

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
    clientDefaults: {
      consent: defaultConsent,
      persistenceConsent: defaultPersistenceConsent,
    },
  },
  app: {
    name: "jumpstart-shop-nextjs",
    version: "1.0.0",
  },
})
