import ContentfulOptimization from "@contentful/optimization-node"
import { APP_LOCALE } from "./optimization"

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

const optimization = new ContentfulOptimization({
  clientId,
  environment,
  locale: APP_LOCALE,
  app: {
    name: "jumpstart-shop-optimization-lab",
    version: "1.0.0",
  },
})

function readCookie(cookieHeader = "", name) {
  const prefix = `${name}=`
  const part = cookieHeader
    .split(";")
    .map((value) => value.trim())
    .find((value) => value.startsWith(prefix))
  return part ? decodeURIComponent(part.slice(prefix.length)) : undefined
}

export async function resolveOptimizationLabOnServer(context, cards) {
  const profileId = readCookie(context.req.headers.cookie, "ctfl-opt-aid")
  const requestOptimization = optimization.forRequest({
    consent: { events: true, persistence: true },
    locale: APP_LOCALE,
    eventContext: {
      locale: APP_LOCALE,
      page: {
        path: "/optimization-lab",
        query: {},
        referrer: context.req.headers.referer || "",
        search: "",
        title: "Optimization Troubleshooting Lab",
        url: `${context.req.headers["x-forwarded-proto"] || "https"}://${
          context.req.headers.host || "localhost"
        }/optimization-lab`,
      },
      userAgent: context.req.headers["user-agent"],
    },
    profile: profileId ? { id: profileId } : undefined,
  })

  const pageResult = await requestOptimization.page({
    properties: {
      route: "/optimization-lab",
      supportSurface: true,
    },
  })
  const selectedOptimizations = pageResult.accepted
    ? pageResult.data?.selectedOptimizations
    : undefined
  const resolvedCards = cards.map(
    (card) => optimization.resolveOptimizedEntry(card, selectedOptimizations).entry
  )
  const nextProfileId = pageResult.data?.profile?.id

  if (requestOptimization.canPersistProfile && nextProfileId) {
    const secure = process.env.NODE_ENV === "production" ? "; Secure" : ""
    const existingCookies = context.res.getHeader("Set-Cookie") || []
    const cookieList = Array.isArray(existingCookies)
      ? existingCookies
      : [existingCookies]
    context.res.setHeader("Set-Cookie", [
      ...cookieList.filter(Boolean),
      `ctfl-opt-aid=${encodeURIComponent(
        nextProfileId
      )}; Path=/; SameSite=Lax; Max-Age=31536000${secure}`,
    ])
  }

  return {
    accepted: pageResult.accepted,
    profileId: nextProfileId,
    resolvedCards,
    selectedOptimizations: selectedOptimizations || [],
  }
}
