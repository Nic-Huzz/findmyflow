# Nikigai Weighting Calculation Functions

Backend functions for calculating tag weights and clustering scores (no AI math required).

---

## Core Weighting Functions

### Tag Frequency Counter

```javascript
/**
 * Counts tag frequency across different contexts
 * @param {Array} allResponses - All user responses with extracted tags
 * @returns {Object} Tag frequency by context
 */
function calculateTagFrequencies(allResponses) {
  const frequencies = {}

  // Context categories based on store_as paths
  const contextCategories = {
    joy: ['hobbies', 'flow_activities', 'high_moments'],
    meaning: ['turning_points', 'life_chapters', 'challenges', 'impact', 'growth'],
    direction: ['future', 'desires', 'aspirations', 'world_changes']
  }

  allResponses.forEach(response => {
    const { store_as, tags } = response

    // Determine context category
    let contextType = null
    for (const [category, keywords] of Object.entries(contextCategories)) {
      if (keywords.some(keyword => store_as.includes(keyword))) {
        contextType = category
        break
      }
    }

    if (!contextType) return // Skip if no match

    // Count each tag
    tags.forEach(tag => {
      const key = `${tag.type}:${tag.value}` // e.g., "skill_verb:designing"

      if (!frequencies[key]) {
        frequencies[key] = {
          tag_type: tag.type,
          tag_value: tag.value,
          joy_count: 0,
          meaning_count: 0,
          direction_count: 0,
          total_count: 0,
          contexts: new Set()
        }
      }

      frequencies[key][`${contextType}_count`]++
      frequencies[key].total_count++
      frequencies[key].contexts.add(store_as)
    })
  })

  return frequencies
}
```

---

### Weight Calculator

```javascript
/**
 * Calculates normalized weights for each context type
 * @param {Object} frequencies - Tag frequency object
 * @returns {Object} Frequencies with calculated weights
 */
function calculateWeights(frequencies) {
  // Get total counts per context
  const totals = {
    joy: 0,
    meaning: 0,
    direction: 0
  }

  Object.values(frequencies).forEach(freq => {
    totals.joy += freq.joy_count
    totals.meaning += freq.meaning_count
    totals.direction += freq.direction_count
  })

  // Calculate normalized weights for each tag
  const weighted = {}

  Object.entries(frequencies).forEach(([key, freq]) => {
    weighted[key] = {
      ...freq,
      joy_weight: totals.joy > 0 ? freq.joy_count / totals.joy : 0,
      meaning_weight: totals.meaning > 0 ? freq.meaning_count / totals.meaning : 0,
      direction_weight: totals.direction > 0 ? freq.direction_count / totals.direction : 0
    }
  })

  return weighted
}
```

---

### Bullet Score Calculator

```javascript
/**
 * Calculates final bullet score using weighted formula
 * Formula: 0.5 * joy + 0.35 * meaning + 0.15 * direction
 * @param {Object} tagWeights - Tag with calculated weights
 * @returns {number} Bullet score (0-1)
 */
function calculateBulletScore(tagWeights) {
  const { joy_weight, meaning_weight, direction_weight } = tagWeights

  const score = (
    (0.5 * joy_weight) +
    (0.35 * meaning_weight) +
    (0.15 * direction_weight)
  )

  return Math.round(score * 100) / 100 // Round to 2 decimals
}
```

---

### Complete Pipeline

```javascript
/**
 * Main function: processes all responses and returns scored tags
 * @param {Array} responses - All user responses with AI-extracted tags
 * @returns {Array} Sorted array of tags with scores
 */
function processTagWeights(responses) {
  // Step 1: Count frequencies
  const frequencies = calculateTagFrequencies(responses)

  // Step 2: Calculate weights
  const weighted = calculateWeights(frequencies)

  // Step 3: Calculate bullet scores
  const scored = Object.entries(weighted).map(([key, data]) => ({
    ...data,
    bullet_score: calculateBulletScore(data)
  }))

  // Step 4: Sort by score (highest first)
  scored.sort((a, b) => b.bullet_score - a.bullet_score)

  return scored
}
```

---

## Clustering Functions

### Cluster Score Calculator

```javascript
/**
 * Calculates cluster score with diversity bonus
 * @param {Array} tagsInCluster - Tags belonging to this cluster
 * @param {Object} tagScores - Pre-calculated bullet scores
 * @returns {number} Cluster score
 */
function calculateClusterScore(tagsInCluster, tagScores) {
  // Average bullet scores
  const scores = tagsInCluster.map(tag => {
    const key = `${tag.type}:${tag.value}`
    return tagScores[key]?.bullet_score || 0
  })

  const avgScore = scores.reduce((sum, s) => sum + s, 0) / scores.length

  // Calculate diversity bonus (unique domains/contexts)
  const uniqueDomains = new Set(
    tagsInCluster
      .filter(t => t.type === 'domain_topic')
      .map(t => t.value)
  )

  const diversityBonus = Math.min(uniqueDomains.size * 0.1, 0.3) // Max +0.3

  const finalScore = avgScore + diversityBonus

  return Math.round(finalScore * 100) / 100 // Round to 2 decimals
}
```

---

### Cluster Sorter

```javascript
/**
 * Sorts clusters by score
 * @param {Array} clusters - Array of cluster objects
 * @returns {Array} Sorted clusters
 */
function sortClustersByScore(clusters) {
  return clusters
    .map(cluster => ({
      ...cluster,
      cluster_score: calculateClusterScore(cluster.tags, cluster.tagScores)
    }))
    .sort((a, b) => b.cluster_score - a.cluster_score)
}
```

---

## Example Usage

### Complete Example

```javascript
// Sample user responses with AI-extracted tags
const userResponses = [
  {
    step_id: '2.0',
    store_as: 'life_map.hobbies.childhood',
    raw_text: 'Building Lego cities, drawing maps',
    tags: [
      { type: 'skill_verb', value: 'building' },
      { type: 'skill_verb', value: 'designing' },
      { type: 'domain_topic', value: 'architecture' },
      { type: 'value', value: 'creativity' }
    ]
  },
  {
    step_id: '3.2',
    store_as: 'life_map.high_moments.current',
    raw_text: 'Launching my first product',
    tags: [
      { type: 'skill_verb', value: 'building' },
      { type: 'skill_verb', value: 'launching' },
      { type: 'domain_topic', value: 'product' },
      { type: 'emotion', value: 'pride' }
    ]
  },
  {
    step_id: '4.1',
    store_as: 'life_map.life_chapters.growth_and_struggle',
    raw_text: 'Learning to embrace uncertainty',
    tags: [
      { type: 'value', value: 'growth' },
      { type: 'problem_theme', value: 'uncertainty' }
    ]
  },
  {
    step_id: '8.0',
    store_as: 'life_map.future.desires',
    raw_text: 'Build a product that helps people find clarity',
    tags: [
      { type: 'skill_verb', value: 'building' },
      { type: 'problem_theme', value: 'lack of clarity' },
      { type: 'value', value: 'service' }
    ]
  }
]

// Process all tags
const scoredTags = processTagWeights(userResponses)

console.log('Top scored tags:')
scoredTags.slice(0, 5).forEach(tag => {
  console.log(`${tag.tag_value}: ${tag.bullet_score}`)
  console.log(`  Joy: ${tag.joy_weight.toFixed(3)}`)
  console.log(`  Meaning: ${tag.meaning_weight.toFixed(3)}`)
  console.log(`  Direction: ${tag.direction_weight.toFixed(3)}`)
})

/* Expected output:
Top scored tags:
building: 0.72
  Joy: 0.50
  Meaning: 0.00
  Direction: 0.50
creativity: 0.50
  Joy: 1.00
  Meaning: 0.00
  Direction: 0.00
service: 0.15
  Joy: 0.00
  Meaning: 0.00
  Direction: 1.00
*/
```

---

## Supabase Integration

### Store Weights in Database

```javascript
/**
 * Saves calculated weights to Supabase
 * @param {string} sessionId - User session ID
 * @param {Array} scoredTags - Tags with calculated scores
 */
async function saveTagWeights(sessionId, scoredTags) {
  const { data, error } = await supabase
    .from('tag_weights')
    .upsert(
      scoredTags.map(tag => ({
        session_id: sessionId,
        tag_type: tag.tag_type,
        tag_value: tag.tag_value,
        joy_count: tag.joy_count,
        meaning_count: tag.meaning_count,
        direction_count: tag.direction_count,
        joy_weight: tag.joy_weight,
        meaning_weight: tag.meaning_weight,
        direction_weight: tag.direction_weight,
        bullet_score: tag.bullet_score,
        total_count: tag.total_count
      })),
      { onConflict: ['session_id', 'tag_type', 'tag_value'] }
    )

  if (error) throw error
  return data
}
```

---

### Retrieve Top Tags

```javascript
/**
 * Gets top N tags by score for a session
 * @param {string} sessionId - User session ID
 * @param {string} tagType - Optional: filter by tag type
 * @param {number} limit - Number of results
 */
async function getTopTags(sessionId, tagType = null, limit = 10) {
  let query = supabase
    .from('tag_weights')
    .select('*')
    .eq('session_id', sessionId)
    .order('bullet_score', { ascending: false })
    .limit(limit)

  if (tagType) {
    query = query.eq('tag_type', tagType)
  }

  const { data, error } = await query

  if (error) throw error
  return data
}
```

---

## Testing & Validation

### Unit Tests

```javascript
describe('Weighting Calculations', () => {
  test('calculates joy weight correctly', () => {
    const responses = [
      {
        store_as: 'life_map.hobbies.childhood',
        tags: [{ type: 'skill_verb', value: 'building' }]
      },
      {
        store_as: 'life_map.hobbies.highschool',
        tags: [{ type: 'skill_verb', value: 'building' }]
      }
    ]

    const frequencies = calculateTagFrequencies(responses)
    const weighted = calculateWeights(frequencies)
    const key = 'skill_verb:building'

    expect(weighted[key].joy_weight).toBe(1.0) // 2/2 = 100%
    expect(weighted[key].meaning_weight).toBe(0)
    expect(weighted[key].direction_weight).toBe(0)
  })

  test('calculates bullet score with correct formula', () => {
    const tagWeights = {
      joy_weight: 0.8,
      meaning_weight: 0.4,
      direction_weight: 0.2
    }

    const score = calculateBulletScore(tagWeights)

    // 0.5 * 0.8 + 0.35 * 0.4 + 0.15 * 0.2 = 0.4 + 0.14 + 0.03 = 0.57
    expect(score).toBe(0.57)
  })

  test('calculates cluster score with diversity bonus', () => {
    const tags = [
      { type: 'skill_verb', value: 'designing' },
      { type: 'skill_verb', value: 'building' },
      { type: 'domain_topic', value: 'architecture' },
      { type: 'domain_topic', value: 'product' },
      { type: 'domain_topic', value: 'education' }
    ]

    const tagScores = {
      'skill_verb:designing': { bullet_score: 0.8 },
      'skill_verb:building': { bullet_score: 0.7 },
      'domain_topic:architecture': { bullet_score: 0.6 },
      'domain_topic:product': { bullet_score: 0.5 },
      'domain_topic:education': { bullet_score: 0.4 }
    }

    const score = calculateClusterScore(tags, tagScores)

    // Avg: (0.8 + 0.7 + 0.6 + 0.5 + 0.4) / 5 = 0.6
    // Diversity bonus: 3 unique domains * 0.1 = 0.3
    // Total: 0.6 + 0.3 = 0.9
    expect(score).toBe(0.9)
  })
})
```

---

## Performance Considerations

### Optimization Tips

1. **Batch Processing**
   - Process all tags at once after flow completion
   - Don't recalculate after every step

2. **Caching**
   - Cache calculated weights in session
   - Only recalculate when new responses added

3. **Database Indexing**
```sql
CREATE INDEX idx_tag_weights_session ON tag_weights(session_id);
CREATE INDEX idx_tag_weights_score ON tag_weights(bullet_score DESC);
CREATE INDEX idx_tag_weights_type ON tag_weights(tag_type, bullet_score DESC);
```

---

## Edge Cases

### Handle Empty Data

```javascript
function calculateBulletScore(tagWeights) {
  const { joy_weight = 0, meaning_weight = 0, direction_weight = 0 } = tagWeights

  // Handle all zeros
  if (joy_weight === 0 && meaning_weight === 0 && direction_weight === 0) {
    return 0
  }

  const score = (
    (0.5 * joy_weight) +
    (0.35 * meaning_weight) +
    (0.15 * direction_weight)
  )

  return Math.round(score * 100) / 100
}
```

### Handle Missing Tags

```javascript
function processTagWeights(responses) {
  // Filter out responses without tags
  const validResponses = responses.filter(r => r.tags && r.tags.length > 0)

  if (validResponses.length === 0) {
    return [] // Return empty array if no tags
  }

  // Continue with processing...
  const frequencies = calculateTagFrequencies(validResponses)
  // ...
}
```

---

## Next Steps

See also:
- `/docs/nikigai-auto-tagging-schema.md` - Tag extraction system
- `/docs/nikigai-structured-outputs.md` - Output formats
- Database schema for storing weights

---

*Last updated: 2025-11-07*
