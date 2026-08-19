import MainLayout from "../layouts/MainLayout"
import "../styles/globals.css"
import { ContentfulLivePreviewProvider } from "@contentful/live-preview/react"
import { useRouter } from "next/router"
import { useEffect } from "react"
import { OptimizationRoot } from "../lib/optimization"
import { getLinkedOptimizationExperienceIds } from "../lib/optimization-experiences"

function MyApp({ Component, pageProps }) {
  const router = useRouter()
  const locale = router.locale || "en-US"
  const routeKey = `${locale}:${router.asPath.split("?")[0]}`
  const linkedOptimizationExperienceIds = getLinkedOptimizationExperienceIds(
    pageProps.page,
    pageProps.product
  )

  useEffect(() => {
    if (!router.isReady || pageProps.previewStatus?.enabled) return

    const currentUrl = new URL(window.location.href)
    const previewKey = currentUrl.searchParams.get("previewKey")
    if (!previewKey) return

    const restoreUrl = new URL("/api/restore-preview", window.location.origin)
    restoreUrl.searchParams.set("path", currentUrl.pathname)
    restoreUrl.searchParams.set("timeline", currentUrl.searchParams.get("timeline") || "")
    restoreUrl.searchParams.set("previewKey", previewKey)
    window.location.replace(`${restoreUrl.pathname}${restoreUrl.search}`)
  }, [pageProps.previewStatus?.enabled, router.isReady])

  return (
    <ContentfulLivePreviewProvider
      locale={locale}
      enableInspectorMode={router.isPreview}
      enableLiveUpdates={router.isPreview}
    >
      <OptimizationRoot
        buildPagePayload={() => ({ properties: { route: routeKey, locale } })}
        handoff={pageProps.contentfulOptimization?.handoff}
        routeKey={routeKey}
      >
        <MainLayout
          linkedOptimizationExperienceIds={linkedOptimizationExperienceIds}
          localeOptions={pageProps.localeOptions}
          previewStatus={pageProps.previewStatus}
          previewWorkspace={pageProps.previewWorkspace}
          siteSettings={pageProps.siteSettings}
        >
          <Component {...pageProps} />
        </MainLayout>
      </OptimizationRoot>
    </ContentfulLivePreviewProvider>
  )
}

export default MyApp
