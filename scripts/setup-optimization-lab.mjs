import "dotenv/config"
import contentfulManagement from "contentful-management"

const { createClient } = contentfulManagement

const locale = "en-US"
const contentTypeId = "optimizationTestCard"
const spaceId = process.env.CONTENTFUL_SPACE_ID || process.env.NEXT_PUBLIC_SPACE_ID
const environmentId =
  process.env.CONTENTFUL_ENVIRONMENT || process.env.NEXT_PUBLIC_ENVIRONMENT || "master"
const managementToken = process.env.CONTENTFUL_MANAGEMENT_TOKEN || process.env.CMA_TOKEN
const primaryMetric =
  process.env.OPTIMIZATION_LAB_PRIMARY_METRIC_ID ||
  "56a145de-43a4-4ef0-ae1a-9345551bf4df"

if (!spaceId || !managementToken) {
  throw new Error(
    "Missing Contentful credentials. Set CONTENTFUL_SPACE_ID (or NEXT_PUBLIC_SPACE_ID) and CONTENTFUL_MANAGEMENT_TOKEN (or CMA_TOKEN)."
  )
}

const ids = {
  audience: "supportLabAudience",
  mergeFirstName: "supportLabMergeFirstName",
  mergeCity: "supportLabMergeCity",
  abBaseline: "supportLabAbBaseline",
  abVariant: "supportLabAbVariant",
  abExperience: "supportLabAbExperiment",
  multiBaseline: "supportLabMultiBaseline",
  multiVariantA: "supportLabMultiVariantA",
  multiVariantB: "supportLabMultiVariantB",
  multiExperience: "supportLabMultiExperiment",
  priorityBaseline: "supportLabPriorityBaseline",
  priorityGerman: "supportLabPriorityGerman",
  priorityExperimentVariant: "supportLabPriorityExperimentVariant",
  priorityGermanExperience: "supportLabPriorityGermanPersonalization",
  priorityExperiment: "supportLabPriorityExperiment",
  germanAudience: "6Cd1URTw13srbeMcxSCbAE",
}

const link = (id) => ({ sys: { type: "Link", linkType: "Entry", id } })
const localized = (value) => ({ [locale]: value })

function comparable(value) {
  return JSON.stringify(value)
}

async function ensureContentType(environment) {
  const fields = [
    { id: "title", name: "Title", type: "Symbol", required: true, localized: false },
    {
      id: "slug",
      name: "Slug",
      type: "Symbol",
      required: true,
      localized: false,
      validations: [{ unique: true }],
    },
    { id: "role", name: "Fixture role", type: "Symbol", required: true, localized: false },
    { id: "body", name: "Body", type: "Text", required: true, localized: false },
    {
      id: "buttonLabel",
      name: "Button label",
      type: "Symbol",
      required: true,
      localized: false,
    },
    { id: "accent", name: "Accent", type: "Symbol", required: false, localized: false },
    {
      id: "nt_experiences",
      name: "Ninetailed",
      type: "Array",
      required: false,
      localized: false,
      items: {
        type: "Link",
        linkType: "Entry",
        validations: [{ linkContentType: ["nt_experience"] }],
      },
    },
  ]

  let contentType
  try {
    contentType = await environment.getContentType(contentTypeId)
    if (
      contentType.name !== "Optimization Test Card" ||
      contentType.displayField !== "title" ||
      comparable(contentType.fields) !== comparable(fields)
    ) {
      contentType.name = "Optimization Test Card"
      contentType.displayField = "title"
      contentType.fields = fields
      contentType = await contentType.update()
    }
  } catch (error) {
    if (error.name !== "NotFound" && error.sys?.id !== "NotFound") throw error
    contentType = await environment.createContentTypeWithId(contentTypeId, {
      name: "Optimization Test Card",
      displayField: "title",
      fields,
    })
  }

  if (!contentType.isPublished() || contentType.sys.version > contentType.sys.publishedVersion + 1) {
    contentType = await contentType.publish()
  }
  return contentType
}

async function ensureEntry(environment, id, type, fields) {
  let entry
  try {
    entry = await environment.getEntry(id)
    if (entry.isArchived()) entry = await entry.unarchive()
    if (comparable(entry.fields) !== comparable(fields)) {
      entry.fields = fields
      entry = await entry.update()
    }
  } catch (error) {
    if (error.name !== "NotFound" && error.sys?.id !== "NotFound") throw error
    entry = await environment.createEntryWithId(type, id, { fields })
  }
  return entry
}

async function publishCurrent(environment, id) {
  let entry = await environment.getEntry(id)
  if (!entry.isPublished() || entry.sys.version > entry.sys.publishedVersion + 1) {
    entry = await entry.publish()
  }
  return entry
}

function cardFields({ title, slug, role, body, buttonLabel, accent, experiences = [] }) {
  return {
    title: localized(title),
    slug: localized(slug),
    role: localized(role),
    body: localized(body),
    buttonLabel: localized(buttonLabel),
    accent: localized(accent),
    nt_experiences: localized(experiences.map(link)),
  }
}

function experienceFields({ id, name, type, audienceId, baselineId, variantIds, distribution, components = [] }) {
  return {
    nt_name: localized(name),
    nt_description: localized("Isolated fixture used only by /optimization-lab."),
    nt_type: localized(type),
    nt_config: localized({
      traffic: 1,
      distribution,
      distributionType: "manual",
      primaryMetric,
      components: [
        {
          type: "EntryReplacement",
          baseline: { id: baselineId },
          variants: variantIds.map((variantId) => ({ id: variantId, hidden: false })),
        },
        ...components,
      ],
    }),
    nt_audience: localized(link(audienceId)),
    nt_variants: localized(variantIds.map(link)),
    nt_experience_id: localized(id),
    nt_metadata: localized({ fixture: "optimization-support-lab" }),
  }
}

const client = createClient({ accessToken: managementToken })
const space = await client.getSpace(spaceId)
const environment = await space.getEnvironment(environmentId)

await ensureContentType(environment)

const variantEntries = [
  [
    ids.abVariant,
    cardFields({
      title: "A/B variant: focused support message",
      slug: "support-lab-ab-variant",
      role: "variant",
      body: "This is the alternative content for the 50/50 experiment.",
      buttonLabel: "Convert on A/B variant",
      accent: "blue",
    }),
  ],
  [
    ids.multiVariantA,
    cardFields({
      title: "Multivariate option A",
      slug: "support-lab-multi-a",
      role: "variant",
      body: "The first alternative in a three-way content experiment.",
      buttonLabel: "Convert on option A",
      accent: "emerald",
    }),
  ],
  [
    ids.multiVariantB,
    cardFields({
      title: "Multivariate option B",
      slug: "support-lab-multi-b",
      role: "variant",
      body: "The second alternative in a three-way content experiment.",
      buttonLabel: "Convert on option B",
      accent: "orange",
    }),
  ],
  [
    ids.priorityGerman,
    cardFields({
      title: "German audience wins priority",
      slug: "support-lab-priority-german",
      role: "variant",
      body: "This deterministic personalization is first in the baseline link order.",
      buttonLabel: "Convert on German personalization",
      accent: "purple",
    }),
  ],
  [
    ids.priorityExperimentVariant,
    cardFields({
      title: "Fallback experiment variant",
      slug: "support-lab-priority-experiment",
      role: "variant",
      body: "This experiment applies when the higher-priority German personalization does not.",
      buttonLabel: "Convert on priority experiment",
      accent: "blue",
    }),
  ],
]

for (const [id, fields] of variantEntries) {
  await ensureEntry(environment, id, contentTypeId, fields)
  await publishCurrent(environment, id)
}

await ensureEntry(environment, ids.audience, "nt_audience", {
  nt_name: localized("Optimization Support Lab Visitors"),
  nt_description: localized("Visitors who send the support_lab_entered test event."),
  nt_rules: localized({
    any: [
      {
        all: [
          {
            key: "",
            type: "track",
            count: 1,
            value: "support_lab_entered",
            operator: "greaterThanInclusive",
            conditions: [],
          },
        ],
      },
    ],
  }),
  nt_audience_id: localized(ids.audience),
  nt_metadata: localized({ fixture: "optimization-support-lab" }),
})
await publishCurrent(environment, ids.audience)

await ensureEntry(environment, ids.mergeFirstName, "nt_mergetag", {
  nt_name: localized("Support Lab First Name"),
  nt_fallback: localized("friend"),
  nt_mergetag_id: localized("traits.firstName"),
})
await ensureEntry(environment, ids.mergeCity, "nt_mergetag", {
  nt_name: localized("Support Lab City"),
  nt_fallback: localized("your city"),
  nt_mergetag_id: localized("location.city"),
})
await publishCurrent(environment, ids.mergeFirstName)
await publishCurrent(environment, ids.mergeCity)

const experiences = [
  [
    ids.abExperience,
    experienceFields({
      id: ids.abExperience,
      name: "Support Lab 50/50 Entry + Flag Experiment",
      type: "nt_experiment",
      audienceId: ids.audience,
      baselineId: ids.abBaseline,
      variantIds: [ids.abVariant],
      distribution: [0.5, 0.5],
      components: [
        {
          type: "InlineVariable",
          key: "support-banner-style",
          valueType: "Object",
          baseline: {
            value: { label: "Baseline flag", tone: "slate", showBadge: false },
          },
          variants: [
            {
              value: { label: "Experiment flag", tone: "blue", showBadge: true },
            },
          ],
        },
      ],
    }),
  ],
  [
    ids.multiExperience,
    experienceFields({
      id: ids.multiExperience,
      name: "Support Lab Three-Way Experiment",
      type: "nt_experiment",
      audienceId: ids.audience,
      baselineId: ids.multiBaseline,
      variantIds: [ids.multiVariantA, ids.multiVariantB],
      distribution: [0.34, 0.33, 0.33],
    }),
  ],
  [
    ids.priorityGermanExperience,
    experienceFields({
      id: ids.priorityGermanExperience,
      name: "Support Lab German Priority Personalization",
      type: "nt_personalization",
      audienceId: ids.germanAudience,
      baselineId: ids.priorityBaseline,
      variantIds: [ids.priorityGerman],
      distribution: [0, 1],
    }),
  ],
  [
    ids.priorityExperiment,
    experienceFields({
      id: ids.priorityExperiment,
      name: "Support Lab Lower-Priority Experiment",
      type: "nt_experiment",
      audienceId: ids.audience,
      baselineId: ids.priorityBaseline,
      variantIds: [ids.priorityExperimentVariant],
      distribution: [0.5, 0.5],
    }),
  ],
]

for (const [id, fields] of experiences) {
  await ensureEntry(environment, id, "nt_experience", fields)
  await publishCurrent(environment, id)
}

const baselineEntries = [
  [
    ids.abBaseline,
    cardFields({
      title: "A/B baseline: general support message",
      slug: "support-lab-ab",
      role: "baseline",
      body: "Send support_lab_entered, then compare this baseline with its single variant.",
      buttonLabel: "Convert on A/B baseline",
      accent: "slate",
      experiences: [ids.abExperience],
    }),
  ],
  [
    ids.multiBaseline,
    cardFields({
      title: "Multivariate baseline",
      slug: "support-lab-multivariate",
      role: "baseline",
      body: "This entry has two alternatives, producing a three-way traffic allocation.",
      buttonLabel: "Convert on multivariate baseline",
      accent: "slate",
      experiences: [ids.multiExperience],
    }),
  ],
  [
    ids.priorityBaseline,
    cardFields({
      title: "Priority baseline",
      slug: "support-lab-priority",
      role: "baseline",
      body: "German personalization is linked first; the general lab experiment is second.",
      buttonLabel: "Convert on priority baseline",
      accent: "slate",
      experiences: [ids.priorityGermanExperience, ids.priorityExperiment],
    }),
  ],
]

for (const [id, fields] of baselineEntries) {
  await ensureEntry(environment, id, contentTypeId, fields)
  await publishCurrent(environment, id)
}

console.log(
  JSON.stringify({
    status: "ready",
    environment: environmentId,
    contentType: contentTypeId,
    baselines: baselineEntries.map(([id]) => id),
    experiences: experiences.map(([id]) => id),
    audience: ids.audience,
    mergeTags: [ids.mergeFirstName, ids.mergeCity],
  })
)
