# Contentful Live Preview, Inspector Mode, and Timeline Preview

## Contentful content preview URL

Configure the homepage preview URL in Contentful as:

```text
https://YOUR_VERCEL_DOMAIN/api/preview?secret=YOUR_PREVIEW_SECRET&slug={entry.fields.slug}&timeline={timeline}
```

Use the same value for `PREVIEW_SECRET` in Vercel. Keep this variable server-only; do not prefix new secrets with `NEXT_PUBLIC_`.

## What each feature does

- **Draft preview** fetches unpublished content from Contentful's Preview API.
- **Live updates** refresh visible field values while an editor changes an entry.
- **Inspector Mode** makes the headline, section, product image, title, description, price, and slug clickable in the Contentful preview iframe.
- **Timeline Preview** sends the selected release and/or scheduled time to every Contentful Preview API request. It does not change normal Delivery API traffic.

The preview API validates the Timeline token, stores it in an encrypted, HTTP-only Next.js preview cookie, and retains it in the redirected URL. The homepage then creates a Contentful Preview API client using the SDK's official `timelinePreview` option.

## Quick check

1. Open the homepage entry in Contentful.
2. Open Live Preview and confirm draft changes appear without publishing.
3. Turn on Inspector Mode and click a product title; Contentful should select that field.
4. Open Timeline, select a release or date, and verify the preview changes to that state.
5. Visit `/api/disable-preview` to return to published content.

References: [Live Preview](https://www.contentful.com/developers/docs/tutorials/general/live-preview/), [Inspector Mode](https://www.contentful.com/developers/docs/tutorials/general/live-preview/#inspector-mode), and [Timeline Preview](https://www.contentful.com/help/timeline-preview/).
