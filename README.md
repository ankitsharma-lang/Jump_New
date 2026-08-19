# Jumpstart storefront

A public Next.js storefront for troubleshooting Contentful delivery, Live Preview,
Inspector Mode, Timeline Preview, localization, the Images API, and Contentful
Optimization.

## Run locally

1. Install Node.js 20 or newer.
2. Copy `.env.example` to `.env` and add the required Contentful and Optimization values.
3. Install dependencies with `npm install`.
4. Start the website with `npm run dev`.
5. Open `http://localhost:9019`.

The local source code is in `/Users/ankit.sharma/Documents/Jump_New`.

## Content ownership

Public editorial content is managed in the Contentful Web App:

- site name, navigation, footer, shared labels, and currency;
- home-page hero, SEO text, feature highlights, and product sections;
- product and category titles, descriptions, images, prices, and SEO text;
- English (`en-US`) and Deutsch (`de-DE`) field values;
- Optimization audiences, experiences, and variants.

Code owns application behavior that editors should not change: routes, API security,
preview controls, analytics event names, supported locale codes, responsive image
parameters, and visual styling. See [docs/contentful-content-model.md](docs/contentful-content-model.md)
for the complete boundary and editor workflow.

All changes must also follow [docs/clean-code-policy.md](docs/clean-code-policy.md).

## Validation

```bash
npm run lint
npm run test:preview
npm run test:features
npm run build
npm run test:e2e
```

## Personalization runtime

Personalized routes use request-scoped server rendering. The server passes Vercel's
request geolocation to Contentful Optimization through the SDK's supported event
context, creates a private request handoff, and hydrates the browser with the same
selection. Personalized HTML must never use a shared CDN or ISR cache.

The troubleshooting lab is always disabled on the production Vercel deployment. Any
future lab deployment must use a separate domain, Contentful environment, and
Optimization environment.

## Safe content-model changes

Do not run the legacy `npm run setup` command against an existing space; it was
created for importing the original demo into an empty space.

The current additive migration is `migrations/03-cms-managed-storefront.js`.
Always apply and test it in a cloned environment first, then promote the same
migration to the live environment. The idempotent content seed is
`scripts/setup-storefront-content.mjs` and selects its target through
`CONTENTFUL_MIGRATION_ENVIRONMENT`.
