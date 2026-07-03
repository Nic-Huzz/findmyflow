# Nikigai Sparse Data Handling Specification

## Overview

When users provide minimal responses (fewer than expected bullet points), we need to:
1. Detect sparse responses
2. Encourage more detail with follow-up prompts
3. Explain how more data improves accuracy
4. Make it optional (not forced)
5. Gracefully handle persistent sparse data

---

## Detection Logic

### Threshold Definition

```javascript
function isResponseSparse(userResponse, expectedMin = 3) {
  const bulletPoints = extractBulletPoints(userResponse)

  return {
    isSparse: bulletPoints.length < expectedMin,
    bulletCount: bulletPoints.length,
    missingCount: Math.max(0, expectedMin - bulletPoints.length)
  }
}

function extractBulletPoints(text) {
  // Parse different bullet formats
  const patterns = [
    /^[•\-\*]\s+(.+)$/gm,  // • Bullet format
    /^\d+\.\s+(.+)$/gm,     // 1. Number format
    /^[a-z]\)\s+(.+)$/gm    // a) Letter format
  ]

  let bullets = []

  for (const pattern of patterns) {
    const matches = text.matchAll(pattern)
    bullets = Array.from(matches, m => m[1].trim())
    if (bullets.length > 0) break
  }

  // If no bullets found, treat each line as a potential bullet
  if (bullets.length === 0) {
    bullets = text.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
  }

  return bullets
}
```

---

## Follow-Up Prompt Strategy

### Approach

1. **Acknowledge what they shared** (validate their effort)
2. **Gently explain the benefit of more detail** (accuracy, richer insights)
3. **Offer encouragement with examples** (make it easy to add more)
4. **Make it optional** (allow them to continue if they want)

### Tone Guidelines (Alfred's Voice)

- Warm and encouraging, not demanding
- Explain the "why" (more data = better patterns)
- Show genuine curiosity (not judgment)
- Make it feel collaborative, not like homework

---

## Follow-Up Prompt Templates

### Template 1: Minimal Response (1 bullet)

```
I appreciate you sharing that — it's a start!

Here's the thing: the more details you share, the clearer your patterns become. Right now I have one piece of the puzzle, but a few more would help me see the fuller picture of what lights you up.

Could you add 2–4 more examples? Even small moments count.

Example format:
• [First activity/memory you already shared]
• [Second example — could be related or different]
• [Third example]

If you're stuck, think about:
• Different times or phases of life
• Things you did alone vs. with others
• Activities you'd do even if no one knew about them

Want to add a few more, or continue with what you have?
```

### Template 2: Moderate Response (2 bullets)

```
Great — I can see some threads starting to form.

Quick question: could you share 1–3 more examples?

The clustering works best with at least 3–5 data points because it helps me distinguish between:
• One-time interests vs. lifelong patterns
• Skills that overlap vs. those that are distinct
• What's core to you vs. what was circumstantial

Even brief additions help — think of any other moments, activities, or interests that feel similar (or different!) to what you shared.

Add more now, or continue?
```

### Template 3: Edge Case Response (Vague or Too Brief)

```
I notice your answers are pretty concise — which is totally fine!

But here's what would help: a bit more **context** or **specificity**.

Instead of:
• "Photography"

Try:
• "Photography — capturing candid moments at family gatherings"
• "Portrait photography — helping people see themselves beautifully"

The extra detail helps me understand:
• WHAT you love doing
• WHY it matters to you
• WHO it impacts

Would you mind expanding on what you shared, or adding a few more examples?
```

---

## Implementation in Question Flow

### Add Follow-Up Steps

For each question that expects 3–5 bullets, add a conditional follow-up step.

**Example: Step 2.0 (Childhood Hobbies)**

**Original:**
```json
{
  "id": "2.0",
  "step_order_index": 2,
  "assistant_prompt": "Let's start with **Childhood (Pre-school + Primary).**\n\nWhat did you *love doing most*? These can be games, hobbies, or activities that made you lose track of time.\n\nPlease share 3–5 short bullets (the more the better!).",
  "expected_inputs": ["text_list"],
  "store_as": "life_map.hobbies.childhood",
  "next_step_rules": [{ "on_success": "2.1" }]
}
```

**Enhanced with Sparse Data Handling:**
```json
{
  "id": "2.0",
  "step_order_index": 2,
  "assistant_prompt": "Let's start with **Childhood (Pre-school + Primary).**\n\nWhat did you *love doing most*? These can be games, hobbies, or activities that made you lose track of time.\n\nPlease share 3–5 short bullets (the more the better!).",
  "expected_inputs": ["text_list"],
  "store_as": "life_map.hobbies.childhood",
  "validation": {
    "check_sparse": true,
    "min_items": 3
  },
  "next_step_rules": [
    { "if": "sparse_response", "goto": "2.0.followup" },
    { "if": "adequate_response", "goto": "2.1" }
  ]
},
{
  "id": "2.0.followup",
  "step_type": "sparse_data_followup",
  "assistant_prompt": "I appreciate you sharing that — it's a start!\n\nHere's the thing: the more details you share, the clearer your patterns become. Right now I have {bullet_count} piece(s) of the puzzle, but a few more would help me see the fuller picture of what lights you up.\n\nCould you add {missing_count} more examples? Even small moments count.\n\nIf you're stuck, think about:\n• Different times or phases of childhood\n• Things you did alone vs. with friends\n• Activities you'd do for hours without getting bored\n\nAdd more now, or continue with what you have?",
  "expected_inputs": [
    { "type": "single_select", "options": ["Add more", "Continue as is"] }
  ],
  "next_step_rules": [
    { "if": "Add more", "goto": "2.0.expand" },
    { "if": "Continue as is", "goto": "2.1" }
  ]
},
{
  "id": "2.0.expand",
  "assistant_prompt": "Great! Add a few more childhood activities you loved:\n\n{previously_shared}\n\n• [Add 2–4 more]",
  "expected_inputs": ["text_list"],
  "merge_with": "life_map.hobbies.childhood",
  "next_step_rules": [{ "on_success": "2.1" }]
}
```

---

## Validation Function

```javascript
function validateResponse(stepData, userResponse) {
  const { validation } = stepData

  if (!validation || !validation.check_sparse) {
    return { isValid: true, nextStep: stepData.next_step_rules[0].goto }
  }

  const { isSparse, bulletCount, missingCount } = isResponseSparse(
    userResponse,
    validation.min_items
  )

  if (isSparse) {
    return {
      isValid: false,
      isSparse: true,
      bulletCount,
      missingCount,
      nextStep: stepData.next_step_rules.find(r => r.if === 'sparse_response').goto
    }
  }

  return {
    isValid: true,
    nextStep: stepData.next_step_rules.find(r => r.if === 'adequate_response').goto
  }
}
```

---

## Graceful Degradation

### If User Persists with Sparse Data

**Scenario:** User chooses "Continue as is" multiple times

**Response:**
```
No problem — I'll work with what you've shared.

Just so you know: with fewer data points, the clusters might be broader or less specific. But we can always refine them later as more patterns emerge!

Let's continue.
```

### Adjust Clustering Parameters

```javascript
async function adjustClusteringForSparseData(responses, defaultParams) {
  const totalTags = responses.flatMap(r => r.tags).length

  if (totalTags < 5) {
    // Very sparse data
    return {
      ...defaultParams,
      target_clusters_min: 1,
      target_clusters_max: 2,
      showWarning: "Limited data — clusters may be less specific",
      recommendRefinement: true
    }
  }

  if (totalTags < 10) {
    // Moderately sparse data
    return {
      ...defaultParams,
      target_clusters_min: 2,
      target_clusters_max: 3,
      showNote: "More responses in future sections will refine these clusters"
    }
  }

  return defaultParams
}
```

---

## Update All Flow Steps

### Steps That Need Sparse Data Handling

Add validation to these steps:

1. **2.0** — Childhood hobbies
2. **2.1** — High school hobbies
3. **2.2** — Current hobbies
4. **3.0** — Childhood proud moments
5. **3.1** — High school proud moments
6. **3.2** — Current proud moments
7. **4.0** — Life chapter titles
8. **4.1** — Growth and struggle per chapter
9. **5.0** — Role models
10. **6.0** — Learning topics
11. **7.0** — Work enjoyed
12. **7.1** — Impact created
13. **7.2** — Repeating skills
14. **8.0** — Future desires
15. **8.1** — Top 3 future pulls

---

## Analytics Tracking

### Track Sparse Response Patterns

```javascript
async function trackSparseResponseEvent(userId, stepId, bulletCount) {
  await supabase.from('analytics_events').insert({
    user_id: userId,
    event_type: 'sparse_response_detected',
    event_data: {
      step_id: stepId,
      bullet_count: bulletCount,
      followup_shown: true,
      timestamp: new Date()
    }
  })
}

async function trackFollowupChoice(userId, stepId, choice) {
  await supabase.from('analytics_events').insert({
    user_id: userId,
    event_type: 'sparse_followup_choice',
    event_data: {
      step_id: stepId,
      choice: choice, // "Add more" or "Continue as is"
      timestamp: new Date()
    }
  })
}
```

### Useful Metrics

- % of users who get sparse data prompts
- % who choose to add more vs. continue
- Average bullet count before vs. after follow-up
- Correlation between data richness and user satisfaction
- Steps where users most commonly provide sparse data

---

## Alfred's Educational Moments

### Explain the "Why" Naturally

Integrate brief explanations into the flow:

**After first sparse response:**
```
Quick context: The Nikigai process works by finding patterns across everything you share.

The more examples you give, the more accurately I can:
• Identify what's truly core to you (vs. one-time interests)
• Spot skills that repeat across different contexts
• Distinguish between different types of work you love

It's like... if you only tell me you like "music," I don't know if you love performing, creating, teaching, or just listening. But if you share 4–5 music-related activities, the pattern becomes clear!

Make sense?
```

**During clustering:**
```
✨ Based on your {bullet_count} responses, here are early **Skill clusters** emerging:

{skills.preview.from_hobbies}

💡 Pro tip: These clusters will get sharper and more nuanced as we gather more pieces throughout this journey. The more you share in upcoming sections, the clearer your unique patterns will become!

Do these early clusters feel like your natural way of showing up?
```

---

## Best Practices

### DO:
✅ Acknowledge what they shared first (validate)
✅ Explain the benefit of more detail (education)
✅ Provide examples to make it easier (guidance)
✅ Make it optional (respect their choice)
✅ Adjust clustering if data remains sparse (graceful degradation)

### DON'T:
❌ Make them feel inadequate or judged
❌ Force them to add more (mandatory fields)
❌ Show error messages (too harsh)
❌ Repeat the same prompt multiple times (annoying)
❌ Hide the reason (be transparent)

---

## Example Full Flow

```
Alfred: Let's start with **Childhood (Pre-school + Primary).**

What did you *love doing most*? These can be games, hobbies, or activities that made you lose track of time.

Please share 3–5 short bullets (the more the better!).

User:
• Drawing

Alfred: I appreciate you sharing that — it's a start!

Here's the thing: the more details you share, the clearer your patterns become. Right now I have 1 piece of the puzzle, but a few more would help me see the fuller picture of what lights you up.

Could you add 2–4 more examples? Even small moments count.

If you're stuck, think about:
• Different times or phases of childhood
• Things you did alone vs. with friends
• Activities you'd do for hours without getting bored

Add more now, or continue with what you have?

User: Add more

Alfred: Great! Add a few more childhood activities you loved:

• Drawing

• [Add 2–4 more]

User:
• Drawing — especially making up characters and stories
• Building elaborate forts with blankets and pillows
• Playing make-believe games where I'd create whole worlds
• Organizing "shows" for my family where I'd perform skits

Alfred: ✨ Beautiful! I can already see creative expression and world-building showing up.

Now think of **High School**...

[Continue to next question]
```

---

## Implementation Checklist

- [ ] Add validation logic to detect sparse responses
- [ ] Create follow-up prompt templates for all question types
- [ ] Add conditional routing in v2.2 flow JSON (sparse vs. adequate)
- [ ] Implement merge logic for expanded responses
- [ ] Create adjustment function for clustering parameters
- [ ] Add educational moments explaining why more data helps
- [ ] Add analytics tracking for sparse responses
- [ ] Test with various sparse data scenarios
- [ ] Ensure graceful degradation when data remains sparse
- [ ] Update Alfred system prompt with sparse data handling guidance

---

**Status:** Ready for implementation
**Priority:** High (addresses 60% confidence concern on sparse data)
**Estimated effort:** 2 days development + testing
