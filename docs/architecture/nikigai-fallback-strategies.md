# Nikigai Fallback Strategies Specification

## Overview

This document defines fallback behaviors when things don't go as expected — sparse data, poor clustering, ambiguous tags, or system failures. Fallback strategies ensure a graceful user experience even when edge cases occur.

---

## Strategy Categories

1. **Data Fallbacks** — When user input is insufficient
2. **Clustering Fallbacks** — When clustering fails or produces poor results
3. **Tag Extraction Fallbacks** — When AI extraction is unreliable
4. **System Fallbacks** — When technical failures occur
5. **User Experience Fallbacks** — When user gets stuck or confused

---

## 1. Data Fallbacks

### Scenario 1.1: Sparse User Response (< 3 bullets)

**Trigger:** User provides fewer than 3 bullet points

**Primary Strategy:** Encourage expansion (see sparse-data-handling.md)

**Fallback if user declines:**
```javascript
async function handlePersistentSparseData(sessionData, stepId) {
  const bulletCount = sessionData.responses[stepId].bulletCount

  if (bulletCount === 1) {
    return {
      adjustClustering: true,
      params: {
        target_clusters_min: 1,
        target_clusters_max: 2,
        skip_diversity_bonus: true
      },
      userMessage: "I'll work with what you've shared. Note that patterns may be less specific with limited data, but we can refine later!",
      markAsLimitedData: true
    }
  }

  if (bulletCount === 2) {
    return {
      adjustClustering: true,
      params: {
        target_clusters_min: 1,
        target_clusters_max: 3
      },
      userMessage: "Got it! I'll look for patterns in what you shared. More examples in future sections will help sharpen these insights.",
      markAsLimitedData: true
    }
  }

  // If 0 bullets - this should be blocked by validation
  return {
    block: true,
    userMessage: "I need at least one example to continue. Could you share one thing that comes to mind?"
  }
}
```

---

### Scenario 1.2: Vague or Too-Brief Responses

**Trigger:** Responses pass sparsity check but are too vague

**Primary Strategy:** Request clarification

**Fallback if user doesn't clarify:**
```javascript
async function handleVagueResponses(sessionData, stepId) {
  return {
    proceedWithCaution: true,
    tagExtractionPrompt: `
      User provided brief responses. Be generous in tag extraction.
      Infer meaning from context where appropriate.
      Example: "art" → extract as [skill_verb: creating, domain_topic: art]
    `,
    userMessage: "I'll do my best to find patterns. If any clusters don't resonate, you can refine them!",
    lowerQualityThreshold: true // Accept lower clustering quality
  }
}
```

---

### Scenario 1.3: User Skips Multiple Questions

**Trigger:** User skips 3+ questions in a row

**Strategy:**
```javascript
async function handleMultipleSkips(sessionData) {
  const skipCount = sessionData.skipHistory.length

  if (skipCount >= 3) {
    return {
      pauseAndCheck: true,
      userMessage: `I notice you've skipped the last ${skipCount} questions. That's totally fine!

Would you like to:
1️⃣ **Continue anyway** — I'll work with what we have so far
2️⃣ **Jump ahead** — Skip to a different section
3️⃣ **Take a break** — Save progress and come back later

What feels right?`,
      options: ['continue', 'jump_ahead', 'pause'],
      adjustExpectations: true // Lower data requirements for clustering
    }
  }
}
```

---

## 2. Clustering Fallbacks

### Scenario 2.1: Clustering Produces Only 1 Cluster

**Trigger:** Algorithm groups everything into single cluster

**Root Cause:** Data is too homogeneous OR insufficient variety in tags

**Strategy:**
```javascript
async function handleSingleCluster(cluster, sessionData) {
  // Try to split based on secondary tags
  const splitAttempt = attemptSplitBySecondaryTags(cluster)

  if (splitAttempt.success && splitAttempt.clusters.length >= 2) {
    return {
      useSplit: true,
      clusters: splitAttempt.clusters,
      userMessage: "I found some subtle variations in your responses and split them into themes."
    }
  }

  // If split fails, present single cluster with caveat
  return {
    presentSingleCluster: true,
    userMessage: `Your responses show a strong **unified theme**:

📦 **${cluster.label}**
${cluster.items.map(i => `• ${i.text}`).join('\n')}

This suggests a clear, focused pattern. As we continue through more sections, we may see this theme branch into multiple clusters.

Does this single theme feel accurate so far?`,
    continueClustering: true // Keep clustering in future sections
  }
}

function attemptSplitBySecondaryTags(cluster) {
  // Group by secondary characteristics (e.g., domain_topic if primary was skill_verb)
  const groups = {}

  cluster.items.forEach(item => {
    const secondaryTags = item.tags.domain_topic || item.tags.context || []
    const key = secondaryTags[0] || 'general'
    if (!groups[key]) groups[key] = []
    groups[key].push(item)
  })

  const clusters = Object.entries(groups)
    .filter(([key, items]) => items.length >= 2) // Only groups with 2+ items
    .map(([key, items]) => ({
      label: `${cluster.label} — ${key}`,
      items
    }))

  return {
    success: clusters.length >= 2,
    clusters
  }
}
```

---

### Scenario 2.2: Clustering Produces Too Many Clusters (> 8)

**Trigger:** Over-fragmentation due to diverse responses

**Strategy:**
```javascript
async function handleTooManyClusters(clusters) {
  // Merge similar clusters
  const merged = mergeSimilarClusters(clusters, similarityThreshold = 0.6)

  if (merged.length <= 6) {
    return {
      useMerged: true,
      clusters: merged,
      userMessage: "I combined some overlapping themes to keep things clear."
    }
  }

  // If still too many, present top clusters + "Other"
  const sorted = clusters.sort((a, b) => b.score - a.score)
  const top5 = sorted.slice(0, 5)
  const other = {
    label: "Other Patterns",
    items: sorted.slice(5).flatMap(c => c.items),
    isOtherBucket: true
  }

  return {
    useTopClusters: true,
    clusters: [...top5, other],
    userMessage: `I found many distinct patterns! Here are your **top 5 themes**, plus an "Other" category:

${top5.map((c, i) => `${i + 1}. ${c.label}`).join('\n')}
6. Other Patterns (${other.items.length} items)

Would you like to explore the "Other" category or continue with these top themes?`
  }
}

function mergeSimilarClusters(clusters, threshold) {
  const merged = []
  const used = new Set()

  clusters.forEach((cluster, i) => {
    if (used.has(i)) return

    const similar = clusters.filter((other, j) => {
      if (i === j || used.has(j)) return false
      return calculateInterClusterDistance(cluster, other) < (1 - threshold)
    })

    if (similar.length > 0) {
      // Merge cluster with similar ones
      const mergedCluster = {
        label: cluster.label, // Keep primary label
        items: [cluster, ...similar].flatMap(c => c.items),
        mergedFrom: [i, ...similar.map(s => clusters.indexOf(s))]
      }
      merged.push(mergedCluster)
      used.add(i)
      similar.forEach(s => used.add(clusters.indexOf(s)))
    } else {
      merged.push(cluster)
      used.add(i)
    }
  })

  return merged
}
```

---

### Scenario 2.3: Low Quality Clusters (Silhouette < 0.4)

**Trigger:** Quality metrics indicate poor clustering

**Strategy:**
```javascript
async function handleLowQualityClusters(clusters, qualityMetrics) {
  const { silhouette, recommendation } = qualityMetrics

  if (recommendation === 'recommend_refinement') {
    return {
      forceRefinement: true,
      userMessage: `I've generated some clusters, but they're not as distinct as I'd like.

**Would you prefer to:**
1️⃣ **Refine now** — Adjust clusters together (2 mins)
2️⃣ **Continue** — See how patterns evolve with more data
3️⃣ **Skip clustering** — Just collect answers for now

What works for you?`,
      options: ['refine', 'continue', 'skip'],
      defaultOption: 'continue'
    }
  }

  if (silhouette < 0.25) {
    // Critical quality issue - skip clustering entirely
    return {
      skipClustering: true,
      userMessage: `I'm having trouble finding clear patterns just yet — your responses are quite diverse (which is great!).

Let's collect more data first. Patterns will emerge as we continue through your story.

Ready for the next section?`,
      deferClustering: true // Will retry after more data
    }
  }

  return { proceed: true }
}
```

---

## 3. Tag Extraction Fallbacks

### Scenario 3.1: AI Extraction Returns Empty Tags

**Trigger:** No tags extracted from response

**Strategy:**
```javascript
async function handleFailedTagExtraction(response, stepId) {
  // Retry with more permissive prompt
  const retryPrompt = `
Extract tags very generously from this response. Even single words can be tags.
Response: "${response}"

Be creative and infer meaning. If user says "I like helping people", extract:
- skill_verb: [helping, supporting]
- persona_hint: [people]
- value: [service]
`

  const retryTags = await extractTagsWithPrompt(response, retryPrompt)

  if (Object.values(retryTags).flat().length > 0) {
    return {
      usedRetry: true,
      tags: retryTags
    }
  }

  // If retry also fails, use rule-based extraction
  const ruleBased = ruleBasedTagExtraction(response)

  if (Object.values(ruleBased).flat().length > 0) {
    return {
      usedRuleBased: true,
      tags: ruleBased,
      lowConfidence: true
    }
  }

  // Last resort: store raw text, skip tagging
  return {
    skipTagging: true,
    storeRaw: response,
    userMessage: "Got it! I'll incorporate this into your overall picture.",
    retryTaggingLater: true // Will re-attempt with more context
  }
}

function ruleBasedTagExtraction(text) {
  // Simple keyword-based extraction
  const skillVerbs = ['design', 'build', 'create', 'teach', 'write', 'analyze']
  const domains = ['tech', 'education', 'health', 'art', 'business']
  const values = ['growth', 'impact', 'creativity', 'connection']

  const tags = {
    skill_verb: skillVerbs.filter(v => text.toLowerCase().includes(v)).map(v => v + 'ing'),
    domain_topic: domains.filter(d => text.toLowerCase().includes(d)),
    value: values.filter(v => text.toLowerCase().includes(v)),
    emotion: [],
    context: [],
    problem_theme: [],
    persona_hint: []
  }

  return tags
}
```

---

### Scenario 3.2: Ambiguous Tag Categorization

**Trigger:** Tag could fit multiple categories

**Strategy:** Use decision tree (see tag-ambiguity-decision-tree.md), but if still ambiguous:

```javascript
async function handleAmbiguousTag(tag, possibleCategories) {
  if (possibleCategories.length === 2) {
    // Dual-tag: add to both categories
    return {
      strategy: 'dual_tag',
      categories: possibleCategories,
      tag
    }
  }

  // Use context from surrounding tags to disambiguate
  const contextualCategory = inferFromContext(tag, possibleCategories, surroundingTags)

  return {
    strategy: 'contextual_inference',
    category: contextualCategory,
    tag,
    confidence: 'medium'
  }
}
```

---

## 4. System Fallbacks

### Scenario 4.1: Claude API Timeout or Failure

**Trigger:** API call fails or times out

**Strategy:**
```javascript
async function handleAPIFailure(operation, retryCount = 0) {
  const MAX_RETRIES = 3

  if (retryCount < MAX_RETRIES) {
    // Exponential backoff
    await sleep(Math.pow(2, retryCount) * 1000)
    return {
      retry: true,
      retryCount: retryCount + 1
    }
  }

  // Fallback strategies by operation type
  const fallbacks = {
    tag_extraction: {
      useCached: true, // Use similar past extractions
      useRuleBased: true,
      userMessage: "Processing your response with our backup system..."
    },

    clustering: {
      skipClustering: true,
      deferToLater: true,
      userMessage: "I'll organize these insights in the next section. Let's keep going!"
    },

    archetype_suggestion: {
      skipArchetype: true,
      userMessage: "You can name these clusters yourself — what themes do you see?"
    }
  }

  return fallbacks[operation] || {
    gracefulSkip: true,
    userMessage: "Let's continue — I'll catch up on this in a moment."
  }
}
```

---

### Scenario 4.2: Database Write Failure

**Trigger:** Supabase insert/update fails

**Strategy:**
```javascript
async function handleDatabaseFailure(data, operation) {
  // Store in localStorage as backup
  const backupKey = `nikigai_backup_${sessionData.user_id}_${Date.now()}`
  localStorage.setItem(backupKey, JSON.stringify(data))

  // Attempt sync in background
  backgroundSync.schedule({
    operation,
    data,
    retryInterval: 5000
  })

  return {
    backedUp: true,
    userMessage: "Your progress is saved locally. We'll sync to the cloud when connection improves.",
    continueOffline: true
  }
}
```

---

## 5. User Experience Fallbacks

### Scenario 5.1: User Seems Confused or Stuck

**Trigger:** Multiple "back" commands, long pause, or "/help"

**Strategy:**
```javascript
async function handleUserConfusion(sessionData) {
  const recentActions = sessionData.recentActions.slice(-5)

  if (recentActions.filter(a => a === 'back').length >= 2) {
    return {
      offerGuidance: true,
      userMessage: `I notice you went back a couple times. Want to:

1️⃣ **See an example** — I'll show you what a good answer looks like
2️⃣ **Skip this section** — Come back to it later
3️⃣ **Talk to support** — Get help from a human

What would be most helpful?`,
      options: ['example', 'skip', 'support']
    }
  }

  if (sessionData.timeSinceLastResponse > 300000) { // 5 minutes
    return {
      checkIn: true,
      userMessage: "Still there? No rush — take your time. This question is asking about [simpler explanation]. Want an example?",
      offerExample: true
    }
  }
}
```

---

### Scenario 5.2: User Expresses Frustration

**Trigger:** Certain keywords detected ("I don't know", "this is hard", "confused")

**Strategy:**
```javascript
async function handleFrustration(userMessage) {
  const frustrationKeywords = ['don\'t know', 'hard', 'difficult', 'confused', 'stuck']

  if (frustrationKeywords.some(kw => userMessage.toLowerCase().includes(kw))) {
    return {
      empathize: true,
      response: `I hear you — these questions can feel tricky sometimes.

Here's the thing: **there's no wrong answer.** I'm not looking for anything specific — just your honest experience.

Would it help if I:
• Broke this question into smaller parts?
• Showed you an example?
• Let you skip this for now?

What feels easiest?`,
      lowerBar: true, // Accept shorter responses
      offerAlternatives: true
    }
  }
}
```

---

## 6. Fallback Priority Matrix

When multiple fallbacks could apply, use this priority:

| Priority | Scenario | Action |
|----------|----------|--------|
| 1 (Critical) | System failure | Switch to backup system, save locally |
| 2 (High) | No user input | Block progression, request input |
| 3 (High) | User frustration | Empathize, offer alternatives |
| 4 (Medium) | Sparse data | Encourage expansion, adjust if declined |
| 5 (Medium) | Poor clustering | Offer refinement, proceed if declined |
| 6 (Low) | Tag ambiguity | Use decision tree, dual-tag if needed |
| 7 (Low) | Single cluster | Present with explanation |

---

## 7. Testing Fallback Scenarios

### Test Cases

```javascript
const fallbackTestCases = [
  {
    name: 'User provides 1 bullet when 3-5 expected',
    trigger: { bulletCount: 1, expected: 3 },
    expectedFallback: 'sparse_data_followup',
    expectedOutcome: 'adjust_clustering_params'
  },
  {
    name: 'Clustering produces single cluster',
    trigger: { clusterCount: 1 },
    expectedFallback: 'attempt_split_or_present_single',
    expectedOutcome: 'user_sees_single_cluster_with_explanation'
  },
  {
    name: 'API times out 3 times',
    trigger: { apiFailures: 3 },
    expectedFallback: 'use_rule_based_extraction',
    expectedOutcome: 'process_continues_without_AI'
  },
  {
    name: 'User types "I don\'t know" 3 times',
    trigger: { frustrationCount: 3 },
    expectedFallback: 'offer_skip_or_example',
    expectedOutcome: 'user_gets_alternatives'
  }
]

async function testFallbacks() {
  for (const testCase of fallbackTestCases) {
    const result = await simulateScenario(testCase.trigger)
    assert(result.fallback === testCase.expectedFallback)
    assert(result.outcome === testCase.expectedOutcome)
  }
}
```

---

## 8. Monitoring Fallback Usage

### Track Fallback Frequency

```javascript
async function trackFallbackUsage(userId, fallbackType, scenario, outcome) {
  await supabase.from('fallback_events').insert({
    user_id: userId,
    fallback_type: fallbackType,
    scenario: scenario,
    outcome: outcome,
    successful: outcome !== 'user_abandoned',
    timestamp: new Date()
  })
}

// Useful metrics:
// - Most common fallback scenarios
// - Fallback success rate (user continues vs. abandons)
// - Correlation between fallbacks and completion rate
// - Time spent in fallback vs. normal flow
```

---

## Implementation Checklist

- [ ] Implement all fallback handlers
- [ ] Integrate fallbacks into main flow logic
- [ ] Add priority-based fallback selection
- [ ] Create user-friendly fallback messages
- [ ] Add fallback tracking to analytics
- [ ] Test all fallback scenarios
- [ ] Document fallback behaviors in user guide
- [ ] Monitor fallback usage and iterate

---

**Status:** Ready for implementation
**Priority:** High (ensures robustness across all uncertainties)
**Estimated effort:** 3-4 days development + extensive testing
