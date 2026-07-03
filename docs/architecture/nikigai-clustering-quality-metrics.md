# Nikigai Clustering Quality Metrics Specification

## Overview

This document defines comprehensive metrics for assessing clustering quality in the Nikigai flow. These metrics help determine when clusters are good enough to present, when refinement is needed, and how to improve clustering algorithms over time.

---

## Core Quality Dimensions

Good clusters should be:
1. **Coherent** — Items within a cluster are similar
2. **Distinct** — Clusters are different from each other
3. **Balanced** — No single cluster dominates
4. **Interpretable** — Clusters have clear, meaningful themes
5. **Actionable** — Clusters lead to useful insights

---

## 1. Coherence Metrics

### 1.1 Intra-Cluster Similarity

**Definition:** How similar items are within the same cluster

```javascript
function calculateIntraClusterSimilarity(cluster) {
  const items = cluster.items
  let totalSimilarity = 0
  let comparisons = 0

  // Compare every pair of items in the cluster
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const similarity = calculateItemSimilarity(items[i], items[j])
      totalSimilarity += similarity
      comparisons++
    }
  }

  return comparisons > 0 ? totalSimilarity / comparisons : 0
}

function calculateItemSimilarity(item1, item2) {
  // Calculate Jaccard similarity based on shared tags
  const tags1 = new Set(Object.values(item1.tags || {}).flat())
  const tags2 = new Set(Object.values(item2.tags || {}).flat())

  const intersection = new Set([...tags1].filter(x => tags2.has(x)))
  const union = new Set([...tags1, ...tags2])

  return intersection.size / union.size
}
```

**Threshold:**
- ≥ 0.6 — **High coherence** (items are well-grouped)
- 0.3 - 0.6 — **Medium coherence** (acceptable)
- < 0.3 — **Low coherence** (items may not belong together)

---

### 1.2 Tag Concentration

**Definition:** How focused a cluster is on specific tag types

```javascript
function calculateTagConcentration(cluster) {
  const tagCounts = {}

  cluster.items.forEach(item => {
    Object.entries(item.tags || {}).forEach(([tagType, tags]) => {
      tags.forEach(tag => {
        const key = `${tagType}:${tag}`
        tagCounts[key] = (tagCounts[key] || 0) + 1
      })
    })
  })

  // Calculate what % of items share the top 3 most common tags
  const sortedTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1])
  const top3Tags = sortedTags.slice(0, 3)
  const top3Concentration = top3Tags.reduce((sum, [tag, count]) => sum + count, 0) / cluster.items.length

  return {
    concentration: top3Concentration,
    dominantTags: top3Tags.map(([tag, count]) => ({
      tag: tag.split(':')[1],
      type: tag.split(':')[0],
      appearsIn: count,
      percentage: (count / cluster.items.length) * 100
    }))
  }
}
```

**Threshold:**
- ≥ 0.7 — **Highly focused** (strong theme)
- 0.4 - 0.7 — **Moderately focused** (acceptable)
- < 0.4 — **Scattered** (no clear theme)

---

## 2. Distinctness Metrics

### 2.1 Inter-Cluster Distance

**Definition:** How different clusters are from each other

```javascript
function calculateInterClusterDistance(cluster1, cluster2) {
  // Get all tags from each cluster
  const cluster1Tags = new Set(
    cluster1.items.flatMap(item => Object.values(item.tags || {}).flat())
  )
  const cluster2Tags = new Set(
    cluster2.items.flatMap(item => Object.values(item.tags || {}).flat())
  )

  // Calculate Jaccard distance (1 - similarity)
  const intersection = new Set([...cluster1Tags].filter(x => cluster2Tags.has(x)))
  const union = new Set([...cluster1Tags, ...cluster2Tags])

  const similarity = intersection.size / union.size
  return 1 - similarity // Distance
}

function calculateAverageInterClusterDistance(clusters) {
  let totalDistance = 0
  let comparisons = 0

  for (let i = 0; i < clusters.length; i++) {
    for (let j = i + 1; j < clusters.length; j++) {
      totalDistance += calculateInterClusterDistance(clusters[i], clusters[j])
      comparisons++
    }
  }

  return comparisons > 0 ? totalDistance / comparisons : 0
}
```

**Threshold:**
- ≥ 0.7 — **Highly distinct** (minimal overlap)
- 0.4 - 0.7 — **Moderately distinct** (acceptable)
- < 0.4 — **Overlapping** (clusters too similar)

---

### 2.2 Silhouette Score

**Definition:** Combined measure of cohesion and separation

```javascript
function calculateSilhouetteScore(item, ownCluster, otherClusters) {
  // a = average distance to items in own cluster
  const a = ownCluster.items
    .filter(other => other !== item)
    .reduce((sum, other) => sum + (1 - calculateItemSimilarity(item, other)), 0) / (ownCluster.items.length - 1)

  // b = minimum average distance to items in other clusters
  const b = Math.min(...otherClusters.map(cluster => {
    return cluster.items
      .reduce((sum, other) => sum + (1 - calculateItemSimilarity(item, other)), 0) / cluster.items.length
  }))

  // Silhouette = (b - a) / max(a, b)
  return (b - a) / Math.max(a, b)
}

function calculateOverallSilhouette(clusters) {
  let totalScore = 0
  let itemCount = 0

  clusters.forEach((cluster, clusterIndex) => {
    const otherClusters = clusters.filter((_, i) => i !== clusterIndex)

    cluster.items.forEach(item => {
      totalScore += calculateSilhouetteScore(item, cluster, otherClusters)
      itemCount++
    })
  })

  return itemCount > 0 ? totalScore / itemCount : 0
}
```

**Threshold:**
- 0.7 to 1.0 — **Strong** clustering
- 0.5 to 0.7 — **Reasonable** clustering
- 0.25 to 0.5 — **Weak** clustering (consider refinement)
- < 0.25 — **Poor** clustering (needs refinement)

---

## 3. Balance Metrics

### 3.1 Cluster Size Distribution

**Definition:** How evenly distributed items are across clusters

```javascript
function calculateClusterBalance(clusters) {
  const sizes = clusters.map(c => c.items.length)
  const totalItems = sizes.reduce((sum, size) => sum + size, 0)
  const avgSize = totalItems / clusters.length

  // Calculate coefficient of variation
  const variance = sizes.reduce((sum, size) => sum + Math.pow(size - avgSize, 2), 0) / clusters.length
  const stdDev = Math.sqrt(variance)
  const coefficientOfVariation = stdDev / avgSize

  // Gini coefficient (0 = perfect balance, 1 = complete imbalance)
  const sortedSizes = sizes.sort((a, b) => a - b)
  const n = sortedSizes.length
  const gini = sortedSizes.reduce((sum, size, i) => sum + (2 * (i + 1) - n - 1) * size, 0) / (n * totalItems)

  return {
    coefficientOfVariation,
    gini,
    minSize: Math.min(...sizes),
    maxSize: Math.max(...sizes),
    avgSize,
    isBalanced: gini < 0.3 && coefficientOfVariation < 0.5
  }
}
```

**Threshold (Gini):**
- < 0.2 — **Well balanced**
- 0.2 - 0.4 — **Moderately balanced**
- > 0.4 — **Imbalanced** (consider rebalancing)

---

### 3.2 Weight Distribution

**Definition:** How evenly distributed bullet scores are across clusters

```javascript
function calculateWeightBalance(clusters) {
  const clusterWeights = clusters.map(c => c.score || 0)
  const totalWeight = clusterWeights.reduce((sum, w) => sum + w, 0)

  // Calculate entropy (higher = more balanced)
  const entropy = clusterWeights.reduce((sum, weight) => {
    const p = weight / totalWeight
    return sum - (p > 0 ? p * Math.log2(p) : 0)
  }, 0)

  const maxEntropy = Math.log2(clusters.length)
  const normalizedEntropy = entropy / maxEntropy

  return {
    entropy: normalizedEntropy,
    isBalanced: normalizedEntropy > 0.7
  }
}
```

**Threshold:**
- > 0.8 — **Well balanced**
- 0.6 - 0.8 — **Moderately balanced**
- < 0.6 — **Skewed** (one cluster dominates)

---

## 4. Interpretability Metrics

### 4.1 Label Quality

**Definition:** How well the cluster label represents its contents

```javascript
function assessLabelQuality(cluster) {
  const { concentration, dominantTags } = calculateTagConcentration(cluster)

  // Check if label matches dominant tags
  const labelWords = cluster.label.toLowerCase().split(/\s+/)
  const dominantTagWords = dominantTags.flatMap(t => t.tag.toLowerCase().split(/\s+/))

  const overlap = labelWords.filter(word => dominantTagWords.includes(word)).length
  const labelRelevance = overlap / labelWords.length

  // Check if label is too generic
  const genericLabels = ['general', 'various', 'mixed', 'other', 'miscellaneous']
  const isGeneric = genericLabels.some(generic => cluster.label.toLowerCase().includes(generic))

  return {
    labelRelevance,
    isGeneric,
    isGoodLabel: labelRelevance > 0.5 && !isGeneric,
    dominantTags: dominantTags.slice(0, 3)
  }
}
```

**Threshold:**
- > 0.7 relevance — **Good label**
- 0.4 - 0.7 relevance — **Acceptable label**
- < 0.4 relevance — **Poor label** (suggest alternative)

---

### 4.2 Archetype Match Confidence

**Definition:** How well the suggested archetype fits the cluster

```javascript
function assessArchetypeMatch(cluster, suggestedArchetype, roleArchetypesLibrary) {
  const archetypeDef = roleArchetypesLibrary.find(a => a.name === suggestedArchetype)
  if (!archetypeDef) return { confidence: 0, reason: 'archetype_not_found' }

  const clusterTags = cluster.items.flatMap(item => Object.values(item.tags || {}).flat())

  // Check overlap with archetype's core skills
  const coreSkillMatches = archetypeDef.core_skills.filter(skill =>
    clusterTags.some(tag => tag.toLowerCase().includes(skill.toLowerCase()))
  ).length

  const matchPercentage = coreSkillMatches / archetypeDef.core_skills.length

  return {
    confidence: matchPercentage,
    matchingSkills: coreSkillMatches,
    totalArchetypeSkills: archetypeDef.core_skills.length,
    isGoodMatch: matchPercentage > 0.5
  }
}
```

**Threshold:**
- > 0.7 — **High confidence** match
- 0.4 - 0.7 — **Medium confidence** (show alternatives)
- < 0.4 — **Low confidence** (don't force archetype)

---

## 5. Actionability Metrics

### 5.1 Job Title Mapping Coverage

**Definition:** How many job titles can be suggested from cluster

```javascript
function assessJobTitleCoverage(cluster, jobTitleMapping) {
  const clusterArchetype = cluster.archetype
  const matchedTitles = jobTitleMapping[clusterArchetype] || []

  return {
    titleCount: matchedTitles.length,
    hasEntryLevel: matchedTitles.some(t => t.level === 'entry'),
    hasSenior: matchedTitles.some(t => t.level === 'senior'),
    industries: [...new Set(matchedTitles.map(t => t.industry))],
    isActionable: matchedTitles.length >= 3
  }
}
```

**Threshold:**
- ≥ 5 titles — **Highly actionable**
- 2-4 titles — **Moderately actionable**
- < 2 titles — **Limited actionability**

---

### 5.2 Market Opportunity Clarity

**Definition:** How clearly clusters map to market opportunities

```javascript
function assessMarketClarity(skillsClusters, problemsClusters) {
  let mappings = 0

  skillsClusters.forEach(skillCluster => {
    problemsClusters.forEach(problemCluster => {
      // Check if skill cluster could address problem cluster
      const skillDomains = new Set(
        skillCluster.items.flatMap(i => i.tags?.domain_topic || [])
      )
      const problemDomains = new Set(
        problemCluster.items.flatMap(i => i.tags?.domain_topic || [])
      )

      const overlap = new Set([...skillDomains].filter(x => problemDomains.has(x)))
      if (overlap.size > 0) mappings++
    })
  })

  const maxPossibleMappings = skillsClusters.length * problemsClusters.length
  const mappingCoverage = mappings / maxPossibleMappings

  return {
    possibleOpportunities: mappings,
    mappingCoverage,
    hasOpportunities: mappings > 0
  }
}
```

---

## 6. Overall Quality Score

### Composite Score Calculation

```javascript
function calculateOverallQuality(clusters) {
  const metrics = {
    coherence: calculateAverageCoherence(clusters),
    distinctness: calculateAverageInterClusterDistance(clusters),
    silhouette: calculateOverallSilhouette(clusters),
    balance: calculateClusterBalance(clusters).gini,
    interpretability: calculateAverageInterpretability(clusters)
  }

  // Weighted composite score
  const weights = {
    coherence: 0.25,
    distinctness: 0.25,
    silhouette: 0.20,
    balance: 0.15,
    interpretability: 0.15
  }

  const compositeScore =
    metrics.coherence * weights.coherence +
    metrics.distinctness * weights.distinctness +
    metrics.silhouette * weights.silhouette +
    (1 - metrics.balance) * weights.balance + // Invert Gini (lower is better)
    metrics.interpretability * weights.interpretability

  return {
    overallScore: compositeScore,
    breakdown: metrics,
    grade: getQualityGrade(compositeScore),
    recommendation: getRecommendation(compositeScore, metrics)
  }
}

function getQualityGrade(score) {
  if (score >= 0.8) return 'A'
  if (score >= 0.7) return 'B'
  if (score >= 0.6) return 'C'
  if (score >= 0.5) return 'D'
  return 'F'
}

function getRecommendation(score, metrics) {
  if (score >= 0.7) {
    return {
      action: 'present_as_is',
      message: 'Clusters look great! Ready to present.'
    }
  }

  if (score >= 0.5) {
    return {
      action: 'suggest_review',
      message: 'Clusters are acceptable but could be refined. Offer optional refinement.',
      focusAreas: identifyWeakAreas(metrics)
    }
  }

  return {
    action: 'recommend_refinement',
    message: 'Clusters need improvement before presenting.',
    focusAreas: identifyWeakAreas(metrics)
  }
}

function identifyWeakAreas(metrics) {
  const weakAreas = []

  if (metrics.coherence < 0.5) weakAreas.push('coherence')
  if (metrics.distinctness < 0.5) weakAreas.push('distinctness')
  if (metrics.silhouette < 0.4) weakAreas.push('separation')
  if (metrics.balance > 0.4) weakAreas.push('balance')
  if (metrics.interpretability < 0.5) weakAreas.push('labels')

  return weakAreas
}

function calculateAverageCoherence(clusters) {
  return clusters.reduce((sum, c) => sum + calculateIntraClusterSimilarity(c), 0) / clusters.length
}

function calculateAverageInterpretability(clusters) {
  return clusters.reduce((sum, c) => sum + assessLabelQuality(c).labelRelevance, 0) / clusters.length
}
```

---

## 7. Monitoring Dashboard

### Metrics to Track Over Time

```javascript
async function trackClusteringMetrics(userId, sessionId, clusters, metrics) {
  await supabase.from('clustering_metrics').insert({
    user_id: userId,
    session_id: sessionId,
    cluster_count: clusters.length,
    overall_score: metrics.overallScore,
    coherence: metrics.breakdown.coherence,
    distinctness: metrics.breakdown.distinctness,
    silhouette: metrics.breakdown.silhouette,
    balance: metrics.breakdown.balance,
    interpretability: metrics.breakdown.interpretability,
    grade: metrics.grade,
    recommendation: metrics.recommendation.action,
    user_refined: false, // Will be updated if user refines
    created_at: new Date()
  })
}
```

### Analytics Queries

```sql
-- Average clustering quality by step
SELECT
  step_id,
  AVG(overall_score) as avg_quality,
  AVG(coherence) as avg_coherence,
  COUNT(*) as sample_size
FROM clustering_metrics
GROUP BY step_id
ORDER BY avg_quality DESC;

-- Correlation between quality and user refinement
SELECT
  CASE
    WHEN overall_score >= 0.7 THEN 'High'
    WHEN overall_score >= 0.5 THEN 'Medium'
    ELSE 'Low'
  END as quality_tier,
  AVG(CASE WHEN user_refined THEN 1 ELSE 0 END) as refinement_rate
FROM clustering_metrics
GROUP BY quality_tier;

-- Most common weak areas
SELECT
  jsonb_array_elements_text(recommendation->'focusAreas') as weak_area,
  COUNT(*) as frequency
FROM clustering_metrics
WHERE recommendation->>'action' = 'recommend_refinement'
GROUP BY weak_area
ORDER BY frequency DESC;
```

---

## 8. Real-Time Quality Feedback

### Display to User

```javascript
function generateQualityFeedback(qualityMetrics) {
  const { overallScore, grade, recommendation, breakdown } = qualityMetrics

  const messages = {
    A: '✨ Excellent clustering! These patterns are clear and distinct.',
    B: '✅ Good clustering. Patterns are well-defined.',
    C: '⚠️ Acceptable clustering, but refinement could help clarify patterns.',
    D: '⚠️ Clustering needs improvement for clearer insights.',
    F: '❌ Clustering quality is low. Refinement recommended.'
  }

  return {
    message: messages[grade],
    confidence: `${Math.round(overallScore * 100)}%`,
    showRefinementOption: grade === 'C' || grade === 'D' || grade === 'F',
    requiRefinement: grade === 'F'
  }
}
```

---

## Implementation Checklist

- [ ] Implement all metric calculation functions
- [ ] Integrate quality assessment into clustering pipeline
- [ ] Create real-time quality feedback for users
- [ ] Set up clustering metrics tracking in Supabase
- [ ] Build analytics dashboard for monitoring
- [ ] A/B test quality thresholds to optimize user experience
- [ ] Document metric calculation logic
- [ ] Create alerting for consistently low-quality clusters

---

**Status:** Ready for implementation
**Priority:** High (addresses 70% confidence concern on clustering quality)
**Estimated effort:** 3-4 days development + tuning
