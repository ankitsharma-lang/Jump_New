# Public storefront and preview tools

The storefront keeps customer-facing features on the normal home and product routes. It does not add a new troubleshooting lab.

## Preview status and content comparison

The blue **Contentful Preview** bar appears only when Next.js preview mode is active. It shows whether the page is displaying current drafts, a selected release, or a Timeline date, together with the Contentful environment and locale.

Choose **Open preview tools** to compare:

- published Delivery API content,
- the latest Preview API draft,
- the release or date selected in Timeline Preview.

The Relationships tab displays the resolved entry and asset tree. The Locales tab shows which fields have authored values in English and Deutsch; a fallback value is not counted as a translation.

## Localization

The configured routes are:

- `en-US` — default locale
- `de-DE` — named **Deutsch** in the Web App and falls back to English when a German value is empty

The public language selector retains the current route and changes the Next.js locale.

Locale-based publishing is enabled per Contentful environment. Normal entry publishing can publish English and Deutsch independently. Contentful releases and scheduled actions always publish every locale together; this is a Contentful platform limitation.

## Image delivery controls

Every product details page contains **Image delivery controls**. They build a real Contentful Images API URL and let a visitor test fit, focal area, output format, and quality. Product imagery on the store uses a padded, responsive WebP transformation by default.

## Public personalization

The home page, product sections, product cards, and product details keep application-fetched Contentful entries as `baselineEntry` values. Personalized routes are rendered per request, and the browser preserves the server's Contentful Optimization selection during hydration. The homepage baseline shows both collections to non-UK visitors; the UK-targeted variant shows only the UK collection. Product cards track views, clicks, and hovers; the product action sends an `add_to_cart` event.

## Secure webhook revalidation

Set a server-only environment variable in Vercel:

```text
CONTENTFUL_WEBHOOK_SECRET=use-a-long-random-value
```

Configure the Contentful webhook as follows:

```text
POST https://YOUR_DOMAIN/api/webhook
X-Contentful-Webhook-Secret: the-same-long-random-value
```

The endpoint rejects other HTTP methods, compares the secret in constant time, limits the parsed payload size, accepts only safe product slugs, never logs webhook content or credentials, and revalidates the home page plus localized product paths. A Bearer token with the same secret is also accepted.

The secret is application infrastructure, not editorial content. Keep it only in Vercel and the private Contentful webhook header; never put it in an entry or a `NEXT_PUBLIC_` variable.
