
import MainLayout from "../layouts/MainLayout";
import "../styles/globals.css";
import { NinetailedProvider } from "@ninetailed/experience.js-next";
import { NinetailedInsightsPlugin } from "@ninetailed/experience.js-plugin-insights";
import { ContentfulLivePreviewProvider } from "@contentful/live-preview/react";

const plugins = [new NinetailedInsightsPlugin()];

function MyApp({ Component, pageProps }) {
  const isPreview = pageProps.__N_PREVIEW || false

  return (
    <ContentfulLivePreviewProvider
      locale="en-US"
      enableInspectorMode={isPreview}
      enableLiveUpdates={isPreview}
      debugMode={isPreview}
    >
      <NinetailedProvider
        clientId={process.env.NEXT_PUBLIC_CONTENTFUL_PERSONALIZATION_CLIENT_ID}
        environment={
          process.env.NEXT_PUBLIC_CONTENTFUL_PERSONALIZATION_ENVIRONMENT || "main"
        }
        plugins={plugins}
        componentViewTrackingThreshold={2000}
      >
        {isPreview && (
          <div style={{
            background: '#f59e0b',
            color: '#78350f',
            textAlign: 'center',
            padding: '8px',
            fontSize: '14px',
            fontWeight: '600',
            position: 'sticky',
            top: 0,
            zIndex: 9999,
          }}>
            Preview Mode active —{' '}
            <a href="/api/disable-preview" style={{ textDecoration: 'underline', fontWeight: 'bold' }}>
              Exit Preview
            </a>
          </div>
        )}
        <MainLayout>
          <Component {...pageProps} />
        </MainLayout>
      </NinetailedProvider>
    </ContentfulLivePreviewProvider>
  )
}

export default MyApp;