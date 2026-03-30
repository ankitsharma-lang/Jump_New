import { Ninetailed } from "@ninetailed/experience.js";
import { NinetailedInsightsPlugin } from "@ninetailed/experience.js-plugin-insights";

export const nt = new Ninetailed(
  {
    clientId: process.env.NEXT_PUBLIC_CONTENTFUL_PERSONALIZATION_CLIENT_ID,
    environment:
      process.env.NEXT_PUBLIC_CONTENTFUL_PERSONALIZATION_ENVIRONMENT || "main",
  },
  {
    plugins: [new NinetailedInsightsPlugin()],
    componentViewTrackingThreshold: 2000,
  }
);

nt.debug(true);