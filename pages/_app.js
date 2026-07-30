import MainLayout from "../layouts/MainLayout"
import "../styles/globals.css"
import { ContentfulLivePreviewProvider } from "@contentful/live-preview/react"
import {
  NextPagesAutoPageTracker,
  OptimizationRoot,
} from "../lib/optimization"

function MyApp({ Component, pageProps }) {
  return (
    <ContentfulLivePreviewProvider locale="en-US">
      <OptimizationRoot>
        <NextPagesAutoPageTracker />
        <MainLayout>
          <Component {...pageProps} />
        </MainLayout>
      </OptimizationRoot>
    </ContentfulLivePreviewProvider>
  )
}

export default MyApp
