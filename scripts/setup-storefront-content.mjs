import "dotenv/config"
import contentfulManagement from "contentful-management"

const { createClient } = contentfulManagement

const defaultLocale = "en-US"
const germanLocale = "de-DE"
const locale = (english, german) => ({
  [defaultLocale]: english,
  [germanLocale]: german,
})
const englishOnly = (value) => ({ [defaultLocale]: value })
const entryLink = (id) => ({ sys: { type: "Link", linkType: "Entry", id } })

const spaceId = process.env.CONTENTFUL_SPACE_ID || process.env.NEXT_PUBLIC_SPACE_ID
const environmentId =
  process.env.CONTENTFUL_MIGRATION_ENVIRONMENT ||
  process.env.CONTENTFUL_ENVIRONMENT ||
  process.env.NEXT_PUBLIC_ENVIRONMENT ||
  "master"
const managementToken = process.env.CONTENTFUL_MANAGEMENT_TOKEN || process.env.CMA_TOKEN

if (!spaceId || !managementToken) {
  throw new Error("Missing Contentful space ID or management token.")
}

function richText(parts) {
  return {
    nodeType: "document",
    data: {},
    content: parts.map((part) => ({
      nodeType: "paragraph",
      data: {},
      content: [
        {
          nodeType: "text",
          value: part,
          marks: [],
          data: {},
        },
      ],
    })),
  }
}

function isNotFound(error) {
  return error?.name === "NotFound" || error?.sys?.id === "NotFound"
}

async function ensureEntry(environment, { id, contentType, fields, publish = true }) {
  let entry
  try {
    entry = await environment.getEntry(id)
    if (entry.isArchived()) entry = await entry.unarchive()
    entry.fields = { ...entry.fields, ...fields }
    entry = await entry.update()
  } catch (error) {
    if (!isNotFound(error)) throw error
    entry = await environment.createEntryWithId(contentType, id, { fields })
  }

  if (publish && (!entry.isPublished() || entry.sys.version > entry.sys.publishedVersion + 1)) {
    entry = await entry.publish()
  }
  return entry
}

async function addLocalizedFields(environment, id, fields) {
  let entry = await environment.getEntry(id)
  entry.fields = { ...entry.fields, ...fields }
  const wasPublished = entry.isPublished()
  entry = await entry.update()
  if (wasPublished) entry = await entry.publish()
  return entry
}

async function addGermanAssetMetadata(environment, id, title, description) {
  let asset = await environment.getAsset(id)
  const wasPublished = asset.isPublished()
  asset.fields.title = { ...(asset.fields.title || {}), [germanLocale]: title }
  asset.fields.description = {
    ...(asset.fields.description || {}),
    [germanLocale]: description,
  }
  asset = await asset.update()
  if (wasPublished) asset = await asset.publish()
  return asset
}

const client = createClient({ accessToken: managementToken })
const space = await client.getSpace(spaceId)
const environment = await space.getEnvironment(environmentId)

const featureEntries = [
  {
    id: "storefrontFeatureLivePreview",
    internalName: "Live Preview capability",
    label: ["Live Preview", "Live-Vorschau"],
    value: ["Ready", "Bereit"],
  },
  {
    id: "storefrontFeatureLocalization",
    internalName: "Localization capability",
    label: ["Localization", "Lokalisierung"],
    value: ["English + Deutsch", "Englisch + Deutsch"],
  },
  {
    id: "storefrontFeatureOptimization",
    internalName: "Optimization capability",
    label: ["Optimization", "Optimierung"],
    value: ["Active", "Aktiv"],
  },
  {
    id: "storefrontFeatureImages",
    internalName: "Images API capability",
    label: ["Images API", "Bilder-API"],
    value: ["Responsive", "Responsiv"],
  },
]

for (const feature of featureEntries) {
  await ensureEntry(environment, {
    id: feature.id,
    contentType: "storefrontFeature",
    fields: {
      internalName: englishOnly(feature.internalName),
      label: locale(...feature.label),
      value: locale(...feature.value),
    },
  })
}

await ensureEntry(environment, {
  id: "storefrontSiteSettings",
  contentType: "siteSettings",
  fields: {
    internalName: englishOnly("Jumpstart storefront settings"),
    key: englishOnly("main"),
    siteName: locale("Jumpstart Shop", "Jumpstart Shop"),
    siteTagline: locale("Powered by Contentful", "Bereitgestellt mit Contentful"),
    defaultMetaDescription: locale(
      "A Contentful-powered storefront with live preview, localization, responsive assets, and personalized product experiences.",
      "Ein Contentful-basierter Store mit Live-Vorschau, Lokalisierung, responsiven Medien und personalisierten Produkterlebnissen."
    ),
    navigationLabel: locale("Collection", "Kollektion"),
    footerDescription: locale(
      "A polished storefront for testing Contentful delivery, preview, localization, assets, releases, and personalized experiences.",
      "Ein moderner Store zum Testen von Contentful-Auslieferung, Vorschau, Lokalisierung, Medien, Releases und personalisierten Erlebnissen."
    ),
    documentationLinkLabel: locale(
      "Contentful developer documentation",
      "Contentful-Entwicklerdokumentation"
    ),
    documentationLinkUrl: englishOnly("https://www.contentful.com/developers/docs/"),
    productCardEyebrow: locale("Featured product", "Ausgewähltes Produkt"),
    productCardCtaLabel: locale("View product", "Produkt ansehen"),
    productDetailEyebrow: locale("Jumpstart original", "Jumpstart Original"),
    backToCollectionLabel: locale("Back to the collection", "Zurück zur Kollektion"),
    addToBagLabel: locale("Add to bag", "In den Warenkorb"),
    checkoutNote: locale(
      "Demo checkout action tracked through Contentful Optimization",
      "Die Demo-Warenkorbaktion wird über Contentful Optimization erfasst"
    ),
    personalizedLabel: locale("Personalized for this visit", "Für diesen Besuch personalisiert"),
    baselineLabel: locale("Curated storefront", "Kuratierter Store"),
    languageSelectorLabel: locale("Website language", "Website-Sprache"),
    productImageAltFallback: locale("Product image", "Produktbild"),
    imageToolEyebrow: locale("Contentful Images API", "Contentful Bilder-API"),
    imageToolTitle: locale("Image delivery controls", "Steuerung der Bildauslieferung"),
    imageToolDescription: locale(
      "Change the crop, focal area, format, and quality to diagnose how this asset behaves in a real frame.",
      "Ändere Zuschnitt, Fokusbereich, Format und Qualität, um das Verhalten dieses Assets in einem echten Rahmen zu prüfen."
    ),
    imageToolCopyLabel: locale("Copy transformed URL", "Transformierte URL kopieren"),
    imageToolFitLabel: locale("Fit", "Anpassung"),
    imageToolFocusLabel: locale("Focus", "Fokus"),
    imageToolFormatLabel: locale("Format", "Format"),
    imageToolQualityLabel: locale("Quality", "Qualität"),
    imageToolOriginalSizeLabel: locale("Original size", "Originalgröße"),
    imageToolOriginalFileLabel: locale("Original file", "Originaldatei"),
    unknownValueLabel: locale("Unknown", "Unbekannt"),
    currencyCode: englishOnly("USD"),
  },
})

await addLocalizedFields(environment, "7crGJXefF4mDkLckuTKmHd", {
  headline: locale("Welcome to the Jumpstart Shop", "Willkommen im Jumpstart Shop"),
  eyebrow: locale("Contentful-powered collection", "Kollektion mit Contentful"),
  intro: locale(
    "Thoughtful essentials, delivered through structured content and tailored for every visit.",
    "Ausgewählte Essentials aus strukturierten Inhalten, passend für jeden Besuch."
  ),
  primaryCtaLabel: locale("Browse the collection", "Kollektion entdecken"),
  localeNotice: locale(
    "This page is authored in Contentful. Missing German values fall back to English.",
    "Diese Seite wird in Contentful gepflegt. Fehlende deutsche Werte greifen auf Englisch zurück."
  ),
  seoTitle: locale("Jumpstart Shop", "Jumpstart Shop"),
  seoDescription: locale(
    "Explore the Contentful-powered Jumpstart collection.",
    "Entdecke die Contentful-basierte Jumpstart-Kollektion."
  ),
  featureHighlights: englishOnly(featureEntries.map((feature) => entryLink(feature.id))),
})

await addLocalizedFields(environment, "2MCY1xv4xiMTmUlOYEB8Md", {
  headline: locale("Concept Hoodie", "CORE Concept Hoodie"),
  eyebrow: locale("A tailored collection", "Eine personalisierte Kollektion"),
  intro: locale(
    "A focused product selection tailored through Contentful Optimization.",
    "Eine gezielte Produktauswahl, personalisiert mit Contentful Optimization."
  ),
  primaryCtaLabel: locale("Browse the collection", "Kollektion entdecken"),
  seoTitle: locale("Concept Hoodie Collection", "CORE Concept Hoodie Kollektion"),
  seoDescription: locale(
    "Explore a tailored Jumpstart product collection.",
    "Entdecke eine personalisierte Jumpstart-Produktkollektion."
  ),
})

await addLocalizedFields(environment, "setlRNA7yYQQ1COtVvQYH", {
  title: locale("All Users Collection", "Kollektion für alle"),
  eyebrow: locale("The collection", "Die Kollektion"),
  description: locale(
    "Contentful entries enhanced with responsive assets, preview tools, and visitor-aware experiences.",
    "Contentful-Einträge mit responsiven Medien, Vorschauwerkzeugen und besucherbezogenen Erlebnissen."
  ),
})

await addLocalizedFields(environment, "7Dic3an7QMyPet2PIErkwI", {
  title: locale("UK Collection", "UK-Kollektion"),
  eyebrow: locale("The collection", "Die Kollektion"),
  description: locale(
    "A focused selection for visitors interested in the UK collection.",
    "Eine gezielte Auswahl für Besucher, die sich für die UK-Kollektion interessieren."
  ),
})

await addLocalizedFields(environment, "Rvc3xwFIw5xvMfHxhT8uG", {
  title: locale("Contentful's legendary coffee mug", "Contentfuls legendäre Kaffeetasse"),
  description: {
    [defaultLocale]: (await environment.getEntry("Rvc3xwFIw5xvMfHxhT8uG")).fields.description[defaultLocale],
    [germanLocale]: richText([
      "Sollen wir das Geheimnis lüften? Gerüchten zufolge ist Jims Tasse magisch.",
      "Gieße irgendeinen Kaffee hinein und sie verwandelt ihn in die aromatischste Tasse Kaffee, die du je erlebt hast. Ein Wort beschreibt sie am besten: legendär! Sichere dir Jims legendäre Kaffeetasse, solange der Vorrat reicht.",
    ]),
  },
  seoDescription: locale(
    "Discover Contentful's legendary coffee mug in the Jumpstart Shop.",
    "Entdecke Contentfuls legendäre Kaffeetasse im Jumpstart Shop."
  ),
})

await addLocalizedFields(environment, "3yjqD0zdDFUwNH629GCItz", {
  title: locale("CORE Concept Hoodie", "CORE Concept Hoodie"),
  description: {
    [defaultLocale]: (await environment.getEntry("3yjqD0zdDFUwNH629GCItz")).fields.description[defaultLocale],
    [germanLocale]: richText([
      "C.O.R.E. – Create once, reuse everywhere! Dieser Hoodie passt perfekt zu all deinen Lieblingshosen.",
    ]),
  },
  seoDescription: locale(
    "Discover the CORE Concept Hoodie in the Jumpstart Shop.",
    "Entdecke den CORE Concept Hoodie im Jumpstart Shop."
  ),
})

await addLocalizedFields(environment, "5M8yfs7rRfZ8KVpkepfeHe", {
  title: locale("Merchandise", "Merchandise"),
  description: locale("Contentful merchandise", "Contentful-Merchandise"),
})
await addLocalizedFields(environment, "7hVI3sE8aS7ViIwheli3fy", {
  title: locale("Gift items", "Geschenkartikel"),
  description: locale("Gift items", "Geschenkartikel"),
})
await addLocalizedFields(environment, "590aUv4nfxndZlavSpU4rP", {
  title: locale("Clothing", "Bekleidung"),
  description: locale("Clothing items", "Bekleidungsartikel"),
})

await addGermanAssetMetadata(
  environment,
  "4KLpxtqb8Lv4WIVjPF3JVS",
  "Contentfuls legendäre Kaffeetasse",
  "Weiße Contentful-Kaffeetasse"
)
await addGermanAssetMetadata(
  environment,
  "73OYdjzfQ0XMkJQDanmbON",
  "CORE Concept Hoodie",
  "Contentful CORE Concept Hoodie"
)

const locales = await environment.getLocales()
const english = locales.items.find((item) => item.code === defaultLocale)
if (english && english.name !== "English") {
  english.name = "English"
  await english.update()
}
const german = locales.items.find((item) => item.code === germanLocale)
if (german && german.name !== "Deutsch") {
  german.name = "Deutsch"
  await german.update()
}
const arabic = locales.items.find((item) => item.code === "ar-JO")
if (arabic) await arabic.delete()

console.log(`Storefront content is configured in ${environmentId} for en-US and de-DE.`)
