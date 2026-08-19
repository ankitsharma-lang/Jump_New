import { documentToReactComponents } from "@contentful/rich-text-react-renderer"
import {
  useContentfulInspectorMode,
  useContentfulLiveUpdates,
} from "@contentful/live-preview/react"
import { useOptimizationActions, useOptimizationContext } from "@contentful/optimization-nextjs/client"
import _ from "lodash"
import Head from "next/head"
import { useRouter } from "next/router"
import ImageComponent from "../../components/ImageComponent"
import ImageTroubleshooter from "../../components/ImageTroubleshooter"
import siteLocales from "../../config/locales"
import {
  createPreviewWorkspace,
  sanitizeContentful,
} from "../../lib/contentful-diagnostics"
import { getPreviewStatus } from "../../lib/contentful-preview.mjs"
import {
  getContentfulEnvironment,
  getEntriesByContentType,
  getEntryByIdAllLocales,
  getLocalizedEntryBySlug,
} from "../../lib/helpers"
import { OptimizedEntry } from "../../lib/optimization"
import richtextRenderOptions from "../../lib/richtextRenderOptions"
import { getSiteContent } from "../../lib/site-content"

const ProductDetails = ({ baselineProduct, product, siteSettings }) => {
  const router = useRouter()
  const { trackEvent } = useOptimizationActions()
  const liveProduct = useContentfulLiveUpdates(product)
  const inspectorProps = useContentfulInspectorMode({ entryId: liveProduct?.sys?.id })
  const fields = { ...(baselineProduct?.fields || {}), ...(liveProduct?.fields || {}) }
  const settings = siteSettings?.fields || {}
  const title = fields.title || ""
  const price = new Intl.NumberFormat(router.locale || siteLocales.defaultLocale, {
    style: "currency",
    currency: settings.currencyCode || "USD",
    maximumFractionDigits: 0,
  }).format(fields.price || 0)

  const trackProductAction = () =>
    trackEvent({
      event: "add_to_cart",
      properties: {
        product: fields.slug,
        name: title,
        price: fields.price,
        source: "product-detail",
      },
    })

  return (
    <>
      <Head>
        <title>{`${title} | ${settings.siteName || ""}`}</title>
        <meta content={fields.seoDescription || settings.defaultMetaDescription || ""} name="description" />
      </Head>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
        <button
          className="mb-8 text-sm font-bold text-blue-700 transition hover:text-blue-900"
          onClick={() => router.push("/")}
          type="button"
        >
          ← {settings.backToCollectionLabel}
        </button>

        <article className="grid overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl shadow-slate-900/10 lg:grid-cols-2">
          <div
            className="flex min-h-[440px] items-center justify-center bg-[linear-gradient(135deg,#dbeafe_0%,#ecfeff_100%)] p-8 sm:p-12"
            {...inspectorProps({ fieldId: "image" })}
          >
            <ImageComponent
              altFallback={settings.productImageAltFallback}
              image={fields.image}
            />
          </div>

          <div className="flex flex-col justify-center p-8 sm:p-12 lg:p-14">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-blue-600">
              {settings.productDetailEyebrow}
            </p>
            <h1
              className="mt-4 text-4xl font-black leading-tight tracking-[-0.035em] text-slate-950 sm:text-5xl"
              {...inspectorProps({ fieldId: "title" })}
            >
              {title}
            </h1>
            <p
              className="mt-5 text-3xl font-black text-blue-700"
              {...inspectorProps({ fieldId: "price" })}
            >
              {price}
            </p>
            <div
              className="mt-7 text-base leading-7 text-slate-600"
              {...inspectorProps({ fieldId: "description" })}
            >
              {fields.description
                ? documentToReactComponents(fields.description, richtextRenderOptions)
                : null}
            </div>
            <button
              className="mt-8 rounded-xl bg-slate-950 px-6 py-4 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-blue-700"
              onClick={trackProductAction}
              type="button"
            >
              {settings.addToBagLabel} · {price}
            </button>
            <p className="mt-4 text-center text-xs text-slate-400">
              {settings.checkoutNote}
            </p>
          </div>
        </article>

        <div className="mt-10">
          <ImageTroubleshooter image={fields.image} settings={settings} />
        </div>
      </div>
    </>
  )
}

const ProductPage = ({ product, siteSettings }) => {
  const { error } = useOptimizationContext()

  if (!product?.sys?.id || error) {
    return (
      <ProductDetails
        baselineProduct={product}
        product={product}
        siteSettings={siteSettings}
      />
    )
  }

  return (
    <OptimizedEntry
      baselineEntry={product}
      clickable
      liveUpdates
      trackClicks
      trackHovers
      trackViews
    >
      {(resolvedProduct) => (
        <ProductDetails
          baselineProduct={product}
          key={resolvedProduct?.sys?.id || product.sys.id}
          product={resolvedProduct}
          siteSettings={siteSettings}
        />
      )}
    </OptimizedEntry>
  )
}

export async function getStaticPaths() {
  const productEntries = await getEntriesByContentType("product")
  const products = productEntries?.items || []
  const paths = products.flatMap((entry) => {
    const slug = _.get(entry, "fields.slug")
    if (!slug) return []
    return siteLocales.locales.map((locale) => ({ params: { slug }, locale }))
  })

  return {
    paths,
    fallback: "blocking",
  }
}

export async function getStaticProps(context) {
  const slug = _.get(context, "params.slug")
  const preview = Boolean(context.draftMode || context.preview)
  const timeline = context.previewData?.timeline || null
  const locale = context.locale || siteLocales.defaultLocale
  const [productEntries, siteContent] = await Promise.all([
    getLocalizedEntryBySlug(
      "product",
      slug,
      preview,
      timeline,
      locale,
      siteLocales.defaultLocale
    ),
    getSiteContent({ locale, preview, timeline }),
  ])
  const product = _.get(productEntries, "items[0]")

  if (!product?.sys?.id) {
    return { notFound: true, revalidate: 30 }
  }

  let previewWorkspace = null
  if (preview) {
    const [publishedEntries, currentEntries, allLocales] = await Promise.all([
      getLocalizedEntryBySlug(
        "product",
        slug,
        false,
        null,
        locale,
        siteLocales.defaultLocale
      ),
      getLocalizedEntryBySlug(
        "product",
        slug,
        true,
        null,
        locale,
        siteLocales.defaultLocale
      ),
      getEntryByIdAllLocales(product.sys.id, true),
    ])

    previewWorkspace = createPreviewWorkspace({
      published: _.get(publishedEntries, "items[0]", {}),
      current: _.get(currentEntries, "items[0]", {}),
      selected: product,
      allLocales: allLocales || product,
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
      product,
      ...siteContent,
      previewStatus,
      previewWorkspace,
    }),
    revalidate: 30,
  }
}

export default ProductPage
