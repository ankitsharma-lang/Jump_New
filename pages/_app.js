// pages/_app.js
import MainLayout from "../layouts/MainLayout";
import "../styles/globals.css";
import { NinetailedProvider } from "@ninetailed/experience.js-next";
import { NinetailedInsightsPlugin } from "@ninetailed/experience.js-plugin-insights";

const plugins = [new NinetailedInsightsPlugin()];

function MyApp({ Component, pageProps }) {
  return (
    <NinetailedProvider
      clientId={process.env.NEXT_PUBLIC_CONTENTFUL_PERSONALIZATION_CLIENT_ID}
      environment={
        process.env.NEXT_PUBLIC_CONTENTFUL_PERSONALIZATION_ENVIRONMENT || "main"
      }
      plugins={plugins}
      componentViewTrackingThreshold={2000}
    >
      <MainLayout>
        <Component {...pageProps} />
      </MainLayout>
    </NinetailedProvider>
  );
}

export default MyApp;

