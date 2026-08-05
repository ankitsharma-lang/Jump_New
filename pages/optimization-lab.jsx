import Head from "next/head"
import OptimizationLab from "../components/optimization-lab/OptimizationLab"
import { getEntriesByContentType } from "../lib/helpers"
import { authorizeOptimizationLab } from "../lib/optimization-lab-server"
import { resolveOptimizationLabOnServer } from "../lib/optimization-server"

function sanitizeContentful(value) {
  return JSON.parse(
    JSON.stringify(value, (key, item) => {
      if (key === "page") return undefined
      return item
    })
  )
}

export default function OptimizationLabPage(props) {
  return (
    <>
      <Head>
        <title>Optimization Troubleshooting Lab</title>
        <meta content="noindex,nofollow" name="robots" />
      </Head>
      <OptimizationLab {...props} />
    </>
  )
}

export async function getServerSideProps(context) {
  const access = authorizeOptimizationLab(context)

  if (!access.authorized) {
    return { notFound: true }
  }

  if (access.redirectToCleanUrl) {
    return {
      redirect: {
        destination: "/optimization-lab",
        permanent: false,
      },
    }
  }

  context.res.setHeader("Cache-Control", "private, no-store, max-age=0")

  const [cardEntries, audiences, experiences, mergeTags] = await Promise.all([
    getEntriesByContentType("optimizationTestCard"),
    getEntriesByContentType("nt_audience"),
    getEntriesByContentType("nt_experience"),
    getEntriesByContentType("nt_mergetag"),
  ])

  const cards = (cardEntries?.items || []).filter(
    (entry) =>
      entry.fields?.role === "baseline" &&
      Array.isArray(entry.fields?.nt_experiences)
  )
  const serverOptimization = await resolveOptimizationLabOnServer(context, cards)

  return {
    props: sanitizeContentful({
      audiences: audiences?.items || [],
      cards,
      experiences: experiences?.items || [],
      mergeTags: mergeTags?.items || [],
      serverOptimization,
      serverRenderedAt: new Date().toISOString(),
    }),
  }
}
