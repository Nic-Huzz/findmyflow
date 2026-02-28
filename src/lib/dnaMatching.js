export function inferFromGames(selectedGames) {
  if (selectedGames.length === 0) return { orientation: 3, knowledgeStyle: 3 }

  const avgOrientation =
    selectedGames.reduce((sum, g) => sum + g.inferredOrientation, 0) / selectedGames.length
  const avgKnowledgeStyle =
    selectedGames.reduce((sum, g) => sum + g.inferredKnowledgeStyle, 0) / selectedGames.length

  return {
    orientation: Math.round(avgOrientation),
    knowledgeStyle: Math.round(avgKnowledgeStyle),
  }
}

export function buildDNAProfile(workRhythm, fuelType, orientation, knowledgeStyle, scaleApproach) {
  return {
    workRhythm,
    fuelType,
    orientation,
    knowledgeStyle,
    scaleApproach,
    code: `${workRhythm}-${fuelType}-${orientation}-${knowledgeStyle}-${scaleApproach}`,
  }
}

function euclideanDistance(profile, founder) {
  return Math.sqrt(
    Math.pow(profile.workRhythm - founder.workRhythm, 2) +
    Math.pow(profile.fuelType - founder.fuelType, 2) +
    Math.pow(profile.orientation - founder.orientation, 2) +
    Math.pow(profile.knowledgeStyle - founder.knowledgeStyle, 2) +
    Math.pow(profile.scaleApproach - founder.scaleApproach, 2)
  )
}

export function matchFounder(profile, founders) {
  if (founders.length === 0) {
    throw new Error('No founders available for matching')
  }

  const scored = founders.map(founder => ({
    founder,
    distance: euclideanDistance(profile, founder),
  }))

  scored.sort((a, b) => a.distance - b.distance)

  const archetype = generateArchetype(profile)
  const topMatches = scored.slice(0, 3).map(s => ({
    founder: s.founder,
    distance: s.distance,
    archetype,
  }))

  return {
    founder: topMatches[0].founder,
    distance: topMatches[0].distance,
    archetype,
    topMatches,
  }
}

function generateArchetype(profile) {
  const factors = [
    { name: 'workRhythm', value: profile.workRhythm, extremity: Math.abs(profile.workRhythm - 3) },
    { name: 'fuelType', value: profile.fuelType, extremity: Math.abs(profile.fuelType - 3) },
    { name: 'orientation', value: profile.orientation, extremity: Math.abs(profile.orientation - 3) },
    { name: 'knowledgeStyle', value: profile.knowledgeStyle, extremity: Math.abs(profile.knowledgeStyle - 3) },
    { name: 'scaleApproach', value: profile.scaleApproach, extremity: Math.abs(profile.scaleApproach - 3) },
  ]

  factors.sort((a, b) => b.extremity - a.extremity)

  if (factors.every((f) => f.extremity === 0)) {
    return 'The Polymath'
  }

  const primary = getTraitLabel(factors[0].name, factors[0].value)
  const secondary = getTraitLabel(factors[1].name, factors[1].value)

  if (primary === secondary) {
    const tertiary = getTraitLabel(factors[2].name, factors[2].value)
    if (primary === tertiary) return `The ${primary}`
    return `The ${primary}-${tertiary}`
  }

  return `The ${primary}-${secondary}`
}

function getTraitLabel(factor, value) {
  const labels = {
    workRhythm: { low: 'Grinder', mid: 'Steady', high: 'Sprinter' },
    fuelType: { low: 'Firestarter', mid: 'Balanced', high: 'Sage' },
    orientation: { low: 'Craftsman', mid: 'Hybrid', high: 'Dealmaker' },
    knowledgeStyle: { low: 'Scholar', mid: 'Thinker', high: 'Explorer' },
    scaleApproach: { low: 'Artisan', mid: 'Builder', high: 'Titan' },
  }

  const tier = value <= 2 ? 'low' : value >= 4 ? 'high' : 'mid'
  return labels[factor]?.[tier] ?? 'Founder'
}
