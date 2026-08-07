module.exports = function (migration) {
  const localizedShortText = (contentType, id, name, required = true) =>
    contentType
      .createField(id)
      .name(name)
      .type("Symbol")
      .localized(true)
      .required(required)
      .validations([{ size: { max: 256 } }])

  const localizedLongText = (contentType, id, name, required = true) =>
    contentType
      .createField(id)
      .name(name)
      .type("Text")
      .localized(true)
      .required(required)

  const siteSettings = migration
    .createContentType("siteSettings")
    .name("Site Settings")
    .description("Singleton settings and customer-facing interface copy for the Jumpstart storefront.")
    .displayField("internalName")

  siteSettings
    .createField("internalName")
    .name("Internal Name")
    .type("Symbol")
    .required(true)
    .validations([{ size: { max: 128 } }])
  siteSettings
    .createField("key")
    .name("Key")
    .type("Symbol")
    .required(true)
    .validations([
      { unique: true },
      { regexp: { pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$" } },
    ])
  localizedShortText(siteSettings, "siteName", "Site Name")
  localizedShortText(siteSettings, "siteTagline", "Site Tagline")
  localizedLongText(siteSettings, "defaultMetaDescription", "Default Meta Description")
  localizedShortText(siteSettings, "navigationLabel", "Navigation Label")
  localizedLongText(siteSettings, "footerDescription", "Footer Description")
  localizedShortText(siteSettings, "documentationLinkLabel", "Documentation Link Label")
  siteSettings
    .createField("documentationLinkUrl")
    .name("Documentation Link URL")
    .type("Symbol")
    .required(true)
    .validations([{ regexp: { pattern: "^https://" } }])
  localizedShortText(siteSettings, "productCardEyebrow", "Product Card Eyebrow")
  localizedShortText(siteSettings, "productCardCtaLabel", "Product Card CTA Label")
  localizedShortText(siteSettings, "productDetailEyebrow", "Product Detail Eyebrow")
  localizedShortText(siteSettings, "backToCollectionLabel", "Back To Collection Label")
  localizedShortText(siteSettings, "addToBagLabel", "Add To Bag Label")
  localizedLongText(siteSettings, "checkoutNote", "Checkout Note")
  localizedShortText(siteSettings, "personalizedLabel", "Personalized Status Label")
  localizedShortText(siteSettings, "baselineLabel", "Baseline Status Label")
  localizedShortText(siteSettings, "languageSelectorLabel", "Language Selector Label")
  localizedShortText(siteSettings, "productImageAltFallback", "Product Image Alt Fallback")
  localizedShortText(siteSettings, "imageToolEyebrow", "Image Tool Eyebrow")
  localizedShortText(siteSettings, "imageToolTitle", "Image Tool Title")
  localizedLongText(siteSettings, "imageToolDescription", "Image Tool Description")
  localizedShortText(siteSettings, "imageToolCopyLabel", "Image Tool Copy Label")
  siteSettings
    .createField("currencyCode")
    .name("Currency Code")
    .type("Symbol")
    .required(true)
    .validations([{ regexp: { pattern: "^[A-Z]{3}$" } }])

  siteSettings.changeFieldControl("key", "builtin", "slugEditor", {
    helpText: "Stable singleton key used by the website. Keep this as main.",
    trackingFieldId: "internalName",
  })
  siteSettings.changeFieldControl("documentationLinkUrl", "builtin", "urlEditor")

  const storefrontFeature = migration
    .createContentType("storefrontFeature")
    .name("Storefront Feature")
    .description("A short public feature/value pair shown on the storefront home page.")
    .displayField("internalName")

  storefrontFeature
    .createField("internalName")
    .name("Internal Name")
    .type("Symbol")
    .required(true)
    .validations([{ size: { max: 128 } }])
  localizedShortText(storefrontFeature, "label", "Label")
  localizedShortText(storefrontFeature, "value", "Value")

  const landingPage = migration.editContentType("landingPage")
  landingPage.description("A storefront landing page composed from reusable sections and Optimization experiences.")
  landingPage
    .editField("slug")
    .validations([
      { unique: true },
      { regexp: { pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$" } },
    ])
  landingPage.editField("headline").localized(true)
  localizedShortText(landingPage, "eyebrow", "Eyebrow")
  localizedLongText(landingPage, "intro", "Introduction")
  localizedShortText(landingPage, "primaryCtaLabel", "Primary CTA Label")
  localizedLongText(landingPage, "localeNotice", "Locale Notice", false)
  localizedShortText(landingPage, "seoTitle", "SEO Title")
  localizedLongText(landingPage, "seoDescription", "SEO Description")
  landingPage
    .createField("featureHighlights")
    .name("Feature Highlights")
    .type("Array")
    .required(false)
    .items({
      type: "Link",
      linkType: "Entry",
      validations: [{ linkContentType: ["storefrontFeature"] }],
    })
    .validations([{ size: { max: 8 } }])
  landingPage.changeFieldControl("slug", "builtin", "slugEditor", {
    helpText: "Stable URL identifier. Changing it changes the route.",
    trackingFieldId: "title",
  })

  const productSection = migration.editContentType("productSection")
  productSection.description("A reusable group of product references with localized public copy.")
  productSection.editField("title").localized(true)
  localizedShortText(productSection, "eyebrow", "Eyebrow")
  localizedLongText(productSection, "description", "Description")
  productSection.editField("products").validations([{ size: { min: 1, max: 12 } }])

  const product = migration.editContentType("product")
  product.description("A sellable storefront product with localized marketing copy and stable commerce data.")
  product.editField("title").localized(true)
  product.editField("description").localized(true)
  product
    .editField("slug")
    .validations([
      { unique: true },
      { regexp: { pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$" } },
    ])
  product.editField("price").validations([{ range: { min: 0 } }])
  product.editField("image").validations([{ linkMimetypeGroup: ["image"] }])
  localizedLongText(product, "seoDescription", "SEO Description")
  product.changeFieldControl("slug", "builtin", "slugEditor", {
    helpText: "Stable URL identifier. Changing it changes the public product URL.",
    trackingFieldId: "title",
  })

  const category = migration.editContentType("category")
  category.description("A reusable product classification with localized public copy.")
  category.editField("title").localized(true)
  category.editField("description").localized(true)
  category.editField("image").validations([{ linkMimetypeGroup: ["image"] }])
}
