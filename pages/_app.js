import MainLayout from "../layouts/MainLayout"
import "../styles/globals.css"
import { ContentfulLivePreviewProvider } from "@contentful/live-preview/react"
import { useRouter } from "next/router"
import { OptimizationRoot } from "../lib/optimization"

function MyApp({ Component, pageProps }) {
  const router = useRouter()
  const routeKey = router.pathname

  return (
    <ContentfulLivePreviewProvider
      locale="en-US"
      enableInspectorMode={router.isPreview}
      enableLiveUpdates={router.isPreview}
    >
      <OptimizationRoot
        buildPagePayload={() => ({ properties: { route: routeKey } })}
        handoff={pageProps.contentfulOptimization?.handoff}
        routeKey={routeKey}
      >
        <MainLayout>
          <Component {...pageProps} />
        </MainLayout>
      </OptimizationRoot>
    </ContentfulLivePreviewProvider>
  )
}

export default MyApp
