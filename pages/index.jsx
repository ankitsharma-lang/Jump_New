import _ from "lodash"
import ProductSection from "../components/ProductSection"
import { getEntriesByContentType } from "../lib/helpers"
import { OptimizedEntry } from "../lib/optimization"
import { useOptimizationContext } from "@contentful/optimization-nextjs/client"
import {
  useContentfulLiveUpdates,
  useContentfulInspectorMode,
} from "@contentful/live-preview/react"

function LandingPage(page) {
  const live = useContentfulLiveUpdates(page)
  const inspectorProps = useContentfulInspectorMode({ entryId: live?.sys?.id })
  const sections = _.get(live, "fields.sections")
  const headline = _.get(live, "fields.headline")

  return (
    <>
      <h1
        className="font-bold text-2xl mb-4 text-center"
        {...inspectorProps({ fieldId: "headline" })}
      >
        {headline}
      </h1>
      <div
        className="flex flex-col space-y-4"
        {...inspectorProps({ fieldId: "sections" })}
      >
        {Array.isArray(sections)
          ? sections.map((section) => {
              const contentType = _.get(section, "sys.contentType.sys.id")
              const sectionId = _.get(section, "sys.id")
              if (contentType === "productSection") {
                return (
                  <OptimizedEntry key={sectionId} baselineEntry={section}>
                    {(resolvedSection) => (
                      <ProductSection entry={resolvedSection} />
                    )}
                  </OptimizedEntry>
                )
              }
              return null
            })
          : null}
      </div>
    </>
  )
}

export default function Home({ page }) {
  const { error } = useOptimizationContext()

  if (!page?.sys?.id || error) {
    return <LandingPage {...page} />
  }

  return (
    <OptimizedEntry baselineEntry={page} clickable trackViews trackClicks>
      {(resolvedPage) => <LandingPage {...resolvedPage} />}
    </OptimizedEntry>
  )
}

export async function getStaticProps(context) {
  // setPreviewData carries the Timeline token; draftMode remains supported for
  // preview links that do not provide one.
  const preview = Boolean(context.draftMode || context.preview)
  const timeline = context.previewData?.timeline || null

  const pageEntries = await getEntriesByContentType(
    "landingPage",
    "home-page",
    preview,
    timeline
  )

  const safeEntries = JSON.parse(
    JSON.stringify(pageEntries, (key, value) => {
      if (key === "page") return undefined
      return value
    })
  )

  const homepageEntry = _.get(safeEntries, "items[0]", {})

  return {
    props: { page: homepageEntry },
    revalidate: 30,
  }
}
