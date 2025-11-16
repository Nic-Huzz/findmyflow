/**
 * Nikigai Clustering Algorithm
 *
 * Groups items (responses/bullets) into meaningful clusters based on tag similarity
 *
 * Reference: docs/nikigai-clustering-quality-metrics.md
 */

import { calculateClusterScore } from './weighting.js'

/**
 * Calculate weighted Jaccard similarity between two items based on their tags
 * Returns a value between 0 (no similarity) and 1 (identical)
 *
 * Option 2+: Smart Auto-weighting
 * - Tags in source_tags get 1.5x weight
 * - 'value' tags get 1.0x weight
 * - Other tags get 0.3x weight
 */
export function calculateItemSimilarity(item1, item2, sourceTags = []) {
  // If no source tags specified, use unweighted (backwards compatible)
  if (!sourceTags || sourceTags.length === 0) {
    const tags1 = new Set(Object.values(item1.tags || {}).flat())
    const tags2 = new Set(Object.values(item2.tags || {}).flat())

    if (tags1.size === 0 && tags2.size === 0) return 0

    const intersection = new Set([...tags1].filter(x => tags2.has(x)))
    const union = new Set([...tags1, ...tags2])

    return intersection.size / union.size
  }

  // Weighted similarity calculation
  let weightedIntersection = 0
  let weightedUnion = 0

  // Get all unique tag types from both items
  const allTagTypes = new Set([
    ...Object.keys(item1.tags || {}),
    ...Object.keys(item2.tags || {})
  ])

  allTagTypes.forEach(tagType => {
    const tags1 = new Set(item1.tags?.[tagType] || [])
    const tags2 = new Set(item2.tags?.[tagType] || [])

    // Determine weight for this tag type
    let weight = 0.3 // Default low weight
    if (sourceTags.includes(tagType)) {
      weight = 1.5 // High weight for source tags
    } else if (tagType === 'value') {
      weight = 1.0 // Normal weight for values
    }

    // Calculate intersection and union for this tag type
    const intersection = [...tags1].filter(x => tags2.has(x)).length
    const union = new Set([...tags1, ...tags2]).size

    // Add weighted counts
    weightedIntersection += intersection * weight
    weightedUnion += union * weight
  })

  if (weightedUnion === 0) return 0

  return weightedIntersection / weightedUnion
}

/**
 * Generate clusters using a simple hierarchical clustering approach
 */
export function generateClusters(items, params = {}) {
  const {
    similarity_threshold = 0.25,
    min_merge_similarity = 0.1,
    source_tags = ['skill_verb', 'domain_topic', 'value'],
    min_items_per_cluster = 3
  } = params

  console.log('🎯 Pure Similarity-Based Clustering (Option 2+ Smart Auto-weighting)')
  console.log('   Similarity threshold:', similarity_threshold)
  console.log('   Source tags (1.5x weight):', source_tags)
  console.log('   Value tags (1.0x weight): [value]')
  console.log('   Other tags (0.3x weight): [emotion, context, problem_theme, persona_hint]')

  if (!items || items.length === 0) {
    return []
  }

  // Filter items to only use specified tag types
  const filteredItems = items.map(item => ({
    ...item,
    tags: Object.fromEntries(
      Object.entries(item.tags || {})
        .filter(([tagType]) => source_tags.includes(tagType))
    )
  }))

  // Start with each item in its own cluster
  let clusters = filteredItems.map(item => ({
    items: [item],
    centroid: item.tags
  }))

  // Pure similarity-based merging: merge until similarity drops below threshold
  console.log(`📊 Starting with ${clusters.length} clusters (one per item)`)

  while (clusters.length > 1) {
    // Find two most similar clusters
    let maxSimilarity = -1
    let mergeIndices = [0, 1]

    for (let i = 0; i < clusters.length; i++) {
      for (let j = i + 1; j < clusters.length; j++) {
        const similarity = calculateClusterSimilarity(clusters[i], clusters[j], source_tags)
        if (similarity > maxSimilarity) {
          maxSimilarity = similarity
          mergeIndices = [i, j]
        }
      }
    }

    console.log(`  🔍 Best merge similarity: ${maxSimilarity.toFixed(3)} (${clusters.length} clusters)`)

    // ONLY stop condition: similarity too low
    if (maxSimilarity < similarity_threshold) {
      console.log(`  ⛔ Stopping - similarity ${maxSimilarity.toFixed(3)} < threshold ${similarity_threshold}`)
      break
    }

    // Merge the two most similar clusters
    const [i, j] = mergeIndices
    const cluster1Items = clusters[i].items.map(item => item.text).join(', ')
    const cluster2Items = clusters[j].items.map(item => item.text).join(', ')
    console.log(`  ✅ Merging: [${cluster1Items}] + [${cluster2Items}]`)

    clusters[i] = {
      items: [...clusters[i].items, ...clusters[j].items],
      centroid: mergeCentroids(clusters[i].centroid, clusters[j].centroid)
    }
    clusters.splice(j, 1)
  }

  // Optional: Try to merge single-item clusters if similarity is reasonable
  // This is a gentle cleanup, not forced merging
  const singletonClusters = clusters.filter(c => c.items.length === 1)
  const mergedSingletons = new Set()

  if (singletonClusters.length > 0) {
    console.log(`\n🔍 Checking ${singletonClusters.length} single-item clusters for reasonable merges...`)

    singletonClusters.forEach(singletonCluster => {
      // Skip if already merged
      const singletonIndex = clusters.indexOf(singletonCluster)
      if (singletonIndex === -1 || mergedSingletons.has(singletonCluster)) {
        return
      }

      // Find most similar neighbor
      let maxSimilarity = -1
      let bestNeighborIndex = -1

      clusters.forEach((cluster, index) => {
        if (index !== singletonIndex && !mergedSingletons.has(cluster)) {
          const similarity = calculateClusterSimilarity(singletonCluster, cluster, source_tags)
          if (similarity > maxSimilarity) {
            maxSimilarity = similarity
            bestNeighborIndex = index
          }
        }
      })

      // Only merge if similarity is above minimum threshold
      if (bestNeighborIndex !== -1 && maxSimilarity >= min_merge_similarity) {
        console.log(`  ✅ Merging singleton "${singletonCluster.items[0].text}" (similarity: ${maxSimilarity.toFixed(3)})`)
        clusters[bestNeighborIndex] = {
          items: [...clusters[bestNeighborIndex].items, ...singletonCluster.items],
          centroid: mergeCentroids(clusters[bestNeighborIndex].centroid, singletonCluster.centroid)
        }
        mergedSingletons.add(singletonCluster)
        clusters.splice(singletonIndex, 1)
      } else {
        console.log(`  ⛔ Keeping singleton "${singletonCluster.items[0].text}" separate (best similarity: ${maxSimilarity.toFixed(3)})`)
      }
    })
  }

  const clusterSizes = clusters.map(c => c.items.length)
  const avgSize = (clusterSizes.reduce((a, b) => a + b, 0) / clusterSizes.length).toFixed(1)
  console.log(`\n✅ Final result: ${clusters.length} natural clusters`)
  console.log(`   Sizes: [${clusterSizes.join(', ')}], avg: ${avgSize}`)
  console.log(`   Threshold used: ${similarity_threshold}`)

  return clusters.map(cluster => ({
    items: cluster.items,
    item_count: cluster.items.length
  }))
}

/**
 * Calculate similarity between two clusters
 */
function calculateClusterSimilarity(cluster1, cluster2, sourceTags = []) {
  // Average pairwise similarity between items
  let totalSimilarity = 0
  let count = 0

  cluster1.items.forEach(item1 => {
    cluster2.items.forEach(item2 => {
      totalSimilarity += calculateItemSimilarity(item1, item2, sourceTags)
      count++
    })
  })

  return count > 0 ? totalSimilarity / count : 0
}

/**
 * Merge two centroids (tag sets)
 */
function mergeCentroids(centroid1, centroid2) {
  const merged = { ...centroid1 }

  Object.entries(centroid2).forEach(([tagType, tags]) => {
    if (!merged[tagType]) {
      merged[tagType] = [...tags]
    } else {
      merged[tagType] = [...new Set([...merged[tagType], ...tags])]
    }
  })

  return merged
}

/**
 * Split a cluster into two based on tag dissimilarity
 */
function splitCluster(cluster, minItems = 3, sourceTags = []) {
  if (cluster.items.length < minItems * 2) return [cluster]

  // Find two most dissimilar items as seeds
  let minSimilarity = 1
  let seedIndices = [0, 1]

  for (let i = 0; i < cluster.items.length; i++) {
    for (let j = i + 1; j < cluster.items.length; j++) {
      const similarity = calculateItemSimilarity(cluster.items[i], cluster.items[j], sourceTags)
      if (similarity < minSimilarity) {
        minSimilarity = similarity
        seedIndices = [i, j]
      }
    }
  }

  // Assign each item to closest seed
  const group1 = [cluster.items[seedIndices[0]]]
  const group2 = [cluster.items[seedIndices[1]]]

  cluster.items.forEach((item, index) => {
    if (index === seedIndices[0] || index === seedIndices[1]) return

    const sim1 = calculateItemSimilarity(item, cluster.items[seedIndices[0]], sourceTags)
    const sim2 = calculateItemSimilarity(item, cluster.items[seedIndices[1]], sourceTags)

    if (sim1 > sim2) {
      group1.push(item)
    } else {
      group2.push(item)
    }
  })

  return [
    { items: group1, centroid: calculateCentroid(group1) },
    { items: group2, centroid: calculateCentroid(group2) }
  ]
}

/**
 * Calculate centroid (most common tags) for a group of items
 */
function calculateCentroid(items) {
  const tagCounts = {}

  items.forEach(item => {
    Object.entries(item.tags || {}).forEach(([tagType, tags]) => {
      if (!tagCounts[tagType]) tagCounts[tagType] = {}

      tags.forEach(tag => {
        tagCounts[tagType][tag] = (tagCounts[tagType][tag] || 0) + 1
      })
    })
  })

  // Return tags that appear in >30% of items
  const threshold = items.length * 0.3
  const centroid = {}

  Object.entries(tagCounts).forEach(([tagType, tags]) => {
    centroid[tagType] = Object.entries(tags)
      .filter(([tag, count]) => count >= threshold)
      .map(([tag]) => tag)
  })

  return centroid
}

/**
 * Label a cluster based on its most common tags (fallback)
 */
export function generateClusterLabel(cluster) {
  const tagCounts = {}

  cluster.items.forEach(item => {
    Object.entries(item.tags || {}).forEach(([tagType, tags]) => {
      tags.forEach(tag => {
        const key = `${tagType}:${tag}`
        tagCounts[key] = (tagCounts[key] || 0) + 1
      })
    })
  })

  // Get most common tags
  const sorted = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)

  if (sorted.length === 0) return 'Unnamed Cluster'

  // Extract tag names (remove type prefix)
  const topTags = sorted.map(([key]) => key.split(':')[1])

  // Capitalize and join
  return topTags
    .map(tag => tag.charAt(0).toUpperCase() + tag.slice(1))
    .join(' & ')
}

/**
 * Generate semantic cluster label using AI
 * Returns both evocative display label and archetype mappings for job matching
 */
export async function generateSemanticClusterLabel(cluster, supabase) {
  try {
    // Extract items and their tags
    const itemsWithTags = cluster.items.map(item => ({
      text: item.text,
      tags: item.tags
    }))

    // Call Edge Function to generate label
    const { data, error } = await supabase.functions.invoke('generate-cluster-label', {
      body: {
        items: itemsWithTags
      }
    })

    if (error) {
      console.error('Error generating semantic label:', error)
      return {
        displayLabel: generateClusterLabel(cluster),
        archetypes: [],
        rationale: 'Fallback label generation'
      }
    }

    // Return full response with display label + archetype mappings
    return {
      displayLabel: data.displayLabel || generateClusterLabel(cluster),
      archetypes: data.archetypes || [],
      rationale: data.rationale
    }
  } catch (error) {
    console.error('Failed to generate semantic label:', error)
    return {
      displayLabel: generateClusterLabel(cluster),
      archetypes: [],
      rationale: 'Error in label generation'
    }
  }
}

/**
 * Generate meta-skills by analyzing patterns across all clusters
 */
export async function generateMetaSkills(clusters, supabase) {
  try {
    console.log('✨ Generating meta-skills from', clusters.length, 'clusters')

    const requestBody = {
      clusters: clusters.map((cluster, idx) => ({
        id: `cluster-${idx + 1}`,
        label: cluster.label || cluster.displayLabel,
        items: cluster.items,
        archetypes: cluster.archetypes || []
      }))
    }

    console.log('📤 Meta-skills request body:', JSON.stringify(requestBody, null, 2))

    // Call Edge Function to generate meta-skills
    const { data, error } = await supabase.functions.invoke('generate-meta-skills', {
      body: requestBody
    })

    if (error) {
      console.error('❌ Meta-skills error:', error)
      console.error('❌ Error details:', JSON.stringify(error, null, 2))
      return []
    }

    console.log('📥 Meta-skills response:', JSON.stringify(data, null, 2))
    console.log('✨ Generated', data.meta_skills?.length || 0, 'meta-skills')
    return data.meta_skills || []
  } catch (error) {
    console.error('Failed to generate meta-skills:', error)
    return []
  }
}

/**
 * Suggest an archetype for a cluster based on dominant tags
 */
export async function suggestArchetype(cluster, roleArchetypes) {
  const clusterTags = cluster.items.flatMap(item =>
    Object.values(item.tags || {}).flat()
  )

  const tagSet = new Set(clusterTags)

  // Find best matching archetype
  let bestMatch = null
  let bestScore = 0

  roleArchetypes.forEach(archetype => {
    let matchCount = 0

    archetype.core_skills.forEach(skill => {
      if (tagSet.has(skill.toLowerCase()) ||
          [...tagSet].some(tag => tag.includes(skill.toLowerCase()))) {
        matchCount++
      }
    })

    const score = matchCount / archetype.core_skills.length

    if (score > bestScore) {
      bestScore = score
      bestMatch = archetype
    }
  })

  return {
    archetype: bestMatch?.name || null,
    confidence: bestScore,
    alternatives: roleArchetypes
      .map(a => ({
        name: a.name,
        score: calculateArchetypeMatch(cluster, a)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
  }
}

function calculateArchetypeMatch(cluster, archetype) {
  const clusterTags = new Set(
    cluster.items.flatMap(item => Object.values(item.tags || {}).flat())
  )

  let matchCount = 0
  archetype.core_skills.forEach(skill => {
    if (clusterTags.has(skill.toLowerCase()) ||
        [...clusterTags].some(tag => tag.includes(skill.toLowerCase()))) {
      matchCount++
    }
  })

  return matchCount / archetype.core_skills.length
}

/**
 * Calculate quality metrics for clusters
 */
export function calculateClusterQualityMetrics(clusters) {
  if (!clusters || clusters.length === 0) {
    return {
      overall_score: 0,
      coherence: 0,
      distinctness: 0,
      balance: 0,
      grade: 'F'
    }
  }

  // Coherence: average intra-cluster similarity
  const coherence = clusters.reduce((sum, cluster) => {
    return sum + calculateIntraClusterSimilarity(cluster)
  }, 0) / clusters.length

  // Distinctness: average inter-cluster distance
  const distinctness = calculateInterClusterDistance(clusters)

  // Balance: Gini coefficient
  const balance = 1 - calculateGini(clusters)

  // Overall score (weighted average)
  const overall_score = (
    coherence * 0.4 +
    distinctness * 0.4 +
    balance * 0.2
  )

  // Grade
  const grade = overall_score >= 0.8 ? 'A' :
                overall_score >= 0.7 ? 'B' :
                overall_score >= 0.6 ? 'C' :
                overall_score >= 0.5 ? 'D' : 'F'

  return {
    overall_score: Math.round(overall_score * 100) / 100,
    coherence: Math.round(coherence * 100) / 100,
    distinctness: Math.round(distinctness * 100) / 100,
    balance: Math.round(balance * 100) / 100,
    grade
  }
}

function calculateIntraClusterSimilarity(cluster) {
  if (cluster.items.length < 2) return 1

  let totalSimilarity = 0
  let comparisons = 0

  for (let i = 0; i < cluster.items.length; i++) {
    for (let j = i + 1; j < cluster.items.length; j++) {
      totalSimilarity += calculateItemSimilarity(cluster.items[i], cluster.items[j])
      comparisons++
    }
  }

  return comparisons > 0 ? totalSimilarity / comparisons : 0
}

function calculateInterClusterDistance(clusters) {
  if (clusters.length < 2) return 1

  let totalDistance = 0
  let comparisons = 0

  for (let i = 0; i < clusters.length; i++) {
    for (let j = i + 1; j < clusters.length; j++) {
      const similarity = calculateClusterSimilarity(clusters[i], clusters[j])
      totalDistance += (1 - similarity) // Distance = 1 - similarity
      comparisons++
    }
  }

  return comparisons > 0 ? totalDistance / comparisons : 0
}

function calculateGini(clusters) {
  const sizes = clusters.map(c => c.items.length).sort((a, b) => a - b)
  const n = sizes.length
  const totalItems = sizes.reduce((sum, size) => sum + size, 0)

  if (totalItems === 0) return 0

  const gini = sizes.reduce((sum, size, i) => {
    return sum + (2 * (i + 1) - n - 1) * size
  }, 0) / (n * totalItems)

  return gini
}

/**
 * Save clusters to Supabase
 */
export async function saveClusters(supabase, sessionId, userId, clusters, clusterType, clusterStage) {
  const records = clusters.map(cluster => ({
    session_id: sessionId,
    user_id: userId,
    cluster_type: clusterType,
    cluster_stage: clusterStage,
    cluster_label: cluster.label || generateClusterLabel(cluster),
    archetype: cluster.archetype || null,
    items: cluster.items,
    score: cluster.score || 0,
    coherence_score: cluster.coherence_score || null,
    quality_grade: cluster.quality_grade || null,
    source_responses: cluster.source_responses || [],
    source_tags: cluster.source_tags || []
  }))

  const { data, error } = await supabase
    .from('nikigai_clusters')
    .insert(records)
    .select()

  if (error) {
    console.error('Error saving clusters:', error)
    throw error
  }

  return data
}

/**
 * Load clusters from Supabase
 */
export async function loadClusters(supabase, sessionId, clusterType, clusterStage = 'final') {
  const { data, error } = await supabase
    .from('nikigai_clusters')
    .select('*')
    .eq('session_id', sessionId)
    .eq('cluster_type', clusterType)
    .eq('cluster_stage', clusterStage)
    .eq('archived', false)
    .order('score', { ascending: false })

  if (error) {
    console.error('Error loading clusters:', error)
    throw error
  }

  return data
}
