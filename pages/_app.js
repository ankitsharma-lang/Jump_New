import MainLayout from "../layouts/MainLayout"
import "../styles/globals.css"
import { ContentfulLivePreviewProvider } from "@contentful/live-preview/react"
import { useRouter } from "next/router"
import { OptimizationRoot } from "../lib/optimization"

function MyApp({ Component, pageProps }) {
  const router = useRouter()
  const locale = router.locale || "en-US"
  const routeKey = `${locale}:${router.asPath.split("?")[0]}`

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
