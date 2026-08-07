# Contentful content model and editor workflow

## What editors manage

The storefront treats Contentful as the source of truth for public content.

| Content type | Purpose | Localized fields |
| --- | --- | --- |
| Site Settings | One `main` entry for brand, navigation, footer, shared labels, currency, and all public image-tool copy | Public text fields |
| Landing Page | Home-page hero, CTA, SEO, feature references, sections, and Optimization experiences | Headline, hero copy, CTA, locale notice, and SEO |
| Storefront Feature | Reusable capability/value cards in the home hero | Label and value |
| Product Section | Reusable group of linked products | Title, eyebrow, and description |
| Product | Product marketing content, price, image, categories, and Optimization experiences | Title, description, and SEO description |
| Category | Reusable product classification | Title and description |

Structural relationships stay as references. The existing `nt_experiences` fields
remain untouched so Contentful Optimization can resolve variants. Product and
landing-page slugs are intentionally not localized: one stable slug keeps links,
preview routes, webhook revalidation, and analytics consistent across languages.

## What remains in code

“No hardcoded content” means no public editorial copy is trapped in components.
Some values must remain code-owned because they define application or security
behavior rather than content:

- route shapes and the `home-page` lookup key;
- the supported locale codes `en-US` and `de-DE`;
- API error messages and webhook authentication rules;
- preview diagnostic labels and image transformation option names;
- Optimization event names and internal troubleshooting defaults;
- layout, colors, breakpoints, and image sizes.

Moving these into entries would let an editor accidentally break routing,
authentication, instrumentation, or rendering and would not be a safe content model.

## Edit and preview content

1. In the Contentful Web App, select the required environment.
2. Open **Content** and edit the Site Settings, Home Page, Product Section, Product,
   Category, or Storefront Feature entry.
3. Select **English** or **Deutsch** in the locale selector.
4. Use Live Preview and Inspector Mode to inspect drafts before publishing.
5. Publish only the required locale when making a normal editorial change.

Deutsch falls back to English when a localized field is empty. This prevents a blank
page while translation is incomplete. The preview comparison still reports the field
as missing so the fallback is not mistaken for a completed translation.

## Releases and Timeline Preview

Add related entries and assets to a release when they must go live together. Select
that release in Live Preview to see its expected result. Releases cannot publish only
one locale; Contentful executes all locales in the release together.

Timeline Preview answers “what will the page look like after this release or at this
future date?” It does not create a separate editable copy of an entry.

## Content-model safeguards

- slugs are unique and validated as URL-safe identifiers;
- product prices cannot be negative;
- product and category media fields accept images only;
- product sections contain between 1 and 12 products;
- references are restricted to the intended content types;
- the Site Settings key is unique and the documentation URL must use HTTPS;
- public copy is localized while stable identifiers and structural links are shared.

## Safe deployment process

Model changes are migration files kept with the application code. Apply a migration
to a cloned environment, seed or update test content, build and inspect the site, and
only then apply the identical migration to the live environment. This project used
the `codex-storefront-cms` clone for that verification.

Useful Contentful documentation:

- [Content models](https://www.contentful.com/help/content-models/)
- [Localization strategies](https://www.contentful.com/help/localization/field-and-entry-localization/)
- [Locale-based publishing](https://www.contentful.com/help/localization/locale-based-publishing/)
- [Create and deploy content-type changes](https://www.contentful.com/developers/docs/tutorials/general/create-and-deploy-content-type-changes/)
- [Deploy with environment aliases](https://www.contentful.com/developers/docs/tutorials/general/deploying-changes-with-environment-aliases/)
