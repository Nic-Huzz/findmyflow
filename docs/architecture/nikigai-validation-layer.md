# Nikigai Validation Layer Specification

## Overview

The validation layer ensures data quality, catches errors early, and provides helpful feedback throughout the Nikigai journey. It validates user inputs, AI extractions, clustering quality, and data integrity.

---

## Validation Types

1. **Input Validation** — User responses meet minimum requirements
2. **Tag Extraction Validation** — AI-extracted tags are reasonable
3. **Clustering Validation** — Clusters meet quality thresholds
4. **Data Integrity Validation** — Stored data is complete and consistent
5. **Flow Validation** — User progression follows correct paths

---

## 1. Input Validation

### 1.1 Response Sparsity Check

**Purpose:** Detect when user provides too few bullet points

```javascript
function validateResponseSparsity(response, expectedMin = 3) {
  const bullets = extractBulletPoints(response)

  const validation = {
    isValid: bullets.length >= expectedMin,
    bulletCount: bullets.length,
    expectedMin,
    severity: bullets.length === 0 ? 'critical' : bullets.length < 2 ? 'high' : 'medium',
    message: bullets.length === 0
      ? 'No response detected. Please share at least one example.'
      : bullets.length < expectedMin
      ? `${bullets.length} bullet(s) detected. ${expectedMin - bullets.length} more would help improve pattern accuracy.`
      : 'Response meets expected length.'
  }

  return validation
}
```

### 1.2 Response Quality Check

**Purpose:** Detect vague or too-brief responses

```javascript
function validateResponseQuality(response) {
  const bullets = extractBulletPoints(response)

  const issues = []

  bullets.forEach((bullet, index) => {
    // Check for too-short bullets
    if (bullet.length < 10) {
      issues.push({
        bulletIndex: index,
        bullet,
        issue: 'too_brief',
        suggestion: 'Add more context or detail (e.g., "Design — creating visual identities for brands")'
      })
    }

    // Check for single-word bullets
    if (bullet.split(' ').length === 1) {
      issues.push({
        bulletIndex: index,
        bullet,
        issue: 'single_word',
        suggestion: 'Expand with details about what/why/how (e.g., "Photography — capturing candid moments at events")'
      })
    }

    // Check for overly generic terms
    const genericTerms = ['things', 'stuff', 'something', 'whatever', 'etc']
    if (genericTerms.some(term => bullet.toLowerCase().includes(term))) {
      issues.push({
        bulletIndex: index,
        bullet,
        issue: 'too_vague',
        suggestion: 'Be more specific about what you mean'
      })
    }
  })

  return {
    isValid: issues.length === 0,
    issues,
    severity: issues.length > bullets.length / 2 ? 'high' : 'medium',
    message: issues.length === 0
      ? 'Response quality looks good'
      : `${issues.length} bullet(s) could use more detail for better pattern detection`
  }
}
```

### 1.3 Expected Input Type Check

**Purpose:** Ensure user response matches expected format

```javascript
function validateInputType(response, expectedType) {
  const validations = {
    text_list: () => {
      const bullets = extractBulletPoints(response)
      return {
        isValid: bullets.length > 0,
        message: bullets.length === 0
          ? 'Please format your response as a bulleted list'
          : 'List format detected'
      }
    },

    object_list: (schema) => {
      try {
        const parsed = JSON.parse(response)
        const isArray = Array.isArray(parsed)
        const hasRequiredFields = isArray && parsed.every(obj =>
          Object.keys(schema).every(key => key in obj)
        )

        return {
          isValid: hasRequiredFields,
          message: !isArray
            ? 'Expected a list of items'
            : !hasRequiredFields
            ? `Missing required fields: ${Object.keys(schema).join(', ')}`
            : 'Valid object list'
        }
      } catch (e) {
        return {
          isValid: false,
          message: 'Could not parse response. Expected structured data.'
        }
      }
    },

    confirmation: () => {
      const confirmationWords = ['yes', 'ok', 'sure', 'ready', 'continue', 'yep', 'yeah']
      const isConfirmation = confirmationWords.some(word =>
        response.toLowerCase().includes(word)
      )

      return {
        isValid: isConfirmation,
        message: isConfirmation
          ? 'Confirmation received'
          : 'Please confirm to continue (e.g., "yes", "ready")'
      }
    }
  }

  return validations[expectedType]?.() || { isValid: true, message: 'No type validation required' }
}
```

---

## 2. Tag Extraction Validation

### 2.1 Tag Extraction Completeness Check

**Purpose:** Ensure AI extracted meaningful tags from response

```javascript
function validateTagExtraction(response, extractedTags) {
  const responseLength = response.length
  const totalTags = Object.values(extractedTags).flat().length

  const issues = []

  // Check if extraction is suspiciously sparse
  if (responseLength > 100 && totalTags < 3) {
    issues.push({
      issue: 'sparse_extraction',
      severity: 'high',
      message: 'User provided detailed response but few tags extracted. Review extraction logic.'
    })
  }

  // Check if extraction is suspiciously dense
  if (responseLength < 50 && totalTags > 10) {
    issues.push({
      issue: 'over_extraction',
      severity: 'medium',
      message: 'Short response but many tags extracted. May include noise.'
    })
  }

  // Check for empty tag categories
  const emptyCategories = Object.entries(extractedTags)
    .filter(([key, value]) => value.length === 0)
    .map(([key]) => key)

  // It's OK to have some empty categories, but all empty is suspicious
  if (emptyCategories.length === Object.keys(extractedTags).length) {
    issues.push({
      issue: 'no_tags_extracted',
      severity: 'critical',
      message: 'No tags extracted from response. Extraction may have failed.'
    })
  }

  return {
    isValid: issues.length === 0 || issues.every(i => i.severity !== 'critical'),
    totalTags,
    issues,
    message: issues.length === 0
      ? `Extracted ${totalTags} tags successfully`
      : `Extraction concerns: ${issues.map(i => i.message).join('; ')}`
  }
}
```

### 2.2 Tag Category Validation

**Purpose:** Ensure tags are in correct categories (catch misclassifications)

```javascript
function validateTagCategories(extractedTags) {
  const issues = []

  // Check for common mistakes

  // Mistake 1: Noun forms in skill_verb (should be -ing form)
  extractedTags.skill_verb?.forEach(tag => {
    if (!tag.endsWith('ing') && !tag.includes('_')) {
      issues.push({
        tag,
        category: 'skill_verb',
        issue: 'not_verb_form',
        suggestion: `Should this be "${tag}ing" or is it actually a value/domain_topic?`
      })
    }
  })

  // Mistake 2: Values in skill_verb
  const commonValues = ['creativity', 'leadership', 'empathy', 'integrity', 'growth']
  extractedTags.skill_verb?.forEach(tag => {
    if (commonValues.includes(tag.toLowerCase())) {
      issues.push({
        tag,
        category: 'skill_verb',
        issue: 'value_in_skill_verb',
        suggestion: `"${tag}" should likely be in 'value' category, or convert to verb form`
      })
    }
  })

  // Mistake 3: Problems in emotion
  const commonProblems = ['burnout', 'disconnection', 'uncertainty', 'confusion']
  extractedTags.emotion?.forEach(tag => {
    if (commonProblems.includes(tag.toLowerCase())) {
      issues.push({
        tag,
        category: 'emotion',
        issue: 'problem_in_emotion',
        suggestion: `"${tag}" might be better categorized as problem_theme if it's recurring`
      })
    }
  })

  // Mistake 4: Vague persona hints
  const vaguePersonas = ['people', 'everyone', 'anyone', 'them']
  extractedTags.persona_hint?.forEach(tag => {
    if (vaguePersonas.some(vague => tag.toLowerCase().includes(vague))) {
      issues.push({
        tag,
        category: 'persona_hint',
        issue: 'too_vague',
        suggestion: `"${tag}" is too vague. Needs more specificity to be useful.`
      })
    }
  })

  return {
    isValid: issues.filter(i => i.issue !== 'not_verb_form').length === 0,
    issues,
    message: issues.length === 0
      ? 'Tag categorization looks correct'
      : `${issues.length} potential categorization issue(s) detected`
  }
}
```

---

## 3. Clustering Validation

### 3.1 Cluster Quality Metrics

**Purpose:** Assess if generated clusters meet quality standards

```javascript
function validateClusterQuality(clusters) {
  const metrics = {
    clusterCount: clusters.length,
    avgItemsPerCluster: clusters.reduce((sum, c) => sum + c.items.length, 0) / clusters.length,
    minItems: Math.min(...clusters.map(c => c.items.length)),
    maxItems: Math.max(...clusters.map(c => c.items.length)),
    diversity: calculateDiversityScore(clusters),
    distinctness: calculateDistinctnessScore(clusters)
  }

  const issues = []

  // Check: Too few clusters
  if (metrics.clusterCount < 2) {
    issues.push({
      issue: 'too_few_clusters',
      severity: 'high',
      message: 'Only 1 cluster created. Consider if data is too homogeneous or clustering failed.'
    })
  }

  // Check: Too many clusters
  if (metrics.clusterCount > 8) {
    issues.push({
      issue: 'too_many_clusters',
      severity: 'medium',
      message: `${metrics.clusterCount} clusters created. May be too fragmented for clarity.`
    })
  }

  // Check: Imbalanced clusters
  if (metrics.maxItems > metrics.minItems * 4) {
    issues.push({
      issue: 'imbalanced_clusters',
      severity: 'medium',
      message: `Largest cluster (${metrics.maxItems} items) is 4x larger than smallest (${metrics.minItems}). Consider rebalancing.`
    })
  }

  // Check: Clusters too small
  if (metrics.minItems < 2) {
    issues.push({
      issue: 'cluster_too_small',
      severity: 'medium',
      message: 'At least one cluster has fewer than 2 items. May not be meaningful.'
    })
  }

  // Check: Clusters too large
  if (metrics.maxItems > 10) {
    issues.push({
      issue: 'cluster_too_large',
      severity: 'low',
      message: `Largest cluster has ${metrics.maxItems} items. May need splitting.`
    })
  }

  // Check: Low diversity
  if (metrics.diversity < 0.4) {
    issues.push({
      issue: 'low_diversity',
      severity: 'medium',
      message: 'Clusters lack diversity. Items may be too similar across clusters.'
    })
  }

  // Check: Low distinctness
  if (metrics.distinctness < 0.5) {
    issues.push({
      issue: 'low_distinctness',
      severity: 'high',
      message: 'Clusters are not distinct enough. May have significant overlap.'
    })
  }

  const overallQuality = (metrics.diversity + metrics.distinctness) / 2

  return {
    isValid: issues.filter(i => i.severity === 'high').length === 0,
    metrics,
    overallQuality,
    issues,
    recommendation: overallQuality < 0.5
      ? 'recommend_refinement'
      : overallQuality < 0.7
      ? 'suggest_review'
      : 'clusters_look_good',
    message: issues.length === 0
      ? `${metrics.clusterCount} clusters created with ${overallQuality.toFixed(0)}% quality`
      : `Quality concerns: ${issues.map(i => i.message).join('; ')}`
  }
}

function calculateDiversityScore(clusters) {
  // Diversity = how varied the items are within and across clusters
  const allDomains = clusters.flatMap(c =>
    c.items.flatMap(item => item.tags?.domain_topic || [])
  )
  const uniqueDomains = new Set(allDomains)

  return uniqueDomains.size / Math.max(allDomains.length, 1)
}

function calculateDistinctnessScore(clusters) {
  // Distinctness = how different clusters are from each other
  let overlapScore = 0
  let comparisons = 0

  for (let i = 0; i < clusters.length; i++) {
    for (let j = i + 1; j < clusters.length; j++) {
      const cluster1Tags = new Set(
        clusters[i].items.flatMap(item => Object.values(item.tags || {}).flat())
      )
      const cluster2Tags = new Set(
        clusters[j].items.flatMap(item => Object.values(item.tags || {}).flat())
      )

      const intersection = new Set([...cluster1Tags].filter(x => cluster2Tags.has(x)))
      const union = new Set([...cluster1Tags, ...cluster2Tags])

      const similarity = intersection.size / union.size
      overlapScore += (1 - similarity) // Higher score = more distinct
      comparisons++
    }
  }

  return comparisons > 0 ? overlapScore / comparisons : 1
}
```

---

## 4. Data Integrity Validation

### 4.1 Session Data Completeness

**Purpose:** Ensure all required data is present before moving to next phase

```javascript
function validateSessionCompleteness(sessionData, requiredFields) {
  const missing = []

  requiredFields.forEach(field => {
    const value = getNestedValue(sessionData, field)
    if (!value || (Array.isArray(value) && value.length === 0)) {
      missing.push(field)
    }
  })

  return {
    isValid: missing.length === 0,
    missing,
    completeness: ((requiredFields.length - missing.length) / requiredFields.length) * 100,
    message: missing.length === 0
      ? 'All required data collected'
      : `Missing ${missing.length} required field(s): ${missing.join(', ')}`
  }
}

function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => current?.[key], obj)
}
```

### 4.2 Data Consistency Check

**Purpose:** Ensure data relationships are intact

```javascript
function validateDataConsistency(sessionData) {
  const issues = []

  // Check: Clusters reference existing data
  if (sessionData.skills?.final) {
    sessionData.skills.final.forEach(cluster => {
      if (!cluster.source_responses || cluster.source_responses.length === 0) {
        issues.push({
          issue: 'cluster_no_source',
          cluster: cluster.label,
          message: `Cluster "${cluster.label}" has no source responses`
        })
      }
    })
  }

  // Check: Tags match stored responses
  if (sessionData.tag_weights) {
    Object.keys(sessionData.tag_weights).forEach(tagKey => {
      const sourceResponse = sessionData.life_map?.[tagKey]
      if (!sourceResponse) {
        issues.push({
          issue: 'orphaned_tags',
          tag: tagKey,
          message: `Tags exist for "${tagKey}" but no corresponding response found`
        })
      }
    })
  }

  // Check: Future pulls exist when nikigai path is selected
  if (sessionData.nikigai?.path_type && !sessionData.life_map?.future?.top3_now) {
    issues.push({
      issue: 'missing_future_vision',
      message: 'Nikigai path selected but no future vision captured'
    })
  }

  return {
    isValid: issues.length === 0,
    issues,
    message: issues.length === 0
      ? 'Data consistency validated'
      : `${issues.length} consistency issue(s) detected`
  }
}
```

---

## 5. Flow Validation

### 5.1 Step Progression Check

**Purpose:** Ensure user is following correct flow paths

```javascript
function validateStepProgression(currentStep, previousStep, nextStep, flowDefinition) {
  const currentStepDef = flowDefinition.steps.find(s => s.id === currentStep)
  const allowedNextSteps = currentStepDef?.next_step_rules?.map(r => r.goto || r.go_to) || []

  if (!allowedNextSteps.includes(nextStep)) {
    return {
      isValid: false,
      severity: 'critical',
      message: `Invalid step progression: ${currentStep} → ${nextStep}. Allowed: ${allowedNextSteps.join(', ')}`
    }
  }

  return {
    isValid: true,
    message: 'Valid step progression'
  }
}
```

---

## 6. Validation Orchestration

### Master Validation Function

```javascript
async function validateBeforeProgression(sessionData, currentStepId, userResponse) {
  const validations = {}

  // 1. Input validation
  validations.sparsity = validateResponseSparsity(userResponse)
  validations.quality = validateResponseQuality(userResponse)
  validations.inputType = validateInputType(
    userResponse,
    sessionData.currentStep.expected_inputs[0]
  )

  // 2. Tag extraction validation (if tags were extracted)
  if (sessionData.lastExtractedTags) {
    validations.tagExtraction = validateTagExtraction(
      userResponse,
      sessionData.lastExtractedTags
    )
    validations.tagCategories = validateTagCategories(sessionData.lastExtractedTags)
  }

  // 3. Clustering validation (if clusters were generated)
  if (sessionData.lastGeneratedClusters) {
    validations.clusterQuality = validateClusterQuality(
      sessionData.lastGeneratedClusters
    )
  }

  // 4. Data integrity
  validations.dataIntegrity = validateDataConsistency(sessionData)

  // Aggregate results
  const criticalIssues = Object.values(validations)
    .flatMap(v => v.issues || [])
    .filter(i => i.severity === 'critical')

  const highIssues = Object.values(validations)
    .flatMap(v => v.issues || [])
    .filter(i => i.severity === 'high')

  const canProceed = criticalIssues.length === 0

  return {
    canProceed,
    validations,
    criticalIssues,
    highIssues,
    recommendation: criticalIssues.length > 0
      ? 'block_progression'
      : highIssues.length > 0
      ? 'warn_user'
      : 'proceed',
    summary: {
      total: Object.keys(validations).length,
      passed: Object.values(validations).filter(v => v.isValid).length,
      failed: Object.values(validations).filter(v => !v.isValid).length
    }
  }
}
```

---

## 7. User-Facing Validation Messages

### Validation Message Templates

```javascript
const validationMessages = {
  sparse_response: {
    user_message: (count, expected) =>
      `I see you shared ${count} point(s). Adding ${expected - count} more would help me identify clearer patterns!`,
    action: 'suggest_expand'
  },

  poor_quality: {
    user_message: () =>
      `Some responses are quite brief. A bit more context would help — try adding what/why/how details.`,
    action: 'suggest_expand'
  },

  clustering_low_quality: {
    user_message: (quality) =>
      `The clusters I generated have ${Math.round(quality * 100)}% confidence. Would you like to review and refine them?`,
    action: 'offer_refinement'
  },

  tag_extraction_failed: {
    user_message: () =>
      `Hmm, I had trouble extracting patterns from that response. Could you rephrase or add more detail?`,
    action: 'request_clarification'
  }
}

function getUserFeedback(validationResult) {
  const { recommendation, criticalIssues, highIssues } = validationResult

  if (recommendation === 'block_progression') {
    return {
      canProceed: false,
      message: criticalIssues[0]?.message || 'Please provide a valid response to continue',
      action: 'retry'
    }
  }

  if (recommendation === 'warn_user') {
    return {
      canProceed: true,
      message: highIssues[0]?.message || 'Your response could be improved for better results',
      action: 'offer_improvement'
    }
  }

  return {
    canProceed: true,
    message: null,
    action: 'proceed'
  }
}
```

---

## 8. Analytics & Monitoring

### Track Validation Events

```javascript
async function trackValidationEvent(userId, validationType, result) {
  await supabase.from('analytics_events').insert({
    user_id: userId,
    event_type: 'validation_check',
    event_data: {
      validation_type: validationType,
      is_valid: result.isValid,
      severity: result.severity,
      issues: result.issues,
      timestamp: new Date()
    }
  })
}

// Useful metrics:
// - % of validations that fail by type
// - Most common validation issues
// - User response rate after validation warnings
// - Correlation between validation quality and user satisfaction
```

---

## Implementation Checklist

- [ ] Implement all validation functions
- [ ] Integrate validation into step progression logic
- [ ] Create user-friendly error messages
- [ ] Add validation tracking to analytics
- [ ] Test all validation scenarios
- [ ] Add override mechanism for edge cases (admin only)
- [ ] Document validation thresholds and tune based on real data
- [ ] Create validation dashboard for monitoring

---

**Status:** Ready for implementation
**Priority:** High (addresses multiple uncertainty concerns)
**Estimated effort:** 3-4 days development + testing
