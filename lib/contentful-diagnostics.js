function isEntry(value) {
  return Boolean(value?.sys?.id && value?.sys?.type === "Entry")
}

function isAsset(value) {
  return Boolean(value?.sys?.id && value?.sys?.type === "Asset")
}

function isRichText(value) {
  return value?.nodeType === "document" && Array.isArray(value?.content)
}

function richTextToText(node) {
  if (!node) return ""
  if (typeof node.value === "string") return node.value
  if (!Array.isArray(node.content)) return ""
  return node.content.map(richTextToText).filter(Boolean).join(" ").replace(/\s+/g, " ").trim()
}

function getContentType(value) {
  if (isAsset(value)) return "asset"
  return value?.sys?.contentType?.sys?.id || "entry"
}

function getLabel(value) {
  const fields = value?.fields || {}
  return (
    fields.internalName ||
    fields.title ||
    fields.headline ||
    fields.name ||
    fields.slug ||
    `${getContentType(value)} ${value?.sys?.id?.slice(0, 8) || ""}`
  )
}

function getStatus(sys = {}) {
  if (!sys.publishedAt) return "draft"
  if (sys.updatedAt && new Date(sys.updatedAt) > new Date(sys.publishedAt)) {
    return "changed"
  }
  return "published"
}

function displayValue(value) {
  if (value === null || value === undefined || value === "") return "—"
  if (typeof value === "boolean") return value ? "Yes" : "No"
  if (typeof value === "number") return String(value)
  if (typeof value === "string") return value.slice(0, 800)
  if (isRichText(value)) return (richTextToText(value) || "Empty rich text").slice(0, 800)
  if (value?.lat !== undefined && value?.lon !== undefined) {
    return `${value.lat}, ${value.lon}`
  }
  return JSON.stringify(value)
}

export function createContentSnapshot(root, { maxDepth = 5 } = {}) {
  const rows = []
  const ancestors = new Set()

  function visitEntry(entry, path, depth) {
    if (!isEntry(entry) || depth > maxDepth || ancestors.has(entry.sys.id)) return

    ancestors.add(entry.sys.id)
    const contentType = getContentType(entry)
    const entryLabel = getLabel(entry)

    Object.entries(entry.fields || {}).forEach(([fieldId, value]) => {
      if (fieldId.startsWith("nt_")) return
      const fieldPath = `${path}.${fieldId}`
      const values = Array.isArray(value) ? value : [value]
      const references = values.filter((item) => isEntry(item) || isAsset(item))

      if (references.length) {
        references.forEach((reference, index) => {
          const referencePath = `${fieldPath}[${index}]`
          rows.push({
            key: referencePath,
            path: fieldPath,
            entryId: entry.sys.id,
            contentType,
            entryLabel,
            fieldId,
            kind: isAsset(reference) ? "image" : "reference",
            value: isAsset(reference)
              ? reference.fields?.file?.url || reference.fields?.title || reference.sys.id
              : `${getLabel(reference)} (${getContentType(reference)})`,
            referenceId: reference.sys.id,
          })

          if (isEntry(reference)) visitEntry(reference, referencePath, depth + 1)
        })
        return
      }

      rows.push({
        key: fieldPath,
        path: fieldPath,
        entryId: entry.sys.id,
        contentType,
        entryLabel,
        fieldId,
        kind: isRichText(value) ? "richtext" : "value",
        value: displayValue(value),
      })
    })

    ancestors.delete(entry.sys.id)
  }

  visitEntry(root, "page", 0)
  return rows
}

export function createRelationshipTree(root, { maxDepth = 5 } = {}) {
  const ancestors = new Set()

  function visit(value, field = "Root", depth = 0) {
    if ((!isEntry(value) && !isAsset(value)) || depth > maxDepth) return null

    const id = value.sys.id
    const circular = ancestors.has(id)
    const node = {
      id,
      type: getContentType(value),
      label: getLabel(value),
      field,
      status: getStatus(value.sys),
      circular,
      children: [],
    }

    if (circular || isAsset(value)) return node

    ancestors.add(id)
    Object.entries(value.fields || {}).forEach(([fieldId, fieldValue]) => {
      if (fieldId.startsWith("nt_")) return
      const values = Array.isArray(fieldValue) ? fieldValue : [fieldValue]
      values.forEach((candidate) => {
        const child = visit(candidate, fieldId, depth + 1)
        if (child) node.children.push(child)
      })
    })
    ancestors.delete(id)

    return node
  }

  return visit(root)
}

export function createLocaleCoverage(root, locales, { maxDepth = 4 } = {}) {
  const rows = []
  const ancestors = new Set()
  const defaultLocale = locales[0]

  function hasValue(value) {
    if (value === null || value === undefined || value === "") return false
    if (Array.isArray(value)) return value.length > 0
    return true
  }

  function visit(entry, path, depth) {
    if (!isEntry(entry) || depth > maxDepth || ancestors.has(entry.sys.id)) return
    ancestors.add(entry.sys.id)

    Object.entries(entry.fields || {}).forEach(([fieldId, localizedValue]) => {
      if (fieldId.startsWith("nt_")) return
      if (!localizedValue || typeof localizedValue !== "object") return

      const availability = Object.fromEntries(
        locales.map((locale) => [locale, hasValue(localizedValue[locale])])
      )
      rows.push({
        key: `${path}.${fieldId}`,
        label: `${getLabel(entry)} · ${fieldId}`,
        fieldId,
        entryId: entry.sys.id,
        availability,
      })

      const defaultValue = localizedValue[defaultLocale]
      const references = Array.isArray(defaultValue) ? defaultValue : [defaultValue]
      references.forEach((candidate, index) => {
        if (isEntry(candidate)) {
          visit(candidate, `${path}.${fieldId}[${index}]`, depth + 1)
        }
      })
    })

    ancestors.delete(entry.sys.id)
  }

  visit(root, "page", 0)
  return rows
}

export function createPreviewWorkspace({
  published,
  current,
  selected,
  allLocales,
  locales,
}) {
  return {
    comparison: {
      published: createContentSnapshot(published),
      current: createContentSnapshot(current),
      selected: createContentSnapshot(selected),
    },
    relationships: createRelationshipTree(selected),
    locales: createLocaleCoverage(allLocales, locales),
  }
}

export function sanitizeContentful(value) {
  return JSON.parse(
    JSON.stringify(value, (key, item) => {
      // contentful.js responses can contain an internal `page` back-reference.
      // Preserve our actual top-level page entry while dropping only that metadata.
      if (key === "page" && item?.sys?.type !== "Entry") return undefined
      return item
    })
  )
}
