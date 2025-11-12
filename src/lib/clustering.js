/**
 * Nikigai Clustering Algorithm
 *
 * Groups items (responses/bullets) into meaningful clusters based on tag similarity
 *
 * Reference: docs/nikigai-clustering-quality-metrics.md
 */

import { calculateClusterScore } from './weighting.js'

/**
 * Calculate Jaccard similarity between two items based on their tags
 * Returns a value between 0 (no similarity) and 1 (identical)
 */
export function calculateItemSimilarity(item1, item2) {
  const tags1 = new Set(Object.values(item1.tags || {}).flat())
  const tags2 = new Set(Object.values(item2.tags || {}).flat())

  if (tags1.size === 0 && tags2.size === 0) return 0

  const intersection = new Set([...tags1].filter(x => tags2.has(x)))
  const union = new Set([...tags1, ...tags2])

  return intersection.size / union.size
}

/**
 * Generate clusters using a simple hierarchical clustering approach
 */
export function generateClusters(items, params = {}) {
  const {
    target_clusters_min = 3,
    target_clusters_max = 6,
    similarity_threshold = 0.3,
    source_tags = ['skill_verb', 'domain_topic', 'value']
  } = params

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

  // Merge similar clusters until we reach target count
  while (clusters.length > target_clusters_max) {
    // Find two most similar clusters
    let maxSimilarity = -1
    let mergeIndices = [0, 1]

    for (let i = 0; i < clusters.length; i++) {
      for (let j = i + 1; j < clusters.length; j++) {
        const similarity = calculateClusterSimilarity(clusters[i], clusters[j])
        if (similarity > maxSimilarity) {
          maxSimilarity = similarity
          mergeIndices = [i, j]
        }
      }
    }

    // If similarity is too low and we have enough clusters, stop
    if (maxSimilarity < similarity_threshold && clusters.length <= target_clusters_max) {
      break
    }

    // Merge the two most similar clusters
    const [i, j] = mergeIndices
    clusters[i] = {
      items: [...clusters[i].items, ...clusters[j].items],
      centroid: mergeCentroids(clusters[i].centroid, clusters[j].centroid)
    }
    clusters.splice(j, 1)
  }

  // If we have too few clusters, try to split the largest
  while (clusters.length < target_clusters_min && clusters.length > 0) {
    const largestCluster = clusters.reduce((max, c) =>
      c.items.length > max.items.length ? c : max
    , clusters[0])

    if (largestCluster.items.length < 4) {
      break // Can't split further
    }

    const split = splitCluster(largestCluster)
    if (split.length === 2) {
      const index = clusters.indexOf(largestCluster)
      clusters.splice(index, 1, ...split)
    } else {
      break
    }
  }

  return clusters.map(cluster => ({
    items: cluster.items,
    item_count: cluster.items.length
  }))
}

/**
 * Calculate similarity between two clusters
 */
function calculateClusterSimilarity(cluster1, cluster2) {
  // Average pairwise similarity between items
  let totalSimilarity = 0
  let count = 0

  cluster1.items.forEach(item1 => {
    cluster2.items.forEach(item2 => {
      totalSimilarity += calculateItemSimilarity(item1, item2)
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
function splitCluster(cluster) {
  if (cluster.items.length < 4) return [cluster]

  // Find two most dissimilar items as seeds
  let minSimilarity = 1
  let seedIndices = [0, 1]

  for (let i = 0; i < cluster.items.length; i++) {
    for (let j = i + 1; j < cluster.items.length; j++) {
      const similarity = calculateItemSimilarity(cluster.items[i], cluster.items[j])
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

    const sim1 = calculateItemSimilarity(item, cluster.items[seedIndices[0]])
    const sim2 = calculateItemSimilarity(item, cluster.items[seedIndices[1]])

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
 * Label a cluster based on its most common tags
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
