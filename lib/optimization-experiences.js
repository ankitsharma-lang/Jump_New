function isContentfulEntry(value) {
  return Boolean(value?.sys?.id && value?.sys?.type === "Entry")
}

export function getLinkedOptimizationExperienceIds(...roots) {
  const experienceIds = new Set()
  const visitedEntryIds = new Set()

  function visit(value) {
    if (Array.isArray(value)) {
      value.forEach(visit)
      return
    }

    if (!isContentfulEntry(value) || visitedEntryIds.has(value.sys.id)) return

    visitedEntryIds.add(value.sys.id)

    const linkedExperiences = value.fields?.nt_experiences
    if (Array.isArray(linkedExperiences)) {
      linkedExperiences.forEach((experience) => {
        const optimizationId = experience?.fields?.nt_experience_id
        const entryId = experience?.sys?.id

        if (optimizationId) experienceIds.add(optimizationId)
        if (entryId) experienceIds.add(entryId)
      })
    }

    Object.entries(value.fields || {}).forEach(([fieldId, fieldValue]) => {
      if (fieldId !== "nt_experiences") visit(fieldValue)
    })
  }

  roots.forEach(visit)

  return [...experienceIds]
}
