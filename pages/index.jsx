import _ from "lodash"
import Head from "next/head"
import ProductSection from "../components/ProductSection"
import siteLocales from "../config/locales"
import {
  createPreviewWorkspace,
  sanitizeContentful,
} from "../lib/contentful-diagnostics"
import {
  getContentfulEnvironment,
  getEntryByIdAllLocales,
  getLocalizedEntryBySlug,
} from "../lib/helpers"
import { OptimizedEntry } from "../lib/optimization"
import { getSiteContent } from "../lib/site-content"
import { useOptimizationContext } from "@contentful/optimization-nextjs/client"
import { getPreviewStatus } from "../lib/contentful-preview.mjs"
import {
  useContentfulLiveUpdates,
  useContentfulInspectorMode,
} from "@contentful/live-preview/react"

function LandingPage({ baselineEntry, entry, locale = siteLocales.defaultLocale, siteSettings }) {
  const live = useContentfulLiveUpdates(entry)
  const inspectorProps = useContentfulInspectorMode({ entryId: live?.sys?.id })
  const fields = { ...(baselineEntry?.fields || {}), ...(live?.fields || {}) }
  const sections = fields.sections
  const headline = fields.headline
  const settings = siteSettings?.fields || {}
  const featureHighlights = fields.featureHighlights || []

  return (
    <div>
      <Head>
        <title>{fields.seoTitle || settings.siteName || headline}</title>
        <meta content={fields.seoDescription || settings.defaultMetaDescription || ""} name="description" />
      </Head>

      <section className="relative isolate overflow-hidden bg-[#071a3d] text-white">
        <div className="absolute inset-0 -z-10 opacity-80 [background:radial-gradient(circle_at_15%_20%,rgba(56,189,248,0.28),transparent_32%),radial-gradient(circle_at_85%_30%,rgba(99,102,241,0.3),transparent_35%)]" />
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 sm:py-28 lg:grid-cols-[1fr_0.55fr] lg:px-8">
          <div>
            <p
              className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300"
              {...inspectorProps({ fieldId: "eyebrow" })}
            >
              {fields.eyebrow}
            </p>
            <h1
              className="mt-5 max-w-4xl text-4xl font-black leading-[1.03] tracking-[-0.04em] sm:text-6xl lg:text-7xl"
              {...inspectorProps({ fieldId: "headline" })}
            >
              {headline}
            </h1>
            <p
              className="mt-6 max-w-2xl text-base leading-7 text-blue-100 sm:text-lg"
              {...inspectorProps({ fieldId: "intro" })}
            >
              {fields.intro}
            </p>
            <a
              className="mt-8 inline-flex rounded-full bg-cyan-300 px-6 py-3 text-sm font-black text-blue-950 shadow-lg shadow-cyan-950/30 transition hover:-translate-y-0.5 hover:bg-cyan-200"
              href="#collection"
            >
              {fields.primaryCtaLabel} ↓
            </a>
          </div>

          <div className="hidden self-end rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur sm:block">
            <div className="grid grid-cols-2 gap-3 text-sm">
              {featureHighlights.map((feature) => (
                <div className="rounded-2xl bg-white/10 p-4" key={feature.sys.id}>
                  <p className="text-xs text-blue-200">{feature.fields.label}</p>
                  <p className="mt-1 font-bold text-white">{feature.fields.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {locale !== siteLocales.defaultLocale ? (
        <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
          <p className="rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 text-sm leading-6 text-blue-950">
            {fields.localeNotice}
          </p>
        </div>
      ) : null}

      <div
        className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8"
        id="collection"
        {...inspectorProps({ fieldId: "sections" })}
      >
        {Array.isArray(sections)
          ? sections.map((section) => {
              const contentType = _.get(section, "sys.contentType.sys.id")
              const sectionId = _.get(section, "sys.id")
              if (contentType === "productSection") {
                return (
                  <OptimizedEntry
                    baselineEntry={section}
                    key={sectionId}
                    liveUpdates
                    trackViews
                  >
                    {(resolvedSection) => (
                      <ProductSection
                        baselineEntry={section}
                        entry={resolvedSection}
                        key={resolvedSection?.sys?.id || sectionId}
                        siteSettings={siteSettings}
                      />
                    )}
                  </OptimizedEntry>
                )
              }
              return null
            })
          : null}
      </div>
    </div>
  )
}

export default function Home({ locale, page, siteSettings }) {
  const { error } = useOptimizationContext()

  if (!page?.sys?.id || error) {
    return (
      <LandingPage
        baselineEntry={page}
        entry={page}
        locale={locale}
        siteSettings={siteSettings}
      />
    )
  }

  return (
    <OptimizedEntry baselineEntry={page} clickable liveUpdates trackViews trackClicks trackHovers>
      {(resolvedPage) => (
        <LandingPage
          baselineEntry={page}
          entry={resolvedPage}
          key={resolvedPage?.sys?.id || page.sys.id}
          locale={locale}
          siteSettings={siteSettings}
        />
      )}
    </OptimizedEntry>
  )
}

export async function getStaticProps(context) {
  // setPreviewData carries the Timeline token; draftMode remains supported for
  // preview links that do not provide one.
  const preview = Boolean(context.draftMode || context.preview)
  const timeline = context.previewData?.timeline || null
  const locale = context.locale || siteLocales.defaultLocale

  const [pageEntries, siteContent] = await Promise.all([
    getLocalizedEntryBySlug(
      "landingPage",
      "home-page",
      preview,
      timeline,
      locale,
      siteLocales.defaultLocale
    ),
    getSiteContent({ locale, preview, timeline }),
  ])
  const homepageEntry = _.get(pageEntries, "items[0]", {})
  let previewWorkspace = null

  if (preview && homepageEntry?.sys?.id) {
    const [publishedEntries, currentEntries, allLocales] = await Promise.all([
      getLocalizedEntryBySlug(
        "landingPage",
        "home-page",
        false,
        null,
        locale,
        siteLocales.defaultLocale
      ),
      getLocalizedEntryBySlug(
        "landingPage",
        "home-page",
        true,
        null,
        locale,
        siteLocales.defaultLocale
      ),
      getEntryByIdAllLocales(homepageEntry.sys.id, true),
    ])

    previewWorkspace = createPreviewWorkspace({
      published: _.get(publishedEntries, "items[0]", {}),
      current: _.get(currentEntries, "items[0]", {}),
      selected: homepageEntry,
      allLocales: allLocales || homepageEntry,
      locales: siteLocales.locales,
    })
  }

  const previewStatus = getPreviewStatus({
    preview,
    timeline,
    locale,
    environment: getContentfulEnvironment(),
  })

  return {
    props: sanitizeContentful({
      locale,
      page: homepageEntry,
      ...siteContent,
      previewStatus,
      previewWorkspace,
    }),
    revalidate: 30,
  }
}
